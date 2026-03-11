# API Quality & Correctness Audit Report

**Project:** Mansil Platform (`apps/api`)
**Date:** 2026-02-26
**Auditor:** api-quality-auditor
**Scope:** All controllers, services, DTOs, modules, Prisma service, error handling, API consistency, N+1 queries, module structure, missing CRUD operations, real-transaction module

---

## Executive Summary

The Mansil Platform API (`apps/api`) is a NestJS 10 application backed by Prisma 5 with SQLite. The audit reviewed **8 modules** (auth, properties, customers, contracts, ledger, schedule, requests, community) plus the standalone `real-transaction` module. **38 findings** were identified across all severity levels.

**Critical findings** include a SQL injection vulnerability in the map clustering endpoint, missing authentication on 3 controllers (properties, requests, real-transactions), and a hardcoded JWT secret. **High-severity issues** include missing DTOs across most endpoints, unsafe spread of user input into Prisma, missing authorization ownership checks, and password hash leakage in the registration flow.

| Severity | Count |
|----------|-------|
| CRITICAL | 4     |
| HIGH     | 12    |
| MEDIUM   | 13    |
| LOW      | 7     |
| INFO     | 2     |

---

## Findings

### API-001: SQL Injection in Map Clustering Endpoint
- **Severity:** CRITICAL
- **Status:** FAIL
- **File:** `apps/api/src/modules/properties/properties.service.ts:124-137`
- **Description:** The `getClusters()` method uses `$queryRawUnsafe()` with string interpolation of user-supplied query parameters (`north`, `south`, `east`, `west`, `zoom`). These values come directly from `@Query()` parameters in the controller with no sanitization. An attacker can inject arbitrary SQL.
  ```typescript
  const query = `
    SELECT ... FROM Property
    WHERE lat <= ${north} AND lat >= ${south}
      AND lng <= ${east} AND lng >= ${west}
    GROUP BY cast(lat / ${gridSize} as int), cast(lng / ${gridSize} as int)
  `;
  const clusters: any[] = await this.prisma.$queryRawUnsafe(query);
  ```
- **Fix:** Use `$queryRaw` with Prisma's tagged template literal (parameterized query) instead of `$queryRawUnsafe` with string interpolation:
  ```typescript
  const clusters = await this.prisma.$queryRaw`
    SELECT ... FROM Property
    WHERE lat <= ${north} AND lat >= ${south} ...
  `;
  ```

---

### API-002: Missing Authentication on Properties Controller
- **Severity:** CRITICAL
- **Status:** FAIL
- **File:** `apps/api/src/modules/properties/properties.controller.ts:6`
- **Description:** The `PropertiesController` has no `@UseGuards(JwtAuthGuard)` decorator. All CRUD operations on properties (create, update, delete) are publicly accessible without authentication. Any anonymous user can create, modify, or delete property listings.
- **Fix:** Add `@UseGuards(JwtAuthGuard)` at the controller level. If the `GET` endpoints (list/detail) should be public, apply the guard at the method level to `@Post`, `@Patch`, `@Delete` only.

---

### API-003: Missing Authentication on Requests Controller
- **Severity:** CRITICAL
- **Status:** FAIL
- **File:** `apps/api/src/modules/requests/requests.controller.ts:5`
- **Description:** The `RequestsController` has no authentication guard. Client requests containing personal data (clientName, clientPhone) can be listed and created by anyone.
- **Fix:** Add `@UseGuards(JwtAuthGuard)` and scope data to the authenticated agent.

---

### API-004: Missing Authentication on Real-Transaction Controller (incl. Seed Endpoint)
- **Severity:** CRITICAL
- **Status:** FAIL
- **File:** `apps/api/src/real-transaction/real-transaction.controller.ts:5`
- **Description:** The `RealTransactionController` has no authentication guard. Critically, the `POST /real-transactions/seed` endpoint is publicly accessible, allowing anyone to trigger database seeding of 50 mock records. This is a data integrity and availability risk.
- **Fix:** Add `@UseGuards(JwtAuthGuard)` and restrict the seed endpoint to admin-only or remove it from production builds entirely.

---

