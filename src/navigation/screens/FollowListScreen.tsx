import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { normalizeTokenUserProfile, useFollow, useFollowList, useSession } from '../../api';
import type { UserSummary } from '../../api/user/types';
import { theme } from '../../presentation/theme/theme';
import { type ThemeColors, useThemeColors } from '../../presentation/theme/ThemeContext';
import { UserAvatar } from '../../shared/components/UserAvatar';
import { displayNameForUser } from '../../shared/components/SuggestedUserRow';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'FollowList'>;

export function FollowListScreen({ route }: Props) {
  const { userId, kind } = route.params;
  const colors = useThemeColors();
  const styles = useMemo(() => createFollowListStyles(colors), [colors]);
  const { user } = useSession();
  const me = user ? normalizeTokenUserProfile(user) : null;
  const meId = me?.id?.trim();
  const insets = useSafeAreaInsets();
  const { users, loading, loadingMore, error, loadMore, refresh, hasMore } = useFollowList({
    userId,
    kind,
    limit: 20,
  });
  const listPaddingBottom = Math.max(insets.bottom, 16) + 8;
  const emptyText = kind === 'followers' ? 'No followers yet.' : 'Not following anyone yet.';
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => new Set());
  const visibleUsers = useMemo(
    () => users.filter((u) => !hiddenIds.has(u.id)),
    [users, hiddenIds],
  );

  if (loading && users.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  if (error && users.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error.message}</Text>
        <Pressable style={styles.retryBtn} onPress={refresh}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <FlatList
        style={styles.list}
        data={visibleUsers}
        keyExtractor={(u: UserSummary) => String(u.id)}
        renderItem={({ item }) => (
          <FollowListRow
            item={item}
            kind={kind}
            meId={meId}
            onRemoved={(id) => {
              setHiddenIds((prev) => new Set(prev).add(id));
            }}
          />
        )}
        contentContainerStyle={[styles.listContent, { paddingBottom: listPaddingBottom }]}
        ListFooterComponent={
          visibleUsers.length > 0 ? (
            <View style={styles.footer}>
              {loadingMore ? (
                <ActivityIndicator size="small" color={colors.brand} />
              ) : hasMore ? (
                <Pressable
                  style={({ pressed }) => [styles.showMoreBtn, pressed && styles.showMoreBtnPressed]}
                  onPress={() => void loadMore()}
                  accessibilityRole="button"
                  accessibilityLabel="Show more users"
                >
                  <Text style={styles.showMoreBtnText}>Show more</Text>
                </Pressable>
              ) : (
                <Text style={styles.endHint}>End of list</Text>
              )}
            </View>
          ) : null
        }
        ListEmptyComponent={<Text style={styles.empty}>{emptyText}</Text>}
      />
    </View>
  );
}

function FollowListRow({
  item,
  kind,
  meId,
  onRemoved,
}: {
  item: UserSummary;
  kind: 'followers' | 'following';
  meId?: string;
  onRemoved: (id: string) => void;
}) {
  const colors = useThemeColors();
  const styles = useMemo(() => createFollowListStyles(colors), [colors]);
  const { follow, unfollow, pending } = useFollow();
  const isSelf = meId != null && item.id === meId;
  const [isFollowing, setIsFollowing] = useState(kind === 'following');

  const handleFollow = async () => {
    try {
      await follow(item.id);
      setIsFollowing(true);
    } catch {
      Alert.alert('Could not follow', 'Try again in a moment.');
    }
  };

  const confirmUnfollow = () => {
    Alert.alert('Unfollow', `Stop following @${item.username}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unfollow',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await unfollow(item.id);
              setIsFollowing(false);
              if (kind === 'following') {
                onRemoved(item.id);
              }
            } catch {
              Alert.alert('Could not unfollow', 'Try again in a moment.');
            }
          })();
        },
      },
    ]);
  };

  return (
    <View style={styles.row}>
      <UserAvatar seed={item.id} avatarUrl={item.avatar_url} size={48} />
      <View style={styles.rowText}>
        <Text style={styles.rowName} numberOfLines={1}>
          {displayNameForUser(item)}
        </Text>
        <Text style={styles.rowUsername} numberOfLines={1}>
          @{item.username}
        </Text>
      </View>
      {!isSelf ? (
        <Pressable
          style={({ pressed }) => [
            isFollowing ? styles.followingBtn : styles.followBtn,
            pressed && styles.actionBtnPressed,
          ]}
          onPress={isFollowing ? confirmUnfollow : () => void handleFollow()}
          disabled={pending}
          accessibilityRole="button"
          accessibilityLabel={
            isFollowing ? `Unfollow ${item.username}` : `Follow ${item.username}`
          }
        >
          {pending ? (
            <ActivityIndicator size="small" color={isFollowing ? colors.textMuted : colors.brand} />
          ) : (
            <Text style={isFollowing ? styles.followingBtnText : styles.followBtnText}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

function createFollowListStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.surfaceSubtle,
    },
    list: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: theme.spacing.screenPaddingH,
      flexGrow: 1,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderSubtle,
      gap: 12,
    },
    rowText: {
      flex: 1,
      minWidth: 0,
    },
    rowName: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.sm,
      color: colors.textPrimary,
    },
    rowUsername: {
      marginTop: 2,
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.xs,
      color: colors.textMuted,
    },
    followBtn: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: theme.radius.button,
      borderWidth: 1,
      borderColor: colors.brand,
      backgroundColor: colors.ctaDisabledBackground,
      minWidth: 92,
      alignItems: 'center',
    },
    followBtnText: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.xs,
      color: colors.brand,
    },
    followingBtn: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: theme.radius.button,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surface,
      minWidth: 92,
      alignItems: 'center',
    },
    followingBtnText: {
      fontFamily: theme.typography.medium,
      fontSize: theme.fintSizes.xs,
      color: colors.textMuted,
    },
    actionBtnPressed: {
      opacity: 0.8,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundColor: colors.surfaceSubtle,
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
    footer: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    showMoreBtn: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: theme.radius.button,
      borderWidth: 1,
      borderColor: colors.brand,
      backgroundColor: colors.surface,
      minWidth: 160,
      alignItems: 'center',
    },
    showMoreBtnPressed: {
      opacity: 0.9,
    },
    showMoreBtnText: {
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
