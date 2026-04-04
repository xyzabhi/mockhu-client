import { getDevNetworkDelayMs } from './config';

/**
 * In __DEV__, optionally waits so local API responses aren’t instant (loading UI is visible).
 * Enable with EXPO_PUBLIC_MOCKHU_API_DEV_DELAY_MS (see config).
 */
export async function devNetworkDelay(): Promise<void> {
  const ms = getDevNetworkDelayMs();
  if (ms <= 0) return;
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
}
