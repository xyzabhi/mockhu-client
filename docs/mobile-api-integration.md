# Mockhu mobile API layer

This document explains how the React Native app talks to the Mockhu HTTP API: one shared client, normalized responses, token storage, refresh, and auth helpers.

---

## Quick mental model

1. **Almost all app APIs** live under `{BASE_URL}/api/v1/...` and return a **JSON envelope** (`success` + `data` or `error`).
2. **`apiClient` / `apiGet` / `apiPost`** unwrap `data` for you and turn failures into **`AppError`**.
3. **Protected routes** send `Authorization: Bearer <access_token>`. **`/auth/*`** does not use Bearer (tokens go in the body where needed).
4. On **401**, the client runs **one shared refresh**, then **retries the request once**. If it still fails, the session is cleared and navigation resets to **Auth**.

---

## Configuration

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_MOCKHU_API_BASE_URL` | API origin, **no trailing slash** (e.g. `https://api.example.com` or `http://localhost:8080`) |
| `EXPO_PUBLIC_MOCKHU_API_DEV_DELAY_MS` | **__DEV__ only:** milliseconds to wait before each API `fetch` (e.g. `400`). Use `0` or omit to disable. |

Copy `.env.example` to `.env` and set the value. Restart the Expo dev server after changing env vars.

If unset, the app defaults to `http://localhost:8080` on iOS simulator / web, and `http://10.0.2.2:8080` on the **Android emulator**. On a **physical device**, set the base URL to `http://<your-computer-LAN-IP>:8080`.

**Why dev delay?** Local servers respond instantly, so loading UI is hard to see. Setting `EXPO_PUBLIC_MOCKHU_API_DEV_DELAY_MS=400` adds a fixed pause before each API call (including token refresh and `getHealth`), capped at 30s. It does nothing in production.

Helpers (from `src/api/config.ts`):

- **`getApiBaseUrl()`** — origin only  
- **`getApiV1Url()`** — `{origin}/api/v1`  
- **`getHealthUrl()`** — `{origin}/health` (not under `/api/v1`)  
- **`getDevNetworkDelayMs()`** — active dev delay in ms (0 if off)

---

## Folder map (`src/api/`)

| File / folder | Responsibility |
|---------------|----------------|
| `config.ts` | Base URL, URL builders, `getDevNetworkDelayMs` |
| `devNetworkDelay.ts` | `__DEV__` sleep before `fetch` when delay env is set |
| `types.ts` | Envelope types, `TokenResponse`, `TokenUser` |
| `AppError.ts` | Normalized errors with `kind`: `user` \| `retry` \| `reauth` |
| `parseApiResponse.ts` | Read response body, unwrap envelope, handle unwrapped 401 bodies |
| `apiClient.ts` | Single `fetch` pipeline + Bearer + 401 refresh + retry |
| `refreshCoordinator.ts` | **One** in-flight `POST /auth/refresh`; updates session on success |
| `sessionStore.ts` | Persist tokens + user, in-memory snapshot, subscribers |
| `storage/stringStorage.ts` | SecureStore (iOS/Android); sessionStorage on web for dev |
| `reauth.ts` | `setReauthHandler` — e.g. reset navigation to login |
| `auth/authApi.ts` | Signup, login, phone OTP, Google, refresh |
| `auth/types.ts` | Request/response shapes for auth |
| `health.ts` | `GET /health` (plain JSON, not the standard envelope) |
| `user/userApi.ts` | Example feature module using `apiGet` |
| `hooks/useSession.ts` | React hook subscribed to session changes |
| `index.ts` | Public exports |

---

## Response shapes

### Standard envelope (most `/api/v1` routes)

**Success**

```json
{
  "success": true,
  "data": { },
  "meta": { }
}
```

The client returns **`data`** as the resolved value (typed as `T`).

**Failure**

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST | UNAUTHORIZED | NOT_FOUND | CONFLICT | INTERNAL_ERROR",
    "message": "Human-readable message"
  }
}
```

This becomes an **`AppError`** with a **`kind`** derived from `code` and HTTP status (e.g. `UNAUTHORIZED` → `reauth`, server errors → `retry`, others → `user`).

### Middleware 401 (some protected routes)

When the access token is missing or invalid, the server may return **plain JSON** (no `success` field), for example:

```json
{ "message": "missing/invalid Authorization header" }
```

The parser treats **401 + this shape** as a **re-auth** scenario (same idea as an invalid session).

---

## `AppError` and UI

```ts
import { AppError } from '../api';

