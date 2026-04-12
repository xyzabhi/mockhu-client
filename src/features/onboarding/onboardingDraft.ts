import type { OnboardingPayload, OnboardingResponseData, TokenUser } from '../../api';

/**
 * Placeholder URL treated as “no real avatar” in profile/onboarding pickers.
 * Replace with your CDN default when available.
 */
export const ONBOARDING_DEFAULT_AVATAR_URL = 'https://example.com/avatar-placeholder';

/**
 * True when `avatar_url` should be treated as a real value (not empty, not the placeholder).
 */
export function isUsableAvatarDraftUri(value: string | undefined | null): boolean {
  if (value == null) return false;
  const t = value.trim();
  if (!t) return false;
  if (t === ONBOARDING_DEFAULT_AVATAR_URL) return false;
  return true;
}

export type SelectedExamDraft = {
  id: number;
  name: string;
  category_id: number;
  user_count?: number;
};

/** In-memory state for the onboarding completion screen before POST /onboarding. */
export type OnboardingDraft = {
  first_name: string;
  last_name: string;
  target_year: number;
  selected_exams: SelectedExamDraft[];
};

export type OnboardingFieldErrors = {
  first_name?: string;
  last_name?: string;
  target_year?: string;
  exam_ids?: string;
};

export type OnboardingValidationResult =
  | { ok: true; draft: OnboardingDraft }
  | { ok: false; errors: OnboardingFieldErrors };

/** Upper bound for target exam year in the picker and API payload. */
export const MAX_TARGET_YEAR = 2035;

/** Lowest allowed target year: this calendar year, capped at `MAX_TARGET_YEAR`. */
export function minTargetYear(): number {
  return Math.min(new Date().getFullYear(), MAX_TARGET_YEAR);
}

/** Max exams selectable during onboarding (category sheet + chips). */
export const MAX_ONBOARDING_EXAM_SELECTIONS = 4;

/**
 * Splits a single full-name field: first token → `first_name`, remainder → `last_name`.
 * Collapses internal whitespace; trims ends.
 */
export function splitFullName(fullName: string): { first_name: string; last_name: string } {
  const trimmed = fullName.trim().replace(/\s+/g, ' ');
  if (!trimmed) return { first_name: '', last_name: '' };
  const space = trimmed.indexOf(' ');
  if (space === -1) {
    return { first_name: trimmed, last_name: '' };
  }
  return {
    first_name: trimmed.slice(0, space).trim(),
    last_name: trimmed.slice(space + 1).trim(),
  };
}

/** Step 1: require non-empty full name with at least first + last (space-separated). */
export function validateOnboardingNameStep(fullName: string):
  | { ok: true; first_name: string; last_name: string }
  | { ok: false; error: string } {
  const { first_name, last_name } = splitFullName(fullName);
  if (!first_name) {
    return { ok: false, error: 'Please enter your name.' };
  }
  if (!last_name) {
    return {
      ok: false,
      error: 'Enter your first and last name (e.g. Ada Lovelace).',
    };
  }
  return { ok: true, first_name, last_name };
}

/** Step 2: at least one exam, at most `MAX_ONBOARDING_EXAM_SELECTIONS`. */
export function validateOnboardingExamsStep(selected: SelectedExamDraft[]): string | null {
  if (selected.length === 0) {
    return 'Select at least one exam you are preparing for.';
  }
  if (selected.length > MAX_ONBOARDING_EXAM_SELECTIONS) {
    return `You can select at most ${MAX_ONBOARDING_EXAM_SELECTIONS} exams.`;
  }
  return null;
}

/** Step 3: target year from current year through `MAX_TARGET_YEAR`. */
export function validateOnboardingYearStep(targetYearRaw: string): string | null {
  const lo = minTargetYear();
  const yearParsed = Number.parseInt(targetYearRaw.trim(), 10);
  if (!Number.isFinite(yearParsed) || yearParsed < lo || yearParsed > MAX_TARGET_YEAR) {
    return `Enter a year between ${lo} and ${MAX_TARGET_YEAR}.`;
  }
  return null;
}

/**
 * Validates trimmed names, target year range, and at least one exam.
 */
export function validateOnboardingForm(input: {
  first_name: string;
  last_name: string;
  target_year_raw: string;
  selected_exams: SelectedExamDraft[];
}): OnboardingValidationResult {
  const errors: OnboardingFieldErrors = {};
  const first = input.first_name.trim();
  const last = input.last_name.trim();
  if (!first) errors.first_name = 'Please enter your first name.';
  if (!last) errors.last_name = 'Please enter your last name.';

  const lo = minTargetYear();
  const yearParsed = Number.parseInt(input.target_year_raw.trim(), 10);
  if (!Number.isFinite(yearParsed) || yearParsed < lo || yearParsed > MAX_TARGET_YEAR) {
    errors.target_year = `Enter a year between ${lo} and ${MAX_TARGET_YEAR}.`;
  }

  if (input.selected_exams.length === 0) {
    errors.exam_ids = 'Select at least one exam you are preparing for.';
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    draft: {
      first_name: first,
      last_name: last,
      target_year: yearParsed,
      selected_exams: input.selected_exams,
    },
  };
}

export function buildOnboardingPayload(draft: OnboardingDraft): OnboardingPayload {
  return {
    first_name: draft.first_name.trim(),
    last_name: draft.last_name.trim(),
    exam_ids: draft.selected_exams.map((e) => e.id),
    target_year: draft.target_year,
  };
}

function pickString(r: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = r[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

function pickTimestamp(r: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = r[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return undefined;
}

function pickUserId(r: Record<string, unknown>): string | undefined {
  const v = r.id;
  if (typeof v === 'string' && v.trim()) return v.trim();
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return undefined;
}

function pickNumberArray(r: Record<string, unknown>, ...keys: string[]): number[] | undefined {
  for (const k of keys) {
    if (!(k in r)) continue;
    const v = r[k];
    if (Array.isArray(v) && v.every((x) => typeof x === 'number')) return v as number[];
  }
  return undefined;
}

function pickYear(r: Record<string, unknown>, draft: OnboardingDraft): number {
  const v = r.target_year ?? r.targetYear;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number.parseInt(v.trim(), 10);
    if (Number.isFinite(n)) return n;
  }
  return draft.target_year;
}

/**
 * Maps POST /onboarding success `data` into a `TokenUser` partial for `mergeSessionUser`.
 */
export function sessionUserPatchFromOnboardingResponse(
  data: OnboardingResponseData,
  draft: OnboardingDraft,
): Partial<TokenUser> {
  const r = data as unknown as Record<string, unknown>;
  const idPick = pickUserId(r);
  const examIds = pickNumberArray(r, 'exam_ids', 'examIds') ?? draft.selected_exams.map((e) => e.id);

  return {
    ...(idPick ? { id: idPick } : {}),
    is_onboarded: true,
    first_name: pickString(r, 'first_name', 'firstName') || draft.first_name.trim(),
    last_name: pickString(r, 'last_name', 'lastName') || draft.last_name.trim(),
    username: pickString(r, 'username', 'user_name'),
    target_year: pickYear(r, draft),
    exam_ids: examIds,
    created_at: pickTimestamp(r, 'created_at', 'createdAt'),
    updated_at: pickTimestamp(r, 'updated_at', 'updatedAt'),
  };
}
