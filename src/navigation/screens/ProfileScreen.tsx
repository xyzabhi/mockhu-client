import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  clearSession,
  examCatalogApi,
  hydrateSessionUserFromMe,
  normalizeTokenUserProfile,
  useBookmarkFeed,
  useFollowList,
  useSession,
  useUserInterests,
  useUserPostsFeed,
  useUserProfile,
  userApi,
} from '../../api';
import type { PostResponse } from '../../api/post/types';
import { PostCard } from '../../features/posts/components/PostCard';
import { resolveLevelBadgeFromUser } from '../../badge/progressionDisplay';
import { theme } from '../../presentation/theme/theme';
import { ThemeAppearanceToggle } from '../../presentation/theme/ThemeAppearanceToggle';
import { type ThemeColors, useThemeColors } from '../../presentation/theme/ThemeContext';
import { ProfileAvatarUploader } from '../../features/profile/components/ProfileAvatarUploader';
import { useMessageModal } from '../../shared/components/MessageModal';
import { PostFeedSkeleton, SkeletonBox, SkeletonGroup } from '../../shared/components/skeleton';
import type { MainTabParamList, RootStackParamList } from '../types';

type ProfileTabId = 'posts' | 'tracker' | 'battles' | 'saved' | 'about' | 'settings';

const PROFILE_TAB_BAR: { id: ProfileTabId; label: string }[] = [
  { id: 'posts', label: 'Posts' },
  { id: 'tracker', label: 'Tracker' },
  { id: 'battles', label: 'Battles' },
];

/** Fixed chip width from longest label (semiBold xs + horizontal padding), capped to screen. */
function estimateFixedExamChipWidth(labels: string[], windowWidth: number): number {
  if (labels.length === 0) return 160;
  const longest = labels.reduce((m, s) => Math.max(m, s.length), 0);
  const fontSize = theme.fintSizes.xs;
  const charEstimate = fontSize * 0.62;
  const horizontalPad = 12 * 2 + 4;
  const raw = Math.ceil(longest * charEstimate + horizontalPad);
  const cap = Math.min(340, Math.floor(windowWidth * 0.58));
  const floor = 120;
  return Math.min(Math.max(raw, floor), cap);
}

type ExamPrepChipRow = { id: number; name: string; year: number | null };

function formatExamYearTwoDigit(year: number): string {
  return String(Math.trunc(year) % 100).padStart(2, '0');
}

function formatExamChipLine(e: ExamPrepChipRow): string {
  if (e.year != null && Number.isFinite(e.year)) {
    return `${e.name} · ${formatExamYearTwoDigit(e.year)}`;
  }
  return e.name;
}

const EXAM_CHIP_ROTATE_MS = 3200;
const EXAM_CHIP_FADE_MS = 220;

type RotatingExamChipStyles = {
  chipPill: object;
  chipFrost: object;
  chipLightText: object;
  examChipRotatingText: object;
  examChipRotator: object;
};

function RotatingExamChip({ exams, styles }: { exams: ExamPrepChipRow[]; styles: RotatingExamChipStyles }) {
  const isFocused = useIsFocused();
  const { width: windowWidth } = useWindowDimensions();
  const opacity = useRef(new Animated.Value(1)).current;
  const [index, setIndex] = useState(0);
  const examsRef = useRef(exams);
  examsRef.current = exams;

  const fixedChipWidth = useMemo(
    () =>
      exams.length === 0 ? 0 : estimateFixedExamChipWidth(exams.map((e) => formatExamChipLine(e)), windowWidth),
    [exams, windowWidth],
  );

  useEffect(() => {
    setIndex(0);
    opacity.setValue(1);
  }, [exams, opacity]);

  useEffect(() => {
    if (exams.length < 2 || !isFocused) return undefined;

    const advance = () => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: EXAM_CHIP_FADE_MS,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return;
        const rows = examsRef.current;
        if (rows.length < 2) return;
        setIndex((prev) => (prev + 1) % rows.length);
        Animated.timing(opacity, {
          toValue: 1,
          duration: EXAM_CHIP_FADE_MS,
          useNativeDriver: true,
        }).start();
      });
    };

    const id = setInterval(advance, EXAM_CHIP_ROTATE_MS);
    return () => clearInterval(id);
  }, [exams.length, isFocused, opacity]);

  if (exams.length === 0) return null;

  const current = exams[index] ?? exams[0];
  if (!current) return null;

  const line = formatExamChipLine(current);

  return (
    <View
      style={styles.examChipRotator}
      accessibilityRole="summary"
      accessibilityLabel={`Exam prep: ${line}`}
    >
      <View
        style={[
          styles.chipPill,
          styles.chipFrost,
          fixedChipWidth > 0 && {
            width: fixedChipWidth,
            minWidth: fixedChipWidth,
            maxWidth: fixedChipWidth,
          },
        ]}
      >
        <Animated.Text
          style={[styles.chipLightText, styles.examChipRotatingText, { opacity }]}
          numberOfLines={2}
          accessibilityLiveRegion="polite"
        >
          {line}
        </Animated.Text>
      </View>
    </View>
  );
}

