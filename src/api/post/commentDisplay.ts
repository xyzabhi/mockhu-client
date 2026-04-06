import type { CommentResponse, CommentThread } from './commentTypes';

export type CommentListRow =
  | { kind: 'root'; comment: CommentResponse }
  | { kind: 'reply'; comment: CommentResponse; rootId: string }
  | { kind: 'show_more_replies'; rootId: string; hiddenCount: number };

/** How many direct replies to show before “Show more replies” (API: one level of replies only). */
export const DEFAULT_REPLY_PREVIEW_LIMIT = 2;

export type FlattenThreadsOptions = {
  /** Replies beyond this are hidden until the thread is expanded (default: `DEFAULT_REPLY_PREVIEW_LIMIT`). */
  replyLimit?: number;
  /** Top-level comment ids whose full reply list is shown. */
  expandedRootIds?: ReadonlySet<string>;
};

export function commentAuthorLabel(author: CommentResponse['author']): string {
  const a = author ?? { username: '' };
  const parts = [a.first_name?.trim(), a.last_name?.trim()].filter(Boolean);
  if (parts.length > 0) return parts.join(' ');
  const u = a.username?.trim();
  return u ? `@${u}` : 'User';
}

/**
 * Flatten threads for a single `FlatList` (root row, then visible replies, optional “show more” row).
 * When a thread has more replies than `replyLimit` and its root id is not in `expandedRootIds`,
 * only the first `replyLimit` replies are listed, followed by a `show_more_replies` row.
 */
export function flattenThreads(
  threads: CommentThread[],
  options?: FlattenThreadsOptions,
): CommentListRow[] {
  const limit = options?.replyLimit ?? DEFAULT_REPLY_PREVIEW_LIMIT;
  const expanded = options?.expandedRootIds;
  const rows: CommentListRow[] = [];
  for (const t of threads) {
    rows.push({ kind: 'root', comment: t.comment });
    const rootId = t.comment.id;
    const replies = t.replies;
    const showAll = expanded?.has(rootId) === true || replies.length <= limit;
    if (showAll) {
      for (const r of replies) {
        rows.push({ kind: 'reply', comment: r, rootId });
      }
    } else {
      for (let i = 0; i < limit; i++) {
        rows.push({ kind: 'reply', comment: replies[i], rootId });
      }
      rows.push({
        kind: 'show_more_replies',
        rootId,
        hiddenCount: replies.length - limit,
      });
    }
  }
  return rows;
}
