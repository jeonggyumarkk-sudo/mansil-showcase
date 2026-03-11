# MANSIL PLATFORM — PRODUCTION READINESS MASTER AUDIT REPORT

**Date:** 2026-02-26
**Platform:** Mansil (만실) — Korean Real Estate Management Platform
**Stack:** NestJS 10 + Next.js 14 + Expo/React Native + Prisma 5 + SQLite
**Auditors:** 8 automated agents (security, API quality, frontend-web, mobile, database, privacy, devops, test-coverage)

---

## VERDICT: NO-GO

**The Mansil Platform is NOT ready for production launch.** The audit uncovered critical security vulnerabilities, legal compliance blockers, a broken web build, and virtually zero test coverage. The platform is in an **early development/prototype** stage across all dimensions.

---

## Findings Summary

| Audit Domain | CRITICAL | HIGH | MEDIUM | LOW | INFO | Total |
|---|---|---|---|---|---|---|
| Security | 4 | 8 | 5 | 3 | 2 | **22** |
| API Quality | 4 | 12 | 13 | 7 | 2 | **38** |
| Frontend Web | 9 | 14 | 12 | 10 | 10 | **55** |
| Mobile | 8 | 11 | 13 | 5 | 2 | **39** |
| Database | 3 | 8 | 8 | 5 | 5 | **29** |
| Privacy/PIPA | 5 | 7 | 4 | 2 | 2 | **20** |
| DevOps | 7 | 8 | 7 | 3 | 2 | **27** |
| Test Coverage | 8 | 15 | 8 | 0 | 3 | **34** |
| **TOTAL** | **48** | **83** | **70** | **35** | **28** | **264** |

> **Note:** Many findings are cross-cutting — the SQL injection, hardcoded JWT secret, and missing auth guards were independently flagged by 3-4 auditors each. The unique distinct issue count is approximately **180-200**.

---

## TOP 10 MUST-FIX ITEMS BEFORE PRODUCTION

### 1. SQL Injection via `$queryRawUnsafe` — CRITICAL
- **Refs:** SEC-002, API-001, DB-001
- **File:** `apps/api/src/modules/properties/properties.service.ts:124-137`
- **Impact:** Attacker can execute arbitrary SQL, exfiltrate or destroy all data
- **Fix:** Replace `$queryRawUnsafe` with Prisma's `$queryRaw` tagged template literals
- **Effort:** Small (30 min)

### 2. Hardcoded JWT Secret in Source Code — CRITICAL
- **Refs:** SEC-001, API-005, OPS-010
- **File:** `apps/api/src/modules/auth/constants.ts:2`
- **Impact:** Anyone with source code access can forge authentication tokens for any user
- **Fix:** Move to `process.env.JWT_SECRET`, reject startup without it, generate 256-bit random secret
- **Effort:** Small (1 hour)

### 3. Missing Authentication on 3 Controllers — CRITICAL
- **Refs:** SEC-003, API-002, API-003, API-004, PRV-011, PRV-012
- **Files:** `properties.controller.ts`, `requests.controller.ts`, `real-transaction.controller.ts`
- **Impact:** Anyone can create/delete properties, view client PII (names, phones), trigger database seeding
- **Fix:** Add `@UseGuards(JwtAuthGuard)` to all three controllers
- **Effort:** Small (1 hour)

### 4. No Privacy Policy or Consent Mechanism (PIPA Violation) — CRITICAL / LEGAL
- **Refs:** PRV-021, PRV-002, PRV-005, PRV-006
- **Impact:** Violates Korean Personal Information Protection Act Articles 15, 30, 35-37. Potential fines and legal action.
- **Fix:** Draft Korean privacy policy (개인정보 처리방침), implement consent collection at registration, build data subject rights endpoints (access/correct/delete)
- **Effort:** Large (1-2 weeks)

### 5. Web Application Build Fails — CRITICAL / DEPLOYMENT BLOCKER
- **Refs:** OPS-004
- **File:** `apps/web/` — `next build` crashes with React error #31 on /404 and /500 pages
- **Impact:** No deployable web artifact exists. The web app literally cannot be deployed.
- **Fix:** Debug React SSR error in error pages, likely a server/client component boundary issue
- **Effort:** Medium (2-4 hours)

