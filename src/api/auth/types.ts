import type { TokenResponse } from '../types';

export type SignupBody = {
  email: string;
  password: string;
};

export type LoginBody = {
  email: string;
  password: string;
};

export type EmailOtpRequestBody = {
  email: string;
};

/** `data` from POST /auth/email/request (dev may include `otp` when Resend is off). */
export type EmailOtpRequestData = {
  message: string;
  email: string;
  expires_in: number;
  /** Dev/local only — never surface in production UI. */
  otp?: string;
};

export type EmailOtpVerifyBody = {
  email: string;
  otp: string;
};

/** `POST /auth/password/forgot` — request reset code (no JWT). */
export type ForgotPasswordBody = {
  email: string;
};

/** `data` from forgot — message is always the same for security; `otp` only in local dev without Resend. */
export type ForgotPasswordData = {
  message: string;
  /** Present only in dev when email provider is stubbed — never surface in production UI. */
  otp?: string;
};

/** `POST /auth/password/reset` — complete reset (no JWT); same session shape as login. */
export type ResetPasswordBody = {
  email: string;
  otp: string;
  new_password: string;
};

export type RefreshBody = {
  refresh_token: string;
};

/** `POST /auth/google` — Google ID token from native sign-in (validated server-side). */
export type GoogleSignInBody = {
  id_token: string;
};

export type { TokenResponse };