### API-005: Hardcoded JWT Secret in Source Code
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/api/src/modules/auth/constants.ts:2`
- **Description:** The JWT signing secret is hardcoded as `'mansil-secret-key-change-in-prod'`. This secret is committed to version control and cannot be rotated without a code change and redeployment. Any token signed with this secret is valid across all environments.
- **Fix:** Read from environment variable: `process.env.JWT_SECRET` with a startup check that it's set. Use `ConfigModule`/`ConfigService` from `@nestjs/config`.

---

### API-006: Auth Login Returns HTTP 200 on Invalid Credentials
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/api/src/modules/auth/auth.controller.ts:12-14`
- **Description:** When credentials are invalid, the controller returns `{ status: 401, message: 'Invalid credentials' }` with HTTP status **200 OK**. Frontend clients and API consumers cannot rely on HTTP status codes.
  ```typescript
  if (!user) {
      return { status: 401, message: 'Invalid credentials' };
  }
  ```
- **Fix:** Throw `UnauthorizedException('Invalid credentials')` instead of returning a plain object.

---

### API-007: No DTOs for Auth Login/Register Endpoints
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/api/src/modules/auth/auth.controller.ts:10,19`
- **Description:** Both `login` and `register` use `Record<string, any>` as DTO type. No validation occurs on `email`, `password`, or `name` fields. The global `ValidationPipe` has no effect since there are no class-validator decorators.
- **Fix:** Create `LoginDto` (`@IsEmail() email`, `@IsString() @MinLength(8) password`) and `RegisterDto` (adds `@IsString() name`).

---

### API-008: No DTO for Properties Create/Update
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/api/src/modules/properties/properties.controller.ts:27,69`
- **Description:** Both `create` and `update` use `any` as the body type. No validation of property type, transaction type, numeric fields, coordinates, etc. despite these being critical business data.
- **Fix:** Create `CreatePropertyDto` with proper validators (`@IsEnum(PropertyType)`, `@IsNumber()`, `@IsString()`, etc.) and `UpdatePropertyDto` extending `PartialType(CreatePropertyDto)`.

---

### API-009: No DTO for Contracts Create/Update
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/api/src/modules/contracts/contracts.controller.ts:12,28`
- **Description:** Contract create and update use `any` as body type. No validation of contract type, status, financial fields, or date fields.
- **Fix:** Create `CreateContractDto` and `UpdateContractDto` with proper decorators.

---

### API-010: No DTO for Requests Create
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/api/src/modules/requests/requests.controller.ts:9`
- **Description:** Request creation uses `any` with no validation. Client name, phone, and financial criteria are unvalidated.
- **Fix:** Create `CreateRequestDto` with proper validators.

---

### API-011: Unsafe Spread of User Input into Prisma (Contracts)
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/api/src/modules/contracts/contracts.service.ts:9-13`
- **Description:** The contracts service spreads the entire request body directly into Prisma's `create`:
  ```typescript
  return this.prisma.contract.create({
      data: { ...data, agentId }
  });
  ```
  Since there is no DTO, an attacker can inject any Prisma field (e.g., `id`, `createdAt`, `status`) to override defaults or set arbitrary values. Similar issue exists in `update` (line 39).
- **Fix:** Explicitly map allowed fields (like the customers service does) or create a proper DTO with `whitelist: true`.

---

### API-012: Password Hash Leaked in Register Response
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/api/src/modules/auth/auth.service.ts:43-52`
- **Description:** After `prisma.user.create()`, the full user object (including `password` hash) is passed to `this.login(user)`. While `login()` only puts `id`, `email`, `name`, `role` in the response body, the JWT payload creation at line 24 receives the full object. If the response shape of `login()` ever changes, the hash could leak. The `validateUser` method properly destructures out `password` (line 17), but `register` does not.
- **Fix:** Destructure out `password` from the created user before passing to `login()`:
  ```typescript
  const { password: _, ...userWithoutPassword } = user;
  return this.login(userWithoutPassword);
  ```

---

