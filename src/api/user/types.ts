/**
 * Progression from `internal/badge` — exposed on `/me` when wired (`BuildLevelInfo` / `SnapshotForUser`).
 */
export type LevelInfo = {
  level: number;
  total_xp: number;
  tier: string;
  tier_color_hint?: string | null;
  xp_to_next_level: number;
};

export type UserBadgeSnapshot = LevelInfo & {
  special_badges?: string[];
};

/** `user_hp` — separate from XP; can decrease (moderation, etc.). */
export type HpInfo = {
  current_hp: number;
  max_hp: number;
};

/**
 * Gamification subset of `GET /api/v1/me` `data` — **top-level** snake_case fields (current API).
 * Legacy clients may still receive nested `level_info` / `hp_info` instead.
 */
export type ProfileProgression = {
  level: number;
  xp: number;
  tier: string;
  tier_color_hint: string;
  xp_to_next_level: number;
  current_hp: number;
  max_hp: number;
  special_badges?: string[];
};

/**
 * Nested under post/comment `author.badge` — same progression fields as `/me` flat `data`
 * (no `special_badges` in batch author snapshots).
 */
export type AuthorBadge = {
  level: number;
  xp: number;
  tier: string;
  tier_color_hint: string;
  xp_to_next_level: number;
  current_hp: number;
  max_hp: number;
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
  bio: string | null;
  gender: string | null;
  grade: string | null;
  /** `null` or `YYYY-MM-DD` */
  dob: string | null;
  /** Total XP — top-level on `/me` (preferred). */
  xp?: number | null;
  /** Top-level progression (preferred over nested `level_info` when both exist). */
  level?: number | null;
  tier?: string | null;
  tier_color_hint?: string | null;
  xp_to_next_level?: number | null;
  current_hp?: number | null;
  max_hp?: number | null;
  /** Milestone codes (`user_special_badges`). */
  special_badges?: string[] | null;
  /** Legacy nested DTO — still supported if the server sends it. */
  level_info?: LevelInfo | null;
  /** Legacy nested HP — still supported if top-level `current_hp` / `max_hp` are absent. */
  hp_info?: HpInfo | null;
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
