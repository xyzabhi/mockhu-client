/**
 * Legacy nested `level_info` on `/me` — level / tier for LevelBadge.
 */
export type LevelInfo = {
  level: number;
  tier: string;
  tier_color_hint?: string | null;
};

/**
 * Nested under post/comment `author.badge` — level / tier for optional future use.
 */
export type AuthorBadge = {
  level: number;
  tier: string;
  tier_color_hint?: string;
};

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
  /** When using R2: size key → full URL (each with `?v=`). */
  avatar_urls?: Record<string, string> | null;
  avatar_updated_at?: string | null;
  bio: string | null;
  gender: string | null;
  grade: string | null;
  /** `null` or `YYYY-MM-DD` */
  dob: string | null;
  level?: number | null;
  tier?: string | null;
  tier_color_hint?: string | null;
  /** Milestone codes (`user_special_badges`). */
  special_badges?: string[] | null;
  /** Legacy nested DTO — still supported if the server sends it. */
  level_info?: LevelInfo | null;
  is_private?: boolean | null;
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

/** `GET /api/v1/users/:id/profile` — public profile with privacy gating. */
export type UserProfileResponse = {
  id: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  gender: string | null;
  dob: string | null;
  grade: string | null;
  is_private: boolean;
  is_own_profile: boolean;
  is_following: boolean;
  follower_count: number;
  following_count: number;
  post_count: number;
  created_at: string;
};

/** `PATCH /api/v1/me/privacy` response. */
export type SetPrivacyResponse = {
  is_private: boolean;
};

/** `POST /me/avatar` success `data` — R2 URLs + cache-bust query. */
export type MeAvatarUploadResponse = {
  avatar_url: string;
  avatar_urls: Record<string, string>;
  avatar_updated_at: string;
};
