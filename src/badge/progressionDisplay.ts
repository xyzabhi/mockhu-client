import {
  cumulativeXpAtStartOfLevel,
  getLevelFromTotalXp,
  tierFromLevel,
  xpRemainingToNextLevel,
  type TierName,
} from './xpLevel';

const TIER_ORDER: TierName[] = ['Aspirant', 'Scholar', 'Solver', 'Expert', 'Legend'];

/**
 * Progression UI rules (product / `internal/badge`):
 * - Prefer **`level` / `tier` / `xp_to_next_level`** from `/me` `level_info` when present.
 * - If the API only returns **`xp`** (no `level_info`), derive **level** with the same curve
 *   as the server (`getLevelFromTotalXp` in `xpLevel.ts` ↔ `internal/badge/level.go`).
 * - **Tier** styling uses API `tier` + `tier_color_hint` when present; otherwise bands from level.
 */

export function hasServerLevel(level: number | undefined): boolean {
  return typeof level === 'number' && Number.isFinite(level) && level >= 1;
}

/** Match API tier string to canonical name (case-insensitive); else derive from level. */
export function tierLabelForDisplay(level: number, tierFromServer?: string | null): TierName {
  const raw = tierFromServer?.trim();
  if (raw) {
    const lower = raw.toLowerCase();
    const found = TIER_ORDER.find((t) => t.toLowerCase() === lower);
    if (found) return found;
  }
  return tierFromLevel(level);
}

export type ResolvedProgression = {
  level: number;
  tierLabel: TierName;
  /** From server when present; else derived from total XP. */
  xpToNext: number | undefined;
};

/**
 * Level badge + XP card data. Returns `null` when there is no XP and no server level
 * (nothing to show). If the server sends `level`, it wins even when `xp` is 0.
 */
export function resolveProgressionFromTokenUser(user: {
  xp?: number;
  level?: number;
  tier?: string;
  xp_to_next_level?: number;
}): ResolvedProgression | null {
  const xp =
    typeof user.xp === 'number' && Number.isFinite(user.xp) ? Math.max(0, user.xp) : 0;
  const serverLevel =
    typeof user.level === 'number' && Number.isFinite(user.level) ? user.level : undefined;

  const resolvedLevel: number | null = hasServerLevel(serverLevel)
    ? serverLevel!
    : xp > 0
      ? getLevelFromTotalXp(xp)
      : null;
  if (resolvedLevel == null) return null;

  const xpToNextExplicit =
    typeof user.xp_to_next_level === 'number' && Number.isFinite(user.xp_to_next_level)
      ? user.xp_to_next_level
      : undefined;

  let xpToNext: number | undefined;
  if (xpToNextExplicit !== undefined) {
    xpToNext = xpToNextExplicit;
  } else if (hasServerLevel(serverLevel)) {
    xpToNext = Math.max(0, cumulativeXpAtStartOfLevel(resolvedLevel + 1) - xp);
  } else {
    xpToNext = xpRemainingToNextLevel(xp);
  }

  return {
    level: resolvedLevel,
    tierLabel: tierLabelForDisplay(resolvedLevel, user.tier),
    xpToNext,
  };
}
