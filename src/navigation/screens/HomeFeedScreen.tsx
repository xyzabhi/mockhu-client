import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
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
import { resolveLevelBadgeFromUser } from '../../badge/progressionDisplay';
import { PostCard } from '../../features/posts/components/PostCard';
import { theme } from '../../presentation/theme/theme';
import {
  type ThemeColors,
  useThemeColors,
  useThemePreference,
} from '../../presentation/theme/ThemeContext';
import type { PostResponse } from '../../api/post/types';
import { BrandLogo } from '../../shared/components/BrandLogo';
import { LevelBadge } from '../../shared/components/LevelBadge';
import { UserAvatar } from '../../shared/components/UserAvatar';
import type { RootStackParamList } from '../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type HomeFeedFilter = 'all' | 'following' | 'topic';

const FEED_CHIPS: { id: HomeFeedFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'following', label: 'Following' },
  /** Posts whose `exam_id` is in `exam_ids` or in categories from `exam_category_ids`. */
  { id: 'topic', label: 'Topic' },
];

/** Rotating hint after “Search ” in the home search bar (fade animation). */
const SEARCH_PLACEHOLDER_WORDS = [
  'people',
  'aspirants',
  'mentors',
  'teachers',
  'notes',
  'jobs',
  'room',
  'school',
  'college',
  'test',
] as const;