### 6. Hardcoded `localhost` API URLs Everywhere — CRITICAL / DEPLOYMENT BLOCKER
- **Refs:** WEB-001/002/003/004, MOB-012
- **Files:** `apps/web/lib/api/client.ts:1`, `auth.ts:1`, `requests.ts:3`, 3 community pages, 3 mobile screens
- **Impact:** Application cannot function outside `localhost` — breaks on any deployment
- **Fix:** Use `NEXT_PUBLIC_API_URL` env var for web, `expo-constants` for mobile; centralize API config
- **Effort:** Small (2 hours)

### 7. No Authorization / Ownership Checks — CRITICAL
- **Refs:** SEC-005, API-016, DB-008, DB-010
- **Files:** All `findOne`, `update`, `remove` methods in customers, contracts, requests services
- **Impact:** Any authenticated user can read/modify/delete any other agent's customers, contracts, and requests
- **Fix:** Add `agentId` to all `where` clauses in service methods
- **Effort:** Medium (4-6 hours)

### 8. Wide-Open CORS + No Security Headers — CRITICAL
- **Refs:** SEC-004, SEC-008, OPS-021, WEB-055
- **File:** `apps/api/src/main.ts:12`
- **Impact:** Any website can make authenticated cross-origin API requests; no XSS/clickjacking protection
- **Fix:** Restrict CORS origins, install `helmet`, add security headers to Next.js config
- **Effort:** Small (1-2 hours)

### 9. No Database Migrations — CRITICAL
- **Refs:** DB-002, OPS-012
- **File:** `packages/database/prisma/` — no `migrations/` directory
- **Impact:** No way to track/rollback schema changes; `prisma db push` is destructive in production
- **Fix:** Run `npx prisma migrate dev --name init`, establish migration workflow
- **Effort:** Small (1 hour)

### 10. Test Infrastructure Broken + ~1% Coverage — CRITICAL
- **Refs:** TST-001, TST-002, TST-005, TST-090
- **Impact:** 9 total tests across the entire monorepo; both test runners (Jest, Vitest) are broken; zero E2E tests
- **Fix:** Fix test runners, write auth/contracts/ledger tests at minimum before launch
- **Effort:** Large (1-2 weeks for critical tests)

---

## ADDITIONAL CRITICAL & HIGH FINDINGS

### Security
| ID | Issue | File | Effort |
|---|---|---|---|
| SEC-006 | No rate limiting on login (brute-force) | `main.ts` | Small |
| SEC-007 | JWT in localStorage (XSS steal) | `login/page.tsx:21` | Medium |
| SEC-010 | No refresh token — 60min hard session | `constants.ts:3` | Medium |
| SEC-011 | Login returns 200 OK on invalid creds | `auth.controller.ts:12` | Small |
| SEC-012 | Auth accepts unvalidated `Record<string,any>` | `auth.controller.ts:10,19` | Small |
| SEC-016 | Mass assignment in contracts (spread `...data`) | `contracts.service.ts:9` | Small |

### API
| ID | Issue | File | Effort |
|---|---|---|---|
| API-013/014 | Hardcoded demo agent (`demo@mansil.com`) | `properties.service.ts:36`, `requests.service.ts:11` | Small |
| API-012 | Password hash leaked in register response | `auth.service.ts:43` | Small |
| API-019 | PrismaService x9 instances (not singleton) | All `*.module.ts` | Medium |
| API-015 | No 404 handling on findOne across all controllers | Multiple | Small |
| API-021-025 | Missing CRUD endpoints (delete contracts, update/delete posts, comments) | Multiple | Medium |
| API-027 | No pagination on 4 list endpoints | Multiple | Medium |

### Frontend Web
| ID | Issue | File | Effort |
|---|---|---|---|
| WEB-009 | No auth middleware — zero route protection | `middleware.ts` (missing) | Medium |
| WEB-010 | Inconsistent token key (`access_token` vs `token`) | Multiple | Small |
| WEB-042 | XSS in Leaflet popup HTML | `LeafletMap.tsx:126` | Small |
| WEB-016/054 | Property type mismatch (local vs shared) | Multiple | Medium |
| WEB-022 | `formatArea` semantic mismatch (m² vs pyeong) | `PropertyCard.tsx:6` | Small |
| WEB-052 | BuildingRegisterTab shows fake data as "실시간 조회 완료" | `BuildingRegisterTab.tsx:9` | Small |
| WEB-048 | Community pages entirely in English (rest is Korean) | `community/*.tsx` | Small |

