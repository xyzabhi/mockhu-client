import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatTierLabel } from '../../badge/tierTokens';
import { xpProgressInCurrentLevel } from '../../badge/xpLevel';
import { theme } from '../../presentation/theme/theme';
import { type ThemeColors, useThemeColors } from '../../presentation/theme/ThemeContext';
import { formatCompactCount } from '../utils/formatCompactCount';

type XpProgressCardProps = {
  totalXp: number;
  level: number;
  tier: string;
  xpToNextLevel?: number;
};

export function XpProgressCard({
  totalXp,
  level,
  tier,
  xpToNextLevel,
}: XpProgressCardProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const fill = useMemo(
    () => xpProgressInCurrentLevel(totalXp, level),
    [totalXp, level],
  );

  return (
    <View style={styles.card} accessibilityRole="summary">
      <View style={styles.topRow}>
        <Text style={styles.tierLabel}>{formatTierLabel(tier)}</Text>
        <Text style={styles.xpTotal} accessibilityLabel={`Total XP ${totalXp}`}>
          {formatCompactCount(totalXp)} XP
        </Text>
      </View>
      <View
        style={styles.track}
        accessibilityLabel={`Experience progress ${Math.round(fill * 100)} percent`}
      >
        <View style={[styles.fill, { width: `${Math.round(fill * 100)}%` }]} />
      </View>
      {typeof xpToNextLevel === 'number' && Number.isFinite(xpToNextLevel) ? (
        <Text style={styles.nextHint}>
          {xpToNextLevel === 0
            ? 'Next level ready'
            : `${formatCompactCount(xpToNextLevel)} XP to next level`}
        </Text>
      ) : (
        <Text style={styles.nextHint}>Keep learning to level up</Text>
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      marginTop: 16,
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
      gap: 8,
    },
    tierLabel: {
      flex: 1,
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.sm,
      color: colors.textPrimary,
    },
    xpTotal: {
      fontFamily: theme.typography.medium,
      fontSize: theme.fontSizes.meta,
      color: colors.progress,
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
      backgroundColor: colors.progress,
    },
    nextHint: {
      marginTop: 8,
      fontFamily: theme.typography.regular,
      fontSize: theme.fontSizes.meta,
      color: colors.textMuted,
    },
  });
}
