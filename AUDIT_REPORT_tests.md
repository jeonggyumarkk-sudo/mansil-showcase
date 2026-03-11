# Test Coverage Audit Report — Mansil Platform

**Auditor:** test-coverage-auditor
**Date:** 2026-02-26
**Scope:** Full monorepo (`apps/api`, `apps/web`, `apps/mobile`, `packages/*`)

---

## Executive Summary

The Mansil Platform has **virtually no test coverage**. Across the entire monorepo, only **2 test files** exist in application code:

| App/Package | Test Files | Tests | Coverage |
|-------------|-----------|-------|----------|
| `apps/api` | 1 (`requests.service.spec.ts`) | 3 | ~2% of services |
| `apps/web` | 1 (`formatters.test.ts`) | 6 | ~5% of utilities |
| `apps/mobile` | 0 | 0 | 0% |
| `packages/utils` | 0 | 0 | 0% |
| `packages/types` | 0 | 0 | N/A |
| `packages/database` | 0 | 0 | 0% |
| **Total** | **2** | **9** | **~1%** |

**Verdict: NOT production-ready.** Critical business logic (auth, contracts, ledger, community) has zero test coverage. The test infrastructure exists but is broken due to dependency issues.

---

## Section 1: Test Execution Results

### TST-001: API Test Runner (Jest) — Cannot Execute
- **Severity:** CRITICAL
- **Status:** FAIL
- **File:** `apps/api/jest.config.js:1`
- **Description:** Running `jest` in `apps/api` fails with `Preset ts-jest not found relative to rootDir`. The `ts-jest` package is installed at the monorepo root (`node_modules/ts-jest`) but Jest cannot resolve it from the `apps/api` working directory because `apps/api/node_modules` does not exist (hoisted workspace). Additionally, the `jest` binary at root has no execute permissions.
- **Fix:** Either (a) add `ts-jest` and `jest` to `apps/api/devDependencies` and run `npm install` so they resolve locally, or (b) update `jest.config.js` to use `transform` instead of `preset` with an absolute path to `ts-jest`:
  ```js
  // jest.config.js — option (b)
  const tsJest = require.resolve('ts-jest');
  module.exports = {
    // Remove: preset: 'ts-jest',
    transform: { '^.+\\.ts$': tsJest },
    // ...rest
  };
  ```

### TST-002: Web Test Runner (Vitest) — Cannot Execute
- **Severity:** CRITICAL
- **Status:** FAIL
- **File:** `apps/web/vitest.config.ts:1`
- **Description:** Running `vitest` fails with `Cannot find module @rollup/rollup-linux-x64-gnu`. This is a known npm optional-dependency bug — the platform-specific Rollup native module was not installed. The `vitest` binary also has no execute permission.
- **Fix:** Run `npm install` with `--force` or delete `node_modules` and `package-lock.json` and reinstall. Alternatively, install the missing native package: `npm i @rollup/rollup-linux-x64-gnu`.

