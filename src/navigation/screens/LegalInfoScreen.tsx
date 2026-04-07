import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../presentation/theme/theme';
import { type ThemeColors, useThemeColors } from '../../presentation/theme/ThemeContext';
import type { RootStackParamList } from '../types';

export type LegalInfoKind = RootStackParamList['LegalInfo']['kind'];

const COPY: Record<
  LegalInfoKind,
  { title: string; body: string }
> = {
  news: {
    title: 'News',
    body:
      'Product updates, exam calendar changes, and announcements will appear here. Connect your CMS or blog when ready.',
  },
  privacy: {
    title: 'Privacy Policy',
    body:
      'This placeholder outlines how Mockhu will collect, use, and protect your data. Replace with your final policy and link to the full document on the web if needed.',
  },
  rules: {
    title: 'Rules',
    body:
      'Community guidelines: be respectful, stay on topic for exams and prep, no harassment or spam. Replace with your full rules and moderation policy.',
  },
  agreement: {
    title: 'User Agreement',
    body:
      'Terms of use for the Mockhu service: eligibility, account responsibilities, and limitations of liability. Replace with your binding terms before launch.',
  },
};

type Props = NativeStackScreenProps<RootStackParamList, 'LegalInfo'>;

export function LegalInfoScreen({ route }: Props) {
  const { kind } = route.params;
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const block = COPY[kind];

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: Math.max(insets.bottom, 20) + 16 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        <Text style={styles.body}>{block.body}</Text>
      </View>
      <Text style={styles.hint}>Last updated placeholder — replace with real content and dates.</Text>
    </ScrollView>
  );
}

export function legalInfoTitle(kind: LegalInfoKind): string {
  return COPY[kind].title;
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.surfaceSubtle,
    },
    content: {
      paddingHorizontal: theme.spacing.screenPaddingH,
      paddingTop: 12,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: theme.radius.card,
      padding: 18,
      borderWidth: theme.borderWidth.default,
      borderColor: colors.borderSubtle,
    },
    body: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.textPrimary,
      lineHeight: 22,
    },
    hint: {
      marginTop: 16,
      fontFamily: theme.typography.regular,
      fontSize: theme.fontSizes.meta,
      color: colors.textHint,
      lineHeight: 18,
    },
  });
}
