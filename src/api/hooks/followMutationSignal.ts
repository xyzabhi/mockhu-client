const listeners = new Set<() => void>();

/** Notify subscribers that follow/unfollow data changed. */
export function emitFollowMutation(): void {
  for (const fn of listeners) fn();
}

/** Subscribe to follow/unfollow mutations; returns unsubscribe. */
export function subscribeFollowMutations(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