### TST-003: No `test` Script in `apps/web/package.json`
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/web/package.json:6`
- **Description:** The `apps/web/package.json` has no `"test"` script. When `turbo run test` is called from root, the web app is silently skipped. Vitest config and setup file exist, but there's no script to invoke them.
- **Fix:** Add `"test": "vitest run"` to `apps/web/package.json` scripts.

### TST-004: No `test` Script in `apps/mobile/package.json`
- **Severity:** MEDIUM
- **Status:** FAIL
- **File:** `apps/mobile/package.json` (N/A)
- **Description:** No test runner configured for the mobile app. No test files, no Jest/Vitest config.
- **Fix:** Add Jest with `jest-expo` preset for React Native testing.

---

## Section 2: Test File Inventory

### TST-005: Existing Test Files — Critically Sparse
- **Severity:** INFO
- **Status:** WARN
- **File:** N/A
- **Description:** Complete inventory of non-`node_modules` test files:

| # | File | Framework | Tests | Status |
|---|------|-----------|-------|--------|
| 1 | `apps/api/src/modules/requests/requests.service.spec.ts` | Jest | 3 | Cannot run (TST-001) |
| 2 | `apps/web/lib/formatters.test.ts` | Vitest | 6 | Cannot run (TST-002) |

That's it. **8 modules × 2 files each (service + controller) = 16 service/controller files** exist in the API alone, yet only **1 has a test** (6.25% file coverage). The web app has **16 page files, 10 component files**, and only 1 utility test file.

---

## Section 3: Critical Missing Tests by Module

### 3.1 Auth Module — ZERO TESTS

### TST-010: Auth Service — No Unit Tests
- **Severity:** CRITICAL
- **Status:** FAIL
- **File:** `apps/api/src/modules/auth/auth.service.ts`
- **Description:** The authentication service handles login, registration, password hashing, and JWT token generation. None of these have tests. This is the most security-critical module in the entire application.
- **Fix:** Create `auth.service.spec.ts` with tests for:
  - `validateUser()` — valid credentials returns user without password
  - `validateUser()` — invalid password returns null
  - `validateUser()` — non-existent user returns null
  - `login()` — returns access_token and user object
  - `register()` — creates user with hashed password
  - `register()` — duplicate email throws UnauthorizedException
  - `register()` — auto-logs in after registration

### TST-011: Auth Controller — No Unit Tests
- **Severity:** CRITICAL
- **Status:** FAIL
- **File:** `apps/api/src/modules/auth/auth.controller.ts`
- **Description:** Login endpoint returns `{ status: 401, message: 'Invalid credentials' }` as a 200 OK response instead of throwing an exception (see line 14). This bug would be caught immediately by a controller test.
- **Fix:** Create `auth.controller.spec.ts` with tests for:
  - POST `/auth/login` — valid credentials returns token
  - POST `/auth/login` — invalid credentials returns 401 (currently broken — returns 200)
  - POST `/auth/register` — successful registration

### TST-012: JWT Strategy — No Unit Tests
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/api/src/modules/auth/jwt.strategy.ts`
- **Description:** JWT strategy validation extracts `sub`, `email`, `role` from payload. No tests verify this mapping.
- **Fix:** Create `jwt.strategy.spec.ts` testing `validate()` returns correct user shape.

### TST-013: Auth Guard — No Integration Tests
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/api/src/modules/auth/auth.guard.ts`
- **Description:** `JwtAuthGuard` is used by 5 controllers (customers, contracts, ledger, posts, comments). No tests verify that unauthenticated requests are blocked.
- **Fix:** Integration tests for each guarded endpoint verifying 401 without token.

---

### 3.2 Properties Module — ZERO TESTS

### TST-020: Properties Service — No Unit Tests
- **Severity:** CRITICAL
- **Status:** FAIL
- **File:** `apps/api/src/modules/properties/properties.service.ts`
- **Description:** Core CRUD operations and map clustering have no tests. The `getClusters()` method (line 103–156) uses raw SQL with string interpolation — a SQL injection vulnerability that would be flagged by integration tests.
- **Fix:** Create `properties.service.spec.ts` with tests for:
  - `create()` — creates property with correct fields, handles `detailAddress` merging
  - `findAll()` — pagination, filtering by type/transactionType/price
  - `findOne()` — returns property with images
  - `update()` — updates and returns property
  - `remove()` — deletes property
  - `getClusters()` — returns individual properties at zoom >= 15
  - `getClusters()` — returns clusters at zoom < 15
  - `getClusters()` — handles empty results

### TST-021: Properties Controller — No Unit Tests
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/api/src/modules/properties/properties.controller.ts`
- **Description:** No auth guard on any property endpoint — all CRUD operations are public. No tests verify correct query param parsing (type, transactionType, price range, pagination).
- **Fix:** Create `properties.controller.spec.ts` testing route handling and query param conversion.

---

### 3.3 Customers Module — ZERO TESTS

### TST-030: Customers Service — No Unit Tests
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/api/src/modules/customers/customers.service.ts`
- **Description:** Customer CRUD with agent-scoped data. No tests verify that data is correctly scoped to the requesting agent.
- **Fix:** Create `customers.service.spec.ts` with tests for:
  - `create()` — creates customer with explicit field mapping
  - `findAll()` — filters by agentId and optional status
  - `findOne()` — returns customer (NOTE: no agentId check — potential auth bypass)
  - `update()` — updates customer (NOTE: no agentId check)
  - `remove()` — deletes customer (NOTE: no agentId check)

### TST-031: Customers Controller — No Unit Tests
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/api/src/modules/customers/customers.controller.ts`
- **Description:** Controller correctly uses `@UseGuards(JwtAuthGuard)` and `@CurrentUser()` for create/findAll, but `findOne`, `update`, `remove` don't verify the customer belongs to the current agent.
- **Fix:** Create controller tests verifying auth guard application and proper user context passing.

---

### 3.4 Contracts Module — ZERO TESTS

