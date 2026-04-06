import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/** Prefer this over raw `navigate` when opening comments so `onReady` races don’t drop navigation. */
export function navigateToPostComments(params: RootStackParamList['PostComments']) {
  const go = () => navigationRef.navigate('PostComments', params);
  if (navigationRef.isReady()) {
    go();
    return;
  }
  requestAnimationFrame(() => {
    if (navigationRef.isReady()) go();
  });
}

let pendingReset: keyof RootStackParamList | null = null;

export function resetToRoute(name: keyof RootStackParamList) {
  if (navigationRef.isReady()) {
    navigationRef.reset({ index: 0, routes: [{ name }] });
    pendingReset = null;
  } else {
    pendingReset = name;
  }
}

/** Call from `NavigationContainer` `onReady` so early `resetToRoute` calls still apply. */
export function flushPendingNavigationReset() {
  if (pendingReset != null && navigationRef.isReady()) {
    const name = pendingReset;
    pendingReset = null;
    navigationRef.reset({ index: 0, routes: [{ name }] });
  }
}
