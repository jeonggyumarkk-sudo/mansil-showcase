# Database Schema & Performance Audit Report

**Project:** Mansil Platform
**Auditor:** database-auditor
**Date:** 2026-02-26
**Scope:** Prisma schema, seed data, query patterns, data integrity, performance
**Database:** SQLite via Prisma 5

---

## Executive Summary

The database layer has **3 CRITICAL**, **8 HIGH**, **8 MEDIUM**, and **5 LOW** severity findings. The most urgent issues are a SQL injection vulnerability in the map clustering query, the absence of any migration strategy, and inconsistent numeric types between models that will cause data truncation. SQLite is acceptable for early-stage MVP but will become a hard blocker for multi-user production use.

| Severity | PASS | FAIL | WARN | Total |
|----------|------|------|------|-------|
| CRITICAL | 0    | 3    | 0    | 3     |
| HIGH     | 0    | 5    | 3    | 8     |
| MEDIUM   | 0    | 3    | 5    | 8     |
| LOW      | 0    | 1    | 4    | 5     |
| INFO     | 5    | 0    | 0    | 5     |
| **Total**| **5**| **12**| **12**| **29**|

---

## CRITICAL Findings

### DB-001: SQL Injection via `$queryRawUnsafe` in Map Clustering
- **Severity:** CRITICAL
- **Status:** FAIL
- **File:** `apps/api/src/modules/properties/properties.service.ts:124-137`
- **Description:** The `getClusters` method builds a SQL query using JavaScript string interpolation (`${north}`, `${south}`, `${east}`, `${west}`, `${gridSize}`) and executes it with `$queryRawUnsafe`. Although the parameters are expected to be numbers from the request, there is no type validation at the service level. If a controller passes unsanitized input, an attacker can inject arbitrary SQL.
  ```typescript
  const query = `
    SELECT ... FROM Property
    WHERE lat <= ${north} AND lat >= ${south}
      AND lng <= ${east} AND lng >= ${west}
    GROUP BY cast(lat / ${gridSize} as int), cast(lng / ${gridSize} as int)
  `;
  const clusters: any[] = await this.prisma.$queryRawUnsafe(query);
  ```
- **Fix:** Use Prisma's `$queryRaw` with tagged template literals which automatically parameterize values:
  ```typescript
  const clusters = await this.prisma.$queryRaw`
    SELECT CAST(count(*) AS INTEGER) as count, avg(lat) as lat, avg(lng) as lng, min(deposit) as minPrice
    FROM Property
    WHERE lat <= ${north} AND lat >= ${south}
      AND lng <= ${east} AND lng >= ${west}
      AND status = 'AVAILABLE'
    GROUP BY cast(lat / ${gridSize} as int), cast(lng / ${gridSize} as int)
  `;
  ```

### DB-002: No Migration Files or Migration Strategy
- **Severity:** CRITICAL
- **Status:** FAIL
- **File:** `packages/database/prisma/` (no `migrations/` directory)
- **Description:** There are zero migration files in the project. This means the database is being managed with `prisma db push` (or manual recreation), which is destructive and cannot be used in production. There is no way to:
  - Track schema changes over time
  - Roll back a bad schema change
  - Apply incremental changes to a production database
  - Coordinate schema changes across developers
- **Fix:** Initialize migrations immediately:
  ```bash
  cd packages/database
  npx prisma migrate dev --name init
  ```
  Add a migration workflow to CI/CD. Never use `prisma db push` in production.

