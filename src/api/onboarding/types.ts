/**
 * POST /api/v1/onboarding — authenticated. Body uses **snake_case** keys only.
 * Do not send exam_category_ids, bio, avatar_url, username, dob, gender, or grade;
 * the server accepts only the fields below.
 */
export type OnboardingPayload = {
  first_name: string;
  last_name: string;
  exam_ids: number[];
  target_year: number;
};

/** Success `data` from POST /api/v1/onboarding. */
export type OnboardingResponseData = {
  id: string;
  first_name: string;
  last_name: string;
  target_year: number;
  username: string;
  is_onboarded: boolean;
  exam_ids: number[];
  created_at: string;
  updated_at: string;
};
