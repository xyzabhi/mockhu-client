/**
 * Pick the best CDN size for a circular avatar given pixel diameter.
 * Falls back to `avatar_url` when `avatar_urls` is missing or incomplete.
 */
export function pickAvatarDisplayUrl(
  avatarUrl: string | null | undefined,
  avatarUrls: Record<string, string> | null | undefined,
  sizePx: number,
): string | null {
  const primary =
    typeof avatarUrl === 'string' && avatarUrl.trim() !== '' ? avatarUrl.trim() : null;
  if (!avatarUrls || typeof avatarUrls !== 'object') return primary;

  const u = avatarUrls;
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = u[k];
      if (typeof v === 'string' && v.trim() !== '') return v.trim();
    }
    return null;
  };

  if (sizePx <= 28) return pick('24', '40', '100', '400') ?? primary;
  if (sizePx <= 56) return pick('40', '100', '400', '24') ?? primary;
  if (sizePx <= 120) return pick('100', '400', '40') ?? primary;
  return pick('400', '100') ?? primary;
}