### DB-003: Inconsistent Int vs BigInt for Financial Fields
- **Severity:** CRITICAL
- **Status:** FAIL
- **File:** `packages/database/prisma/schema.prisma:63-66` (Property) vs `:155-158` (Contract)
- **Description:** `Property` uses `Int` for `deposit`, `monthlyRent`, `maintenanceFee`, and `salePrice`, while `Contract` uses `BigInt` for the same conceptual fields. JavaScript `Int` in SQLite is a 32-bit signed integer (max ~2.1 billion). Korean Won values for property sales can exceed this limit (e.g., a 500M KRW apartment = 500,000,000 fits, but a 3B KRW property = 3,000,000,000 overflows). More importantly, comparing or joining these fields between tables will produce incorrect results due to type mismatch.
- **Fix:** Standardize all financial fields to `BigInt` across all models, or if values will always be below 2B KRW, standardize on `Int`. Given that real estate sale prices in Korea routinely exceed 2B KRW, `BigInt` is the correct choice for all monetary fields.

---

## HIGH Findings

### DB-004: Missing Cascade Delete on Contract Relations
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `packages/database/prisma/schema.prisma:141-148`
- **Description:** The `Contract` model references `Property`, `Customer`, and `User` but none have `onDelete` specified. Prisma defaults to `onDelete: SetNull` for optional relations and throws errors for required relations. Since `propertyId`, `customerId`, and `agentId` are all required (non-optional `String`), attempting to delete a Property, Customer, or User that has Contracts will throw a foreign key constraint error. This is actually a safety feature — but it should be **explicit** and the application should handle the error gracefully.
- **Fix:** Add explicit `onDelete` behavior:
  ```prisma
  property   Property @relation(fields: [propertyId], references: [id], onDelete: Restrict)
  customer   Customer @relation(fields: [customerId], references: [id], onDelete: Restrict)
  agent      User     @relation(fields: [agentId], references: [id], onDelete: Restrict)
  ```
  And implement soft-delete (see DB-014) instead of hard-delete for these entities.

### DB-005: Missing Cascade Delete on User-Owned Entities
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `packages/database/prisma/schema.prisma:48` (ClientRequest), `:83` (Property), `:126` (Customer), `:230` (Post)
- **Description:** `ClientRequest`, `Property`, `Customer`, and `Post` all have required `agentId`/`authorId` foreign keys to `User` but no explicit `onDelete` behavior. Deleting a User will fail with a constraint error. Similarly, `Comment.authorId` (line 249) has no `onDelete` — if an author is deleted, their comments become orphaned references.
- **Fix:** Define explicit cascade/restrict policies for all relations. For `Comment` author, consider `onDelete: SetNull` (make `authorId` optional, show "Deleted User") or `onDelete: Cascade`.

### DB-006: Seed Data Contains Plaintext Password
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `packages/database/prisma/seed.ts:16`
- **Description:** The seed file stores password as plaintext `'password123'`. While the `auth.service.ts` correctly hashes passwords on registration with bcrypt, the seed file bypasses this. The seeded user's password is stored unhashed in the database, meaning `bcrypt.compare()` in `validateUser()` will always fail for this user (the comparison expects a bcrypt hash). This renders the demo account non-functional via normal login flow.
- **Fix:** Hash the password in the seed file:
  ```typescript
  import * as bcrypt from 'bcrypt';
  const hashedPassword = await bcrypt.hash('password123', 10);
  // ...
  create: { password: hashedPassword, ... }
  ```

### DB-007: Property Create Hardcodes Demo Agent Fallback
- **Severity:** HIGH
- **Status:** WARN
- **File:** `apps/api/src/modules/properties/properties.service.ts:36-44`
- **Description:** The `create` method in `PropertiesService` uses `connectOrCreate` with hardcoded `demo@mansil.com` and plaintext password `'hashed_password'`. This means:
  1. All properties are assigned to the demo agent regardless of the authenticated user
  2. If the demo agent doesn't exist, a new user is created with a literal string `'hashed_password'` as the password — which is not actually hashed
- **Fix:** Accept `agentId` from the authenticated user's JWT token and use `connect: { id: agentId }` instead of `connectOrCreate`.

