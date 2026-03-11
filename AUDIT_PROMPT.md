# Mansil Platform — Production Readiness Audit Prompt

> Copy and paste everything below this line into a new Claude Code session to launch the audit.

---

I need a comprehensive production-readiness audit of the **Mansil Platform** — a Korean real estate management monorepo at `/home/mansil/mansil-platform`. The goal: after this audit, every issue must be catalogued with exact file paths, line numbers, severity, and a concrete fix so the service can go live with confidence.

## Platform Overview

- **Monorepo** (Turbo + npm workspaces)
- **Apps:** `apps/api` (NestJS 10), `apps/web` (Next.js 14), `apps/mobile` (Expo/React Native)
- **Packages:** `packages/database` (Prisma/SQLite), `packages/types`, `packages/utils`, `packages/ui`
- **Auth:** JWT + Passport + bcrypt
- **DB:** SQLite via Prisma 5

---

## Instructions

Create a team called `production-audit` and spawn the following agents. Each agent works in its own worktree to avoid conflicts. Every agent must produce a structured report with:

- **Finding ID** (e.g., SEC-001)
- **Severity:** CRITICAL / HIGH / MEDIUM / LOW / INFO
- **File path and line number**
- **Description of the issue**
- **Concrete fix** (code snippet or exact steps)
- **Status:** PASS / FAIL / WARN

Create these tasks and assign them to the corresponding agents:

---

### Agent 1: `security-auditor`
**Scope:** Full security audit of the entire platform.

Check every single one of these:

1. **Secrets & credentials** — Scan all files for hardcoded secrets, API keys, passwords, JWT secrets. Check `apps/api/src/modules/auth/constants.ts` for the known hardcoded JWT secret `'mansil-secret-key-change-in-prod'`. Verify `.env` files are gitignored. Check for any `.env` files committed to git history.
2. **Authentication flaws** — Review `apps/api/src/modules/auth/auth.service.ts` and `jwt.strategy.ts`. Check password hashing rounds (bcrypt cost), token expiration, refresh token mechanism (or lack thereof), brute-force protection on login.
3. **Authorization gaps** — For every controller in `apps/api/src/modules/*/`, verify that `@UseGuards(JwtAuthGuard)` is applied where needed. Check for missing role-based access control — can a TENANT delete properties? Can any authenticated user access any customer?
4. **CORS configuration** — Review `apps/api/src/main.ts` for `enableCors()` — check if origin is restricted or wide open.
5. **Input validation** — Review every DTO in `apps/api/src/modules/*/dto/`. Check for missing validations, SQL injection vectors, NoSQL injection, command injection.
6. **Token storage** — Check `apps/web/lib/client.ts` for localStorage usage (XSS risk). Compare with `apps/mobile` which uses Expo Secure Store.
7. **HTTPS enforcement** — Is there any HTTPS redirect or HSTS header?
8. **Rate limiting** — Any throttling on login, register, or API endpoints?
9. **Security headers** — Helmet.js or manual headers (X-Content-Type-Options, X-Frame-Options, CSP, etc.)?
10. **Dependency vulnerabilities** — Run `npm audit` at root and report findings.
11. **File upload security** — Check `packages/ui/src/file-upload.tsx` and any backend upload handlers for file type validation, size limits, path traversal.
12. **BigInt JSON serialization** — Review the monkey-patch in `main.ts` for safety.

---

### Agent 2: `api-quality-auditor`
**Scope:** Backend API code quality and correctness.

1. **Every controller** in `apps/api/src/modules/*/` — verify proper HTTP methods, status codes, error handling, response types.
2. **Every service** — check business logic correctness, proper Prisma usage, transaction handling, error propagation.
3. **DTOs** — completeness, proper decorators (`@IsString()`, `@IsOptional()`, `@IsEnum()`, etc.), `whitelist` enforcement.
4. **Prisma service** — `apps/api/src/prisma.service.ts` — proper connection lifecycle (`onModuleInit`, `onModuleDestroy`), connection pooling.
5. **Error handling** — are NestJS exception filters used? Do unhandled errors leak stack traces?
6. **API consistency** — naming conventions, response shapes, pagination patterns, proper use of query params vs body.
7. **N+1 query problems** — check Prisma `include` usage for over-fetching or missing relations.
8. **Module structure** — proper dependency injection, circular dependencies, module imports.
9. **Missing CRUD operations** — for each resource (properties, customers, contracts, ledger, schedule, requests, community), verify all necessary endpoints exist and work.
10. **The `real-transaction` module** — separate from modules structure, verify it's properly integrated.

