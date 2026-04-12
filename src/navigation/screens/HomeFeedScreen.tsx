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
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  clearSession,
  examCatalogApi,
  normalizeTokenUserProfile,
  useFollowList,
  useHomeFeed,
  useSession,
  useUserInterests,
  type Exam,
} from '../../api';
import { resolveLevelBadgeFromUser } from '../../badge/progressionDisplay';
import { PostCard } from '../../features/posts/components/PostCard';
import { ThemeAppearanceToggle } from '../../presentation/theme/ThemeAppearanceToggle';
import { theme } from '../../presentation/theme/theme';
import {
  type ThemeColors,
  useThemeColors,
  useThemePreference,
} from '../../presentation/theme/ThemeContext';
import type { PostResponse } from '../../api/post/types';
import { BrandLogo, BRAND_LOGO_ASPECT } from '../../shared/components/BrandLogo';
import { LevelBadge } from '../../shared/components/LevelBadge';
import { consumeHomeFeedRefreshPending } from '../../shared/homeFeedSync';
import { PostFeedSkeleton } from '../../shared/components/skeleton';
import { SuggestedForYouSection } from '../../shared/components/SuggestedForYouSection';
import { resetToRoute } from '../navigationRef';
import type { RootStackParamList } from '../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type HomeFeedFilter = 'all' | 'following' | 'topic';

const FEED_CHIPS: { id: HomeFeedFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'following', label: 'Following' },
  /** Posts whose `exam_id` is in `exam_ids` or in categories from `exam_category_ids`. */
  { id: 'topic', label: 'Topic' },
];