### DB-008: No Authorization Check on Data Access
- **Severity:** HIGH
- **Status:** WARN
- **File:** `apps/api/src/modules/contracts/contracts.service.ts:28-36`, `apps/api/src/modules/customers/customers.service.ts:39-42`
- **Description:** `findOne`, `update`, and `remove` methods across services look up records by ID only, without verifying that the requesting user owns the record. Any authenticated user can read/modify/delete any other user's contracts, customers, or properties by guessing or enumerating UUIDs.
- **Fix:** Add `agentId` to the `where` clause:
  ```typescript
  findOne(id: string, agentId: string) {
    return this.prisma.contract.findFirst({
      where: { id, agentId },
    });
  }
  ```

### DB-009: ClientRequest Missing Index on agentId
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `packages/database/prisma/schema.prisma:31-52`
- **Description:** `ClientRequest` has `agentId` as a foreign key but no `@@index([agentId])`. The `RequestsService.findAll()` currently fetches all requests without filtering by agent (another issue), but once fixed, every query will require a full table scan on `agentId`.
- **Fix:** Add `@@index([agentId])` to the `ClientRequest` model.

### DB-010: RequestsService.findAll() Returns All Agents' Data
- **Severity:** HIGH
- **Status:** WARN
- **File:** `apps/api/src/modules/requests/requests.service.ts:21-25`
- **Description:** `findAll()` retrieves all client requests across all agents without any filtering. This is a data leak — Agent A can see Agent B's client requests.
- **Fix:** Filter by `agentId`:
  ```typescript
  async findAll(agentId: string): Promise<ClientRequest[]> {
    return this.prisma.clientRequest.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' }
    });
  }
  ```

---

## MEDIUM Findings

### DB-011: Customer Preferences Stored as JSON String
- **Severity:** MEDIUM
- **Status:** FAIL
- **File:** `packages/database/prisma/schema.prisma:119`
- **Description:** `Customer.preferences` is a `String?` that stores JSON-encoded data. This means:
  - No schema validation on the JSON structure
  - Cannot query by individual preference fields (e.g., "find all customers who prefer 2+ bedrooms")
  - Risk of malformed JSON being stored
  - SQLite has no native JSON column type, but Prisma's `Json` type would at least validate at the application level
- **Fix:** Either:
  1. Use Prisma's `Json` type (if staying with SQLite): `preferences Json?`
  2. Break out into a related `CustomerPreference` model with typed fields (better for querying)

### DB-012: ClientRequest Uses Comma-Separated Strings for Multi-Value Fields
- **Severity:** MEDIUM
- **Status:** FAIL
- **File:** `packages/database/prisma/schema.prisma:43-44`
- **Description:** `preferredLocations` and `preferredTypes` are stored as comma-separated strings (e.g., `"궁동,장대동"`). This violates first normal form (1NF) and makes querying cumbersome — the service code manually splits these strings.
- **Fix:** Create junction tables:
  ```prisma
  model ClientRequestLocation {
    id        String        @id @default(uuid())
    location  String
    requestId String
    request   ClientRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)
    @@index([requestId])
  }
  ```

### DB-013: Missing Indexes for Common Query Patterns
- **Severity:** MEDIUM
- **Status:** FAIL
- **File:** `packages/database/prisma/schema.prisma` (multiple models)
- **Description:** Several query patterns observed in services lack supporting indexes:
  | Model | Missing Index | Query Pattern | File |
  |-------|--------------|---------------|------|
  | `Contract` | `@@index([status])` | Filtering by status (future need) | `contracts.service.ts` |
  | `Contract` | `@@index([endDate])` | Schedule events query `endDate` | `schedule.service.ts:23` |
  | `Customer` | `@@index([nextFollowupDate])` | Schedule query filters `nextFollowupDate: { not: null }` | `schedule.service.ts:15` |
  | `LedgerTransaction` | `@@index([agentId, date])` | Composite filter by agent + date range | `ledger.service.ts:38-45` |
  | `RealTransaction` | `@@index([type])` | Likely filtered by transaction type | schema:211 |
  | `Property` | `@@index([agentId])` | Filtered by agentId in multiple services | `properties.service.ts` |
- **Fix:** Add the composite and single-column indexes listed above.

