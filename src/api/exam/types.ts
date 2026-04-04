/**
 * Exam catalog DTOs (mirror backend JSON under `/api/v1/exam-categories`, `/api/v1/exam-categories/:id/exams`, `/api/v1/exams`).
 */
export type ExamCategory = {
  id: number;
  name: string;
  description?: string;
  icon_url?: string;
  user_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Exam = {
  id: number;
  category_id: number;
  name: string;
  description?: string;
  icon_url?: string;
  user_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ExamListData = {
  items: Exam[];
  total: number;
};

export type ListExamsParams = {
  /** Filter; if both `category_id` and `exam_category_id` are set, the server uses `category_id`. */
  category_id?: number;
  /** Alias for category filter on `GET /exams`; ignored when `category_id` is set. */
  exam_category_id?: number;
  limit?: number;
  offset?: number;
};
