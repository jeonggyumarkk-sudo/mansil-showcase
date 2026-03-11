# Privacy & PIPA Compliance Audit Report — Mansil Platform

**Auditor:** privacy-compliance-auditor (automated)
**Date:** 2026-02-26
**Scope:** Full-stack monorepo — `apps/api`, `apps/web`, `apps/mobile`, `packages/database`
**Applicable Law:** Korean Personal Information Protection Act (개인정보 보호법, PIPA)

---

## Executive Summary

The Mansil Platform collects and processes significant PII (names, emails, phones, addresses) for Korean real estate brokerage. The audit found **no PIPA compliance infrastructure** — no consent collection, no privacy policy, no data subject rights endpoints, no data retention policy, and no data-at-rest encryption. Several API endpoints return more PII than necessary, and there is a hardcoded plaintext password in the properties service. These are **blocking issues** for production launch under Korean law.

| Severity | Count |
|----------|-------|
| CRITICAL | 5 |
| HIGH     | 7 |
| MEDIUM   | 4 |
| LOW      | 2 |
| INFO     | 2 |

---

## Section 1 — Personal Data Inventory

### PRV-001: PII Field Catalogue
- **Severity:** INFO
- **Status:** DOCUMENTED
- **File:** `packages/database/prisma/schema.prisma`
- **Description:** The following PII fields exist across all models:

| Model | Field | PII Type | Sensitivity |
|-------|-------|----------|-------------|
| User | `email` (line 15) | Email address | HIGH |
| User | `name` (line 16) | Personal name | MEDIUM |
| User | `password` (line 18) | Credential (hashed) | CRITICAL |
| ClientRequest | `clientName` (line 35) | Personal name | MEDIUM |
| ClientRequest | `clientPhone` (line 36) | Phone number | HIGH |
| Customer | `name` (line 110) | Personal name | MEDIUM |
| Customer | `phone` (line 111) | Phone number | HIGH |
| Customer | `email` (line 112) | Email address | HIGH |
| Customer | `notes` (line 121) | Free-text (may contain PII) | MEDIUM |
| Customer | `preferences` (line 119) | JSON string (may contain PII) | LOW |
| Property | `address` (line 76) | Physical address | MEDIUM |
| Property | `roadAddress` (line 77) | Physical address | MEDIUM |
| Contract | `pdfUrl` (line 168) | Link to contract doc (may contain PII) | HIGH |
| Post | `content` (line 225) | Free-text (may contain PII) | LOW |
| Comment | `content` (line 242) | Free-text (may contain PII) | LOW |

- **Fix:** Maintain a formal data map (개인정보 파일 대장) as required by PIPA Article 30.

---

## Section 2 — Korean PIPA Compliance

### PRV-002: No Consent Mechanism for Data Collection
- **Severity:** CRITICAL
- **Status:** FAIL
- **File:** `apps/api/src/modules/auth/auth.controller.ts:19` (register), `apps/web/app/(auth)/login/page.tsx`
- **Description:** PIPA Article 15 requires explicit, informed consent before collecting personal information. The registration endpoint (`POST /auth/register`) collects email, name, and password with **no consent checkbox, no privacy notice, and no terms of service agreement**. The web login page links to `/register` but no register page exists. The mobile app has no registration flow at all. No consent records are stored anywhere in the database.
- **Fix:**
  1. Create a registration page with mandatory consent checkboxes for: (a) collection and use of personal information, (b) purpose of processing, (c) retention period.
  2. Add a `ConsentRecord` model to the database to store consent timestamps and versions.
  3. Present a privacy notice (개인정보 수집·이용 동의서) before data collection.

### PRV-003: No Purpose Limitation Documentation
- **Severity:** HIGH
- **Status:** FAIL
- **File:** N/A (missing entirely)
- **Description:** PIPA Article 3 and 15 require that personal information be collected only for specified, explicit purposes and not processed beyond those purposes. There is no documentation anywhere in the codebase or UI that specifies what the collected data will be used for. The `Customer` model stores names, phones, and emails, but no purpose is documented for this collection.
- **Fix:** Define and display purpose statements for each category of data collection. Implement purpose-bound access controls.

