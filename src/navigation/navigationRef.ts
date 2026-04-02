import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

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