export function ProfileScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createProfileStyles(colors), [colors]);
  const { user, accessToken } = useSession();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const parentNav = navigation.getParent();
  const { modal, show: showModal, hide: hideModal } = useMessageModal();
  const [activeTab, setActiveTab] = useState<ProfileTabId>('posts');

  const goToMainTab = useCallback(
    (name: keyof MainTabParamList) => {
      parentNav?.navigate(name as never);
    },
    [parentNav],
  );

  const goLegalInfo = useCallback(
    (kind: RootStackParamList['LegalInfo']['kind']) => {
      navigation.navigate('LegalInfo', { kind });
    },
    [navigation],
  );

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        try {
          await hydrateSessionUserFromMe({ includeInterests: false });
        } catch {
          /* offline / 401 */
        }
        if (cancelled) return;
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const profile = user ? normalizeTokenUserProfile(user) : null;
  const userId = profile?.id?.trim();
  const {
    profile: publicProfile,
    loading: publicProfileLoading,
    refresh: refreshPublicProfile,
  } = useUserProfile(userId);
  const firstName = profile?.first_name?.trim() ?? '';
  const lastName = profile?.last_name?.trim() ?? '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  const username = profile?.username?.trim() ?? '';

  const currentUserId = userId;
  const { users: followingUsers, refresh: refreshFollowingList } = useFollowList({
    userId: currentUserId,
    kind: 'following',
  });
  const followingIds = useMemo(
    () => new Set(followingUsers.map((u) => u.id)),
    [followingUsers],
  );

  const {
    posts: savedPosts,
    loading: savedLoading,
    refreshing: savedRefreshing,
    loadingMore: savedLoadingMore,
    error: savedError,
    loadMore: loadMoreSaved,
    refresh: refreshSaved,
    hasMore: savedHasMore,
    updatePost: updateSavedPost,
  } = useBookmarkFeed(accessToken, activeTab === 'saved');

  const postsFeedActive = activeTab === 'posts';
  const {
    posts: myPosts,
    loading: myPostsLoading,
    refreshing: myPostsRefreshing,
    loadingMore: myPostsLoadingMore,
    error: myPostsError,
    loadMore: loadMoreMyPosts,
    refresh: refreshMyPosts,
    hasMore: myPostsHasMore,
    updatePost: updateMyPost,
    removePost: removeMyPost,
  } = useUserPostsFeed(accessToken, userId, postsFeedActive);

  const {
    interests: interestsPayload,
    examIdsDirect,
    loading: interestsLoading,
    error: interestsError,
    refetch: refetchInterests,
  } = useUserInterests(userId);

  /** Resolved exam names for each selected id (target year appended when set). */
  const [examPrepRows, setExamPrepRows] = useState<ExamPrepChipRow[]>([]);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!userId || examIdsDirect.length === 0) {
        setExamPrepRows([]);
        return;
      }
      try {
        const settled = await Promise.allSettled(examIdsDirect.map((id) => examCatalogApi.getExam(id)));
        if (cancelled) return;
        const rawYr = profile?.target_year;
        const year =
          rawYr != null && typeof rawYr === 'number' && Number.isFinite(rawYr) ? Math.round(rawYr) : null;
        const rows: { id: number; name: string; year: number | null; userCount: number }[] = [];
        settled.forEach((s, i) => {
          if (s.status !== 'fulfilled') return;
          const id = examIdsDirect[i];
          const name = s.value.name?.trim() || 'Exam';
          const userCount =
            typeof s.value.user_count === 'number' && Number.isFinite(s.value.user_count)
              ? s.value.user_count
              : 0;
          rows.push({
            id,
            userCount,
            name,
            year,
          });
        });
        rows.sort((a, b) => {
          if (b.userCount !== a.userCount) return b.userCount - a.userCount;
          return b.id - a.id;
        });
        setExamPrepRows(rows.map(({ id, name, year }) => ({ id, name, year })));
      } catch {
        if (!cancelled) setExamPrepRows([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, examIdsDirect, profile?.target_year]);

  const [isPrivate, setIsPrivate] = useState(profile?.is_private ?? false);
  const [privacyUpdating, setPrivacyUpdating] = useState(false);

  const togglePrivacy = useCallback(
    async (newValue: boolean) => {
      const prev = isPrivate;
      setIsPrivate(newValue);
      setPrivacyUpdating(true);
      try {
        const res = await userApi.setPrivacy(newValue);
        setIsPrivate(res.is_private);
      } catch {
        setIsPrivate(prev);
        showModal({ title: 'Error', message: 'Could not update privacy setting. Try again.' });
      } finally {
        setPrivacyUpdating(false);
      }
    },
    [isPrivate],
  );

  const confirmSignOut = useCallback(() => {
    showModal({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      buttons: [
        { label: 'Cancel', variant: 'secondary', onPress: hideModal },
        {
          label: 'Sign Out',
          variant: 'destructive',
          onPress: () => {
            hideModal();
            void clearSession();
          },
        },
      ],
    });
  }, [showModal, hideModal]);

  const levelBadge = profile ? resolveLevelBadgeFromUser(profile) : null;
  const hasLevelBadge = levelBadge != null;
  const specialBadges = profile?.special_badges ?? [];
  const xpDisplay = useMemo(() => {
    const lv = profile?.level;
    if (lv == null || !Number.isFinite(lv)) return null;
    return Math.round(lv * 124 + 100);
  }, [profile?.level]);

  const followersCount = publicProfile?.follower_count ?? 0;
  const followingCount = publicProfile?.following_count ?? 0;
  const postCount = publicProfile?.post_count ?? 0;
  const countsLoading = publicProfileLoading && !publicProfile;

  const openFollowList = useCallback(
    (kind: 'followers' | 'following') => {
      if (!userId) return;
      navigation.navigate('FollowList', { userId, kind });
    },
    [navigation, userId],
  );

  useFocusEffect(
    useCallback(() => {
      void refreshPublicProfile();
    }, [refreshPublicProfile]),
  );

  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      if (!parent) return undefined;
      const tabParent = parent as unknown as {
        addListener: (event: 'tabPress', cb: (e: { target?: string }) => void) => () => void;
      };
      return tabParent.addListener('tabPress', (e) => {
        if (e.target === route.key) {
          void refreshPublicProfile();
        }
      });
    }, [navigation, route.key, refreshPublicProfile]),
  );

  const renderSavedItem = useCallback(
    ({ item }: { item: PostResponse }) => (
      <PostCard
        post={item}
        currentUserId={currentUserId}
        followingIds={followingIds}
        onFollowListChanged={refreshFollowingList}
        onPostUpdated={updateSavedPost}
      />
    ),
    [currentUserId, followingIds, refreshFollowingList, updateSavedPost],
  );

  const renderMyPostItem = useCallback(
    ({ item }: { item: PostResponse }) => (
      <PostCard
        post={item}
        currentUserId={currentUserId}
        followingIds={followingIds}
        onFollowListChanged={refreshFollowingList}
        onPostUpdated={updateMyPost}
        onDeleted={removeMyPost}
      />
    ),
    [currentUserId, followingIds, refreshFollowingList, updateMyPost, removeMyPost],
  );

  const savedEmptyMessage = useMemo(() => {
    if (!accessToken?.trim()) return 'Sign in to see posts you’ve saved.';
    if (savedError) return savedError.message;
    return 'No saved posts yet. Bookmark a post to see it here.';
  }, [accessToken, savedError]);

  const renderSavedEmpty = useCallback(() => {
    if (savedLoading) {
      return <PostFeedSkeleton count={3} />;
    }
    if (savedError && savedPosts.length === 0) {
      return (
        <View style={styles.savedEmptyWrap}>
          <Text style={styles.placeholderText}>{savedError.message}</Text>
          <Pressable style={styles.placeholderBtn} onPress={refreshSaved} accessibilityRole="button">
            <Text style={styles.placeholderBtnText}>Retry</Text>
          </Pressable>
        </View>
      );
    }
    return (
      <View style={styles.savedEmptyWrap}>
        <View style={styles.emptyStateCard}>
          <View style={styles.emptyStateIconRing}>
            <MaterialCommunityIcons name="bookmark-outline" size={36} color={colors.brand} />
          </View>
          <Text style={styles.emptyStateTitle}>{savedEmptyMessage}</Text>
        </View>
      </View>
    );
  }, [colors.brand, refreshSaved, savedEmptyMessage, savedError, savedLoading, savedPosts.length, styles]);

  const myPostsEmptyMessage = useMemo(() => {
    if (!accessToken?.trim()) return 'Sign in to see your posts.';
    if (myPostsError) return myPostsError.message;
    return 'You haven’t posted anything yet. Open the Post tab to share.';
  }, [accessToken, myPostsError]);

  const renderMyPostsEmpty = useCallback(() => {
    if (myPostsLoading) {
      return <PostFeedSkeleton count={3} />;
    }
    if (myPostsError && myPosts.length === 0) {
      return (
        <View style={styles.savedEmptyWrap}>
          <Text style={styles.placeholderText}>{myPostsError.message}</Text>
          <Pressable style={styles.placeholderBtn} onPress={refreshMyPosts} accessibilityRole="button">
            <Text style={styles.placeholderBtnText}>Retry</Text>
          </Pressable>
        </View>
      );
    }
    return (
      <View style={styles.savedEmptyWrap}>
        <View style={styles.emptyStateCard}>
          <View style={styles.emptyStateIconRing}>
            <MaterialCommunityIcons name="post-outline" size={34} color={colors.brand} />
          </View>
          <Text style={styles.emptyStateTitle}>{myPostsEmptyMessage}</Text>
          <Text style={styles.emptyStateHint}>
            Use the purple + in the tab bar for a quick post, or open the full composer here.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, styles.emptyCtaBtn, pressed && styles.primaryBtnPressed]}
            onPress={() => goToMainTab('Post')}
            accessibilityRole="button"
            accessibilityLabel="Open Post tab"
          >
            <Text style={styles.primaryBtnText}>Open composer</Text>
          </Pressable>
        </View>
      </View>
    );
  }, [colors.brand, goToMainTab, myPosts.length, myPostsEmptyMessage, myPostsError, myPostsLoading, refreshMyPosts, styles]);

  const bottomPad = Math.max(insets.bottom, 12);

  return (
    <View style={styles.root}>
      <View style={styles.topSlot}>
        <View style={[styles.purpleHeader, { paddingTop: Math.max(insets.top, 12) }]}>
          <View style={styles.heroHeaderRow}>
            <ProfileAvatarUploader
              seed={userId ?? (username || 'profile')}
              avatarUrl={profile?.avatar_url}
              avatarUrls={profile?.avatar_urls}
              uploadEnabled
              displaySize={80}
            />
            <View style={styles.heroRowIdentity}>
              <Text style={styles.heroName} accessibilityRole="header" numberOfLines={2}>
                {fullName ? fullName : 'Profile'}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled
                style={styles.badgeChipScroll}
                contentContainerStyle={styles.badgeChipRow}
              >
                <RotatingExamChip exams={examPrepRows} styles={styles} />
                {hasLevelBadge && levelBadge ? (
                  <View style={styles.chipTier}>
                    <MaterialCommunityIcons name="star-four-points" size={14} color="#FBBF24" />
                    <Text style={styles.chipTierText}>{levelBadge.tierLabel}</Text>
                  </View>
                ) : null}
                {specialBadges.map((code) => (
                  <View key={code} style={[styles.chipPill, styles.chipFrost]}>
                    <Text style={styles.chipLightText} numberOfLines={1}>
                      {code.replace(/_/g, ' ')}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
            <Pressable
              style={({ pressed }) => [styles.editProfileIconBtn, styles.editProfileAlign, pressed && styles.heroPressDim]}
              onPress={() => navigation.navigate('EditProfile')}
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
              hitSlop={12}
            >
              <MaterialCommunityIcons name="pencil-outline" size={22} color={colors.onBrand} />
            </Pressable>
          </View>

          {userId ? (
            countsLoading ? (
              <SkeletonGroup style={styles.heroStatsRow}>
                {[0, 1, 2, 3].map((k) => (
                  <View key={k} style={styles.heroStatCell}>
                    <SkeletonBox width={32} height={16} radius={6} />
                    <SkeletonBox width={48} height={10} radius={4} />
                  </View>
                ))}
              </SkeletonGroup>
            ) : (
              <View style={styles.heroStatsRow} accessibilityRole="summary">
                <Pressable
                  style={({ pressed }) => [styles.heroStatCell, pressed && styles.heroPressDim]}
                  onPress={() => openFollowList('followers')}
                  accessibilityRole="button"
                >
                  <Text style={styles.heroStatValue}>{String(followersCount)}</Text>
                  <Text style={styles.heroStatLabel}>followers</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.heroStatCell, pressed && styles.heroPressDim]}
                  onPress={() => openFollowList('following')}
                  accessibilityRole="button"
                >
                  <Text style={styles.heroStatValue}>{String(followingCount)}</Text>
                  <Text style={styles.heroStatLabel}>following</Text>
                </Pressable>
                <View style={styles.heroStatCell}>
                  <Text style={styles.heroStatValue}>{String(postCount)}</Text>
                  <Text style={styles.heroStatLabel}>posts</Text>
                </View>
                <View
                  style={styles.heroStatCell}
                  accessibilityLabel={
                    xpDisplay != null
                      ? `Experience points ${xpDisplay.toLocaleString()}`
                      : 'Experience points not set'
                  }
                >
                  <View style={styles.heroXpValueRow}>
                    <MaterialCommunityIcons name="lightning-bolt" size={18} color={colors.onBrand} />
                    <Text style={styles.heroStatValue}>
                      {xpDisplay != null ? xpDisplay.toLocaleString() : '—'}
                    </Text>
                  </View>
                  <Text style={[styles.heroStatLabel, styles.heroStatLabelMetric]}>XP</Text>
                </View>
              </View>
            )
          ) : null}
        </View>

        <View style={styles.tabBarUnderlay} accessibilityRole="tablist">
          <View style={styles.tabBarRowUnderline}>
            {PROFILE_TAB_BAR.map((t) => {
              const selected = activeTab === t.id;
              return (
                <Pressable
                  key={t.id}
                  style={({ pressed }) => [styles.tabUnderlineItem, pressed && styles.heroPressDim]}
                  onPress={() => setActiveTab(t.id)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  accessibilityLabel={t.label}
                >
                  <Text
                    style={[
                      styles.tabUnderlineLabel,
                      selected ? styles.tabUnderlineLabelActive : styles.tabUnderlineLabelInactive,
                    ]}
                  >
                    {t.label}
                  </Text>
                  {selected ? <View style={styles.tabUnderlineBar} /> : <View style={styles.tabUnderlineSpacer} />}
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {/** Scrollable: active tab content only */}
      <View style={styles.bottomSlot}>
        {activeTab === 'saved' ? (
          <FlatList
            data={savedPosts}
            keyExtractor={(item) => item.id}
            renderItem={renderSavedItem}
            style={styles.savedList}
            contentContainerStyle={[
              styles.savedListContent,
              { paddingBottom: bottomPad },
              savedPosts.length === 0 && styles.savedListContentEmpty,
            ]}
            ListEmptyComponent={renderSavedEmpty}
            ItemSeparatorComponent={() => <View style={styles.savedSeparator} />}
            showsVerticalScrollIndicator={false}
            refreshControl={
              accessToken?.trim() ? (
                <RefreshControl
                  refreshing={savedRefreshing}
                  onRefresh={refreshSaved}
                  tintColor={colors.brand}
                  colors={[colors.brand]}
                  {...(Platform.OS === 'android'
                    ? { progressBackgroundColor: colors.surface }
                    : {})}
                />
              ) : undefined
            }
            onEndReached={() => {
              if (savedHasMore) void loadMoreSaved();
            }}
            onEndReachedThreshold={0.35}
            ListFooterComponent={
              savedLoadingMore ? (
                <ActivityIndicator style={styles.footerSpinner} color={colors.brand} />
              ) : null
            }
          />
        ) : activeTab === 'tracker' ? (
          <ScrollView
            style={styles.scrollTab}
            contentContainerStyle={[styles.secondaryTabContent, { paddingBottom: bottomPad }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.trackerCard}>
              <MaterialCommunityIcons name="chart-timeline-variant" size={44} color={colors.brand} />
              <Text style={styles.trackerTitle}>Your study tracker</Text>
              <Text style={styles.trackerBody}>
                View streaks, mocks, heatmaps, and topic progress on the Progress tab.
              </Text>
              <Pressable
                style={({ pressed }) => [styles.trackerCta, pressed && styles.heroPressDim]}
                onPress={() => goToMainTab('Progress')}
                accessibilityRole="button"
                accessibilityLabel="Open Progress tab"
              >
                <Text style={styles.trackerCtaText}>Open Progress</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onBrand} />
              </Pressable>
            </View>
          </ScrollView>
        ) : activeTab === 'battles' ? (
          <ScrollView
            style={styles.scrollTab}
            contentContainerStyle={[styles.secondaryTabContent, { paddingBottom: bottomPad }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.trackerCard}>
              <MaterialCommunityIcons name="sword-cross" size={44} color={colors.textMuted} />
              <Text style={styles.trackerTitle}>Battles</Text>
              <Text style={styles.trackerBody}>Challenge friends and climb the leaderboard. Coming soon.</Text>
            </View>
          </ScrollView>
        ) : activeTab === 'posts' ? (
          <FlatList
            data={myPosts}
            keyExtractor={(item) => item.id}
            renderItem={renderMyPostItem}
            style={styles.savedList}
            contentContainerStyle={[
              styles.savedListContent,
              { paddingBottom: bottomPad },
              myPosts.length === 0 && styles.savedListContentEmpty,
            ]}
            ListEmptyComponent={renderMyPostsEmpty}
            ItemSeparatorComponent={() => <View style={styles.savedSeparator} />}
            showsVerticalScrollIndicator={false}
            refreshControl={
              accessToken?.trim() ? (
                <RefreshControl
                  refreshing={myPostsRefreshing}
                  onRefresh={refreshMyPosts}
                  tintColor={colors.brand}
                  colors={[colors.brand]}
                  {...(Platform.OS === 'android'
                    ? { progressBackgroundColor: colors.surface }
                    : {})}
                />
              ) : undefined
            }
            onEndReached={() => {
              if (myPostsHasMore) void loadMoreMyPosts();
            }}
            onEndReachedThreshold={0.35}
            ListFooterComponent={
              myPostsLoadingMore ? (
                <ActivityIndicator style={styles.footerSpinner} color={colors.brand} />
              ) : null
            }
          />
        ) : activeTab === 'about' ? (
          <ScrollView
            style={styles.scrollTab}
            contentContainerStyle={[styles.aboutScrollContent, { paddingBottom: bottomPad }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.aboutCard}>
              {!userId ? (
                <Text style={styles.aboutSignInHint}>
                  Sign in to view your profile details. Interests load from your account on the server.
                </Text>
              ) : (
                <>
                  {interestsError ? (
                    <View style={styles.aboutBannerError}>
                      <Text style={styles.aboutBannerErrorText}>{interestsError.message}</Text>
                      <Pressable
                        style={styles.aboutBannerRetry}
                        onPress={refetchInterests}
                        accessibilityRole="button"
                        accessibilityLabel="Retry loading interests"
                      >
                        <Text style={styles.aboutBannerRetryText}>Retry</Text>
                      </Pressable>
                    </View>
                  ) : null}

                  <View style={styles.aboutRow}>
                    <Text style={styles.aboutRowLabel}>Bio</Text>
                    <Text style={[styles.aboutRowValue, !profile?.bio?.trim() && styles.aboutRowPlaceholder]}>
                      {profile?.bio?.trim() ? profile.bio.trim() : 'Not set'}
                    </Text>
                  </View>
                  <View style={styles.aboutRowDivider} />

                  <View style={styles.aboutRow}>
                    <Text style={styles.aboutRowLabel}>Username</Text>
                    <Text style={[styles.aboutRowValue, !username && styles.aboutRowPlaceholder]}>
                      {username ? `@${username}` : 'Not set'}
                    </Text>
                  </View>
                  <View style={styles.aboutRowDivider} />

                  <View style={styles.aboutRow}>
                    <Text style={styles.aboutRowLabel}>Grade</Text>
                    <Text style={[styles.aboutRowValue, !profile?.grade?.trim() && styles.aboutRowPlaceholder]}>
                      {profile?.grade?.trim() ? profile.grade.trim() : 'Not set'}
                    </Text>
                  </View>
                  <View style={styles.aboutRowDivider} />

                  <View style={styles.aboutRow}>
                    <Text style={styles.aboutRowLabel}>Gender</Text>
                    <Text style={[styles.aboutRowValue, !profile?.gender?.trim() && styles.aboutRowPlaceholder]}>
                      {profile?.gender?.trim() ? profile.gender.trim() : 'Not set'}
                    </Text>
                  </View>
                  <View style={styles.aboutRowDivider} />

                  <View style={styles.aboutRow}>
                    <Text style={styles.aboutRowLabel}>Date of birth</Text>
                    <Text style={[styles.aboutRowValue, !profile?.dob?.trim() && styles.aboutRowPlaceholder]}>
                      {profile?.dob?.trim() ? profile.dob.trim() : 'Not set'}
                    </Text>
                  </View>
                  <View style={styles.aboutRowDivider} />

                  <View style={[styles.aboutRow, styles.aboutRowLast]}>
                    <Text style={styles.aboutRowLabel}>Exams & categories</Text>
                    {interestsLoading ? (
                      <View style={styles.aboutInterestsLoading}>
                        <ActivityIndicator size="small" color={colors.brand} />
                        <Text style={styles.aboutRowMuted}>Loading interests…</Text>
                      </View>
                    ) : interestsPayload ? (
                      (interestsPayload.exam_ids?.length ?? 0) === 0 &&
                        (interestsPayload.exam_category_ids?.length ?? 0) === 0 ? (
                        <Text style={styles.aboutRowPlaceholder}>No exams or categories selected.</Text>
                      ) : (
                        <View style={styles.aboutChipRow}>
                          {(interestsPayload.exam_ids?.length ?? 0) > 0 ? (
                            <View style={styles.aboutChip}>
                              <Text style={styles.aboutChipText}>
                                {interestsPayload.exam_ids!.length} exam
                                {interestsPayload.exam_ids!.length === 1 ? '' : 's'}
                              </Text>
                            </View>
                          ) : null}
                          {(interestsPayload.exam_category_ids?.length ?? 0) > 0 ? (
                            <View style={styles.aboutChip}>
                              <Text style={styles.aboutChipText}>
                                {interestsPayload.exam_category_ids!.length}{' '}
                                {interestsPayload.exam_category_ids!.length === 1 ? 'category' : 'categories'}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      )
                    ) : (
                      <Text style={styles.aboutRowPlaceholder}>No interests on file.</Text>
                    )}
                  </View>

                </>
              )}
            </View>
          </ScrollView>
        ) : (
          <ScrollView
            style={styles.scrollTab}
            contentContainerStyle={[styles.aboutScrollContent, { paddingBottom: bottomPad }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.aboutCard}>
              <View style={styles.aboutRow}>
                <Text style={styles.aboutRowLabel}>Appearance</Text>
              </View>
              <View style={styles.resourceThemeToggle}>
                <ThemeAppearanceToggle />
              </View>

              <View style={styles.aboutRowDivider} />

              <View style={styles.aboutRow}>
                <View style={styles.privacyRow}>
                  <View style={styles.privacyRowText}>
                    <Text style={styles.aboutRowLabel}>Private account</Text>
                    <Text style={styles.privacyHint}>
                      Only followers can see your posts and details
                    </Text>
                  </View>
                  <Switch
                    value={isPrivate}
                    onValueChange={togglePrivacy}
                    disabled={privacyUpdating}
                    trackColor={{ false: colors.borderSubtle, true: colors.brand }}
                    thumbColor={colors.surface}
                    ios_backgroundColor={colors.borderSubtle}
                  />
                </View>
              </View>

              <View style={styles.aboutRowDivider} />

              <Pressable
                style={({ pressed }) => [styles.resourceRow, pressed && styles.resourceRowPressed]}
                onPress={() => goLegalInfo('privacy')}
                accessibilityRole="button"
              >
                <MaterialCommunityIcons name="shield-lock-outline" size={22} color={colors.textMuted} />
                <View style={styles.resourceRowText}>
                  <Text style={styles.resourceRowTitle}>Privacy Policy</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
              </Pressable>

              <View style={styles.aboutRowDivider} />

              <Pressable
                style={({ pressed }) => [styles.resourceRow, pressed && styles.resourceRowPressed]}
                onPress={() => goLegalInfo('rules')}
                accessibilityRole="button"
              >
                <MaterialCommunityIcons name="book-open-outline" size={22} color={colors.textMuted} />
                <View style={styles.resourceRowText}>
                  <Text style={styles.resourceRowTitle}>Community Rules</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
              </Pressable>

              <View style={styles.aboutRowDivider} />

              <Pressable
                style={({ pressed }) => [styles.resourceRow, pressed && styles.resourceRowPressed]}
                onPress={() => goLegalInfo('agreement')}
                accessibilityRole="button"
              >
                <MaterialCommunityIcons name="file-document-outline" size={22} color={colors.textMuted} />
                <View style={styles.resourceRowText}>
                  <Text style={styles.resourceRowTitle}>Terms of Service</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
              </Pressable>

              {accessToken?.trim() ? (
                <>
                  <View style={styles.aboutRowDivider} />
                  <Pressable
                    style={({ pressed }) => [styles.resourceRow, pressed && styles.resourceRowPressed]}
                    onPress={confirmSignOut}
                    accessibilityRole="button"
                  >
                    <MaterialCommunityIcons name="logout" size={22} color={colors.danger} />
                    <View style={styles.resourceRowText}>
                      <Text style={[styles.resourceRowTitle, { color: colors.danger }]}>Sign Out</Text>
                    </View>
                  </Pressable>
                </>
              ) : null}
            </View>
          </ScrollView>
        )}
      </View>
      {modal}
    </View>
  );
}

function createProfileStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.surfaceSubtle,
    },
    topSlot: {
      flexShrink: 0,
      zIndex: 2,
      backgroundColor: colors.surface,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        },
        android: {
          elevation: 6,
        },
        default: {},
      }),
    },
    purpleHeader: {
      backgroundColor: colors.brand,
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    /** Avatar | name + exams (flex) | Edit profile */
    heroHeaderRow: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    heroRowIdentity: {
      flex: 1,
      minWidth: 0,
      alignItems: 'flex-start',
      gap: 5,
    },
    /** Keeps horizontal ScrollView from stretching to sibling height on iOS. */
    badgeChipScroll: {
      flexGrow: 0,
      alignSelf: 'stretch',
    },
    editProfileAlign: {
      flexShrink: 0,
      alignSelf: 'flex-start',
    },
    heroPressDim: {
      opacity: 0.82,
    },
    editProfileIconBtn: {
      padding: 10,
      borderRadius: theme.radius.pill,
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.95)',
      backgroundColor: 'rgba(255,255,255,0.08)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroName: {
      alignSelf: 'stretch',
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.xxl,
      // lineHeight: 28,
      color: colors.onBrand,
      letterSpacing: -0.4,
      textAlign: 'left',
    },
    badgeChipRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'nowrap',
      gap: 8,
      paddingVertical: 2,
    },
    examChipRotator: {
      flexShrink: 0,
      alignSelf: 'flex-start',
    },
    examChipRotatingText: {
      width: '100%',
    },
    chipPill: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: theme.radius.pill,
      borderWidth: 1,
      maxWidth: 260,
    },
    chipFrost: {
      backgroundColor: 'rgba(255,255,255,0.18)',
      borderColor: 'rgba(255,255,255,0.45)',
    },
    chipLightText: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.xs,
      color: colors.onBrand,
    },
    chipTier: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: theme.radius.pill,
      backgroundColor: '#EA580C',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.35)',
    },
    chipTierText: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.xs,
      color: '#FFFBEB',
    },
    heroStatsRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginTop: 0,
      paddingTop: 14,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: 'rgba(255,255,255,0.22)',
    },
    heroStatCell: {
      flex: 1,
      minWidth: 0,
      alignItems: 'center',
      gap: 4,
      paddingVertical: 4,
    },
    heroXpValueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    heroStatValue: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.md,
      color: colors.onBrand,
      fontVariant: ['tabular-nums'],
    },
    heroStatLabel: {
      fontFamily: theme.typography.medium,
      fontSize: theme.fontSizes.meta,
      color: 'rgba(255,255,255,0.78)',
      textTransform: 'lowercase',
    },
    heroStatLabelMetric: {
      textTransform: 'none',
      letterSpacing: 0.4,
    },
    tabBarUnderlay: {
      backgroundColor: colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderSubtle,
    },
    tabBarRowUnderline: {
      flexDirection: 'row',
      alignItems: 'stretch',
      paddingHorizontal: 12,
    },
    tabUnderlineItem: {
      flex: 1,
      alignItems: 'center',
      paddingTop: 12,
      paddingBottom: 0,
    },
    tabUnderlineLabel: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.sm,
      paddingBottom: 10,
    },
    tabUnderlineLabelInactive: {
      color: colors.textPrimary,
      opacity: 0.55,
    },
    tabUnderlineLabelActive: {
      color: colors.brand,
      opacity: 1,
    },
    tabUnderlineBar: {
      width: '100%',
      height: 3,
      borderTopLeftRadius: 2,
      borderTopRightRadius: 2,
      backgroundColor: colors.brand,
    },
    tabUnderlineSpacer: {
      height: 3,
    },
    secondaryTabContent: {
      paddingHorizontal: theme.spacing.screenPaddingH,
      paddingTop: 16,
      flexGrow: 1,
    },
    trackerCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
      padding: 22,
      alignItems: 'center',
      gap: 10,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        android: { elevation: 2 },
        default: {},
      }),
    },
    trackerTitle: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.lg,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    trackerBody: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 22,
      maxWidth: 320,
    },
    trackerCta: {
      marginTop: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 12,
      paddingHorizontal: 18,
      borderRadius: theme.radius.pill,
      backgroundColor: colors.brandLight,
    },
    trackerCtaText: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.md,
      color: colors.brand,
    },
    bottomSlot: {
      flex: 1,
      minHeight: 0,
      zIndex: 1,
    },
    savedList: {
      flex: 1,
    },
    savedListContent: {
      paddingHorizontal: theme.spacing.screenPaddingH,
      paddingTop: 10,
    },
    savedListContentEmpty: {
      flexGrow: 1,
    },
    savedEmptyWrap: {
      flex: 1,
      minHeight: 200,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.screenPaddingH,
      paddingVertical: 28,
    },
    emptyStateCard: {
      width: '100%',
      maxWidth: 360,
      alignItems: 'center',
      paddingVertical: 28,
      paddingHorizontal: 22,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 10,
        },
        android: { elevation: 2 },
        default: {},
      }),
    },
    emptyStateIconRing: {
      width: 76,
      height: 76,
      borderRadius: 38,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.brandLight,
      marginBottom: 16,
    },
    emptyStateTitle: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.md,
      color: colors.textPrimary,
      textAlign: 'center',
      lineHeight: 22,
      letterSpacing: -0.2,
    },
    emptyStateHint: {
      marginTop: 10,
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.xs,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 18,
      opacity: 0.95,
    },
    scrollTab: {
      flex: 1,
    },
    emptyCtaBtn: {
      marginTop: 18,
      minWidth: 200,
    },
    primaryBtnPressed: {
      opacity: 0.88,
    },
    aboutScrollContent: {
      paddingTop: 8,
      paddingHorizontal: theme.spacing.screenPaddingH,
      flexGrow: 1,
    },
    aboutCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
      paddingHorizontal: 14,
      paddingVertical: 4,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        android: { elevation: 2 },
        default: {},
      }),
    },
    aboutSignInHint: {
      paddingVertical: 16,
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.textMuted,
      lineHeight: 22,
      textAlign: 'center',
    },
    aboutBannerError: {
      paddingVertical: 12,
      paddingHorizontal: 4,
      marginBottom: 4,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderSubtle,
    },
    aboutBannerErrorText: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.danger,
      lineHeight: 20,
      marginBottom: 8,
    },
    aboutBannerRetry: {
      alignSelf: 'flex-start',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: theme.radius.badge,
      backgroundColor: colors.brandLight,
    },
    aboutBannerRetryText: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.sm,
      color: colors.brand,
    },
    aboutRow: {
      paddingVertical: 14,
    },
    aboutRowLast: {
      paddingBottom: 12,
    },
    aboutRowLabel: {
      fontFamily: theme.typography.medium,
      fontSize: theme.fontSizes.meta,
      color: colors.textMuted,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      marginBottom: 6,
    },
    aboutRowValue: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.md,
      color: colors.textPrimary,
      lineHeight: 22,
    },
    aboutRowPlaceholder: {
      color: colors.textHint,
      fontStyle: 'italic',
    },
    aboutRowMuted: {
      marginLeft: 8,
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.textMuted,
    },
    aboutRowDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.borderSubtle,
    },
    privacyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    privacyRowText: {
      flex: 1,
      minWidth: 0,
    },
    privacyHint: {
      marginTop: 2,
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.xs,
      color: colors.textMuted,
      lineHeight: 18,
    },
    aboutInterestsLoading: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    aboutChipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 2,
    },
    aboutChip: {
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: theme.radius.badge,
      backgroundColor: colors.surfaceSubtle,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
    },
    aboutChipText: {
      fontFamily: theme.typography.medium,
      fontSize: theme.fintSizes.xs,
      color: colors.textPrimary,
    },
    resourceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 2,
    },
    resourceRowPressed: {
      opacity: 0.75,
    },
    resourceRowText: {
      flex: 1,
      minWidth: 0,
    },
    resourceRowTitle: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.md,
      color: colors.textPrimary,
    },
    resourceRowSubtitle: {
      marginTop: 2,
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.xs,
      color: colors.textMuted,
    },
    resourceThemeToggle: {
      paddingTop: 8,
      paddingBottom: 4,
    },
    placeholderText: {
      marginTop: 8,
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.md,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 22,
    },
    primaryBtn: {
      marginTop: 18,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 12,
      backgroundColor: colors.brand,
    },
    primaryBtnText: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.md,
      color: colors.onBrand,
    },
    placeholderBtn: {
      marginTop: 14,
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 10,
      backgroundColor: colors.brandLight,
    },
    placeholderBtnText: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.md,
      color: colors.brand,
    },
    savedSeparator: {
      height: 12,
    },
    footerSpinner: {
      paddingVertical: 16,
    },
  });
}
