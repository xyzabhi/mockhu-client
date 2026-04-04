/**
 * `GET /api/v1/me` — `data` shape (envelope). Fields may be JSON null when unset in DB.
 */
export type MeResponse = {
  id: string;
  username: string | null;
  is_onboarded: boolean;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  gender: string | null;
  grade: string | null;
  /** `null` or `YYYY-MM-DD` */
  dob: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * `GET /api/v1/users/:user_id/interests` — `data` shape (envelope).
 */
export type UserInterestsResponse = {
  exam_category_ids: number[];
  exam_ids: number[];
};

/** `UserSummary` in followers / following lists. */
export type UserSummary = {
  id: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
};

/** `POST /users/:id/follow` (201) / `DELETE /users/:id/follow` (200) — `data` shape. */
export type FollowResponse = {
  followers_count: number;
};

export type FollowListQuery = {
  limit?: number;
  /** Opaque cursor from a previous response’s `next_cursor`. */
  cursor?: string | null;
};

/** `GET /users/:id/followers` | `GET /users/:id/following` — `data` shape. */
export type FollowListResponse = {
  users: UserSummary[];
  next_cursor: string | null;
};

/**
 * `GET /api/v1/users/suggestions?limit=&offset=` — `data` shape (tolerates `users` instead of `items`).
 */
export type UserSuggestionsResponse = {
  items: UserSummary[];
  total: number;
};