### TST-040: Contracts Service — No Unit Tests
- **Severity:** CRITICAL
- **Status:** FAIL
- **File:** `apps/api/src/modules/contracts/contracts.service.ts`
- **Description:** Contract management is core business logic — leases, sales, deposits. No lifecycle tests, no status transition validation, no financial calculation tests. The service blindly spreads `data` into Prisma `create` (line 9) — no field validation.
- **Fix:** Create `contracts.service.spec.ts` with tests for:
  - `create()` — creates contract with agentId
  - `findAll()` — returns contracts with property and customer relations
  - `findOne()` — returns single contract with relations
  - `update()` — updates contract (NOTE: no status transition validation)
  - Missing: status transitions (DRAFT → SIGNED → COMPLETED) — currently no validation exists
  - Missing: financial calculations (deposit, rent, commission)

### TST-041: Contracts Controller — No Unit Tests
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/api/src/modules/contracts/contracts.controller.ts`
- **Description:** No delete endpoint exists (intentional?). No tests verify guard application or that agent scoping works.
- **Fix:** Create controller tests for all CRUD operations.

---

### 3.5 Ledger Module — ZERO TESTS

### TST-050: Ledger Service — No Unit Tests
- **Severity:** CRITICAL
- **Status:** FAIL
- **File:** `apps/api/src/modules/ledger/ledger.service.ts`
- **Description:** Financial transaction recording and monthly statistics — the most numerically critical module. `getMonthlyStats()` (line 31–61) sums BigInt amounts in JavaScript via `Number()` conversion, which can lose precision for large Korean won amounts. No tests verify calculation accuracy.
- **Fix:** Create `ledger.service.spec.ts` with tests for:
  - `create()` — creates transaction with correct date parsing
  - `findAll()` — returns transactions for agent
  - `getMonthlyStats()` — correctly separates INCOME vs EXPENSE
  - `getMonthlyStats()` — handles empty months (returns zeros)
  - `getMonthlyStats()` — date range boundaries (start/end of month)
  - `getMonthlyStats()` — BigInt precision with large amounts

### TST-051: Ledger Controller — No Unit Tests
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/api/src/modules/ledger/ledger.controller.ts`
- **Description:** No tests for query param parsing of `year`/`month` in `getStats()`.
- **Fix:** Create controller tests with various year/month inputs.

---

### 3.6 Community Module — ZERO TESTS

### TST-060: Posts Service — No Unit Tests
- **Severity:** MEDIUM
- **Status:** FAIL
- **File:** `apps/api/src/modules/community/posts.service.ts`
- **Description:** Post CRUD with view counting. `findOne()` increments views via a separate update (race condition potential). No tests exist.
- **Fix:** Create `posts.service.spec.ts` with tests for:
  - `create()` — creates post with author
  - `findAll()` — returns posts with author and comment count
  - `findAll()` — filters by category; 'ALL' returns everything
  - `findOne()` — returns post with comments, increments view count

### TST-061: Comments Service — No Unit Tests
- **Severity:** MEDIUM
- **Status:** FAIL
- **File:** `apps/api/src/modules/community/comments.service.ts`
- **Description:** Simple comment creation, but no tests for the nested controller route (`posts/:postId/comments`).
- **Fix:** Create `comments.service.spec.ts` testing create with author include.

### TST-062: Community Authorization — No Tests
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/api/src/modules/community/posts.controller.ts:9`
- **Description:** Only `@Post()` create is guarded. `@Get()` findAll and `@Get(':id')` findOne are publicly accessible — intentional? No tests verify this.
- **Fix:** Create controller tests verifying which endpoints require auth and which don't.

---

### 3.7 Schedule & Requests Modules

### TST-070: Schedule Service — No Unit Tests
- **Severity:** MEDIUM
- **Status:** FAIL
- **File:** `apps/api/src/modules/schedule/schedule.service.ts`
- **Description:** Aggregates contract events and customer follow-ups into calendar format. No tests for date handling or event mapping.
- **Fix:** Create `schedule.service.spec.ts` testing event generation from contracts/customers.

### TST-071: Requests Service — Partial Coverage
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** `apps/api/src/modules/requests/requests.service.spec.ts`
- **Description:** Only `findMatches()` is tested (price range and location matching). Missing tests for `create()`, `findAll()`, `findOne()`, and edge cases in `findMatches()` (type matching, null/undefined handling).
- **Fix:** Add tests for all CRUD methods and edge cases.

---

## Section 4: Frontend Test Gaps

### TST-080: No Page Component Tests
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/web/app/` (16 page files)
- **Description:** Zero page-level tests exist. Critical pages with no tests:
  - `(auth)/login/page.tsx` — Login form, auth flow
  - `(main)/page.tsx` — Dashboard
  - `(main)/properties/page.tsx` — Property listing
  - `(main)/properties/register/page.tsx` — Property registration form
  - `(main)/workspace/contracts/page.tsx` — Contract management
  - `(main)/workspace/customers/page.tsx` — Customer management
  - `(main)/workspace/ledger/page.tsx` — Financial ledger
  - `(main)/community/page.tsx` — Community feed
  - `(main)/community/write/page.tsx` — Post creation
