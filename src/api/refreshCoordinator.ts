import { getApiV1Url } from './config';
import { devNetworkDelay } from './devNetworkDelay';
import { notifyReauthRequired } from './reauth';
import { hydrateSessionUserFromMe } from './hydrateSessionProfile';
import { parseApiResponse } from './parseApiResponse';
import * as sessionStore from './sessionStore';
import type { TokenResponse } from './types';

let inFlight: Promise<void> | null = null;

/**
 * Single in-flight refresh; concurrent 401s await the same promise.
 * On failure: clears session and invokes reauth handler.
 */
export function refreshTokens(): Promise<void> {
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const refreshToken = await sessionStore.getRefreshToken();
    if (!refreshToken) {
      await sessionStore.clearSession();
      notifyReauthRequired();
      throw new Error('No refresh token');
    }

    const url = `${getApiV1Url()}/auth/refresh`;
    await devNetworkDelay();
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    try {
      const data = await parseApiResponse<TokenResponse>(res);
      await sessionStore.saveTokenResponse(data);
      await hydrateSessionUserFromMe();
    } catch {
      await sessionStore.clearSession();
      notifyReauthRequired();
      throw new Error('Refresh failed');
    }
  })();

  const done = inFlight.finally(() => {
    inFlight = null;
  });

  return done;
}
