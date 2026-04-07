import { apiDelete, apiGet, apiPost, apiPostMultipart } from '../apiClient';
import type {
  CommentListResponse,
  CommentResponse,
  CommentThread,
  CreateCommentBody,
  DeleteCommentResponse,
} from './commentTypes';
import type { AuthorBadge } from '../user/types';
import type {
  DeletePostResponse,
  LinkPreviewData,
  PostFeedResponse,
  PostResponse,
  PostType,
  StarResponse,
  UnstarResponse,
} from './types';

/** Parse `author.badge` from feed/post/comment payloads (JSON numbers may be strings). */
export function normalizeAuthorBadge(raw: unknown): AuthorBadge | undefined {
  if (raw == null || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  if (o.level == null) return undefined;
  const levelN = Number(o.level);
  if (!Number.isFinite(levelN)) return undefined;
  const L = Math.max(1, Math.floor(levelN));
  const tier = typeof o.tier === 'string' ? o.tier : '';
  const hint = typeof o.tier_color_hint === 'string' ? o.tier_color_hint : undefined;
  return hint !== undefined ? { level: L, tier, tier_color_hint: hint } : { level: L, tier };
}

export function normalizeComment(c: CommentResponse): CommentResponse {
  const author = c.author;
  return {
    ...c,
    parent_comment_id: c.parent_comment_id,
    star_count: typeof c.star_count === 'number' ? c.star_count : 0,
    starred_by_me: c.starred_by_me === true,
    author: author
      ? {
          username: typeof author.username === 'string' ? author.username : '',
          first_name: author.first_name,
          last_name: author.last_name,
          avatar_url: author.avatar_url ?? undefined,
          badge: normalizeAuthorBadge(author.badge) ?? undefined,
        }
      : undefined,
  };
}

export function mergeCommentStarResponse(
  c: CommentResponse,
  res: StarResponse,
): CommentResponse {
  return normalizeComment({
    ...c,
    star_count: res.star_count,
    starred_by_me: res.starred ? true : c.starred_by_me,
  });
}

export function mergeCommentUnstarResponse(
  c: CommentResponse,
  res: UnstarResponse,
): CommentResponse {
  return normalizeComment({
    ...c,
    star_count: res.star_count,
    starred_by_me: res.unstarred ? false : c.starred_by_me,
  });
}

function normalizeThread(t: CommentThread): CommentThread {
  return {
    comment: normalizeComment(t.comment),
    replies: (Array.isArray(t.replies) ? t.replies : []).map(normalizeComment),
  };
}

/** Map feed/post payloads to `PostResponse` — booleans and counts come from the API only. */
export function normalizePost(p: PostResponse): PostResponse {
  const author = p.author;
  return {
    ...p,
    title: typeof p.title === 'string' ? p.title : '',
    content: typeof p.content === 'string' ? p.content : '',
    tags: Array.isArray(p.tags) ? p.tags : [],
    images: Array.isArray(p.images) ? p.images : [],
    upvote_count: typeof p.upvote_count === 'number' ? p.upvote_count : 0,
    star_count: typeof p.star_count === 'number' ? p.star_count : 0,
    starred_by_me: p.starred_by_me === true,
    comment_count: typeof p.comment_count === 'number' ? p.comment_count : 0,
    author:
      author === null || author === undefined
        ? author
        : {
            username: typeof author.username === 'string' ? author.username : '',
            first_name: author.first_name,
            last_name: author.last_name,
            avatar_url: author.avatar_url ?? undefined,
            badge: normalizeAuthorBadge(author.badge) ?? undefined,
          },
  };
}

/**
 * Apply `POST /posts/:id/star` body only (`star_count`, `starred` per-call).
 * `starred_by_me` on the post is true if this call added a star (`star.starred`), else unchanged (duplicate idempotent tap).
 */
export function mergeStarResponse(post: PostResponse, star: StarResponse): PostResponse {
  return normalizePost({
    ...post,
    star_count: star.star_count,
    starred_by_me: star.starred ? true : post.starred_by_me,
  });
}

/**
 * Apply `DELETE /posts/:id/star` body (`star_count`, `unstarred` per-call).
 * `starred_by_me` is false when this call removed your star; else unchanged if duplicate idempotent tap.
 */
export function mergeUnstarResponse(post: PostResponse, res: UnstarResponse): PostResponse {
  return normalizePost({
    ...post,
    star_count: res.star_count,
    starred_by_me: res.unstarred ? false : post.starred_by_me,
  });
}

function normalizeFeed(data: PostFeedResponse): PostFeedResponse {
  const rows = data.posts;
  return {
    next_cursor: data.next_cursor ?? null,
    posts: (Array.isArray(rows) ? rows : []).map((row) => normalizePost(row as PostResponse)),
  };
}

export type CreatePostImageInput = {
  uri: string;
  name?: string;
  type?: string;
};

export type CreatePostParams = {
  post_type: PostType;
  topic_id: number;
  subject_id: number;
  exam_id: number;
  /** 1–255 chars after trim. */
  title: string;
  /** 10–2000 chars after trim (body). */
  content: string;
  tags: string[];
  link_url?: string;
  link_title?: string;
  link_desc?: string;
  link_img?: string;
  is_anonymous?: boolean;
  images?: CreatePostImageInput[];
};

/** Public — no JWT required. */
export async function getLinkPreview(url: string): Promise<LinkPreviewData> {
  return apiPost<LinkPreviewData>('/posts/link-preview', { url }, { skipAuth: true });
}

function appendIfPresent(fd: FormData, key: string, value: string | undefined | null): void {
  if (value == null || value === '') return;
  fd.append(key, value);
}

/** `POST /posts` — multipart; 201 → `PostResponse`. */
export async function createPost(params: CreatePostParams): Promise<PostResponse> {
  const fd = new FormData();
  fd.append('post_type', params.post_type);
  fd.append('topic_id', String(params.topic_id));
  fd.append('subject_id', String(params.subject_id));
  fd.append('exam_id', String(params.exam_id));
  fd.append('title', params.title.trim());
  fd.append('content', params.content.trim());
  fd.append('tags', JSON.stringify(params.tags));

  appendIfPresent(fd, 'link_url', params.link_url);
  appendIfPresent(fd, 'link_title', params.link_title);
  appendIfPresent(fd, 'link_desc', params.link_desc);
  appendIfPresent(fd, 'link_img', params.link_img);

  if (params.is_anonymous) {
    fd.append('is_anonymous', 'true');
  }

  const images = params.images ?? [];
  for (const img of images) {
    fd.append(
      'images',
      {
        uri: img.uri,
        name: img.name ?? 'photo.jpg',
        type: img.type ?? 'image/jpeg',
      } as unknown as Blob,
    );
  }

  return normalizePost(await apiPostMultipart<PostResponse>('/posts', fd));
}

export async function deletePost(postId: string): Promise<DeletePostResponse> {
  return apiDelete<DeletePostResponse>(`/posts/${encodeURIComponent(postId)}`);
}

/**
 * Star a post (idempotent per user). Per-comment stars use `starComment` instead.
 * `POST /api/v1/posts/:id/star` — JSON body `{}`; `Accept: application/json`; `Authorization: Bearer`.
 */
export async function starPost(postId: string): Promise<StarResponse> {
  return apiPost<StarResponse>(`/posts/${encodeURIComponent(postId)}/star`, {});
}

/** Unstar the same post. `DELETE /api/v1/posts/:id/star`. */
export async function unstarPost(postId: string): Promise<UnstarResponse> {
  return apiDelete<UnstarResponse>(`/posts/${encodeURIComponent(postId)}/star`);
}

export type GetPostsFeedParams = {
  limit?: number;
  cursor?: string | null;
};

function buildCursorQuery(params?: GetPostsFeedParams): string {
  const sp = new URLSearchParams();
  if (params?.limit != null) {
    sp.set('limit', String(params.limit));
  }
  if (params?.cursor) {
    sp.set('cursor', params.cursor);
  }
  const q = sp.toString();
  return q ? `?${q}` : '';
}

export async function getTopicFeed(
  topicId: number,
  params?: GetPostsFeedParams,
): Promise<PostFeedResponse> {
  const sp = new URLSearchParams();
  sp.set('topic_id', String(topicId));
  if (params?.limit != null) {
    sp.set('limit', String(params.limit));
  }
  if (params?.cursor) {
    sp.set('cursor', params.cursor);
  }
  return normalizeFeed(await apiGet<PostFeedResponse>(`/posts?${sp.toString()}`));
}

/**
 * Global home feed: all non-deleted posts, newest first (not filtered by follows).
 * Requires JWT per API.
 */
export async function getHomeFeed(params?: GetPostsFeedParams): Promise<PostFeedResponse> {
  const q = buildCursorQuery(params);
  return normalizeFeed(await apiGet<PostFeedResponse>(`/posts/home${q}`));
}

export type GetPostCommentsParams = {
  /** Server default 20; max 50 — values are clamped before send. */
  limit?: number;
  cursor?: string | null;
};

/** Matches API: pagination applies to top-level threads only; each thread includes all replies. */
const COMMENT_LIST_LIMIT_MIN = 1;
const COMMENT_LIST_LIMIT_MAX = 50;

function clampCommentListLimit(limit: number | undefined): number | undefined {
  if (limit == null || !Number.isFinite(limit)) return undefined;
  return Math.min(
    COMMENT_LIST_LIMIT_MAX,
    Math.max(COMMENT_LIST_LIMIT_MIN, Math.floor(limit)),
  );
}

function buildCommentsQuery(params?: GetPostCommentsParams): string {
  const sp = new URLSearchParams();
  const limit = clampCommentListLimit(params?.limit);
  if (limit != null) {
    sp.set('limit', String(limit));
  }
  if (params?.cursor) {
    sp.set('cursor', params.cursor);
  }
  const q = sp.toString();
  return q ? `?${q}` : '';
}

/**
 * Paginated threads: each item is top-level `comment` + `replies[]` (direct replies only).
 * Replies to replies are rejected on create (`400`). `GET /posts/:id/comments`.
 */
export async function getPostComments(
  postId: string,
  params?: GetPostCommentsParams,
): Promise<CommentListResponse> {
  const raw = await apiGet<CommentListResponse>(
    `/posts/${encodeURIComponent(postId)}/comments${buildCommentsQuery(params)}`,
  );
  const threads = Array.isArray(raw.threads) ? raw.threads : [];
  return {
    next_cursor: raw.next_cursor ?? null,
    threads: threads.map((row) => normalizeThread(row as CommentThread)),
  };
}

/** Resolve `body` vs `str` per API: trimmed `body` wins; if empty, use trimmed `str`. */
export function resolveCommentText(input: CreateCommentBody): string {
  const b = typeof input.body === 'string' ? input.body.trim() : '';
  if (b !== '') return b;
  const s = typeof input.str === 'string' ? input.str.trim() : '';
  return s;
}

/**
 * `POST /posts/:id/comments` — 201 → `CommentResponse`.
 * Top-level: omit `parent_comment_id`. Reply: set to a **top-level** comment id on this post only.
 */
export async function createPostComment(
  postId: string,
  body: CreateCommentBody,
): Promise<CommentResponse> {
  const text = resolveCommentText(body);
  const payload: Record<string, unknown> = { body: text };
  if (body.parent_comment_id != null && body.parent_comment_id !== '') {
    payload.parent_comment_id = body.parent_comment_id;
  }
  return normalizeComment(
    await apiPost<CommentResponse>(`/posts/${encodeURIComponent(postId)}/comments`, payload),
  );
}

/** Author-only; cascade removes replies for top-level. */
export async function deletePostComment(
  postId: string,
  commentId: string,
): Promise<DeleteCommentResponse> {
  return apiDelete<DeleteCommentResponse>(
    `/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`,
  );
}

/**
 * Star a comment (idempotent per user).
 * `POST /api/v1/posts/:postId/comments/:commentId/star`
 */
export async function starComment(
  postId: string,
  commentId: string,
): Promise<StarResponse> {
  return apiPost<StarResponse>(
    `/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}/star`,
    {},
  );
}

/** `DELETE /api/v1/posts/:postId/comments/:commentId/star` */
export async function unstarComment(
  postId: string,
  commentId: string,
): Promise<UnstarResponse> {
  return apiDelete<UnstarResponse>(
    `/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}/star`,
  );
}

export const postApi = {
  getLinkPreview,
  createPost,
  deletePost,
  starPost,
  unstarPost,
  getTopicFeed,
  getHomeFeed,
  getPostComments,
  createPostComment,
  deletePostComment,
  starComment,
  unstarComment,
};
