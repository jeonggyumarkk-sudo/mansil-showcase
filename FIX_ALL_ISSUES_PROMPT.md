# MANSIL PLATFORM — FIX ALL 264 AUDIT FINDINGS

## DIRECTIVE

Create a team called `fix-all-issues` with **10 agents**. Execute in **3 sequential phases**. Within each phase, spawn the designated agents **in parallel**, each in its own **worktree** for isolation. After ALL agents in a phase complete, **merge their worktree branches into main** before starting the next phase.

Here are the 10 agents and their designations:

| # | Agent Name | Phase | Designated Task |
|---|-----------|-------|-----------------|
| 1 | `foundation-config` | 1 | Fix all root-level config files (.gitignore, .env, turbo.json, package.json, .nvmrc) |
| 2 | `schema-and-types` | 1 | Fix database schema (enums, BigInt, indexes, cascades, soft delete, audit trail, seed, migrations) and shared types |
| 3 | `test-infrastructure` | 1 | Fix broken test runners (Jest + Vitest), create shared test utilities |
| 4 | `api-core` | 2 | Overhaul main.ts, auth module, singleton Prisma, config, health checks, logging, security middleware |
| 5 | `api-modules` | 2 | Fix all non-auth API modules: DTOs, guards, ownership, 404s, missing CRUD, pagination, PII minimization |
| 6 | `frontend-web` | 2 | Fix all 55 Next.js web findings: URLs, auth, forms, XSS, i18n, build, types, SEO, components |
| 7 | `mobile-fix` | 2 | Fix all 39 Expo/RN mobile findings: Nativewind, identifiers, auth, SafeArea, maps, API client |
| 8 | `privacy-compliance` | 3 | Implement PIPA compliance: privacy policy, consent, user rights endpoints, account deletion |
| 9 | `test-writer` | 3 | Write ~150 tests for all modules (unit, integration, E2E, frontend, shared packages) |
| 10 | `devops-deploy` | 3 | Create Docker, CI/CD, ESLint, process management, deployment docs |

**Phase execution order:**
1. **Phase 1:** Spawn agents 1, 2, 3 in parallel → wait for all → merge into main
2. **Phase 2:** Spawn agents 4, 5, 6, 7 in parallel → wait for all → merge into main (merge agent 4 before agent 5 if conflicts)
3. **Phase 3:** Spawn agents 8, 9, 10 in parallel → wait for all → merge into main
4. **After all phases:** Run `npm run build` and `npm run test` to verify. Create `FIX_COMPLETION_REPORT.md`.

---

## CONTEXT

The project is at `/home/mansil/mansil-platform/`. There are 8 audit reports at the project root that each agent MUST read before starting work:

- `AUDIT_MASTER_REPORT.md` — Summary + top 10 + roadmap
- `AUDIT_REPORT_security.md` — 22 findings (SEC-001 to SEC-022)
- `AUDIT_REPORT_api-quality.md` — 38 findings (API-001 to API-038)
- `AUDIT_REPORT_frontend-web.md` — 55 findings (WEB-001 to WEB-055)
- `AUDIT_REPORT_mobile.md` — 39 findings (MOB-001 to MOB-039)
- `AUDIT_REPORT_database.md` — 29 findings (DB-001 to DB-029)
- `AUDIT_REPORT_privacy.md` — 20 findings (PRV-001 to PRV-023)
- `AUDIT_REPORT_devops.md` — 27 findings (OPS-001 to OPS-027)
- `AUDIT_REPORT_tests.md` — 34 findings (TST-001 to TST-113)

**Platform:**
- **Monorepo:** Turbo + npm workspaces
- **Apps:** `apps/api` (NestJS 10), `apps/web` (Next.js 14), `apps/mobile` (Expo/React Native)
- **Packages:** `packages/database` (Prisma 5/SQLite), `packages/types`, `packages/utils`, `packages/ui`
- **Auth:** JWT + Passport + bcrypt
- **DB:** SQLite via Prisma (keep SQLite for now but harden it; document PostgreSQL migration path)

---

