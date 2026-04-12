import { apiDelete, apiGet, apiPost, apiPostMultipart } from '../apiClient';
import { POST_MEDIA_MAX_IMAGES } from './postValidation';
import type {
  CommentListResponse,
  CommentResponse,
  CommentThread,
  CreateCommentBody,
  DeleteCommentResponse,
} from './commentTypes';
import type { AuthorBadge } from '../user/types';
import type {
  BookmarkPostResponse,
  DeletePostResponse,
  LinkPreviewData,
  PostFeedResponse,
  PostResponse,
  PostType,
  StarResponse,
  UnbookmarkPostResponse,
  UnstarResponse,
} from './types';
const KNOWN_POST_TYPES = new Set<string>(['DOUBT', 'TIP', 'WIN', 'EXPERIENCE']);

function val(raw: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(raw, k) && raw[k] !== undefined && raw[k] !== null) {
      return raw[k];
    }
  }
  return undefined;
}

function coercePostString(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return '';
}

function coercePostInt(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    if (Number.isFinite(n)) return Math.trunc(n);
  }
  return fallback;
}

function coercePostBool(v: unknown): boolean {
  if (v === true || v === 'true' || v === 1 || v === '1') return true;
  if (v === false || v === 'false' || v === 0 || v === '0') return false;
  return false;
}

function coercePostType(v: unknown): PostType {
  const s = typeof v === 'string' ? v.trim().toUpperCase() : '';
  if (s && KNOWN_POST_TYPES.has(s)) return s as PostType;
  return 'DOUBT';
}

function coerceStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string');
}

function optStr(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === 'string') return v;
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return null;
}

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

/**
 * Map feed/post payloads to `PostResponse`.
 * Tolerates camelCase/snake_case, numeric strings, and missing fields so backend variants still render.
 */
