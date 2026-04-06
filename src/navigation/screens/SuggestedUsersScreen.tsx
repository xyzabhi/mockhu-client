import { useMemo } from 'react';
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
import { type ThemeColors, useThemeColors } from '../../presentation/theme/ThemeContext';
import type { UserSummary } from '../../api/user/types';
import { SuggestedUserRow } from '../../shared/components/SuggestedUserRow';

export function SuggestedUsersScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createSuggestedUsersStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { items, loading, loadingMore, error, loadMore, refresh, hasMore } =
    useUserSuggestions();

  const listPaddingBottom = Math.max(insets.bottom, 16) + 8;

  return (
    <View style={styles.root}>
      <Text style={styles.subtitle}>
        Follow people preparing for the same exams. You can always find more later.
      </Text>

      {loading && items.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.brand} />
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
          contentContainerStyle={[styles.listContent, { paddingBottom: listPaddingBottom }]}
          ListFooterComponent={
            <ListFooter
              styles={styles}
              colors={colors}
              loadingMore={loadingMore}
              hasMore={hasMore}
              hasItems={items.length > 0}
              onShowMore={() => void loadMore()}
            />
          }
          ListEmptyComponent={
            !loading ? (
              <Text style={styles.empty}>No suggestions right now.</Text>
            ) : null
          }
        />
      )}
    </View>
  );
}

function ListFooter({
  styles,
  colors,
  loadingMore,
  hasMore,
  hasItems,
  onShowMore,
}: {
  styles: ReturnType<typeof createSuggestedUsersStyles>;
  colors: ThemeColors;
  loadingMore: boolean;
  hasMore: boolean;
  hasItems: boolean;
  onShowMore: () => void;
}) {
  if (!hasItems) return null;

  if (loadingMore) {
    return (
      <View style={styles.showMoreWrap}>
        <ActivityIndicator size="small" color={colors.brand} />
      </View>
    );
  }

  if (hasMore) {
    return (
      <View style={styles.showMoreWrap}>
        <Pressable
          style={({ pressed }) => [styles.showMoreBtn, pressed && styles.showMoreBtnPressed]}
          onPress={onShowMore}
          accessibilityRole="button"
          accessibilityLabel="Show more suggestions"
        >
          <Text style={styles.showMoreText}>Show more</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Text style={styles.endHint} accessibilityRole="text">
      {"That's everyone for now."}
    </Text>
  );
}

function createSuggestedUsersStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.surfaceSubtle,
    },
    subtitle: {
      paddingHorizontal: theme.spacing.screenPaddingH,
      paddingTop: 8,
      paddingBottom: 12,
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.textMuted,
      lineHeight: 20,
    },
    list: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: theme.spacing.screenPaddingH,
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
      color: colors.danger,
      textAlign: 'center',
      marginBottom: 12,
    },
    retryBtn: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: theme.radius.button,
      backgroundColor: colors.brand,
    },
    retryBtnText: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.sm,
      color: colors.onBrand,
    },
    empty: {
      textAlign: 'center',
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.textMuted,
      paddingVertical: 32,
    },
    showMoreWrap: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    showMoreBtn: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: theme.radius.button,
      borderWidth: theme.borderWidth.default,
      borderColor: colors.brand,
      backgroundColor: colors.surface,
      minWidth: 160,
      alignItems: 'center',
    },
    showMoreBtnPressed: {
      opacity: 0.88,
    },
    showMoreText: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.sm,
      color: colors.brand,
    },
    endHint: {
      textAlign: 'center',
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.xs,
      color: colors.textMuted,
      paddingVertical: 16,
      paddingHorizontal: 16,
    },
  });
}
