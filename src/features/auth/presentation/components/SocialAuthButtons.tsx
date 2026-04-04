import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GoogleLogo } from '../../../../presentation/components/GoogleLogo';
import { theme } from '../../../../presentation/theme/theme';

type SocialAuthButtonsProps = {
  switchCtaLabel: string;
  onSwitchMode: () => void;
  onPressPhone: () => void;
  onPressEmail: () => void;
};

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

export function SocialAuthButtons({
  switchCtaLabel,
  onSwitchMode,
  onPressPhone,
  onPressEmail,
}: SocialAuthButtonsProps) {
  return (
    <ScrollView
      style={styles.sheetBodyScroll}
      contentContainerStyle={styles.sheetBodyScrollContent}
      bounces
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator
    >
      <View style={styles.buttonsGroup}>
        <SocialButton
          leading={<MaterialCommunityIcons name="phone" size={22} color={theme.colors.iconPhone} />}
          label="Phone"
          onPress={onPressPhone}
        />
        <SocialButton
          leading={
            <MaterialCommunityIcons name="email-outline" size={22} color={theme.colors.iconEmail} />
          }
          label="Email"
          onPress={onPressEmail}
        />
        <SocialButton leading={<GoogleLogo size={22} />} label="Google" onPress={() => {}} />
        {/* This is not part of MVP */}
        {/* <SocialButton
          leading={<MaterialCommunityIcons name="facebook" size={22} color={theme.colors.iconFacebook} />}
          label="Facebook"
          onPress={() => {}}
        /> */}
        {/* <SocialButton
          leading={<MaterialCommunityIcons name="apple" size={22} color={theme.colors.iconApple} />}
          label="Apple"
          onPress={() => {}}
        /> */}
        <Pressable
          onPress={onSwitchMode}
          android_ripple={{ color: 'rgba(0, 0, 0, 0.12)' }}
          style={({ pressed }) => [styles.loginCta, pressed && styles.loginCtaPressed]}
        >
          <Text style={styles.loginCtaText}>{switchCtaLabel}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const ICON_SLOT = 48;

const styles = StyleSheet.create({
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
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.md,
    color: theme.colors.textPrimary,
  },
  loginCta: {
    borderRadius: theme.radius.button,
    borderWidth: 0,
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
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.md,
    color: theme.colors.onBrand,
    textAlign: 'center',
  },
});
