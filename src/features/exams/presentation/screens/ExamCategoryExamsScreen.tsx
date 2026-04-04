import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect } from 'react';
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
import { useExamCategoryById, useExamsList } from '../../../../api';
import type { Exam } from '../../../../api';
import { theme } from '../../../../presentation/theme/theme';
import type { RootStackParamList } from '../../../../navigation/types';

export type ExamCategoryExamsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ExamCategory'
>;

export function ExamCategoryExamsScreen({
  navigation,
  route,
}: ExamCategoryExamsScreenProps) {
  const { categoryId } = route.params;
  const { category, loading: catLoading, error: catError } = useExamCategoryById(categoryId);
  const {
    items,
    total,
    loading,
    loadingMore,
    error: listError,
    refresh,
    loadMore,
    hasMore,
  } = useExamsList({ categoryId });

  useEffect(() => {
    navigation.setOptions({
      title: category?.name ?? 'Category',
    });
  }, [category?.name, navigation]);

  const onOpenExam = useCallback(
    (examId: number) => {
      navigation.navigate('ExamDetail', { examId });
    },
    [navigation],
  );

  const renderExam = useCallback(
    ({ item }: { item: Exam }) => (
      <Pressable
        style={({ pressed }) => [styles.examRow, pressed && styles.examRowPressed]}
        onPress={() => onOpenExam(item.id)}
        accessibilityRole="button"
        accessibilityLabel={item.name}
      >
        <View style={styles.examIconWrap}>
          {item.icon_url ? (
            <Image source={{ uri: item.icon_url }} style={styles.examIcon} />
          ) : (
            <MaterialCommunityIcons name="file-document-outline" size={22} color={theme.colors.textMuted} />
          )}
        </View>
        <View style={styles.examBody}>
          <Text style={styles.examTitle} numberOfLines={2}>
            {item.name}
          </Text>
          {item.description ? (
            <Text style={styles.examDesc} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
          <Text style={styles.examMeta}>{item.user_count.toLocaleString()} learners</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.textMuted} />
      </Pressable>
    ),
    [onOpenExam],
  );

  const header = useCallback(() => {
    if (catLoading && !category) {
      return (
        <View style={styles.headerBlock}>
          <ActivityIndicator color={theme.colors.brand} />
        </View>
      );
    }
    if (catError) {
      return (
        <View style={styles.headerBlock}>
          <Text style={styles.errorInline}>{catError.message}</Text>
        </View>
      );
    }
    if (!category) return null;
    return (
      <View style={styles.headerBlock}>
        {category.description ? (
          <Text style={styles.headerDesc}>{category.description}</Text>
        ) : null}
        <Text style={styles.headerMeta}>
          {total.toLocaleString()} exam{total === 1 ? '' : 's'}
        </Text>
      </View>
    );
  }, [catLoading, catError, category, total]);

  const footer = useCallback(() => {
    if (listError && items.length > 0) {
      return (
        <View style={styles.footerBlock}>
          <Text style={styles.errorInline}>{listError.message}</Text>
          <Pressable onPress={refresh} style={styles.retrySmall}>
            <Text style={styles.retrySmallText}>Retry</Text>
          </Pressable>
        </View>
      );
    }
    if (!hasMore || items.length === 0) return null;
    return (
      <View style={styles.footerBlock}>
        {loadingMore ? (
          <ActivityIndicator color={theme.colors.brand} />
        ) : (
          <Pressable
            style={styles.loadMore}
            onPress={() => void loadMore()}
            accessibilityRole="button"
            accessibilityLabel="Load more exams"
          >
            <Text style={styles.loadMoreText}>Load more</Text>
          </Pressable>
        )}
      </View>
    );
  }, [listError, items.length, hasMore, loadingMore, loadMore, refresh]);

  if (loading && items.length === 0 && !listError) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.brand} />
      </View>
    );
  }

  if (listError && items.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{listError.message}</Text>
        <Pressable style={styles.retry} onPress={refresh}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderExam}
      ListHeaderComponent={header}
      ListFooterComponent={footer}
      contentContainerStyle={styles.listContent}
      refreshControl={<RefreshControl refreshing={loading && items.length > 0} onRefresh={refresh} />}
      onEndReached={() => {
        if (hasMore && !loadingMore && !loading) void loadMore();
      }}
      onEndReachedThreshold={0.3}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No exams in this category.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    flexGrow: 1,
  },
  headerBlock: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerDesc: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textMuted,
    lineHeight: 20,
  },
  headerMeta: {
    marginTop: 8,
    fontFamily: theme.typography.medium,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.textMuted,
  },
  examRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.borderSubtle,
    gap: 12,
  },
  examRowPressed: {
    opacity: 0.9,
  },
  examIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  examIcon: {
    width: 40,
    height: 40,
  },
  examBody: {
    flex: 1,
    minWidth: 0,
  },
  examTitle: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.md,
    color: theme.colors.textPrimary,
  },
  examDesc: {
    marginTop: 4,
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  examMeta: {
    marginTop: 4,
    fontFamily: theme.typography.medium,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.textMuted,
  },
  footerBlock: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  loadMore: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  loadMoreText: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textPrimary,
  },
  retrySmall: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  retrySmallText: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.brand,
  },
  errorInline: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textPrimary,
    textAlign: 'center',
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
    borderColor: theme.colors.borderStrong,
  },
  retryText: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textPrimary,
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textMuted,
  },
});