---

### Agent 3: `frontend-web-auditor`
**Scope:** Next.js web application quality.

1. **Every page** in `apps/web/app/` — verify rendering, proper data fetching, loading/error states.
2. **API client** (`apps/web/lib/client.ts`) — error handling, token refresh logic, request/response interceptors, base URL configuration.
3. **API functions** (`apps/web/lib/api/`) — every function: proper typing, error handling, correct endpoints.
4. **Components** (`apps/web/components/`) — prop types, accessibility (a11y), responsive design, proper key usage in lists.
5. **State management** — Zustand stores: proper patterns, no stale state, no memory leaks.
6. **Authentication flow** — login/register pages, protected route handling, redirect logic, token persistence.
7. **Forms** — validation (client-side), error display, submission handling, loading states.
8. **Performance** — bundle size concerns, unnecessary re-renders, proper use of `use client` vs server components, image optimization.
9. **SEO** — meta tags, OpenGraph, proper `<head>` management.
10. **Tailwind/CSS** — unused styles, responsive breakpoints, dark mode support consistency.
11. **Map integration** — Leaflet setup, marker clustering, proper cleanup on unmount.
12. **Calendar integration** — FullCalendar configuration, event handling.
13. **Korean localization** — date formats, currency formats (KRW), address formats, phone formats.

---

### Agent 4: `mobile-auditor`
**Scope:** React Native / Expo mobile application quality.

1. **Navigation** — Expo Router setup in `apps/mobile/app/`, proper tab configuration, deep linking.
2. **Authentication** — login flow, Expo Secure Store usage, token management, session persistence.
3. **API integration** — Axios setup, base URL config, interceptors, offline handling.
4. **Components** — React Native best practices, proper use of `FlatList` vs `ScrollView`, keyboard handling.
5. **Maps** — React Native Maps setup, marker rendering, clustering, permissions.
6. **Performance** — unnecessary re-renders, proper list virtualization, image caching, bundle size.
7. **Platform differences** — iOS vs Android specific code, safe area handling, status bar.
8. **Expo configuration** — `app.json` completeness (icons, splash, permissions, plugins).
9. **Nativewind** — proper Tailwind usage in React Native, style consistency with web.
10. **State management** — Zustand stores, proper patterns for mobile.

---

### Agent 5: `database-auditor`
**Scope:** Database schema, data integrity, and performance.

1. **Schema review** (`packages/database/prisma/schema.prisma`) — every model, every field:
   - Proper types and constraints
   - Required vs optional fields correctness
   - Default values
   - Unique constraints where needed
   - Cascade delete behavior (check `onDelete` for all relations)
   - Missing indexes for query patterns
2. **Data integrity** — are there fields that should be unique but aren't? Phone numbers, emails, etc.
3. **Seed data** (`packages/database/prisma/seed.ts`) — quality, realism, coverage of all models.
4. **Migration strategy** — are there migration files? Is there a migration workflow?
5. **SQLite limitations for production** — concurrent writes, file locking, max DB size, lack of `ALTER COLUMN`, no built-in user management.
6. **BigInt usage** — verify which fields use BigInt and if it's necessary/correct (Korean Won amounts).
7. **Query performance** — review existing indexes against actual query patterns in services.
8. **Soft delete** — is there a soft delete pattern? Should there be for contracts, customers?
9. **Audit trail** — `createdAt`/`updatedAt` on all models? Who modified what?
10. **Data types** — JSON strings vs proper relations (e.g., `preferences` field in Customer).

---

### Agent 6: `privacy-compliance-auditor`
**Scope:** Data privacy, GDPR/PIPA (Korean privacy law) compliance.

