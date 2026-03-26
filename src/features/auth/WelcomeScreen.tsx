import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GoogleLogo } from '../../presentation/components/GoogleLogo';
import { theme } from '../../presentation/theme/theme';

function SocialButton({
  leading,
  label,
  onPress,
}: {
  leading: ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(17, 24, 39, 0.08)' }}
      style={({ pressed }) => [
        styles.socialButton,
        pressed && styles.socialButtonPressed,
      ]}
    >
      <View style={styles.socialIconSlot}>{leading}</View>
      <Text style={styles.socialLabel} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 12);

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <Image
          source={require('../../../assets/splash-logo.png')}
          style={styles.logo}
        />
      </View>

      <View style={[styles.sheet, { paddingBottom: bottomPad }]}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.description}>
            Join thousands of students from around the world
          </Text>
        </View>

        <View style={styles.sheetCenterSlot}>
          <ScrollView
            style={styles.sheetBodyScroll}
            contentContainerStyle={styles.sheetBodyScrollContent}
            bounces
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
          >
            <View style={styles.buttonsGroup}>
              <SocialButton
                leading={
                  <MaterialCommunityIcons
                    name="phone"
                    size={22}
                    color={theme.colors.iconPhone}
                  />
                }
                label="Phone"
                onPress={() => {}}
              />
              <SocialButton
                leading={
                  <MaterialCommunityIcons
                    name="email-outline"
                    size={22}
                    color={theme.colors.iconEmail}
                  />
                }
                label="Email"
                onPress={() => {}}
              />
              <SocialButton
                leading={<GoogleLogo size={22} />}
                label="Google"
                onPress={() => {}}
              />
              <SocialButton
                leading={
                  <MaterialCommunityIcons
                    name="facebook"
                    size={22}
                    color={theme.colors.iconFacebook}
                  />
                }
                label="Facebook"
                onPress={() => {}}
              />
              <SocialButton
                leading={
                  <MaterialCommunityIcons
                    name="apple"
                    size={22}
                    color={theme.colors.iconApple}
                  />
                }
                label="Apple"
                onPress={() => {}}
              />
              <Pressable
                onPress={() => {}}
                android_ripple={{ color: 'rgba(0, 0, 0, 0.12)' }}
                style={({ pressed }) => [
                  styles.loginCta,
                  pressed && styles.loginCtaPressed,
                ]}
              >
                <Text style={styles.loginCtaText}>
                  Already have an account? Login
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>

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

const ICON_SLOT = 48;

/** Bigger `HERO_FLEX` vs `SHEET_FLEX` = shorter sheet (e.g. 2 and 1 ≈ 33% sheet). */
const HERO_FLEX = 3;
const SHEET_FLEX = 7;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    backgroundColor: '#f6f8fc',
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
    paddingHorizontal: 20,
    paddingTop: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 6,
  },
  sheetCenterSlot: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    marginTop: 16,
  },
  sheetBodyScroll: {
    flex: 1,
    minHeight: 0,
    width: '100%',
  },
  sheetBodyScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 8,
  },
  titleBlock: {
    alignItems: 'center',
  },
  title: {
    fontFamily: theme.typography.bold,
    fontSize: theme.fintSizes.xxl,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  description: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  buttonsGroup: {
    width: '100%',
    gap: 10,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 4,
    overflow: 'hidden',
  },
  socialButtonPressed: {
    opacity: 0.85,
    backgroundColor: '#F9FAFB',
  },
  socialIconSlot: {
    width: ICON_SLOT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialLabel: {
    flex: 1,
    marginRight: ICON_SLOT,
    textAlign: 'center',
    fontFamily: theme.typography.bold,
    fontSize: theme.fintSizes.md,
    color: theme.colors.textPrimary,
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
  loginCta: {
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.brand,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    overflow: 'hidden',
  },
  loginCtaPressed: {
    opacity: 0.92,
  },
  loginCtaText: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.md,
    color: '#000000',
    textAlign: 'center',
  },
});

export default WelcomeScreen;