## AGENT TASK SPECIFICATIONS

Every agent MUST:
- Read the relevant audit report(s) listed in its task before starting
- Address **100%** of the finding IDs assigned to it — no exceptions
- Only modify files within its **file ownership scope**
- Run `npx tsc --noEmit` in its workspace to verify TypeScript compiles
- Report every finding ID it resolved upon completion

---

### Agent 1: `foundation-config`
**Phase:** 1
**File ownership:** Root-level config files, `packages/database/package.json`, `packages/ui/package.json`, `apps/web/package.json` (scripts only)
**Required reading:** `AUDIT_REPORT_devops.md`, `AUDIT_REPORT_security.md`
**Assigned findings:** OPS-001, OPS-002, OPS-003, OPS-009, OPS-018, OPS-019, OPS-022, OPS-025, OPS-026, OPS-027, SEC-020, TST-003

Do ALL of the following:

1. **Create root `.gitignore`** (OPS-018, SEC-020):
   ```
   node_modules/
   dist/
   .next/
   .turbo/
   *.db
   .env
   .env.local
   .env.*.local
   .DS_Store
   *.tsbuildinfo
   coverage/
   .expo/
   ```

2. **Create `.env.example` files** (OPS-009):
   - Root: empty (reference only)
   - `apps/api/.env.example`:
     ```
     DATABASE_URL="file:../../../packages/database/prisma/dev.db"
     JWT_SECRET="generate-a-256-bit-random-secret-here"
     JWT_EXPIRATION="60m"
     PORT=3001
     CORS_ORIGINS="http://localhost:3000"
     NODE_ENV="development"
     ```
   - `apps/web/.env.example`:
     ```
     NEXT_PUBLIC_API_URL="http://localhost:3001"
     ```
   - `packages/database/.env.example`:
     ```
     DATABASE_URL="file:./dev.db"
     ```

3. **Create `.nvmrc`** (OPS-019): Content `22`

4. **Fix root `package.json`** (OPS-003, OPS-019, OPS-001):
   - Pin turbo: `"turbo": "^2.7.4"` (not `"latest"`)
   - Add engines: `"engines": { "node": ">=22.0.0", "npm": ">=10.0.0" }`
   - Fix packageManager to match actual: `"packageManager": "npm@10.9.4"`
   - Add postinstall: `"postinstall": "chmod +x node_modules/.bin/* 2>/dev/null || true"`

5. **Fix `turbo.json`** (OPS-002):
   - Add `test` task: `{ "dependsOn": ["^build"], "outputs": ["coverage/**"], "cache": false }`
   - Add `lint` task: `{ "dependsOn": ["^build"], "outputs": [] }`

6. **Fix `packages/database/package.json`** (OPS-026):
   - Build: `"build": "prisma generate && tsc"`
   - Add: `"postinstall": "prisma generate"`
   - Add: `"migrate:dev": "prisma migrate dev"`, `"migrate:deploy": "prisma migrate deploy"`, `"seed": "ts-node prisma/seed.ts"`

7. **Fix `packages/ui/package.json`** (OPS-025): Add build script if missing.

8. **Add `"test": "vitest run"` to `apps/web/package.json`** (TST-003).

---

### Agent 2: `schema-and-types`
**Phase:** 1
**File ownership:** `packages/database/prisma/schema.prisma`, `packages/database/prisma/seed.ts`, `packages/types/src/**`
**Required reading:** `AUDIT_REPORT_database.md`
**Assigned findings:** DB-002, DB-003, DB-004, DB-005, DB-006, DB-009, DB-011, DB-012, DB-013, DB-014, DB-015, DB-016, DB-017, DB-018, DB-019, DB-020, DB-021, DB-023

Do ALL of the following in `schema.prisma`:

