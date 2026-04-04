import { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useUserSuggestions } from '../../api';
import { theme } from '../../presentation/theme/theme';
import { navigationRef } from '../../navigation/navigationRef';
import { SuggestedUserRow } from './SuggestedUserRow';

const PREVIEW_COUNT = 5;

export function SuggestedForYouSection() {
  const { items, loading, error, refresh } = useUserSuggestions();

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
          <ActivityIndicator size="small" color={theme.colors.brand} />
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
      {preview.map((u) => (
        <SuggestedUserRow key={u.id} item={u} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.md,
    color: theme.colors.textPrimary,
  },
  seeAll: {
    fontFamily: theme.typography.medium,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.brand,
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
    color: theme.colors.textMuted,
  },
  errorText: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.danger,
    marginBottom: 10,
  },
  retryBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.brand,
  },
  retryBtnText: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.onBrand,
  },
});
