export type SearchType = 'users' | 'posts' | 'exams' | 'exam_categories' | 'topics' | 'subjects';

export type SearchUserResult = {
  id: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
};

export type SearchPostResult = {
  id: string;
  title: string;
  content: string;
  post_type: string;
  star_count: number;
  author: string | null;
  created_at: string;
};

export type SearchExamResult = {
  id: number;
  category_id: number;
  name: string;
  description: string | null;
  icon_url: string | null;
  user_count: number;
};

export type SearchExamCategoryResult = {
  id: number;
  name: string;
  description: string | null;
  icon_url: string | null;
  user_count: number;
};

export type SearchTopicResult = {
  id: number;
  subject_id: number;
  name: string;
};

export type SearchSubjectResult = {
  id: number;
  name: string;
  icon_url: string | null;
};

export type GlobalSearchResponse = {
  users: SearchUserResult[];
  posts: SearchPostResult[];
  exams: SearchExamResult[];
  exam_categories: SearchExamCategoryResult[];
  topics: SearchTopicResult[];
  subjects: SearchSubjectResult[];
};

export type SearchParams = {
  q: string;
  type?: SearchType;
  limit?: number;
};