1. **Define Prisma enums** (DB-018) for ALL string-typed enum fields:
   ```prisma
   enum Role { ADMIN AGENT LANDLORD TENANT }
   enum PropertyType { ONE_ROOM TWO_ROOM OFFICE STORE APARTMENT VILLA ETC }
   enum TransactionType { MONTHLY JEONSE SALE SHORT_TERM }
   enum PropertyStatus { AVAILABLE CONTRACT_PENDING CONTRACTED UNAVAILABLE }
   enum ContractType { RENT JEONSE SALE }
   enum ContractStatus { DRAFT SIGNED ACTIVE COMPLETED CANCELLED }
   enum LedgerType { INCOME EXPENSE }
   enum CustomerStatus { ACTIVE CONTRACTED INACTIVE }
   enum CustomerPriority { HOT WARM COLD }
   enum PostCategory { QNA NAENWAYO NOTICE FREE }
   ```
   Update all model fields to use these enums with proper `@default()` values.

2. **Standardize financial fields to BigInt** (DB-003): Property model — change `deposit Int`, `monthlyRent Int`, `maintenanceFee Int`, `salePrice Int` → all `BigInt`.

3. **Add explicit `onDelete` to ALL relations** (DB-004, DB-005):
   - Contract → Property/Customer/User: `onDelete: Restrict`
   - ClientRequest → User: `onDelete: Cascade`
   - Property → User: `onDelete: Restrict`
   - Customer → User: `onDelete: Cascade`
   - Post → User: `onDelete: Cascade`
   - Comment → User: `onDelete: SetNull` (make authorId optional)
   - PropertyImage → Property: keep `onDelete: Cascade`
   - Comment → Post: keep `onDelete: Cascade`

4. **Add missing indexes** (DB-009, DB-013):
   - `ClientRequest`: `@@index([agentId])`
   - `Contract`: `@@index([status])`, `@@index([endDate])`, `@@index([agentId])`
   - `Customer`: `@@index([nextFollowupDate])`, `@@index([agentId])`
   - `LedgerTransaction`: `@@index([agentId, date])`
   - `RealTransaction`: `@@index([type])`
   - `Property`: `@@index([agentId])`
   - `Post`: `@@index([authorId])`, `@@index([category])`

5. **Add soft delete** (DB-014) to Customer, Contract, Property: `deletedAt DateTime?` + `@@index([deletedAt])`

6. **Add AuditLog model** (DB-015) with entityType, entityId, action, changes, userId, createdAt.

7. **Add timestamps** (DB-016, DB-017) to PropertyImage and RealTransaction.

8. **Fix Customer model** (DB-019, DB-020, DB-011): Make phone required, add `@@unique([agentId, phone])`, change preferences to `Json?`.

9. **Rename area** (DB-021): `area Float` → `areaPyeong Float`.

10. **Fix seed data** (DB-006, DB-023): Hash password with bcrypt. Add realistic Korean seed data for ALL models.

11. **Initialize migrations** (DB-002): `npx prisma migrate dev --name init`

12. **Update `packages/types`**: Match all schema changes — BigInt fields, enums, new models.

---

### Agent 3: `test-infrastructure`
**Phase:** 1
**File ownership:** `apps/api/jest.config.js`, `apps/api/test/utils/`, `apps/web/vitest.config.ts`, `apps/web/vitest.setup.ts`, `apps/mobile/jest.config.js`
**Required reading:** `AUDIT_REPORT_tests.md`
**Assigned findings:** TST-001, TST-002, TST-004, TST-110, TST-111, TST-112

1. **Fix API Jest config** (TST-001, TST-110): Use `transform` with `require.resolve('ts-jest')` instead of preset. Add proper coverage config and thresholds.

2. **Fix Web Vitest** (TST-002): Install missing `@rollup/rollup-linux-x64-gnu` native module.

3. **Create shared test utilities** (TST-112) in `apps/api/test/utils/`:
   - `prisma.mock.ts` — Mock PrismaService factory
   - `auth.helper.ts` — JWT token generator for tests
   - `app.factory.ts` — Test module builder
   - `index.ts` — Re-exports

4. **Add mobile test config** (TST-004): Install `jest-expo`, create jest config.

5. Verify both runners execute without crashing.

---