### API-013: Hardcoded Demo Agent in Properties Service
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/api/src/modules/properties/properties.service.ts:36-44`
- **Description:** Property creation always connects/creates a hardcoded demo agent (`demo@mansil.com`) with plaintext password `'hashed_password'`. This bypasses authentication and creates an insecure user record.
  ```typescript
  agent: {
      connectOrCreate: {
          where: { email: 'demo@mansil.com' },
          create: { email: 'demo@mansil.com', name: 'Demo Agent', password: 'hashed_password', role: 'AGENT' }
      }
  }
  ```
- **Fix:** Use the authenticated user's ID (from JWT) to associate properties with the actual agent. Remove the hardcoded demo agent.

---

### API-014: Hardcoded Demo Agent in Requests Service
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/api/src/modules/requests/requests.service.ts:11-17`
- **Description:** All client requests are connected to `demo@mansil.com` instead of the authenticated user.
- **Fix:** Accept `agentId` from the authenticated user context (like other services do).

---

### API-015: No findOne 404 Handling Across Controllers
- **Severity:** MEDIUM
- **Status:** FAIL
- **File:** Multiple controllers
- **Description:** All `findOne` methods across the API return `null` when a record is not found, resulting in an HTTP 200 with `null` body instead of a proper 404:
  - `properties.controller.ts:64` → `properties.service.ts:82` returns `null`
  - `customers.controller.ts:25` → `customers.service.ts:38` returns `null`
  - `contracts.controller.ts:23` → `contracts.service.ts:29` returns `null`
  - `requests.controller.ts:18` → `requests.service.ts:27` returns `null`
  - `posts.controller.ts:23` → `posts.service.ts:30` returns `null`
- **Fix:** Throw `NotFoundException` when `findUnique` returns null, either in the service or via a reusable interceptor.

---

### API-016: No Authorization Ownership Check on Resource Access
- **Severity:** MEDIUM
- **Status:** FAIL
- **File:** Multiple controllers
- **Description:** Even where `JwtAuthGuard` is used, the `findOne`, `update`, and `delete` endpoints do not verify that the authenticated user owns the resource:
  - `customers.controller.ts:25` — `findOne` doesn't check `agentId`
  - `customers.controller.ts:29` — `update` doesn't check `agentId`
  - `customers.controller.ts:34` — `delete` doesn't check `agentId`
  - `contracts.controller.ts:23` — `findOne` doesn't check `agentId`
  - `contracts.controller.ts:28` — `update` doesn't check `agentId`

  Any authenticated user can read/modify/delete another agent's customers and contracts by guessing the UUID.
- **Fix:** Add ownership verification in services (e.g., `where: { id, agentId }`) or use a guard/interceptor.

---

### API-017: No Global Exception Filter — Stack Traces May Leak
- **Severity:** MEDIUM
- **Status:** FAIL
- **File:** `apps/api/src/main.ts`
- **Description:** No custom exception filter is registered. NestJS's default exception filter returns stack traces for unhandled errors in non-production mode. There's no `NODE_ENV` check, so development errors could leak to clients. Additionally, `properties.service.ts:57-58` explicitly includes raw error message and details in HTTP responses.
- **Fix:** Implement a global `AllExceptionsFilter` that sanitizes error responses in production. Remove `details: error` from HttpException payloads.

---

### API-018: Error Details Leaked in Properties Service
- **Severity:** MEDIUM
- **Status:** FAIL
- **File:** `apps/api/src/modules/properties/properties.service.ts:54-59`
- **Description:** The error response includes raw error `message` and full `details` object:
  ```typescript
  throw new HttpException({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Failed to create property',
      message: (error as any).message || String(error),
      details: error // Full error object leaked
  }, HttpStatus.INTERNAL_SERVER_ERROR);
  ```
- **Fix:** Log the error server-side, return only a generic message to the client.

---

### API-019: PrismaService Instantiated in Every Module (No Shared Module)
- **Severity:** MEDIUM
- **Status:** FAIL
- **File:** All `*.module.ts` files
- **Description:** Each of the 9 modules independently registers `PrismaService` as a provider, creating up to 9 separate `PrismaClient` instances with 9 separate database connections. For SQLite (single-writer), this is especially problematic as it can cause `SQLITE_BUSY` errors under concurrent writes.
  - `auth.module.ts:19`, `properties.module.ts:8`, `customers.module.ts:8`, `contracts.module.ts:8`, `ledger.module.ts:8`, `schedule.module.ts:8`, `requests.module.ts:8`, `community.module.ts:10`, `real-transaction.module.ts:8`
- **Fix:** Create a `DatabaseModule` that provides and exports `PrismaService` as a singleton:
  ```typescript
  @Global()
  @Module({ providers: [PrismaService], exports: [PrismaService] })
  export class DatabaseModule {}
  ```
  Import it once in `AppModule` and remove `PrismaService` from all other modules' providers.