try {
  await authApi.login({ email, password });
} catch (e) {
  if (e instanceof AppError) {
    switch (e.kind) {
      case 'user':
        // Show e.message (validation, conflict, etc.)
        break;
      case 'retry':
        // Offer retry / generic server issue
        break;
      case 'reauth':
        // Session cleared; app should already move to Auth via handler
        break;
    }
  }
}
```

---

## Session and tokens

After any call that returns **`TokenResponse`**, **`authApi`** persists:

- `access_token`, `refresh_token`
- **Access expiry** as wall-clock time: `Date.now() + expires_in * 1000`
- **`user`**: `{ id, is_onboarded }` (used for routing hints)

**Refresh rotates tokens:** always replace **both** access and refresh with the new pair from the server.

Useful exports:

| Export | Use |
|--------|-----|
| `loadPersistedSession()` | Read storage into memory (app boot) |
| `getSessionSnapshot()` | Current snapshot (sync) |
| `saveTokenResponse()` | Rarely needed directly; `authApi` does this |
| `clearSession()` | Logout |
| `isAccessTokenExpired()` | Check with optional leeway (seconds) |
| `useSession()` | Hook: snapshot + `isLoggedIn` |

---

## Auth endpoints (all `POST`, JSON, under `/api/v1/auth`)

| Method (on `authApi`) | Path | Body | After success |
|------------------------|------|------|----------------|
| `signup` | `/auth/signup` | `{ email, password }` (min 8) | Saves tokens |
| `registerSignup` | `/auth/signup` | Same | No tokens (then `requestEmailOtp`) |
| `login` | `/auth/login` | `{ email, password }` | Saves tokens |
| `requestEmailOtp` | `/auth/email/request` | `{ email }` | Returns message + expiry; dev may include `otp` in JSON |
| `verifyEmailOtp` | `/auth/email/verify` | `{ email, otp }` (6 digits) | Saves tokens |
| `requestPhoneOtp` | `/auth/phone/request` | `{ phone }` E.164 | Returns message + expiry; dev may include `otp` in JSON |
| `verifyPhoneOtp` | `/auth/phone/verify` | `{ phone, otp }` (6 digits) | Saves tokens |
| `forgotPassword` | `/auth/password/forgot` | `{ email }` | Returns `{ message }` (same public copy always); dev may include `otp` |
| `resetPassword` | `/auth/password/reset` | `{ email, otp, new_password }` | Saves tokens (same as login) |
| `google` | `/auth/google` | `{ id_token }` | Saves tokens |
| `refresh` | `/auth/refresh` | `{ refresh_token }` | Saves tokens (also used internally by `refreshCoordinator`) |

Example:

```ts
import { authApi } from '../api';

const tokens = await authApi.login({ email: 'a@b.com', password: 'xxxxxxxx' });
if (tokens.user.is_onboarded) {
  /* navigate to main */
} else {
  /* navigate to onboarding */
}
```

---

## Generic HTTP (feature modules)

Use the same stack for new features — **do not** add a second `fetch` wrapper per screen.

```ts
import { apiGet, apiPost, apiPatch, apiDelete } from '../api';

// Protected: Bearer attached automatically
const profile = await apiGet<MyProfileType>('/me');

await apiPost('/posts', { title: 'Hello' });

// If you ever need to skip Bearer (unusual outside `/auth/*`):
await apiGet('/something/public', { skipAuth: true });
```

Paths are relative to **`/api/v1`** (e.g. `'/me'` → `{BASE_URL}/api/v1/me`).

---

## Health check

```ts
import { getHealth } from '../api';

const { message } = await getHealth(); // not envelope-wrapped
```

---

## 401 flow (protected requests)

```text
Request with Bearer
    → 401
        → Is there a refresh token?
            → No: clear session, reauth handler, throw AppError(reauth)
            → Yes: await single shared refresh()
                → Success: retry original request once
                → Still 401 or refresh failed: clear session, reauth handler, throw
```

Concurrent 401s share **one** refresh promise (`refreshCoordinator`).

---

## Navigation integration (already wired)

- **`RootNavigator`** loads the persisted session, **refreshes** if the access token is expired but refresh exists, then sets the initial stack (spinner while resolving):
  - **Auth** — no usable access session  
  - **Home** — logged in and cached `user.is_onboarded === true`  
  - **Onboarding** — logged in and `is_onboarded !== true` (or missing user cache; treated as not onboarded)  
  Token **refresh** updates `user` from the new payload when the backend sends it.  
- **`setReauthHandler(() => resetToRoute('Auth'))`** runs when refresh fails or session is invalidated.
- **`flushPendingNavigationReset`** on `NavigationContainer` `onReady`** handles `resetToRoute` called before the tree is ready.

---

## Web vs native storage

- **iOS / Android:** tokens use **Expo SecureStore** (when available).
- **Web:** values go to **sessionStorage** under a `mockhu_secure_` prefix so Expo Web can run; this is **not** hardware-backed. Treat web as dev / low-trust for tokens.

---

## Imports cheat sheet

```ts
import {
  authApi,
  apiGet,
  apiPost,
  AppError,
  useSession,
  clearSession,
  getHealth,
  getApiBaseUrl,
} from '../api';
```

Adjust the relative path from your feature folder (e.g. `../../../api`).

---

## Non-goals / reminders

- Do **not** hardcode OTP in production UI; today the backend may return `otp` on phone request for development only.
- Keep **BASE_URL** and secrets out of source; use `.env` / EAS / CI env for real environments.

If you add new backend routes, prefer **one** thin module per domain (like `user/userApi.ts`) that only calls `apiGet` / `apiPost` / … with typed paths and payloads.
