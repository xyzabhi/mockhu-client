/**
 * Stable square-crop dog photos (Unsplash) for placeholder avatars when the user has no photo.
 * Same `seed` always maps to the same image so lists stay consistent.
 */
const DOG_AVATAR_URIS = [
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=256&h=256&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=256&h=256&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1552053831-71594a27632d?w=256&h=256&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1568572933382-74d93364217d?w=256&h=256&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1517849845537-29656f28c448?w=256&h=256&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1530281700549-e82e7bf170d0?w=256&h=256&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1561037404-61cd46aa615c?w=256&h=256&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1518717758535-96ae2d40a65f?w=256&h=256&fit=crop&auto=format&q=80',
];

function hashString(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Pick a dog avatar URL from a stable seed (e.g. user id or username). */
export function pickDogAvatarUri(seed: string): string {
  const idx = hashString(seed) % DOG_AVATAR_URIS.length;
  return DOG_AVATAR_URIS[idx];
}
