/** When the user bookmarks from one screen, other lists can update without refetching. */

export type BookmarkPatch = { bookmarked_by_me: boolean };

type Listener = (postId: string, patch: BookmarkPatch) => void;

const listeners = new Set<Listener>();

export function subscribePostBookmarkUpdate(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyPostBookmarkUpdate(postId: string, patch: BookmarkPatch): void {
  listeners.forEach((l) => l(postId, patch));
}
