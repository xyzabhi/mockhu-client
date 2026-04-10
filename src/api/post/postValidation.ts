import type { PostType } from './types';

export const POST_TYPES: PostType[] = ['DOUBT', 'TIP', 'WIN', 'EXPERIENCE'];

/** Title: no client-side length rules (server may enforce limits). */
export function validatePostTitle(_title: string): string | null {
  return null;
}

/** Body: no client-side length rules (server may enforce limits). */
export function validatePostBody(_content: string): string | null {
  return null;
}

/** Require at least a title or body (after trim), not both empty. */
export function validatePostHasTitleOrBody(title: string, body: string): string | null {
  if (title.trim().length < 1 && body.trim().length < 1) {
    return 'Add a title or some content for your post.';
  }
  return null;
}

/** @deprecated Prefer `validatePostBody` — same rules. */
export function validatePostContent(content: string): string | null {
  return validatePostBody(content);
}

/** Parse comma/space-separated tags (optional; no client-side format rules). */
export function parseTagsInput(raw: string): { ok: true; tags: string[] } {
  const parts = raw
    .split(/[\s,]+/)
    .map((s) => s.trim().replace(/^#+/u, ''))
    .filter(Boolean);
  return { ok: true, tags: parts };
}

/** Server: `POST /posts` multipart — max 4 images per post. */
export const POST_MEDIA_MAX_IMAGES = 4;

/** Server: each image file max 5 MiB. */
export const POST_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_POST_IMAGE_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

/** MIME types accepted by the API (JPEG, PNG, WebP, GIF). */
export function isAllowedPostImageMime(mime: string | undefined | null): boolean {
  if (!mime) return false;
  const m = mime.toLowerCase().split(';')[0]!.trim();
  return ALLOWED_POST_IMAGE_MIME.has(m);
}

/** Infer MIME from filename when the picker omits `mimeType`. */
export function inferPostImageMimeFromFilename(filename: string | undefined | null): string | null {
  if (!filename) return null;
  const lower = filename.toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
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
