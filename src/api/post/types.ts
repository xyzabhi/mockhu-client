import type { AuthorBadge } from '../user/types';

/** Server: `DOUBT` | `TIP` | `WIN` | `EXPERIENCE` */
export type PostType = 'DOUBT' | 'TIP' | 'WIN' | 'EXPERIENCE';

export type PostAuthor = {
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  /** Same shape as `/me` progression; omitted for anonymous or when not loaded. */
  badge?: AuthorBadge | null;
};

export type { AuthorBadge };

export type PostResponse = {
  id: string;
  user_id: string;
  topic_id: number;
  subject_id: number;
  exam_id: number;
  /** Display title. */
  title: string;
  post_type: PostType;
  content: string;
  link_url?: string | null;
  link_title?: string | null;
  link_desc?: string | null;
  link_img?: string | null;
  is_anonymous: boolean;
  upvote_count: number;
  /** Star count on the post (distinct from per-comment stars). */
  star_count: number;
  /** Whether the current user has starred this post. */
  starred_by_me: boolean;
  /** Whether the current user has bookmarked this post (private save-for-later). */
  bookmarked_by_me: boolean;
  comment_count: number;
  images: string[];
  tags: string[];
  author?: PostAuthor | null;
  created_at: string;
  updated_at: string;
};

export type PostFeedResponse = {
  posts: PostResponse[];
  next_cursor: string | null;
};

export type LinkPreviewData = {
  title: string;
  description: string;
  image: string;
  source: string;
};

export type DeletePostResponse = {
  deleted: boolean;
};

/**
 * Star toggle response shape for posts (`POST /posts/:id/star`) and comments
 * (`POST /posts/:postId/comments/:id/star`).
 */
export type StarResponse = {
  star_count: number;
  /** `true` only when this call added a new star. */
  starred: boolean;
};

/** Same shape for `DELETE` post/comment star. */
export type UnstarResponse = {
  star_count: number;
  /** `true` when this call removed your star. */
  unstarred: boolean;
};

/** `POST /posts/:id/bookmark` — idempotent. */
export type BookmarkPostResponse = {
  /** `true` if a new bookmark was created; `false` if already bookmarked. */
  bookmarked: boolean;
};

/** `DELETE /posts/:id/bookmark` — idempotent. */
export type UnbookmarkPostResponse = {
  /** `true` if a bookmark was removed; `false` if it was not bookmarked. */
  unbookmarked: boolean;
};
