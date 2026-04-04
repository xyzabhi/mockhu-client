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
  Explore: undefined;
  Post: undefined;
  Progress: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Home: undefined;
  ExamCategories: undefined;
  ExamCategory: { categoryId: number };
  ExamDetail: { examId: number };
};
