/** Web OAuth client ID — required for `idToken` on Android and for `GoogleSignin.configure`. */
export function getGoogleWebClientId(): string | undefined {
  const explicit = process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID?.trim();
  if (explicit) return explicit;
  return process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || undefined;
}

/** iOS OAuth client ID (Google Cloud, type iOS) — bundle ID must match `app.json`. */
export function getGoogleIosClientId(): string | undefined {
  return process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || undefined;
}

function envFlagTrue(raw: string | undefined): boolean {
  if (raw == null || raw === '') return false;
  const v = raw.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

/** When true: `POST /auth/google` after native sign-in. When false (default): print Google user only. */
export function isMockhuGoogleAuthEnabled(): boolean {
  return envFlagTrue(process.env.EXPO_PUBLIC_MOCKHU_GOOGLE_AUTH);
}
