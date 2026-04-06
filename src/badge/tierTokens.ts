import type { ThemeColors } from '../presentation/theme/ThemeContext';

export function tierBadgeColors(
  tier: string,
  colors: ThemeColors,
): { bg: string; border: string; text: string } {
  const t = tier.trim();
  switch (t) {
    case 'Aspirant':
      return {
        bg: colors.surfaceSubtle,
        border: colors.borderSubtle,
        text: colors.textMuted,
      };
    case 'Scholar':
      return {
        bg: colors.brandLight,
        border: colors.brandBorder,
        text: colors.brand,
      };
    case 'Solver':
      return {
        bg: colors.progressLight,
        border: colors.progressBorder,
        text: colors.progress,
      };
    case 'Expert':
      return {
        bg: colors.surface === '#121214' ? '#1c1410' : '#FFF7ED',
        border: colors.starGold,
        text: colors.starGold,
      };
    case 'Legend':
      return {
        bg: colors.surface === '#121214' ? '#1e1b4b' : '#EEF2FF',
        border: colors.brand,
        text: colors.brand,
      };
    default:
      return {
        bg: colors.surfaceSubtle,
        border: colors.borderSubtle,
        text: colors.textPrimary,
      };
  }
}

export function resolveTierAccent(
  tier: string,
  tierColorHint: string | undefined,
  colors: ThemeColors,
): string {
  const hint = tierColorHint?.trim();
  if (hint && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hint)) {
    return hint;
  }
  return tierBadgeColors(tier, colors).border;
}

export function formatTierLabel(tier: string): string {
  return tier.trim() || '—';
}
