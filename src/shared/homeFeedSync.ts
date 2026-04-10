/** After creating a post, Home should refetch so the new post appears at the top. */

let pendingRefresh = false;

export function requestHomeFeedRefresh(): void {
  pendingRefresh = true;
}

/** Returns true once, then false until the next `requestHomeFeedRefresh`. */
export function consumeHomeFeedRefreshPending(): boolean {
  if (!pendingRefresh) return false;
  pendingRefresh = false;
  return true;
}
