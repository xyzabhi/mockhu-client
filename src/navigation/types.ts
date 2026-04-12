import type { NavigatorScreenParams } from '@react-navigation/native';

/**
 * Central param lists for React Navigation.
 * Add new stacks/screens here first, then wire navigators.
 */
export type AuthStackParamList = {
  AuthSignUp: undefined;
  AuthLogin: undefined;
  AuthEmail: { mode: 'signup' | 'login' };
  AuthEmailVerify: { mode: 'signup' | 'login'; email: string };
  /** Forgot password: Screen A — optional prefill from duplicate-email sign-up. */
  AuthForgotPasswordEmail: { prefilledEmail?: string } | undefined;
  /** Forgot password: Screen B — OTP + new password (same email as forgot step). */
  AuthForgotPasswordReset: { email: string };
};

export type MainTabParamList = {
  Home: undefined;
  Progress: undefined;
  Post: undefined;
  Inbox: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  SuggestedUsers: undefined;
  FollowList: { userId: string; kind: 'followers' | 'following' };
  /** Job alerts matched to profile / exams (placeholder until API). */
  JobNotifications: undefined;
  /** Job listings matched to interests (placeholder until API). */
  MatchingJobs: undefined;
  /** Trending posts and topics (placeholder until API). */
  Trending: undefined;
  /** News, privacy, rules, or user agreement (static / placeholder content). */
  LegalInfo: { kind: 'news' | 'privacy' | 'rules' | 'agreement' };
  /** Main tab shell (avoid naming this `Home` — tab stack also has a `Home` tab). */
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  /** Thread / composer for a post (opened from feed). */
  PostComments: { postId: string; commentCount?: number };
  /** Saved posts (bookmarks feed). */
  Bookmarks: undefined;
  ExamCategories: undefined;
  ExamCategory: { categoryId: number };
  ExamDetail: { examId: number };
  /** View another user's profile (or own via redirect). */
  UserProfile: { userId: string };
  /** Global search across users, posts, exams, topics, subjects. */
  GlobalSearch: undefined;
};
