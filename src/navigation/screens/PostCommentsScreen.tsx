import { MaterialCommunityIcons } from '@expo/vector-icons';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  BackHandler,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { normalizeTokenUserProfile, useFollowList, useSession } from '../../api';
import type { CommentResponse } from '../../api/post/commentTypes';
import {
  commentAuthorLabel,
  DEFAULT_REPLY_PREVIEW_LIMIT,
  flattenThreads,
} from '../../api/post/commentDisplay';
import { usePostComments } from '../../api/hooks/usePostComments';
import { theme } from '../../presentation/theme/theme';
import {
  type ThemeColors,
  useThemeColors,
  useThemePreference,
} from '../../presentation/theme/ThemeContext';
import { FollowAuthorLink } from '../../shared/components/FollowAuthorLink';
import { formatRelativeTime } from '../../shared/utils/formatRelativeTime';
import { UserAvatar } from '../../shared/components/UserAvatar';
import { useMessageModal } from '../../shared/components/MessageModal';
import { CommentListSkeleton } from '../../shared/components/skeleton';
import type { RootStackParamList } from '../types';

const COMMENT_MAX = 8000;

type Props = NativeStackScreenProps<RootStackParamList, 'PostComments'>;

export function PostCommentsScreen({ route, navigation }: Props) {
  const { height: windowHeight } = useWindowDimensions();
  const colors = useThemeColors();
  const { effectiveScheme } = useThemePreference();
  const { modal, show: showModal, hide: hideModal } = useMessageModal();
  const isDark = effectiveScheme === 'dark';
  const likeInactiveColor = useMemo(
    () => (isDark ? '#52525b' : '#111827'),
    [isDark],
  );
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { postId, commentCount: routeCommentCount } = route.params;
  const { user, isLoggedIn, accessToken } = useSession();
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
    threads,
    commentCountBadge,
    nextCursor,
    loading,
    loadingMore,
    refreshing,
    sending,
    error,
    loadMore,
    refresh,
    sendComment,
    removeComment,
    toggleCommentStar,
    reload,
  } = usePostComments(postId, routeCommentCount);

  const [draft, setDraft] = useState('');
  const [replyingTo, setReplyingTo] = useState<CommentResponse | null>(null);
  /** Top-level comment ids whose full reply list is shown (otherwise only first N replies). */
  const [expandedReplyRoots, setExpandedReplyRoots] = useState<Set<string>>(() => new Set());

  const flatRows = useMemo(
    () =>
      flattenThreads(threads, {
        replyLimit: DEFAULT_REPLY_PREVIEW_LIMIT,
        expandedRootIds: expandedReplyRoots,
      }),
    [threads, expandedReplyRoots],
  );

  const goBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true;
    });
    return () => sub.remove();
  }, [goBack]);

  const trimmed = draft.trim();
  const canSend =
    isLoggedIn && trimmed.length > 0 && trimmed.length <= COMMENT_MAX && !sending;

  const submit = useCallback(async () => {
    if (!canSend) return;
    const parentId =
      replyingTo && !replyingTo.parent_comment_id ? replyingTo.id : undefined;
    try {
      await sendComment(draft, parentId ?? null);
      setDraft('');
      setReplyingTo(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not post comment.';
      showModal({ title: 'Comment', message: msg });
    }
  }, [canSend, draft, replyingTo, sendComment, showModal]);

  const onPressCommentStar = useCallback(
    async (c: CommentResponse) => {
      if (!accessToken) {
        showModal({ title: 'Sign in', message: 'Sign in to like comments.' });
        return;
      }
      try {
        await toggleCommentStar(c.id);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Could not update like.';
        showModal({ title: 'Like', message: msg });
      }
    },
    [accessToken, showModal, toggleCommentStar],
  );

  const confirmDelete = useCallback(
    (c: CommentResponse) => {
      showModal({
        title: 'Delete comment?',
        message: c.parent_comment_id
          ? 'This will remove your reply.'
          : 'This will remove your comment and any replies.',
        buttons: [
          { label: 'Cancel', variant: 'secondary', onPress: hideModal },
          {
            label: 'Delete',
            variant: 'destructive',
            onPress: () => {
              hideModal();
              void (async () => {
                try {
                  await removeComment(c.id);
                } catch (err) {
                  const msg = err instanceof Error ? err.message : 'Could not delete.';
                  showModal({ title: 'Delete', message: msg });
                }
              })();
            },
          },
        ],
      });
    },
    [hideModal, removeComment, showModal],
  );

  const openCommentMenu = useCallback(
    (c: CommentResponse) => {
      if (currentUserId == null || c.user_id !== currentUserId) return;
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ['Cancel', 'Delete'],
            cancelButtonIndex: 0,
            destructiveButtonIndex: 1,
          },
          (buttonIndex) => {
            if (buttonIndex === 1) confirmDelete(c);
          },
        );
      } else {
        confirmDelete(c);
      }
    },
    [currentUserId, confirmDelete],
  );

  const sheetMaxHeight = windowHeight * 0.6;

  const expandReplies = useCallback((rootId: string) => {
    setExpandedReplyRoots((prev) => new Set(prev).add(rootId));
  }, []);

  const cancelInlineReply = useCallback(() => {
    setReplyingTo(null);
    setDraft('');
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: ReturnType<typeof flattenThreads>[number] }) => {
      if (item.kind === 'show_more_replies') {
        const n = item.hiddenCount;
        return (
          <Pressable
            onPress={() => expandReplies(item.rootId)}
            style={({ pressed }) => [
              styles.showMoreRepliesRow,
              pressed && styles.showMoreRepliesRowPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Show ${n} more ${n === 1 ? 'reply' : 'replies'}`}
          >
            <MaterialCommunityIcons name="chevron-down" size={16} color={colors.brand} />
            <Text style={styles.showMoreRepliesText}>
              Show {n} more {n === 1 ? 'reply' : 'replies'}
            </Text>
          </Pressable>
        );
      }

      const c = item.comment;
      const isReply = item.kind === 'reply';
      const isMine = currentUserId != null && c.user_id === currentUserId;
      const showReply = item.kind === 'root' && isLoggedIn;

      return (
        <View
          style={[styles.commentRow, isReply && styles.commentRowReply]}
          accessibilityRole="none"
        >
          <UserAvatar seed={c.user_id} avatarUrl={c.author?.avatar_url} size={isReply ? 30 : 34} />
          <View style={styles.commentBody}>
            <View style={styles.commentHeaderRow}>
              <View style={styles.commentHeaderLeft}>
                <View style={styles.commentAuthorNameRow}>
                  <Text style={styles.commentAuthor} numberOfLines={1}>
                    {commentAuthorLabel(c.author)}
                  </Text>
                  {!isMine ? (
                    <FollowAuthorLink
                      targetUserId={c.user_id}
                      currentUserId={currentUserId}
                      followingIds={followingIds}
                      onFollowListChanged={refreshFollowingList}
                      compact
                    />
                  ) : null}
                </View>
                <Text style={styles.commentMetaSep}> · </Text>
                <Text style={styles.commentTime}>{formatRelativeTime(c.created_at)}</Text>
              </View>
              {isMine ? (
                <Pressable
                  onPress={() => openCommentMenu(c)}
                  hitSlop={12}
                  style={({ pressed }) => [styles.menuHit, pressed && styles.menuHitPressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Comment options"
                >
                  <MaterialCommunityIcons
                    name="dots-horizontal"
                    size={22}
                    color={colors.textMuted}
                  />
                </Pressable>
              ) : null}
            </View>
            <Text style={styles.commentText}>{c.body}</Text>
            {showReply || isLoggedIn ? (
              <View style={styles.commentActions}>
                {showReply ? (
                  <Pressable
                    onPress={() => {
                      if (replyingTo?.id === c.id) {
                        cancelInlineReply();
                      } else {
                        setDraft('');
                        setReplyingTo(c);
                      }
                    }}
                    hitSlop={8}
                    style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`Reply to ${commentAuthorLabel(c.author)}`}
                    accessibilityState={{ expanded: replyingTo?.id === c.id }}
                  >
                    <Text
                      style={[
                        styles.actionBtnText,
                        replyingTo?.id === c.id && styles.actionBtnTextActive,
                      ]}
                    >
                      {replyingTo?.id === c.id ? 'Cancel' : 'Reply'}
                    </Text>
                  </Pressable>
                ) : null}
                {isLoggedIn ? (
                  <Pressable
                    onPress={() => void onPressCommentStar(c)}
                    hitSlop={8}
                    style={({ pressed }) => [
                      styles.commentLikeChip,
                      c.starred_by_me && styles.commentLikeChipActive,
                      pressed && styles.commentLikeBtnPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={c.starred_by_me ? 'Liked' : 'Like comment'}
                    accessibilityHint={`${c.star_count ?? 0} likes`}
                    accessibilityState={{ selected: c.starred_by_me === true }}
                  >
                    <Ionicons
                      name={c.starred_by_me ? 'caret-up' : 'caret-up-outline'}
                      size={18}
                      color={c.starred_by_me ? colors.brand : likeInactiveColor}
                    />
                    <Text
                      style={[
                        styles.commentLikeCount,
                        c.starred_by_me && styles.commentLikeCountActive,
                      ]}
                      maxFontSizeMultiplier={1.4}
                    >
                      {c.star_count ?? 0}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
            {showReply && replyingTo?.id === c.id && isLoggedIn ? (
              <View style={styles.inlineReplyBox}>
                <View style={styles.inlineReplyHeader}>
                  <Text style={styles.inlineReplyTitle} numberOfLines={1}>
                    Reply to {commentAuthorLabel(c.author)}
                  </Text>
                  <Pressable onPress={cancelInlineReply} hitSlop={8} accessibilityRole="button">
                    <Text style={styles.inlineReplyCancel}>Cancel</Text>
                  </Pressable>
                </View>
                <View style={styles.inlineReplyRow}>
                  <View style={styles.inlineInputBox}>
                    <TextInput
                      style={styles.inlineInput}
                      placeholder="Write a reply…"
                      placeholderTextColor={colors.textHint}
                      value={draft}
                      onChangeText={(t) => {
                        if (t.length <= COMMENT_MAX) setDraft(t);
                      }}
                      multiline
                      maxLength={COMMENT_MAX}
                      editable={!sending}
                      textAlignVertical="top"
                      autoFocus
                    />
                  </View>
                  <Pressable
                    style={({ pressed }) => [
                      styles.sendBtn,
                      !canSend && styles.sendBtnDisabled,
                      pressed && canSend && styles.sendBtnPressed,
                    ]}
                    onPress={() => void submit()}
                    disabled={!canSend}
                    accessibilityRole="button"
                    accessibilityLabel="Send reply"
                  >
                    {sending ? (
                      <ActivityIndicator size="small" color={colors.onBrand} />
                    ) : (
                      <MaterialCommunityIcons
                        name="send"
                        size={22}
                        color={canSend ? colors.onBrand : colors.textHint}
                      />
                    )}
                  </Pressable>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      );
    },
    [
      styles,
      colors.brand,
      colors.onBrand,
      colors.textHint,
      likeInactiveColor,
      currentUserId,
      isLoggedIn,
      openCommentMenu,
      onPressCommentStar,
      expandReplies,
      replyingTo,
      draft,
      sending,
      canSend,
      submit,
      cancelInlineReply,
    ],
  );

  const listErrorBanner =
    error && threads.length > 0 ? (
      <View style={styles.listTop}>
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error.message}</Text>
          <Pressable onPress={() => void reload()} accessibilityRole="button">
            <Text style={styles.errorRetry}>Retry</Text>
          </Pressable>
        </View>
      </View>
    ) : null;

  return (
    <View style={styles.overlay} testID={`post-comments-${postId}`}>
      {modal}
      <Pressable
        style={styles.backdrop}
        onPress={goBack}
        accessibilityRole="button"
        accessibilityLabel="Close comments"
      />
      <View style={styles.sheetWrap} pointerEvents="box-none">
        <SafeAreaView style={[styles.sheet, { height: sheetMaxHeight }]} edges={['bottom']}>
          <KeyboardAvoidingView
            style={styles.flex1}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
          >
            <View style={styles.sheetTopBar}>
              <View style={styles.dragHint} />
            </View>

            <View style={styles.header}>
              <Pressable
                onPress={goBack}
                hitSlop={14}
                accessibilityRole="button"
                accessibilityLabel="Close"
                style={styles.iconBtn}
              >
                <MaterialCommunityIcons name="close" size={26} color={colors.textPrimary} />
              </Pressable>
              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  Comments
                </Text>
                <Text style={styles.headerMeta} numberOfLines={1}>
                  {commentCountBadge}{' '}
                  {commentCountBadge === 1 ? 'comment' : 'comments'}
                </Text>
              </View>
              <View style={styles.headerRight} />
            </View>

            {loading && threads.length === 0 ? (
              <CommentListSkeleton count={6} />
            ) : error && threads.length === 0 ? (
              <View style={styles.centered}>
                <Text style={styles.placeholder}>{error.message}</Text>
                <Pressable
                  style={({ pressed }) => [styles.showMore, pressed && styles.showMorePressed]}
                  onPress={() => void reload()}
                  accessibilityRole="button"
                  accessibilityLabel="Retry loading comments"
                >
                  <Text style={styles.showMoreText}>Retry</Text>
                </Pressable>
              </View>
            ) : (
              <FlatList
                style={styles.list}
                data={flatRows}
                extraData={{ replyingId: replyingTo?.id, draftLen: draft.length, sending }}
                keyExtractor={(row) =>
                  row.kind === 'show_more_replies' ? `more-${row.rootId}` : row.comment.id
                }
                renderItem={renderItem}
                ListHeaderComponent={listErrorBanner}
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => void refresh()}
                    tintColor={colors.brand}
                    colors={[colors.brand]}
                  />
                }
                onEndReached={() => {
                  if (nextCursor) void loadMore();
                }}
                onEndReachedThreshold={0.35}
                ListFooterComponent={
                  loadingMore ? (
                    <View style={styles.footerLoad}>
                      <ActivityIndicator size="small" color={colors.brand} />
                    </View>
                  ) : nextCursor ? (
                    <Pressable
                      style={({ pressed }) => [styles.showMore, pressed && styles.showMorePressed]}
                      onPress={() => void loadMore()}
                      accessibilityRole="button"
                      accessibilityLabel="Load more comments"
                    >
                      <Text style={styles.showMoreText}>Show more</Text>
                    </Pressable>
                  ) : null
                }
                ListEmptyComponent={
                  !loading ? (
                    <View style={styles.emptyState}>
                      <MaterialCommunityIcons
                        name="comment-text-outline"
                        size={44}
                        color={colors.textHint}
                      />
                      <Text style={styles.placeholderLead}>No comments yet.</Text>
                      <Text style={styles.placeholderSub}>Be the first to say something.</Text>
                    </View>
                  ) : null
                }
              />
            )}

            <View style={[styles.composerOuter, replyingTo && styles.composerOuterCollapsed]}>
              {!isLoggedIn ? (
                <Text style={styles.signInHint}>Sign in to add a comment.</Text>
              ) : replyingTo ? null : (
                <View style={styles.composerRow}>
                  <View style={styles.inputBox}>
                    <TextInput
                      style={styles.input}
                      placeholder="Add a comment…"
                      placeholderTextColor={colors.textHint}
                      value={draft}
                      onChangeText={(t) => {
                        if (t.length <= COMMENT_MAX) setDraft(t);
                      }}
                      multiline
                      maxLength={COMMENT_MAX}
                      editable={!sending}
                      textAlignVertical="top"
                    />
                  </View>
                  <Pressable
                    style={({ pressed }) => [
                      styles.sendBtn,
                      !canSend && styles.sendBtnDisabled,
                      pressed && canSend && styles.sendBtnPressed,
                    ]}
                    onPress={() => void submit()}
                    disabled={!canSend}
                    accessibilityRole="button"
                    accessibilityLabel="Send comment"
                  >
                    {sending ? (
                      <ActivityIndicator size="small" color={colors.onBrand} />
                    ) : (
                      <MaterialCommunityIcons
                        name="send"
                        size={22}
                        color={canSend ? colors.onBrand : colors.textHint}
                      />
                    )}
                  </Pressable>
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(15, 23, 42, 0.42)',
    },
    sheetWrap: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'flex-end',
      pointerEvents: 'box-none',
    },
    sheet: {
      width: '100%',
      backgroundColor: colors.surface,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -6 },
      shadowOpacity: 0.14,
      shadowRadius: 20,
      elevation: 20,
    },
    flex1: {
      flex: 1,
    },
    sheetTopBar: {
      alignItems: 'center',
      paddingTop: 10,
      paddingBottom: 6,
    },
    dragHint: {
      width: 40,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.borderSubtle,
      opacity: 0.85,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 8,
      paddingBottom: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderSubtle,
    },
    iconBtn: {
      padding: 10,
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerCenter: {
      flex: 1,
      alignItems: 'center',
    },
    headerTitle: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.lg,
      color: colors.textPrimary,
      letterSpacing: -0.2,
    },
    headerMeta: {
      marginTop: 4,
      fontFamily: theme.typography.regular,
      fontSize: theme.fontSizes.meta,
      color: colors.textMuted,
    },
    headerRight: {
      minWidth: 44,
    },
    list: {
      flex: 1,
      minHeight: 120,
    },
    listContent: {
      paddingHorizontal: theme.spacing.screenPaddingH,
      paddingTop: 4,
      paddingBottom: 16,
      flexGrow: 1,
    },
    listTop: {
      marginBottom: 8,
    },
    errorBanner: {
      padding: 12,
      borderRadius: theme.radius.badge,
      backgroundColor: colors.surfaceSubtle,
      borderWidth: theme.borderWidth.default,
      borderColor: colors.borderSubtle,
    },
    errorText: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.danger,
    },
    errorRetry: {
      marginTop: 8,
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.sm,
      color: colors.brand,
    },
    centered: {
      flex: 1,
      minHeight: 160,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 20,
      marginTop: 8,
    },
    placeholder: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.textMuted,
      lineHeight: 22,
      paddingVertical: 24,
      textAlign: 'center',
    },
    placeholderLead: {
      marginTop: 2,
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.md,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    placeholderSub: {
      marginTop: 6,
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 22,
      maxWidth: 260,
    },
    commentRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      marginBottom: 20,
    },
    commentRowReply: {
      marginLeft: 8,
      paddingLeft: 14,
      borderLeftWidth: 2,
      borderLeftColor: colors.brandLight,
    },
    /** Align with reply text column: thread indent + border + avatar + gap. */
    showMoreRepliesRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginLeft: 8,
      paddingLeft: 14 + 30 + 12,
      marginBottom: 16,
      paddingVertical: 8,
      paddingRight: 14,
      alignSelf: 'flex-start',
      borderRadius: 999,
      backgroundColor: colors.brandLight,
    },
    showMoreRepliesRowPressed: {
      opacity: 0.82,
    },
    showMoreRepliesText: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fontSizes.meta,
      color: colors.brand,
    },
    commentBody: {
      flex: 1,
      minWidth: 0,
    },
    commentHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginBottom: 4,
    },
    commentHeaderLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      minWidth: 0,
      paddingRight: 4,
    },
    commentAuthorNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexShrink: 1,
      minWidth: 0,
      maxWidth: '100%',
      gap: 6,
    },
    commentAuthor: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.sm,
      color: colors.textPrimary,
      letterSpacing: -0.15,
      flexShrink: 1,
      minWidth: 0,
    },
    commentMetaSep: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fontSizes.meta,
      color: colors.textMuted,
    },
    commentTime: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fontSizes.meta,
      color: colors.textMuted,
    },
    menuHit: {
      padding: 4,
      marginRight: -4,
      marginTop: -2,
      borderRadius: theme.radius.badge,
    },
    menuHitPressed: {
      opacity: 0.65,
      backgroundColor: colors.surfaceSubtle,
    },
    commentText: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.textPrimary,
      lineHeight: 23,
      marginTop: 2,
    },
    commentActions: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 10,
    },
    actionBtn: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor: colors.surfaceSubtle,
    },
    actionBtnPressed: {
      opacity: 0.85,
    },
    actionBtnText: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fontSizes.meta,
      color: colors.brand,
    },
    actionBtnTextActive: {
      color: colors.textMuted,
    },
    inlineReplyBox: {
      marginTop: 12,
      padding: 14,
      borderRadius: 16,
      borderWidth: 0,
      backgroundColor: colors.surfaceSubtle,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 6,
        },
        android: { elevation: 1 },
        default: {},
      }),
    },
    inlineReplyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
      gap: 8,
    },
    inlineReplyTitle: {
      flex: 1,
      fontFamily: theme.typography.medium,
      fontSize: theme.fintSizes.xs,
      color: colors.textMuted,
    },
    inlineReplyCancel: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.xs,
      color: colors.brand,
    },
    inlineReplyRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 10,
    },
    inlineInputBox: {
      flex: 1,
      minHeight: 44,
      maxHeight: 120,
      borderRadius: 22,
      borderWidth: 0,
      backgroundColor: colors.surface,
      paddingHorizontal: 14,
      paddingVertical: 10,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
        },
        android: { elevation: 1 },
        default: {},
      }),
    },
    inlineInput: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.textPrimary,
      minHeight: 24,
      maxHeight: 100,
      padding: 0,
    },
    commentLikeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 999,
      backgroundColor: colors.surfaceSubtle,
    },
    commentLikeChipActive: {
      backgroundColor: colors.brandLight,
    },
    commentLikeBtnPressed: {
      opacity: 0.82,
    },
    commentLikeCount: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fontSizes.meta,
      color: colors.textMuted,
      minWidth: 16,
    },
    commentLikeCountActive: {
      color: colors.brand,
    },
    footerLoad: {
      paddingVertical: 16,
      alignItems: 'center',
    },
    showMore: {
      alignSelf: 'center',
      paddingVertical: 12,
      paddingHorizontal: 20,
      marginBottom: 8,
    },
    showMorePressed: {
      opacity: 0.85,
    },
    showMoreText: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.sm,
      color: colors.brand,
    },
    composerOuter: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderSubtle,
      paddingHorizontal: theme.spacing.screenPaddingH,
      paddingTop: 12,
      paddingBottom: 12,
      backgroundColor: colors.surfaceSubtle,
    },
    /** Reply UI moves inline under the comment; keep a slim bar for sign-in hint only. */
    composerOuterCollapsed: {
      paddingTop: 4,
      paddingBottom: 4,
    },
    signInHint: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.xs,
      color: colors.textMuted,
      marginBottom: 8,
    },
    composerRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 10,
    },
    inputBox: {
      flex: 1,
      minHeight: 44,
      maxHeight: 120,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      backgroundColor: colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 11,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
        },
        android: { elevation: 1 },
        default: {},
      }),
    },
    input: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.textPrimary,
      minHeight: 24,
      maxHeight: 100,
      padding: 0,
    },
    sendBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 0,
      backgroundColor: colors.brand,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendBtnDisabled: {
      borderWidth: 0,
      backgroundColor: colors.surface,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
        },
        android: { elevation: 0 },
        default: {},
      }),
    },
    sendBtnPressed: {
      opacity: 0.88,
    },
  });
}
