import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../presentation/theme/theme';
import { type ThemeColors, useThemeColors } from '../../presentation/theme/ThemeContext';

const LABELS: Record<string, string> = {
  first_legend_tier: 'Legend tier',
};

type Props = {
  codes: string[];
};

export function SpecialBadgesRow({ codes }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (codes.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>Achievements</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {codes.map((code) => (
          <View key={code} style={styles.chip} accessibilityLabel={LABELS[code] ?? code}>
            <Text style={styles.chipText} numberOfLines={1}>
              {LABELS[code] ?? code.replace(/_/g, ' ')}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      marginTop: 16,
    },
    sectionTitle: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fontSizes.sectionHead,
      color: colors.textMuted,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingBottom: 4,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: theme.radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      maxWidth: 220,
    },
    chipText: {
      fontFamily: theme.typography.medium,
      fontSize: theme.fintSizes.xs,
      color: colors.textPrimary,
    },
  });
}
