import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GoogleLogo } from '../../../../presentation/components/GoogleLogo';
import { theme } from '../../../../presentation/theme/theme';
import { type ThemeColors, useThemeColors } from '../../../../presentation/theme/ThemeContext';

type SocialAuthButtonsProps = {
  switchCtaLabel: string;
  onSwitchMode: () => void;
  onPressPhone: () => void;
  onPressEmail: () => void;
  /** Google OAuth — `expo-auth-session` + `POST /auth/google`. */
  onPressGoogle?: () => void | Promise<void>;
  googleBusy?: boolean;
};

function SocialButton({
  leading,
  label,
  onPress,
  styles,
}: {
  leading: ReactNode;
  label: string;
  onPress: () => void;
  styles: ReturnType<typeof createSocialStyles>;
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

export function SocialAuthButtons({
  switchCtaLabel,
  onSwitchMode,
  onPressPhone,
  onPressEmail,
  onPressGoogle,
  googleBusy = false,
}: SocialAuthButtonsProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createSocialStyles(colors), [colors]);

  return (
    <ScrollView
      style={styles.sheetBodyScroll}
      contentContainerStyle={styles.sheetBodyScrollContent}
      bounces
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.buttonsGroup}>
        <SocialButton
          styles={styles}
          leading={<MaterialCommunityIcons name="phone" size={22} color={colors.iconPhone} />}
          label="Phone"
          onPress={onPressPhone}
        />
        <SocialButton
          styles={styles}
          leading={
            <MaterialCommunityIcons name="email-outline" size={22} color={colors.iconEmail} />
          }
          label="Email"
          onPress={onPressEmail}
        />
        <Pressable
          onPress={() => void onPressGoogle?.()}
          disabled={googleBusy || !onPressGoogle}
          android_ripple={{ color: 'rgba(17, 24, 39, 0.08)' }}
          style={({ pressed }) => [
            styles.socialButton,
            pressed && !googleBusy && onPressGoogle && styles.socialButtonPressed,
            (googleBusy || !onPressGoogle) && styles.socialButtonDisabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Continue with Google"
          accessibilityState={{ disabled: googleBusy || !onPressGoogle }}
        >
          <View style={styles.socialIconSlot}>
            <GoogleLogo size={22} />
          </View>
          {googleBusy ? (
            <View style={styles.googleBusySlot}>
              <ActivityIndicator size="small" color={colors.textPrimary} />
            </View>
          ) : (
            <Text style={styles.socialLabel} numberOfLines={1}>
              Google
            </Text>
          )}
        </Pressable>
        <Pressable
          onPress={onSwitchMode}
          android_ripple={{ color: 'rgba(124, 58, 237, 0.12)' }}
          style={({ pressed }) => [styles.switchCta, pressed && styles.switchCtaPressed]}
        >
          <Text style={styles.switchCtaText}>{switchCtaLabel}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const ICON_SLOT = 48;

function createSocialStyles(colors: ThemeColors) {
  const cardShadow = Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
    },
    android: { elevation: 2 },
    default: {},
  });

  return StyleSheet.create({
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
    buttonsGroup: {
      width: '100%',
      gap: 12,
    },
    socialButton: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 24,
      borderWidth: 0,
      backgroundColor: colors.surfaceSubtle,
      paddingVertical: 14,
      paddingHorizontal: 4,
      minHeight: 54,
      overflow: 'hidden',
      ...cardShadow,
    },
    socialButtonPressed: {
      opacity: 0.92,
      backgroundColor: colors.brandLight,
    },
    socialButtonDisabled: {
      opacity: 0.55,
    },
    googleBusySlot: {
      flex: 1,
      marginRight: ICON_SLOT,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 24,
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
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.md,
      color: colors.textPrimary,
    },
    /** Secondary — outline (sign-up options stay visually primary). */
    switchCta: {
      borderRadius: 999,
      borderWidth: 2,
      borderColor: colors.brand,
      backgroundColor: colors.surface,
      paddingVertical: 14,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
      overflow: 'hidden',
    },
    switchCtaPressed: {
      opacity: 0.9,
      backgroundColor: colors.brandLight,
    },
    switchCtaText: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.md,
      color: colors.brand,
      textAlign: 'center',
    },
  });
}