- **Fix:** Create component tests using `@testing-library/react` (already installed) for at least the login page, property registration, and contract management pages.

### TST-081: No Component Tests
- **Severity:** MEDIUM
- **Status:** FAIL
- **File:** `apps/web/components/` (10 component files)
- **Description:** No tests for any reusable components:
  - `PropertyCard.tsx` — Displays property info
  - `PropertySearch.tsx` — Search/filter functionality
  - `ContractList.tsx` — Contract list display
  - `CustomerList.tsx` — Customer list display
  - `Header.tsx`, `Sidebar.tsx`, `BottomNav.tsx` — Layout components
- **Fix:** Prioritize tests for data-displaying components (PropertyCard, ContractList, CustomerList).

### TST-082: No API Client Tests
- **Severity:** MEDIUM
- **Status:** FAIL
- **File:** `apps/web/lib/api/` (8 API client files)
- **Description:** API client functions for all modules (auth, properties, customers, contracts, ledger, requests, schedule) have no tests. These handle HTTP requests, error handling, and response parsing.
- **Fix:** Create tests with mocked fetch for each API client module.

### TST-083: Web Formatters — Only Test File (Passes Locally)
- **Severity:** INFO
- **Status:** WARN
- **File:** `apps/web/lib/formatters.test.ts`
- **Description:** Good test file covering Korean won formatting, area conversion, and type label mappings. However, it cannot run due to TST-002 (Vitest broken).
- **Fix:** Fix vitest dependencies (TST-002). These tests are well-written and should pass once the runner works.

---

## Section 5: API Integration Tests (E2E)

### TST-090: No E2E / Integration Tests
- **Severity:** CRITICAL
- **Status:** FAIL
- **File:** N/A
- **Description:** The `apps/api/package.json` has `@types/supertest` installed (dev dependency), indicating that E2E tests were planned but never written. There is no `test/` directory, no `app.e2e-spec.ts`, and no supertest-based integration tests. No test verifies that:
  - The full NestJS app bootstraps correctly
  - Routes are properly registered
  - Auth guards reject unauthenticated requests
  - Database operations work end-to-end
  - Error responses have correct HTTP status codes
- **Fix:** Create `apps/api/test/` directory with:
  - `app.e2e-spec.ts` — App bootstrap test
  - `auth.e2e-spec.ts` — Full auth flow (register → login → access protected route)
  - `properties.e2e-spec.ts` — Property CRUD E2E
  - Use in-memory SQLite database for test isolation

---

## Section 6: Shared Package Tests

### TST-100: `packages/utils` — No Tests
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `packages/utils/src/`
- **Description:** Three utility files with zero tests:
  - `format.ts` — `formatCurrency()`, `formatArea()`, `formatDate()` — Korean currency formatting
  - `validation.ts` — `isValidEmail()`, `isValidPhoneNumber()`, `isValidPassword()` — Input validation
  - These are shared across apps and must be correct.
- **Fix:** Create `packages/utils/src/__tests__/format.test.ts` and `validation.test.ts` with comprehensive tests including edge cases (negative numbers, empty strings, boundary values).

### TST-101: `packages/types` — No Runtime Tests Needed
- **Severity:** INFO
- **Status:** PASS
- **File:** `packages/types/`
- **Description:** Type-only package. TypeScript compiler provides compile-time checking. No runtime tests needed.

---

## Section 7: Test Infrastructure Review

### TST-110: Jest Configuration — Functional but Not Optimal
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** `apps/api/jest.config.js`
- **Description:** Config uses `ts-jest` preset with module name mapping for workspace packages. Issues:
  - `preset: 'ts-jest'` fails due to hoisted node_modules (TST-001)
  - `collectCoverageFrom: ['**/*.(t|j)s']` is overly broad — will include `node_modules` if not excluded
  - No `coverageThreshold` configured — no minimum coverage enforcement
  - No `testPathIgnorePatterns` for `dist/`, `node_modules/`
