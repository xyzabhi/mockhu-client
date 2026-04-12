import { MaterialCommunityIcons } from '@expo/vector-icons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../presentation/theme/theme';
import {
  type ThemeColors,
  useThemeColors,
  useThemePreference,
} from '../../presentation/theme/ThemeContext';
import { UserAvatar } from './UserAvatar';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export type PostContext = {
  authorId?: string;
  authorUsername?: string;
  authorAvatarUrl?: string | null;
  title?: string;
  content?: string;
  starCount?: number;
  starred?: boolean;
  commentCount?: number;
};

export type FullScreenImageViewerProps = {
  images: string[];
  initialIndex?: number;
  visible: boolean;
  onClose: () => void;
  post?: PostContext;
  onStarPress?: () => void;
  onCommentPress?: () => void;
};

function truncate(text: string, max: number): string {
  if (!text) return '';
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

export function FullScreenImageViewer({
  images,
  initialIndex = 0,
  visible,
  onClose,
  post,
  onStarPress,
  onCommentPress,
}: FullScreenImageViewerProps) {
  const colors = useThemeColors();
  const { effectiveScheme } = useThemePreference();
  const isDark = effectiveScheme === 'dark';
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList>(null);

  const total = images.length;

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
      if (idx >= 0 && idx < total) setCurrentIndex(idx);
    },
    [total],
  );

  const goTo = useCallback(
    (dir: -1 | 1) => {
      const next = currentIndex + dir;
      if (next < 0 || next >= total) return;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      setCurrentIndex(next);
    },
    [currentIndex, total],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<string>) => (
      <View style={styles.slide}>
        <Image source={{ uri: item }} style={styles.image} resizeMode="contain" />
      </View>
    ),
    [styles],
  );

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: SCREEN_W,
      offset: SCREEN_W * index,
      index,
    }),
    [],
  );

  const hasPostInfo = post?.title || post?.content;
  const iconColor = isDark ? colors.textMuted : colors.textPrimary;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />
      <View style={styles.backdrop}>
        {/* Header — close, author, counter */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable
            onPress={onClose}
            hitSlop={14}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <MaterialCommunityIcons name="close" size={26} color={colors.textPrimary} />
          </Pressable>

          {post?.authorUsername ? (
            <View style={styles.authorRow}>
              <UserAvatar
                seed={post.authorId ?? post.authorUsername}
                avatarUrl={post.authorAvatarUrl}
                size={26}
              />
              <Text style={styles.authorName} numberOfLines={1}>
                {post.authorUsername}
              </Text>
            </View>
          ) : total > 1 ? (
            <Text style={styles.counter}>
              {currentIndex + 1} / {total}
            </Text>
          ) : (
            <View style={styles.headerSpacer} />
          )}

          {post?.authorUsername && total > 1 ? (
            <Text style={styles.counterSmall}>
              {currentIndex + 1}/{total}
            </Text>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>

        {/* Image carousel */}
        <FlatList
          ref={flatListRef}
          data={images}
          renderItem={renderItem}
          keyExtractor={(uri, i) => `${uri}-${i}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          getItemLayout={getItemLayout}
          initialScrollIndex={initialIndex}
          bounces={false}
          style={styles.list}
        />

        {/* Left / Right arrows */}
        {total > 1 ? (
          <>
            {currentIndex > 0 ? (
              <Pressable
                onPress={() => goTo(-1)}
                style={[styles.arrowBtn, styles.arrowLeft]}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Previous image"
              >
                <MaterialCommunityIcons name="chevron-left" size={32} color={iconColor} />
              </Pressable>
            ) : null}
            {currentIndex < total - 1 ? (
              <Pressable
                onPress={() => goTo(1)}
                style={[styles.arrowBtn, styles.arrowRight]}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Next image"
              >
                <MaterialCommunityIcons name="chevron-right" size={32} color={iconColor} />
              </Pressable>
            ) : null}
          </>
        ) : null}

        {/* Bottom: post info + actions */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          {hasPostInfo ? (
            <View style={styles.postInfo}>
              {post?.title ? (
                <Text style={styles.postTitle} numberOfLines={2}>{post.title}</Text>
              ) : null}
              {post?.content ? (
                <Text style={styles.postContent} numberOfLines={2}>
                  {truncate(post.content, 140)}
                </Text>
              ) : null}
            </View>
          ) : null}

          {/* Actions row */}
          <View style={styles.actionsRow}>
            {total > 1 ? (
              <View style={styles.dotsInline}>
                {images.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.dot, i === currentIndex && styles.dotActive]}
                  />
                ))}
              </View>
            ) : null}

            <View style={styles.actionSpacer} />

            <Pressable
              style={styles.actionItem}
              onPress={onStarPress}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={post?.starred ? 'Unlike' : 'Like'}
              accessibilityState={{ selected: post?.starred }}
            >
              <Ionicons
                name={post?.starred ? 'caret-up' : 'caret-up-outline'}
                size={22}
                color={post?.starred ? colors.brand : iconColor}
              />
              {post != null ? (
                <Text style={[styles.actionText, post.starred && { color: colors.brand }]}>
                  {post.starCount ?? 0}
                </Text>
              ) : null}
            </Pressable>

            <Pressable
              style={styles.actionItem}
              onPress={() => {
                onClose();
                onCommentPress?.();
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Comments"
            >
              <MaterialCommunityIcons name="comment-outline" size={20} color={iconColor} />
              {post != null ? (
                <Text style={styles.actionText}>{post.commentCount ?? 0}</Text>
              ) : null}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const ARROW_TOP = SCREEN_H * 0.42;

function createStyles(colors: ThemeColors, isDark: boolean) {
  const overlayBg = isDark ? 'rgba(18,18,20,0.75)' : 'rgba(255,255,255,0.88)';
  const arrowBg = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)';
  const closeBg = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)';
  const dotInactive = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)';
  const dotActiveBg = isDark ? '#fff' : colors.textPrimary;

  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: colors.surface,
    },

    /* ── Header ────────────────────────────────────────── */
    header: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 12,
      backgroundColor: overlayBg,
    },
    closeBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: closeBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    authorRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 12,
    },
    authorName: {
      color: colors.textPrimary,
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.md,
    },
    counter: {
      flex: 1,
      textAlign: 'center',
      color: colors.textPrimary,
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.md,
    },
    counterSmall: {
      color: colors.textMuted,
      fontFamily: theme.typography.medium,
      fontSize: theme.fintSizes.xs,
      minWidth: 38,
      textAlign: 'right',
    },
    headerSpacer: {
      width: 38,
    },

    /* ── Image carousel ────────────────────────────────── */
    list: {
      flex: 1,
    },
    slide: {
      width: SCREEN_W,
      height: SCREEN_H,
      alignItems: 'center',
      justifyContent: 'center',
    },
    image: {
      width: SCREEN_W,
      height: SCREEN_H * 0.65,
    },

    /* ── Arrows ────────────────────────────────────────── */
    arrowBtn: {
      position: 'absolute',
      top: ARROW_TOP,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: arrowBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    arrowLeft: {
      left: 12,
    },
    arrowRight: {
      right: 12,
    },

    /* ── Bottom bar ────────────────────────────────────── */
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 16,
      paddingTop: 12,
      backgroundColor: overlayBg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderSubtle,
    },
    postInfo: {
      marginBottom: 10,
    },
    postTitle: {
      color: colors.textPrimary,
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.md,
      lineHeight: 22,
    },
    postContent: {
      color: colors.textMuted,
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      lineHeight: 20,
      marginTop: 4,
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 20,
      paddingVertical: 6,
    },
    actionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    actionText: {
      color: colors.textMuted,
      fontFamily: theme.typography.medium,
      fontSize: theme.fintSizes.sm,
    },
    actionSpacer: {
      flex: 1,
    },

    /* ── Dot indicators ────────────────────────────────── */
    dotsInline: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: dotInactive,
    },
    dotActive: {
      backgroundColor: dotActiveBg,
      width: 7,
      height: 7,
      borderRadius: 3.5,
    },
  });
}
