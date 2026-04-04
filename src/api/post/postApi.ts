import { apiDelete, apiGet, apiPost, apiPostMultipart } from '../apiClient';
import type {
  DeletePostResponse,
  LinkPreviewData,
  PostFeedResponse,
  PostResponse,
  PostType,
  StarResponse,
} from './types';

/** Server may omit or null `tags` / `images`; UI expects arrays. */
export function normalizePost(p: PostResponse): PostResponse {
  return {
    ...p,
    title: typeof p.title === 'string' ? p.title : '',
    content: typeof p.content === 'string' ? p.content : '',
    tags: Array.isArray(p.tags) ? p.tags : [],
    images: Array.isArray(p.images) ? p.images : [],
    upvote_count: typeof p.upvote_count === 'number' ? p.upvote_count : 0,
    star_count: typeof p.star_count === 'number' ? p.star_count : 0,
    starred: typeof p.starred === 'boolean' ? p.starred : undefined,
    comment_count: typeof p.comment_count === 'number' ? p.comment_count : 0,
  };
}

/** Merge `POST /posts/:id/star` into a post row (keeps `starred` if duplicate call). */
export function mergeStarResponse(post: PostResponse, star: StarResponse): PostResponse {
  const prevCount = post.star_count ?? 0;
  const nextCount = star.star_count;
  const countIncreased = nextCount > prevCount;
  /** Filled gold star: API says new star, count went up, or repeat tap while already starred (idempotent). */
  const starred =
    star.starred ||
    countIncreased ||
    (post.starred === true && nextCount === prevCount);
  return normalizePost({
    ...post,
    star_count: nextCount,
    starred,
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
 * Star a post (idempotent per user).
 * `POST /api/v1/posts/:id/star` — no body; returns counts + whether this call added a star.
 */
export async function starPost(postId: string): Promise<StarResponse> {
  return apiPost<StarResponse>(`/posts/${encodeURIComponent(postId)}/star`, {});
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

export const postApi = {
  getLinkPreview,
  createPost,
  deletePost,
  starPost,
  getTopicFeed,
  getHomeFeed,
};