### DB-014: No Soft Delete Pattern
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** All service files
- **Description:** All delete operations are hard deletes (`prisma.customer.delete`, `prisma.property.delete`). For a real estate management platform, deleting a customer or contract permanently destroys business records. Contracts especially have legal significance and should never be permanently deleted.
- **Fix:** Add a `deletedAt DateTime?` field to `Customer`, `Contract`, `Property`, and `User`. Implement Prisma middleware or a custom `softDelete` method:
  ```prisma
  model Customer {
    deletedAt DateTime?
    @@index([deletedAt])
  }
  ```
  Then filter `where: { deletedAt: null }` in all queries.

### DB-015: No Audit Trail / Modification Tracking
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** `packages/database/prisma/schema.prisma` (all models)
- **Description:** While `createdAt` and `updatedAt` exist on most models (except `PropertyImage` and `RealTransaction`), there is no tracking of **who** made changes. For a multi-agent real estate platform, knowing which agent modified a contract or customer record is important for accountability and dispute resolution.
- **Fix:** For critical models (`Contract`, `Property`, `Customer`), add:
  ```prisma
  model AuditLog {
    id         String   @id @default(uuid())
    entityType String   // "Contract", "Property", etc.
    entityId   String
    action     String   // "CREATE", "UPDATE", "DELETE"
    changes    String?  // JSON diff
    userId     String
    user       User     @relation(fields: [userId], references: [id])
    createdAt  DateTime @default(now())
    @@index([entityType, entityId])
    @@index([userId])
  }
  ```

### DB-016: PropertyImage Missing Timestamps
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** `packages/database/prisma/schema.prisma:100-105`
- **Description:** `PropertyImage` has no `createdAt` or `updatedAt` fields. This makes it impossible to determine when images were uploaded or last modified.
- **Fix:** Add `createdAt DateTime @default(now())` and optionally `updatedAt DateTime @updatedAt`.

### DB-017: RealTransaction Missing updatedAt
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** `packages/database/prisma/schema.prisma:203-220`
- **Description:** `RealTransaction` only has `createdAt` but no `updatedAt`. If transaction records are corrected post-import, there's no way to know when.
- **Fix:** Add `updatedAt DateTime @updatedAt`.

### DB-018: String Enums Instead of Prisma Enums
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** `packages/database/prisma/schema.prisma` (multiple fields)
- **Description:** Numerous fields use `String` with comments documenting valid values instead of Prisma `enum` types:
  - `User.role`: `"ADMIN" | "AGENT" | "LANDLORD" | "TENANT"`
  - `Property.type`: `"ONE_ROOM" | "TWO_ROOM" | ...`
  - `Property.transactionType`: `"MONTHLY" | "JEONSE" | ...`
  - `Property.status`: `"AVAILABLE" | "CONTRACT_PENDING" | ...`
  - `Contract.type`: `"RENT" | "JEONSE" | "SALE"`
  - `Contract.status`: `"DRAFT" | "SIGNED" | "COMPLETED" | "CANCELLED"`
  - `LedgerTransaction.type`: `"INCOME" | "EXPENSE"`
  - `Customer.status`: `"ACTIVE" | "CONTRACTED" | "INACTIVE"`
  - `Customer.priority`: `"HOT" | "WARM" | "COLD"`
  - `Post.category`: `"QNA" | "NAENWAYO" | "NOTICE" | "FREE"`

  **Note:** SQLite does not enforce `CHECK` constraints from Prisma enums, so enums provide **application-level** validation only. However, this is still valuable as Prisma will reject invalid values before they reach the database.
- **Fix:** Define Prisma enums. Example:
  ```prisma
  enum Role { ADMIN AGENT LANDLORD TENANT }
  model User {
    role Role @default(AGENT)
  }
  ```

---

## LOW Findings