### PRV-004: No Data Minimization Controls
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** `apps/api/src/modules/customers/customers.service.ts:29-35`
- **Description:** PIPA Article 3(1) requires data minimization — collect only what is necessary. The `Customer.findAll()` returns **all fields** including phone, email, and notes via `prisma.customer.findMany()` with no `select` clause. The `Customer.findOne()` similarly returns everything. The contracts service includes full customer records via `include: { customer: true }`. Only the customer name may be needed in list views.
- **Fix:** Use Prisma `select` clauses to return only the fields required by each view. For list views, exclude phone/email. For detail views, include them only when the user has a legitimate need.

### PRV-005: No Right to Access / Correct / Delete Personal Data
- **Severity:** CRITICAL
- **Status:** FAIL
- **File:** N/A (missing entirely)
- **Description:** PIPA Articles 35-37 give data subjects the right to access, correct, and request deletion of their personal information. There are **no endpoints** for:
  - Users to view all personal data held about them
  - Users to correct their profile information
  - Users to request account/data deletion

  There is no user profile page, no account settings page, and no self-service data management UI in either the web or mobile app.
- **Fix:**
  1. Create `GET /users/me` endpoint to return the current user's data.
  2. Create `PATCH /users/me` endpoint to allow profile updates.
  3. Create `DELETE /users/me` endpoint for account deletion.
  4. Build corresponding UI in web and mobile apps.
  5. Implement a data export feature (data portability).

### PRV-006: No Data Retention Policy
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `packages/database/prisma/schema.prisma`
- **Description:** PIPA Article 21 requires that personal information be destroyed without delay when the retention period expires or the purpose is achieved. There is:
  - No retention period defined for any model
  - No `deletedAt` or soft-delete fields
  - No automated data purge or archival process
  - No distinction between active and archived data (except `Customer.status`)
  - Contract data and customer data are retained indefinitely
- **Fix:**
  1. Define retention periods for each data category (e.g., contracts: 5 years after completion, customers: 1 year after last interaction).
  2. Add scheduled jobs to purge or anonymize expired data.
  3. Document retention policy and display it to users.

### PRV-007: No Cross-Border Data Transfer Safeguards
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** `apps/web/lib/api/client.ts:1`, `apps/mobile/app/login.tsx:7`
- **Description:** PIPA Article 17(3) requires consent and safeguards for transferring personal information overseas. Currently the API URL is hardcoded to `http://localhost:3001`. In production, if the backend is hosted outside Korea (e.g., AWS us-east), user data would cross borders without notification or consent. There is no configuration or documentation about where data is stored geographically.
- **Fix:**
  1. Document the data storage location and ensure it is within Korea, or obtain explicit consent for cross-border transfer.
  2. Add a section to the privacy policy about data storage location.
  3. If using cloud services, ensure the region is `ap-northeast-2` (Seoul).

---

## Section 3 — Data Exposure in API Responses

### PRV-008: Customer PII Over-Exposed in Contract Responses
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/api/src/modules/contracts/contracts.service.ts:20-21`
- **Description:** `ContractsService.findAll()` and `findOne()` use `include: { customer: true }` which returns the **entire Customer object** (name, phone, email, notes, preferences) in every contract API response. The frontend may only need the customer name.
- **Fix:** Replace `include: { customer: true }` with `include: { customer: { select: { id: true, name: true } } }`.

### PRV-009: Schedule Endpoint Leaks Full Customer Records
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/api/src/modules/schedule/schedule.service.ts:14`
- **Description:** `ScheduleService.getEvents()` fetches full customer records (`findMany` with no select) including phone, email, and notes, but only uses `customer.name` and `customer.nextFollowupDate` to build calendar events. All other PII is fetched unnecessarily and returned to the client (as part of internal processing, the full objects reside in server memory).
- **Fix:** Add `select: { id: true, name: true, nextFollowupDate: true }` to the customer query.

