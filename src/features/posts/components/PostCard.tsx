import { MaterialCommunityIcons } from '@expo/vector-icons';
import Ionicons from '@expo/vector-icons/Ionicons';
import Octicons from '@expo/vector-icons/Octicons';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  mergeBookmarkResponse,
  mergeStarResponse,
  mergeUnbookmarkResponse,
  mergeUnstarResponse,
  postApi,
  useSession,
} from '../../../api';
import { notifyPostBookmarkUpdate } from '../../../shared/postBookmarkSync';
import { navigateToPostComments } from '../../../navigation/navigationRef';
import type { PostResponse, PostType } from '../../../api/post/types';
import { topicBreadcrumb, topicBreadcrumbSegments } from '../../../api/post/topicCatalog';
import { resolvePostMediaUrl } from '../../../api/post/mediaUrl';
import { theme } from '../../../presentation/theme/theme';
import {
  type ThemeColors,
  useThemeColors,
  useThemePreference,
} from '../../../presentation/theme/ThemeContext';
import { FollowAuthorLink } from '../../../shared/components/FollowAuthorLink';
import { formatRelativeTime } from '../../../shared/utils/formatRelativeTime';
import { postContentLooksLikeHtml, stripHtmlTags } from '../postContentFormatting';
import { PostContentBody } from './PostContentBody';

function displayName(post: PostResponse): string {
  if (post.is_anonymous) return 'Anonymous';
  const a = post.author;
  if (!a) return 'Member';
  const parts = [a.first_name?.trim(), a.last_name?.trim()].filter(Boolean);
  if (parts.length) return parts.join(' ');
  return a.username;
}

function authorInitials(post: PostResponse): string {
  if (post.is_anonymous) return '?';
  const a = post.author;
  if (!a) return '?';
  const f = a.first_name?.trim()?.[0];
  const l = a.last_name?.trim()?.[0];
  if (f && l) return `${f}${l}`.toUpperCase();
  const u = a.username?.trim();
  if (u && u.length >= 2) return u.slice(0, 2).toUpperCase();
  return (u?.[0] ?? '?').toUpperCase();
}

function typeBadgeColors(
  t: PostType,
  colors: ThemeColors,
  isDark: boolean,
): { bg: string; fg: string } {
  switch (t) {
    case 'TIP':
      return { bg: colors.progressLight, fg: colors.progress };
    case 'DOUBT':
      return { bg: colors.brandLight, fg: colors.brand };
    case 'WIN':
      return isDark
        ? { bg: '#451a03', fg: '#fb923c' }
        : { bg: '#FFF7ED', fg: '#EA580C' };
    case 'EXPERIENCE':
      return isDark
        ? { bg: '#1e1b4b', fg: '#a5b4fc' }
        : { bg: '#EEF2FF', fg: '#4338CA' };
    default:
      return { bg: colors.brandLight, fg: colors.brand };
  }
}

type PostCardProps = {
  post: PostResponse;
  currentUserId?: string;
  /** Signed-in user’s following ids (for Follow on post author). */
  followingIds?: Set<string>;
  onFollowListChanged?: () => void;
  onDeleted?: (postId: string) => void;
  /** Merge server post after vote (and other updates). */
  onPostUpdated?: (post: PostResponse) => void;
};

