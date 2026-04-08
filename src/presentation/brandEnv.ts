/**
 * Public logo URL for in-app branding parity with OTP emails (same asset as server `EMAIL_OTP_LOGO_URL`).
 * Set `EXPO_PUBLIC_BRAND_LOGO_URL` in `.env` — HTTPS only in production; no API keys.
 */
export function getBrandLogoUrl(): string | undefined {
  const raw = process.env.EXPO_PUBLIC_BRAND_LOGO_URL?.trim();
  if (!raw) return undefined;
  if (raw.startsWith('https://')) return raw;
  if (typeof __DEV__ !== 'undefined' && __DEV__ && raw.startsWith('http://')) {
    return raw;
  }
  return undefined;
}
