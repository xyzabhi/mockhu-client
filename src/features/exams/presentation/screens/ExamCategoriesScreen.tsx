import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useExamCategories, type ExamCategory } from '../../../../api';
import { theme } from '../../../../presentation/theme/theme';
import type { RootStackParamList } from '../../../../navigation/types';

export type ExamCategoriesScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ExamCategories'
>;

export function ExamCategoriesScreen({ navigation }: ExamCategoriesScreenProps) {
  const { categories, loading, error, refresh } = useExamCategories();

  const onSelect = useCallback(
    (categoryId: number) => {
      navigation.navigate('ExamCategory', { categoryId });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: ExamCategory }) => (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => onSelect(item.id)}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}, ${item.user_count} users`}
      >
        <View style={styles.cardIconWrap}>
          {item.icon_url ? (
            <Image source={{ uri: item.icon_url }} style={styles.cardIcon} />
          ) : (
            <MaterialCommunityIcons name="folder-outline" size={22} color={theme.colors.textMuted} />
          )}
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.name}
          </Text>
          {item.description ? (
            <Text style={styles.cardDesc} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
          <Text style={styles.cardMeta}>{item.user_count.toLocaleString()} learners</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.textMuted} />
      </Pressable>
    ),
    [onSelect],
  );

  if (loading && !categories) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.brand} />
      </View>
    );
  }

  if (error && !categories?.length) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error.message}</Text>
        <Pressable style={styles.retry} onPress={refresh} accessibilityRole="button">
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={categories ?? []}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderItem}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl refreshing={loading && Boolean(categories?.length)} onRefresh={refresh} />
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No categories yet.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexGrow: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: '#ffffff',
    gap: 12,
  },
  cardPressed: {
    opacity: 0.92,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardIcon: {
    width: 44,
    height: 44,
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.md,
    color: theme.colors.textPrimary,
  },
  cardDesc: {
    marginTop: 4,
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  cardMeta: {
    marginTop: 6,
    fontFamily: theme.typography.medium,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.textMuted,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  errorText: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  retry: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  retryText: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textPrimary,
  },
  empty: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textMuted,
  },
});
