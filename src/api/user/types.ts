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
