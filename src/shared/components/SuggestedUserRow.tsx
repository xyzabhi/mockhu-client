import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFollow } from '../../api';
import type { UserSummary } from '../../api/user/types';
import { theme } from '../../presentation/theme/theme';
import { UserAvatar } from './UserAvatar';

export function displayNameForUser(u: UserSummary): string {
  const parts = [u.first_name?.trim(), u.last_name?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : u.username;
}

export function SuggestedUserRow({ item }: { item: UserSummary }) {
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
            <ActivityIndicator size="small" color={theme.colors.brand} />
          ) : (
            <Text style={styles.followBtnText}>Follow</Text>
          )}
        </Pressable>
      ) : (
        <View style={styles.followingPill}>
          <MaterialCommunityIcons name="check" size={16} color={theme.colors.textMuted} />
          <Text style={styles.followingText}>Following</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.borderSubtle,
    gap: 12,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  rowName: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textPrimary,
  },
  rowUsername: {
    marginTop: 2,
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.textMuted,
  },
  followBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.radius.button,
    borderWidth: 1,
    borderColor: theme.colors.brand,
    backgroundColor: theme.colors.ctaDisabledBackground,
    minWidth: 88,
    alignItems: 'center',
  },
  followBtnPressed: {
    opacity: 0.9,
  },
  followBtnText: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.brand,
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
    color: theme.colors.textMuted,
  },
});
