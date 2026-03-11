# Frontend Web (Next.js) Audit Report

**Project:** Mansil Platform — `apps/web/`
**Auditor:** frontend-web-auditor
**Date:** 2026-02-26
**Framework:** Next.js 14.1.0 (App Router), React 18, Tailwind CSS 3, Zustand 4

---

## Executive Summary

The Next.js web application has a solid foundation with proper use of App Router conventions, Korean localization throughout the UI, and clean Tailwind-based styling. However, the audit uncovered **9 CRITICAL**, **14 HIGH**, **12 MEDIUM**, and **10 LOW** severity findings across security, data fetching, type safety, accessibility, performance, and localization. The most urgent issues are hardcoded `localhost` API URLs (breaks any deployment), missing authentication middleware (no route protection), inconsistent token key names, and XSS vectors in Leaflet popups.

**Total findings: 45**
- CRITICAL: 9
- HIGH: 14
- MEDIUM: 12
- LOW: 10

---

## 1. API Client & Networking

### WEB-001: Hardcoded localhost API URL in client.ts
- **Severity:** CRITICAL
- **Status:** FAIL
- **File:** `apps/web/lib/api/client.ts:1`
- **Description:** `const API_BASE_URL = 'http://localhost:3001'` is hardcoded. This will break in all non-local environments (staging, production, Docker, Vercel, etc.).
- **Fix:** Use `process.env.NEXT_PUBLIC_API_URL` with a `.env` default. Ensure the env var is set in all deployment configs.

### WEB-002: Hardcoded localhost in auth.ts
- **Severity:** CRITICAL
- **Status:** FAIL
- **File:** `apps/web/lib/api/auth.ts:1`
- **Description:** `const API_URL = 'http://localhost:3001'` duplicates the base URL and does not use the shared `client.ts`. The auth module bypasses the centralized API client entirely.
- **Fix:** Refactor `login()` and `register()` to use the shared `client` from `./client.ts` so token attachment, error handling, and base URL are consistent.

### WEB-003: Hardcoded localhost in requests.ts
- **Severity:** CRITICAL
- **Status:** FAIL
- **File:** `apps/web/lib/api/requests.ts:3`
- **Description:** `const API_URL = 'http://localhost:3001'` — a third duplicate of the API base URL. `createRequest`, `fetchRequests`, `fetchRequest`, and `fetchRequestMatches` all bypass the shared client.
- **Fix:** Migrate all functions to use the shared `client` from `./client.ts`.

### WEB-004: Hardcoded localhost in community pages
- **Severity:** CRITICAL
- **Status:** FAIL
- **File:** `apps/web/app/(main)/community/page.tsx:12`, `apps/web/app/(main)/community/write/page.tsx:21`, `apps/web/app/(main)/community/[id]/page.tsx:12`
- **Description:** Community pages use raw `fetch('http://localhost:3001/...')` calls directly in components, bypassing both the shared client and auth token attachment. Six separate hardcoded localhost URLs across three files.
- **Fix:** Create `lib/api/community.ts` using the shared client and replace all inline fetch calls.

### WEB-005: No token refresh / 401 handling in API client
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/web/lib/api/client.ts:26-36`
- **Description:** When an API call returns 401 (token expired), the client throws a generic error. There is no automatic token refresh, no redirect to login, and no session expiry handling. Users will see cryptic errors instead of being prompted to re-authenticate.
- **Fix:** Add a response interceptor that catches 401 errors, attempts to refresh the token (if a refresh endpoint exists), or redirects to `/login` and clears the stored token.

### WEB-006: Server-side fetch cannot access localStorage tokens
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/web/lib/api/client.ts:19-24`
- **Description:** The client guards token access with `typeof window !== 'undefined'`, so server components (like `Dashboard`, `PropertiesPage`, `ContractsPage`, `CustomersPage`, `RequestDetailPage`) that call `fetchProperties()`, `fetchContracts()`, etc. will make unauthenticated requests. If the API requires auth tokens, all server-side data fetching will fail or return incomplete data.
- **Fix:** Implement a server-side token strategy: use HTTP-only cookies for auth tokens (readable by server components), or pass tokens via headers in server-side requests using `cookies()` from `next/headers`.

