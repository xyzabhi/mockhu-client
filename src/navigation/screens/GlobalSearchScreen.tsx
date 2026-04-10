import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGlobalSearch } from '../../api/hooks/useGlobalSearch';
import type {
  SearchExamCategoryResult,
  SearchExamResult,
  SearchPostResult,
  SearchSubjectResult,
  SearchTopicResult,
  SearchUserResult,
} from '../../api/search/types';
import { theme } from '../../presentation/theme/theme';
import { type ThemeColors, useThemeColors } from '../../presentation/theme/ThemeContext';
import { UserAvatar } from '../../shared/components/UserAvatar';
import type { RootStackParamList } from '../types';

function truncate(text: string, max: number): string {
  if (!text) return '';
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

function displayName(u: SearchUserResult): string {
  const parts = [u.first_name?.trim(), u.last_name?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : u.username;
}

export function GlobalSearchScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const inputRef = useRef<TextInput>(null);
  const { query, setQuery, results, loading, error, isEmpty } = useGlobalSearch();

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  const goUser = useCallback(
    (id: string) => navigation.push('UserProfile', { userId: id }),
    [navigation],
  );
  const goPost = useCallback(
    (id: string) => navigation.push('PostComments', { postId: id }),
    [navigation],
  );
  const goExam = useCallback(
    (id: number) => navigation.push('ExamDetail', { examId: id }),
    [navigation],
  );
  const goCategory = useCallback(
    (id: number) => navigation.push('ExamCategory', { categoryId: id }),
    [navigation],
  );

  const hasQuery = query.trim().length > 0;
  const hasResults =
    results.users.length > 0 ||
    results.posts.length > 0 ||
    results.exams.length > 0 ||
    results.exam_categories.length > 0 ||
    results.topics.length > 0 ||
    results.subjects.length > 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backBtn}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.inputWrap}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textMuted} />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Search users, posts, exams…"
            placeholderTextColor={colors.textHint}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
            accessibilityLabel="Search"
          />
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {!hasQuery ? (
          <View style={styles.placeholderWrap}>
            <MaterialCommunityIcons name="magnify" size={48} color={colors.textHint} />
            <Text style={styles.placeholderText}>Search for users, posts, exams, and more</Text>
          </View>
        ) : loading && !hasResults ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.brand} />
          </View>
        ) : error && !hasResults ? (
          <View style={styles.placeholderWrap}>
            <Text style={styles.errorText}>{error.message}</Text>
          </View>
        ) : isEmpty ? (
          <View style={styles.placeholderWrap}>
            <MaterialCommunityIcons name="magnify-close" size={48} color={colors.textHint} />
            <Text style={styles.placeholderText}>No results for "{query.trim()}"</Text>
          </View>
        ) : (
          <>
            {loading ? (
              <ActivityIndicator size="small" color={colors.brand} style={styles.inlineSpinner} />
            ) : null}

            {/* Users */}
            {results.users.length > 0 ? (
              <Section title="People" icon="account-outline" styles={styles} colors={colors}>
                {results.users.map((u) => (
                  <Pressable
                    key={u.id}
                    style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                    onPress={() => goUser(u.id)}
                    accessibilityRole="button"
                  >
                    <UserAvatar seed={u.id} avatarUrl={u.avatar_url} size={40} />
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle} numberOfLines={1}>{displayName(u)}</Text>
                      <Text style={styles.rowSub} numberOfLines={1}>@{u.username}</Text>
                    </View>
                  </Pressable>
                ))}
              </Section>
            ) : null}

            {/* Posts */}
            {results.posts.length > 0 ? (
              <Section title="Posts" icon="file-document-outline" styles={styles} colors={colors}>
                {results.posts.map((p) => (
                  <Pressable
                    key={p.id}
                    style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                    onPress={() => goPost(p.id)}
                    accessibilityRole="button"
                  >
                    <View style={styles.postIcon}>
                      <MaterialCommunityIcons name="file-document-outline" size={22} color={colors.textMuted} />
                    </View>
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle} numberOfLines={1}>{p.title || 'Untitled'}</Text>
                      <Text style={styles.rowSub} numberOfLines={2}>{truncate(p.content, 100)}</Text>
                      <View style={styles.postMeta}>
                        <MaterialCommunityIcons name="star" size={13} color={colors.starGold} />
                        <Text style={styles.postMetaText}>{p.star_count}</Text>
                        {p.author ? (
                          <Text style={styles.postMetaText}>· {p.author}</Text>
                        ) : null}
                      </View>
                    </View>
                  </Pressable>
                ))}
              </Section>
            ) : null}

            {/* Exams */}
            {results.exams.length > 0 ? (
              <Section title="Exams" icon="school-outline" styles={styles} colors={colors}>
                {results.exams.map((e) => (
                  <Pressable
                    key={e.id}
                    style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                    onPress={() => goExam(e.id)}
                    accessibilityRole="button"
                  >
                    <View style={styles.examIcon}>
                      <MaterialCommunityIcons name="school-outline" size={22} color={colors.brand} />
                    </View>
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle} numberOfLines={1}>{e.name}</Text>
                      {e.user_count > 0 ? (
                        <Text style={styles.rowSub}>{e.user_count.toLocaleString()} learners</Text>
                      ) : null}
                    </View>
                  </Pressable>
                ))}
              </Section>
            ) : null}

            {/* Exam Categories */}
            {results.exam_categories.length > 0 ? (
              <Section title="Categories" icon="shape-outline" styles={styles} colors={colors}>
                {results.exam_categories.map((c) => (
                  <Pressable
                    key={c.id}
                    style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                    onPress={() => goCategory(c.id)}
                    accessibilityRole="button"
                  >
                    <View style={styles.examIcon}>
                      <MaterialCommunityIcons name="shape-outline" size={22} color={colors.progress} />
                    </View>
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle} numberOfLines={1}>{c.name}</Text>
                      {c.user_count > 0 ? (
                        <Text style={styles.rowSub}>{c.user_count.toLocaleString()} learners</Text>
                      ) : null}
                    </View>
                  </Pressable>
                ))}
              </Section>
            ) : null}

            {/* Topics */}
            {results.topics.length > 0 ? (
              <Section title="Topics" icon="tag-outline" styles={styles} colors={colors}>
                {results.topics.map((t) => (
                  <View key={t.id} style={styles.row}>
                    <View style={styles.examIcon}>
                      <MaterialCommunityIcons name="tag-outline" size={22} color={colors.textMuted} />
                    </View>
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle} numberOfLines={1}>{t.name}</Text>
                    </View>
                  </View>
                ))}
              </Section>
            ) : null}

            {/* Subjects */}
            {results.subjects.length > 0 ? (
              <Section title="Subjects" icon="book-open-outline" styles={styles} colors={colors}>
                {results.subjects.map((s) => (
                  <View key={s.id} style={styles.row}>
                    <View style={styles.examIcon}>
                      <MaterialCommunityIcons name="book-open-outline" size={22} color={colors.textMuted} />
                    </View>
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle} numberOfLines={1}>{s.name}</Text>
                    </View>
                  </View>
                ))}
              </Section>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Section({
  title,
  icon,
  styles,
  colors,
  children,
}: {
  title: string;
  icon: string;
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name={icon as 'magnify'} size={18} color={colors.textMuted} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderSubtle,
    },
    backBtn: {
      padding: 4,
    },
    inputWrap: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: colors.surfaceSubtle,
    },
    input: {
      flex: 1,
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.md,
      color: colors.textPrimary,
      paddingVertical: 0,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: theme.spacing.screenPaddingH,
    },
    placeholderWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 80,
      gap: 12,
    },
    placeholderText: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.md,
      color: colors.textMuted,
      textAlign: 'center',
      paddingHorizontal: 24,
      lineHeight: 22,
    },
    errorText: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.md,
      color: colors.danger,
      textAlign: 'center',
    },
    loadingWrap: {
      paddingTop: 80,
      alignItems: 'center',
    },
    inlineSpinner: {
      alignSelf: 'center',
      marginVertical: 8,
    },
    section: {
      marginTop: 20,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    sectionTitle: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.sm,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderSubtle,
    },
    rowPressed: {
      opacity: 0.7,
    },
    rowText: {
      flex: 1,
      minWidth: 0,
    },
    rowTitle: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.md,
      color: colors.textPrimary,
    },
    rowSub: {
      marginTop: 2,
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.xs,
      color: colors.textMuted,
      lineHeight: 18,
    },
    postIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: colors.surfaceSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    postMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
    },
    postMetaText: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.xs,
      color: colors.textMuted,
    },
    examIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: colors.surfaceSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
