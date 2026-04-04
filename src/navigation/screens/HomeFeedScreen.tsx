import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { theme } from '../../presentation/theme/theme';

type FeedItem = {
  id: string;
  title: string;
  author: string;
  examTag: string;
  excerpt: string;
  likes: number;
  comments: number;
};

const MOCK_FEED: FeedItem[] = [
  {
    id: '1',
    title: '5 tricks for last-minute revision',
    author: 'StudyWithSam',
    examTag: 'JEE',
    excerpt:
      'Spaced repetition beats cramming — here is a 20-minute loop you can run the night before.',
    likes: 128,
    comments: 14,
  },
  {
    id: '2',
    title: 'How I fixed my mock test scores in two weeks',
    author: 'Priya M.',
    examTag: 'NEET',
    excerpt:
      'I tracked every wrong answer in a simple sheet and reviewed only those topics. Game changer.',
    likes: 89,
    comments: 7,
  },
  {
    id: '3',
    title: 'Diagram-heavy chapters: read in this order',
    author: 'BioNotes Daily',
    examTag: 'CBSE XII',
    excerpt:
      'Start with flowcharts, then labels, then paragraphs — saves time when the paper is visual.',
    likes: 256,
    comments: 31,
  },
  {
    id: '4',
    title: 'Morning routine before a mock exam',
    author: 'FocusLab',
    examTag: 'CAT',
    excerpt:
      'Light breakfast, 10 min walk, one page of formulas — nothing new on exam day.',
    likes: 64,
    comments: 5,
  },
];

export function HomeFeedScreen() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MOCK_FEED;
    return MOCK_FEED.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.author.toLowerCase().includes(q) ||
        item.examTag.toLowerCase().includes(q) ||
        item.excerpt.toLowerCase().includes(q),
    );
  }, [query]);

  const renderItem = useCallback(
    ({ item }: { item: FeedItem }) => (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTag}>{item.examTag}</Text>
          <Text style={styles.cardMeta}>{item.author}</Text>
        </View>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.cardExcerpt} numberOfLines={3}>
          {item.excerpt}
        </Text>
        <View style={styles.cardFooter}>
          <View style={styles.stat}>
            <MaterialCommunityIcons
              name="heart-outline"
              size={18}
              color={theme.colors.textMuted}
            />
            <Text style={styles.statText}>{item.likes}</Text>
          </View>
          <View style={styles.stat}>
            <MaterialCommunityIcons
              name="comment-outline"
              size={18}
              color={theme.colors.textMuted}
            />
            <Text style={styles.statText}>{item.comments}</Text>
          </View>
        </View>
      </Pressable>
    ),
    [],
  );

  return (
    <View style={styles.root}>
      <View style={styles.searchRow}>
        <MaterialCommunityIcons
          name="magnify"
          size={22}
          color={theme.colors.textMuted}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search Mockhu"
          placeholderTextColor={theme.colors.textHint}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
          accessibilityLabel="Search feed"
        />
      </View>
      <Text style={styles.sectionLabel}>For you</Text>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.empty}>No posts match your search.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.surfaceSubtle,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.screenPaddingH,
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
    minHeight: 44,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.md,
    color: theme.colors.textPrimary,
    paddingVertical: 10,
  },
  sectionLabel: {
    marginHorizontal: theme.spacing.screenPaddingH,
    marginBottom: 10,
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fontSizes.sectionHead,
    color: theme.colors.textMuted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  listContent: {
    paddingHorizontal: theme.spacing.screenPaddingH,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    padding: theme.spacing.cardPaddingH,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  cardPressed: {
    opacity: 0.96,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTag: {
    fontFamily: theme.typography.medium,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.brand,
    backgroundColor: theme.colors.brandLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.badge,
    overflow: 'hidden',
  },
  cardMeta: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.textMuted,
  },
  cardTitle: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.md,
    color: theme.colors.textPrimary,
    lineHeight: 22,
    marginBottom: 6,
  },
  cardExcerpt: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textMuted,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontFamily: theme.typography.medium,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.textMuted,
  },
  empty: {
    textAlign: 'center',
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textMuted,
    paddingVertical: 32,
  },
});
