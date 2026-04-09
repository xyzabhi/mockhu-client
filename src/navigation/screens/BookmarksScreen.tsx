import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  normalizeTokenUserProfile,
  useBookmarkFeed,
  useFollowList,
  useSession,
} from '../../api';
import type { PostResponse } from '../../api/post/types';
import { PostCard } from '../../features/posts/components/PostCard';
import { theme } from '../../presentation/theme/theme';
import { type ThemeColors, useThemeColors } from '../../presentation/theme/ThemeContext';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Bookmarks'>;

export function BookmarksScreen(_props: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { accessToken, user } = useSession();
  const currentUserId = user ? normalizeTokenUserProfile(user).id?.trim() : undefined;

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
    loading,
    refreshing,
    loadingMore,
    error,
    loadMore,
    refresh,
    hasMore,
    updatePost,
  } = useBookmarkFeed(accessToken);

  const renderItem = useCallback(
    ({ item }: { item: PostResponse }) => (
      <PostCard
        post={item}
        currentUserId={currentUserId}
        followingIds={followingIds}
        onFollowListChanged={refreshFollowingList}
        onPostUpdated={updatePost}
      />
    ),
    [currentUserId, followingIds, refreshFollowingList, updatePost],
  );

  const listEmpty = !loading && posts.length === 0;

  const emptyMessage = useMemo(() => {
    if (!accessToken?.trim()) return 'Sign in to see posts you’ve saved.';
    if (error) return error.message;
    return 'No saved posts yet. Tap the bookmark on a post to save it here.';
  }, [accessToken, error]);

  return (
    <View style={styles.root}>
      {loading && posts.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : error && posts.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error.message}</Text>
          <Pressable style={styles.retryBtn} onPress={refresh} accessibilityRole="button">
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 16) },
            posts.length === 0 && styles.listContentEmpty,
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={colors.brand}
              colors={[colors.brand]}
              {...(Platform.OS === 'android'
                ? { progressBackgroundColor: colors.surface }
                : {})}
            />
          }
          onEndReached={() => {
            if (hasMore) void loadMore();
          }}
          onEndReachedThreshold={0.35}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator style={styles.footerSpinner} color={colors.brand} />
            ) : null
          }
          ListEmptyComponent={
            listEmpty ? <Text style={styles.empty}>{emptyMessage}</Text> : null
          }
        />
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.surfaceSubtle,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.screenPaddingH,
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
    listContent: {
      paddingHorizontal: theme.spacing.screenPaddingH,
      paddingTop: 12,
    },
    listContentEmpty: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    separator: {
      height: 12,
    },
    footerSpinner: {
      paddingVertical: 16,
    },
    empty: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.md,
      color: colors.textMuted,
      textAlign: 'center',
      paddingHorizontal: 24,
    },
  });
}