### Mobile
| ID | Issue | File | Effort |
|---|---|---|---|
| MOB-036 | Nativewind v4 misconfigured — dozens of TS errors | `babel.config.js:5` | Medium |
| MOB-006 | No auth guard on protected routes | `_layout.tsx:51` | Small |
| MOB-021 | `PROVIDER_GOOGLE` without API key | `map.tsx:51` | Small |
| MOB-029 | No `SafeAreaView` — content behind notch | Multiple screens | Small |
| MOB-032/033 | Missing iOS bundleIdentifier & Android package | `app.json` | Small |

### Database
| ID | Issue | File | Effort |
|---|---|---|---|
| DB-003 | Int vs BigInt mismatch for financial fields | `schema.prisma:63-66 vs 155-158` | Medium |
| DB-004/005 | Missing cascade delete policies | `schema.prisma` | Small |
| DB-006 | Plaintext password in seed file | `seed.ts:16` | Small |
| DB-013 | 6 missing indexes for observed query patterns | `schema.prisma` | Small |

### Privacy
| ID | Issue | File | Effort |
|---|---|---|---|
| PRV-014 | No user account deletion mechanism | N/A (missing) | Medium |
| PRV-016 | Hardcoded plaintext `'hashed_password'` in service | `properties.service.ts:40` | Small |
| PRV-008/009 | Over-exposed PII in contract/schedule responses | `contracts.service.ts`, `schedule.service.ts` | Small |
| PRV-022 | No data-at-rest encryption (SQLite unencrypted) | `schema.prisma:9` | Large |

### DevOps
| ID | Issue | File | Effort |
|---|---|---|---|
| OPS-009 | No `.env.example`, no env validation, no `@nestjs/config` | Multiple | Medium |
| OPS-017 | No CI/CD pipeline | `.github/workflows/` missing | Medium |
| OPS-018 | No root `.gitignore` | Root | Small |
| OPS-011 | No Docker configuration | N/A | Medium |
| OPS-013 | SQLite in production — single-writer, no replication | `schema.prisma:9` | Large |
| OPS-023 | No graceful shutdown handling | `main.ts` | Small |

---

## REMEDIATION ROADMAP

