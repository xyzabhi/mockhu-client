/**
 * POST /api/v1/onboarding — wire body must use **snake_case** keys exactly as named
 * (Go binds literal keys; camelCase leaves fields empty → 400).
 */
export type OnboardingPayload = {
  first_name: string;
  last_name: string;
  gender: string;
  /** Strict `YYYY-MM-DD` only. */
  dob: string;
  grade: string;
  bio: string;
  avatar_url: string;
  username: string;
  exam_category_ids: number[];
  exam_ids: number[];
};

/** Success `data` from POST /api/v1/onboarding (profile + interests echo). */
export type OnboardingResponseData = {
  id: string;
  first_name: string;
  last_name: string;
  gender: string;
  dob: string;
  grade: string;
  bio: string;
  avatar_url: string;
  username: string;
  is_onboarded: boolean;
  exam_category_ids: number[];
  exam_ids: number[];
  created_at: string;
  updated_at: string;
};
