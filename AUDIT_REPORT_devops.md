# DevOps & Deployment Readiness Audit Report

**Project:** Mansil Platform (Korean Real Estate Management)
**Date:** 2026-02-26
**Auditor:** devops-deployment-auditor
**Scope:** Build pipeline, deployment readiness, infrastructure, and production concerns

---

## Executive Summary

The Mansil Platform monorepo has significant DevOps gaps that must be addressed before production deployment. The build pipeline is partially broken (web app fails to build), there is no CI/CD pipeline, no Docker configuration, no environment variable management strategy, hardcoded secrets, no logging infrastructure, no health checks, no error monitoring, and SQLite in production raises major scalability and reliability concerns. The project is in **early development stage** from a DevOps perspective and requires substantial investment before production readiness.

| Severity | Count |
|----------|-------|
| CRITICAL | 7 |
| HIGH | 8 |
| MEDIUM | 7 |
| LOW | 3 |
| INFO | 2 |

---

## Findings

### OPS-001: Turbo Build Pipeline — Binary Permission Issues
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `node_modules/.bin/turbo`
- **Description:** The Turbo binary at `node_modules/.bin/turbo` lacks execute permission (`-rw-rw-r--`). Similarly, `tsc`, `nest`, and `next` binaries also lack execute permissions. Running `npm run build` fails immediately with `sh: 1: turbo: Permission denied`. This indicates `npm install` was run in an environment that stripped execute bits (possibly a Docker layer, WSL mount, or filesystem issue).
- **Fix:**
  1. Run `chmod +x node_modules/.bin/*` after install, or investigate the root cause (filesystem mount options, npm version bug).
  2. Add a `postinstall` script: `"postinstall": "chmod +x node_modules/.bin/* 2>/dev/null || true"` as a workaround.
  3. Verify the `packageManager` field (`npm@10.0.0`) matches the actual npm version in use (detected: `10.9.4`).

### OPS-002: Turbo Configuration — Missing Test Task
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** `turbo.json:6`
- **Description:** The root `package.json` defines a `test` script (`turbo run test`), but `turbo.json` does not define a `test` task. Turbo will still run it using default settings, but without explicit configuration there is no caching strategy, no `dependsOn` ordering, and no output configuration for test results.
- **Fix:** Add a `test` task to `turbo.json`:
  ```json
  "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"],
      "cache": false
  }
  ```

### OPS-003: Turbo Version — Pinned to `latest`
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** `package.json:16`
- **Description:** The `turbo` dependency is set to `"latest"`, which means every `npm install` can pull a different major version. This is non-deterministic and can cause unexpected build breakages across team members or CI environments.
- **Fix:** Pin to a specific version: `"turbo": "^2.7.4"` (the currently installed version).