---

### API-020: Wrong Exception Type for Duplicate User Registration
- **Severity:** MEDIUM
- **Status:** FAIL
- **File:** `apps/api/src/modules/auth/auth.service.ts:39`
- **Description:** When a user already exists, `UnauthorizedException` (401) is thrown. This is semantically incorrect — the user is not failing authentication, they're attempting a duplicate creation. HTTP 401 is for failed authentication.
- **Fix:** Use `ConflictException` (409) instead: `throw new ConflictException('User already exists')`.

---

### API-021: Missing Delete Endpoint for Contracts
- **Severity:** MEDIUM
- **Status:** FAIL
- **File:** `apps/api/src/modules/contracts/contracts.controller.ts`
- **Description:** The contracts controller has Create, Read, Update but no Delete endpoint. Contracts cannot be removed via the API.
- **Fix:** Add a `@Delete(':id')` endpoint if business requirements allow contract deletion (or a soft-delete via status change to 'CANCELLED').

---

### API-022: Missing Update/Delete for Ledger Entries
- **Severity:** MEDIUM
- **Status:** FAIL
- **File:** `apps/api/src/modules/ledger/ledger.controller.ts`
- **Description:** The ledger module only supports Create, List, and Stats. There are no Update or Delete endpoints. Erroneous financial entries cannot be corrected or removed via the API.
- **Fix:** Add `@Patch(':id')` and `@Delete(':id')` endpoints with proper ownership checks.

---

### API-023: Missing Update/Delete for Posts
- **Severity:** MEDIUM
- **Status:** FAIL
- **File:** `apps/api/src/modules/community/posts.controller.ts`
- **Description:** The posts controller only supports Create, FindAll, and FindOne. Post authors cannot edit or delete their posts.
- **Fix:** Add `@Patch(':id')` and `@Delete(':id')` endpoints with author ownership verification.

---

### API-024: Missing Read/Update/Delete for Comments
- **Severity:** MEDIUM
- **Status:** FAIL
- **File:** `apps/api/src/modules/community/comments.controller.ts`
- **Description:** The comments controller only has a Create endpoint. Comments cannot be listed independently, edited, or deleted.
- **Fix:** Add `@Get()` (list by post), `@Patch(':id')`, and `@Delete(':id')` endpoints.

---

### API-025: Missing Update/Delete for Client Requests
- **Severity:** MEDIUM
- **Status:** FAIL
- **File:** `apps/api/src/modules/requests/requests.controller.ts`
- **Description:** The requests controller only supports Create, FindAll, FindOne, and FindMatches. Request status cannot be updated and requests cannot be deleted.
- **Fix:** Add `@Patch(':id')` and `@Delete(':id')` endpoints.

---

### API-026: Schedule Module Is Read-Only
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** `apps/api/src/modules/schedule/schedule.controller.ts`
- **Description:** The schedule module only has a single `GET /schedule` endpoint that aggregates contract dates and customer follow-ups. There's no ability to create, update, or delete schedule events. The module serves as a computed view rather than a resource.
- **Fix:** If standalone schedule events are needed (e.g., custom reminders), add a Schedule model and CRUD endpoints. If the current computed approach is intentional, document this as a design decision.

---

### API-027: No Pagination on Multiple List Endpoints
- **Severity:** MEDIUM
- **Status:** FAIL
- **File:** Multiple controllers
- **Description:** Several list endpoints return all records without pagination, which will cause performance issues as data grows:
  - `contracts.controller.ts:17` — `GET /contracts` returns all contracts
  - `ledger.controller.ts:18` — `GET /ledger` returns all transactions
  - `requests.controller.ts:13` — `GET /requests` returns all requests
  - `posts.controller.ts:19` — `GET /posts` returns all posts

  Only `properties.controller.ts` implements pagination (`page` + `limit` params). Even there, total count is not returned, so the frontend cannot render pagination controls.
- **Fix:** Add `@Query('page')` and `@Query('limit')` params to all list endpoints. Return `{ data, total, page, limit }` response shape.

---