### PRV-010: Posts Endpoint Exposes Author Email
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** `apps/api/src/modules/community/posts.service.ts:19`
- **Description:** `PostsService.findAll()` includes `author: { select: { name: true, email: true } }`. The author's email address is returned in every community post listing. While the name may be needed for display, the email is unnecessary and creates a data exposure risk. Any unauthenticated user can call `GET /posts` (no `@UseGuards`) and harvest user emails.
- **Fix:** Remove `email: true` from the author select in `findAll()`. If email display is needed, restrict the endpoint to authenticated users.

### PRV-011: Client Request Data Exposed Without Auth
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/api/src/modules/requests/requests.controller.ts:13-15`
- **Description:** The `RequestsController` has **no `@UseGuards(JwtAuthGuard)`** decorator. Endpoints `GET /requests` and `GET /requests/:id` are publicly accessible and return full `ClientRequest` records including `clientName` and `clientPhone` — sensitive PII accessible without any authentication.
- **Fix:** Add `@UseGuards(JwtAuthGuard)` to the `RequestsController` class and scope queries to the authenticated agent's records.

### PRV-012: Properties Endpoint Unauthenticated — Includes Agent Relation
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** `apps/api/src/modules/properties/properties.controller.ts:6`
- **Description:** `PropertiesController` has no auth guard. While property listings may be intentionally public, the `Property` model includes `agentId` and the default Prisma response may include agent-related data. The `findOne` returns properties with images but not the agent, which is acceptable. However, the lack of auth means anyone can create, update, or delete properties via `POST`, `PATCH`, `DELETE`.
- **Fix:** Add auth guards to write endpoints (POST, PATCH, DELETE). Ensure public read endpoints don't expose agent PII.

---

## Section 4 — PII in Logging

### PRV-013: Error Logging May Expose PII
- **Severity:** LOW
- **Status:** WARN
- **File:** `apps/api/src/modules/properties/properties.service.ts:53`, `apps/api/src/modules/properties/properties.service.ts:148`
- **Description:** `console.error('Failed to create property:', error)` and `console.error('Clustering error:', error)` log full error objects which may contain request data including user-submitted PII (addresses, names). The error response at line 58 also leaks `(error as any).message` and `details: error` to the client, potentially exposing internal system information.
- **Fix:**
  1. Use a structured logger (e.g., Winston/Pino) with PII redaction.
  2. Remove `details: error` from HTTP error responses.
  3. Log only error codes/messages, not full error objects.

---

## Section 5 — Account Deletion

### PRV-014: No User Account Deletion Mechanism
- **Severity:** CRITICAL
- **Status:** FAIL
- **File:** N/A (missing entirely)
- **Description:** There is no endpoint, UI, or process for a user to delete their account. PIPA Article 36 requires organizations to process deletion requests within 10 days. The `User` model has no delete endpoint. Furthermore, because `User` has relations to `Property`, `ClientRequest`, `Customer`, `Contract`, `LedgerTransaction`, `Post`, and `Comment` — and most of these relations do **not** have `onDelete: Cascade` — attempting to delete a user record would fail with a foreign key constraint error. Only `PropertyImage` and `Comment` have cascade delete.
- **Fix:**
  1. Add `onDelete: Cascade` or `onDelete: SetNull` to all User relations as appropriate.
  2. Create a `DELETE /users/me` endpoint that handles cascading deletion or anonymization.
  3. Build UI for account deletion in web and mobile apps.
  4. Implement a grace period (e.g., 30 days) before permanent deletion.

---

## Section 6 — Password Handling

### PRV-015: Password Excluded from Login Response (PASS)
- **Severity:** INFO
- **Status:** PASS
- **File:** `apps/api/src/modules/auth/auth.service.ts:17`
- **Description:** The `validateUser()` method correctly destructures the password field: `const { password, ...result } = user;` before returning the user object. The `login()` response only includes `id`, `email`, `name`, and `role`. This is correct.
- **Fix:** No fix needed. However, consider using Prisma's `select` to exclude password at the query level rather than destructuring after fetch, which is more robust.

### PRV-016: Hardcoded Plaintext Password in Properties Service
- **Severity:** CRITICAL
- **Status:** FAIL
- **File:** `apps/api/src/modules/properties/properties.service.ts:40`
- **Description:** The `PropertiesService.create()` method contains a `connectOrCreate` block that creates a demo user with `password: 'hashed_password'` — this is a **plaintext string** stored directly as the password, not actually hashed. If this code runs in production, it creates a user account with a known, easily guessable password.
- **Fix:** Remove the `connectOrCreate` block entirely. Require a valid authenticated user (via auth guard) and use `user.id` as the `agentId`. If seeding is needed, use a proper seed script with bcrypt-hashed passwords.

### PRV-017: Register Endpoint Returns Password in Response
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/api/src/modules/auth/auth.service.ts:43-52`
- **Description:** The `register()` method creates a user with `prisma.user.create()` which returns the full user object **including the hashed password**. This object is then passed to `this.login(user)` which accesses `user.email`, `user.name`, `user.role` — but the full object including `password` is still in memory and could be inadvertently logged or exposed. More critically, `prisma.user.create()` returns the password hash; if `login()` is ever modified to spread the user object, the hash would leak to the client.
- **Fix:** Add `select` to the `create()` call to exclude password: `select: { id: true, email: true, name: true, role: true }`.

