/**
 * Central param lists for React Navigation.
 * Add new stacks/screens here first, then wire navigators.
 */
export type AuthStackParamList = {
  AuthSignUp: undefined;
  AuthLogin: undefined;
  AuthPhone: { mode: 'signup' | 'login' };
  AuthEmail: { mode: 'signup' | 'login' };
  AuthPhoneVerify: { mode: 'signup' | 'login'; phoneE164: string };
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
  /** Main tab shell (avoid naming this `Home` — tab stack also has a `Home` tab). */
  Main: undefined;
  /** Thread / composer for a post (opened from feed). */
  PostComments: { postId: string };
  ExamCategories: undefined;
  ExamCategory: { categoryId: number };
  ExamDetail: { examId: number };
};