export function PostCard({
  post,
  currentUserId,
  followingIds,
  onFollowListChanged,
  onDeleted,
  onPostUpdated,
}: PostCardProps) {
  const colors = useThemeColors();
  const { effectiveScheme } = useThemePreference();
  const isDark = effectiveScheme === 'dark';
  /** Unliked thumb — dark gray in both themes (Facebook-style). */
  const likeInactiveColor = isDark ? '#52525b' : '#111827';
  const styles = useMemo(() => createPostCardStyles(colors), [colors]);
  const { accessToken } = useSession();
  const [deleting, setDeleting] = useState(false);
  const [bookmarkOverride, setBookmarkOverride] = useState<boolean | null>(null);
  const authorStarPulse = useRef(new Animated.Value(0)).current;

  const authorNameScale = authorStarPulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.09, 1],
  });
  const authorNameColor = useMemo(
    () =>
      authorStarPulse.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [colors.textPrimary, colors.brand, colors.textPrimary],
      }),
    [authorStarPulse, colors.textPrimary, colors.brand],
  );

  const playAuthorStarredAnimation = useCallback(() => {
    authorStarPulse.setValue(0);
    Animated.sequence([
      Animated.timing(authorStarPulse, {
        toValue: 1,
        duration: 220,
        useNativeDriver: false,
      }),
      Animated.timing(authorStarPulse, {
        toValue: 0,
        duration: 380,
        useNativeDriver: false,
      }),
    ]).start();
  }, [authorStarPulse]);
  /** Same function — old name kept so stale bundles / HMR do not throw. */
  const playAuthorFiredAnimation = playAuthorStarredAnimation;
  const isOwner = currentUserId != null && post.user_id === currentUserId;
  const badge = useMemo(
    () => typeBadgeColors(post.post_type, colors, isDark),
    [post.post_type, colors, isDark],
  );
  const images = post.images ?? [];
  const tagsForDisplay = useMemo(
    () => (post.tags ?? []).map((t) => t.trim()).filter(Boolean),
    [post.tags],
  );
  const timeLabel = formatRelativeTime(post.created_at);
  const avatarUri = post.is_anonymous ? null : post.author?.avatar_url?.trim();

  const handleDelete = useCallback(() => {
    Alert.alert('Delete post?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setDeleting(true);
            try {
              await postApi.deletePost(post.id);
              onDeleted?.(post.id);
            } catch (e) {
              const msg = e instanceof Error ? e.message : 'Could not delete.';
              Alert.alert('Delete failed', msg);
            } finally {
              setDeleting(false);
            }
          })();
        },
      },
    ]);
  }, [onDeleted, post.id]);

  const openLink = useCallback(() => {
    const u = post.link_url?.trim();
    if (u) void Linking.openURL(u);
  }, [post.link_url]);

  const sharePost = useCallback(async () => {
    try {
      const plainBody = postContentLooksLikeHtml(post.content)
        ? stripHtmlTags(post.content)
        : post.content;
      const parts = [post.title?.trim(), plainBody.trim()].filter(Boolean) as string[];
      const tagLine = tagsForDisplay.map((t) => `#${t}`).join(' ');
      if (tagLine.length > 0) {
        parts.push(tagLine);
      }
      if (post.link_url?.trim()) {
        parts.push(post.link_url.trim());
      }
      await Share.share({
        message: parts.join('\n\n'),
        title: 'Mockhu',
      });
    } catch {
      /* dismissed */
    }
  }, [post.content, post.link_url, post.title, tagsForDisplay]);

  const reportPost = useCallback(() => {
    Alert.alert('Report', 'Thanks — we will review reports in a future update.');
  }, []);

  const starred = post.starred_by_me === true;
  const starCount = post.star_count ?? 0;
  const bookmarked = bookmarkOverride ?? post.bookmarked_by_me === true;

  useEffect(() => {
    setBookmarkOverride(null);
  }, [post.id, post.bookmarked_by_me]);

  const openComments = useCallback(() => {
    navigateToPostComments({ postId: post.id, commentCount: post.comment_count });
  }, [post.id, post.comment_count]);

  const toggleBookmark = useCallback(async () => {
    if (!accessToken) {
      Alert.alert('Sign in', 'Sign in to save posts.');
      return;
    }
    const next = !bookmarked;
    setBookmarkOverride(next);
    try {
      if (next) {
        const res = await postApi.bookmarkPost(post.id);
        const merged = mergeBookmarkResponse(post, res);
        onPostUpdated?.(merged);
        notifyPostBookmarkUpdate(post.id, { bookmarked_by_me: merged.bookmarked_by_me });
      } else {
        const res = await postApi.unbookmarkPost(post.id);
        const merged = mergeUnbookmarkResponse(post, res);
        onPostUpdated?.(merged);
        notifyPostBookmarkUpdate(post.id, { bookmarked_by_me: merged.bookmarked_by_me });
      }
      setBookmarkOverride(null);
    } catch (e) {
      setBookmarkOverride(null);
      const msg = e instanceof Error ? e.message : 'Could not update saved posts.';
      Alert.alert('Saved', msg);
    }
  }, [accessToken, bookmarked, onPostUpdated, post]);

  const submitStar = useCallback(async () => {
    if (!accessToken) {
      Alert.alert('Sign in', 'Sign in to like posts.');
      return;
    }
    try {
      if (post.starred_by_me) {
        const res = await postApi.unstarPost(post.id);
        onPostUpdated?.(mergeUnstarResponse(post, res));
      } else {
        const star = await postApi.starPost(post.id);
        onPostUpdated?.(mergeStarResponse(post, star));
        if (star.starred) {
          playAuthorFiredAnimation();
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not update like.';
      Alert.alert('Like', msg);
    }
  }, [accessToken, onPostUpdated, playAuthorFiredAnimation, post]);

  const openPostMenu = useCallback(() => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Share', isOwner ? 'Delete' : 'Report'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: isOwner ? 2 : undefined,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) void sharePost();
          if (buttonIndex === 2) {
            if (isOwner) handleDelete();
            else reportPost();
          }
        },
      );
    } else {
      Alert.alert(
        'Post options',
        undefined,
        [
          { text: 'Share', onPress: () => void sharePost() },
          isOwner
            ? { text: 'Delete', style: 'destructive', onPress: handleDelete }
            : { text: 'Report', onPress: reportPost },
          { text: 'Cancel', style: 'cancel' },
        ],
        { cancelable: true },
      );
    }
  }, [handleDelete, isOwner, reportPost, sharePost]);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.avatarWrap}>
          {avatarUri ? (
            <Image source={{ uri: resolvePostMediaUrl(avatarUri) }} style={styles.avatarImg} />
          ) : (
            <Text style={styles.avatarInitials}>{authorInitials(post)}</Text>
          )}
        </View>
        <View style={styles.headerMain}>
          <View style={styles.nameRow}>
            <View style={styles.authorNameRow}>
              <Animated.Text
                style={[
                  styles.displayName,
                  styles.displayNameFlex,
                  {
                    transform: [{ scale: authorNameScale }],
                    color: authorNameColor,
                  },
                ]}
                numberOfLines={1}
              >
                {displayName(post)}
              </Animated.Text>
              {!post.is_anonymous ? (
                <FollowAuthorLink
                  targetUserId={post.user_id}
                  currentUserId={currentUserId}
                  followingIds={followingIds}
                  onFollowListChanged={onFollowListChanged}
                />
              ) : null}
            </View>
            {timeLabel ? <Text style={styles.timeMeta}> · {timeLabel}</Text> : null}
            <View style={styles.headerSpacer} />
            <View style={[styles.typePill, { backgroundColor: badge.bg }]}>
              <Text style={[styles.typePillText, { color: badge.fg }]}>{post.post_type}</Text>
            </View>
            <Pressable
              onPress={openPostMenu}
              disabled={deleting}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Post options"
              style={styles.overflowBtn}
            >
              {deleting ? (
                <ActivityIndicator size="small" color={colors.textPrimary} />
              ) : (
                <MaterialCommunityIcons name="dots-vertical" size={22} color={colors.textPrimary} />
              )}
            </Pressable>
          </View>
          <View
            style={styles.topicRow}
            accessibilityLabel={topicBreadcrumb(post)}
          >
            {topicBreadcrumbSegments(post).map((segment, i, arr) => (
              <Fragment key={i}>
                {i > 0 ? <Text style={styles.topicSep}> › </Text> : null}
                <Text
                  style={i === arr.length - 1 ? styles.topicLineLast : styles.topicLinePart}
                  numberOfLines={2}
                >
                  {segment}
                </Text>
              </Fragment>
            ))}
          </View>
        </View>
      </View>

      {post.title?.trim() ? (
        <Text style={styles.postTitle} numberOfLines={4}>
          {post.title.trim()}
        </Text>
      ) : null}
      <PostContentBody content={post.content} style={styles.content} />

      {tagsForDisplay.length > 0 ? (
        <View style={styles.tagsRow} accessibilityLabel="Post tags">
          {tagsForDisplay.map((t, i) => (
            <Text key={`${t}-${i}`} style={styles.tagText}>
              #{t}
            </Text>
          ))}
        </View>
      ) : null}

      {images.length === 1 ? (
        <Image
          source={{ uri: resolvePostMediaUrl(images[0]!) }}
          style={styles.singleImage}
          resizeMode="cover"
        />
      ) : images.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageStrip}>
          {images.map((uri) => (
            <Image
              key={uri}
              source={{ uri: resolvePostMediaUrl(uri) }}
              style={styles.thumb}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      ) : null}

      {post.link_url ? (
        <Pressable
          onPress={openLink}
          style={({ pressed }) => [styles.linkCard, pressed && styles.linkCardPressed]}
        >
          {post.link_img ? (
            <Image
              source={{ uri: resolvePostMediaUrl(post.link_img) }}
              style={styles.linkImg}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.linkImgPlaceholder}>
              <MaterialCommunityIcons name="link-variant" size={28} color={colors.textPrimary} />
            </View>
          )}
          <View style={styles.linkText}>
            <Text style={styles.linkTitle} numberOfLines={2}>
              {post.link_title?.trim() || post.link_url}
            </Text>
            {post.link_desc ? (
              <Text style={styles.linkDesc} numberOfLines={2}>
                {post.link_desc}
              </Text>
            ) : null}
            <Text style={styles.linkUrl} numberOfLines={1}>
              {post.link_url}
            </Text>
          </View>
        </Pressable>
      ) : null}

      <View style={styles.cardFooter}>
        <View style={styles.footerLeft}>
          <Pressable
            style={({ pressed }) => [
              styles.votePill,
              starred && styles.votePillActive,
              pressed && styles.pillPressed,
            ]}
            onPress={() => void submitStar()}
            accessibilityRole="button"
            accessibilityLabel={starred ? 'Liked' : 'Like post'}
            accessibilityHint={`${starCount} likes`}
            accessibilityState={{ selected: starred }}
          >
            <Ionicons
              name={starred ? 'caret-up' : 'caret-up-outline'}
              size={22}
              color={starred ? colors.brand : likeInactiveColor}
            />
            <Text
              style={[styles.voteScore, starred && styles.voteScoreActive]}
              maxFontSizeMultiplier={1.4}
            >
              {starCount}
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.replyPill, pressed && styles.pillPressed]}
            onPress={openComments}
            accessibilityRole="button"
            accessibilityLabel={`Comments, ${post.comment_count}`}
          >
            <Octicons name="comment" size={22} color={colors.textMuted} />
            <Text style={styles.replyCountText} maxFontSizeMultiplier={1.4}>
              {post.comment_count}
            </Text>
          </Pressable>
        </View>
        <View style={styles.footerRight}>
          <Pressable
            style={({ pressed }) => [styles.bookmarkBox, pressed && styles.pillPressed]}
            onPress={() => void toggleBookmark()}
            accessibilityRole="button"
            accessibilityLabel={bookmarked ? 'Remove from saved' : 'Save post'}
            accessibilityState={{ selected: bookmarked }}
          >
            <MaterialCommunityIcons
              name={bookmarked ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={bookmarked ? colors.brand : colors.textMuted}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function createPostCardStyles(colors: ThemeColors) {
  const cardShadow = Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
    },
    android: {
      elevation: 2,
    },
    default: {},
  });

  return StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.cardPaddingH,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
    ...cardShadow,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.sm,
    color: colors.brand,
  },
  headerMain: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    minWidth: 0,
    maxWidth: '100%',
    gap: 6,
  },
  displayName: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.md,
    color: colors.textPrimary,
  },
  displayNameFlex: {
    flexShrink: 1,
    minWidth: 0,
  },
  timeMeta: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.xs,
    color: colors.textMuted,
  },
  headerSpacer: {
    flex: 1,
    minWidth: 4,
  },
  typePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.badge,
  },
  typePillText: {
    fontFamily: theme.typography.semiBold,
    fontSize: 10,
    letterSpacing: 0.3,
  },
  overflowBtn: {
    marginLeft: 4,
    padding: 2,
  },
  topicRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 4,
  },
  topicLinePart: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.xs,
    color: colors.textMuted,
  },
  topicSep: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.xs,
    color: colors.textMuted,
  },
  /** Last breadcrumb segment (usually exam) — brand emphasis. */
  topicLineLast: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.xs,
    color: colors.brand,
  },
  postTitle: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.lg,
    color: colors.textPrimary,
    lineHeight: 26,
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  content: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.md,
    color: colors.textPrimary,
    lineHeight: 24,
    marginBottom: 10,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  tagText: {
    fontFamily: theme.typography.medium,
    fontSize: theme.fintSizes.xs,
    color: colors.brand,
  },
  singleImage: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: colors.surfaceSubtle,
  },
  imageStrip: {
    marginBottom: 10,
    maxHeight: 120,
  },
  thumb: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: colors.surfaceSubtle,
  },
  linkCard: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: colors.surfaceSubtle,
  },
  linkCardPressed: {
    opacity: 0.92,
  },
  linkImg: {
    width: 88,
    height: 88,
    backgroundColor: colors.surfaceSubtle,
  },
  linkImgPlaceholder: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandLight,
  },
  linkText: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
    minWidth: 0,
  },
  linkTitle: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.md,
    color: colors.textPrimary,
  },
  linkDesc: {
    marginTop: 4,
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: colors.textMuted,
  },
  linkUrl: {
    marginTop: 4,
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: colors.brand,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 12,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
  },
  /** Like + comment pills — grouped on the left. */
  footerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    minWidth: 0,
    flexWrap: 'wrap',
  },
  footerRight: {
    flexShrink: 0,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  votePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 0,
    backgroundColor: colors.surfaceSubtle,
    minHeight: 36,
  },
  votePillActive: {
    backgroundColor: colors.brandLight,
  },
  pillPressed: {
    opacity: 0.82,
  },
  voteScore: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.sm,
    color: colors.textPrimary,
    minWidth: 28,
    textAlign: 'center',
  },
  voteScoreActive: {
    color: colors.brand,
  },
  replyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 0,
    backgroundColor: colors.surfaceSubtle,
    maxWidth: '100%',
    minHeight: 36,
  },
  replyCountText: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.sm,
    color: colors.textPrimary,
    minWidth: 20,
    textAlign: 'center',
  },
  bookmarkBox: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 999,
    borderWidth: 0,
    backgroundColor: colors.surfaceSubtle,
  },
  });
}