- **Fix:** Update config to:
  ```js
  module.exports = {
    transform: { '^.+\\.ts$': require.resolve('ts-jest') },
    testEnvironment: 'node',
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '.',
    testRegex: '.*\\.spec\\.ts$',
    collectCoverageFrom: ['src/**/*.ts', '!src/**/*.module.ts', '!src/main.ts'],
    coverageDirectory: './coverage',
    coverageThreshold: { global: { branches: 50, functions: 50, lines: 50, statements: 50 } },
    moduleNameMapper: {
      '^@mansil/database(.*)$': '<rootDir>/../../packages/database/src$1',
      '^@mansil/types(.*)$': '<rootDir>/../../packages/types/src$1',
      '^@mansil/utils(.*)$': '<rootDir>/../../packages/utils/src$1',
    },
  };
  ```

### TST-111: Vitest Configuration — Good Setup, Broken Deps
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** `apps/web/vitest.config.ts`
- **Description:** Well-configured with jsdom environment, React plugin, path aliases, and setup file importing `@testing-library/jest-dom`. All testing libraries are installed (`@testing-library/react`, `@testing-library/jest-dom`, `jsdom`). Just needs the Rollup dependency fix.
- **Fix:** Fix Rollup native module (TST-002) and add `"test": "vitest run"` script (TST-003).

### TST-112: No Test Utilities or Mocks
- **Severity:** HIGH
- **Status:** FAIL
- **File:** N/A
- **Description:** No shared test utilities exist:
  - No `PrismaService` mock factory for API tests
  - No `JwtService` mock for auth testing
  - No test database setup/teardown helpers
  - No authenticated request helper for E2E tests
  - No React testing wrappers (providers, router mock) for web tests
- **Fix:** Create `apps/api/test/utils/` with:
  - `prisma.mock.ts` — Shared Prisma mock factory
  - `auth.helper.ts` — JWT token generation for test requests
  - `app.factory.ts` — Test module builder with common providers

### TST-113: No CI Test Pipeline
- **Severity:** HIGH
- **Status:** FAIL
- **File:** N/A
- **Description:** No CI/CD configuration runs tests on push/PR. Tests can regress silently.
- **Fix:** Add GitHub Actions workflow with `npm test` step that runs both Jest and Vitest.

---

## Section 8: Prioritized Test Plan

Tests ordered by **risk × impact** (highest priority first):

### Priority 1 — CRITICAL (Must have before production)

| # | Test | Module | Est. Tests | Risk Mitigated |
|---|------|--------|-----------|----------------|
| 1 | Fix test runners (TST-001, TST-002) | Infrastructure | N/A | Tests can actually run |
| 2 | `auth.service.spec.ts` | Auth | 7 | Authentication bypass, password handling |
| 3 | `auth.controller.spec.ts` | Auth | 4 | Login/register HTTP behavior (fixes status code bug) |
| 4 | Auth E2E test | Auth | 5 | Full auth flow verification |
| 5 | `contracts.service.spec.ts` | Contracts | 6 | Financial/legal correctness |
| 6 | `ledger.service.spec.ts` | Ledger | 6 | Financial calculation accuracy |
| 7 | `properties.service.spec.ts` | Properties | 8 | Core business operations |
| 8 | Shared test utilities | Infrastructure | N/A | Enables efficient test writing |

### Priority 2 — HIGH (Should have before production)

| # | Test | Module | Est. Tests | Risk Mitigated |
|---|------|--------|-----------|----------------|
| 9 | `customers.service.spec.ts` | Customers | 5 | Authorization bypass on CRUD |
| 10 | `packages/utils` validation tests | Utils | 10 | Input validation correctness |
| 11 | `packages/utils` format tests | Utils | 8 | Korean currency formatting |
| 12 | Auth guard integration tests | Auth | 5 | Protected endpoints verified |
| 13 | Login page component test | Web | 4 | Auth UI correctness |
| 14 | Add `test` scripts to all packages | Infrastructure | N/A | `turbo run test` works |
| 15 | CI pipeline for tests | Infrastructure | N/A | Regression prevention |

### Priority 3 — MEDIUM (Should have soon after launch)