### Agent 4: `api-core`
**Phase:** 2
**File ownership:** `apps/api/src/main.ts`, `apps/api/src/prisma.service.ts`, `apps/api/src/common/`, `apps/api/src/modules/auth/`, `apps/api/src/app.module.ts`, new: `database.module.ts`, `health/`, `config/`
**Required reading:** `AUDIT_REPORT_security.md`, `AUDIT_REPORT_api-quality.md`, `AUDIT_REPORT_devops.md`, `AUDIT_REPORT_privacy.md`
**Assigned findings:** SEC-001, SEC-004, SEC-006, SEC-008, SEC-010, SEC-011, SEC-012, SEC-019, API-005, API-006, API-007, API-012, API-017, API-019, API-020, API-029, API-030, API-034, API-037, OPS-007, OPS-010, OPS-014, OPS-015, OPS-023, PRV-017, PRV-018

**main.ts overhaul:**
1. Install: `@nestjs/config @nestjs/throttler @nestjs/terminus helmet nestjs-pino pino-http`
2. Add `helmet()` (SEC-008)
3. Restrict CORS origins from env (SEC-004)
4. Enable graceful shutdown (OPS-023)
5. Port from env (OPS-022)
6. BigInt → string serialization (SEC-019)
7. Create global exception filter — no stack traces in prod (API-017)
8. Add `forbidNonWhitelisted: true` to ValidationPipe (API-034)
9. Configure structured logging with nestjs-pino (OPS-014)

**Singleton Prisma (API-019):**
1. Create global `DatabaseModule` providing PrismaService
2. Remove PrismaService from ALL other module providers

**Config (OPS-009, OPS-010):**
1. `ConfigModule.forRoot({ isGlobal: true })`
2. Validate `JWT_SECRET` and `DATABASE_URL` at startup

**Auth module rewrite:**
1. JWT secret from env, reject default (SEC-001, OPS-010)
2. Configurable expiration, default 15m
3. Create `LoginDto` and `RegisterDto` with class-validator (SEC-012, API-007)
4. Fix login: throw `UnauthorizedException` not return 200 (SEC-011, API-006)
5. Fix register: `ConflictException` for duplicates (API-020)
6. Exclude password from register response (API-012, PRV-017)
7. Remove `@ts-ignore`, properly type queries (OPS-007, API-030)
8. Implement refresh token flow (SEC-010)
9. Rate limit auth routes: 5 attempts/min
10. ThrottlerModule in AppModule (SEC-006)

**Health check (OPS-015):** Create health module with `@nestjs/terminus`, `GET /health`.

---

### Agent 5: `api-modules`
**Phase:** 2
**File ownership:** ALL `apps/api/src/modules/*/` EXCEPT `auth/`, plus `apps/api/src/real-transaction/`
**Required reading:** `AUDIT_REPORT_api-quality.md`, `AUDIT_REPORT_security.md`, `AUDIT_REPORT_privacy.md`, `AUDIT_REPORT_database.md`
**Assigned findings:** SEC-003, SEC-005, SEC-013, SEC-015, SEC-016, SEC-017, API-002, API-003, API-004, API-008, API-009, API-010, API-011, API-013, API-014, API-015, API-016, API-018, API-021, API-022, API-023, API-024, API-025, API-026, API-027, API-028, API-031, API-032, API-036, API-038, DB-001, DB-007, DB-008, DB-010, PRV-004, PRV-008, PRV-009, PRV-010, PRV-011, PRV-012

For EVERY module:

1. **Add `@UseGuards(JwtAuthGuard)`** to controllers missing it (SEC-003, API-002/003/004): Properties, Requests, RealTransaction controllers.

2. **Create proper DTOs** for ALL endpoints (SEC-015, API-008/009/010):
   - `CreatePropertyDto`, `UpdatePropertyDto`
   - `CreateContractDto`, `UpdateContractDto`
   - `CreateRequestDto`
   - Update `CreateCustomerDto` (fix `display_name`, use `@IsEnum()`)
   - Update `CreateLedgerDto` (use `@IsEnum()`)

3. **Add ownership checks** (SEC-005, API-016, DB-008): `where: { id, agentId }` in findOne/update/remove.