export function normalizePost(p: PostResponse | Record<string, unknown>): PostResponse {
  const raw = (typeof p === 'object' && p !== null ? p : {}) as Record<string, unknown>;

  const authorRaw = val(raw, 'author');
  let author: PostResponse['author'] = undefined;
  if (authorRaw != null && typeof authorRaw === 'object') {
    const a = authorRaw as Record<string, unknown>;
    author = {
      username: coercePostString(val(a, 'username', 'userName')),
      first_name: optStr(val(a, 'first_name', 'firstName')),
      last_name: optStr(val(a, 'last_name', 'lastName')),
      avatar_url: optStr(val(a, 'avatar_url', 'avatarUrl')),
      badge: normalizeAuthorBadge(val(a, 'badge')) ?? undefined,
    };
  }

  const id = coercePostString(val(raw, 'id', 'post_id'));
  const userId = coercePostString(val(raw, 'user_id', 'userId'));
  const createdAt = coercePostString(val(raw, 'created_at', 'createdAt'));
  const updatedAt = coercePostString(val(raw, 'updated_at', 'updatedAt'));
  const stableId =
    id ||
    (userId || createdAt
      ? `synth:${userId || 'anon'}:${createdAt || updatedAt || '0'}`
      : `synth:${Math.random().toString(36).slice(2, 12)}`);

  const linkUrl = val(raw, 'link_url', 'linkUrl');
  const linkTitle = val(raw, 'link_title', 'linkTitle');
  const linkDesc = val(raw, 'link_desc', 'linkDesc');
  const linkImg = val(raw, 'link_img', 'linkImg');

  return {
    id: stableId,
    user_id: userId,
    topic_id: coercePostInt(val(raw, 'topic_id', 'topicId')),
    subject_id: coercePostInt(val(raw, 'subject_id', 'subjectId')),
    exam_id: coercePostInt(val(raw, 'exam_id', 'examId')),
    title: typeof raw.title === 'string' ? raw.title : coercePostString(raw.title),
    post_type: coercePostType(val(raw, 'post_type', 'postType')),
    content: typeof raw.content === 'string' ? raw.content : coercePostString(raw.content),
    link_url: linkUrl == null ? null : coercePostString(linkUrl) || null,
    link_title: linkTitle == null ? null : coercePostString(linkTitle) || null,
    link_desc: linkDesc == null ? null : coercePostString(linkDesc) || null,
    link_img: linkImg == null ? null : coercePostString(linkImg) || null,
    is_anonymous: coercePostBool(val(raw, 'is_anonymous', 'isAnonymous')),
    upvote_count: coercePostInt(val(raw, 'upvote_count', 'upvoteCount')),
    star_count: coercePostInt(val(raw, 'star_count', 'starCount')),
    starred_by_me: coercePostBool(val(raw, 'starred_by_me', 'starredByMe')),
    bookmarked_by_me: coercePostBool(val(raw, 'bookmarked_by_me', 'bookmarkedByMe')),
    comment_count: coercePostInt(val(raw, 'comment_count', 'commentCount')),
    images: coerceStringArray(val(raw, 'images')),
    tags: coerceStringArray(val(raw, 'tags')),
    author,
    created_at: createdAt || new Date(0).toISOString(),
    updated_at: updatedAt || createdAt || new Date(0).toISOString(),
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

/**
 * Apply `POST /posts/:id/bookmark` — `bookmarked_by_me` stays true if already saved (idempotent).
 */
export function mergeBookmarkResponse(
  post: PostResponse,
  res: BookmarkPostResponse,
): PostResponse {
  return normalizePost({
    ...post,
    bookmarked_by_me: res.bookmarked || post.bookmarked_by_me,
  });
}

/** Apply `DELETE /posts/:id/bookmark`. */
export function mergeUnbookmarkResponse(
  post: PostResponse,
  res: UnbookmarkPostResponse,
): PostResponse {
  return normalizePost({
    ...post,
    bookmarked_by_me: res.unbookmarked ? false : post.bookmarked_by_me,
  });
}

function normalizeFeed(data: PostFeedResponse): PostFeedResponse {
  const rows = data.posts;
  const next = data.next_cursor;
  const posts: PostResponse[] = [];
  for (const row of Array.isArray(rows) ? rows : []) {
    try {
      posts.push(normalizePost(row as Record<string, unknown>));
    } catch {
      /* skip malformed row; keep feed usable */
    }
  }
  return {
    next_cursor: next ?? null,
    posts,
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
  /** Title (optional if body is non-empty). */
  title: string;
  /** Body (optional if title is non-empty). */
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

  fd.append('is_anonymous', params.is_anonymous === true ? 'true' : 'false');

  const images = (params.images ?? []).slice(0, POST_MEDIA_MAX_IMAGES);
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

/** Save post for later (idempotent). `POST /api/v1/posts/:id/bookmark`. */
export async function bookmarkPost(postId: string): Promise<BookmarkPostResponse> {
  return apiPost<BookmarkPostResponse>(`/posts/${encodeURIComponent(postId)}/bookmark`, {});
}

/** Remove bookmark (idempotent). `DELETE /api/v1/posts/:id/bookmark`. */
export async function unbookmarkPost(postId: string): Promise<UnbookmarkPostResponse> {
  return apiDelete<UnbookmarkPostResponse>(`/posts/${encodeURIComponent(postId)}/bookmark`);
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

/** Bookmarked posts feed — newest bookmark first. `GET /api/v1/posts/bookmarks`. */
export async function getBookmarkFeed(params?: GetPostsFeedParams): Promise<PostFeedResponse> {
  const q = buildCursorQuery(params);
  return normalizeFeed(await apiGet<PostFeedResponse>(`/posts/bookmarks${q}`));
}

/**
 * Posts by a single user. Uses `GET /users/:user_id/posts` so we do not hit
 * `GET /posts` (which is topic-scoped and requires `topic_id`).
 */
export async function getUserPostsFeed(
  userId: string,
  params?: GetPostsFeedParams,
): Promise<PostFeedResponse> {
  const q = buildCursorQuery(params);
  return normalizeFeed(
    await apiGet<PostFeedResponse>(
      `/users/${encodeURIComponent(userId)}/posts${q}`,
    ),
  );
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
  bookmarkPost,
  unbookmarkPost,
  getTopicFeed,
  getHomeFeed,
  getBookmarkFeed,
  getUserPostsFeed,
  getPostComments,
  createPostComment,
  deletePostComment,
  starComment,
  unstarComment,
};
