import type { OnboardingPayload, OnboardingResponseData, TokenUser } from '../../api';

/** API requires non-empty strings after trim; used when the user skips bio. */
export const ONBOARDING_DEFAULT_BIO = 'No bio yet.';

/**
 * API requires non-empty `avatar_url`; use when the user has no https photo yet.
 * Replace with your CDN default when available.
 */
export const ONBOARDING_DEFAULT_AVATAR_URL = 'https://example.com/avatar-placeholder';

export type SelectedExamDraft = {
  id: number;
  name: string;
  category_id: number;
  user_count?: number;
};

export type OnboardingDraft = {
  first_name: string;
  last_name: string;
  gender: string;
  dob: string;
  grade: string;
  bio: string;
  avatar_url: string;
  username: string;
  selected_exams: SelectedExamDraft[];
};

export const initialOnboardingDraft: OnboardingDraft = {
  first_name: '',
  last_name: '',
  gender: '',
  dob: '',
  grade: '',
  bio: '',
  avatar_url: '',
  username: '',
  selected_exams: [],
};

/**
 * Maps app draft → API body. Keys are literal snake_case for `JSON.stringify` (Go binding).
 */
export function buildOnboardingPayload(draft: OnboardingDraft): OnboardingPayload {
  const exam_ids = draft.selected_exams.map((e) => e.id);
  const exam_category_ids =
    exam_ids.length > 0
      ? [...new Set(draft.selected_exams.map((e) => e.category_id))]
      : [];
  const bioTrim = draft.bio.trim();
  const avatarTrim = draft.avatar_url.trim();
  return {
    first_name: draft.first_name.trim(),
    last_name: draft.last_name.trim(),
    gender: draft.gender,
    dob: draft.dob,
    grade: draft.grade,
    bio: bioTrim || ONBOARDING_DEFAULT_BIO,
    /** Non-empty includes local device URIs (file://, content://, …); only default when empty. */
    avatar_url: avatarTrim ? avatarTrim : ONBOARDING_DEFAULT_AVATAR_URL,
    username: draft.username.trim(),
    exam_category_ids,
    exam_ids,
  };
}

/** Human-readable validation error, or null if OK. */
export function validateOnboardingDraft(draft: OnboardingDraft): string | null {
  if (!draft.first_name.trim()) return 'Please enter your first name.';
  if (!draft.last_name.trim()) return 'Please enter your last name.';
  if (!draft.gender) return 'Please choose your gender.';
  if (!draft.dob) return 'Please enter your date of birth.';
  if (!draft.grade) return 'Please select your class or grade.';
  if (!draft.username.trim()) return 'Please choose a username.';
  const exam_ids = draft.selected_exams.map((e) => e.id);
  const exam_category_ids =
    exam_ids.length > 0
      ? [...new Set(draft.selected_exams.map((e) => e.category_id))]
      : [];
  if (exam_ids.length === 0 && exam_category_ids.length === 0) {
    return 'Pick at least one exam.';
  }
  return null;
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

function interestIdsFromDraft(draft: OnboardingDraft): {
  exam_category_ids: number[];
  exam_ids: number[];
} {
  const exam_ids = draft.selected_exams.map((e) => e.id);
  const exam_category_ids =
    exam_ids.length > 0
      ? [...new Set(draft.selected_exams.map((e) => e.category_id))]
      : [];
  return { exam_category_ids, exam_ids };
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

function namesFromOnboardingResponse(
  data: OnboardingResponseData,
  draft: OnboardingDraft,
): { first_name: string; last_name: string; username: string } {
  const r = data as unknown as Record<string, unknown>;
  return {
    first_name:
      pickString(r, 'first_name', 'firstName') || draft.first_name.trim(),
    last_name:
      pickString(r, 'last_name', 'lastName') || draft.last_name.trim(),
    username: pickString(r, 'username', 'user_name') || draft.username.trim(),
  };
}

/**
 * Full `data` from POST /onboarding success → merge into persisted `TokenUser`
 * (snake_case fields; tolerates camelCase in JSON; draft fallback when a key is missing).
 */
export function sessionUserPatchFromOnboardingResponse(
  data: OnboardingResponseData,
  draft: OnboardingDraft,
): Partial<TokenUser> {
  const r = data as unknown as Record<string, unknown>;
  const names = namesFromOnboardingResponse(data, draft);
  const fallback = interestIdsFromDraft(draft);
  const examIds = pickNumberArray(r, 'exam_ids', 'examIds') ?? fallback.exam_ids;
  const catIds =
    pickNumberArray(r, 'exam_category_ids', 'examCategoryIds') ?? fallback.exam_category_ids;
  const idPick = pickUserId(r);
  const bioDraft = draft.bio.trim() || ONBOARDING_DEFAULT_BIO;
  const avatarDraft = draft.avatar_url.trim() || ONBOARDING_DEFAULT_AVATAR_URL;

  return {
    ...(idPick ? { id: idPick } : {}),
    is_onboarded: true,
    first_name: names.first_name,
    last_name: names.last_name,
    username: names.username,
    gender: pickString(r, 'gender') || draft.gender,
    dob: pickString(r, 'dob') || draft.dob,
    grade: pickString(r, 'grade') || draft.grade,
    bio: pickString(r, 'bio') || bioDraft,
    avatar_url: pickString(r, 'avatar_url', 'avatarUrl') || avatarDraft,
    exam_category_ids: catIds,
    exam_ids: examIds,
    created_at: pickTimestamp(r, 'created_at', 'createdAt'),
    updated_at: pickTimestamp(r, 'updated_at', 'updatedAt'),
  };
}
