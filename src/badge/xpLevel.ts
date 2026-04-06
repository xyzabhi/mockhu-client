/**
 * Tier band by level — product / backend naming for LevelBadge only (no XP curve).
 */
export type TierName = 'Aspirant' | 'Scholar' | 'Solver' | 'Expert' | 'Legend';

export function tierFromLevel(level: number): TierName {
  if (level <= 10) return 'Aspirant';
  if (level <= 25) return 'Scholar';
  if (level <= 50) return 'Solver';
  if (level <= 100) return 'Expert';
  return 'Legend';
}
