import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  isProfileRestricted,
  normalizeTokenUserProfile,
  useFollow,
  useFollowList,
  useSession,
  useUserPostsFeed,
  useUserProfile,
} from '../../api';
import type { PostResponse } from '../../api/post/types';
import type { UserProfileResponse } from '../../api/user/types';
import { PostCard } from '../../features/posts/components/PostCard';
import { theme } from '../../presentation/theme/theme';
import { type ThemeColors, useThemeColors } from '../../presentation/theme/ThemeContext';
import { UserAvatar } from '../../shared/components/UserAvatar';
import { useMessageModal } from '../../shared/components/MessageModal';
import {
  PostFeedSkeleton,
  ProfileHeaderSkeleton,
  SkeletonBox,
  SkeletonGroup,
} from '../../shared/components/skeleton';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'UserProfile'>;

export function UserProfileScreen({ route, navigation }: Props) {
  const { userId } = route.params;
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { modal, show: showModal, hide: hideModal } = useMessageModal();
  const { accessToken, user } = useSession();
  const meProfile = user ? normalizeTokenUserProfile(user) : null;
  const meId = meProfile?.id?.trim();

  const { profile, loading, error, refresh, silentRefresh, setProfile } =
    useUserProfile(userId);
  const restricted = profile ? isProfileRestricted(profile) : false;

  const { follow, unfollow, pending: followPending } = useFollow();
  const [localFollowing, setLocalFollowing] = useState<boolean | null>(null);
  const [localFollowerCount, setLocalFollowerCount] = useState<number | null>(null);

  const isFollowing = localFollowing ?? profile?.is_following ?? false;
  const followerCount = localFollowerCount ?? profile?.follower_count ?? 0;

  const currentUserId = meId;
  const { users: followingUsers, refresh: refreshFollowingList } = useFollowList({
    userId: currentUserId,
    kind: 'following',
  });
  const followingIds = useMemo(
    () => new Set(followingUsers.map((u) => u.id)),
    [followingUsers],
  );

  const {
    posts,
    loading: postsLoading,
    refreshing: postsRefreshing,
    loadingMore: postsLoadingMore,
    error: postsError,
    loadMore,
    refresh: refreshPosts,
    hasMore,
    updatePost,
    removePost,
  } = useUserPostsFeed(accessToken, userId, true);

  const handleFollow = useCallback(async () => {
    if (followPending) return;
    setLocalFollowing(true);
    setLocalFollowerCount((prev) => (prev ?? profile?.follower_count ?? 0) + 1);
    try {
      const res = await follow(userId);
      setLocalFollowerCount(res.followers_count);
      void silentRefresh();
    } catch {
      setLocalFollowing(false);
      setLocalFollowerCount((prev) =>
        prev != null ? Math.max(0, prev - 1) : profile?.follower_count ?? 0,
      );
    }
  }, [follow, followPending, profile?.follower_count, silentRefresh, userId]);

  const handleUnfollow = useCallback(() => {
    if (followPending) return;
    const name =
      [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
      profile?.username ||
      'this user';
    showModal({
      title: `Unfollow ${name}?`,
      message: 'You can always follow them again later.',
      buttons: [
        { label: 'Cancel', variant: 'secondary', onPress: hideModal },
        {
          label: 'Unfollow',
          variant: 'destructive',
          onPress: () => {
            hideModal();
            setLocalFollowing(false);
            setLocalFollowerCount((prev) =>
              prev != null ? Math.max(0, prev - 1) : Math.max(0, (profile?.follower_count ?? 1) - 1),
            );
            void (async () => {
              try {
                const res = await unfollow(userId);
                setLocalFollowerCount(res.followers_count);
                void silentRefresh();
              } catch {
                setLocalFollowing(true);
                setLocalFollowerCount((prev) =>
                  prev != null ? prev + 1 : profile?.follower_count ?? 0,
                );
              }
            })();
          },
        },
      ],
    });
  }, [followPending, hideModal, profile, showModal, silentRefresh, unfollow, userId]);

  const openFollowList = useCallback(
    (kind: 'followers' | 'following') => {
      navigation.push('FollowList', { userId, kind });
    },
    [navigation, userId],
  );

  const fullName = useMemo(() => {
    if (!profile) return '';
    return [profile.first_name?.trim(), profile.last_name?.trim()]
      .filter(Boolean)
      .join(' ');
  }, [profile]);

  const renderPostItem = useCallback(
    ({ item }: { item: PostResponse }) => (
      <PostCard
        post={item}
        currentUserId={currentUserId}
        followingIds={followingIds}
        onFollowListChanged={refreshFollowingList}
        onPostUpdated={updatePost}
        onDeleted={removePost}
      />
    ),
    [currentUserId, followingIds, refreshFollowingList, updatePost, removePost],
  );

  const bottomPad = Math.max(insets.bottom, 16);

  const renderHeader = useCallback(() => {
    if (loading && !profile) {
      return (
        <View style={styles.headerCard}>
          <ProfileHeaderSkeleton />
        </View>
      );
    }
    if (error && !profile) {
      return (
        <View style={styles.headerCard}>
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error.message}</Text>
            <Pressable style={styles.retryBtn} onPress={refresh} accessibilityRole="button">
              <Text style={styles.retryBtnText}>Retry</Text>
            </Pressable>
          </View>
        </View>
      );
    }
    if (!profile) return null;

    return (
      <View style={styles.headerCard}>
        <View style={styles.avatarRow}>
          <UserAvatar
            seed={profile.id}
            avatarUrl={profile.avatar_url}
            size={92}
          />
        </View>

        <Text style={styles.displayName} numberOfLines={2}>
          {fullName || 'User'}
        </Text>
        {profile.username ? (
          <Text style={styles.username}>@{profile.username}</Text>
        ) : null}

        {/* Counts row */}
        <View style={styles.countsRow}>
          <Pressable
            style={({ pressed }) => [styles.countBlock, pressed && styles.countBlockPressed]}
            onPress={() => openFollowList('followers')}
            accessibilityRole="button"
          >
            <Text style={styles.countValue}>{String(followerCount)}</Text>
            <Text style={styles.countLabel}>Followers</Text>
          </Pressable>
          <View style={styles.countDivider} />
          <Pressable
            style={({ pressed }) => [styles.countBlock, pressed && styles.countBlockPressed]}
            onPress={() => openFollowList('following')}
            accessibilityRole="button"
          >
            <Text style={styles.countValue}>{String(profile.following_count)}</Text>
            <Text style={styles.countLabel}>Following</Text>
          </Pressable>
          <View style={styles.countDivider} />
          <View style={styles.countBlock}>
            <Text style={styles.countValue}>{String(profile.post_count)}</Text>
            <Text style={styles.countLabel}>Posts</Text>
          </View>
        </View>

        {/* Follow / Unfollow button */}
        {!profile.is_own_profile ? (
          isFollowing ? (
            <Pressable
              style={({ pressed }) => [
                styles.followBtn,
                styles.followingBtn,
                pressed && styles.followBtnPressed,
              ]}
              onPress={handleUnfollow}
              disabled={followPending}
              accessibilityRole="button"
              accessibilityLabel="Unfollow"
            >
              {followPending ? (
                <ActivityIndicator size="small" color={colors.brand} />
              ) : (
                <Text style={styles.followingBtnText}>Following</Text>
              )}
            </Pressable>
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.followBtn,
                styles.followBtnFilled,
                pressed && styles.followBtnPressed,
              ]}
              onPress={handleFollow}
              disabled={followPending}
              accessibilityRole="button"
              accessibilityLabel="Follow"
            >
              {followPending ? (
                <ActivityIndicator size="small" color={colors.onBrand} />
              ) : (
                <Text style={styles.followBtnText}>Follow</Text>
              )}
            </Pressable>
          )
        ) : null}

        {/* Private banner */}
        {restricted ? (
          <View style={styles.privateBanner}>
            <MaterialCommunityIcons name="lock-outline" size={36} color={colors.textMuted} />
            <Text style={styles.privateBannerTitle}>This account is private</Text>
            <Text style={styles.privateBannerSub}>
              Follow to see their posts and details
            </Text>
          </View>
        ) : null}

        {/* Bio & details */}
        {!restricted && (profile.bio || profile.gender || profile.grade || profile.dob) ? (
          <View style={styles.bioSection}>
            {profile.bio ? <Text style={styles.bioText}>{profile.bio}</Text> : null}
            <View style={styles.detailChips}>
              {profile.gender ? (
                <View style={styles.detailChip}>
                  <Text style={styles.detailChipText}>{profile.gender}</Text>
                </View>
              ) : null}
              {profile.grade ? (
                <View style={styles.detailChip}>
                  <Text style={styles.detailChipText}>{profile.grade}</Text>
                </View>
              ) : null}
              {profile.dob ? (
                <View style={styles.detailChip}>
                  <Text style={styles.detailChipText}>{profile.dob}</Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}
      </View>
    );
  }, [
    colors,
    error,
    followPending,
    followerCount,
    fullName,
    handleFollow,
    handleUnfollow,
    isFollowing,
    loading,
    openFollowList,
    profile,
    refresh,
    restricted,
    styles,
  ]);

  const emptyMessage = useMemo(() => {
    if (restricted) return 'This account is private.';
    if (postsError) return postsError.message;
    return 'No posts yet.';
  }, [postsError, restricted]);

  const renderEmpty = useCallback(() => {
    if (postsLoading && posts.length === 0 && !restricted) {
      return <PostFeedSkeleton count={3} />;
    }
    if (postsError && posts.length === 0 && !restricted) {
      return (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>{postsError.message}</Text>
          <Pressable style={styles.retryBtn} onPress={refreshPosts} accessibilityRole="button">
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      );
    }
    if (restricted) {
      return null;
    }
    return (
      <View style={styles.emptyWrap}>
        <MaterialCommunityIcons name="note-text-outline" size={48} color={colors.textMuted} />
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }, [colors.textMuted, emptyMessage, posts.length, postsError, postsLoading, refreshPosts, restricted, styles]);

  const handleRefresh = useCallback(() => {
    refresh();
    if (!restricted) refreshPosts();
  }, [refresh, refreshPosts, restricted]);

  return (
    <View style={styles.root}>
      <FlatList
        data={restricted ? [] : posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPostItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: bottomPad },
          !restricted && posts.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={postsRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.brand}
            colors={[colors.brand]}
            {...(Platform.OS === 'android'
              ? { progressBackgroundColor: colors.surface }
              : {})}
          />
        }
        onEndReached={() => {
          if (hasMore && !restricted) void loadMore();
        }}
        onEndReachedThreshold={0.35}
        ListFooterComponent={
          postsLoadingMore ? (
            <ActivityIndicator style={styles.footerSpinner} color={colors.brand} />
          ) : null
        }
      />
      {modal}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  const cardShadow = Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
    },
    android: { elevation: 2 },
    default: {},
  });

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.surfaceSubtle,
    },
    listContent: {
      paddingHorizontal: theme.spacing.screenPaddingH,
      paddingTop: 4,
    },
    listContentEmpty: {
      flexGrow: 1,
    },
    headerCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      paddingTop: 8,
      paddingHorizontal: 14,
      paddingBottom: 14,
      marginBottom: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
      ...cardShadow,
    },
    centered: {
      minHeight: 120,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 24,
    },
    errorText: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.md,
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: 12,
    },
    retryBtn: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 10,
      backgroundColor: colors.brandLight,
    },
    retryBtnText: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.md,
      color: colors.brand,
    },
    avatarRow: {
      alignItems: 'center',
      marginBottom: 8,
    },
    displayName: {
      textAlign: 'center',
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.md,
      color: colors.textPrimary,
      letterSpacing: -0.15,
    },
    username: {
      marginTop: 2,
      textAlign: 'center',
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.xs,
      color: colors.textMuted,
    },
    countsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 10,
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 10,
      backgroundColor: colors.surfaceSubtle,
    },
    countBlock: {
      flex: 1,
      alignItems: 'center',
      gap: 2,
      paddingVertical: 2,
      borderRadius: 10,
    },
    countBlockPressed: {
      opacity: 0.72,
    },
    countValue: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.md,
      color: colors.textPrimary,
      fontVariant: ['tabular-nums'],
    },
    countLabel: {
      fontFamily: theme.typography.medium,
      fontSize: theme.fontSizes.meta,
      color: colors.textMuted,
    },
    countDivider: {
      width: 1,
      alignSelf: 'stretch',
      backgroundColor: colors.borderSubtle,
    },
    followBtn: {
      alignSelf: 'center',
      marginTop: 12,
      paddingVertical: 10,
      paddingHorizontal: 32,
      borderRadius: 10,
      minWidth: 120,
      alignItems: 'center',
    },
    followBtnFilled: {
      backgroundColor: colors.brand,
    },
    followingBtn: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.brand,
    },
    followBtnPressed: {
      opacity: 0.85,
    },
    followBtnText: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.sm,
      color: colors.onBrand,
    },
    followingBtnText: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.sm,
      color: colors.brand,
    },
    privateBanner: {
      alignItems: 'center',
      paddingVertical: 20,
      gap: 6,
    },
    privateBannerTitle: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.md,
      color: colors.textPrimary,
    },
    privateBannerSub: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.textMuted,
      textAlign: 'center',
    },
    bioSection: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderSubtle,
    },
    bioText: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.textPrimary,
      lineHeight: 22,
      marginBottom: 8,
    },
    detailChips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    detailChip: {
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: theme.radius.badge,
      backgroundColor: colors.surfaceSubtle,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
    },
    detailChipText: {
      fontFamily: theme.typography.medium,
      fontSize: theme.fintSizes.xs,
      color: colors.textPrimary,
    },
    emptyWrap: {
      alignItems: 'center',
      paddingVertical: 32,
      paddingHorizontal: 24,
      gap: 8,
    },
    emptyText: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.md,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 22,
    },
    separator: {
      height: 12,
    },
    footerSpinner: {
      paddingVertical: 16,
    },
  });
}
