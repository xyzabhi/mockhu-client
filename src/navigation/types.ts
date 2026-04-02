/**
 * Central param lists for React Navigation.
 * Add new stacks/screens here first, then wire navigators.
 */
export type AuthStackParamList = {
  AuthSignUp: undefined;
  AuthLogin: undefined;
  AuthPhone: { mode: 'signup' | 'login' };
  AuthEmail: { mode: 'signup' | 'login' };
  AuthPhoneVerify: { mode: 'signup' | 'login' };
};

export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
};
