import { AppError } from '../AppError';

export function mapUnknownToAppError(e: unknown): AppError {
  return e instanceof AppError ? e : new AppError('Something went wrong. Try again.', 'retry');
}
