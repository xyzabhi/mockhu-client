import { useEffect, useState } from 'react';
import {
  getSessionSnapshot,
  subscribeSession,
  type SessionSnapshot,
} from '../sessionStore';

export type UseSessionResult = SessionSnapshot & {
  isLoggedIn: boolean;
};

/**
 * Subscribe to access/refresh tokens and cached user (after login/refresh/bootstrap).
 */
export function useSession(): UseSessionResult {
  const [snap, setSnap] = useState<SessionSnapshot>(() => getSessionSnapshot());

  useEffect(() => {
    setSnap(getSessionSnapshot());
    return subscribeSession(() => setSnap(getSessionSnapshot()));
  }, []);

  return {
    ...snap,
    isLoggedIn: Boolean(snap.accessToken),
  };
}
