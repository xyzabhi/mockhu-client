import { Platform } from 'react-native';

const DEFAULT_DEV_PORT = 8080;
/** Expo/Metro’s default; never use this port for the Mockhu API base URL. */
const EXPO_METRO_DEFAULT_PORT = 8081;
const MAX_DEV_NETWORK_DELAY_MS = 30_000;

/**
 * Android emulator: `localhost` / `127.0.0.1` are the emulator itself, not your dev machine.
 * `10.0.2.2` is the host loopback (where the API usually runs). Physical devices: put your PC’s
 * LAN IP in `.env` (this rewrite does not apply to real devices using another host).
 */
function rewriteLocalhostForAndroidEmulator(baseUrl: string): string {
  if (Platform.OS !== 'android') {
    return baseUrl;
  }
  try {
    const u = new URL(baseUrl);
    if (u.hostname !== 'localhost' && u.hostname !== '127.0.0.1') {
      return baseUrl.replace(/\/$/, '');
    }
    u.hostname = '10.0.2.2';
    const next = u.toString().replace(/\/$/, '');
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn(
        '[mockhu-api] Android emulator: API host was localhost — using 10.0.2.2 to reach your machine. ' +
          'On a physical device, set EXPO_PUBLIC_MOCKHU_API_BASE_URL to your computer LAN IP.',
      );
    }
    return next;
  } catch {
    return baseUrl.replace(/\/$/, '');
  }
}

function warnIfBaseUrlLooksLikeMetroBundler(baseUrl: string): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__) {
    return;
  }
  try {
    const { port } = new URL(baseUrl);
    if (port === String(EXPO_METRO_DEFAULT_PORT)) {
      console.warn(
        '[mockhu-api] EXPO_PUBLIC_MOCKHU_API_BASE_URL uses port ' +
          EXPO_METRO_DEFAULT_PORT +
          ' (Expo Metro). Point it at your backend (e.g. http://localhost:8080), not the bundler.',
      );
    }
  } catch {
    // ignore invalid URL
  }
}

/**
 * Milliseconds to wait before each API `fetch` in __DEV__ only (local servers are instant).
 * Set `EXPO_PUBLIC_MOCKHU_API_DEV_DELAY_MS` in `.env` (e.g. `400`). Use `0` to disable.
 */
export function getDevNetworkDelayMs(): number {
  if (typeof __DEV__ === 'undefined' || !__DEV__) {
    return 0;
  }
  const raw = process.env.EXPO_PUBLIC_MOCKHU_API_DEV_DELAY_MS?.trim();
  if (raw === undefined || raw === '') {
    return 0;
  }
  if (raw === '0' || raw.toLowerCase() === 'false' || raw.toLowerCase() === 'off') {
    return 0;
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) {
    return 0;
  }
  return Math.min(Math.floor(n), MAX_DEV_NETWORK_DELAY_MS);
}

/**
 * API base URL per environment. Set in `.env` (no trailing slash).
 * Prefer `EXPO_PUBLIC_MOCKHU_API_BASE_URL`; `EXPO_PUBLIC_API_URL` is supported as an alias.
 */
export function getApiBaseUrl(): string {
  const fromEnv =
    process.env.EXPO_PUBLIC_MOCKHU_API_BASE_URL?.trim() ||
    process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) {
    const base = fromEnv.replace(/\/$/, '');
    warnIfBaseUrlLooksLikeMetroBundler(base);
    return rewriteLocalhostForAndroidEmulator(base);
  }
  // Android emulator: localhost is the emulator itself; 10.0.2.2 is the host machine.
  if (typeof __DEV__ !== 'undefined' && __DEV__ && Platform.OS === 'android') {
    return `http://10.0.2.2:${DEFAULT_DEV_PORT}`;
  }
  return `http://localhost:${DEFAULT_DEV_PORT}`;
}

export function getApiV1Url(): string {
  return `${getApiBaseUrl()}/api/v1`;
}

export function getHealthUrl(): string {
  return `${getApiBaseUrl()}/health`;
}
