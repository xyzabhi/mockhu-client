/** Server: `DOUBT` | `TIP` | `WIN` | `EXPERIENCE` */
export type PostType = 'DOUBT' | 'TIP' | 'WIN' | 'EXPERIENCE';

export type PostAuthor = {
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
};

export type PostResponse = {
  id: string;
  user_id: string;
  topic_id: number;
  subject_id: number;
  exam_id: number;
  /** Display title (1–255 chars on create). */
  title: string;
  post_type: PostType;
  content: string;
  link_url?: string | null;
  link_title?: string | null;
  link_desc?: string | null;
  link_img?: string | null;
  is_anonymous: boolean;
  upvote_count: number;
  /** Star count (POST `/posts/:id/star`). */
  star_count: number;
  /** Whether the current user has starred (feed + after star). */
  starred_by_me: boolean;
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

/** `POST /posts/:id/star` — idempotent per user. */
export type StarResponse = {
  star_count: number;
  /** `true` only when this call added a new star. */
  starred: boolean;
};

/** `DELETE /posts/:id/star` — remove current user’s star. */
export type UnstarResponse = {
  star_count: number;
  /** `true` when this call removed your star. */
  unstarred: boolean;
};
