import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  clearSession,
  hydrateSessionUserFromMe,
  normalizeTokenUserProfile,
  useBookmarkFeed,
  useFollowList,
  useFollowCounts,
  useSession,
  useUserInterests,
  useUserPostsFeed,
  userApi,
} from '../../api';
import type { PostResponse } from '../../api/post/types';
import { PostCard } from '../../features/posts/components/PostCard';
import { resolveLevelBadgeFromUser } from '../../badge/progressionDisplay';
import { theme } from '../../presentation/theme/theme';
import { ThemeAppearanceToggle } from '../../presentation/theme/ThemeAppearanceToggle';
import { type ThemeColors, useThemeColors } from '../../presentation/theme/ThemeContext';
import { ProfileAvatarUploader } from '../../features/profile/components/ProfileAvatarUploader';
import { LevelBadge } from '../../shared/components/LevelBadge';
import { SpecialBadgesRow } from '../../shared/components/SpecialBadgesRow';
import { useMessageModal } from '../../shared/components/MessageModal';
import { PostFeedSkeleton, SkeletonBox, SkeletonGroup } from '../../shared/components/skeleton';
import type { MainTabParamList, RootStackParamList } from '../types';

type ProfileTabId = 'posts' | 'saved' | 'about' | 'settings';

const PROFILE_TABS: { id: ProfileTabId; label: string }[] = [
  { id: 'posts', label: 'Posts' },
  { id: 'saved', label: 'Saved' },
  { id: 'about', label: 'About' },
  { id: 'settings', label: 'Settings' },
];

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
  const { followersCount, followingCount, loading: countsLoading, refresh: refreshCounts } =
    useFollowCounts(userId);
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
    loading: interestsLoading,
    error: interestsError,
    refetch: refetchInterests,
  } = useUserInterests(userId);

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
  const openFollowList = useCallback(
    (kind: 'followers' | 'following') => {
      if (!userId) return;
      navigation.navigate('FollowList', { userId, kind });
    },
    [navigation, userId],
  );

  useFocusEffect(
    useCallback(() => {
      refreshCounts();
    }, [refreshCounts]),
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
          refreshCounts();
        }
      });
    }, [navigation, route.key, refreshCounts]),
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
        <MaterialCommunityIcons name="bookmark-outline" size={48} color={colors.textMuted} />
        <Text style={[styles.placeholderText, styles.savedEmptyTitle]}>{savedEmptyMessage}</Text>
      </View>
    );
  }, [colors.brand, colors.textMuted, refreshSaved, savedEmptyMessage, savedError, savedLoading, savedPosts.length, styles]);

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
        <MaterialCommunityIcons name="note-text-outline" size={48} color={colors.textMuted} />
        <Text style={[styles.placeholderText, styles.savedEmptyTitle]}>{myPostsEmptyMessage}</Text>
        <Pressable
          style={[styles.primaryBtn, styles.emptyCtaBtn]}
          onPress={() => goToMainTab('Post')}
          accessibilityRole="button"
          accessibilityLabel="Open Post tab"
        >
          <Text style={styles.primaryBtnText}>Compose</Text>
        </Pressable>
      </View>
    );
  }, [
    colors.brand,
    colors.textMuted,
    goToMainTab,
    myPosts.length,
    myPostsEmptyMessage,
    myPostsError,
    myPostsLoading,
    refreshMyPosts,
    styles,
  ]);

  const bottomPad = Math.max(insets.bottom, 12);

  return (
    <View style={styles.root}>
      {/** Fixed: profile card + tabs (does not scroll) */}
      <View style={styles.topSlot}>
        <View style={styles.topFixedContent}>
          <View style={styles.headerCard}>
            <View style={styles.avatarRow}>
              <ProfileAvatarUploader
                seed={userId ?? (username || 'profile')}
                avatarUrl={profile?.avatar_url}
                avatarUrls={profile?.avatar_urls}
                uploadEnabled
                displaySize={92}
              />
            </View>
            <View style={styles.nameRow}>
              <View style={styles.nameRowLeft}>
                <Text
                  style={styles.welcomeHeadline}
                  accessibilityRole="header"
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {fullName ? fullName : 'Profile'}
                </Text>
                {hasLevelBadge && levelBadge ? (
                  <LevelBadge
                    level={levelBadge.level}
                    tier={levelBadge.tierLabel}
                    tierColorHint={profile?.tier_color_hint}
                    lineFontSize={theme.fintSizes.md}
                    style={styles.levelBadgeInline}
                  />
                ) : null}
              </View>
            </View>
            {username ? (
              <Text style={styles.usernameLine} accessibilityLabel={`Username ${username}`}>
                @{username}
              </Text>
            ) : (
              <Text style={styles.muted}>Add a username in settings when available.</Text>
            )}

            {userId ? (
              countsLoading ? (
                <SkeletonGroup style={styles.countsRow}>
                  <View style={styles.countBlock}>
                    <SkeletonBox width={28} height={14} radius={7} />
                    <SkeletonBox width={56} height={10} radius={5} />
                  </View>
                  <View style={styles.countDivider} />
                  <View style={styles.countBlock}>
                    <SkeletonBox width={28} height={14} radius={7} />
                    <SkeletonBox width={56} height={10} radius={5} />
                  </View>
                </SkeletonGroup>
              ) : (
                <View style={styles.countsRow} accessibilityRole="summary">
                  <Pressable
                    style={({ pressed }) => [styles.countBlock, pressed && styles.countBlockPressed]}
                    onPress={() => openFollowList('followers')}
                    accessibilityRole="button"
                    accessibilityLabel={`Open followers list, ${followersCount ?? 0}`}
                  >
                    <Text style={styles.countValue} accessibilityLabel={`Followers ${followersCount ?? 0}`}>
                      {String(followersCount ?? 0)}
                    </Text>
                    <Text style={styles.countLabel}>Followers</Text>
                  </Pressable>
                  <View style={styles.countDivider} />
                  <Pressable
                    style={({ pressed }) => [styles.countBlock, pressed && styles.countBlockPressed]}
                    onPress={() => openFollowList('following')}
                    accessibilityRole="button"
                    accessibilityLabel={`Open following list, ${followingCount ?? 0}`}
                  >
                    <Text style={styles.countValue} accessibilityLabel={`Following ${followingCount ?? 0}`}>
                      {String(followingCount ?? 0)}
                    </Text>
                    <Text style={styles.countLabel}>Following</Text>
                  </Pressable>
                </View>
              )
            ) : null}

            {specialBadges.length > 0 ? <SpecialBadgesRow codes={specialBadges} /> : null}
          </View>

          <View style={styles.tabBarShell} accessibilityRole="tablist">
            <View style={styles.tabBarRow}>
              {PROFILE_TABS.map((t) => {
                const selected = activeTab === t.id;
                return (
                  <Pressable
                    key={t.id}
                    style={({ pressed }) => [
                      styles.tabPill,
                      selected && styles.tabPillSelected,
                      pressed && styles.tabPillPressed,
                    ]}
                    onPress={() => setActiveTab(t.id)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected }}
                    accessibilityLabel={t.label}
                  >
                    <Text style={[styles.tabPillLabel, selected && styles.tabPillLabelSelected]}>{t.label}</Text>
                  </Pressable>
                );
              })}
            </View>
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
      backgroundColor: colors.surfaceSubtle,
      ...Platform.select({
        android: { elevation: 6 },
        default: {},
      }),
    },
    topFixedContent: {
      paddingHorizontal: theme.spacing.screenPaddingH,
      paddingTop: 5,
      paddingBottom: 6,
    },
    bottomSlot: {
      flex: 1,
      minHeight: 0,
      zIndex: 1,
    },
    headerCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      paddingTop: 4,
      paddingHorizontal: 10,
      paddingBottom: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
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
    savedList: {
      flex: 1,
    },
    savedListContent: {
      paddingHorizontal: theme.spacing.screenPaddingH,
      paddingTop: 4,
    },
    savedListContentEmpty: {
      flexGrow: 1,
    },
    savedEmptyWrap: {
      flex: 1,
      minHeight: 120,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 32,
    },
    savedEmptyTitle: {
      marginTop: 12,
    },
    scrollTab: {
      flex: 1,
    },
    avatarRow: {
      alignItems: 'center',
      marginBottom: 4,
    },
    nameRow: {
      alignSelf: 'stretch',
      alignItems: 'center',
    },
    nameRowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: 4,
      alignSelf: 'center',
      width: '100%',
      maxWidth: '100%',
      paddingHorizontal: 2,
    },
    welcomeHeadline: {
      flexShrink: 1,
      minWidth: 0,
      maxWidth: '100%',
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.md,
      color: colors.textPrimary,
      letterSpacing: -0.15,
      lineHeight: 22,
      textAlign: 'center',
    },
    levelBadgeInline: {
      marginLeft: 0,
      flexShrink: 0,
    },
    usernameLine: {
      marginTop: 2,
      alignSelf: 'center',
      width: '100%',
      textAlign: 'center',
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.xs,
      color: colors.textMuted,
    },
    muted: {
      marginTop: 6,
      alignSelf: 'center',
      width: '100%',
      textAlign: 'center',
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.xs,
      color: colors.textMuted,
    },
    /** Three tabs: equal width across the bar */
    tabBarShell: {
      width: '100%',
      maxWidth: '100%',
      alignSelf: 'stretch',
      marginTop: 5,
      paddingVertical: 4,
      paddingHorizontal: 4,
      borderRadius: 14,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
      overflow: 'hidden',
    },
    tabBarRow: {
      flexDirection: 'row',
      width: '100%',
      alignItems: 'stretch',
      justifyContent: 'space-between',
    },
    tabPill: {
      flex: 1,
      flexBasis: 0,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: 11,
      paddingHorizontal: 4,
      borderRadius: 10,
    },
    tabPillSelected: {
      backgroundColor: colors.brandLight,
    },
    tabPillPressed: {
      opacity: 0.88,
    },
    tabPillLabel: {
      flexShrink: 1,
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.xs,
      color: colors.textMuted,
      textAlign: 'center',
    },
    tabPillLabelSelected: {
      color: colors.brand,
    },
    emptyCtaBtn: {
      marginTop: 16,
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
    countsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 6,
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
  });
}
