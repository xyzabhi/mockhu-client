import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../presentation/theme/theme';
import { type ThemeColors, useThemeColors } from '../../presentation/theme/ThemeContext';

type HpMeterCardProps = {
  currentHp: number;
  maxHp: number;
};

/**
 * HP — separate from XP; can decrease (moderation, etc.). Shown when `/me` exposes `hp_info`.
 */
export function HpMeterCard({ currentHp, maxHp }: HpMeterCardProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const max = Math.max(1, maxHp);
  const cur = Math.max(0, Math.min(currentHp, max));
  const ratio = cur / max;
  const fillColor =
    ratio > 0.35 ? colors.brand : ratio > 0.15 ? colors.starGold : colors.danger;

  return (
    <View style={styles.card} accessibilityRole="summary" accessibilityLabel={`HP ${cur} of ${max}`}>
      <View style={styles.topRow}>
        <Text style={styles.title}>HP</Text>
        <Text style={styles.fraction}>
          {cur} / {max}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(ratio * 100)}%`, backgroundColor: fillColor }]} />
      </View>
      <Text style={styles.hint}>Reputation & moderation health — separate from XP.</Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      marginTop: 12,
      padding: 14,
      borderRadius: theme.radius.card,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    title: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.sm,
      color: colors.textPrimary,
    },
    fraction: {
      fontFamily: theme.typography.medium,
      fontSize: theme.fontSizes.meta,
      color: colors.textMuted,
      fontVariant: ['tabular-nums'],
    },
    track: {
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.surfaceSubtle,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      borderRadius: 4,
      minWidth: 2,
    },
    hint: {
      marginTop: 8,
      fontFamily: theme.typography.regular,
      fontSize: theme.fontSizes.meta,
      color: colors.textMuted,
    },
  });
}
