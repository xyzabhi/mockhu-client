import { AppError } from '../AppError';

/** Shown when sign-up OTP request fails because the email is already registered. */
export const EMAIL_ALREADY_REGISTERED_MESSAGE =
  'This email is already registered. Use Sign in to access your account.';

/** Duplicate-email dialog body — offers recover vs new address. */
export const EMAIL_ALREADY_REGISTERED_MODAL_BODY =
  'That email is already registered. Recover your account or enter a different email address.';

/**
 * Detects "email already in use" responses from POST /auth/email/request (sign-up with password).
 * Adjust if your API uses different status codes or `error.code` values.
 */
export function isEmailAlreadyRegisteredError(e: unknown): boolean {
  if (!(e instanceof AppError)) return false;
  const status = e.status;
  const code = e.code?.toUpperCase() ?? '';
  const msg = e.message.toLowerCase();

  if (status === 409) return true;
  if (
    code === 'CONFLICT' ||
    code === 'EMAIL_ALREADY_EXISTS' ||
    code === 'EMAIL_EXISTS' ||
    code === 'DUPLICATE_EMAIL' ||
    code === 'USER_EXISTS'
  ) {
    return true;
  }
  if (status === 400) {
    if (
      code.includes('EXIST') ||
      code.includes('DUPLICATE') ||
      code.includes('CONFLICT') ||
      (msg.includes('already') && (msg.includes('email') || msg.includes('register') || msg.includes('exist'))) ||
      msg.includes('already been registered') ||
      msg.includes('email is taken') ||
      msg.includes('email already')
    ) {
      return true;
    }
  }
  return false;
}
