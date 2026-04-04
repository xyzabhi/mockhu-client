import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFollow, useUserSuggestions } from '../../api';
import { theme } from '../../presentation/theme/theme';
import type { UserSummary } from '../../api/user/types';
import { resetToRoute } from '../navigationRef';

function displayName(u: UserSummary): string {
  const parts = [u.first_name?.trim(), u.last_name?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : u.username;
}

function SuggestionRow({ item }: { item: UserSummary }) {
  const { follow, pending } = useFollow();
  const [done, setDone] = useState(false);

  const handleFollow = useCallback(async () => {
    try {
      await follow(item.id);
      setDone(true);
    } catch {
      Alert.alert('Could not follow', 'Try again in a moment.');
    }
  }, [follow, item.id]);

  return (
    <View style={styles.row}>
      <View style={styles.avatarWrap}>
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatarImg} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>
              {(item.username?.slice(0, 2) ?? '?').toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowName} numberOfLines={1}>
          {displayName(item)}
        </Text>
        <Text style={styles.rowUsername} numberOfLines={1}>
          @{item.username}
        </Text>
      </View>
      {!done ? (
        <Pressable
          style={({ pressed }) => [styles.followBtn, pressed && styles.followBtnPressed]}
          onPress={() => void handleFollow()}
          disabled={pending}
          accessibilityRole="button"
          accessibilityLabel={`Follow ${item.username}`}
        >
          {pending ? (
            <ActivityIndicator size="small" color={theme.colors.brand} />
          ) : (
            <Text style={styles.followBtnText}>Follow</Text>
          )}
        </Pressable>
      ) : (
        <View style={styles.followingPill}>
          <MaterialCommunityIcons name="check" size={16} color={theme.colors.textMuted} />
          <Text style={styles.followingText}>Following</Text>
        </View>
      )}
    </View>
  );
}

export function SuggestedUsersScreen() {
  const insets = useSafeAreaInsets();
  const { items, loading, loadingMore, error, loadMore, refresh, hasMore } =
    useUserSuggestions();
  const [, setFollowTick] = useState(0);

  const onFollowed = useCallback(() => setFollowTick((n) => n + 1), []);

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
          data={items}
          keyExtractor={(u) => u.id}
          renderItem={({ item }) => <SuggestionRow item={item} />}
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
          onPress={() => resetToRoute('Home')}
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
  listContent: {
    paddingHorizontal: theme.spacing.screenPaddingH,
    paddingBottom: 8,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.borderSubtle,
    gap: 12,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.brandLight,
  },
  avatarInitials: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.brand,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  rowName: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textPrimary,
  },
  rowUsername: {
    marginTop: 2,
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.textMuted,
  },
  followBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.radius.button,
    borderWidth: 1,
    borderColor: theme.colors.brand,
    backgroundColor: theme.colors.ctaDisabledBackground,
    minWidth: 88,
    alignItems: 'center',
  },
  followBtnPressed: {
    opacity: 0.9,
  },
  followBtnText: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.brand,
  },
  followingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  followingText: {
    fontFamily: theme.typography.medium,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.textMuted,
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
