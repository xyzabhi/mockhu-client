import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useInterestSuggestions, useUserSuggestions } from '../../api';
import { theme } from '../../presentation/theme/theme';
import { type ThemeColors, useThemeColors } from '../../presentation/theme/ThemeContext';
import type { UserSummary } from '../../api/user/types';
import { SuggestedUserRow } from '../../shared/components/SuggestedUserRow';
import { UserListSkeleton } from '../../shared/components/skeleton';
import type { RootStackParamList } from '../types';

type ListItem =
  | { kind: 'header'; title: string; icon: string }
  | { kind: 'user'; user: UserSummary }
  | { kind: 'empty'; message: string }
  | { kind: 'error'; message: string; onRetry: () => void }
  | { kind: 'showMore'; onPress: () => void }
  | { kind: 'loading' }
  | { kind: 'end' };

export function SuggestedUsersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const goToProfile = useCallback(
    (userId: string) => navigation.push('UserProfile', { userId }),
    [navigation],
  );
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const interest = useInterestSuggestions();
  const general = useUserSuggestions();

  const initialLoading = interest.loading && general.loading;

  const data = useMemo<ListItem[]>(() => {
    const rows: ListItem[] = [];

    if (interest.items.length > 0 || interest.loading || interest.error) {
      rows.push({ kind: 'header', title: 'People with similar interests', icon: 'account-star-outline' });

      if (interest.error && interest.items.length === 0) {
        rows.push({ kind: 'error', message: interest.error.message, onRetry: interest.refresh });
      } else {
        for (const u of interest.items) {
          rows.push({ kind: 'user', user: u });
        }
        if (interest.loadingMore) {
          rows.push({ kind: 'loading' });
        } else if (interest.hasMore) {
          rows.push({ kind: 'showMore', onPress: () => void interest.loadMore() });
        } else if (interest.items.length > 0) {
          rows.push({ kind: 'end' });
        }
      }
    }

    const interestIds = new Set(interest.items.map((u) => u.id));
    const dedupedGeneral = general.items.filter((u) => !interestIds.has(u.id));

    if (dedupedGeneral.length > 0 || general.loading || general.error) {
      rows.push({ kind: 'header', title: 'Other suggestions', icon: 'account-multiple-outline' });

      if (general.error && dedupedGeneral.length === 0) {
        rows.push({ kind: 'error', message: general.error.message, onRetry: general.refresh });
      } else {
        for (const u of dedupedGeneral) {
          rows.push({ kind: 'user', user: u });
        }
        if (general.loadingMore) {
          rows.push({ kind: 'loading' });
        } else if (general.hasMore) {
          rows.push({ kind: 'showMore', onPress: () => void general.loadMore() });
        } else if (dedupedGeneral.length > 0) {
          rows.push({ kind: 'end' });
        }
      }
    }

    if (rows.length === 0 && !initialLoading) {
      rows.push({ kind: 'empty', message: 'No suggestions right now. Check back later!' });
    }

    return rows;
  }, [interest, general, initialLoading]);

  const listPaddingBottom = Math.max(insets.bottom, 16) + 8;

  const keyExtractor = useCallback((item: ListItem, index: number) => {
    if (item.kind === 'user') return `user-${item.user.id}`;
    return `${item.kind}-${index}`;
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      switch (item.kind) {
        case 'header':
          return (
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name={item.icon as 'account-star-outline'}
                size={20}
                color={colors.textMuted}
              />
              <Text style={styles.sectionHeaderText}>{item.title}</Text>
            </View>
          );
        case 'user':
          return <SuggestedUserRow item={item.user} onPress={goToProfile} />;
        case 'empty':
          return <Text style={styles.empty}>{item.message}</Text>;
        case 'error':
          return (
            <View style={styles.errorBlock}>
              <Text style={styles.errorText}>{item.message}</Text>
              <Pressable style={styles.retryBtn} onPress={item.onRetry}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </Pressable>
            </View>
          );
        case 'showMore':
          return (
            <View style={styles.showMoreWrap}>
              <Pressable
                style={({ pressed }) => [styles.showMoreBtn, pressed && styles.showMoreBtnPressed]}
                onPress={item.onPress}
                accessibilityRole="button"
                accessibilityLabel="Show more suggestions"
              >
                <Text style={styles.showMoreText}>Show more</Text>
              </Pressable>
            </View>
          );
        case 'loading':
          return (
            <View style={styles.showMoreWrap}>
              <ActivityIndicator size="small" color={colors.brand} />
            </View>
          );
        case 'end':
          return null;
        default:
          return null;
      }
    },
    [colors, goToProfile, styles],
  );

  return (
    <View style={styles.root}>
      <Text style={styles.subtitle}>
        Follow people preparing for the same exams. You can always find more later.
      </Text>

      {initialLoading ? (
        <UserListSkeleton count={8} />
      ) : (
        <FlatList
          style={styles.list}
          data={data}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: listPaddingBottom }]}
        />
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.surfaceSubtle,
    },
    subtitle: {
      paddingHorizontal: theme.spacing.screenPaddingH,
      paddingTop: 8,
      paddingBottom: 12,
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.textMuted,
      lineHeight: 20,
    },
    list: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: theme.spacing.screenPaddingH,
      flexGrow: 1,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingTop: 20,
      paddingBottom: 8,
    },
    sectionHeaderText: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.md,
      color: colors.textPrimary,
    },
    errorBlock: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    errorText: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.danger,
      textAlign: 'center',
      marginBottom: 12,
    },
    retryBtn: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: theme.radius.button,
      backgroundColor: colors.brand,
    },
    retryBtnText: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.sm,
      color: colors.onBrand,
    },
    empty: {
      textAlign: 'center',
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.textMuted,
      paddingVertical: 32,
    },
    showMoreWrap: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    showMoreBtn: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: theme.radius.button,
      borderWidth: theme.borderWidth.default,
      borderColor: colors.brand,
      backgroundColor: colors.surface,
      minWidth: 160,
      alignItems: 'center',
    },
    showMoreBtnPressed: {
      opacity: 0.88,
    },
    showMoreText: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.sm,
      color: colors.brand,
    },
  });
}
