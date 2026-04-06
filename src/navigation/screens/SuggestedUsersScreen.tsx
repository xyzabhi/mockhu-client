import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserSuggestions } from '../../api';
import { theme } from '../../presentation/theme/theme';
import type { UserSummary } from '../../api/user/types';
import { SuggestedUserRow } from '../../shared/components/SuggestedUserRow';
import { resetToRoute } from '../navigationRef';

export function SuggestedUsersScreen() {
  const insets = useSafeAreaInsets();
  const { items, loading, loadingMore, error, loadMore, refresh, hasMore } =
    useUserSuggestions();

  return (
    <View style={styles.root}>
      <Text style={styles.subtitle}>
        Follow people preparing for the same exams. You can always find more later.
      </Text>

      {loading && items.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.brand} />
        </View>
      ) : error && items.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error.message}</Text>
          <Pressable style={styles.retryBtn} onPress={refresh}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          style={styles.list}
          data={items}
          keyExtractor={(u: UserSummary) => String(u.id)}
          renderItem={({ item }) => <SuggestedUserRow item={item} />}
          contentContainerStyle={styles.listContent}
          onEndReached={() => {
            if (hasMore) void loadMore();
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator style={styles.footerSpinner} color={theme.colors.brand} />
            ) : null
          }
          ListEmptyComponent={
            !loading ? (
              <Text style={styles.empty}>No suggestions right now.</Text>
            ) : null
          }
        />
      )}

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          style={({ pressed }) => [styles.continueCta, pressed && styles.continueCtaPressed]}
          onPress={() => resetToRoute('Main')}
          accessibilityRole="button"
          accessibilityLabel="Continue to home"
          android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
        >
          <Text style={styles.continueCtaText}>Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.surfaceSubtle,
  },
  subtitle: {
    paddingHorizontal: theme.spacing.screenPaddingH,
    paddingTop: 8,
    paddingBottom: 12,
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textMuted,
    lineHeight: 20,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: theme.spacing.screenPaddingH,
    paddingBottom: 8,
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.danger,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.brand,
  },
  retryBtnText: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.onBrand,
  },
  footerSpinner: {
    marginVertical: 16,
  },
  empty: {
    textAlign: 'center',
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textMuted,
    paddingVertical: 32,
  },
  footer: {
    paddingHorizontal: theme.spacing.screenPaddingH,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.surface,
  },
  continueCta: {
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.brand,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  continueCtaPressed: {
    opacity: 0.9,
  },
  continueCtaText: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.md,
    color: theme.colors.onBrand,
  },
});
