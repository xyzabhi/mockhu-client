import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { theme } from '../../../../presentation/theme/theme';
import { ONBOARDING_DEFAULT_AVATAR_URL } from '../../onboardingDraft';
import { useOnboardingDraft } from '../../OnboardingDraftContext';
import type { OnboardingStepScreenProps } from '../../onboardingStepTypes';

const USERNAME_MIN = 3;
const USERNAME_MAX = 16;
const AVATAR = 144;

export function PhotoUsernameScreen({
  onStepValidityChange,
}: OnboardingStepScreenProps) {
  const { draft, updateDraft } = useOnboardingDraft();
  /** `null` = show default avatar; set when user picks a custom photo (file://, content://, https://, …). */
  const [photoUri, setPhotoUri] = useState<string | null>(() => {
    const u = draft.avatar_url?.trim();
    if (!u || u === ONBOARDING_DEFAULT_AVATAR_URL) return null;
    return u;
  });
  const [username, setUsername] = useState(draft.username);
  const [usernameFocused, setUsernameFocused] = useState(false);

  const normalizedUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
  const usernameLengthOk =
    normalizedUsername.length >= USERNAME_MIN &&
    normalizedUsername.length <= USERNAME_MAX;

  /** Keep picker URIs (file://, content://, ph://, …) — not only https; those map to `avatar_url` in the draft. */
  const avatarUrl = photoUri?.trim() ? photoUri.trim() : '';

  useEffect(() => {
    updateDraft({ username: normalizedUsername, avatar_url: avatarUrl });
  }, [normalizedUsername, avatarUrl, updateDraft]);

  useEffect(() => {
    onStepValidityChange?.(usernameLengthOk);
  }, [usernameLengthOk, onStepValidityChange]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
    }
  };

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

      <View style={styles.avatarBlock}>
        <Pressable
          style={({ pressed }) => [
            styles.avatarPressable,
            pressed && styles.avatarPressablePressed,
          ]}
          onPress={pickImage}
          accessibilityRole="button"
          accessibilityLabel={photoUri ? 'Change profile photo' : 'Choose profile photo'}
        >
          <View
            style={[
              styles.avatarRing,
              photoUri ? styles.avatarRingFilled : styles.avatarRingDefault,
            ]}
          >
            {photoUri ? (
              <>
                <Image source={{ uri: photoUri }} style={styles.avatarImage} />
                <View style={styles.editBadge}>
                  <MaterialCommunityIcons
                    name="camera-outline"
                    size={18}
                    color={theme.colors.textPrimary}
                  />
                </View>
              </>
            ) : (
              <MaterialCommunityIcons
                name="account"
                size={Math.round(AVATAR * 0.45)}
                color={theme.colors.textMuted}
              />
            )}
          </View>
        </Pressable>

        <View style={styles.photoActions}>
          <Pressable
            onPress={pickImage}
            style={({ pressed }) => [styles.textLink, pressed && styles.textLinkPressed]}
            hitSlop={8}
          >
            <Text style={styles.textLinkLabel}>{photoUri ? 'Change' : 'Upload'}</Text>
          </Pressable>
          {photoUri ? (
            <Pressable
              onPress={() => setPhotoUri(null)}
              style={({ pressed }) => [styles.textLinkMuted, pressed && styles.textLinkPressed]}
              hitSlop={8}
            >
              <Text style={styles.textLinkMutedLabel}>Reset</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.divider} />

      <View
        style={[
          styles.usernameShell,
          usernameFocused && styles.usernameShellFocused,
          !usernameFocused && usernameLengthOk && styles.usernameShellValid,
        ]}
      >
        <Text style={styles.usernamePrefix}>#</Text>
        <TextInput
          style={styles.usernameInput}
          value={username}
          onChangeText={handleUsernameChange}
          onFocus={() => setUsernameFocused(true)}
          onBlur={() => setUsernameFocused(false)}
          placeholder="username"
          placeholderTextColor={theme.colors.textMuted}
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
              color={theme.colors.brand}
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
        <Text style={styles.usernameHint}>{USERNAME_MIN}–{USERNAME_MAX} characters</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 32,
  },
  sectionLabel: {
    fontFamily: theme.typography.medium,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textMuted,
    marginBottom: 12,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  avatarBlock: {
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarPressable: {
    borderRadius: AVATAR / 2 + 8,
  },
  avatarPressablePressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  avatarRing: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRingDefault: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  avatarRingFilled: {
    backgroundColor: '#F3F4F6',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  editBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  photoActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginTop: 14,
    minHeight: 24,
  },
  textLink: {
    paddingVertical: 4,
  },
  textLinkPressed: {
    opacity: 0.65,
  },
  textLinkLabel: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.brand,
  },
  textLinkMuted: {
    paddingVertical: 4,
  },
  textLinkMutedLabel: {
    fontFamily: theme.typography.medium,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.borderSubtle,
    marginVertical: 24,
  },
  usernameShell: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: 14,
    backgroundColor: '#FAFAFA',
    paddingLeft: 4,
    paddingRight: 10,
    overflow: 'hidden',
  },
  usernameShellFocused: {
    borderColor: theme.colors.borderStrong,
    borderWidth: 2,
    backgroundColor: '#ffffff',
  },
  usernameShellValid: {
    borderColor: theme.colors.brand,
    borderWidth: 2,
    backgroundColor: '#ffffff',
  },
  usernamePrefix: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.lg,
    color: theme.colors.textMuted,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  usernameInput: {
    flex: 1,
    minHeight: 52,
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.md,
    color: theme.colors.textPrimary,
    paddingVertical: 12,
    paddingRight: 6,
  },
  usernameInputTrail: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  charMetaInline: {
    fontFamily: theme.typography.medium,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  usernameHint: {
    marginTop: 8,
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.textMuted,
  },
});