4. **Add 404 handling** (API-015): Throw `NotFoundException` when record not found.

5. **Fix mass assignment** (SEC-016, API-011): Explicitly map fields, don't spread `...data`.

6. **Remove hardcoded demo agents** (SEC-013, API-013/014, DB-007): Use authenticated user ID.

7. **Sanitize errors** (SEC-017, API-018): No `details: error` in responses.

8. **Fix SQL injection** (DB-001): Replace `$queryRawUnsafe` with `$queryRaw` tagged template in `getClusters()`.

9. **Add missing CRUD** (API-021/022/023/024/025): Delete for contracts, update/delete for ledger, posts, comments, requests.

10. **Add pagination** (API-027, API-038): `page`/`limit` params, return `{ data, total, page, limit }`.

11. **Fix data leak** (DB-010): Filter RequestsService.findAll by agentId.

12. **Minimize PII** (PRV-004/008/009/010): Use `select` clauses in includes.

13. **Fix view count** (API-028): Return updated value.

14. **Remove PrismaService from module providers** — it comes from global DatabaseModule.

---

### Agent 6: `frontend-web`
**Phase:** 2
**File ownership:** `apps/web/` (everything)
**Required reading:** `AUDIT_REPORT_frontend-web.md`
**Assigned findings:** ALL WEB-001 through WEB-055 (55 findings), OPS-004, OPS-005

Fix ALL of the following:

1. **Replace ALL hardcoded localhost URLs** (WEB-001/002/003/004) with `process.env.NEXT_PUBLIC_API_URL`. Centralize all API calls through `client.ts`.
2. **Create `lib/api/community.ts`** using shared client. Remove inline `fetch()` from community pages.
3. **Add 401 handling** (WEB-005): Clear token, redirect to `/login`.
4. **Add request timeout** (WEB-008): AbortController, 15s default.
5. **Create `middleware.ts`** (WEB-009): Protect `(main)/*` routes.
6. **Fix token key** (WEB-010): Standardize on `access_token` everywhere.
7. **Create registration page** (WEB-011) at `app/(auth)/register/page.tsx`.
8. **Replace all `alert()`** (WEB-012/032) with toast (install `sonner` or `react-hot-toast`).
9. Add logout mechanism.
10. **Dashboard** (WEB-014): Fetch actual user/stats, remove hardcoded data.
11. **Use `next/image`** (WEB-015) instead of `<img>`.
12. **Fix image type** (WEB-016/054): Use shared `@mansil/types`.
13. **Fix property registration** (WEB-017): Remove hardcoded lat/lng.
14. **Fix proposal layout** (WEB-018): Separate route group or print-only.
15. **Remove `force-dynamic` from layouts** (WEB-020).
16. **Add `error.tsx` / `loading.tsx`** (WEB-021/037) to key routes.
17. **Fix `formatArea`** (WEB-022): Standardize utilities.
18. **Add empty states** (WEB-023/024).
19. **Fix mobile menu** (WEB-025).
20. **Fix dead nav links** (WEB-026/027).
21. **Implement or remove Zustand** (WEB-028).
22. **Add form validation** (WEB-029/030): Required fields, number ranges, phone pattern.
23. **Remove hardcoded agentId** (WEB-031).
24. **Wire FileUpload** (WEB-033).
25. **Debounce map** (WEB-034): 300-500ms.
26. **Fix stale closure** (WEB-035): useRef or useCallback.
27. **Fix dynamic import** (WEB-036): Static import.
28. **Root metadata** (WEB-038): OG, Twitter, favicon, ko_KR.
29. **Per-page metadata** (WEB-039): `generateMetadata()` on key pages.
30. **Fix Leaflet XSS** (WEB-042): Sanitize popup HTML.
31. **Bundle marker icons** (WEB-043): Move to `public/`.
32. **FullCalendar Korean locale** (WEB-045): Import `koLocale`.
33. **Calendar event handlers** (WEB-046).
34. **Translate community to Korean** (WEB-048).
35. **Fix date formatting** (WEB-049): Always use `'ko-KR'`.
36. **Standardize currency** (WEB-050).
37. **Label mock data** (WEB-052): "목업 데이터 (개발 중)".
38. **Replace `any` types** (WEB-053): Proper interfaces.
39. **Next.js config** (WEB-055): Security headers, image domains, `poweredByHeader: false`.
40. **Fix web build** (OPS-004): Debug React SSR error #31.
41. **Install ESLint** (OPS-005): `eslint eslint-config-next` + `.eslintrc.json`.
42. **Add alt attributes** (WEB-019), remove unused CSS vars (WEB-041), fix FullCalendar styles (WEB-047).

