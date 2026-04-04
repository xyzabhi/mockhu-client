import type { TokenUser } from '../api/types';
import { getSessionSnapshot } from '../api/sessionStore';
import { resetToRoute } from './navigationRef';

/**
 * After tokens + user cache are persisted (login, signup, phone verify, refresh, etc.),
 * move to the correct root stack from `user.is_onboarded`.
 *
 * Callers should pass `tokens` from the auth response when available so routing matches
 * the user object that was just saved (same as `getSessionSnapshot()` after `await` resolves).
 *
 * Missing `user` in cache (should be rare) → Onboarding as the safer default for new accounts.
 */
export function resetToRootAfterAuth(tokens?: { user: TokenUser }): void {
  const user = tokens?.user ?? getSessionSnapshot().user;
  if (user?.is_onboarded === true) {
    resetToRoute('Home');
  } else {
    resetToRoute('Onboarding');
  }
}

/** Cold-start routing when we already have a valid access session in memory. */
export function rootDestinationForSession(): 'Home' | 'Onboarding' {
  const { user } = getSessionSnapshot();
  return user?.is_onboarded === true ? 'Home' : 'Onboarding';
}