/** Extra space between the floating search/chips header and the first post. */
const FEED_BELOW_HEADER_GAP = 12;

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
  const query = '';
  const searchFocused = false;
  const [searchHintIndex, setSearchHintIndex] = useState(0);
  const searchHintOpacity = useRef(new Animated.Value(1)).current;
  const searchHintTranslateY = useRef(new Animated.Value(0)).current;
  const skipSearchHintFadeInRef = useRef(true);
  const [feedFilter, setFeedFilter] = useState<HomeFeedFilter>('all');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const logoutInFlightRef = useRef(false);
  const [drawerFollowingOpen, setDrawerFollowingOpen] = useState(true);
  const [drawerResourcesOpen, setDrawerResourcesOpen] = useState(true);

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

  const uniqueExamIds = useMemo(
    () => [...new Set(examIdsForFilter)].sort((a, b) => a - b),
    [examIdsForFilter],
  );

  const [followedExamMeta, setFollowedExamMeta] = useState<Map<number, Exam>>(new Map());

  useEffect(() => {
    if (uniqueExamIds.length === 0) {
      setFollowedExamMeta(new Map());
      return;
    }
    let cancelled = false;
    void (async () => {
      const pairs = await Promise.all(
        uniqueExamIds.map(async (id) => {
          try {
            const e = await examCatalogApi.getExam(id);
            return [id, e] as const;
          } catch {
            return [id, null] as const;
          }
        }),
      );
      if (cancelled) return;
      const next = new Map<number, Exam>();
      for (const [id, e] of pairs) {
        if (e) next.set(id, e);
      }
      setFollowedExamMeta(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [uniqueExamIds]);

  const followingExamsList = useMemo(() => {
    const rows = uniqueExamIds.map((id) => ({
      id,
      name: followedExamMeta.get(id)?.name?.trim() ?? `Exam ${id}`,
    }));
    rows.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    return rows;
  }, [uniqueExamIds, followedExamMeta]);

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

  useFocusEffect(
    useCallback(() => {
      if (consumeHomeFeedRefreshPending()) {
        void refresh();
      }
    }, [refresh]),
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

  const goTrending = useCallback(() => {
    closeDrawer(() => navigation.navigate('Trending'));
  }, [closeDrawer, navigation]);

  const goJobNotifications = useCallback(() => {
    closeDrawer(() => navigation.navigate('JobNotifications'));
  }, [closeDrawer, navigation]);

  const goMatchingJobs = useCallback(() => {
    closeDrawer(() => navigation.navigate('MatchingJobs'));
  }, [closeDrawer, navigation]);

  const goLegalInfo = useCallback(
    (kind: 'news' | 'privacy' | 'rules' | 'agreement') => {
      closeDrawer(() => navigation.navigate('LegalInfo', { kind }));
    },
    [closeDrawer, navigation],
  );

  const goExamDetail = useCallback(
    (examId: number) => {
      closeDrawer(() => navigation.navigate('ExamDetail', { examId }));
    },
    [closeDrawer, navigation],
  );

  const handleLogout = useCallback(async () => {
    if (logoutInFlightRef.current) return;
    logoutInFlightRef.current = true;
    setIsLoggingOut(true);
    try {
      closeDrawer();
      await clearSession();
      resetToRoute('Auth');
    } finally {
      logoutInFlightRef.current = false;
      setIsLoggingOut(false);
    }
  }, [closeDrawer]);

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
              <MaterialCommunityIcons name="close" size={26} color={colors.textPrimary} />
            </Pressable>
          </View>
          <View style={styles.drawerBody}>
            <ScrollView
              style={styles.drawerScroll}
              contentContainerStyle={styles.drawerScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.drawerPrimarySection}>
                <Pressable
                  style={({ pressed }) => [styles.drawerItem, pressed && styles.drawerItemPressed]}
                  onPress={goProfile}
                  accessibilityRole="button"
                  accessibilityLabel="Profile"
                >
                  <MaterialCommunityIcons name="account-circle-outline" size={22} color={colors.textPrimary} />
                  <Text style={styles.drawerItemLabel}>Profile</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.drawerItem, pressed && styles.drawerItemPressed]}
                  onPress={goTrending}
                  accessibilityRole="button"
                  accessibilityLabel="Trending"
                >
                  <MaterialCommunityIcons name="trending-up" size={22} color={colors.textPrimary} />
                  <Text style={styles.drawerItemLabel}>Trending</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.drawerItem, pressed && styles.drawerItemPressed]}
                  onPress={() => goLegalInfo('news')}
                  accessibilityRole="button"
                  accessibilityLabel="News"
                >
                  <MaterialCommunityIcons name="newspaper-variant-outline" size={22} color={colors.textPrimary} />
                  <Text style={styles.drawerItemLabel}>News</Text>
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
                <Pressable
                  style={({ pressed }) => [styles.drawerItem, pressed && styles.drawerItemPressed]}
                  onPress={goJobNotifications}
                  accessibilityRole="button"
                  accessibilityLabel="Job notifications"
                >
                  <MaterialCommunityIcons name="bell-ring-outline" size={22} color={colors.textPrimary} />
                  <Text style={styles.drawerItemLabel}>Job notifications</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.drawerItem, pressed && styles.drawerItemPressed]}
                  onPress={goMatchingJobs}
                  accessibilityRole="button"
                  accessibilityLabel="Matching jobs"
                >
                  <MaterialCommunityIcons name="briefcase-outline" size={22} color={colors.textPrimary} />
                  <Text style={styles.drawerItemLabel}>Matching jobs</Text>
                </Pressable>
              </View>

              <View style={styles.drawerSectionBlock}>
                <Pressable
                  style={({ pressed }) => [
                    styles.drawerCollapsibleHeader,
                    pressed && styles.drawerCollapsibleHeaderPressed,
                  ]}
                  onPress={() => setDrawerFollowingOpen((o) => !o)}
                  accessibilityRole="button"
                  accessibilityLabel="Following exams"
                  accessibilityState={{ expanded: drawerFollowingOpen }}
                >
                  <Text style={styles.drawerSectionTitle}>Following exams</Text>
                  <MaterialCommunityIcons
                    name={drawerFollowingOpen ? 'chevron-down' : 'chevron-right'}
                    size={22}
                    color={colors.textMuted}
                  />
                </Pressable>
                {drawerFollowingOpen ? (
                  <View style={styles.drawerCollapsibleBody}>
                    {!currentUserId ? (
                      <Text style={styles.drawerHint}>Sign in to see exams you follow.</Text>
                    ) : interestsLoading && uniqueExamIds.length === 0 ? (
                      <View style={styles.drawerInlineLoading}>
                        <ActivityIndicator size="small" color={colors.brand} />
                        <Text style={styles.drawerHint}>Loading your exams…</Text>
                      </View>
                    ) : interestsError ? (
                      <Text style={styles.drawerErrorHint}>{interestsError.message}</Text>
                    ) : followingExamsList.length === 0 ? (
                      <Text style={styles.drawerHint}>
                        No exams followed yet. Add them from your profile or onboarding.
                      </Text>
                    ) : (
                      followingExamsList.map(({ id, name }) => (
                        <Pressable
                          key={id}
                          style={({ pressed }) => [
                            styles.drawerExamRow,
                            pressed && styles.drawerExamRowPressed,
                          ]}
                          onPress={() => goExamDetail(id)}
                          accessibilityRole="button"
                          accessibilityLabel={`Open exam ${name}`}
                        >
                          <View style={styles.drawerExamAvatar}>
                            <MaterialCommunityIcons name="bookmark" size={18} color={colors.progress} />
                          </View>
                          <Text style={styles.drawerExamRowLabel} numberOfLines={2}>
                            {name}
                          </Text>
                          <MaterialCommunityIcons name="star-outline" size={22} color={colors.textHint} />
                        </Pressable>
                      ))
                    )}
                  </View>
                ) : null}
              </View>

              <View style={styles.drawerSectionBlock}>
                <Pressable
                  style={({ pressed }) => [
                    styles.drawerCollapsibleHeader,
                    pressed && styles.drawerCollapsibleHeaderPressed,
                  ]}
                  onPress={() => setDrawerResourcesOpen((o) => !o)}
                  accessibilityRole="button"
                  accessibilityLabel="Resources"
                  accessibilityState={{ expanded: drawerResourcesOpen }}
                >
                  <Text style={styles.drawerSectionTitle}>Resources</Text>
                  <MaterialCommunityIcons
                    name={drawerResourcesOpen ? 'chevron-down' : 'chevron-right'}
                    size={22}
                    color={colors.textMuted}
                  />
                </Pressable>
                {drawerResourcesOpen ? (
                  <View style={styles.drawerCollapsibleBody}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.drawerItem,
                        styles.drawerResourceItem,
                        pressed && styles.drawerItemPressed,
                      ]}
                      onPress={() => goLegalInfo('privacy')}
                      accessibilityRole="button"
                      accessibilityLabel="Privacy policy"
                    >
                      <MaterialCommunityIcons name="shield-lock-outline" size={22} color={colors.textPrimary} />
                      <View style={styles.drawerItemTextCol}>
                        <Text style={styles.drawerItemLabel}>Privacy Policy</Text>
                        <Text style={styles.drawerItemSub}>How we use your data</Text>
                      </View>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        styles.drawerItem,
                        styles.drawerResourceItem,
                        pressed && styles.drawerItemPressed,
                      ]}
                      onPress={() => goLegalInfo('rules')}
                      accessibilityRole="button"
                      accessibilityLabel="Community rules"
                    >
                      <MaterialCommunityIcons name="gavel" size={22} color={colors.textPrimary} />
                      <View style={styles.drawerItemTextCol}>
                        <Text style={styles.drawerItemLabel}>Rules</Text>
                        <Text style={styles.drawerItemSub}>Community guidelines</Text>
                      </View>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        styles.drawerItem,
                        styles.drawerResourceItem,
                        pressed && styles.drawerItemPressed,
                      ]}
                      onPress={() => goLegalInfo('agreement')}
                      accessibilityRole="button"
                      accessibilityLabel="User agreement"
                    >
                      <MaterialCommunityIcons name="file-document-outline" size={22} color={colors.textPrimary} />
                      <View style={styles.drawerItemTextCol}>
                        <Text style={styles.drawerItemLabel}>User Agreement</Text>
                        <Text style={styles.drawerItemSub}>Terms of use</Text>
                      </View>
                    </Pressable>
                    <ThemeAppearanceToggle style={styles.drawerThemeInResources} />
                  </View>
                ) : null}
              </View>

              {user ? (
                <View style={styles.drawerLogoutSection}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.drawerLogoutButton,
                      pressed && !isLoggingOut && styles.drawerLogoutButtonPressed,
                      isLoggingOut && styles.drawerLogoutButtonDisabled,
                    ]}
                    onPress={() => void handleLogout()}
                    disabled={isLoggingOut}
                    accessibilityRole="button"
                    accessibilityLabel="Log out"
                    android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
                  >
                    {isLoggingOut ? (
                      <ActivityIndicator size="small" color={colors.danger} />
                    ) : (
                      <Text style={styles.drawerLogoutButtonText}>Log out</Text>
                    )}
                  </Pressable>
                </View>
              ) : null}
            </ScrollView>
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
          <Pressable
            style={styles.searchRow}
            onPress={() => navigation.navigate('GlobalSearch')}
            accessibilityRole="button"
            accessibilityLabel="Open search"
          >
            <MaterialCommunityIcons
              name="magnify"
              size={22}
              color={colors.textMuted}
              style={styles.searchIcon}
            />
            <View style={styles.searchInputWrap}>
              <View style={styles.searchHintOverlay}>
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
            </View>
          </Pressable>
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
        <ScrollView
          style={styles.list}
          contentContainerStyle={[
            styles.listContent,
            { paddingTop: headerH + FEED_BELOW_HEADER_GAP },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <PostFeedSkeleton count={5} />
        </ScrollView>
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
          contentContainerStyle={[
            styles.listContent,
            { paddingTop: headerH + FEED_BELOW_HEADER_GAP },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={colors.brand}
              colors={[colors.brand]}
              /** Keep spinner below the absolute header (otherwise hidden behind search/chips). */
              progressViewOffset={headerH + FEED_BELOW_HEADER_GAP}
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
          ListHeaderComponent={<SuggestedForYouSection />}
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
      borderWidth: 1,
      borderColor: colors.inputBorder,
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
      paddingHorizontal: 12,
      paddingBottom: 28,
    },
    postSeparator: {
      height: 10,
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
      marginBottom: 12,
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
    drawerBody: {
      flex: 1,
      minHeight: 0,
      marginTop: 4,
      flexDirection: 'column',
    },
    drawerScroll: {
      flex: 1,
      minHeight: 0,
    },
    drawerScrollContent: {
      flexGrow: 1,
      paddingBottom: 24,
    },
    drawerPrimarySection: {
      alignSelf: 'stretch',
      paddingTop: 4,
    },
    drawerSectionBlock: {
      alignSelf: 'stretch',
      marginTop: 4,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderSubtle,
    },
    drawerCollapsibleHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
      paddingHorizontal: 4,
      borderRadius: 8,
    },
    drawerCollapsibleHeaderPressed: {
      backgroundColor: colors.surfaceSubtle,
    },
    drawerSectionTitle: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.md,
      color: colors.textPrimary,
    },
    drawerCollapsibleBody: {
      alignSelf: 'stretch',
      paddingBottom: 4,
    },
    drawerHint: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.textMuted,
      lineHeight: 20,
      paddingHorizontal: 4,
      paddingVertical: 6,
    },
    drawerErrorHint: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.danger,
      lineHeight: 20,
      paddingHorizontal: 4,
      paddingVertical: 6,
    },
    drawerInlineLoading: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 4,
      paddingVertical: 8,
    },
    drawerExamRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: 4,
      borderRadius: 12,
    },
    drawerExamRowPressed: {
      backgroundColor: colors.surfaceSubtle,
    },
    drawerExamAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.progressLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    drawerExamRowLabel: {
      flex: 1,
      minWidth: 0,
      fontFamily: theme.typography.medium,
      fontSize: theme.fintSizes.sm,
      color: colors.textPrimary,
      lineHeight: 20,
    },
    drawerItemTextCol: {
      flex: 1,
      minWidth: 0,
    },
    drawerItemSub: {
      marginTop: 2,
      fontFamily: theme.typography.regular,
      fontSize: theme.fontSizes.meta,
      color: colors.textMuted,
      lineHeight: 16,
    },
    drawerBrandLogo: {
      height: 64,
      aspectRatio: BRAND_LOGO_ASPECT,
      flexShrink: 0,
      borderRadius: theme.radius.card,
    },
    drawerClosePressed: {
      opacity: 0.65,
    },
    drawerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 4,
      borderRadius: 12,
    },
    drawerItemPressed: {
      backgroundColor: colors.surfaceSubtle,
    },
    drawerResourceItem: {
      alignItems: 'flex-start',
    },
    drawerItemLabel: {
      fontFamily: theme.typography.medium,
      fontSize: theme.fintSizes.md,
      color: colors.textPrimary,
    },
    drawerThemeInResources: {
      marginTop: 8,
      alignSelf: 'stretch',
    },
    drawerLogoutSection: {
      alignSelf: 'stretch',
      paddingTop: 16,
      marginTop: 4,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderSubtle,
    },
    drawerLogoutButton: {
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'stretch',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surface,
      minHeight: 48,
    },
    drawerLogoutButtonPressed: {
      opacity: 0.88,
    },
    drawerLogoutButtonDisabled: {
      opacity: 0.6,
    },
    drawerLogoutButtonText: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.md,
      color: colors.danger,
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