### DB-019: Customer Phone Not Unique Per Agent
- **Severity:** LOW
- **Status:** WARN
- **File:** `packages/database/prisma/schema.prisma:111`
- **Description:** `Customer.phone` is an optional `String?` with no uniqueness constraint. Duplicate customers with the same phone number can be created by the same agent. While phone numbers may not be globally unique (different agents may have the same customer), a composite unique constraint `@@unique([agentId, phone])` would prevent accidental duplicates within an agent's customer list.
- **Fix:** Add `@@unique([agentId, phone])` (after making `phone` required).

### DB-020: Customer Phone Should Be Required
- **Severity:** LOW
- **Status:** WARN
- **File:** `packages/database/prisma/schema.prisma:111`
- **Description:** In a Korean real estate context, phone number is the primary contact method and effectively required for all customer interactions. Having it as optional (`String?`) allows creating customer records without contact information.
- **Fix:** Change to `phone String`.

### DB-021: Property.area Uses Float Without Unit Documentation
- **Severity:** LOW
- **Status:** WARN
- **File:** `packages/database/prisma/schema.prisma:69`
- **Description:** `Property.area` is `Float` with no indication of unit. Seed data uses `7`, `12`, `8` which appear to be Korean pyeong (평). If some entries use square meters and others use pyeong, data becomes inconsistent. The field name should encode the unit or a comment should clarify.
- **Fix:** Rename to `areaPyeong Float` or add a unit field, or standardize on square meters with conversion in the application layer.

### DB-022: LedgerTransaction BigInt Aggregation Done in JavaScript
- **Severity:** LOW
- **Status:** FAIL
- **File:** `apps/api/src/modules/ledger/ledger.service.ts:31-61`
- **Description:** `getMonthlyStats` fetches all transactions for a month and sums them in JavaScript using `Number(t.amount)`. For large BigInt values, converting to JavaScript `Number` loses precision beyond `Number.MAX_SAFE_INTEGER` (9,007,199,254,740,991). While individual Korean Won amounts are unlikely to exceed this, a sum of many transactions theoretically could. Additionally, fetching all rows to sum in JS is inefficient compared to a database aggregation.
- **Fix:** Use Prisma's `aggregate` or a raw query:
  ```typescript
  const result = await this.prisma.ledgerTransaction.aggregate({
    where: { agentId, date: { gte: start, lte: end }, type: 'INCOME' },
    _sum: { amount: true }
  });
  ```

### DB-023: Seed Data Only Covers 2 of 10 Models
- **Severity:** LOW
- **Status:** WARN
- **File:** `packages/database/prisma/seed.ts`
- **Description:** The seed file only creates 1 `User` and 3 `Property` records. Models with no seed data:
  - `Customer` (0 records)
  - `Contract` (0 records)
  - `LedgerTransaction` (0 records)
  - `ClientRequest` (0 records)
  - `RealTransaction` (0 records)
  - `Post` (0 records)
  - `Comment` (0 records)
  - `PropertyImage` (0 records)

  This makes it impossible to demo or test most of the application features after a fresh database setup.
- **Fix:** Add comprehensive seed data for all models with realistic Korean real estate data.

---

## INFO Findings

### DB-024: SQLite Production Limitations
- **Severity:** INFO
- **Status:** PASS (for MVP)
- **File:** `packages/database/prisma/schema.prisma:8-10`
- **Description:** SQLite is used as the production database. Known limitations for this platform:
  1. **Concurrent writes:** SQLite uses file-level locking. Only one writer at a time. Multiple agents using the platform simultaneously will experience write contention.
  2. **No `ALTER COLUMN`:** Schema changes that modify column types require creating a new table, copying data, and dropping the old table. Prisma handles this but it's slow for large tables.
  3. **No built-in user/role management:** All access goes through the application.
  4. **File-based:** No network access — the API server must be on the same machine as the database file. Horizontal scaling is impossible.
  5. **No built-in JSON operators:** Limited ability to query JSON fields (affects `Customer.preferences`).
  6. **Backup:** Requires file-system level backup; no `pg_dump` equivalent for consistent snapshots during writes.
