/** Server: `DOUBT` | `TIP` | `WIN` | `EXPERIENCE` */
export type PostType = 'DOUBT' | 'TIP' | 'WIN' | 'EXPERIENCE';

export type PostAuthor = {
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
};

export type PostResponse = {
  id: string;
  user_id: string;
  topic_id: number;
  subject_id: number;
  exam_id: number;
  post_type: PostType;
  content: string;
  link_url?: string | null;
  link_title?: string | null;
  link_desc?: string | null;
  link_img?: string | null;
  is_anonymous: boolean;
  upvote_count: number;
  comment_count: number;
  images: string[];
  tags: string[];
  author?: PostAuthor | null;
  created_at: string;
  updated_at: string;
};

export type PostFeedResponse = {
  posts: PostResponse[];
  next_cursor: string | null;
};

export type LinkPreviewData = {
  title: string;
  description: string;
  image: string;
  source: string;
};

export type DeletePostResponse = {
  deleted: boolean;
};
