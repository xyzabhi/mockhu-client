/**
 * XP / level curve — matches backend `internal/badge/level.go`.
 * Cost L → L+1 (L ≥ 1): round(50 × 1.15^(L−1)).
 */

export function xpCostForLevelUp(L: number): number {
  if (L < 1) return 0;
  return Math.round(50 * Math.pow(1.15, L - 1));
}

/** Minimum total XP to be at level `level` (level 1 starts at 0 XP). */
export function cumulativeXpAtStartOfLevel(level: number): number {
  if (level <= 1) return 0;
  let sum = 0;
  for (let L = 1; L <= level - 1; L += 1) {
    sum += xpCostForLevelUp(L);
  }
  return sum;
}

/**
 * Current level from total XP — same rule as backend `GetLevel` / `internal/badge/level.go`.
 * Find L ≥ 1 such that `cumulativeXpAtStartOfLevel(L) <= totalXp < cumulativeXpAtStartOfLevel(L + 1)`.
 */
export function getLevelFromTotalXp(totalXp: number): number {
  if (!Number.isFinite(totalXp) || totalXp < 0) return 1;
  let level = 1;
  for (;;) {
    const nextThreshold = cumulativeXpAtStartOfLevel(level + 1);
    if (totalXp < nextThreshold) return level;
    level += 1;
    if (level > 100_000) return level;
  }
}

/** XP still needed to reach the next level (0 if exactly at a boundary). */
export function xpRemainingToNextLevel(totalXp: number): number {
  if (!Number.isFinite(totalXp) || totalXp < 0) return 0;
  const level = getLevelFromTotalXp(totalXp);
  const nextStart = cumulativeXpAtStartOfLevel(level + 1);
  return Math.max(0, nextStart - totalXp);
}

/** Progress 0…1 through the current level (XP bar fill). */
export function xpProgressInCurrentLevel(totalXp: number, level: number): number {
  if (level < 1) return 0;
  const start = cumulativeXpAtStartOfLevel(level);
  const span = xpCostForLevelUp(level);
  if (span <= 0) return 1;
  return Math.max(0, Math.min(1, (totalXp - start) / span));
}

export type TierName = 'Aspirant' | 'Scholar' | 'Solver' | 'Expert' | 'Legend';

/** Tier band by level — same as product / backend. */
export function tierFromLevel(level: number): TierName {
  if (level <= 10) return 'Aspirant';
  if (level <= 25) return 'Scholar';
  if (level <= 50) return 'Solver';
  if (level <= 100) return 'Expert';
  return 'Legend';
}
