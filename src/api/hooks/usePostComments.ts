import { useCallback, useEffect, useState } from 'react';
import type { AppError } from '../AppError';
import type { CommentResponse, CommentThread } from '../post/commentTypes';
import {
  createPostComment,
  deletePostComment,
  getPostComments,
  mergeCommentStarResponse,
  mergeCommentUnstarResponse,
  starComment,
  unstarComment,
} from '../post/postApi';
import { mapUnknownToAppError } from './mapUnknownToAppError';

const PAGE_LIMIT = 20;

function mapCommentInThreads(
  threads: CommentThread[],
  commentId: string,
  map: (c: CommentResponse) => CommentResponse,
): CommentThread[] {
  return threads.map((t) => {
    if (t.comment.id === commentId) {
      return { ...t, comment: map(t.comment) };
    }
    const idx = t.replies.findIndex((r) => r.id === commentId);
    if (idx >= 0) {
      const replies = [...t.replies];
      replies[idx] = map(replies[idx]);
      return { ...t, replies };
    }
    return t;
  });
}

export function usePostComments(postId: string | undefined, initialCommentCount?: number) {
  const [threads, setThreads] = useState<CommentThread[]>([]);
  const [commentCountBadge, setCommentCountBadge] = useState(initialCommentCount ?? 0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const loadInitial = useCallback(async () => {
    const id = postId?.trim();
    if (!id) {
      setLoading(false);
      setError(null);
      setThreads([]);
      setNextCursor(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const page = await getPostComments(id, { limit: PAGE_LIMIT });
      setThreads(page.threads);
      setNextCursor(page.next_cursor);
    } catch (e) {
      setError(mapUnknownToAppError(e));
      setThreads([]);
      setNextCursor(null);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  const refresh = useCallback(async () => {
    const id = postId?.trim();
    if (!id) return;

    setRefreshing(true);
    setError(null);
    try {
      const page = await getPostComments(id, { limit: PAGE_LIMIT });
      setThreads(page.threads);
      setNextCursor(page.next_cursor);
    } catch (e) {
      setError(mapUnknownToAppError(e));
    } finally {
      setRefreshing(false);
    }
  }, [postId]);

  const loadMore = useCallback(async () => {
    const id = postId?.trim();
    if (!id || nextCursor == null || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await getPostComments(id, {
        limit: PAGE_LIMIT,
        cursor: nextCursor,
      });
      setThreads((prev) => {
        const seen = new Set(prev.map((t) => t.comment.id));
        const merged = [...prev];
        for (const t of page.threads) {
          if (!seen.has(t.comment.id)) {
            seen.add(t.comment.id);
            merged.push(t);
          }
        }
        return merged;
      });
      setNextCursor(page.next_cursor);
    } catch (e) {
      setError(mapUnknownToAppError(e));
    } finally {
      setLoadingMore(false);
    }
  }, [postId, nextCursor, loadingMore]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    if (typeof initialCommentCount === 'number' && Number.isFinite(initialCommentCount)) {
      setCommentCountBadge(initialCommentCount);
    }
  }, [initialCommentCount]);

  const sendComment = useCallback(
    async (body: string, parent_comment_id?: string | null) => {
      const id = postId?.trim();
      if (!id) return;

      const trimmed = body.trim();
      if (!trimmed) return;
      setSending(true);
      setError(null);
      try {
        const created = await createPostComment(id, {
          body: trimmed,
          parent_comment_id: parent_comment_id ?? undefined,
        });

        const parentId = parent_comment_id?.trim();
        if (!parentId) {
          setThreads((prev) => [...prev, { comment: created, replies: [] }]);
        } else {
          setThreads((prev) =>
            prev.map((t) => {
              if (t.comment.id !== parentId) return t;
              return { ...t, replies: [...t.replies, created] };
            }),
          );
        }
        setCommentCountBadge((c) => c + 1);
      } catch (e) {
        const err = mapUnknownToAppError(e);
        setError(err);
        throw err;
      } finally {
        setSending(false);
      }
    },
    [postId],
  );

  const removeComment = useCallback(
    async (commentId: string) => {
      const id = postId?.trim();
      if (!id) return;

      setError(null);
      try {
        const res = await deletePostComment(id, commentId);
        setCommentCountBadge(res.comment_count);
        setThreads((prev) => {
          const withoutRoot = prev.filter((t) => t.comment.id !== commentId);
          if (withoutRoot.length !== prev.length) return withoutRoot;
          return prev.map((t) => ({
            ...t,
            replies: t.replies.filter((r) => r.id !== commentId),
          }));
        });
      } catch (e) {
        const err = mapUnknownToAppError(e);
        setError(err);
        throw err;
      }
    },
    [postId],
  );

  const toggleCommentStar = useCallback(
    async (commentId: string) => {
      const id = postId?.trim();
      if (!id) return;

      let target: CommentResponse | undefined;
      for (const t of threads) {
        if (t.comment.id === commentId) {
          target = t.comment;
          break;
        }
        const r = t.replies.find((x) => x.id === commentId);
        if (r) {
          target = r;
          break;
        }
      }
      if (!target) return;

      setError(null);
      try {
        if (target.starred_by_me) {
          const res = await unstarComment(id, commentId);
          setThreads((prev) =>
            mapCommentInThreads(prev, commentId, (c) =>
              mergeCommentUnstarResponse(c, res),
            ),
          );
        } else {
          const res = await starComment(id, commentId);
          setThreads((prev) =>
            mapCommentInThreads(prev, commentId, (c) =>
              mergeCommentStarResponse(c, res),
            ),
          );
        }
      } catch (e) {
        const err = mapUnknownToAppError(e);
        setError(err);
        throw err;
      }
    },
    [postId, threads],
  );

  return {
    threads,
    commentCountBadge,
    nextCursor,
    loading,
    loadingMore,
    refreshing,
    sending,
    error,
    loadMore,
    refresh,
    sendComment,
    removeComment,
    toggleCommentStar,
    reload: loadInitial,
  };
}