export function HomeFeedScreen() {
  const colors = useThemeColors();
  const { effectiveScheme } = useThemePreference();
  const styles = useMemo(() => createHomeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerSlideX = useRef(new Animated.Value(0)).current;

  const closeDrawer = useCallback(
    (afterClose?: () => void) => {
      const w = windowWidth || Dimensions.get('window').width;
      Animated.timing(drawerSlideX, {
        toValue: w,
        duration: 260,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setDrawerOpen(false);
          afterClose?.();
        }
      });
    },
    [drawerSlideX, windowWidth],
  );

  useLayoutEffect(() => {
    if (!drawerOpen) return;
    const w = windowWidth || Dimensions.get('window').width;
    drawerSlideX.setValue(w);
    Animated.timing(drawerSlideX, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [drawerOpen, drawerSlideX, windowWidth]);
  /** 0 = header fully visible, H = fully hidden — driven by scroll *delta*, not scroll position. */
  const headerOffsetRef = useRef(0);
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const headerHeightRef = useRef(0);
  const lastScrollY = useRef<number | null>(null);
  const [headerH, setHeaderH] = useState(0);
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchHintIndex, setSearchHintIndex] = useState(0);
  const searchHintOpacity = useRef(new Animated.Value(1)).current;
  const searchHintTranslateY = useRef(new Animated.Value(0)).current;
  const skipSearchHintFadeInRef = useRef(true);
  const [feedFilter, setFeedFilter] = useState<HomeFeedFilter>('all');

  const showAnimatedSearchHint = query.length === 0 && !searchFocused;

  useEffect(() => {
    if (!showAnimatedSearchHint) {
      searchHintOpacity.setValue(1);
      searchHintTranslateY.setValue(0);
      return;
    }
    const id = setInterval(() => {
      Animated.parallel([
        Animated.timing(searchHintOpacity, {
          toValue: 0,
          duration: 240,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(searchHintTranslateY, {
          toValue: -10,
          duration: 240,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (!finished) return;
        setSearchHintIndex((i) => (i + 1) % SEARCH_PLACEHOLDER_WORDS.length);
      });
    }, 3000);
    return () => clearInterval(id);
  }, [showAnimatedSearchHint, searchHintOpacity, searchHintTranslateY]);

  useLayoutEffect(() => {
    if (!showAnimatedSearchHint) return;
    if (skipSearchHintFadeInRef.current) {
      skipSearchHintFadeInRef.current = false;
      return;
    }
    searchHintTranslateY.setValue(14);
    searchHintOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(searchHintOpacity, {
        toValue: 1,
        duration: 340,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(searchHintTranslateY, {
        toValue: 0,
        duration: 340,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [searchHintIndex, showAnimatedSearchHint, searchHintOpacity, searchHintTranslateY]);
  const { user } = useSession();
  const profile = user ? normalizeTokenUserProfile(user) : null;
  const currentUserId = profile?.id?.trim();
  const headerLevelBadge = useMemo(
    () => (user ? resolveLevelBadgeFromUser(user) : null),
    [user],
  );

  const { users: followingUsers, refresh: refreshFollowingList } = useFollowList({
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
        followingIds={followingIds}
        onFollowListChanged={refreshFollowingList}
        onDeleted={removePost}
        onPostUpdated={updatePost}
      />
    ),
    [currentUserId, followingIds, refreshFollowingList, removePost, updatePost],
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

  const goProfile = useCallback(() => {
    closeDrawer(() => navigation.navigate('Main', { screen: 'Profile' }));
  }, [closeDrawer, navigation]);

  const goExams = useCallback(() => {
    closeDrawer(() => navigation.navigate('ExamCategories'));
  }, [closeDrawer, navigation]);

  const goSuggested = useCallback(() => {
    closeDrawer(() => navigation.navigate('SuggestedUsers'));
  }, [closeDrawer, navigation]);

  const firstName = profile?.first_name?.trim() ?? '';
  const usernameDrawer = profile?.username?.trim() ?? '';
  const drawerDisplayName = firstName || 'You';
  return (
    <View style={styles.root}>
      <Modal
        visible={drawerOpen}
        transparent
        animationType="none"
        onRequestClose={() => closeDrawer()}
        statusBarTranslucent
      >
        <Animated.View
          style={[
            styles.drawerFullScreen,
            {
              paddingTop: insets.top + 12,
              paddingBottom: insets.bottom + 16,
              paddingLeft: Math.max(insets.left, theme.spacing.screenPaddingH),
              paddingRight: Math.max(insets.right, theme.spacing.screenPaddingH),
              transform: [{ translateX: drawerSlideX }],
            },
          ]}
        >
          <View style={styles.drawerPanelHeader}>
            <View style={styles.drawerHeaderSpacer} />
            <View style={styles.drawerHeaderLogoWrap}>
              <BrandLogo style={styles.drawerBrandLogo} />
            </View>
            <Pressable
              onPress={() => closeDrawer()}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close menu"
              style={({ pressed }) => [styles.drawerHeaderClose, pressed && styles.drawerClosePressed]}
            >
              <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
            </Pressable>
          </View>
          <Pressable
            style={({ pressed }) => [styles.drawerUserRow, pressed && styles.drawerUserRowPressed]}
            onPress={goProfile}
            accessibilityRole="button"
            accessibilityLabel="Open profile"
          >
            <UserAvatar
              seed={(currentUserId ?? usernameDrawer) || 'me'}
              avatarUrl={profile?.avatar_url}
              size={48}
            />
            <View style={styles.drawerUserTextCol}>
              <Text style={styles.drawerUserName} numberOfLines={1}>
                {drawerDisplayName}
              </Text>
              {usernameDrawer ? (
                <Text style={styles.drawerUserMeta} numberOfLines={1}>
                  @{usernameDrawer}
                </Text>
              ) : null}
            </View>
          </Pressable>
          <View style={styles.drawerBody}>
            <View style={styles.drawerMenuList}>
              <Pressable
                style={({ pressed }) => [styles.drawerItem, pressed && styles.drawerItemPressed]}
                onPress={goProfile}
                accessibilityRole="button"
                accessibilityLabel="Open profile menu item"
              >
                <MaterialCommunityIcons name="account-circle-outline" size={22} color={colors.textPrimary} />
                <Text style={styles.drawerItemLabel}>Profile</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.drawerItem, pressed && styles.drawerItemPressed]}
                onPress={goExams}
                accessibilityRole="button"
                accessibilityLabel="Browse exams"
              >
                <MaterialCommunityIcons name="school-outline" size={22} color={colors.textPrimary} />
                <Text style={styles.drawerItemLabel}>Exams</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.drawerItem, pressed && styles.drawerItemPressed]}
                onPress={goSuggested}
                accessibilityRole="button"
                accessibilityLabel="Suggested people"
              >
                <MaterialCommunityIcons name="account-multiple-outline" size={22} color={colors.textPrimary} />
                <Text style={styles.drawerItemLabel}>Suggested for you</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </Modal>

      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.topZone,
          {
            paddingTop: insets.top,
            paddingLeft: Math.max(insets.left, theme.spacing.screenPaddingH),
            paddingRight: Math.max(insets.right, theme.spacing.screenPaddingH),
          },
          { transform: [{ translateY: headerTranslateY }] },
        ]}
        onLayout={onHeaderLayout}
      >
        <View style={styles.headerRow}>
          {/* <BrandLogo style={styles.brandLogo} /> */}
          <View style={styles.searchRow}>
            <MaterialCommunityIcons
              name="magnify"
              size={22}
              color={colors.textMuted}
              style={styles.searchIcon}
            />
            <View style={styles.searchInputWrap}>
              <TextInput
                style={styles.searchInput}
                placeholder=""
                placeholderTextColor={colors.textHint}
                value={query}
                onChangeText={setQuery}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                returnKeyType="search"
                clearButtonMode="while-editing"
                accessibilityLabel="Search feed"
                accessibilityHint="Search posts; hint cycles through topics when empty"
              />
              {showAnimatedSearchHint ? (
                <View pointerEvents="none" style={styles.searchHintOverlay}>
                  <View style={styles.searchHintRow}>
                    <Text style={styles.searchHintPrefix} numberOfLines={1}>
                      Search{' '}
                    </Text>
                    <Animated.Text
                      numberOfLines={1}
                      style={[
                        styles.searchHintWord,
                        {
                          opacity: searchHintOpacity,
                          transform: [{ translateY: searchHintTranslateY }],
                        },
                      ]}
                    >
                      {SEARCH_PLACEHOLDER_WORDS[searchHintIndex]}
                    </Animated.Text>
                  </View>
                </View>
              ) : null}
            </View>
          </View>
          {headerLevelBadge && currentUserId ? (
            <LevelBadge
              compact
              level={headerLevelBadge.level}
              tier={headerLevelBadge.tierLabel}
              tierColorHint={profile?.tier_color_hint}
              style={styles.headerLevelBadge}
            />
          ) : null}
          <Pressable
            onPress={() => setDrawerOpen(true)}
            style={({ pressed }) => [styles.drawerIconBtn, pressed && styles.drawerIconBtnPressed]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Open menu"
          >
            <MaterialCommunityIcons name="menu" size={26} color={colors.textPrimary} />
          </Pressable>
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
              /** Keep spinner below the absolute header (otherwise hidden behind search/chips). */
              progressViewOffset={headerH}
              {...(Platform.OS === 'android'
                ? { progressBackgroundColor: colors.surface }
                : {})}
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
      width: 44,
      flexShrink: 0,
      borderRadius: theme.radius.card,
      overflow: 'hidden',
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
      overflow: 'visible',
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInputWrap: {
      flex: 1,
      minWidth: 0,
      minHeight: 44,
      justifyContent: 'center',
      overflow: 'visible',
    },
    searchInput: {
      flex: 1,
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.md,
      color: colors.textPrimary,
      paddingVertical: 10,
      paddingRight: 4,
    },
    searchHintOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      paddingVertical: 10,
    },
    searchHintRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexShrink: 1,
      minWidth: 0,
    },
    searchHintPrefix: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.md,
      color: colors.textHint,
      flexShrink: 0,
    },
    searchHintWord: {
      flexShrink: 1,
      minWidth: 0,
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.md,
      color: colors.brand,
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
      borderWidth: 1,
      borderColor: colors.buttonBorder,
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
      borderWidth: 1,
      borderColor: colors.buttonBorder,
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
    drawerFullScreen: {
      flex: 1,
      width: '100%',
      backgroundColor: colors.surface,
    },
    drawerPanelHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
    },
    drawerHeaderSpacer: {
      width: 44,
      height: 44,
    },
    drawerHeaderLogoWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    drawerHeaderClose: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    drawerUserRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 10,
      paddingHorizontal: 4,
      marginBottom: 8,
      borderRadius: 12,
    },
    drawerUserRowPressed: {
      backgroundColor: colors.surfaceSubtle,
    },
    drawerUserTextCol: {
      flex: 1,
      minWidth: 0,
    },
    drawerUserName: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.lg,
      color: colors.textPrimary,
    },
    drawerUserMeta: {
      marginTop: 2,
      fontFamily: theme.typography.regular,
      fontSize: theme.fontSizes.meta,
      color: colors.textMuted,
    },
    drawerBody: {
      flex: 1,
      minHeight: 0,
      marginTop: 8,
    },
    drawerMenuList: {
      paddingTop: 4,
    },
    drawerBrandLogo: {
      height: 64,
      width: 64,
      flexShrink: 0,
      borderRadius: theme.radius.card,
    },
    drawerClosePressed: {
      opacity: 0.65,
    },
    drawerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 14,
      paddingHorizontal: 4,
      borderRadius: 12,
    },
    drawerItemPressed: {
      backgroundColor: colors.surfaceSubtle,
    },
    drawerItemLabel: {
      fontFamily: theme.typography.medium,
      fontSize: theme.fintSizes.md,
      color: colors.textPrimary,
    },
    headerLevelBadge: {
      flexShrink: 0,
      marginRight: 2,
    },
    drawerIconBtn: {
      padding: 4,
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },
    drawerIconBtnPressed: {
      opacity: 0.72,
    },
  });
}