- **Fix:** For MVP/single-agent use, SQLite is acceptable. Plan migration to PostgreSQL before:
  - Supporting >1 concurrent agent
  - Database exceeds ~1GB
  - Needing full-text search
  - Requiring backup/restore without downtime

### DB-025: UUID Primary Keys
- **Severity:** INFO
- **Status:** PASS
- **File:** `packages/database/prisma/schema.prisma` (all models)
- **Description:** All models use `String @id @default(uuid())` for primary keys. UUIDs are good for distributed systems and prevent ID enumeration attacks, but they are larger (36 bytes vs 4-8 bytes for integers) and have worse index locality in B-tree indexes compared to auto-incrementing integers. For SQLite this is a minor concern; for PostgreSQL it would benefit from `uuid_generate_v4()` native function.
- **Fix:** No action needed for MVP. If migrating to PostgreSQL, consider `@default(dbgenerated("gen_random_uuid()"))`.

### DB-026: Property Model Has Good Index Coverage
- **Severity:** INFO
- **Status:** PASS
- **File:** `packages/database/prisma/schema.prisma:91-97`
- **Description:** The `Property` model has well-designed indexes covering the main query patterns:
  - `@@index([status])` — filter by availability
  - `@@index([type])` — filter by property type
  - `@@index([transactionType])` — filter by transaction type
  - `@@index([deposit])` — price range queries
  - `@@index([monthlyRent])` — rent range queries
  - `@@index([deposit, monthlyRent])` — composite price filter
  - `@@index([lat, lng])` — geospatial queries
- **Fix:** None needed. Well done.

### DB-027: Cascade Delete Correctly Applied to PropertyImage and Comment
- **Severity:** INFO
- **Status:** PASS
- **File:** `packages/database/prisma/schema.prisma:104,246`
- **Description:** `PropertyImage` cascades on Property delete and `Comment` cascades on Post delete. These are correct behaviors — deleting a property should delete its images, and deleting a post should delete its comments.
- **Fix:** None needed.

### DB-028: createdAt/updatedAt Present on Most Models
- **Severity:** INFO
- **Status:** PASS
- **File:** `packages/database/prisma/schema.prisma`
- **Description:** 8 of 10 models have both `createdAt` and `updatedAt` fields. Only `PropertyImage` and `RealTransaction` are missing these (addressed in DB-016 and DB-017).
- **Fix:** See DB-016 and DB-017.

---

## Summary of Required Actions

### Immediate (Before Any Production Use)
| ID | Action | Effort |
|----|--------|--------|
| DB-001 | Fix SQL injection in getClusters | 30 min |
| DB-002 | Initialize Prisma migrations | 1 hour |
| DB-003 | Standardize Int/BigInt for financial fields | 2 hours |
| DB-006 | Hash password in seed file | 15 min |
| DB-007 | Fix hardcoded demo agent in property create | 30 min |
| DB-008 | Add ownership checks to all data access | 2 hours |
| DB-010 | Fix RequestsService.findAll data leak | 15 min |

### Short-Term (Before Multi-User Production)
| ID | Action | Effort |
|----|--------|--------|
| DB-004 | Add explicit onDelete to Contract relations | 30 min |
| DB-005 | Add explicit onDelete to all User relations | 30 min |
| DB-009 | Add missing index on ClientRequest.agentId | 5 min |
| DB-013 | Add missing indexes for query patterns | 30 min |
| DB-014 | Implement soft delete for critical models | 3 hours |
| DB-018 | Convert string enums to Prisma enums | 2 hours |

### Medium-Term (Before Scale)
| ID | Action | Effort |
|----|--------|--------|
| DB-011 | Fix Customer preferences storage | 2 hours |
| DB-012 | Normalize comma-separated fields | 3 hours |
| DB-015 | Implement audit trail | 4 hours |
| DB-023 | Expand seed data coverage | 3 hours |
| DB-024 | Plan PostgreSQL migration | 1-2 days |

---

*End of Database Audit Report*
