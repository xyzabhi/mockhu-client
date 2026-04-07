import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../presentation/theme/theme';
import { type ThemeColors, useThemeColors } from '../../presentation/theme/ThemeContext';

/**
 * Placeholder for job listings matched to exams / skills. Wire to search or API when available.
 */
export function MatchingJobsScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: Math.max(insets.bottom, 20) + 16 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.lead}>
        Roles and openings tailored to what you study — same filters as your exam interests.
      </Text>
      <View style={styles.placeholderCard}>
        <Text style={styles.placeholderTitle}>No matches yet</Text>
        <Text style={styles.placeholderBody}>
          Add interests in your profile and we will surface relevant jobs here.
        </Text>
      </View>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.surfaceSubtle,
    },
    content: {
      paddingHorizontal: theme.spacing.screenPaddingH,
      paddingTop: 12,
    },
    lead: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.textMuted,
      lineHeight: 22,
      marginBottom: 20,
    },
    placeholderCard: {
      backgroundColor: colors.surface,
      borderRadius: theme.radius.card,
      padding: 18,
      borderWidth: theme.borderWidth.default,
      borderColor: colors.borderSubtle,
    },
    placeholderTitle: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.md,
      color: colors.textPrimary,
      marginBottom: 8,
    },
    placeholderBody: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.textMuted,
      lineHeight: 20,
    },
  });
}