---

## Section 7 — Cookies / Tracking

### PRV-018: JWT Token Stored in localStorage (Web)
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/web/app/(auth)/login/page.tsx:21`, `apps/web/lib/api/client.ts:20`
- **Description:** The JWT access token is stored in `localStorage`, which is vulnerable to XSS attacks. If any XSS vulnerability exists, an attacker can steal the token. From a privacy perspective, `localStorage` has no expiration mechanism, so the token persists indefinitely even after the 60-minute JWT expiry. The mobile app correctly uses `expo-secure-store` (`apps/mobile/store/auth.ts:17`).
- **Fix:** Use `httpOnly` cookies for token storage on the web, or implement a secure token refresh mechanism. At minimum, clear `localStorage` on token expiry.

### PRV-019: No Cookie Consent or Tracking Disclosure
- **Severity:** LOW
- **Status:** WARN
- **File:** N/A
- **Description:** No analytics, tracking pixels, or third-party cookies were found in the codebase. However, the application uses `localStorage` for authentication state, which technically constitutes client-side storage. Under Korean PIPA and the related Information and Communications Network Act, even basic storage should be disclosed. No cookie banner or storage disclosure exists.
- **Fix:** Add a brief disclosure about client-side storage usage in the privacy policy. If analytics are added later, implement a consent banner.

---

## Section 8 — Third-Party Data Sharing

### PRV-020: No External API Calls Detected (PASS)
- **Severity:** INFO
- **Status:** PASS
- **File:** N/A
- **Description:** No external API calls (HTTP clients, axios calls to third parties, webhook dispatches) were found in the backend code. The only `axios` import is in the mobile login screen for calling the internal API. No user data is shared with third parties.
- **Fix:** No fix needed. When external integrations are added (e.g., Kakao Maps, payment gateways), ensure data processing agreements are in place and consent is obtained per PIPA Article 17.

---

## Section 9 — Privacy Policy

### PRV-021: No Privacy Policy
- **Severity:** CRITICAL
- **Status:** FAIL
- **File:** N/A (missing entirely)
- **Description:** PIPA Article 30 requires every personal information processor to establish and publicly disclose a privacy policy (개인정보 처리방침) that includes:
  1. Purpose of personal information processing
  2. Processing and retention period
  3. Provision of personal information to third parties
  4. Entrustment of personal information processing
  5. Rights and obligations of data subjects
  6. Items of personal information being processed
  7. Destruction of personal information
  8. Measures to ensure the safety of personal information
  9. Name and contact info of the privacy officer (개인정보 보호책임자)

  **None of these exist anywhere in the application.** There is no `/privacy` page, no terms of service, and no link to any privacy document.
- **Fix:**
  1. Draft a comprehensive Korean-language privacy policy covering all 9 required items.
  2. Create a `/privacy` (개인정보 처리방침) page accessible from the app footer.
  3. Create a `/terms` (이용약관) page.
  4. Link to both from the registration flow.
  5. Designate a privacy officer and include their contact information.

---

## Section 10 — Data Encryption

### PRV-022: No Data-at-Rest Encryption
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `packages/database/prisma/schema.prisma:9`, `apps/api/.env:1`
- **Description:** The database is SQLite (`provider = "sqlite"`) stored as a plain file (`file:../../../packages/database/prisma/dev.db`). SQLite files are **not encrypted by default**. Anyone with filesystem access can read all data, including hashed passwords, customer PII, and contract details. PIPA Article 29 and the Enforcement Decree Article 30 require technical measures to ensure the safety of personal information, including encryption of sensitive data.
- **Fix:**
  1. For production: migrate to a managed database (PostgreSQL on a Korean cloud provider) with encryption at rest enabled.
  2. If SQLite must be used: use SQLCipher for file-level encryption.
  3. Encrypt sensitive fields (phone numbers, emails) at the application level before storage.
  4. Ensure all database backups are also encrypted.

### PRV-023: No HTTPS Enforcement
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/api/src/main.ts:12`, `apps/web/lib/api/client.ts:1`
- **Description:** The API client URL is `http://localhost:3001` (plaintext HTTP). The API server uses `app.enableCors()` with no origin restrictions. In production, if HTTPS is not enforced:
  - Login credentials (email + password) are transmitted in plaintext
  - JWT tokens are transmitted in plaintext
  - All PII (customer names, phones, addresses) flows unencrypted over the network

  This violates PIPA Article 29 which mandates encryption of personal information during transmission.
