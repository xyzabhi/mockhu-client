declare namespace NodeJS {
  interface ProcessEnv {
    /** Mockhu API origin without trailing slash, e.g. https://api.example.com */
    EXPO_PUBLIC_MOCKHU_API_BASE_URL?: string;
    /** __DEV__ only: ms to sleep before each API fetch (0 / off / false to disable). */
    EXPO_PUBLIC_MOCKHU_API_DEV_DELAY_MS?: string;
    /**
     * Public HTTPS URL for the Mockhu logo (PNG/SVG/WebP) — matches email OTP branding when
     * the server uses the same asset via `EMAIL_OTP_LOGO_URL`. Optional; falls back to bundled asset.
     */
    EXPO_PUBLIC_BRAND_LOGO_URL?: string;
    /** Optional; overrides `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` for `GoogleSignin.configure` `webClientId`. */
    EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID?: string;
    /** Google Cloud Web application OAuth client ID — required for native Google Sign-In (`webClientId`). */
    EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?: string;
    /** Google Cloud iOS OAuth client ID — required on iOS; also used to derive iOS URL scheme in `app.config.js`. */
    EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?: string;
    /**
     * When `true` / `1`: after native Google sign-in, call `POST /api/v1/auth/google` and complete app login.
     * When unset/false (default): only print Google profile to Metro — no backend.
     */
    EXPO_PUBLIC_MOCKHU_GOOGLE_AUTH?: string;
  }
}
