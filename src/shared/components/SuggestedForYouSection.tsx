import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useInterestSuggestions } from '../../api';
import { theme } from '../../presentation/theme/theme';
import { type ThemeColors, useThemeColors } from '../../presentation/theme/ThemeContext';
import { navigationRef } from '../../navigation/navigationRef';
import { SuggestedUserCard } from './SuggestedUserRow';

const PREVIEW_COUNT = 5;

export function SuggestedForYouSection() {
  const colors = useThemeColors();
  const styles = useMemo(() => createSectionStyles(colors), [colors]);
  const { items, loading, error, refresh } = useInterestSuggestions();

  const goToFullList = useCallback(() => {
    if (navigationRef.isReady()) {
      navigationRef.navigate('SuggestedUsers');
    }
  }, []);

  const preview = items.slice(0, PREVIEW_COUNT);

  if (loading && items.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Suggested for you</Text>
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.brand} />
          <Text style={styles.muted}>Loading suggestions…</Text>
        </View>
      </View>
    );
  }

  if (error && items.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Suggested for you</Text>
        <Text style={styles.errorText}>{error.message}</Text>
        <Pressable style={styles.retryBtn} onPress={refresh}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Suggested for you</Text>
        <Pressable onPress={goToFullList} hitSlop={8} accessibilityRole="button">
          <Text style={styles.seeAll}>See all</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.suggestionsScroll}
        decelerationRate="fast"
        accessibilityRole="list"
      >
        {preview.map((u) => (
          <SuggestedUserCard key={u.id} item={u} />
        ))}
      </ScrollView>
    </View>
  );
}

function createSectionStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      marginTop: 20,
      paddingTop: 16,
      paddingBottom: 14,
      paddingHorizontal: 16,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    sectionTitle: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.lg,
      color: colors.textPrimary,
      letterSpacing: -0.2,
    },
    suggestionsScroll: {
      flexDirection: 'row',
      alignItems: 'stretch',
      paddingBottom: 4,
      paddingRight: 4,
    },
    seeAll: {
      fontFamily: theme.typography.medium,
      fontSize: theme.fintSizes.sm,
      color: colors.brand,
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 16,
    },
    muted: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.textMuted,
    },
    errorText: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.danger,
      marginBottom: 10,
    },
    retryBtn: {
      alignSelf: 'flex-start',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: theme.radius.button,
      backgroundColor: colors.brand,
    },
    retryBtnText: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.sm,
      color: colors.onBrand,
    },
  });
}
