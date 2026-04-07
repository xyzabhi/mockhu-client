import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFollow } from '../../api';
import type { UserSummary } from '../../api/user/types';
import { theme } from '../../presentation/theme/theme';
import { type ThemeColors, useThemeColors } from '../../presentation/theme/ThemeContext';
import { UserAvatar } from './UserAvatar';

export function displayNameForUser(u: UserSummary): string {
  const parts = [u.first_name?.trim(), u.last_name?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : u.username;
}

export function SuggestedUserRow({ item }: { item: UserSummary }) {
  const colors = useThemeColors();
  const styles = useMemo(() => createRowStyles(colors), [colors]);
  const { follow, pending } = useFollow();
  const [done, setDone] = useState(false);

  const handleFollow = useCallback(async () => {
    try {
      await follow(item.id);
      setDone(true);
    } catch {
      Alert.alert('Could not follow', 'Try again in a moment.');
    }
  }, [follow, item.id]);

  return (
    <View style={styles.row}>
      <UserAvatar seed={item.id} avatarUrl={item.avatar_url} size={48} />
      <View style={styles.rowText}>
        <Text style={styles.rowName} numberOfLines={1}>
          {displayNameForUser(item)}
        </Text>
        <Text style={styles.rowUsername} numberOfLines={1}>
          @{item.username}
        </Text>
      </View>
      {!done ? (
        <Pressable
          style={({ pressed }) => [styles.followBtn, pressed && styles.followBtnPressed]}
          onPress={() => void handleFollow()}
          disabled={pending}
          accessibilityRole="button"
          accessibilityLabel={`Follow ${item.username}`}
        >
          {pending ? (
            <ActivityIndicator size="small" color={colors.brand} />
          ) : (
            <Text style={styles.followBtnText}>Follow</Text>
          )}
        </Pressable>
      ) : (
        <View style={styles.followingPill}>
          <MaterialCommunityIcons name="check" size={16} color={colors.textMuted} />
          <Text style={styles.followingText}>Following</Text>
        </View>
      )}
    </View>
  );
}

/** Compact vertical card for horizontal “Suggested for you” carousel. */
export function SuggestedUserCard({ item }: { item: UserSummary }) {
  const colors = useThemeColors();
  const styles = useMemo(() => createCardStyles(colors), [colors]);
  const { follow, pending } = useFollow();
  const [done, setDone] = useState(false);

  const handleFollow = useCallback(async () => {
    try {
      await follow(item.id);
      setDone(true);
    } catch {
      Alert.alert('Could not follow', 'Try again in a moment.');
    }
  }, [follow, item.id]);

  return (
    <View style={styles.card}>
      <UserAvatar seed={item.id} avatarUrl={item.avatar_url} size={56} />
      <Text style={styles.cardName} numberOfLines={2}>
        {displayNameForUser(item)}
      </Text>
      <Text style={styles.cardUsername} numberOfLines={1}>
        @{item.username}
      </Text>
      {!done ? (
        <Pressable
          style={({ pressed }) => [styles.cardFollowBtn, pressed && styles.cardFollowBtnPressed]}
          onPress={() => void handleFollow()}
          disabled={pending}
          accessibilityRole="button"
          accessibilityLabel={`Follow ${item.username}`}
        >
          {pending ? (
            <ActivityIndicator size="small" color={colors.onBrand} />
          ) : (
            <Text style={styles.cardFollowBtnText}>Follow</Text>
          )}
        </Pressable>
      ) : (
        <View style={styles.cardFollowing}>
          <MaterialCommunityIcons name="check" size={14} color={colors.progress} />
          <Text style={styles.cardFollowingText}>Following</Text>
        </View>
      )}
    </View>
  );
}

function createCardStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      width: 158,
      marginRight: 12,
      paddingHorizontal: 12,
      paddingTop: 14,
      paddingBottom: 12,
      borderRadius: 16,
      backgroundColor: colors.surfaceSubtle,
      alignItems: 'center',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
        },
        android: {
          elevation: 2,
        },
        default: {},
      }),
    },
    cardName: {
      marginTop: 10,
      width: '100%',
      textAlign: 'center',
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.sm,
      color: colors.textPrimary,
      lineHeight: 18,
      minHeight: 36,
    },
    cardUsername: {
      marginTop: 4,
      width: '100%',
      textAlign: 'center',
      fontFamily: theme.typography.regular,
      fontSize: theme.fontSizes.meta,
      color: colors.textMuted,
    },
    cardFollowBtn: {
      marginTop: 12,
      alignSelf: 'stretch',
      paddingVertical: 8,
      paddingHorizontal: 8,
      borderRadius: 999,
      backgroundColor: colors.brand,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 36,
    },
    cardFollowBtnPressed: {
      opacity: 0.9,
    },
    cardFollowBtnText: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fontSizes.meta,
      color: colors.onBrand,
    },
    cardFollowing: {
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      alignSelf: 'stretch',
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
    },
    cardFollowingText: {
      fontFamily: theme.typography.medium,
      fontSize: theme.fontSizes.meta,
      color: colors.textMuted,
    },
  });
}

function createRowStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderSubtle,
      gap: 12,
    },
    rowText: {
      flex: 1,
      minWidth: 0,
    },
    rowName: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.sm,
      color: colors.textPrimary,
    },
    rowUsername: {
      marginTop: 2,
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.xs,
      color: colors.textMuted,
    },
    followBtn: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: theme.radius.button,
      borderWidth: 1,
      borderColor: colors.brand,
      backgroundColor: colors.ctaDisabledBackground,
      minWidth: 88,
      alignItems: 'center',
    },
    followBtnPressed: {
      opacity: 0.9,
    },
    followBtnText: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.xs,
      color: colors.brand,
    },
    followingPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 8,
      paddingHorizontal: 10,
    },
    followingText: {
      fontFamily: theme.typography.medium,
      fontSize: theme.fintSizes.xs,
      color: colors.textMuted,
    },
  });
}
