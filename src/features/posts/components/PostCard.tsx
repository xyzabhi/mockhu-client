import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Fragment, useCallback, useMemo, useRef, useState } from 'react';
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
import { mergeStarResponse, mergeUnstarResponse, postApi, useSession } from '../../../api';
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
      const parts = [post.title?.trim(), post.content.trim()].filter(Boolean) as string[];
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
  }, [post.content, post.link_url, post.title]);

  const reportPost = useCallback(() => {
    Alert.alert('Report', 'Thanks — we will review reports in a future update.');
  }, []);

  const starred = post.starred_by_me === true;
  const starCount = post.star_count ?? 0;

  const openComments = useCallback(() => {
    navigateToPostComments({ postId: post.id, commentCount: post.comment_count });
  }, [post.id, post.comment_count]);

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
      <Text style={styles.content}>{post.content}</Text>

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
            style={({ pressed }) => [styles.votePill, pressed && styles.pillPressed]}
            onPress={() => void submitStar()}
            accessibilityRole="button"
            accessibilityLabel={starred ? 'Liked' : 'Like post'}
            accessibilityHint={`${starCount} likes`}
            accessibilityState={{ selected: starred }}
          >
            <MaterialCommunityIcons
              name={starred ? 'thumb-up' : 'thumb-up-outline'}
              size={20}
              color={starred ? colors.brand : likeInactiveColor}
            />
            <Text style={styles.voteScore} maxFontSizeMultiplier={1.4}>
              {starCount}
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.replyPill, pressed && styles.pillPressed]}
            onPress={openComments}
            accessibilityRole="button"
            accessibilityLabel={`Comments, ${post.comment_count}`}
          >
            <MaterialCommunityIcons name="message-outline" size={20} color={colors.textPrimary} />
            <Text style={styles.replyCountText} maxFontSizeMultiplier={1.4}>
              {post.comment_count}
            </Text>
          </Pressable>
        </View>
        <View style={styles.footerRight}>
          <Pressable
            style={({ pressed }) => [styles.bookmarkBox, pressed && styles.pillPressed]}
            onPress={() => undefined}
            accessibilityRole="button"
            accessibilityLabel="Save"
          >
            <MaterialCommunityIcons name="bookmark-outline" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function createPostCardStyles(colors: ThemeColors) {
  return StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    paddingVertical: theme.spacing.cardPaddingV,
    paddingHorizontal: theme.spacing.cardPaddingH,
    borderWidth: theme.borderWidth.default,
    borderColor: colors.borderSubtle,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    marginBottom: 6,
  },
  content: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.md,
    color: colors.textPrimary,
    lineHeight: 24,
    marginBottom: 8,
  },
  singleImage: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: theme.radius.badge,
    marginBottom: 10,
    backgroundColor: colors.surfaceSubtle,
  },
  imageStrip: {
    marginBottom: 10,
    maxHeight: 120,
  },
  thumb: {
    width: 120,
    height: 120,
    borderRadius: theme.radius.badge,
    marginRight: 8,
    backgroundColor: colors.surfaceSubtle,
  },
  linkCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: colors.surfaceSubtle,
  },
  linkCardPressed: {
    opacity: 0.92,
  },
  linkImg: {
    width: 88,
    height: 88,
    backgroundColor: colors.borderSubtle,
  },
  linkImgPlaceholder: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSubtle,
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
    marginTop: 10,
    gap: 8,
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
    gap: 3,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.radius.pill,
    borderWidth: theme.borderWidth.default,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    minHeight: 38,
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
  replyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.radius.pill,
    borderWidth: theme.borderWidth.default,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    maxWidth: '100%',
    minHeight: 38,
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
    width: 38,
    height: 38,
    borderRadius: theme.radius.badge,
    borderWidth: theme.borderWidth.default,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
  });
}
