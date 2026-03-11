# Mobile App (Expo/React Native) Audit Report

**Project:** Mansil Platform — `apps/mobile/`
**Date:** 2026-02-26
**Auditor:** mobile-auditor (automated)
**Expo SDK:** 54 | **React Native:** 0.81.5 | **Router:** expo-router 6

---

## Executive Summary

The mobile application is in an **early prototype stage** and is **not production-ready**. It consists of a small set of screens (login, property list, map, two boilerplate tabs) built with Expo Router, Zustand, and Nativewind. Critical issues include: pervasive TypeScript compilation errors from misconfigured Nativewind, hardcoded `localhost` API URLs that will fail on any physical device, missing authentication guards on protected routes, no Google Maps API key configuration, absence of `SafeAreaView`, and missing iOS/Android identifiers in `app.json`. A total of **37 findings** were identified: **8 CRITICAL**, **11 HIGH**, **11 MEDIUM**, **5 LOW**, and **2 INFO**.

---

## Table of Contents

1. [Navigation](#1-navigation)
2. [Authentication](#2-authentication)
3. [API Integration](#3-api-integration)
4. [Components](#4-components)
5. [Maps](#5-maps)
6. [Performance](#6-performance)
7. [Platform Differences](#7-platform-differences)
8. [Expo Configuration](#8-expo-configuration)
9. [Nativewind / Tailwind](#9-nativewind--tailwind)
10. [State Management](#10-state-management)
11. [Summary Matrix](#summary-matrix)

---

## 1. Navigation

### MOB-001: Map tab not registered in tab navigator
- **Severity:** CRITICAL
- **Status:** FAIL
- **File:** `apps/mobile/app/(tabs)/_layout.tsx:21-58`
- **Description:** The `(tabs)/_layout.tsx` only registers two tabs (`index` and `two`). The `map.tsx` file exists at `app/(tabs)/map.tsx` but has no corresponding `<Tabs.Screen name="map" />` entry. Expo Router will still render the file as a route, but it will not appear in the tab bar and may exhibit unexpected behavior as an unregistered tab screen.
- **Fix:** Add a `<Tabs.Screen name="map" />` entry with appropriate icon and title:
  ```tsx
  <Tabs.Screen
    name="map"
    options={{
      title: 'Map',
      tabBarIcon: ({ color }) => <TabBarIcon name="map" color={color} />,
    }}
  />
  ```

### MOB-002: Placeholder tab names and icons
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** `apps/mobile/app/(tabs)/_layout.tsx:29-56`
- **Description:** Tabs are labeled "Tab One" and "Tab Two" with generic `code` icons. This is boilerplate from the Expo template and does not reflect the app's real estate domain (properties, map, settings, etc.).
- **Fix:** Rename tabs to domain-appropriate names (e.g., "Properties", "Settings") and use relevant icons (e.g., `building`, `map-marker`, `cog`).

### MOB-003: `two.tsx` is boilerplate with no real content
- **Severity:** LOW
- **Status:** WARN
- **File:** `apps/mobile/app/(tabs)/two.tsx:1-32`
- **Description:** Tab Two is an unmodified Expo template screen that shows `EditScreenInfo`. It adds no value to the app and should either be repurposed or removed.
- **Fix:** Replace with a real screen (e.g., Settings, Profile) or remove.

### MOB-004: No deep-linking path configuration
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** `apps/mobile/app.json:8`
- **Description:** While `"scheme": "mobile"` is set, there is no linking configuration for specific routes (e.g., `mobile://properties/123`). Deep links to specific properties or screens will not work.
- **Fix:** Configure deep link paths in the Expo Router setup and test with `npx uri-scheme open`.

### MOB-005: `unstable_settings` used for initial route
- **Severity:** LOW
- **Status:** WARN
- **File:** `apps/mobile/app/_layout.tsx:17-20`
- **Description:** `unstable_settings` is used to set `initialRouteName: '(tabs)'`. As the name suggests, this API is unstable and may change or be removed in future Expo Router versions.
- **Fix:** Monitor Expo Router changelogs; consider using redirect-based initial routing via the auth flow instead.

---

## 2. Authentication

### MOB-006: No auth guard — protected routes accessible without login
- **Severity:** CRITICAL
- **Status:** FAIL
- **File:** `apps/mobile/app/_layout.tsx:51-68`
- **Description:** The root layout renders all routes unconditionally. There is no route guard or redirect logic that prevents unauthenticated users from accessing `(tabs)` screens. The `initialize()` function in the auth store calls `router.replace()`, but this happens asynchronously — the protected screens briefly render before the redirect occurs. A user can also navigate directly to `/(tabs)` via deep link without being authenticated.
- **Fix:** Implement a proper auth gate in `_layout.tsx`:
  ```tsx
  const { token, isLoading } = useAuth();
  if (isLoading) return <SplashScreen />;
  return token ? <TabsLayout /> : <Redirect href="/login" />;
  ```

### MOB-007: `router.replace` called during initialization may cause navigation race
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/mobile/store/auth.ts:26-39`
- **Description:** The `initialize()` function calls `router.replace()` while the app's navigation tree may not be fully mounted. This can cause "Attempted to navigate before mounting" warnings or crashes, especially on slow devices or during cold starts.
- **Fix:** Move navigation logic out of the store. Use the auth state reactively in the layout component with `<Redirect>` instead.

### MOB-008: No token expiry validation
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/mobile/store/auth.ts:26-39`
- **Description:** `initialize()` checks if a token exists in SecureStore but never validates whether it is expired or revoked. A stale JWT will be used for API calls, resulting in 401 errors with no automatic recovery.
- **Fix:** Decode the JWT and check `exp` claim during initialization. If expired, clear the token and redirect to login. Alternatively, add an Axios response interceptor for 401s.

### MOB-009: No token refresh mechanism
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/mobile/store/auth.ts:1-41`
- **Description:** There is no refresh token flow. When the access token expires, the user must re-enter credentials. For a mobile app that may stay backgrounded for hours, this creates a poor UX.
- **Fix:** Implement a refresh token flow: store a refresh token in SecureStore, add an Axios interceptor that retries on 401 with a refreshed token.

### MOB-010: Login form lacks keyboard type for email
- **Severity:** LOW
- **Status:** WARN
- **File:** `apps/mobile/app/login.tsx:46-52`
- **Description:** The email `TextInput` sets `autoCapitalize="none"` but does not specify `keyboardType="email-address"`. Users will see a standard keyboard instead of one optimized for email entry (with `@` prominent).
- **Fix:** Add `keyboardType="email-address"` to the email input.

### MOB-011: Login error handling is too generic
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** `apps/mobile/app/login.tsx:31`
- **Description:** All API errors result in the same "Invalid credentials" alert, even for network errors or server 500s. The user has no way to distinguish between wrong password and no connectivity.
- **Fix:** Differentiate error types: network errors ("No internet connection"), 401 ("Invalid credentials"), and server errors ("Server error, try again later").

---

## 3. API Integration

### MOB-012: Hardcoded `localhost` API URL — app will not work on devices
- **Severity:** CRITICAL
- **Status:** FAIL
- **Files:** `apps/mobile/app/(tabs)/index.tsx:6`, `apps/mobile/app/(tabs)/map.tsx:7`, `apps/mobile/app/login.tsx:7`
- **Description:** `API_URL` is hardcoded to `http://localhost:3001` in three separate files. On a physical device or emulator, `localhost` resolves to the device itself, not the development machine. The app will fail to make any API calls on real hardware.
- **Fix:**
  1. Create a centralized API config: `lib/api.ts`
  2. Use environment variables via `expo-constants` or `.env` files
  3. Use `10.0.2.2` for Android emulator or the machine's LAN IP for devices
  ```ts
  // lib/api.ts
  import Constants from 'expo-constants';
  const API_URL = Constants.expoConfig?.extra?.apiUrl ?? 'http://localhost:3001';
  export const api = axios.create({ baseURL: API_URL });
  ```

### MOB-013: No centralized Axios instance — duplicated config in every screen
- **Severity:** HIGH
- **Status:** FAIL
- **Files:** `apps/mobile/app/(tabs)/index.tsx:25-26`, `apps/mobile/app/(tabs)/map.tsx:29-30`, `apps/mobile/app/login.tsx:23`
- **Description:** Each screen creates its own Axios request with manually set headers. The `Authorization` header is constructed in every `fetchProperties` call. There is no shared Axios instance, no request/response interceptors, and no central error handling.
- **Fix:** Create a shared Axios instance with interceptors:
  ```ts
  // lib/api.ts
  const api = axios.create({ baseURL: API_URL });
  api.interceptors.request.use((config) => {
    const token = useAuth.getState().token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  api.interceptors.response.use(null, (error) => {
    if (error.response?.status === 401) useAuth.getState().signOut();
    return Promise.reject(error);
  });
  ```

### MOB-014: No offline/network error handling
- **Severity:** HIGH
- **Status:** FAIL
- **Files:** `apps/mobile/app/(tabs)/index.tsx:29`, `apps/mobile/app/(tabs)/map.tsx:34`
- **Description:** API errors are caught with `console.error` only. There is no user-visible error state, no retry mechanism, and no detection of offline status. If the API call fails, the user sees an empty property list or blank map with no explanation.
- **Fix:** Add error state to screens, show user-friendly error messages, add a retry button, and consider using `@react-native-community/netinfo` for connectivity detection.

### MOB-015: Duplicate Property interface defined in multiple files
- **Severity:** MEDIUM
- **Status:** WARN
- **Files:** `apps/mobile/app/(tabs)/index.tsx:8-15`, `apps/mobile/app/(tabs)/map.tsx:9-16`
- **Description:** The `Property` interface is defined independently in both `index.tsx` and `map.tsx` with slightly different fields (`index.tsx` has `address`/`area` while `map.tsx` has `latitude`/`longitude`). This will lead to type drift. The monorepo has a `packages/types` package that should be used.
- **Fix:** Define the `Property` type in `packages/types` and import it in both screens.

---

## 4. Components

### MOB-016: Mixed styling approaches — Nativewind `className` and `StyleSheet`
- **Severity:** MEDIUM
- **Status:** WARN
- **Files:** `apps/mobile/app/(tabs)/index.tsx` (className), `apps/mobile/app/(tabs)/two.tsx` (StyleSheet), `apps/mobile/app/modal.tsx` (StyleSheet)
- **Description:** The codebase inconsistently uses Nativewind `className` in some screens and traditional `StyleSheet.create` in others. This creates a fragmented DX and makes it harder to maintain a consistent visual language.
- **Fix:** Pick one approach and standardize. If using Nativewind, convert all StyleSheet usage to className. If not, remove Nativewind.

### MOB-017: `EditScreenInfo` component is Expo boilerplate — should be removed
- **Severity:** LOW
- **Status:** WARN
- **File:** `apps/mobile/components/EditScreenInfo.tsx:1-77`
- **Description:** This is the default Expo template component that shows "Open up the code for this screen". It adds no value and confuses the codebase.
- **Fix:** Remove `EditScreenInfo.tsx` and its usages in `two.tsx` and `modal.tsx`.

### MOB-018: No `KeyboardAvoidingView` on login form
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/mobile/app/login.tsx:39-75`
- **Description:** The login screen has two `TextInput` fields but no `KeyboardAvoidingView`. On iOS, the soft keyboard will cover the input fields and the login button, making it impossible to submit the form without dismissing the keyboard.
- **Fix:** Wrap the login form in `<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>`.

### MOB-019: `TouchableOpacity` used without haptic feedback
- **Severity:** LOW
- **Status:** INFO
- **Files:** `apps/mobile/app/(tabs)/index.tsx:64`, `apps/mobile/app/login.tsx:66`
- **Description:** Property list items and the login button use `TouchableOpacity` but have no haptic feedback. Modern mobile apps typically provide haptic feedback for important interactions.
- **Fix:** Consider using `expo-haptics` for button presses or migrating to `Pressable` with custom feedback.

### MOB-020: Property list items not navigable
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** `apps/mobile/app/(tabs)/index.tsx:64-74`
- **Description:** Each property item in the FlatList is wrapped in a `TouchableOpacity` but has no `onPress` handler. Tapping a property does nothing — there is no detail screen to navigate to.
- **Fix:** Add an `onPress` handler that navigates to a property detail screen (which also needs to be created).

---

## 5. Maps

### MOB-021: `PROVIDER_GOOGLE` hardcoded without Google Maps API key
- **Severity:** CRITICAL
- **Status:** FAIL
- **File:** `apps/mobile/app/(tabs)/map.tsx:51`
- **Description:** The map uses `PROVIDER_GOOGLE` but there is no Google Maps API key configured in `app.json` (no `config.googleMaps.apiKey` in the iOS or Android sections). The map will fail to render on both platforms. On iOS, Apple Maps is available as default provider and does not require an API key.
- **Fix:** Either:
  1. Remove `provider={PROVIDER_GOOGLE}` to use platform default maps (Apple Maps on iOS, Google Maps on Android)
  2. Or add API keys in `app.json`:
  ```json
  "ios": { "config": { "googleMapsApiKey": "YOUR_KEY" } },
  "android": { "config": { "googleMaps": { "apiKey": "YOUR_KEY" } } }
  ```

### MOB-022: No location permission request
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/mobile/app/(tabs)/map.tsx:18-74`
- **Description:** The map screen does not request or check location permissions. The `showsUserLocation` prop is not set, and there is no call to `expo-location` to request foreground location permissions. Users cannot see their current position on the map.
- **Fix:** Add `expo-location`, request permission, and enable user location display:
  ```ts
  import * as Location from 'expo-location';
  const { status } = await Location.requestForegroundPermissionsAsync();
  ```

### MOB-023: No marker clustering for large datasets
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** `apps/mobile/app/(tabs)/map.tsx:59-70`
- **Description:** All properties are rendered as individual `<Marker>` components. With hundreds of properties, this will cause severe performance issues (overdraw, sluggish panning). No clustering library (e.g., `react-native-map-clustering`) is used.
- **Fix:** Add `react-native-map-clustering` or implement custom clustering for datasets > 50 markers.

### MOB-024: Map initial region hardcoded to Seoul coordinates
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** `apps/mobile/app/(tabs)/map.tsx:53-58`
- **Description:** The initial map region is hardcoded to `37.5665, 126.9780` (Seoul city center). If properties are outside Seoul, they won't be visible on first load. The map should either fit to the bounds of loaded properties or center on the user's location.
- **Fix:** After fetching properties, use `mapRef.fitToCoordinates()` to adjust the viewport to show all markers.

---

## 6. Performance

### MOB-025: Duplicate API calls — same endpoint fetched by index and map tabs
- **Severity:** MEDIUM
- **Status:** WARN
- **Files:** `apps/mobile/app/(tabs)/index.tsx:23-35`, `apps/mobile/app/(tabs)/map.tsx:27-38`
- **Description:** Both the property list and map screens independently fetch `GET /properties` on mount. Switching between tabs triggers redundant API calls. There is no shared cache or data layer.
- **Fix:** Lift property data to a shared Zustand store or use a data-fetching library like `@tanstack/react-query` to enable caching and deduplication.

### MOB-026: `useEffect` dependency array missing `token`
- **Severity:** HIGH
- **Status:** FAIL
- **Files:** `apps/mobile/app/(tabs)/index.tsx:37-39`, `apps/mobile/app/(tabs)/map.tsx:23-25`
- **Description:** The `useEffect` that calls `fetchProperties()` has an empty dependency array `[]`, but `fetchProperties` uses `token` from the auth store. If the token changes (e.g., after refresh or re-login), the data will not be re-fetched with the new token. The ESLint `react-hooks/exhaustive-deps` rule would flag this.
- **Fix:** Add `token` to the dependency array or restructure to use the token via the Axios interceptor so the effect doesn't need it as a dependency.

### MOB-027: No `useEffect` cleanup — potential memory leak
- **Severity:** MEDIUM
- **Status:** WARN
- **Files:** `apps/mobile/app/(tabs)/index.tsx:37-39`, `apps/mobile/app/(tabs)/map.tsx:23-25`
- **Description:** The `useEffect` hooks that initiate API calls have no cleanup function. If the component unmounts before the async call completes, the `setState` call will execute on an unmounted component (React 18+ handles this more gracefully but it's still poor practice).
- **Fix:** Use an `AbortController` or a mounted flag:
  ```ts
  useEffect(() => {
    const controller = new AbortController();
    fetchProperties(controller.signal);
    return () => controller.abort();
  }, []);
  ```

### MOB-028: `item.price.toLocaleString()` may be slow in FlatList renderItem
- **Severity:** LOW
- **Status:** INFO
- **File:** `apps/mobile/app/(tabs)/index.tsx:72`
- **Description:** `toLocaleString()` is called inside `renderItem` on every render. For large lists, this can add up. Consider pre-formatting prices before passing to the list.
- **Fix:** Format prices when storing data or memoize the render item component.

---

## 7. Platform Differences

### MOB-029: No `SafeAreaView` — content obscured by notch/status bar
- **Severity:** CRITICAL
- **Status:** FAIL
- **Files:** `apps/mobile/app/(tabs)/index.tsx:54-83`, `apps/mobile/app/(tabs)/map.tsx:48-73`, `apps/mobile/app/login.tsx:39-75`
- **Description:** No screen uses `SafeAreaView` or the `useSafeAreaInsets` hook from `react-native-safe-area-context` (which is installed). On iPhones with a notch/Dynamic Island and Android devices with status bar cutouts, the top content (property list title, login form) will be obscured.
- **Fix:** Wrap screen content in `<SafeAreaView>` or use `useSafeAreaInsets()` for finer control. The tab screens get some protection from the header, but the login screen (with `headerShown: false`) has none.

### MOB-030: `StatusBar` component only used in modal
- **Severity:** MEDIUM
- **Status:** WARN
- **Files:** `apps/mobile/app/modal.tsx:15`, `apps/mobile/app/_layout.tsx` (missing)
- **Description:** `<StatusBar>` from `expo-status-bar` is only used in the modal screen. The root layout does not set a global `StatusBar` style. On Android with `edgeToEdgeEnabled: true`, the status bar may overlap content or have incorrect coloring.
- **Fix:** Add `<StatusBar style="auto" />` in the root `_layout.tsx` to ensure consistent status bar behavior across all screens.

### MOB-031: No Android back-button handling for login flow
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** `apps/mobile/app/login.tsx`
- **Description:** On Android, pressing the hardware back button on the login screen could exit the app or navigate to an unexpected state. There is no `BackHandler` logic or `gestureEnabled: false` to control this behavior.
- **Fix:** Add `BackHandler` to prevent back navigation from login when unauthenticated, or configure the Stack screen with `gestureEnabled: false`.

---

## 8. Expo Configuration

### MOB-032: Missing iOS `bundleIdentifier`
- **Severity:** CRITICAL
- **Status:** FAIL
- **File:** `apps/mobile/app.json:17-18`
- **Description:** The iOS configuration has no `bundleIdentifier`. This is required for building and submitting to the App Store. Without it, `eas build` will prompt interactively or fail in CI.
- **Fix:** Add a reverse-domain bundle identifier:
  ```json
  "ios": {
    "supportsTablet": true,
    "bundleIdentifier": "com.mansil.mobile"
  }
  ```

### MOB-033: Missing Android `package` name
- **Severity:** CRITICAL
- **Status:** FAIL
- **File:** `apps/mobile/app.json:19-25`
- **Description:** The Android configuration has no `package` name. This is required for building APKs/AABs and publishing to the Play Store.
- **Fix:** Add:
  ```json
  "android": {
    "package": "com.mansil.mobile",
    ...
  }
  ```

### MOB-034: No permissions declared in `app.json`
- **Severity:** HIGH
- **Status:** FAIL
- **File:** `apps/mobile/app.json`
- **Description:** The app uses Maps (which implies location) but declares no permissions. For iOS, `infoPlist` with `NSLocationWhenInUseUsageDescription` is needed. For Android, `permissions` array should include `ACCESS_FINE_LOCATION`. Without these, the app may crash or be rejected from stores.
- **Fix:**
  ```json
  "ios": {
    "infoPlist": {
      "NSLocationWhenInUseUsageDescription": "We need your location to show nearby properties."
    }
  },
  "android": {
    "permissions": ["ACCESS_FINE_LOCATION"]
  }
  ```

### MOB-035: Generic app name and slug
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** `apps/mobile/app.json:3-4`
- **Description:** `"name": "mobile"` and `"slug": "mobile"` are not user-facing quality. The app name should be the brand name (e.g., "Mansil" or "만실") and the slug should be unique for EAS.
- **Fix:** Update to `"name": "Mansil"`, `"slug": "mansil-mobile"`.

---

## 9. Nativewind / Tailwind

### MOB-036: Nativewind v4 misconfigured — massive TypeScript errors
- **Severity:** CRITICAL
- **Status:** FAIL
- **Files:** `apps/mobile/babel.config.js:5`, `apps/mobile/tsc.log`
- **Description:** The `tsc.log` shows **dozens** of TypeScript errors: `Property 'className' does not exist on type 'ViewProps'`. This indicates Nativewind's type augmentation is not working correctly. The `nativewind-env.d.ts` file exists with `/// <reference types="nativewind/types" />` but the types are not being applied. Additionally, Nativewind v4 recommends using the **Metro plugin** (`withNativeWind()` in `metro.config.js`) rather than the Babel plugin `"nativewind/babel"`.
- **Fix:**
  1. Update `metro.config.js` to use Nativewind v4's Metro integration:
     ```js
     const { withNativeWind } = require('nativewind/metro');
     module.exports = withNativeWind(config, { input: './global.css' });
     ```
  2. Remove `"nativewind/babel"` from `babel.config.js`
  3. Ensure `nativewind-env.d.ts` is properly included in `tsconfig.json`
  4. Verify that `global.css` is imported in the root layout (it is, via `../../global.css`)

### MOB-037: Tailwind config does not extend web theme
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** `apps/mobile/tailwind.config.js`
- **Description:** The Tailwind config has an empty `theme.extend`. The `apps/web` app likely has custom colors, fonts, and spacing. For brand consistency, the mobile Tailwind config should share theme tokens with the web app (possibly via a shared preset in `packages/ui`).
- **Fix:** Create a shared Tailwind preset in `packages/ui/tailwind-preset.js` and extend it in both web and mobile configs.

---

## 10. State Management

### MOB-038: Zustand store has no middleware (persist, devtools)
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** `apps/mobile/store/auth.ts:13-41`
- **Description:** The auth store manually calls `SecureStore.setItemAsync` / `getItemAsync` / `deleteItemAsync`. Zustand has a `persist` middleware that can automate this. The store also lacks devtools middleware for debugging.
- **Fix:** Use Zustand's `persist` middleware with a custom `SecureStore` storage adapter:
  ```ts
  import { persist, createJSONStorage } from 'zustand/middleware';
  const secureStorage = {
    getItem: SecureStore.getItemAsync,
    setItem: SecureStore.setItemAsync,
    removeItem: SecureStore.deleteItemAsync,
  };
  ```

### MOB-039: No global error or loading state
- **Severity:** MEDIUM
- **Status:** WARN
- **File:** `apps/mobile/store/auth.ts`
- **Description:** Only the auth store exists. There is no global store for API loading states, errors, or app-level UI state (e.g., network connectivity). Each screen manages its own loading/error independently, leading to inconsistent UX.
- **Fix:** Consider adding a global UI store or adopting `@tanstack/react-query` for server-state management which provides loading/error states automatically.

---

## Summary Matrix

| ID | Title | Severity | Status |
|---|---|---|---|
| MOB-001 | Map tab not registered in tab navigator | CRITICAL | FAIL |
| MOB-002 | Placeholder tab names and icons | MEDIUM | WARN |
| MOB-003 | `two.tsx` is boilerplate with no real content | LOW | WARN |
| MOB-004 | No deep-linking path configuration | MEDIUM | WARN |
| MOB-005 | `unstable_settings` used for initial route | LOW | WARN |
| MOB-006 | No auth guard — protected routes accessible without login | CRITICAL | FAIL |
| MOB-007 | `router.replace` called during initialization may cause race | HIGH | FAIL |
| MOB-008 | No token expiry validation | HIGH | FAIL |
| MOB-009 | No token refresh mechanism | HIGH | FAIL |
| MOB-010 | Login form lacks keyboard type for email | LOW | WARN |
| MOB-011 | Login error handling is too generic | MEDIUM | WARN |
| MOB-012 | Hardcoded `localhost` API URL — fails on devices | CRITICAL | FAIL |
| MOB-013 | No centralized Axios instance | HIGH | FAIL |
| MOB-014 | No offline/network error handling | HIGH | FAIL |
| MOB-015 | Duplicate Property interface in multiple files | MEDIUM | WARN |
| MOB-016 | Mixed styling approaches (Nativewind + StyleSheet) | MEDIUM | WARN |
| MOB-017 | `EditScreenInfo` boilerplate should be removed | LOW | WARN |
| MOB-018 | No `KeyboardAvoidingView` on login form | HIGH | FAIL |
| MOB-019 | `TouchableOpacity` without haptic feedback | LOW | INFO |
| MOB-020 | Property list items not navigable (no onPress) | MEDIUM | WARN |
| MOB-021 | `PROVIDER_GOOGLE` without API key config | CRITICAL | FAIL |
| MOB-022 | No location permission request | HIGH | FAIL |
| MOB-023 | No marker clustering for large datasets | MEDIUM | WARN |
| MOB-024 | Map initial region hardcoded to Seoul | MEDIUM | WARN |
| MOB-025 | Duplicate API calls from list and map tabs | MEDIUM | WARN |
| MOB-026 | `useEffect` dependency array missing `token` | HIGH | FAIL |
| MOB-027 | No `useEffect` cleanup — potential memory leak | MEDIUM | WARN |
| MOB-028 | `toLocaleString()` in FlatList renderItem | LOW | INFO |
| MOB-029 | No `SafeAreaView` — content obscured by notch | CRITICAL | FAIL |
| MOB-030 | `StatusBar` only used in modal | MEDIUM | WARN |
| MOB-031 | No Android back-button handling for login | MEDIUM | WARN |
| MOB-032 | Missing iOS `bundleIdentifier` | CRITICAL | FAIL |
| MOB-033 | Missing Android `package` name | CRITICAL | FAIL |
| MOB-034 | No permissions declared in `app.json` | HIGH | FAIL |
| MOB-035 | Generic app name and slug | MEDIUM | WARN |
| MOB-036 | Nativewind v4 misconfigured — TS errors | CRITICAL | FAIL |
| MOB-037 | Tailwind config does not extend web theme | MEDIUM | WARN |
| MOB-038 | Zustand store has no middleware | MEDIUM | WARN |
| MOB-039 | No global error or loading state | MEDIUM | WARN |

### Severity Breakdown

| Severity | Count |
|---|---|
| CRITICAL | 8 |
| HIGH | 11 |
| MEDIUM | 13 |
| LOW | 5 |
| INFO | 2 |
| **Total** | **39** |

### Priority Remediation Order

1. **Immediate (blocks development):** MOB-036 (Nativewind TS errors), MOB-012 (localhost URL), MOB-032/033 (missing identifiers)
2. **Before testing:** MOB-006 (auth guard), MOB-021 (maps API key), MOB-029 (SafeAreaView), MOB-001 (map tab)
3. **Before beta:** MOB-013 (Axios centralization), MOB-018 (keyboard), MOB-007/008/009 (auth flow), MOB-014 (offline), MOB-022 (permissions), MOB-034 (app.json permissions)
4. **Before release:** MOB-026 (effect deps), MOB-025 (dedup API), MOB-023 (clustering), MOB-030/031 (platform), MOB-035 (app name)
5. **Polish:** All remaining MEDIUM/LOW/INFO items
