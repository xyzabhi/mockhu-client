import { getSessionSnapshot } from '../api/sessionStore';
import { resetToRoute } from './navigationRef';

/**
 * After tokens + user cache are persisted (login, signup, phone verify, refresh, etc.),
 * move to the correct root stack from `user.is_onboarded`.
 *
 * Missing `user` in cache (should be rare) → Onboarding as the safer default for new accounts.
 */
export function resetToRootAfterAuth(): void {
  const { user } = getSessionSnapshot();
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
