import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { normalizeTokenUserProfile, useHomeFeed, useSession } from '../../api';
import { PostCard } from '../../features/posts/components/PostCard';
import { theme } from '../../presentation/theme/theme';
import type { PostResponse } from '../../api/post/types';

export function HomeFeedScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const { user } = useSession();
  const profile = user ? normalizeTokenUserProfile(user) : null;
  const currentUserId = profile?.id?.trim();

  const { posts, loading, refreshing, loadingMore, error, loadMore, refresh, hasMore, removePost } =
    useHomeFeed();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter(
      (p) =>
        p.content.toLowerCase().includes(q) ||
        (p.tags ?? []).some((t) => t.toLowerCase().includes(q)) ||
        p.post_type.toLowerCase().includes(q),
    );
  }, [posts, query]);

  const renderItem = useCallback(
    ({ item }: { item: PostResponse }) => (
      <PostCard post={item} currentUserId={currentUserId} onDeleted={removePost} />
    ),
    [currentUserId, removePost],
  );

  const listEmpty = !loading && filtered.length === 0;

  const renderSeparator = useCallback(
    () => <View style={styles.postSeparator} />,
    [],
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.searchRow}>
        <MaterialCommunityIcons
          name="magnify"
          size={22}
          color={theme.colors.textMuted}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search Mockhu"
          placeholderTextColor={theme.colors.textHint}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
          accessibilityLabel="Search feed"
        />
      </View>
      {loading && posts.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.brand} />
        </View>
      ) : error && posts.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error.message}</Text>
          <Pressable style={styles.retryBtn} onPress={refresh}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          style={styles.list}
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ItemSeparatorComponent={renderSeparator}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          onEndReached={() => {
            if (hasMore) void loadMore();
          }}
          onEndReachedThreshold={0.35}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator style={styles.footerSpinner} color={theme.colors.brand} />
            ) : null
          }
          ListEmptyComponent={
            listEmpty ? (
              <Text style={styles.empty}>
                {query.trim() ? 'No posts match your search.' : 'No posts yet. Share one from Post.'}
              </Text>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.surfaceSubtle,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.screenPaddingH,
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
    minHeight: 44,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.md,
    color: theme.colors.textPrimary,
    paddingVertical: 10,
  },
  sectionLabel: {
    marginHorizontal: theme.spacing.screenPaddingH,
    marginBottom: 10,
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fontSizes.sectionHead,
    color: theme.colors.textMuted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  /** Horizontal inset for the whole feed (matches search / section title). */
  list: {
    flex: 1,
    // marginHorizontal: 
  },
  listContent: {
    paddingBottom: 24,
  },
  postSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.footerLinkUnderline,
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
});