---

### Agent 7: `mobile-fix`
**Phase:** 2
**File ownership:** `apps/mobile/` (everything)
**Required reading:** `AUDIT_REPORT_mobile.md`
**Assigned findings:** ALL MOB-001 through MOB-039 (39 findings)

Fix ALL of the following:

1. **Fix Nativewind v4** (MOB-036/037): Metro plugin, remove Babel plugin, fix TS types, shared theme.
2. **Fix app.json** (MOB-032/033/034/035): bundleIdentifier, package, permissions, app name "Mansil".
3. **Register map tab** (MOB-001), rename tabs to Korean (MOB-002), replace boilerplate (MOB-003), remove EditScreenInfo (MOB-017).
4. **Auth guard** (MOB-006): Redirect to login if no token in `_layout.tsx`.
5. **Fix auth flow** (MOB-007/008/009): Move nav out of store, check token expiry, add 401 handling.
6. **Centralize API** (MOB-012/013): Create `lib/api.ts` with env-based URL, shared Axios, auth interceptor, 401 interceptor.
7. **Remove duplicate types** (MOB-015): Import from `@mansil/types`.
8. **Standardize styling** (MOB-016): All Nativewind, remove StyleSheet.
9. **Add KeyboardAvoidingView** (MOB-018) to login.
10. **Add property navigation** (MOB-020): onPress → detail screen.
11. **Fix login errors** (MOB-010/011): email keyboard type, differentiate error types.
12. **Fix maps** (MOB-021/022/023/024): Remove PROVIDER_GOOGLE or add key, add location permissions, fitToCoordinates.
13. **Fix effects** (MOB-025/026/027): Token dependency, AbortController cleanup, shared data store.
14. **Add SafeAreaView** (MOB-029) to all screens.
15. **Add StatusBar** (MOB-030) to root layout.
16. **Android back handler** (MOB-031) on login.
17. **Zustand persist** (MOB-038/039): SecureStore adapter, global error state.

---

### Agent 8: `privacy-compliance`
**Phase:** 3
**File ownership:** New files only — privacy/terms pages, new API module for user rights, consent model additions
**Required reading:** `AUDIT_REPORT_privacy.md`
**Assigned findings:** PRV-002, PRV-003, PRV-005, PRV-006, PRV-007, PRV-014, PRV-019, PRV-021

1. **Add ConsentRecord model** to schema with userId, type, version, accepted, ipAddress, createdAt.

2. **Create privacy policy page** (PRV-021) at `apps/web/app/(main)/privacy/page.tsx`: Full Korean 개인정보 처리방침 covering all 9 PIPA Article 30 requirements.

3. **Create terms of service page** at `apps/web/app/(main)/terms/page.tsx`.

4. **Add consent collection** (PRV-002): Checkboxes in registration, API endpoint to store consent.

5. **Create user rights endpoints** (PRV-005):
   - `GET /users/me` — View profile
   - `PATCH /users/me` — Update profile
   - `DELETE /users/me` — Account deletion
   - `GET /users/me/data` — Data export

6. **Implement account deletion** (PRV-014): Anonymize user, cascade/anonymize related data.

7. **Document retention policies** (PRV-006) in privacy policy.

8. **Add footer links** to privacy and terms pages.

---

