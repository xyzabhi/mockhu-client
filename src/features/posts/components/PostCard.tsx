import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Fragment, useCallback, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
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
import { postApi } from '../../../api';
import type { PostResponse, PostType } from '../../../api/post/types';
import { topicBreadcrumb, topicBreadcrumbSegments } from '../../../api/post/topicCatalog';
import { resolvePostMediaUrl } from '../../../api/post/mediaUrl';
import { theme } from '../../../presentation/theme/theme';
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

function typeBadgeColors(t: PostType): { bg: string; fg: string } {
  switch (t) {
    case 'TIP':
      return { bg: theme.colors.progressLight, fg: theme.colors.progress };
    case 'DOUBT':
      return { bg: theme.colors.brandLight, fg: theme.colors.brand };
    case 'WIN':
      return { bg: '#FFF7ED', fg: '#EA580C' };
    case 'EXPERIENCE':
      return { bg: '#EEF2FF', fg: '#4338CA' };
    default:
      return { bg: theme.colors.brandLight, fg: theme.colors.brand };
  }
}

type PostCardProps = {
  post: PostResponse;
  currentUserId?: string;
  onDeleted?: (postId: string) => void;
};

export function PostCard({ post, currentUserId, onDeleted }: PostCardProps) {
  const [deleting, setDeleting] = useState(false);
  const isOwner = currentUserId != null && post.user_id === currentUserId;
  const badge = typeBadgeColors(post.post_type);
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
      const parts = [post.content.trim()];
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
  }, [post.content, post.link_url]);

  const repost = useCallback(() => {
    Alert.alert('Repost', 'Reposting will be available in a future update.');
  }, []);

  const reportPost = useCallback(() => {
    Alert.alert('Report', 'Thanks — we will review reports in a future update.');
  }, []);

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
            <Text style={styles.displayName} numberOfLines={1}>
              {displayName(post)}
            </Text>
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
                <ActivityIndicator size="small" color={theme.colors.textMuted} />
              ) : (
                <MaterialCommunityIcons name="dots-vertical" size={22} color={theme.colors.textMuted} />
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
              <MaterialCommunityIcons name="link-variant" size={28} color={theme.colors.textMuted} />
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
        <Pressable
          style={[styles.footerSlot, styles.footerStat]}
          onPress={() => undefined}
          accessibilityRole="button"
          accessibilityLabel={`Upvotes, ${post.upvote_count}`}
        >
          <MaterialCommunityIcons name="star-outline" size={20} color={theme.colors.textMuted} />
          <Text style={styles.statText}>{post.upvote_count}</Text>
        </Pressable>
        <Pressable
          style={[styles.footerSlot, styles.footerStat]}
          onPress={() => undefined}
          accessibilityRole="button"
          accessibilityLabel={`Comments, ${post.comment_count}`}
        >
          <MaterialCommunityIcons name="comment-outline" size={20} color={theme.colors.textMuted} />
          <Text style={styles.statText}>{post.comment_count}</Text>
        </Pressable>
        <Pressable
          style={[styles.footerSlot, styles.footerIconBtn]}
          onPress={repost}
          accessibilityRole="button"
          accessibilityLabel="Repost"
        >
          <MaterialCommunityIcons name="repeat-variant" size={22} color={theme.colors.textMuted} />
        </Pressable>
        <Pressable
          style={[styles.footerSlot, styles.footerIconBtn]}
          onPress={() => void sharePost()}
          accessibilityRole="button"
          accessibilityLabel="Share"
        >
          <MaterialCommunityIcons name="share-variant-outline" size={22} color={theme.colors.textMuted} />
        </Pressable>
        <Pressable
          style={[styles.footerSlot, styles.footerIconBtn]}
          onPress={() => undefined}
          accessibilityRole="button"
          accessibilityLabel="Save"
        >
          <MaterialCommunityIcons name="bookmark-outline" size={22} color={theme.colors.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.cardPaddingV,
    paddingHorizontal: theme.spacing.cardPaddingH,
    borderRadius: theme.radius.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: theme.colors.brandLight,
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
    color: theme.colors.brand,
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
  displayName: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textPrimary,
  },
  timeMeta: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.textMuted,
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
    color: theme.colors.textMuted,
  },
  topicSep: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.textMuted,
  },
  /** Last breadcrumb segment (usually exam) — brand emphasis. */
  topicLineLast: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.brand,
  },
  content: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textPrimary,
    lineHeight: 22,
    marginBottom: 8,
  },
  singleImage: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: theme.radius.badge,
    marginBottom: 10,
    backgroundColor: theme.colors.surfaceSubtle,
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
    backgroundColor: theme.colors.surfaceSubtle,
  },
  linkCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radius.card,
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: theme.colors.surfaceSubtle,
  },
  linkCardPressed: {
    opacity: 0.92,
  },
  linkImg: {
    width: 88,
    height: 88,
    backgroundColor: theme.colors.borderSubtle,
  },
  linkImgPlaceholder: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceSubtle,
  },
  linkText: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
    minWidth: 0,
  },
  linkTitle: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textPrimary,
  },
  linkDesc: {
    marginTop: 4,
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.textMuted,
  },
  linkUrl: {
    marginTop: 4,
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.brand,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'stretch',
    alignSelf: 'stretch',
    marginTop: 8,
  },
  /** Equal-width columns so actions are evenly spaced across the row. */
  footerSlot: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  footerStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerIconBtn: {
    padding: 4,
  },
  statText: {
    fontFamily: theme.typography.medium,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.textMuted,
  },
});
