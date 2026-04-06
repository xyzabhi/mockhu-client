import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, useMemo, useRef, useState } from 'react';
import type {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  normalizeTokenUserProfile,
  useFollowList,
  useHomeFeed,
  useSession,
  useUserInterests,
} from '../../api';
import { PostCard } from '../../features/posts/components/PostCard';
import { theme } from '../../presentation/theme/theme';
import {
  type ThemeColors,
  useThemeColors,
  useThemePreference,
} from '../../presentation/theme/ThemeContext';
import type { PostResponse } from '../../api/post/types';

export type HomeFeedFilter = 'all' | 'following' | 'topic';

const FEED_CHIPS: { id: HomeFeedFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'following', label: 'Following' },
  /** Posts whose `exam_id` is in `exam_ids` or in categories from `exam_category_ids`. */
  { id: 'topic', label: 'Topic' },
];

export function HomeFeedScreen() {
  const colors = useThemeColors();
  const { effectiveScheme } = useThemePreference();
  const styles = useMemo(() => createHomeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  /** 0 = header fully visible, H = fully hidden — driven by scroll *delta*, not scroll position. */
  const headerOffsetRef = useRef(0);
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const headerHeightRef = useRef(0);
  const lastScrollY = useRef<number | null>(null);
  const [headerH, setHeaderH] = useState(0);
  const [query, setQuery] = useState('');
  const [feedFilter, setFeedFilter] = useState<HomeFeedFilter>('all');
  const { user } = useSession();
  const profile = user ? normalizeTokenUserProfile(user) : null;
  const currentUserId = profile?.id?.trim();

  const { users: followingUsers } = useFollowList({
    userId: currentUserId,
    kind: 'following',
  });

  const followingIds = useMemo(
    () => new Set(followingUsers.map((u) => u.id)),
    [followingUsers],
  );

  const {
    interests,
    examIdsForFilter,
    loading: interestsLoading,
    error: interestsError,
  } = useUserInterests(currentUserId);

  const {
    posts,
    loading,
    refreshing,
    loadingMore,
    error,
    loadMore,
    refresh,
    hasMore,
    removePost,
    updatePost,
  } = useHomeFeed();

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      /** Avoid a bogus delta on next scroll after tab focus / remount. */
      lastScrollY.current = null;
      return () => setStatusBarStyle(effectiveScheme === 'dark' ? 'light' : 'dark');
    }, [effectiveScheme]),
  );

  const filtered = useMemo(() => {
    let list = posts;

    if (feedFilter === 'following') {
      if (!currentUserId) {
        list = [];
      } else {
        list = list.filter((p) => followingIds.has(p.user_id));
      }
    } else if (feedFilter === 'topic') {
      if (examIdsForFilter.length === 0) {
        list = [];
      } else {
        const examSet = new Set(examIdsForFilter);
        list = list.filter((p) => examSet.has(p.exam_id));
      }
    }

    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.content.toLowerCase().includes(q) ||
        (p.tags ?? []).some((t) => t.toLowerCase().includes(q)) ||
        p.post_type.toLowerCase().includes(q),
    );
  }, [posts, query, feedFilter, currentUserId, followingIds, examIdsForFilter]);

  const renderItem = useCallback(
    ({ item }: { item: PostResponse }) => (
      <PostCard
        post={item}
        currentUserId={currentUserId}
        onDeleted={removePost}
        onPostUpdated={updatePost}
      />
    ),
    [currentUserId, removePost, updatePost],
  );

  const listEmpty = !loading && filtered.length === 0;

  const emptyHint = useMemo(() => {
    if (query.trim()) return 'No posts match your search.';
    if (feedFilter === 'following' && !currentUserId) {
      return 'Sign in to see posts from people you follow.';
    }
    if (feedFilter === 'following') {
      return 'No posts from people you follow yet.';
    }
    if (feedFilter === 'topic') {
      if (!currentUserId) {
        return 'Sign in to filter by your exam interests.';
      }
      if (interestsLoading) return 'Loading your interests…';
      if (interestsError) return interestsError.message;
      if (
        !interests ||
        ((interests.exam_ids?.length ?? 0) === 0 &&
          (interests.exam_category_ids?.length ?? 0) === 0)
      ) {
        return 'Add exam interests in your profile to filter by topic.';
      }
      return 'No posts for your exam interests yet.';
    }
    return 'No posts yet. Share one from Post.';
  }, [query, feedFilter, currentUserId, interests, interestsLoading, interestsError]);

  const renderSeparator = useCallback(
    () => <View style={styles.postSeparator} />,
    [styles],
  );

  const onHeaderLayout = useCallback((e: LayoutChangeEvent) => {
    const next = e.nativeEvent.layout.height;
    headerHeightRef.current = next;
    setHeaderH((prev) => (Math.abs(prev - next) < 1 ? prev : next));
    if (headerOffsetRef.current > next) {
      headerOffsetRef.current = next;
      headerTranslateY.setValue(-next);
    }
  }, [headerTranslateY]);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = event.nativeEvent.contentOffset.y;
      const H = headerHeightRef.current;
      if (H <= 0) {
        lastScrollY.current = y;
        return;
      }
      if (lastScrollY.current === null) {
        lastScrollY.current = y;
        return;
      }

      /**
       * Near the top of the list, force the header fully visible. Otherwise
       * `headerOffset` can stay > 0 while scrollY is 0 — you keep paddingTop
       * but the bar stays translated up (empty band / “gap”).
       */
      if (y < 1) {
        lastScrollY.current = y;
        if (headerOffsetRef.current !== 0) {
          headerOffsetRef.current = 0;
          headerTranslateY.setValue(0);
        }
        return;
      }

      const delta = y - lastScrollY.current;
      lastScrollY.current = y;

      let next = headerOffsetRef.current + delta;
      if (next < 0) next = 0;
      if (next > H) next = H;
      if (next !== headerOffsetRef.current) {
        headerOffsetRef.current = next;
        headerTranslateY.setValue(-next);
      }
    },
    [headerTranslateY],
  );

  return (
    <View style={styles.root}>
      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.topZone,
          { paddingTop: insets.top },
          { transform: [{ translateY: headerTranslateY }] },
        ]}
        onLayout={onHeaderLayout}
      >
        <View style={styles.headerRow}>
          <Image
            source={require('../../../assets/mockhu_brand_logo.png')}
            style={styles.brandLogo}
            resizeMode="contain"
            accessibilityLabel="Mockhu"
          />
          <View style={styles.searchRow}>
            <MaterialCommunityIcons
              name="magnify"
              size={22}
              color={colors.textMuted}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Mockhu"
              placeholderTextColor={colors.textHint}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              clearButtonMode="while-editing"
              accessibilityLabel="Search feed"
            />
          </View>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
          contentContainerStyle={styles.chipScrollContent}
          accessibilityLabel="Feed filters"
        >
          {FEED_CHIPS.map((chip) => {
            const selected = feedFilter === chip.id;
            return (
              <Pressable
                key={chip.id}
                onPress={() => setFeedFilter(chip.id)}
                style={({ pressed }) => [
                  styles.chip,
                  selected && styles.chipSelected,
                  pressed && styles.chipPressed,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${chip.label} filter`}
              >
                <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{chip.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>
      {loading && posts.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.brand} />
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
          contentContainerStyle={[styles.listContent, { paddingTop: headerH }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={colors.brand}
              colors={[colors.brand]}
            />
          }
          scrollEventThrottle={16}
          onScroll={onScroll}
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
            listEmpty ? <Text style={styles.empty}>{emptyHint}</Text> : null
          }
        />
      )}
    </View>
  );
}

function createHomeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.surfaceSubtle,
    },
    topZone: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      elevation: 8,
      backgroundColor: colors.surface,
      paddingBottom: 12,
      paddingHorizontal: theme.spacing.screenPaddingH,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    brandLogo: {
      height: 44,
      width: 72,
      flexShrink: 0,
    },
    searchRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      minHeight: 44,
      borderRadius: theme.radius.pill,
      backgroundColor: colors.surfaceSubtle,
      borderWidth: theme.borderWidth.hairline,
      borderColor: colors.borderSubtle,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.md,
      color: colors.textPrimary,
      paddingVertical: 10,
    },
    chipScroll: {
      marginTop: 10,
      flexGrow: 0,
    },
    chipScrollContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingBottom: 2,
      gap: 8,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: theme.radius.pill,
      backgroundColor: colors.surfaceSubtle,
      borderWidth: theme.borderWidth.default,
      borderColor: colors.borderSubtle,
    },
    chipSelected: {
      backgroundColor: colors.brand,
      borderColor: colors.brand,
    },
    chipPressed: {
      opacity: 0.88,
    },
    chipLabel: {
      fontFamily: theme.typography.medium,
      fontSize: theme.fontSizes.filterChip,
      color: colors.textPrimary,
    },
    chipLabelSelected: {
      color: colors.onBrand,
    },
    sectionLabel: {
      marginHorizontal: theme.spacing.screenPaddingH,
      marginBottom: 10,
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fontSizes.sectionHead,
      color: colors.textMuted,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    list: {
      flex: 1,
    },
    listContent: {
      paddingBottom: 24,
    },
    postSeparator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.footerLinkUnderline,
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
    footerSpinner: {
      marginVertical: 16,
    },
    empty: {
      textAlign: 'center',
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.textMuted,
      paddingVertical: 32,
    },
  });
}