### Agent 9: `test-writer`
**Phase:** 3
**File ownership:** `*.spec.ts` and `*.test.ts` files ONLY — never modify source files
**Required reading:** `AUDIT_REPORT_tests.md`, plus all other audit reports for understanding the codebase
**Assigned findings:** TST-010, TST-011, TST-012, TST-013, TST-020, TST-021, TST-030, TST-031, TST-040, TST-041, TST-050, TST-051, TST-060, TST-061, TST-062, TST-070, TST-071, TST-080, TST-081, TST-082, TST-090, TST-100, TST-113

Write ALL of the following tests:

**API Unit Tests (Jest):**
1. `auth.service.spec.ts` — validateUser (valid/invalid/missing), login, register, duplicate handling
2. `auth.controller.spec.ts` — login success/failure, register success
3. `properties.service.spec.ts` — full CRUD + getClusters
4. `customers.service.spec.ts` — CRUD with agent scoping, ownership verification
5. `contracts.service.spec.ts` — CRUD with agentId, relations
6. `ledger.service.spec.ts` — create, findAll, getMonthlyStats (income/expense/empty/boundaries)
7. `posts.service.spec.ts` — create, findAll with category, findOne with view increment
8. `comments.service.spec.ts` — create with post association
9. `schedule.service.spec.ts` — getEvents from contracts + customers
10. Complete `requests.service.spec.ts` — add CRUD + findMatches edge cases

**API E2E Tests:**
11. `test/auth.e2e-spec.ts` — register → login → protected route → 401 without token
12. `test/app.e2e-spec.ts` — bootstrap, health endpoint

**Web Tests (Vitest):**
13. `login/page.test.tsx` — render, success, failure
14. `PropertyCard.test.tsx` — render, formatting

**Package Tests:**
15. `packages/utils` — formatCurrency, formatArea, formatDate, isValidEmail, isValidPhoneNumber, isValidPassword

**Target: ~150 tests.**

---

### Agent 10: `devops-deploy`
**Phase:** 3
**File ownership:** `Dockerfile.*`, `docker-compose*.yml`, `.dockerignore`, `.github/`, `ecosystem.config.js`, `DEPLOYMENT.md`, `apps/web/.eslintrc.json`
**Required reading:** `AUDIT_REPORT_devops.md`
**Assigned findings:** OPS-004, OPS-011, OPS-013, OPS-016, OPS-017, OPS-020, OPS-024

1. **Create `.dockerignore`**: Exclude node_modules, .git, .next, dist, *.db, .env, coverage, .turbo.

2. **Create `Dockerfile.api`**: Multi-stage (install → build → production Alpine).

3. **Create `Dockerfile.web`**: Multi-stage with Next.js standalone output.

4. **Create `docker-compose.yml`**: Local dev with api + web services.

5. **Create `docker-compose.prod.yml`**: Production overrides (restart, limits).

6. **Create CI/CD** `.github/workflows/ci.yml`:
   ```yaml
   name: CI
   on: [push, pull_request]
   jobs:
     build-and-test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with: { node-version: 22, cache: npm }
         - run: npm ci
         - run: npx prisma generate --schema=packages/database/prisma/schema.prisma
         - run: npx turbo run build
         - run: npx turbo run test
         - run: npx turbo run lint
   ```

7. **Create `ecosystem.config.js`** for PM2.

8. **Add `output: 'standalone'`** to `next.config.js` (OPS-020).

9. **Create `DEPLOYMENT.md`** (OPS-013): WAL mode, busy timeout, backup strategy, file permissions, PostgreSQL migration plan.

---

## FINAL VERIFICATION

After all 3 phases complete and all branches are merged:

1. Run `npm install` from root
2. Run `npx prisma generate` in `packages/database`
3. Run `npm run build` — ALL packages must build successfully
4. Run `npm run test` — ALL tests must pass
5. Create `FIX_COMPLETION_REPORT.md` mapping every audit finding ID (SEC-*, API-*, WEB-*, MOB-*, DB-*, PRV-*, OPS-*, TST-*) to its resolution status (FIXED / PARTIALLY FIXED / DEFERRED with reason)

**The quality bar: after this process, re-running the original audit should produce zero CRITICAL and zero HIGH findings.**
