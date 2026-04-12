/** Standard success envelope from shared response helpers */
export type ApiSuccessEnvelope<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | string;

export type ApiErrorBody = {
  code: ApiErrorCode;
  message: string;
};

/** Standard failure envelope */
export type ApiFailureEnvelope = {
  success: false;
  error: ApiErrorBody;
};

export type ApiEnvelope<T> = ApiSuccessEnvelope<T> | ApiFailureEnvelope;

/**
 * Cached user from auth + optional profile from `POST /onboarding` success (or future `/me`).
 * Mirrors API snake_case field names for persisted JSON.
 */
export type TokenUser = {
  id: string;
  is_onboarded: boolean;
  first_name?: string;
  last_name?: string;
  username?: string;
  gender?: string;
  dob?: string;
  grade?: string;
  bio?: string;
  avatar_url?: string;
  /** R2 CDN sizes (`400`, `100`, `40`, `24`); each URL includes `?v=` cache-bust. */
  avatar_urls?: Record<string, string>;
  /** RFC3339; omit when no avatar. */
  avatar_updated_at?: string;
  /** From `/me` for LevelBadge. */
  level?: number;
  tier?: string;
  tier_color_hint?: string;
  special_badges?: string[];
  is_private?: boolean;
  exam_category_ids?: number[];
  exam_ids?: number[];
  /** Exam year goal from POST /onboarding or `/me` when provided. */
  target_year?: number;
  created_at?: string;
  updated_at?: string;
};

/**
 * Returned inside `data` for token-issuing auth endpoints.
 * The server may add extra top-level keys — they are persisted in session `authExtras`.
 */
export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: TokenUser;
};
