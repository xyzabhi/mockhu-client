import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  type ThemeColors,
  useThemeColors,
} from '../../../../presentation/theme/ThemeContext';
import { theme } from '../../../../presentation/theme/theme';
import { AvatarImageCropPicker } from '../../../../shared/components/AvatarImageCropPicker';
import { isUsableAvatarDraftUri } from '../../onboardingDraft';
import { useOnboardingDraft } from '../../OnboardingDraftContext';
import type { OnboardingStepScreenProps } from '../../onboardingStepTypes';

const USERNAME_MIN = 3;
const USERNAME_MAX = 16;
const AVATAR = 144;
const INPUT_RADIUS = 24;

function createPhotoUsernameStyles(colors: ThemeColors) {
  const inputShadow = Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
    },
    android: { elevation: 1 },
    default: {},
  });

  const clearShadow = Platform.select({
    ios: {
      shadowOpacity: 0,
      shadowRadius: 0,
    },
    android: { elevation: 0 },
    default: {},
  });

  return StyleSheet.create({
    scroll: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    scrollContent: {
      paddingHorizontal: theme.spacing.screenPaddingH,
      paddingTop: 4,
      paddingBottom: 32,
    },
    sectionLabel: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.sm,
      color: colors.textMuted,
      marginBottom: 12,
      letterSpacing: 0.2,
      textTransform: 'uppercase',
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.borderSubtle,
      marginVertical: 24,
    },
    usernameShell: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 52,
      borderRadius: INPUT_RADIUS,
      paddingLeft: 4,
      paddingRight: 12,
      overflow: 'hidden',
    },
    usernameShellIdle: {
      borderWidth: 1,
      borderColor: colors.inputBorder,
      backgroundColor: colors.surface,
      ...inputShadow,
    },
    usernameShellFocused: {
      borderWidth: 2,
      borderColor: colors.brand,
      backgroundColor: colors.surface,
      ...clearShadow,
    },
    usernamePrefix: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.lg,
      color: colors.textMuted,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    usernamePrefixActive: {
      color: colors.brand,
    },
    usernameInput: {
      flex: 1,
      minHeight: 48,
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.md,
      color: colors.textPrimary,
      paddingVertical: 12,
      paddingRight: 6,
    },
    usernameInputTrail: {
      minWidth: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    charMetaInline: {
      fontFamily: theme.typography.medium,
      fontSize: theme.fintSizes.xs,
      color: colors.textMuted,
      fontVariant: ['tabular-nums'],
    },
    usernameHint: {
      marginTop: 8,
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.xs,
      color: colors.textMuted,
    },
  });
}

export function PhotoUsernameScreen({
  onStepValidityChange,
}: OnboardingStepScreenProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createPhotoUsernameStyles(colors), [colors]);
  const { draft, updateDraft } = useOnboardingDraft();
  /** `null` = show default avatar; set when user picks a custom photo (file://, content://, https://, …). */
  const [photoUri, setPhotoUri] = useState<string | null>(() => {
    const u = draft.avatar_url ?? '';
    if (!isUsableAvatarDraftUri(u)) return null;
    return u.trim();
  });
  const [username, setUsername] = useState(draft.username);
  const [usernameFocused, setUsernameFocused] = useState(false);

  const normalizedUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
  const usernameLengthOk =
    normalizedUsername.length >= USERNAME_MIN &&
    normalizedUsername.length <= USERNAME_MAX;

  /** Picker URIs (file://, content://, …) and remote URLs all map to `avatar_url`; never https-only. */
  const avatarUrl =
    photoUri != null && isUsableAvatarDraftUri(photoUri) ? photoUri.trim() : '';

  useEffect(() => {
    updateDraft({ username: normalizedUsername, avatar_url: avatarUrl });
  }, [normalizedUsername, avatarUrl, updateDraft]);

  useEffect(() => {
    onStepValidityChange?.(usernameLengthOk);
  }, [usernameLengthOk, onStepValidityChange]);

  const handleUsernameChange = (text: string) => {
    const next = text.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(next.slice(0, USERNAME_MAX));
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.sectionLabel}>Photo</Text>

      <AvatarImageCropPicker
        value={photoUri}
        onChange={setPhotoUri}
        displaySize={AVATAR}
        showReset
      />

      <View style={styles.divider} />

      <View
        style={[
          styles.usernameShell,
          usernameFocused ? styles.usernameShellFocused : styles.usernameShellIdle,
        ]}
      >
        <Text
          style={[
            styles.usernamePrefix,
            usernameFocused && styles.usernamePrefixActive,
          ]}
        >
          @
        </Text>
        <TextInput
          style={styles.usernameInput}
          value={username}
          onChangeText={handleUsernameChange}
          onFocus={() => setUsernameFocused(true)}
          onBlur={() => setUsernameFocused(false)}
          placeholder="username"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={USERNAME_MAX}
          accessibilityLabel="Username"
          accessibilityHint={`${USERNAME_MIN} to ${USERNAME_MAX} characters`}
        />
        <View style={styles.usernameInputTrail}>
          {usernameLengthOk ? (
            <MaterialCommunityIcons
              name="check-circle"
              size={22}
              color={colors.brand}
              accessibilityLabel="Username valid"
            />
          ) : (
            <Text style={styles.charMetaInline} accessibilityLabel="Character count">
              {normalizedUsername.length}/{USERNAME_MAX}
            </Text>
          )}
        </View>
      </View>
      {!usernameLengthOk && normalizedUsername.length > 0 ? (
        <Text style={styles.usernameHint}>
          {USERNAME_MIN}–{USERNAME_MAX} characters
        </Text>
      ) : null}
    </ScrollView>
  );
}
