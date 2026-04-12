import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { type ResolvedExamTag, useResolvedUserExamTags } from '../../api';
import { theme } from '../../presentation/theme/theme';
import { type ThemeColors, useThemeColors } from '../../presentation/theme/ThemeContext';

type Props = {
  userId: string;
  /** Single line of wrapped chips (good inside narrow rows). */
  layout?: 'wrap' | 'scroll';
  /** Smaller chips for dense lists. */
  compact?: boolean;
  /** When `layout` is `wrap`, max chips before "+N". */
  maxVisible?: number;
};

export function UserExamTagChips({
  userId,
  layout = 'wrap',
  compact = false,
  maxVisible = 3,
}: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors, compact), [colors, compact]);
  const tags = useResolvedUserExamTags(userId);

  if (tags.length === 0) return null;

  if (layout === 'scroll') {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        accessibilityRole="list"
        accessibilityLabel="Exams"
      >
        {tags.map((e) => (
          <View key={e.id} style={styles.chip} accessibilityRole="text">
            <Text style={styles.chipText} numberOfLines={1}>
              {e.name}
            </Text>
          </View>
        ))}
      </ScrollView>
    );
  }

  const shown = tags.slice(0, maxVisible);
  const more = tags.length - shown.length;

  return (
    <View style={styles.wrap} accessibilityRole="text" accessibilityLabel="Exams">
      {shown.map((e: ResolvedExamTag) => (
        <View key={e.id} style={styles.chip}>
          <Text style={styles.chipText} numberOfLines={1}>
            {e.name}
          </Text>
        </View>
      ))}
      {more > 0 ? <Text style={styles.moreText}>+{more}</Text> : null}
    </View>
  );
}

function createStyles(colors: ThemeColors, compact: boolean) {
  const padV = compact ? 4 : 6;
  const padH = compact ? 8 : 12;
  const fontSize = compact ? theme.fontSizes.meta : theme.fintSizes.xs;

  return StyleSheet.create({
    scroll: {
      maxHeight: compact ? 30 : 40,
      flexGrow: 0,
      alignSelf: 'stretch',
    },
    scrollContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 2,
      paddingHorizontal: 2,
    },
    wrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 6,
      marginTop: compact ? 4 : 0,
    },
    chip: {
      paddingVertical: padV,
      paddingHorizontal: padH,
      borderRadius: theme.radius.pill,
      backgroundColor: colors.brandLight,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.brandBorder,
      maxWidth: compact ? 140 : 240,
    },
    chipText: {
      fontFamily: theme.typography.semiBold,
      fontSize,
      color: colors.brand,
    },
    moreText: {
      fontFamily: theme.typography.medium,
      fontSize: theme.fontSizes.meta,
      color: colors.textMuted,
    },
  });
}
