import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useMemo, type ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { resetToRoute } from '../navigationRef';
import { theme } from '../../presentation/theme/theme';
import { type ThemeColors, useThemeColors } from '../../presentation/theme/ThemeContext';
import { BrandLogo, BRAND_LOGO_ASPECT } from '../../shared/components/BrandLogo';

type MciName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const SUGGESTIONS: { icon: MciName; title: string; body: string }[] = [
  {
    icon: 'post-outline',
    title: 'Share a post',
    body: 'Ask a question or help others preparing for the same exams.',
  },
  {
    icon: 'account-search-outline',
    title: 'Find people',
    body: 'Follow peers and mentors in your subjects.',
  },
  {
    icon: 'book-open-variant',
    title: 'Track progress',
    body: 'Use Progress to stay on top of your goals.',
  },
];

export function PostOnboardingSuggestionsScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const goMain = useCallback(() => {
    resetToRoute('Main');
  }, []);

  return (
    <View style={[styles.root, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.topBar}>
        <View style={styles.topBarSpacer} />
        <Pressable
          onPress={goMain}
          hitSlop={12}
          style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Skip and go to home"
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 88 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandRow}>
          <BrandLogo style={styles.brandLogo} accessibilityLabel="Mockhu logo" />
        </View>
        <Text style={styles.title} accessibilityRole="header">
          You're set
        </Text>
        <Text style={styles.subtitle}>A few ideas to get started</Text>

        <View style={styles.list}>
          {SUGGESTIONS.map((row) => (
            <View
              key={row.title}
              style={[styles.row, { borderColor: colors.borderSubtle }]}
            >
              <View style={[styles.rowIconWrap, { backgroundColor: colors.surfaceSubtle }]}>
                <MaterialCommunityIcons name={row.icon} size={26} color={colors.brand} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{row.title}</Text>
                <Text style={styles.rowBody}>{row.body}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          onPress={goMain}
          style={({ pressed }) => [styles.primary, pressed && { opacity: 0.92 }]}
          accessibilityRole="button"
          accessibilityLabel="Continue to home"
        >
          <Text style={styles.primaryText}>Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingHorizontal: theme.spacing.screenPaddingH,
      paddingBottom: 8,
    },
    topBarSpacer: {
      flex: 1,
    },
    skipBtn: {
      paddingVertical: 8,
      paddingHorizontal: 4,
    },
    skipText: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.md,
      color: colors.brand,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: theme.spacing.screenPaddingH,
      flexGrow: 1,
    },
    brandRow: {
      alignItems: 'center',
      marginBottom: 20,
    },
    brandLogo: {
      height: 48,
      aspectRatio: BRAND_LOGO_ASPECT,
      maxWidth: '100%',
      borderRadius: theme.radius.card,
    },
    title: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fontSizes.screenTitle,
      lineHeight: 30,
      color: colors.textPrimary,
      letterSpacing: -0.3,
      marginBottom: 8,
    },
    subtitle: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.md,
      color: colors.textMuted,
      marginBottom: 28,
    },
    list: {
      gap: 12,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 14,
      padding: 16,
      borderRadius: theme.radius.input,
      borderWidth: StyleSheet.hairlineWidth,
      backgroundColor: colors.surface,
    },
    rowIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowText: {
      flex: 1,
      gap: 4,
    },
    rowTitle: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.md,
      color: colors.textPrimary,
    },
    rowBody: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.textMuted,
      lineHeight: 20,
    },
    footer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: theme.spacing.screenPaddingH,
      paddingTop: 12,
      backgroundColor: colors.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderSubtle,
    },
    primary: {
      borderRadius: theme.radius.button,
      backgroundColor: colors.brand,
      borderWidth: 1,
      borderColor: colors.buttonBorder,
      minHeight: 52,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
    },
    primaryText: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.md,
      color: colors.onBrand,
    },
  });
}
