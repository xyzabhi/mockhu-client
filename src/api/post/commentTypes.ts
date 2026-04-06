/**
 * `GET/POST/DELETE /posts/:id/comments` — threaded list.
 * Per-comment stars: `POST|DELETE /posts/:postId/comments/:commentId/star`.
 */

export type CommentAuthor = {
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
};

export type CommentResponse = {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  /** Present only for replies (child of a top-level comment). */
  parent_comment_id?: string;
  author?: CommentAuthor;
  /** Comment-level stars (when returned by the API). */
  star_count?: number;
  starred_by_me?: boolean;
  created_at: string;
  updated_at: string;
};

export type CommentThread = {
  comment: CommentResponse;
  replies: CommentResponse[];
};

export type CommentListResponse = {
  threads: CommentThread[];
  next_cursor: string | null;
};

export type DeleteCommentResponse = {
  deleted: boolean;
  removed_count: number;
  comment_count: number;
};

export type CreateCommentBody = {
  /**
   * Comment text; trimmed on send.
   * If both `body` and `str` are present, **`body`** is used after trim.
   * If `body` is empty after trim, **`str`** is used (optional shorthand alias).
   */
  body?: string;
  /** Optional alias for the same string as `body` (e.g. `{ str: "hi" }`). */
  str?: string;
  parent_comment_id?: string | null;
};
