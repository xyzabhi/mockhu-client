import type { TokenResponse } from '../types';

export type SignupBody = {
  email: string;
  password: string;
};

export type LoginBody = {
  email: string;
  password: string;
};

export type PhoneRequestBody = {
  phone: string;
};

/** `data` from POST /auth/phone/request (dev may include `otp` in JSON). */
export type PhoneOtpRequestData = {
  message: string;
  phone: string;
  expires_in: number;
  /** Present in dev/fake flows only — remove from UI before production SMS. */
  otp?: string;
};

export type PhoneVerifyBody = {
  phone: string;
  otp: string;
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

/**
 * `POST /auth/google` — authorization code from Google (`ASWebAuthenticationSession` / `useAuthRequest`);
 * backend exchanges the code (and PKCE verifier when applicable) for session JWTs.
 */
export type GoogleAuthBody = {
  code: string;
  /** Must match the redirect URI registered for your Web client and used in the auth request. */
  redirect_uri: string;
  /** Present when the auth request used PKCE (default for `useAuthRequest` code flow). */
  code_verifier?: string;
};

export type RefreshBody = {
  refresh_token: string;
};

export type { TokenResponse };