### OPS-004: Web App Build Fails — React SSR Error
- **Severity:** CRITICAL
- **Status:** FAIL
- **File:** `apps/web/` (build output)
- **Description:** `next build` fails with `Minified React error #31` during static page generation for `/404` and `/500` pages. The error indicates that a React component is rendering an object instead of valid JSX. This means the **web application cannot be deployed** — there is no production build artifact. Build output: `Tasks: 4 successful, 5 total` (web#build failed).
- **Fix:**
  1. Run `next build` in dev mode to get full error messages.
  2. Check the error page components (`_error.tsx`, `404.tsx`, `500.tsx`) or the root layout for components rendering objects directly.
  3. Likely caused by a `@mansil/ui` component returning an object (possibly a server/client component boundary issue with Next.js 14).

### OPS-005: Web App Missing ESLint
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** `apps/web/package.json`
- **Description:** The Next.js build output shows `ESLint must be installed in order to run during builds`. ESLint is not in the web app's dependencies, and no `.eslintrc` file exists. The `lint` script (`next lint`) will also fail.
- **Fix:** Install ESLint: `npm install --save-dev eslint eslint-config-next -w web` and create an `.eslintrc.json` configuration file.

### OPS-006: API NestJS Build Succeeds But No nest-cli.json
- **Severity:** LOW
- **Status:** WARN
- **File:** `apps/api/`
- **Description:** The API builds successfully via `nest build`, but there is no `nest-cli.json` configuration file. NestJS defaults are used, which is acceptable but means no explicit control over build settings like webpack optimization, assets, or custom compiler options.
- **Fix:** Create `apps/api/nest-cli.json`:
  ```json
  {
    "$schema": "https://json.schemastore.org/nest-cli",
    "collection": "@nestjs/schematics",
    "sourceRoot": "src",
    "compilerOptions": {
      "deleteOutDir": true
    }
  }
  ```

### OPS-007: TypeScript — `@ts-ignore` in Source Code
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** `apps/api/src/modules/auth/auth.service.ts:15`
- **Description:** Found `@ts-ignore` directive in the auth service. This suppresses TypeScript errors and can hide real type issues. Additionally, the `BigInt.prototype.toJSON` hack in `main.ts:6` uses `as any` cast.
- **Fix:** Replace `@ts-ignore` with proper typing. For the BigInt serialization, consider using a proper serialization library or NestJS interceptor.

### OPS-008: Excessive `any` Type Usage Across Codebase
- **Severity:** HIGH
- **Status:** FAIL
- **File:** Multiple files (see details)
- **Description:** Despite `strict: true` in tsconfig, there is widespread use of `: any` across the codebase, particularly in the API:
  - `auth.service.ts` — `login(user: any)`, `register(data: any)`
  - `properties.service.ts` — `create(data: any)`, `update(id: string, data: any)`, `cursor?: any`, `where?: any`, `orderBy?: any`
  - `properties.controller.ts` — `createPropertyDto: any`, `updatePropertyDto: any`, `where: any`
  - `customers.service.ts` — `create(data: any, ...)`, `update(id: string, data: any)`
  - `contracts.service.ts` — `create(data: any, ...)`, `update(id: string, data: any)`
  - `requests.service.ts` — `create(data: any)`, `where: any`
  - `jwt.strategy.ts` — `validate(payload: any)`
  - `web/lib/api/auth.ts` — `register(data: any): Promise<any>`
  - `web/lib/api/client.ts` — multiple `any` parameters
  - `web/components/layouts/Header.tsx` — `user?: any`

  This defeats the purpose of TypeScript strict mode and can lead to runtime errors.
- **Fix:** Create proper DTOs and interfaces for all data types. Use `@mansil/types` package to share types between API and web. Replace all `any` with proper types.

### OPS-009: No Environment Variable Management
- **Severity:** CRITICAL
- **Status:** FAIL
- **File:** `apps/api/.env`, `packages/database/.env`
- **Description:** Critical issues with environment management:
  1. **No `.env.example` files** exist anywhere in the project. New developers have no reference for required environment variables.
  2. **No `.gitignore` at project root** — `.env` files may be committed to version control (only `apps/mobile/.gitignore` exists).
  3. **No env validation** — the API has no `ConfigModule` or `ConfigService` from `@nestjs/config`. Environment variables are not validated at startup.
  4. **No runtime env access** — the API doesn't read `process.env.*` for any configuration at all (port, database URL, etc.). The port is hardcoded to `3001`.
  5. The `DATABASE_URL` in `apps/api/.env` points to a relative file path: `file:../../../packages/database/prisma/dev.db`.
- **Fix:**
  1. Create `.env.example` files in root, `apps/api/`, and `packages/database/`.
  2. Create a root `.gitignore` that excludes `.env`, `node_modules/`, `dist/`, `.next/`, etc.
  3. Install `@nestjs/config` and add `ConfigModule.forRoot()` with validation (using `joi` or `class-validator`).
  4. Make port, database URL, and JWT secret configurable via env vars.

### OPS-010: Hardcoded JWT Secret
- **Severity:** CRITICAL
- **Status:** FAIL
- **File:** `apps/api/src/modules/auth/constants.ts:2`
- **Description:** The JWT signing secret is hardcoded as a static string: `'mansil-secret-key-change-in-prod'`. This is a severe security vulnerability:
  1. Anyone with source code access can forge authentication tokens.
  2. The secret is the same across all environments (dev, staging, production).
  3. The comment "change-in-prod" indicates awareness but no mechanism to enforce it.
  4. The `expiresIn` is also hardcoded at `60m`.
- **Fix:**
  1. Move JWT secret to environment variable: `process.env.JWT_SECRET`.
  2. Add startup validation to reject empty or default secrets.
  3. Use `@nestjs/config` `ConfigService` to inject the secret.
  4. Make `expiresIn` configurable via env var with sensible defaults.

### OPS-011: No Docker Configuration
- **Severity:** HIGH
- **Status:** FAIL
- **File:** N/A (files do not exist)
- **Description:** No `Dockerfile`, `docker-compose.yml`, or `.dockerignore` exists in the project. Without containerization:
  1. No reproducible build/deploy environment.
  2. No local development parity with production.
  3. Cannot deploy to most cloud platforms (ECS, GKE, Cloud Run, etc.).
- **Fix:** Create the following Docker infrastructure:
  ```
  Dockerfile.api        — Multi-stage build for NestJS API
  Dockerfile.web        — Multi-stage build for Next.js web
  docker-compose.yml    — Local development with all services
  docker-compose.prod.yml — Production-like configuration
  .dockerignore         — Exclude node_modules, .git, etc.
  ```
  Recommended `Dockerfile.api` structure:
  ```dockerfile
  FROM node:22-alpine AS base
  WORKDIR /app
  COPY package*.json turbo.json ./
  COPY apps/api/package.json apps/api/
  COPY packages/*/package.json packages/*/
  RUN npm ci --workspace=api --include-workspace-root

  FROM base AS build
  COPY . .
  RUN npx turbo run build --filter=api...

  FROM node:22-alpine AS production
  WORKDIR /app
  COPY --from=build /app/apps/api/dist ./dist
  COPY --from=build /app/node_modules ./node_modules
  EXPOSE 3001
  CMD ["node", "dist/main.js"]
  ```

### OPS-012: No Database Migration Strategy
- **Severity:** CRITICAL
- **Status:** FAIL
- **File:** `packages/database/prisma/`
- **Description:** The `prisma/migrations/` directory does not exist. This means:
  1. No migration history — schema changes are not tracked.
  2. `prisma db push` is likely being used instead of `prisma migrate` — this is fine for prototyping but destructive in production.
  3. No way to roll back schema changes.
  4. No migration scripts in `package.json` for the database package.
  5. The `dev.db` SQLite file is in the prisma directory alongside the schema — may be committed to git.
- **Fix:**
  1. Initialize migrations: `npx prisma migrate dev --name init`.
  2. Add migration scripts to `packages/database/package.json`:
     ```json
     "migrate:dev": "prisma migrate dev",
     "migrate:deploy": "prisma migrate deploy",
     "migrate:status": "prisma migrate status",
     "seed": "ts-node prisma/seed.ts"
     ```
  3. Add `prisma/dev.db` to `.gitignore`.
  4. Document the migration workflow in a `CONTRIBUTING.md`.

### OPS-013: SQLite in Production — Scalability Concerns
- **Severity:** CRITICAL
- **Status:** FAIL
- **File:** `packages/database/prisma/schema.prisma:9`
- **Description:** SQLite is configured as the database (`provider = "sqlite"`). For a production real estate platform, SQLite has critical limitations:
  1. **Single-writer concurrency** — only one write at a time. Multiple API instances cannot safely share an SQLite file.
  2. **No network access** — cannot separate DB server from app server.
  3. **File-based** — requires persistent volume, complicates container deployments.
  4. **No built-in replication** — no read replicas, no failover.
  5. **Limited to ~281 TB** but practical limit much lower for performance.
  6. **No WAL mode configured** — Prisma defaults to DELETE journal mode, which is slower for concurrent reads.
  7. **No backup strategy** — no automated snapshots or point-in-time recovery.
  8. **File permissions** — `dev.db` in the source tree with no access controls.
- **Fix:**
  1. **Short-term (if staying with SQLite):**
     - Enable WAL mode: add to Prisma client initialization or via raw query `PRAGMA journal_mode=WAL`.
     - Set `PRAGMA busy_timeout=5000` for handling concurrent access.
     - Move DB file outside source tree (e.g., `/data/mansil.db`).
     - Implement automated backup (cron job with `sqlite3 .backup`).
     - Set proper file permissions (`chmod 640`).
  2. **Long-term (recommended):**
     - Migrate to PostgreSQL for production. Change `provider = "postgresql"` in schema.
     - Use SQLite only for development/testing.
     - Multi-provider Prisma setup with conditional `datasource` or separate schema files.

### OPS-014: No Structured Logging
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/api/src/main.ts:18`
- **Description:** The API uses only `console.log` for logging (one instance in `main.ts`). There is:
  1. No structured logging library (Winston, Pino, or NestJS Logger).
  2. No log levels (debug, info, warn, error).
  3. No request logging middleware.
  4. No correlation IDs for request tracing.
  5. Prisma client logs to console in dev (`log: ['query', 'error', 'warn']` in `packages/database/src/index.ts`) but this is unstructured.
  6. No log aggregation or rotation strategy.
- **Fix:**
  1. Implement NestJS built-in `Logger` service at minimum.
  2. Better: Use `nestjs-pino` for structured JSON logging:
     ```bash
     npm install nestjs-pino pino-http pino-pretty -w api
     ```
  3. Add request logging middleware with correlation IDs.
  4. Configure log levels per environment (`debug` in dev, `info` in prod).
  5. Ensure no sensitive data (passwords, tokens) is logged.

### OPS-015: No Health Check Endpoint
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/api/src/` (not present)
- **Description:** No health check endpoint exists in the API. There is no `/health` or `/api/health` route. This is essential for:
  1. Load balancer health probes.
  2. Container orchestration liveness/readiness probes (Kubernetes, ECS).
  3. Monitoring and alerting.
  4. Database connectivity verification.
- **Fix:**
  1. Install `@nestjs/terminus`:
     ```bash
     npm install @nestjs/terminus -w api
     ```
  2. Create a health module:
     ```typescript
     @Controller('health')
     export class HealthController {
       constructor(
         private health: HealthCheckService,
         private prismaHealth: PrismaHealthIndicator,
       ) {}

       @Get()
       check() {
         return this.health.check([
           () => this.prismaHealth.pingCheck('database'),
         ]);
       }
     }
     ```

### OPS-016: No Error Monitoring (Sentry/Similar)
- **Severity:** HIGH
- **Status:** FAIL
- **File:** N/A (not configured)
- **Description:** No error monitoring or crash reporting service is integrated. No references to Sentry, Datadog, New Relic, or any monitoring SDK exist in the codebase. In production, unhandled exceptions will be silently lost.
- **Fix:**
  1. Install Sentry for both API and web:
     ```bash
     npm install @sentry/nestjs -w api
     npm install @sentry/nextjs -w web
     ```
  2. Configure Sentry DSN via environment variable.
  3. Add error boundary components in the web app.
  4. Configure source map uploads for meaningful stack traces.
  5. Set up alerting rules for error rate thresholds.

### OPS-017: No CI/CD Pipeline
- **Severity:** CRITICAL
- **Status:** FAIL
- **File:** N/A (`.github/workflows/` does not exist)
- **Description:** No CI/CD pipeline exists. No GitHub Actions, GitLab CI, or any other CI configuration was found. This means:
  1. No automated tests on pull requests.
  2. No automated builds to verify code compiles.
  3. No automated linting or type checking.
  4. No deployment automation.
  5. No branch protection enforcement.
- **Fix:** Create `.github/workflows/ci.yml`:
  ```yaml
  name: CI
  on:
    push:
      branches: [main]
    pull_request:
      branches: [main]

  jobs:
    build-and-test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with:
            node-version: 22
            cache: npm
        - run: npm ci
        - run: npx turbo run build
        - run: npx turbo run lint
        - run: npx turbo run test
  ```
  Also create a deployment workflow for staging/production.

### OPS-018: No Root `.gitignore`
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `.gitignore` (missing)
- **Description:** There is no `.gitignore` file at the project root. Only `apps/mobile/.gitignore` exists. This means:
  1. `node_modules/` could be committed to git.
  2. `.env` files with secrets could be committed.
  3. Build artifacts (`dist/`, `.next/`) could be committed.
  4. IDE files, OS files, and other noise may pollute the repository.
  5. The SQLite database file (`dev.db`) could be committed.
- **Fix:** Create a comprehensive root `.gitignore`:
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
  ```

### OPS-019: No Node.js Version Specification
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** `package.json`
- **Description:** No `.nvmrc` file exists and no `engines` field is defined in the root `package.json`. The current environment uses Node.js v22.22.0, but this is not enforced. Different developers or CI environments may use different Node versions, leading to inconsistent behavior. The `packageManager` field specifies `npm@10.0.0` but the installed version is `10.9.4`.
- **Fix:**
  1. Create `.nvmrc` at project root: `22`
  2. Add `engines` to root `package.json`:
     ```json
     "engines": {
       "node": ">=22.0.0",
       "npm": ">=10.0.0"
     }
     ```
  3. Update `packageManager` to match: `"packageManager": "npm@10.9.4"`

### OPS-020: Next.js — No Production Output Optimization
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** `apps/web/next.config.js:2`
- **Description:** The Next.js configuration is minimal — only `transpilePackages` is configured. Missing production optimizations:
  1. No `output: 'standalone'` for Docker deployment (produces minimal self-contained build).
  2. No image optimization configuration.
  3. No security headers.
  4. No environment variable exposure configuration (`env` or `publicRuntimeConfig`).
- **Fix:** Update `next.config.js`:
  ```javascript
  const nextConfig = {
    output: 'standalone',
    transpilePackages: ["@mansil/ui", "@mansil/types", "@mansil/utils"],
    poweredByHeader: false,
    headers: async () => [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ],
  };
  ```

### OPS-021: CORS Enabled Without Restrictions
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/api/src/main.ts:12`
- **Description:** `app.enableCors()` is called with no arguments, which means CORS is enabled for **all origins**. Any website can make authenticated requests to the API. This is acceptable in development but a security risk in production.
- **Fix:** Configure CORS with specific origins:
  ```typescript
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });
  ```

### OPS-022: Hardcoded Port Number
- **Severity:** LOW
- **Status:** WARN
- **File:** `apps/api/src/main.ts:17`
- **Description:** The API port is hardcoded to `3001`. This prevents configuration via environment variables, which is required for container deployments (most platforms set the `PORT` env var).
- **Fix:**
  ```typescript
  const port = process.env.PORT || 3001;
  await app.listen(port);
  ```

### OPS-023: No Graceful Shutdown Handling
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/api/src/main.ts`
- **Description:** The API has no graceful shutdown handling. While `PrismaService` implements `onModuleDestroy` to disconnect, the NestJS app does not call `app.enableShutdownHooks()`. This means:
  1. SIGTERM/SIGINT may not trigger proper cleanup.
  2. In-flight requests may be dropped during deployment.
  3. Database connections may not be properly closed.
  4. No drain period for active connections.
- **Fix:** Add to `main.ts`:
  ```typescript
  app.enableShutdownHooks();
  ```
  Consider adding a custom shutdown handler:
  ```typescript
  process.on('SIGTERM', async () => {
    logger.log('SIGTERM received, shutting down gracefully...');
    await app.close();
  });
  ```

### OPS-024: No Process Manager Configuration
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** N/A (not configured)
- **Description:** No PM2, systemd, or other process manager configuration exists. For production deployment without containers:
  1. No automatic restart on crash.
  2. No cluster mode for utilizing multiple CPU cores.
  3. No log management.
  4. No resource monitoring.
- **Fix:** If deploying without containers, create `ecosystem.config.js`:
  ```javascript
  module.exports = {
    apps: [{
      name: 'mansil-api',
      script: 'dist/main.js',
      cwd: './apps/api',
      instances: 'max',
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    }],
  };
  ```
  However, **containerized deployment is recommended** over PM2.

### OPS-025: `@mansil/ui` Package Has No Build Script
- **Severity:** LOW
- **Status:** INFO
- **File:** `packages/ui/package.json`
- **Description:** The `@mansil/ui` package has no `build` script. Its `main` and `types` both point to `./src/index.ts` (source, not compiled output). This works with Next.js `transpilePackages` but:
  1. Cannot be consumed by non-transpiling consumers.
  2. Turbo `build` task skips this package (no build script to run).
  3. Not publishable to npm without compilation.
- **Fix:** Either keep the current setup (acceptable for internal monorepo use with transpilation) or add a build step using `tsup` or `tsc` for wider compatibility.

### OPS-026: Database Package — Prisma Generate Not in Build Pipeline
- **Severity:** HIGH
- **Status:** WARN
- **File:** `packages/database/package.json:9`
- **Description:** The `@mansil/database` package build script is just `tsc`. There is no `prisma generate` step in the build pipeline. This means:
  1. If `node_modules/.prisma/client` is stale or missing, the build will fail.
  2. CI/CD environments will need a separate `prisma generate` step.
  3. The `build` script should run `prisma generate` before `tsc`.
- **Fix:** Update `packages/database/package.json`:
  ```json
  "scripts": {
    "build": "prisma generate && tsc",
    "postinstall": "prisma generate"
  }
  ```

### OPS-027: Dev Database File in Source Tree
- **Severity:** INFO
- **Status:** WARN
- **File:** `packages/database/prisma/dev.db`
- **Description:** The SQLite development database (`dev.db`) exists in the prisma directory. Without a root `.gitignore`, this file may be tracked in version control, which could expose development data and cause merge conflicts.
- **Fix:** Add `*.db` to `.gitignore` and remove from git tracking if already committed: `git rm --cached packages/database/prisma/dev.db`.

---

## Build Results Summary

| Package | Build Command | Result |
|---------|-------------|--------|
| `@mansil/types` | `tsc` | PASS (after permission fix) |
| `@mansil/database` | `tsc` | PASS (after permission fix) |
| `@mansil/utils` | `tsc` | PASS (after permission fix) |
| `api` | `nest build` | PASS (after permission fix) |
| `web` | `next build` | **FAIL** — React SSR error #31 on /404 and /500 pages |
| `@mansil/ui` | N/A (no build) | SKIP |
| `@mansil/mobile` | N/A (Expo) | SKIP |

**Overall Build: FAIL** (4 of 5 buildable packages succeed; web app fails)

---

## Environment Details

| Component | Version |
|-----------|---------|
| Node.js | v22.22.0 |
| npm | 10.9.4 |
| Turbo | 2.7.4 |
| Next.js | 14.1.0 |
| NestJS | 10.x |
| Prisma | 5.x |
| TypeScript | 5.x |

---

## Priority Action Plan

### P0 — Must Fix Before Any Deployment
1. **OPS-010** — Remove hardcoded JWT secret; use environment variable
2. **OPS-009** — Create `.env.example` files, implement env validation
3. **OPS-018** — Create root `.gitignore`
4. **OPS-004** — Fix web app build failure
5. **OPS-012** — Initialize Prisma migrations
6. **OPS-017** — Create CI/CD pipeline

### P1 — Must Fix Before Production
7. **OPS-013** — Address SQLite production concerns (migrate to PostgreSQL or harden SQLite)
8. **OPS-011** — Create Docker configuration
9. **OPS-014** — Implement structured logging
10. **OPS-015** — Add health check endpoints
11. **OPS-023** — Enable graceful shutdown
12. **OPS-021** — Configure CORS with specific origins
13. **OPS-016** — Integrate error monitoring (Sentry)
14. **OPS-026** — Add `prisma generate` to build pipeline

### P2 — Should Fix for Production Readiness
15. **OPS-008** — Replace `any` types with proper DTOs
16. **OPS-019** — Specify Node.js version
17. **OPS-020** — Optimize Next.js production config
18. **OPS-003** — Pin Turbo version
19. **OPS-002** — Add test task to Turbo config
20. **OPS-022** — Make port configurable
21. **OPS-024** — Configure process management

---

## Deployment Architecture Recommendation

```
                    ┌─────────────────┐
                    │   Nginx/Caddy   │
                    │  (Reverse Proxy)│
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────┴──────┐ ┌────┴───────┐ ┌────┴──────┐
     │  Next.js Web  │ │ NestJS API │ │  Expo OTA  │
     │  (Port 3000)  │ │ (Port 3001)│ │  (EAS)     │
     └───────────────┘ └─────┬──────┘ └───────────┘
                             │
                    ┌────────┴────────┐
                    │   PostgreSQL    │
                    │  (Production)   │
                    └─────────────────┘
```

For initial deployment, a single VPS with Docker Compose is recommended. As traffic grows, consider Kubernetes or managed container services.
