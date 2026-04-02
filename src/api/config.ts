import { Platform } from 'react-native';

const DEFAULT_DEV_PORT = 8080;
const MAX_DEV_NETWORK_DELAY_MS = 30_000;

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
 * API base URL per environment. Set EXPO_PUBLIC_MOCKHU_API_BASE_URL in .env (no trailing slash).
 */
export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_MOCKHU_API_BASE_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
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