### API-028: View Count Race Condition in Posts
- **Severity:** LOW
- **Status:** WARN
- **File:** `apps/api/src/modules/community/posts.service.ts:45-49`
- **Description:** `findOne()` first reads the post, then issues a separate `update` to increment `views`. Under concurrent access, views can be lost. Additionally, the updated view count is not returned to the client (the response contains the pre-increment value).
  ```typescript
  if (post) {
      await this.prisma.post.update({
          where: { id },
          data: { views: { increment: 1 } },
      });
  }
  ```
- **Fix:** Use a transaction or return the result of the update query instead:
  ```typescript
  return this.prisma.post.update({
      where: { id },
      data: { views: { increment: 1 } },
      include: { author: ..., comments: ... }
  });
  ```

---

### API-029: BigInt Precision Loss and Duplicate Patch
- **Severity:** LOW
- **Status:** WARN
- **File:** `apps/api/src/main.ts:6-8` and `apps/api/src/common/utils/bigint.patch.ts:5-12`
- **Description:** Two issues: (1) The BigInt→Number conversion in `toJSON` can silently lose precision for values exceeding `Number.MAX_SAFE_INTEGER` (2^53). Korean real estate prices in won can reach billions, which is safe, but contract/ledger `BigInt` fields could theoretically hold values > 9 quadrillion. (2) The patch is applied in `main.ts` inline but also exists as a utility function in `bigint.patch.ts` that is never imported — dead code.
- **Fix:** Remove the dead utility file or import it in `main.ts`. For critical financial precision, consider returning BigInt as string in JSON responses.

---

### API-030: `@ts-ignore` Suppressing Type Error
- **Severity:** LOW
- **Status:** WARN
- **File:** `apps/api/src/modules/auth/auth.service.ts:16`
- **Description:** A `@ts-ignore` comment suppresses a type error on `user.password`. This indicates the Prisma-generated type doesn't include `password` in the select, or there's a type mismatch. Suppressing type errors can hide real bugs.
- **Fix:** Type the return of `findUnique` properly, or explicitly select the password field:
  ```typescript
  const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true, password: true }
  });
  ```

---

### API-031: Customer DTO Inconsistencies
- **Severity:** LOW
- **Status:** WARN
- **File:** `apps/api/src/modules/customers/dto/create-customer.dto.ts`
- **Description:** Multiple issues: (1) `display_name` uses snake_case while all other fields use camelCase — inconsistent convention. (2) `status` and `priority` use `@IsString()` instead of `@IsEnum()` with the allowed values ('ACTIVE'|'CONTRACTED'|'INACTIVE', 'HOT'|'WARM'|'COLD'). (3) `preferences` and `notes` fields are accepted by the service (line 17-18 of customers.service.ts) but not defined in the DTO, so they are silently stripped by `whitelist: true`.
- **Fix:** Use `@IsEnum()` for status/priority, rename `display_name` to `displayName`, add `preferences` and `notes` to the DTO.

---

### API-032: Ledger DTO Type Field Not Validated as Enum
- **Severity:** LOW
- **Status:** WARN
- **File:** `apps/api/src/modules/ledger/dto/create-ledger.dto.ts:4-5`
- **Description:** The `type` field is declared as `'INCOME' | 'EXPENSE'` in TypeScript but only has `@IsString()` decorator. TypeScript union types are erased at runtime, so any string will pass validation.
- **Fix:** Use `@IsEnum()` or `@IsIn(['INCOME', 'EXPENSE'])`.

---

### API-033: CORS Enabled Without Origin Restriction
- **Severity:** LOW
- **Status:** WARN
- **File:** `apps/api/src/main.ts:12`
- **Description:** `app.enableCors()` with no arguments allows requests from any origin. In production, this should be restricted to the frontend domains.
- **Fix:** Configure CORS with specific origins:
  ```typescript
  app.enableCors({ origin: process.env.CORS_ORIGINS?.split(',') });
  ```

---

### API-034: Missing `forbidNonWhitelisted` in ValidationPipe
- **Severity:** LOW
- **Status:** WARN
- **File:** `apps/api/src/main.ts:13-16`
- **Description:** The `ValidationPipe` is configured with `whitelist: true` (extra properties stripped) but not `forbidNonWhitelisted: true`. This means clients sending unknown/malicious properties receive no error feedback — the properties are silently ignored. This can mask frontend bugs.
- **Fix:** Add `forbidNonWhitelisted: true` to reject requests with unexpected properties with a 400 error.

