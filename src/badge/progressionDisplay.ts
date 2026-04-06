import { tierFromLevel, type TierName } from './xpLevel';

const TIER_ORDER: TierName[] = ['Aspirant', 'Scholar', 'Solver', 'Expert', 'Legend'];

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

export type LevelBadgeData = {
  level: number;
  tierLabel: TierName;
};

/**
 * Data for {@link LevelBadge} from session user (`/me` → `level` / `tier`).
 * Returns `null` when the API does not expose a level yet.
 */
export function resolveLevelBadgeFromUser(user: {
  level?: number;
  tier?: string | null;
}): LevelBadgeData | null {
  const serverLevel =
    typeof user.level === 'number' && Number.isFinite(user.level) && user.level >= 1
      ? Math.floor(user.level)
      : null;
  if (serverLevel == null) return null;
  return {
    level: serverLevel,
    tierLabel: tierLabelForDisplay(serverLevel, user.tier),
  };
}
