import type { PostType } from './types';

export const POST_TYPES: PostType[] = ['DOUBT', 'TIP', 'WIN', 'EXPERIENCE'];

/** Each tag: alphanumeric + underscore, max 30 chars. */
export const TAG_PART = /^[a-zA-Z0-9_]{1,30}$/;

export function validatePostContent(content: string): string | null {
  const t = content.trim();
  if (t.length < 10) return 'Content must be at least 10 characters.';
  if (t.length > 2000) return 'Content must be at most 2000 characters.';
  return null;
}

/** Parse comma/space-separated tags → 1–3 lowercase tags. */
export function parseTagsInput(raw: string): { ok: true; tags: string[] } | { ok: false; message: string } {
  const parts = raw
    .split(/[\s,]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (parts.length < 1 || parts.length > 3) {
    return { ok: false, message: 'Use 1–3 tags (comma-separated).' };
  }
  for (const p of parts) {
    if (!TAG_PART.test(p)) {
      return {
        ok: false,
        message: 'Each tag: letters, numbers, underscores only, max 30 characters.',
      };
    }
  }
  return { ok: true, tags: parts };
}

/** Validate an explicit tag list (1–3 tags) for chip-based UIs. */
export function validateTags(tags: string[]): string | null {
  if (tags.length < 1 || tags.length > 3) {
    return 'Use 1–3 tags.';
  }
  for (const p of tags) {
    if (!TAG_PART.test(p)) {
      return 'Each tag: letters, numbers, underscores only, max 30 characters.';
    }
  }
  return null;
}

/** Server rule: images XOR non-empty link — not both. */
export function validateMediaRule(imageCount: number, linkUrlTrimmed: string): string | null {
  const hasLink = linkUrlTrimmed.length > 0;
  if (imageCount > 0 && hasLink) {
    return 'Remove either the link or the photos (only one kind per post).';
  }
  return null;
}