1. **Personal data inventory** — catalogue every field across all models that contains PII (names, emails, phones, addresses). Classify sensitivity level.
2. **Korean PIPA compliance** — Personal Information Protection Act requirements:
   - Consent mechanism for data collection
   - Purpose limitation
   - Data minimization
   - Right to access/correct/delete personal data
   - Data retention policies
   - Cross-border data transfer rules
3. **Data exposure** — do API responses return more PII than the frontend needs? Check every controller's response shape.
4. **Logging** — is PII logged anywhere? Check for `console.log` statements that might log passwords, tokens, or personal data.
5. **Data deletion** — can users request account deletion? Is cascading deletion implemented?
6. **Password handling** — is the password field excluded from API responses? Check Prisma `select` statements.
7. **Cookie/tracking** — any analytics, cookies, or tracking without consent?
8. **Third-party data sharing** — any external API calls that send user data?
9. **Privacy policy** — is there a privacy policy page or link in the app?
10. **Data encryption** — is data encrypted at rest? In transit?

---

### Agent 7: `devops-deployment-auditor`
**Scope:** Build system, deployment readiness, infrastructure.

1. **Turbo configuration** (`turbo.json`) — build pipeline, caching strategy, task dependencies.
2. **Package.json scripts** — all workspace scripts work correctly. Run `npm run build` and report results.
3. **TypeScript compilation** — strict mode, any `@ts-ignore` or `any` usage across the codebase.
4. **Environment configuration** — `.env` management, missing `.env.example` files, env validation at startup.
5. **Docker readiness** — create a recommended Dockerfile and docker-compose.yml structure.
6. **Database migration strategy** — Prisma migrate workflow, production migration plan.
7. **Production SQLite concerns** — file permissions, backup strategy, WAL mode, concurrent access.
8. **Logging** — structured logging, log levels, no sensitive data in logs.
9. **Health checks** — API health endpoint, database connectivity check.
10. **Error monitoring** — Sentry or similar integration recommendations.
11. **CI/CD** — is there a CI pipeline? If not, recommend one (GitHub Actions).
12. **Node.js version** — verify engine requirements, `.nvmrc` or `engines` field.
13. **Production build optimization** — Next.js output mode, NestJS build optimization, tree shaking.
14. **Process management** — PM2 or similar for the API, graceful shutdown handling.

---

### Agent 8: `test-coverage-auditor`
**Scope:** Verify existing tests and identify critical gaps.

1. **Run all existing tests** — `npm run test` from root. Report pass/fail status.
2. **Test inventory** — list every test file that exists. Note: only `apps/api/src/modules/requests/requests.service.spec.ts` is known to exist.
3. **Critical missing tests** — for each module, list what unit and integration tests MUST exist before production:
   - Auth: login, register, token validation, password hashing
   - Properties: CRUD operations, authorization
   - Customers: CRUD, filtering, authorization
   - Contracts: lifecycle (draft → signed → completed), financial calculations
   - Ledger: transaction recording, stats calculation
   - Community: post/comment CRUD, authorization
4. **Frontend test gaps** — what component and page tests are needed for `apps/web`?
5. **API integration tests** — are there end-to-end tests using supertest?
6. **Test infrastructure** — is the test setup correct? Are mocks properly configured?
7. **Write a test plan** — prioritized list of tests to write, ordered by risk.

---

## Coordination Instructions

1. Create all 8 tasks first, then spawn all 8 agents in parallel using worktree isolation.
2. Each agent must read the actual source files — never assume, always verify against the code.
3. Each agent produces a report as a markdown file at the project root: `AUDIT_REPORT_<agent-name>.md`.
4. After all agents complete, compile a master summary: `AUDIT_MASTER_REPORT.md` with:
   - Total findings by severity (CRITICAL / HIGH / MEDIUM / LOW / INFO)
   - Top 10 must-fix items before production launch
   - Estimated effort for each fix (small/medium/large)
   - A go/no-go recommendation

**The quality bar: if this audit says "GO", the service must be safe to launch immediately.**
