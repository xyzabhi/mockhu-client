import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text } from 'react-native';
import { useFollow } from '../../api';
import { theme } from '../../presentation/theme/theme';
import { type ThemeColors, useThemeColors } from '../../presentation/theme/ThemeContext';

type FollowAuthorLinkProps = {
  targetUserId: string;
  currentUserId?: string;
  followingIds?: Set<string>;
  onFollowListChanged?: () => void;
  /** Smaller typography for dense rows (e.g. comments). */
  compact?: boolean;
};

/**
 * Inline Follow / Following control for another user’s content (feed, comments).
 * Hidden when not signed in, no following list, or viewing own user id.
 */
export function FollowAuthorLink({
  targetUserId,
  currentUserId,
  followingIds,
  onFollowListChanged,
  compact,
}: FollowAuthorLinkProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors, !!compact), [colors, compact]);
  const { follow, unfollow, pending } = useFollow();
  const [optimistic, setOptimistic] = useState<'idle' | 'following' | 'not_following'>('idle');

  useEffect(() => {
    setOptimistic('idle');
  }, [targetUserId]);

  useEffect(() => {
    if (optimistic === 'idle' || !followingIds) return;
    const server = followingIds.has(targetUserId);
    const wantsFollow = optimistic === 'following';
    if (server === wantsFollow) setOptimistic('idle');
  }, [followingIds, targetUserId, optimistic]);

  const serverFollowing = followingIds?.has(targetUserId) ?? false;
  const isFollowing = optimistic === 'idle' ? serverFollowing : optimistic === 'following';

  const runFollow = useCallback(async () => {
    try {
      await follow(targetUserId);
      setOptimistic('following');
      onFollowListChanged?.();
    } catch {
      Alert.alert('Could not follow', 'Try again in a moment.');
    }
  }, [follow, targetUserId, onFollowListChanged]);

  const runUnfollow = useCallback(async () => {
    try {
      await unfollow(targetUserId);
      setOptimistic('not_following');
      onFollowListChanged?.();
    } catch {
      Alert.alert('Could not unfollow', 'Try again in a moment.');
    }
  }, [unfollow, targetUserId, onFollowListChanged]);

  const handlePress = useCallback(() => {
    if (isFollowing) {
      Alert.alert('Unfollow', 'Stop following this user?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unfollow',
          style: 'destructive',
          onPress: () => void runUnfollow(),
        },
      ]);
    } else {
      void runFollow();
    }
  }, [isFollowing, runFollow, runUnfollow]);

  if (!currentUserId || targetUserId === currentUserId || !followingIds) {
    return null;
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={pending}
      hitSlop={8}
      style={({ pressed }) => [pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={isFollowing ? 'Unfollow user' : 'Follow user'}
    >
      {pending ? (
        <ActivityIndicator size="small" color={colors.brand} />
      ) : (
        <Text style={isFollowing ? styles.followingText : styles.followText}>
          {isFollowing ? 'Following' : 'Follow'}
        </Text>
      )}
    </Pressable>
  );
}

function createStyles(colors: ThemeColors, compact: boolean) {
  const fontSize = compact ? theme.fintSizes.xs : theme.fintSizes.sm;
  return StyleSheet.create({
    pressed: { opacity: 0.75 },
    followText: {
      fontFamily: theme.typography.semiBold,
      fontSize,
      color: colors.brand,
    },
    followingText: {
      fontFamily: theme.typography.medium,
      fontSize,
      color: colors.textMuted,
    },
  });
}
