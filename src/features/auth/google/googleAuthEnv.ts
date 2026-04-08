import { Platform } from 'react-native';

/**
 * OAuth client IDs from Google Cloud Console (no secrets in the client — these are public).
 * Set in `.env` — see `.env.example`.
 */
export function getGoogleWebClientId(): string | undefined {
  return process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || undefined;
}

export function getGoogleIosClientId(): string | undefined {
  return process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || undefined;
}

export function getGoogleAndroidClientId(): string | undefined {
  return process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() || undefined;
}

/**
 * Client IDs passed into `Google.useAuthRequest`.
 * expo-auth-session throws if the **current platform’s** id is `undefined` (e.g. iOS requires `iosClientId`).
 * We fall back to the web client ID when a native-specific ID is omitted (common in dev / Expo).
 */
export function getGoogleAuthClientIdsForRequest(): {
  webClientId: string;
  iosClientId: string;
  androidClientId: string;
} {
  const web = getGoogleWebClientId() ?? '';
  const ios = getGoogleIosClientId() ?? web;
  const android = getGoogleAndroidClientId() ?? web;
  return {
    webClientId: web,
    iosClientId: ios,
    androidClientId: android,
  };
}

/**
 * True when we have at least a web client ID (and for native, either native or web id is enough to attempt OAuth).
 */
export function isGoogleAuthConfigured(): boolean {
  const web = getGoogleWebClientId();
  if (!web) return false;
  if (Platform.OS === 'web') return true;
  if (Platform.OS === 'ios') return Boolean(getGoogleIosClientId() ?? web);
  if (Platform.OS === 'android') return Boolean(getGoogleAndroidClientId() ?? web);
  return false;
}
