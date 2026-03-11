# Mansil Platform — Security Audit Report

**Auditor:** security-auditor (automated)
**Date:** 2026-02-26
**Scope:** Full-stack security audit — apps/api (NestJS), apps/web (Next.js), apps/mobile (Expo), packages/*
**Overall Risk:** **CRITICAL** — Multiple critical and high-severity findings requiring immediate remediation before production deployment.

---

## Executive Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 4     |
| HIGH     | 8     |
| MEDIUM   | 5     |
| LOW      | 3     |
| INFO     | 2     |
| **Total** | **22** |

The platform has **critical security vulnerabilities** that must be fixed before any production deployment. The most urgent are: a hardcoded JWT secret, SQL injection via `$queryRawUnsafe`, completely unprotected API endpoints (properties, requests), and wide-open CORS.

---

## Findings

---

### SEC-001: Hardcoded JWT Secret in Source Code
- **Severity:** CRITICAL
- **Status:** FAIL
- **File:** `apps/api/src/modules/auth/constants.ts:2`
- **Description:** The JWT signing secret is hardcoded as the string literal `'mansil-secret-key-change-in-prod'`. This secret is committed to version control and is trivially discoverable. Anyone with access to the source code (or its compiled output) can forge valid JWT tokens for any user, including admins.
- **Fix:** Move the secret to an environment variable (`process.env.JWT_SECRET`). Generate a cryptographically random secret (≥256 bits) for production. Reject startup if the env var is missing.

---

### SEC-002: SQL Injection via `$queryRawUnsafe` in Map Clustering
- **Severity:** CRITICAL
- **Status:** FAIL
- **File:** `apps/api/src/modules/properties/properties.service.ts:124-137`
- **Description:** The `getClusters` method constructs a raw SQL query by interpolating user-supplied query parameters (`north`, `south`, `east`, `west`, `zoom`) directly into the SQL string via template literals, then executes it with `$queryRawUnsafe`. Although the controller converts these to `Number()`, `Number(undefined)` yields `NaN` which is safe, but `Number("1; DROP TABLE Property")` yields `NaN` as well. However, sophisticated crafted inputs or future code changes could bypass this. The pattern itself is inherently dangerous and violates secure coding practices.
- **Fix:** Use Prisma's `$queryRaw` with tagged template literals for parameterized queries: `` prisma.$queryRaw`SELECT ... WHERE lat <= ${north}` ``. Alternatively, validate inputs are finite numbers before use.

---

### SEC-003: Properties & Requests Controllers Have No Authentication
- **Severity:** CRITICAL
- **Status:** FAIL
- **Files:**
  - `apps/api/src/modules/properties/properties.controller.ts:6` (no `@UseGuards`)
  - `apps/api/src/modules/requests/requests.controller.ts:5` (no `@UseGuards`)
- **Description:** The `PropertiesController` and `RequestsController` have **no `@UseGuards(JwtAuthGuard)`** at the class or method level. This means any unauthenticated user can:
  - Create, update, and **delete** any property
  - Create client requests and view all requests (which contain client PII: name, phone)
  - View property matches
  This is a complete authentication bypass for business-critical data.
- **Fix:** Add `@UseGuards(JwtAuthGuard)` to both controllers at the class level. Public read-only endpoints (like property listings) can selectively skip the guard.

---

### SEC-004: Wide-Open CORS Configuration
- **Severity:** CRITICAL
- **Status:** FAIL
- **File:** `apps/api/src/main.ts:12`
- **Description:** `app.enableCors()` is called with no arguments, which defaults to `origin: '*'` — allowing any domain to make authenticated cross-origin requests to the API. Combined with localStorage token storage, this enables any malicious website to make API calls on behalf of a logged-in user.
- **Fix:** Restrict CORS to known origins: `app.enableCors({ origin: ['https://mansil.com', 'http://localhost:3000'], credentials: true })`.

---

### SEC-005: No Authorization / RBAC — Any User Can Access Any Resource
- **Severity:** HIGH
- **Status:** FAIL
- **Files:**
  - `apps/api/src/modules/customers/customers.controller.ts:24-37`
  - `apps/api/src/modules/contracts/contracts.controller.ts:22-29`
- **Description:** While `findAll` correctly filters by `user.id` (agent's own data), the `findOne`, `update`, and `delete` methods take a raw `id` parameter and perform the operation without verifying ownership. Any authenticated user can:
  - Read any other agent's customer details (`GET /customers/:id`)
  - Update or delete any customer (`PATCH/DELETE /customers/:id`)
  - Read or update any contract (`GET/PATCH /contracts/:id`)
  There is no role-based access control (RBAC). The `role` field exists in the JWT but is never checked anywhere.
- **Fix:** Add ownership verification in service methods (e.g., `where: { id, agentId: userId }`). Implement a `RolesGuard` to enforce role-based permissions.

---

### SEC-006: No Rate Limiting on Login or Any Endpoint
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/api/src/main.ts` (global), `apps/api/src/modules/auth/auth.controller.ts`
- **Description:** There is no rate limiting or throttling on any endpoint, including `/auth/login` and `/auth/register`. This enables:
  - Brute-force password attacks on login
  - Credential stuffing attacks
  - Account enumeration (the register endpoint reveals if an email exists)
  - API abuse / denial-of-service
- **Fix:** Install `@nestjs/throttler` and apply `ThrottlerGuard` globally. Set stricter limits on auth endpoints (e.g., 5 attempts per minute for login).

---

### SEC-007: JWT Token Stored in localStorage (XSS Risk)
- **Severity:** HIGH
- **Status:** FAIL
- **Files:**
  - `apps/web/app/(auth)/login/page.tsx:21`
  - `apps/web/lib/api/client.ts:20`
- **Description:** The access token is stored in `localStorage` and read on every API call. `localStorage` is accessible to any JavaScript running on the page, making the token vulnerable to XSS attacks. If an attacker can inject script (e.g., via a stored XSS in community posts), they can steal the token.
- **Fix:** Use `httpOnly` cookies for token storage (not accessible to JavaScript). Alternatively, use a short-lived access token in memory with a refresh token in an httpOnly cookie.

---

### SEC-008: No Security Headers (Helmet.js Missing)
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/api/src/main.ts`
- **Description:** The API does not use `helmet` or set any security headers. Missing headers include:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Strict-Transport-Security` (HSTS)
  - `Content-Security-Policy`
  - `X-XSS-Protection`
  - `Referrer-Policy`
- **Fix:** Install and configure `helmet`: `app.use(helmet())` in `main.ts`.

---

### SEC-009: No HTTPS Enforcement or HSTS
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/api/src/main.ts`
- **Description:** The API server listens on plain HTTP (port 3001) with no HTTPS redirect, no TLS configuration, and no HSTS header. The web client hardcodes `http://localhost:3001` as the API base URL. In production, tokens and PII would be transmitted in cleartext.
- **Fix:** Deploy behind a TLS-terminating reverse proxy (nginx, Cloudflare, etc.). Add HSTS headers via Helmet. Update the API base URL to use `https://` in production. Enforce HTTPS redirects.

---

### SEC-010: No Refresh Token Mechanism — 60-Minute Session Only
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/api/src/modules/auth/constants.ts:3`
- **Description:** Tokens expire after 60 minutes with no refresh token mechanism. Users must re-login every hour. There is also no token revocation — if a token is compromised, it remains valid until expiry. No logout endpoint exists to invalidate tokens.
- **Fix:** Implement a refresh token flow with short-lived access tokens (15 min) and longer-lived refresh tokens stored in httpOnly cookies. Add a logout endpoint that invalidates the refresh token.

---

### SEC-011: Login Endpoint Returns 200 OK on Invalid Credentials
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/api/src/modules/auth/auth.controller.ts:10-16`
- **Description:** When credentials are invalid, the login endpoint returns `{ status: 401, message: 'Invalid credentials' }` with an **HTTP 200 status code** (due to `@HttpCode(HttpStatus.OK)`). This breaks standard HTTP semantics and may confuse security middleware, WAFs, and client-side error handling.
- **Fix:** Throw `new UnauthorizedException('Invalid credentials')` instead of returning a 200 with a status field in the body.

---

### SEC-012: Auth Endpoints Accept Unvalidated `Record<string, any>`
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/api/src/modules/auth/auth.controller.ts:10,19`
- **Description:** Both `login` and `register` accept `Record<string, any>` as the body type instead of a validated DTO. This bypasses the `ValidationPipe` entirely — no email format validation, no password length/complexity requirements, no sanitization. The `register` method in the service also uses `data: any`.
- **Fix:** Create `LoginDto` and `RegisterDto` with `class-validator` decorators: `@IsEmail()`, `@IsString()`, `@MinLength(8)` for password, `@IsNotEmpty()` for name, etc.

---

### SEC-013: Hardcoded Demo Credentials in Service Logic
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** `apps/api/src/modules/properties/properties.service.ts:37-44`
- **Description:** The `create` method hardcodes a `connectOrCreate` with `email: 'demo@mansil.com'` and `password: 'hashed_password'` (which is **not actually hashed** — it's the literal string `"hashed_password"`). This creates or connects to a user with a known, unhashed password.
- **Fix:** Remove hardcoded demo user creation from production code. Properties should be associated with the currently authenticated user.

---

### SEC-014: Inconsistent Token Key Between Web Pages
- **Severity:** MEDIUM
- **Status:** FAIL
- **Files:**
  - `apps/web/app/(auth)/login/page.tsx:21` — stores as `access_token`
  - `apps/web/lib/api/client.ts:20` — reads `access_token` ✓
  - `apps/web/app/(main)/community/write/page.tsx:25` — reads `token` ✗
  - `apps/web/app/(main)/community/[id]/page.tsx:32` — reads `token` ✗
- **Description:** The login page stores the JWT under `localStorage.getItem('access_token')`, and the API client reads from the same key. However, the community pages directly use `localStorage.getItem('token')` — a different key. This means community post creation and commenting will **always send `null`** as the Bearer token, causing authentication failures.
- **Fix:** Use a consistent key name throughout. Preferably centralize token access through the API client.

---

### SEC-015: Multiple Controllers Accept Untyped `any` Body
- **Severity:** MEDIUM
- **Status:** FAIL
- **Files:**
  - `apps/api/src/modules/properties/properties.controller.ts:27` — `create(@Body() createPropertyDto: any)`
  - `apps/api/src/modules/properties/properties.controller.ts:69` — `update(@Body() updatePropertyDto: any)`
  - `apps/api/src/modules/contracts/contracts.controller.ts:12` — `create(@Body() createContractDto: any)`
  - `apps/api/src/modules/contracts/contracts.controller.ts:27` — `update(@Body() updateContractDto: any)`
  - `apps/api/src/modules/customers/customers.controller.ts:30` — `update(@Body() updateCustomerDto: any)`
  - `apps/api/src/modules/requests/requests.controller.ts:9` — `create(@Body() createRequestDto: any)`
- **Description:** Many endpoints accept `any` as the DTO type, which completely bypasses the `ValidationPipe`'s whitelist/transform features. Attackers can pass arbitrary fields that may be spread into Prisma operations (e.g., `contracts.service.ts:10` uses `...data`), potentially overwriting fields like `agentId`, `status`, or `role`.
- **Fix:** Create proper DTOs with `class-validator` decorators for every endpoint. Never spread user input directly into database operations.

---

### SEC-016: Mass Assignment in Contracts Service
- **Severity:** MEDIUM
- **Status:** FAIL
- **File:** `apps/api/src/modules/contracts/contracts.service.ts:9-11`
- **Description:** The `create` method spreads user input directly: `data: { ...data, agentId }`. An attacker can include `agentId` in the body to associate a contract with a different agent, or set `status: "COMPLETED"` to bypass the draft flow. The `update` method (`data`) is similarly unconstrained.
- **Fix:** Explicitly pick allowed fields from the input. Use a validated DTO.

---

### SEC-017: Error Responses Leak Internal Details
- **Severity:** MEDIUM
- **Status:** WARN
- **Files:**
  - `apps/api/src/modules/properties/properties.service.ts:57-58` — `message: (error as any).message, details: error`
  - `apps/api/src/modules/properties/properties.service.ts:153` — `details: String(error)`
- **Description:** Error responses include raw error messages and full error objects (`details: error`), potentially leaking database schema details, Prisma query structure, stack traces, or file paths to the client.
- **Fix:** Log detailed errors server-side only. Return generic error messages to the client (e.g., "An internal error occurred").

---

### SEC-018: Dependency Vulnerabilities (npm audit)
- **Severity:** MEDIUM → HIGH
- **Status:** FAIL
- **File:** `package.json` (root)
- **Description:** `npm audit` reports **20 vulnerabilities**: 6 low, 6 moderate, 7 high, 1 critical. Key affected packages:
  - `node-tar` — Arbitrary file creation/overwrite via hardlink path traversal (HIGH)
  - `tmp` — Arbitrary file write via symlink dir parameter (MODERATE)
  - `webpack` — BuildHttp SSRF via URL userinfo bypass (CRITICAL)
  All have fixes available via `npm audit fix`.
- **Fix:** Run `npm audit fix` immediately. Review and update any packages requiring major version bumps. Add `npm audit` to CI pipeline.

---

### SEC-019: BigInt JSON Serialization Monkey-Patch
- **Severity:** LOW
- **Status:** WARN
- **File:** `apps/api/src/main.ts:6-8`
- **Description:** `BigInt.prototype.toJSON` is monkey-patched to convert to `Number`. This can cause silent **precision loss** for values exceeding `Number.MAX_SAFE_INTEGER` (9,007,199,254,740,991). Korean real estate prices in won can exceed this (e.g., 100억 = 10,000,000,000 is fine, but very large transactions could lose precision). The patch mutates a global prototype, affecting all code in the process.
- **Fix:** Use string serialization for BigInt values: `return this.toString()`. Have the client parse these as strings or use a BigInt-aware JSON library.

---

### SEC-020: No `.gitignore` at Repository Root
- **Severity:** LOW
- **Status:** WARN
- **File:** (missing) — root `.gitignore` not found
- **Description:** No `.gitignore` file was found at the repository root. The `apps/mobile/.gitignore` exists but only covers mobile-specific patterns. `.env` files exist at `apps/api/.env` and `packages/database/.env` and could be committed if there is no root gitignore. The `.env` files contain only `DATABASE_URL` pointing to local SQLite (low risk currently), but future secrets added to `.env` files could be committed.
- **Fix:** Add a root `.gitignore` that includes `*.env`, `.env*`, `node_modules/`, etc. Verify no `.env` files are tracked in git history.

---

### SEC-021: Community Posts Read Endpoint is Public (No Auth)
- **Severity:** LOW
- **Status:** INFO
- **File:** `apps/api/src/modules/community/posts.controller.ts:18-26`
- **Description:** The `GET /posts` and `GET /posts/:id` endpoints are not protected by `JwtAuthGuard` (only `POST` is guarded). This is likely intentional (public forum), but it means post content and author names are publicly accessible.
- **Fix:** Verify this is intentional. If posts contain sensitive agent discussions, add authentication.

---

### SEC-022: Hardcoded localhost API URL in Web Client
- **Severity:** INFO
- **Status:** WARN
- **Files:**
  - `apps/web/lib/api/client.ts:1` — `http://localhost:3001`
  - `apps/web/app/(main)/community/write/page.tsx:21` — `http://localhost:3001`
  - `apps/web/app/(main)/community/[id]/page.tsx:12` — `http://localhost:3001`
- **Description:** The API base URL is hardcoded to `http://localhost:3001` in multiple files. This will not work in production and forces HTTP (no TLS).
- **Fix:** Use an environment variable (`NEXT_PUBLIC_API_URL`) and ensure it points to an HTTPS endpoint in production.

---

## Authentication & Authorization Summary

| Controller | `@UseGuards(JwtAuthGuard)` | Ownership Check | RBAC |
|---|---|---|---|
| AuthController | N/A (public) | N/A | N/A |
| PropertiesController | **MISSING** | **MISSING** | **MISSING** |
| RequestsController | **MISSING** | **MISSING** | **MISSING** |
| CustomersController | ✅ Class-level | ✅ `findAll` only | **MISSING** |
| ContractsController | ✅ Class-level | ✅ `findAll` only | **MISSING** |
| LedgerController | ✅ Class-level | ✅ All methods | **MISSING** |
| ScheduleController | ✅ Class-level | ✅ `getEvents` | **MISSING** |
| PostsController | ✅ `create` only | **MISSING** | **MISSING** |
| CommentsController | ✅ `create` only | **MISSING** | **MISSING** |

---

## File Upload Security

| Check | Status | Notes |
|---|---|---|
| Backend upload handler | **NOT FOUND** | No multer or file upload handling in the API |
| Frontend component | `packages/ui/src/components/file-upload.tsx` | Client-side only, `accept` prop optional |
| File type validation | **NONE** | No server-side MIME or extension check |
| File size limit | **NONE** | UI text says "10MB" but not enforced |
| Path traversal protection | **N/A** | No upload handler exists yet |

The `FileUpload` component is a UI-only component with no backend integration. When a backend upload handler is implemented, it must include server-side file type validation, size limits, and sanitized storage paths.

---

## Prioritized Remediation Plan

### Immediate (Pre-Launch Blockers)
1. **SEC-001** — Move JWT secret to env var, generate strong secret
2. **SEC-002** — Replace `$queryRawUnsafe` with parameterized queries
3. **SEC-003** — Add auth guards to Properties and Requests controllers
4. **SEC-004** — Restrict CORS origins
5. **SEC-005** — Add ownership checks to findOne/update/delete
6. **SEC-012** — Create validated DTOs for auth endpoints

### High Priority (Within Sprint 1)
7. **SEC-006** — Add rate limiting via `@nestjs/throttler`
8. **SEC-007** — Migrate to httpOnly cookie token storage
9. **SEC-008** — Install and configure Helmet.js
10. **SEC-009** — Deploy with HTTPS / TLS termination
11. **SEC-010** — Implement refresh token flow
12. **SEC-011** — Fix login to return proper 401 status
13. **SEC-015/016** — Create validated DTOs for all endpoints

### Medium Priority (Within Sprint 2)
14. **SEC-013** — Remove hardcoded demo user
15. **SEC-014** — Fix inconsistent localStorage key
16. **SEC-017** — Sanitize error responses
17. **SEC-018** — Run `npm audit fix`, add to CI

### Low Priority
18. **SEC-019** — Use string serialization for BigInt
19. **SEC-020** — Add root .gitignore
20. **SEC-022** — Use env var for API URL

---

*End of Security Audit Report*