---

### API-035: N+1-Adjacent Pattern in Schedule Service
- **Severity:** LOW
- **Status:** WARN
- **File:** `apps/api/src/modules/schedule/schedule.service.ts:9-16`
- **Description:** The schedule service makes two separate queries (contracts with includes, then customers) instead of a single optimized query. This is not a classic N+1 but creates unnecessary round-trips. For SQLite on the same machine, latency is low, but it's still suboptimal.
- **Fix:** Consider using `Promise.all()` to parallelize the two queries at minimum. Or combine into a single raw query if performance matters.

---

### API-036: Inconsistent Response Shapes Across Endpoints
- **Severity:** INFO
- **Status:** WARN
- **File:** Multiple controllers
- **Description:** The API has no consistent response envelope. Different endpoints return different shapes:
  - Auth login: `{ access_token, user }`
  - Properties list: bare array `Property[]`
  - Ledger stats: `{ income, expense, net }`
  - Schedule events: bare array of event objects
  - Real-transaction seed: `{ message, count? }`

  There's no standard wrapper like `{ data, meta }` or `{ success, data, error }`.
- **Fix:** Adopt a consistent response interceptor that wraps all responses: `{ data: ..., meta?: { total, page } }`.

---

### API-037: Prisma Service Lifecycle — Correct
- **Severity:** INFO
- **Status:** PASS
- **File:** `apps/api/src/prisma.service.ts:1-13`
- **Description:** `PrismaService` correctly implements both `OnModuleInit` (calls `$connect()`) and `OnModuleDestroy` (calls `$disconnect()`). The connection lifecycle is properly managed.
- **Fix:** N/A — this is correct. The only issue is the singleton pattern (see API-019).

---

### API-038: Properties Pagination Missing Total Count
- **Severity:** INFO
- **Status:** WARN
- **File:** `apps/api/src/modules/properties/properties.controller.ts:32-60`
- **Description:** The properties list endpoint supports `page` and `limit` query params, but only returns the array of properties without a total count. Frontend pagination UI needs the total to calculate page numbers.
- **Fix:** Add a `prisma.property.count({ where })` call and return `{ data: properties, total, page, limit }`.

---

## Module-by-Module Summary

| Module | Auth Guard | DTOs | CRUD Complete | Key Issues |
|--------|-----------|------|---------------|------------|
| **Auth** | N/A | None (uses `any`) | Login + Register only | API-005, API-006, API-007, API-012, API-020 |
| **Properties** | **MISSING** | **None** | Full CRUD | API-001, API-002, API-008, API-013, API-015, API-018 |
| **Customers** | Yes | Partial (create only) | Full CRUD | API-015, API-016, API-031 |
| **Contracts** | Yes | **None** | Missing Delete | API-009, API-011, API-015, API-016, API-021 |
| **Ledger** | Yes | Create DTO | Missing Update/Delete | API-022, API-032 |
| **Schedule** | Yes | N/A | Read-only (computed) | API-026, API-035 |
| **Requests** | **MISSING** | **None** | Missing Update/Delete | API-003, API-010, API-014, API-015, API-025 |
| **Community** | Partial | Inline types | Missing Update/Delete | API-015, API-023, API-024, API-028 |
| **Real-Transaction** | **MISSING** | None | GET + Seed only | API-004 |

---

## Priority Remediation Order

1. **Immediate (CRITICAL):** Fix SQL injection (API-001), add auth guards to unprotected controllers (API-002, API-003, API-004)
2. **Urgent (HIGH):** Move JWT secret to env var (API-005), fix login 200-on-failure (API-006), create DTOs for all endpoints (API-007 through API-010), fix unsafe spread (API-011), fix password leak (API-012), remove hardcoded demo agents (API-013, API-014)
3. **Short-term (MEDIUM):** Add 404 handling (API-015), ownership checks (API-016), exception filter (API-017), singleton PrismaService (API-019), missing CRUD endpoints (API-021 through API-025), pagination (API-027)
4. **Maintenance (LOW/INFO):** Fix minor DTO issues (API-031, API-032), CORS config (API-033), response consistency (API-036), BigInt handling (API-029)

---

*End of API Quality & Correctness Audit Report*
