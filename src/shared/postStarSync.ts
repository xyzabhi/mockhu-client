/**
 * When the user stars/unstars from the comments sheet, the feed’s list can
 * update without refetching. (There is no comment-star API — only posts.)
 * */

type StarPatch = { star_count: number; starred_by_me: boolean };

type Listener = (postId: string, patch: StarPatch) => void;

const listeners = new Set<Listener>();

export function subscribePostStarUpdate(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyPostStarUpdate(postId: string, patch: StarPatch): void {
  listeners.forEach((l) => l(postId, patch));
}
