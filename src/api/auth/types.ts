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

export type GoogleAuthBody = {
  id_token: string;
};

export type RefreshBody = {
  refresh_token: string;
};

export type { TokenResponse };