### Phase 0: Blockers (Must complete before ANY deployment) — ~1 week
1. Fix SQL injection (`$queryRawUnsafe` → `$queryRaw`) — 30 min
2. Move JWT secret to env var — 1 hour
3. Add auth guards to Properties, Requests, RealTransaction controllers — 1 hour
4. Restrict CORS origins — 30 min
5. Install Helmet.js — 30 min
6. Fix hardcoded localhost URLs → env vars — 2 hours
7. Add ownership checks to all service methods — 4 hours
8. Fix web build (React error #31) — 2-4 hours
9. Create root `.gitignore` — 15 min
10. Initialize Prisma migrations — 1 hour
11. Remove hardcoded demo agent from services — 1 hour
12. Fix login to throw 401 (not return 200) — 30 min
13. Create proper DTOs for auth endpoints — 2 hours
14. Fix inconsistent token key (web community pages) — 30 min
15. Hash password in seed file — 15 min

### Phase 1: Security Hardening — ~1-2 weeks
1. Create validated DTOs for ALL endpoints (properties, contracts, requests)
2. Add rate limiting (`@nestjs/throttler`)
3. Implement refresh token flow
4. Migrate token storage from localStorage to httpOnly cookies
5. Fix mass assignment in contracts service
6. Add global exception filter (sanitize error responses)
7. Make PrismaService a shared singleton module
8. Add `@nestjs/config` with env validation
9. Standardize Int/BigInt for financial fields
10. Add missing indexes

### Phase 2: Legal/Compliance — ~2-3 weeks
1. Draft Korean privacy policy (개인정보 처리방침)
2. Build consent collection UI in registration flow
3. Implement data subject rights endpoints (`GET/PATCH/DELETE /users/me`)
4. Build user account deletion with cascading
5. Define data retention policies
6. Add Prisma `select` clauses to minimize PII exposure
7. Create terms of service page

### Phase 3: Quality & Testing — ~2-3 weeks
1. Fix test runners (Jest + Vitest)
2. Write auth module tests (service, controller, E2E)
3. Write contracts + ledger service tests
4. Write properties service tests
5. Build shared test utilities (Prisma mock, auth helper)
6. Add `test` scripts to all packages
7. Set up CI pipeline (GitHub Actions)
8. Add missing CRUD endpoints (delete contracts, update/delete posts/comments)
9. Add 404 handling across all controllers
10. Add pagination to all list endpoints

### Phase 4: DevOps & Deployment — ~1-2 weeks
1. Create Dockerfiles (API + Web)
2. Create docker-compose.yml
3. Add health check endpoint (`@nestjs/terminus`)
4. Implement structured logging (Pino/Winston)
5. Enable graceful shutdown
6. Integrate error monitoring (Sentry)
7. Configure Next.js `output: 'standalone'`
8. Plan PostgreSQL migration
9. Create `.env.example` files

### Phase 5: Frontend Polish — ~2-3 weeks
1. Create auth middleware for Next.js (route protection)
2. Create registration page
3. Wire up FileUpload component
4. Fix Leaflet XSS (sanitize popup HTML)
5. Fix Leaflet stale closure + add debounce
6. Translate community pages to Korean
7. Add form validation across all forms
8. Replace `alert()` with toast system
9. Standardize Property types (shared package)
10. Fix formatArea inconsistency
11. Add `loading.tsx` / `error.tsx` boundaries
12. Remove BuildingRegisterTab fake data label
13. Add SEO metadata

### Phase 6: Mobile (Can defer if web-first launch) — ~3-4 weeks
1. Fix Nativewind v4 configuration
2. Add iOS bundleIdentifier + Android package
3. Centralize API URL (remove localhost)
4. Implement auth guard in navigation
5. Add SafeAreaView to all screens
6. Configure Google Maps API key (or remove PROVIDER_GOOGLE)
7. Create centralized Axios instance
8. Add location permissions
9. Add KeyboardAvoidingView

---

## EFFORT SUMMARY

| Phase | Duration | Items |
|---|---|---|
| Phase 0: Blockers | ~1 week | 15 items |
| Phase 1: Security | ~1-2 weeks | 10 items |
| Phase 2: Legal/Compliance | ~2-3 weeks | 7 items |
| Phase 3: Quality/Testing | ~2-3 weeks | 10 items |
| Phase 4: DevOps | ~1-2 weeks | 9 items |
| Phase 5: Frontend Polish | ~2-3 weeks | 13 items |
| Phase 6: Mobile | ~3-4 weeks | 9 items |

**Estimated total to production-ready: 10-16 weeks** (Phases 0-5 for web launch, Phase 6 for mobile launch)

With parallel work streams (security + testing + frontend simultaneously), this could compress to **6-8 weeks** with 2-3 developers.

---

## INDIVIDUAL AUDIT REPORTS

Full details with code snippets and line-by-line fixes are in:

1. `AUDIT_REPORT_security.md` — 22 findings
2. `AUDIT_REPORT_api-quality.md` — 38 findings
3. `AUDIT_REPORT_frontend-web.md` — 55 findings
4. `AUDIT_REPORT_mobile.md` — 39 findings
5. `AUDIT_REPORT_database.md` — 29 findings
6. `AUDIT_REPORT_privacy.md` — 20 findings
7. `AUDIT_REPORT_devops.md` — 27 findings
8. `AUDIT_REPORT_tests.md` — 34 findings

---

## POSITIVE FINDINGS

Not everything is broken. The audit also found:
- **Prisma service lifecycle** is correctly implemented (`onModuleInit`/`onModuleDestroy`)
- **Property model indexes** are well-designed (7 indexes covering main query patterns)
- **Password hashing** uses bcrypt correctly in the auth service
- **Password excluded** from login response correctly via destructuring
- **No third-party data sharing** — no external API calls sending user data
- **Mobile uses Expo SecureStore** for token storage (correct, unlike web's localStorage)
- **Cascade deletes** correctly applied to PropertyImage and Comment
- **Korean localization** is mostly well-done in the web app (outside community section)
- **Tailwind/UI** styling is clean and consistent
- **Monorepo structure** with shared types/utils/ui packages is architecturally sound
- **Vitest/Jest configurations** are well-structured (just need dependency fixes)

---

*Generated by production-audit team — 8 autonomous agents — 2026-02-26*
