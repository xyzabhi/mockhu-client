import type { ReactNode } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../../../presentation/theme/theme';

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

const HERO_FLEX = 3;
const SHEET_FLEX = 7;

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 12);

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <Image source={require('../../../../../assets/splash-logo.png')} style={styles.logo} />
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    backgroundColor: '#ffffff',
  },
  hero: {
    flex: HERO_FLEX,
    minHeight: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  logo: {
    width: 112,
    height: 112,
    resizeMode: 'contain',
  },
  sheet: {
    flex: SHEET_FLEX,
    minHeight: 0,
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: theme.spacing.screenPaddingH,
    paddingTop: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 6,
  },
  titleBlock: {
    alignItems: 'center',
  },
  title: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fontSizes.screenTitle,
    lineHeight: 28,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  description: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fontSizes.body,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  sheetCenterSlot: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    marginTop: 16,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 12,
    paddingTop: 8,
  },
  footerText: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerTextLink: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.footerLink,
    textDecorationLine: 'underline',
    textDecorationColor: theme.colors.footerLinkUnderline,
  },
});