### WEB-007: requests.ts API functions missing auth headers
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/web/lib/api/requests.ts:6-11`
- **Description:** `createRequest()` sends no Authorization header. The function uses raw `fetch` without token attachment. This will fail if the backend requires authentication.
- **Fix:** Use the shared `client.post()` which handles token attachment.

### WEB-008: No request timeout configuration
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** `apps/web/lib/api/client.ts:5-40`
- **Description:** No `AbortController` or timeout is configured on any API request. Slow or hanging backend responses will cause the UI to appear frozen indefinitely.
- **Fix:** Add an `AbortController` with a reasonable timeout (e.g. 15 seconds) to the shared `request()` function.

---

## 2. Authentication Flow

### WEB-009: No authentication middleware — zero route protection
- **Severity:** CRITICAL
- **Status:** FAIL
- **File:** `apps/web/middleware.ts` (missing)
- **Description:** There is no `middleware.ts` file at the `apps/web/` root. All routes under `(main)/` are accessible without authentication. Any unauthenticated user can access dashboard, contracts, customers, ledger, and all business data.
- **Fix:** Create `apps/web/middleware.ts` that checks for auth tokens (cookie or header) and redirects unauthenticated users to `/login`. Protect all `(main)/*` routes.

### WEB-010: Inconsistent token key between login and API client
- **Severity:** CRITICAL
- **Status:** FAIL
- **File:** `apps/web/app/(auth)/login/page.tsx:21` vs `apps/web/lib/api/client.ts:20` vs `apps/web/app/(main)/community/write/page.tsx:25`
- **Description:** Login page stores `localStorage.setItem('access_token', data.access_token)`. The API client reads `localStorage.getItem('access_token')`. But community write and detail pages read `localStorage.getItem('token')`. This means community pages will never send auth tokens.
- **Fix:** Standardize on a single key name (`access_token`) across the entire app.

### WEB-011: No registration page exists
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/web/app/(auth)/login/page.tsx:70`
- **Description:** The login page links to `/register` but no `app/(auth)/register/page.tsx` exists. This results in a 404 page.
- **Fix:** Create a registration page at `apps/web/app/(auth)/register/page.tsx`.

### WEB-012: Login error shown via alert() instead of inline UI
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** `apps/web/app/(auth)/login/page.tsx:25`
- **Description:** `alert('로그인에 실패했습니다...')` is a poor UX pattern. It blocks the main thread and provides no structured error display.
- **Fix:** Add an error state variable and render the error message inline within the form UI.

### WEB-013: No "remember me" or session persistence strategy
- **Severity:** LOW
- **Status:** WARN
- **File:** `apps/web/app/(auth)/login/page.tsx:21`
- **Description:** Token is stored in `localStorage` which persists across sessions but has no expiry tracking. There's no way for the user to remain logged in with a refresh token, nor is there a "log out" button visible in the UI.
- **Fix:** Add a logout mechanism (clear token, redirect to login). Consider using HTTP-only cookies for better security, and implement refresh token rotation.

---

## 3. Pages Audit

### WEB-014: Dashboard uses hardcoded user name and stats
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** `apps/web/app/(main)/page.tsx:24`
- **Description:** `안녕하세요, 이영교 중개사님 👋` and the quick stats (12 new listings, 5 inquiries, etc.) are hardcoded strings, not fetched from the API. Notifications are also static mock data (lines 110-114).
- **Fix:** Fetch actual user profile, stats, and notifications from the API. Display loading/error states.

### WEB-015: Dashboard property images use `<img>` instead of Next.js `<Image>`
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** `apps/web/app/(main)/page.tsx:69`
- **Description:** Raw `<img>` tags are used for property images. This bypasses Next.js image optimization (lazy loading, WebP conversion, responsive sizing).
- **Fix:** Use `next/image` with appropriate `width`, `height`, and `sizes` props. Configure `remotePatterns` in `next.config.js`.

### WEB-016: Property detail page inconsistent image type
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/web/app/(main)/properties/[id]/page.tsx:89` vs `apps/web/app/(main)/page.tsx:67`
- **Description:** The dashboard references `property.images[0]` (a string), but the detail page references `property.images[0].url` (an object with `.url`). The shared `@mansil/types` defines `images: string[]`. The local `lib/api/properties.ts` defines `images?: { url: string }[]`. This type mismatch will cause runtime errors in one context or the other.
- **Fix:** Align the `images` type across the shared types package, the local API types, and all consuming components. Pick one format and be consistent.

### WEB-017: Property registration page uses hardcoded lat/lng
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/web/app/(main)/properties/register/page.tsx:46-47`
- **Description:** `lat: 36.363, lng: 127.355` are hardcoded. Every property registered through this form will have the same coordinates regardless of the actual address. The address search button does nothing (`type="button"` with no handler).
- **Fix:** Integrate a geocoding service (e.g., Kakao Maps API) to resolve addresses to coordinates. Wire up the search button to trigger address lookup.

### WEB-018: Proposal page nested inside (main) layout shows sidebar/header
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** `apps/web/app/(main)/properties/[id]/proposal/page.tsx:23-33`
- **Description:** The proposal print page is inside the `(main)` route group, so it inherits the sidebar, header, and bottom nav. The page uses CSS `@media print` to hide nav, but the user sees the full layout when viewing the page before printing.
- **Fix:** Move the proposal page to its own route group (e.g., `app/(print)/properties/[id]/proposal/page.tsx`) with a minimal layout, or create a dedicated print layout.

### WEB-019: Proposal page `<img>` tag missing alt attribute
- **Severity:** LOW
- **Status:** WARN
- **File:** `apps/web/app/(main)/properties/[id]/proposal/page.tsx:58`
- **Description:** `<img src={property.images[0].url} className="..." />` has no `alt` attribute. This is an accessibility (a11y) violation.
- **Fix:** Add `alt={property.title}` or a descriptive alt text.

### WEB-020: `force-dynamic` overused across layouts and pages
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** `apps/web/app/layout.tsx:9`, `apps/web/app/(main)/layout.tsx:5`, `apps/web/app/(main)/page.tsx:7`, etc.
- **Description:** `export const dynamic = 'force-dynamic'` is set on the root layout, main layout, and multiple pages. This disables all static optimization and caching in Next.js, meaning every page request hits the server even for content that could be cached. In the root layout, this forces the entire application to be dynamic.
- **Fix:** Remove `force-dynamic` from layouts (it should be set per-page only where needed). Use `revalidate` for pages that can tolerate stale data. Only force-dynamic on pages that truly need real-time data.

### WEB-021: Request detail page has no error boundary for failed fetches
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** `apps/web/app/(main)/requests/[id]/page.tsx:10-11`
- **Description:** `const request = await fetchRequest(params.id)` and `const matches = await fetchRequestMatches(params.id)` are called without try/catch. If the API call fails, the entire page will crash with an unhandled error.
- **Fix:** Wrap in try/catch or use Next.js `error.tsx` boundary. Add loading states with `loading.tsx`.

---

## 4. Components Audit

### WEB-022: PropertyCard imports from `@mansil/utils` vs local formatters inconsistency
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/web/components/features/property/PropertyCard.tsx:6`
- **Description:** `PropertyCard` imports `formatCurrency` and `formatArea` from `@mansil/utils`, while other pages use `formatPrice` and `formatArea` from `@/lib/formatters`. The two `formatArea` functions have different semantics: `@mansil/utils` takes pyeong and converts to m², while `@/lib/formatters` takes m² and converts to pyeong. Using the wrong one will display incorrect area values.
- **Fix:** Standardize on one set of formatting utilities. Either consolidate into `@mansil/utils` or `@/lib/formatters`, and ensure all components use the same functions.

### WEB-023: CustomerList has no empty state handling
- **Severity:** LOW
- **Status:** WARN
- **File:** `apps/web/components/features/customer/CustomerList.tsx:25-65`
- **Description:** If `initialCustomers` is an empty array, the component renders an empty grid with no feedback message.
- **Fix:** Add an empty state message like "등록된 고객이 없습니다."

### WEB-024: ContractList has no empty state handling
- **Severity:** LOW
- **Status:** WARN
- **File:** `apps/web/components/features/contract/ContractList.tsx:28-67`
- **Description:** Same issue as WEB-023 — empty contracts array renders nothing.
- **Fix:** Add an empty state message.

### WEB-025: Header mobile menu button does nothing
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** `apps/web/components/layouts/Header.tsx:12`
- **Description:** `onMenuClick` prop is defined but never passed from `MainLayout`. The hamburger button in mobile view does nothing when clicked — there's no mobile slide-out sidebar implementation.
- **Fix:** Implement a mobile drawer/menu that opens the sidebar, or pass `onMenuClick` from `MainLayout` and toggle a mobile sidebar state.

### WEB-026: BottomNav links to non-existent routes
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** `apps/web/components/layouts/BottomNav.tsx:22`
- **Description:** `/menu` route does not exist. `/properties/manage` route does not exist. These will render 404 pages.
- **Fix:** Create the missing pages or update the navigation links to point to existing routes.

### WEB-027: Sidebar links to non-existent routes
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** `apps/web/components/layouts/Sidebar.tsx:25,32`
- **Description:** `/properties/manage` and `/settings` routes do not exist. Clicking these menu items will show 404.
- **Fix:** Create the missing pages or remove/disable the menu items.

---

## 5. State Management (Zustand)

### WEB-028: Zustand dependency present but no stores exist
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/web/package.json:29`
- **Description:** `zustand: "^4.5.0"` is listed as a dependency, but no store files exist anywhere in the project (no `store/`, `stores/`, or any file importing zustand). This is an unused dependency. More importantly, the application has no centralized state management — each page manages its own local state with `useState`, leading to no data sharing between pages and potential stale data.
- **Fix:** Either remove the zustand dependency if not needed, or implement stores for auth state, property data cache, and other shared state that currently relies on `localStorage` and local component state.

---

## 6. Forms & Validation

### WEB-029: No client-side validation on property registration form
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/web/app/(main)/properties/register/page.tsx:32-68`
- **Description:** The form relies solely on HTML `required` attribute on the title field. No validation for: deposit/rent must be positive numbers, area/floor must be positive, address is required, and there is no form validation library (e.g., zod, react-hook-form). Negative numbers or zero can be submitted.
- **Fix:** Add comprehensive client-side validation. Validate number ranges, required fields, and display inline error messages.

### WEB-030: New request form allows submission of invalid phone numbers
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/web/app/(main)/requests/new/page.tsx:73-77`
- **Description:** The `clientPhone` field accepts any text with no pattern validation. Korean phone numbers should follow the `010-XXXX-XXXX` format.
- **Fix:** Add phone number pattern validation (`pattern="010-\\d{4}-\\d{4}"`) and auto-formatting.

### WEB-031: Contract creation uses hardcoded agentId
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/web/app/(main)/workspace/contracts/new/page.tsx:69`
- **Description:** `agentId: 'user-id-placeholder'` is hardcoded. Every contract will be created with this invalid agent ID. Comment says "Backend should handle this via token" but the value is still sent.
- **Fix:** Remove the `agentId` field from the frontend payload and let the backend extract it from the auth token, or retrieve the current user's ID from an auth store/context.

### WEB-032: alert() used for all form success/error feedback
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** Multiple: `register/page.tsx:60,65`, `contracts/new/page.tsx:71,75`, `community/write/page.tsx:33,37`, `ledger/page.tsx:51`
- **Description:** `alert()` is used throughout the app for both success and error feedback. This is a poor UX pattern that blocks the main thread.
- **Fix:** Implement a toast/notification system for non-blocking feedback.

### WEB-033: FileUpload component in property registration is non-functional
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/web/app/(main)/properties/register/page.tsx:202`
- **Description:** `<FileUpload label="매물 사진 (최대 10장)" multiple accept="image/*" />` is rendered but there is no upload handler, no state management for selected files, and no integration with the `handleSubmit` function. Images selected by the user are silently discarded.
- **Fix:** Wire the FileUpload to state, handle file uploads (either as multipart form data or base64), and include image data in the property creation payload.

---

## 7. Performance

### WEB-034: LeafletMap fetches clusters on every map move without debounce
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/web/components/features/property/LeafletMap.tsx:69-71`
- **Description:** The `moveend` event fires `fetchClusters()` on every map pan/zoom without debouncing. Rapid map movements will flood the API with requests.
- **Fix:** Debounce `fetchClusters` with a 300-500ms delay using `setTimeout` or a debounce utility.

### WEB-035: LeafletMap fetchClusters uses stale closure over showRealTransactions
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/web/components/features/property/LeafletMap.tsx:27-51,82`
- **Description:** `fetchClusters` is defined inside the component body but referenced inside the `useEffect` with `[]` dependency array. The `showRealTransactions` value captured in the closure will always be the initial value (`false`). Toggling the checkbox won't actually fetch real transactions during map movements.
- **Fix:** Use `useRef` for mutable state that the callback reads, or use `useCallback` with proper dependencies and re-attach the event listener when dependencies change.

### WEB-036: PropertySearch uses dynamic import() for pagination
- **Severity:** LOW
- **Status:** WARN
- **File:** `apps/web/components/features/property/PropertySearch.tsx:25`
- **Description:** `const newProps = await import('@/lib/api/properties').then(m => m.fetchProperties(...))` uses dynamic import to load the API module for pagination. This is unnecessary since the module is already imported at the page level and should be statically imported in this component.
- **Fix:** Import `fetchProperties` statically at the top of the file.

### WEB-037: No loading.tsx or error.tsx files for any route segment
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** `apps/web/app/` (project-wide)
- **Description:** No `loading.tsx` or `error.tsx` files exist in any route segment. Server component data fetching failures will show unhandled errors. Loading states are only implemented in client components manually.
- **Fix:** Add `loading.tsx` (with skeleton UIs) and `error.tsx` (with retry functionality) to key route segments: `(main)/`, `(main)/properties/`, `(main)/workspace/`.

---

## 8. SEO & Head Management

### WEB-038: Minimal metadata — missing OpenGraph, Twitter cards, and favicon
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** `apps/web/app/layout.tsx:4-7`
- **Description:** Root layout only sets `title` and `description`. Missing: OpenGraph tags (og:title, og:description, og:image), Twitter card meta, favicon, theme-color, viewport configuration, canonical URL, and Korean-specific meta (content-language).
- **Fix:** Add comprehensive metadata:
  ```ts
  export const metadata: Metadata = {
    title: { default: 'Mansil', template: '%s | Mansil' },
    description: '...',
    openGraph: { title: '...', description: '...', url: '...', siteName: 'Mansil', locale: 'ko_KR' },
    twitter: { card: 'summary_large_image' },
    icons: { icon: '/favicon.ico' },
    metadataBase: new URL('https://mansil.com'),
  };
  ```

### WEB-039: No per-page metadata on any page
- **Severity:** LOW
- **Status:** WARN
- **File:** All pages under `apps/web/app/(main)/`
- **Description:** No page exports its own `metadata` or uses `generateMetadata()`. All pages share the same generic title "Mansil - Premium Real Estate Platform". This hurts SEO as search engines cannot distinguish between pages.
- **Fix:** Add `generateMetadata` to key pages, especially property detail (with property title in the page title) and community posts.

---

## 9. Tailwind / CSS

### WEB-040: No dark mode support
- **Severity:** LOW
- **Status:** INFO
- **File:** `apps/web/tailwind.config.ts`
- **Description:** No `darkMode` configuration in Tailwind config. All colors are hardcoded for light mode only. Not a bug, but worth noting as a feature gap.
- **Fix:** If dark mode is desired, add `darkMode: 'class'` to the Tailwind config and add dark variants to component styles.

### WEB-041: Global CSS uses non-standard CSS variable pattern
- **Severity:** LOW
- **Status:** INFO
- **File:** `apps/web/app/globals.css:6-8`
- **Description:** `--foreground-rgb: 0, 0, 0` and `--background-start-rgb` / `--background-end-rgb` are defined but `--background-*` vars are never used anywhere. The body just uses `background: white`. These are leftover from the Next.js starter template.
- **Fix:** Remove unused CSS variables to keep styles clean.

---

## 10. Map Integration (Leaflet)

### WEB-042: XSS vulnerability in Leaflet popup HTML
- **Severity:** CRITICAL
- **Status:** FAIL
- **File:** `apps/web/components/features/property/LeafletMap.tsx:126-133`
- **Description:** Leaflet `.bindPopup()` accepts raw HTML strings. Real transaction data from the API is interpolated directly into HTML without sanitization: `${rt.date}`, `${rt.price}`, `${rt.area}`, `${rt.floor}`. If any of these values contain malicious HTML/JavaScript from the API response, it will be executed in the user's browser (stored XSS).
- **Fix:** Sanitize all interpolated values using a library like DOMPurify, or use Leaflet's `L.popup().setContent()` with DOM elements instead of raw HTML strings.

### WEB-043: Leaflet marker icon CDN dependency
- **Severity:** LOW
- **Status:** WARN
- **File:** `apps/web/components/features/property/LeafletMap.tsx:11-14`
- **Description:** Default marker icons are loaded from `cdnjs.cloudflare.com`. If the CDN is blocked (e.g., by a corporate firewall or in China), markers will display broken images.
- **Fix:** Bundle the marker icons locally as static assets in `public/`.

### WEB-044: No marker clustering library used
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** `apps/web/components/features/property/LeafletMap.tsx:96-108`
- **Description:** Clustering is handled server-side (via `/properties/map/clusters`), but the client does not use `leaflet.markercluster` for any client-side clustering or smooth transitions. When the backend cluster endpoint is slow, hundreds of individual markers could render simultaneously.
- **Fix:** Consider adding `leaflet.markercluster` as a fallback for smoother UX, or ensure the backend clustering is robust.

---

## 11. Calendar Integration (FullCalendar)

### WEB-045: FullCalendar missing Korean locale package
- **Severity:** LOW
- **Status:** WARN
- **File:** `apps/web/app/(main)/workspace/schedule/page.tsx:38`
- **Description:** `locale="ko"` is set but the `@fullcalendar/core/locales/ko` package is not explicitly imported. FullCalendar may or may not resolve the locale automatically depending on the version and bundler config. Button text is manually overridden (lines 46-50), suggesting the locale isn't fully working.
- **Fix:** Explicitly import the Korean locale: `import koLocale from '@fullcalendar/core/locales/ko'` and pass it as `locales={[koLocale]}`.

### WEB-046: FullCalendar has no event click/create handlers
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** `apps/web/app/(main)/workspace/schedule/page.tsx:35-52`
- **Description:** The calendar displays events but has no `eventClick`, `dateClick`, or `select` handlers. Users cannot create, edit, or interact with schedule events. The `interactionPlugin` is imported but underutilized.
- **Fix:** Add `dateClick` for creating new events, `eventClick` for viewing/editing events, and potentially `editable: true` for drag-and-drop.

### WEB-047: FullCalendar styled with global `<style jsx>` overrides
- **Severity:** LOW
- **Status:** WARN
- **File:** `apps/web/app/(main)/workspace/schedule/page.tsx:29-34`
- **Description:** `<style jsx global>` is used to override FullCalendar styles. These global styles may leak into other components. Additionally, `!important` is used to force button colors.
- **Fix:** Use a dedicated CSS module or scoped styles. FullCalendar supports a `--fc-*` CSS custom property system for theming.

---

## 12. Korean Localization

### WEB-048: Community pages use English labels instead of Korean
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/web/app/(main)/community/page.tsx:21-24`, `write/page.tsx:45-79`, `[id]/page.tsx:59-85`
- **Description:** Community section uses English throughout: "Community", "New Post", "By", "Views", "Comments", "Write Post", "Category", "Title", "Content", "Cancel", "Submit", "Submitting...", "Write a comment...", "Post", "Loading...". This is inconsistent with the rest of the app which is properly localized in Korean.
- **Fix:** Translate all community UI strings to Korean: "커뮤니티", "새 글쓰기", "작성자", "조회", "댓글", "글쓰기", "카테고리", "제목", "내용", "취소", "등록", "등록 중...", "댓글 작성...", "등록", "로딩 중..."

### WEB-049: Date formatting inconsistent — no Korean date locale
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** Multiple: `community/page.tsx:45`, `community/[id]/page.tsx:58`, `proposal/page.tsx:154`
- **Description:** `new Date(post.createdAt).toLocaleDateString()` and `toLocaleString()` are called without specifying `'ko-KR'` locale. The output depends on the server/browser locale and will be inconsistent. The proposal page uses `new Date().toLocaleDateString()` without locale for the document date.
- **Fix:** Always pass `'ko-KR'` as locale: `new Date(date).toLocaleDateString('ko-KR')`. Better yet, use `date-fns` with Korean locale for consistent formatting across server and client.

### WEB-050: Currency display inconsistent across the app
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** `apps/web/app/(main)/workspace/ledger/page.tsx:62,66,70`
- **Description:** Ledger page uses `₩{stats.income.toLocaleString()}` (with ₩ sign), while property pages use the Korean 만/억 system via `formatPrice()`. The two formats are inconsistent — the ledger shows raw won amounts while properties show traditional Korean price format.
- **Fix:** Decide on a consistent currency display strategy. For real estate, the 만/억 system is standard. For ledger/accounting, exact won amounts may be appropriate but should still use `formatCurrency()` for consistency.

---

## 13. Security (Additional)

### WEB-051: Community post content rendered without sanitization
- **Severity:** CRITICAL
- **Status:** FAIL
- **File:** `apps/web/app/(main)/community/[id]/page.tsx:69-71`
- **Description:** `{post.content}` is rendered inside a `<div>` with `whitespace-pre-wrap`. While React escapes strings by default (so this isn't XSS via JSX), if the rendering ever switches to `dangerouslySetInnerHTML` for rich text, it becomes an XSS vector. More critically, `post.author.name` and `post.content` are rendered from untrusted API data with no validation.
- **Fix:** This is currently safe due to React's default escaping, but document the assumption. If rich text editing is added later, use a sanitization library.

### WEB-052: BuildingRegisterTab uses hardcoded mock data
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/web/components/features/property/BuildingRegisterTab.tsx:9-22`
- **Description:** The building register tab shows completely fabricated data (hardcoded mock). It claims "실시간 조회 완료" (real-time query completed) but never actually calls any API. This misleads users into thinking they're seeing real government data.
- **Fix:** Integrate with the actual building register API endpoint, or clearly label the data as "목업 데이터 (Mock Data)" until the API is ready.

---

## 14. Type Safety

### WEB-053: Extensive use of `any` types
- **Severity:** HIGH
- **Status:** FAIL
- **File:** Multiple locations
- **Description:** Widespread use of `any` types undermines TypeScript's safety:
  - `apps/web/lib/api/auth.ts:3,17` — `login()` and `register()` return `Promise<any>`
  - `apps/web/lib/api/properties.ts:31` — `client.get<any>` for fetchProperties
  - `apps/web/app/(main)/community/page.tsx:40` — `posts.map((post: any) =>`
  - `apps/web/app/(main)/community/[id]/page.tsx:6` — `useState<any>(null)`
  - `apps/web/components/layouts/Header.tsx:9` — `user?: any`
  - `apps/web/lib/api/ledger.ts:10` — `contract?: any`
  - `apps/web/lib/api/schedule.ts:9` — `extendedProps?: any`
  - `apps/web/components/features/property/LeafletMap.tsx:21,24` — markers and realTransactions as `any[]`
- **Fix:** Define proper TypeScript interfaces for all API responses and component props. Create types for Post, Comment, AuthResponse, etc.

### WEB-054: Local Property type diverges from shared @mansil/types Property
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/web/lib/api/properties.ts:3-24` vs `packages/types/src/property.ts:29-63`
- **Description:** `lib/api/properties.ts` defines its own `Property` type that differs from `@mansil/types`:
  - Local: `images?: { url: string }[]` vs Shared: `images: string[]`
  - Local: missing `coordinates`, `options`, `isVerified`
  - Local: has `agent?: { name, email, phone }` which shared type doesn't have
  - This causes the same data to be typed differently depending on which import is used.
- **Fix:** Use the shared `@mansil/types` `Property` interface everywhere. Extend it if needed via intersection types rather than redefining.

---

## 15. Miscellaneous

### WEB-055: next.config.js missing security headers and image domains
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/web/next.config.js:1-6`
- **Description:** The Next.js config is minimal — no security headers (CSP, X-Frame-Options, HSTS, etc.), no `images.remotePatterns` for external image domains, no redirects, and no rewrites for API proxying.
- **Fix:** Add security headers via `headers()`, configure `images.remotePatterns` for image optimization, and consider adding API rewrites to avoid CORS issues:
  ```js
  async headers() {
    return [{ source: '/(.*)', headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    ]}];
  }
  ```

---

## Summary Table

| ID | Title | Severity | Status |
|---|---|---|---|
| WEB-001 | Hardcoded localhost in client.ts | CRITICAL | FAIL |
| WEB-002 | Hardcoded localhost in auth.ts | CRITICAL | FAIL |
| WEB-003 | Hardcoded localhost in requests.ts | CRITICAL | FAIL |
| WEB-004 | Hardcoded localhost in community pages | CRITICAL | FAIL |
| WEB-005 | No token refresh / 401 handling | HIGH | FAIL |
| WEB-006 | Server-side fetch can't access localStorage | HIGH | FAIL |
| WEB-007 | requests.ts missing auth headers | HIGH | FAIL |
| WEB-008 | No request timeout configuration | MEDIUM | WARN |
| WEB-009 | No auth middleware — zero route protection | CRITICAL | FAIL |
| WEB-010 | Inconsistent token key (access_token vs token) | CRITICAL | FAIL |
| WEB-011 | No registration page (404 link) | HIGH | FAIL |
| WEB-012 | Login error via alert() | MEDIUM | WARN |
| WEB-013 | No session persistence / logout | LOW | WARN |
| WEB-014 | Dashboard hardcoded user/stats | MEDIUM | WARN |
| WEB-015 | `<img>` instead of Next.js `<Image>` | MEDIUM | WARN |
| WEB-016 | Inconsistent image type (string vs object) | HIGH | FAIL |
| WEB-017 | Hardcoded lat/lng in property registration | HIGH | FAIL |
| WEB-018 | Proposal page shows sidebar/header | MEDIUM | WARN |
| WEB-019 | Missing alt attribute on proposal img | LOW | WARN |
| WEB-020 | force-dynamic overused | MEDIUM | WARN |
| WEB-021 | Request detail no error boundary | MEDIUM | WARN |
| WEB-022 | formatArea inconsistency (m² vs pyeong input) | HIGH | FAIL |
| WEB-023 | CustomerList no empty state | LOW | WARN |
| WEB-024 | ContractList no empty state | LOW | WARN |
| WEB-025 | Header mobile menu button does nothing | MEDIUM | WARN |
| WEB-026 | BottomNav links to non-existent routes | MEDIUM | WARN |
| WEB-027 | Sidebar links to non-existent routes | MEDIUM | WARN |
| WEB-028 | Zustand unused — no stores exist | HIGH | FAIL |
| WEB-029 | No form validation on property registration | HIGH | FAIL |
| WEB-030 | No phone number validation | HIGH | FAIL |
| WEB-031 | Hardcoded agentId in contract creation | HIGH | FAIL |
| WEB-032 | alert() for all form feedback | MEDIUM | WARN |
| WEB-033 | FileUpload is non-functional | HIGH | FAIL |
| WEB-034 | LeafletMap no debounce on moveend | HIGH | FAIL |
| WEB-035 | Stale closure in fetchClusters | HIGH | FAIL |
| WEB-036 | Unnecessary dynamic import for pagination | LOW | WARN |
| WEB-037 | No loading.tsx / error.tsx files | MEDIUM | WARN |
| WEB-038 | Missing OpenGraph, favicon, comprehensive meta | MEDIUM | WARN |
| WEB-039 | No per-page metadata | LOW | WARN |
| WEB-040 | No dark mode support | LOW | INFO |
| WEB-041 | Unused CSS variables from template | LOW | INFO |
| WEB-042 | XSS in Leaflet popup HTML | CRITICAL | FAIL |
| WEB-043 | Marker icons from external CDN | LOW | WARN |
| WEB-044 | No client-side marker clustering | MEDIUM | WARN |
| WEB-045 | Missing Korean locale import for FullCalendar | LOW | WARN |
| WEB-046 | No event click/create handlers | MEDIUM | WARN |
| WEB-047 | Global style overrides for FullCalendar | LOW | WARN |
| WEB-048 | Community pages in English | HIGH | FAIL |
| WEB-049 | Date formatting without ko-KR locale | MEDIUM | WARN |
| WEB-050 | Currency display inconsistent | MEDIUM | WARN |
| WEB-051 | Post content rendering (currently safe) | CRITICAL | WARN |
| WEB-052 | BuildingRegisterTab uses fake data | HIGH | FAIL |
| WEB-053 | Extensive use of `any` types | HIGH | FAIL |
| WEB-054 | Local Property type diverges from shared | HIGH | FAIL |
| WEB-055 | Missing security headers and image config | HIGH | FAIL |

---

## Priority Fix Order

### Immediate (Before any deployment)
1. **WEB-001/002/003/004** — Replace all hardcoded localhost URLs with env var
2. **WEB-009** — Add authentication middleware
3. **WEB-010** — Fix inconsistent token key names
4. **WEB-042** — Fix XSS in Leaflet popups
5. **WEB-055** — Add security headers to next.config.js

### High Priority (Before beta)
6. **WEB-005/006** — Fix server-side auth and token refresh
7. **WEB-016/054** — Standardize Property types
8. **WEB-022** — Fix formatArea inconsistency
9. **WEB-029/030/031** — Add form validation
10. **WEB-033** — Wire up FileUpload
11. **WEB-034/035** — Fix Leaflet performance bugs
12. **WEB-048** — Translate community pages to Korean
13. **WEB-052** — Label or replace mock data
14. **WEB-011** — Create registration page

### Medium Priority (Before production)
15. Remaining HIGH and MEDIUM items
16. Add `loading.tsx` / `error.tsx` boundaries
17. Replace `alert()` with toast system
18. Implement proper SEO metadata
19. Fix dead navigation links

---

*End of Frontend Web Audit Report*
