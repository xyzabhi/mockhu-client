import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandLogoAppOrRemote, BRAND_LOGO_ASPECT } from '../../../../shared/components/BrandLogo';
import { theme } from '../../../../presentation/theme/theme';
import { type ThemeColors, useThemeColors } from '../../../../presentation/theme/ThemeContext';

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

const HERO_FLEX = 3;
const SHEET_FLEX = 7;

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createAuthLayoutStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 12);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.hero}>
        <BrandLogoAppOrRemote style={styles.logo} />
      </View>

      <View style={[styles.sheet, { paddingBottom: bottomPad }]}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{subtitle}</Text>
        </View>

        <View style={styles.sheetCenterSlot}>{children}</View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our{' '}
            <Text style={styles.footerTextLink}>Terms of Service</Text>
            {', '}
            <Text style={styles.footerTextLink}>Privacy Policy</Text>
            {', and '}
            <Text style={styles.footerTextLink}>Cookies Policy</Text>.
          </Text>
        </View>
      </View>
    </View>
  );
}

function createAuthLayoutStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      width: '100%',
      backgroundColor: colors.surfaceSubtle,
    },
    hero: {
      flex: HERO_FLEX,
      minHeight: 0,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 20,
    },
    logo: {
      height: 120,
      aspectRatio: BRAND_LOGO_ASPECT,
      maxWidth: '88%',
      alignSelf: 'center',
      borderRadius: 16,
    },
    sheet: {
      flex: SHEET_FLEX,
      minHeight: 0,
      width: '100%',
      backgroundColor: colors.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: theme.spacing.screenPaddingH,
      paddingTop: 26,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 20,
        },
        android: {
          elevation: 12,
        },
        default: {},
      }),
    },
    titleBlock: {
      alignItems: 'center',
    },
    title: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fontSizes.screenTitle,
      lineHeight: 30,
      letterSpacing: -0.35,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    description: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fontSizes.body,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 10,
      lineHeight: 22,
      maxWidth: 320,
    },
    sheetCenterSlot: {
      flex: 1,
      minHeight: 0,
      width: '100%',
      marginTop: 20,
    },
    footer: {
      width: '100%',
      alignItems: 'center',
      flexShrink: 0,
      marginTop: 16,
      paddingTop: 10,
    },
    footerText: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.xs,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 18,
    },
    footerTextLink: {
      fontFamily: theme.typography.medium,
      fontSize: theme.fintSizes.xs,
      color: colors.brand,
      textDecorationLine: 'underline',
      textDecorationColor: colors.brandBorder,
    },
  });
}