| # | Test | Module | Est. Tests | Risk Mitigated |
|---|------|--------|-----------|----------------|
| 16 | `posts.service.spec.ts` | Community | 5 | Community feature correctness |
| 17 | `comments.service.spec.ts` | Community | 2 | Comment creation |
| 18 | `schedule.service.spec.ts` | Schedule | 4 | Calendar event accuracy |
| 19 | Complete `requests.service.spec.ts` | Requests | 4 | Matching algorithm edge cases |
| 20 | PropertyCard component test | Web | 3 | Display correctness |
| 21 | API client mock tests | Web | 8 | API integration |
| 22 | Controller tests for all modules | API | 20 | HTTP layer correctness |

### Priority 4 — LOW (Nice to have)

| # | Test | Module | Est. Tests | Risk Mitigated |
|---|------|--------|-----------|----------------|
| 23 | Full E2E test suite (supertest) | API | 15 | End-to-end confidence |
| 24 | Remaining page tests | Web | 12 | Frontend coverage |
| 25 | Layout component tests | Web | 3 | Navigation UX |
| 26 | Mobile app tests | Mobile | 10 | Mobile parity |
| 27 | Coverage thresholds | Infrastructure | N/A | Coverage enforcement |

---

## Summary of Findings

| ID | Title | Severity | Status |
|----|-------|----------|--------|
| TST-001 | API Jest runner broken (ts-jest not found) | CRITICAL | FAIL |
| TST-002 | Web Vitest runner broken (Rollup native missing) | CRITICAL | FAIL |
| TST-003 | No `test` script in web package.json | HIGH | FAIL |
| TST-004 | No test runner for mobile | MEDIUM | FAIL |
| TST-005 | Only 2 test files across entire project | CRITICAL | WARN |
| TST-010 | Auth service — no tests | CRITICAL | FAIL |
| TST-011 | Auth controller — no tests | CRITICAL | FAIL |
| TST-012 | JWT strategy — no tests | HIGH | FAIL |
| TST-013 | Auth guard — no integration tests | HIGH | FAIL |
| TST-020 | Properties service — no tests | CRITICAL | FAIL |
| TST-021 | Properties controller — no tests | HIGH | FAIL |
| TST-030 | Customers service — no tests | HIGH | FAIL |
| TST-031 | Customers controller — no tests | HIGH | FAIL |
| TST-040 | Contracts service — no tests | CRITICAL | FAIL |
| TST-041 | Contracts controller — no tests | HIGH | FAIL |
| TST-050 | Ledger service — no tests | CRITICAL | FAIL |
| TST-051 | Ledger controller — no tests | HIGH | FAIL |
| TST-060 | Posts service — no tests | MEDIUM | FAIL |
| TST-061 | Comments service — no tests | MEDIUM | FAIL |
| TST-062 | Community authorization gaps — no tests | HIGH | FAIL |
| TST-070 | Schedule service — no tests | MEDIUM | FAIL |
| TST-071 | Requests service — partial coverage | MEDIUM | WARN |
| TST-080 | No page component tests (16 pages) | HIGH | FAIL |
| TST-081 | No reusable component tests (10 components) | MEDIUM | FAIL |
| TST-082 | No API client tests (8 modules) | MEDIUM | FAIL |
| TST-083 | Formatters test file — good but can't run | INFO | WARN |
| TST-090 | No E2E / integration tests | CRITICAL | FAIL |
| TST-100 | packages/utils — no tests | HIGH | FAIL |
| TST-101 | packages/types — no runtime tests needed | INFO | PASS |
| TST-110 | Jest config — functional but suboptimal | MEDIUM | WARN |
| TST-111 | Vitest config — good setup, broken deps | MEDIUM | WARN |
| TST-112 | No shared test utilities or mocks | HIGH | FAIL |
| TST-113 | No CI test pipeline | HIGH | FAIL |

**CRITICAL findings: 8** | **HIGH findings: 15** | **MEDIUM findings: 8** | **INFO: 3**

---

## Bugs Discovered During Audit

1. **Auth controller returns 200 instead of 401** on invalid login (`auth.controller.ts:14`) — returns a plain object `{ status: 401, message: 'Invalid credentials' }` with HTTP 200 status.
2. **SQL injection in `getClusters()`** (`properties.service.ts:124-134`) — User-supplied `north`, `south`, `east`, `west` values are interpolated into raw SQL via `$queryRawUnsafe()`.
3. **No authorization check** on `findOne()`, `update()`, `remove()` in customers, contracts — any authenticated user can access any other agent's data by guessing IDs.
4. **Hardcoded JWT secret** (`auth/constants.ts:2`) — `mansil-secret-key-change-in-prod` is a static string, not from environment.

---

*Report generated by test-coverage-auditor agent — 2026-02-26*