- **Fix:**
  1. Configure HTTPS/TLS for the production API server.
  2. Set `Access-Control-Allow-Origin` to specific trusted origins instead of wildcard.
  3. Add HSTS headers.
  4. Update all client URLs to use `https://` in production.

---

## Summary of Required Actions (Priority Order)

| Priority | Finding | Action |
|----------|---------|--------|
| P0 | PRV-021 | Draft and publish a Korean privacy policy (개인정보 처리방침) |
| P0 | PRV-002 | Implement consent collection during registration |
| P0 | PRV-005 | Build data subject rights endpoints (access/correct/delete) |
| P0 | PRV-014 | Implement account deletion with cascading |
| P0 | PRV-016 | Remove hardcoded plaintext password from properties service |
| P1 | PRV-023 | Enforce HTTPS in production |
| P1 | PRV-022 | Implement data-at-rest encryption |
| P1 | PRV-011 | Add auth guard to requests controller |
| P1 | PRV-017 | Exclude password from register create query |
| P1 | PRV-018 | Move JWT storage from localStorage to httpOnly cookies |
| P1 | PRV-008 | Scope customer PII in contract responses |
| P1 | PRV-006 | Define and enforce data retention policies |
| P2 | PRV-003 | Document purpose limitation for each data category |
| P2 | PRV-009 | Minimize PII in schedule endpoint queries |
| P2 | PRV-010 | Remove author email from public post listings |
| P2 | PRV-004 | Add select clauses to reduce PII in API responses |
| P2 | PRV-007 | Document data storage location for cross-border compliance |
| P2 | PRV-012 | Add auth guards to property write endpoints |
| P3 | PRV-013 | Implement structured logging with PII redaction |
| P3 | PRV-019 | Add storage disclosure to privacy policy |

---

*End of Privacy & PIPA Compliance Audit Report*
