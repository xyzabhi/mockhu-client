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
import type { OnboardingStepScreenProps } from '../../onboardingStepTypes';

const USERNAME_MIN = 3;
const USERNAME_MAX = 16;
const AVATAR = 144;
const BRAND_TINT = 'rgba(0, 210, 106, 0.12)';
const BRAND_TINT_STRONG = 'rgba(0, 210, 106, 0.2)';

export function PhotoUsernameScreen({
  onStepValidityChange,
}: OnboardingStepScreenProps) {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [usernameFocused, setUsernameFocused] = useState(false);

  const normalizedUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
  const usernameLengthOk =
    normalizedUsername.length >= USERNAME_MIN &&
    normalizedUsername.length <= USERNAME_MAX;

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
      <Text style={styles.sectionLabel}>Profile photo</Text>
      <Text style={styles.sectionHint}>
        Optional. You can add or change this anytime.
      </Text>

      <View style={styles.avatarBlock}>
        <Pressable
          style={({ pressed }) => [
            styles.avatarPressable,
            pressed && styles.avatarPressablePressed,
          ]}
          onPress={pickImage}
          accessibilityRole="button"
          accessibilityLabel={photoUri ? 'Change profile photo' : 'Add profile photo'}
        >
          <View
            style={[
              styles.avatarRing,
              photoUri ? styles.avatarRingFilled : styles.avatarRingEmpty,
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
              <View style={styles.avatarEmpty}>
                <View style={styles.iconCircle}>
                  <MaterialCommunityIcons
                    name="image-plus-outline"
                    size={36}
                    color={theme.colors.brand}
                  />
                </View>
                <Text style={styles.emptyTitle}>Add a photo</Text>
                <Text style={styles.emptySubtitle}>JPG or PNG · tap to open library</Text>
              </View>
            )}
          </View>
        </Pressable>

        {photoUri ? (
          <View style={styles.photoActions}>
            <Pressable
              onPress={pickImage}
              style={({ pressed }) => [styles.textLink, pressed && styles.textLinkPressed]}
              hitSlop={8}
            >
              <Text style={styles.textLinkLabel}>Choose different photo</Text>
            </Pressable>
            <Pressable
              onPress={() => setPhotoUri(null)}
              style={({ pressed }) => [styles.textLinkMuted, pressed && styles.textLinkPressed]}
              hitSlop={8}
            >
              <Text style={styles.textLinkMutedLabel}>Remove</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={styles.divider} />

      <Text style={styles.sectionLabel}>Username</Text>
      <Text style={styles.sectionHint}>
        Letters, numbers, and underscores only. This is how others find you.
      </Text>

      <View
        style={[
          styles.usernameShell,
          usernameFocused && styles.usernameShellFocused,
          !usernameFocused && usernameLengthOk && styles.usernameShellValid,
        ]}
      >
        <Text style={styles.atPrefix}>@</Text>
        <TextInput
          style={styles.usernameInput}
          value={username}
          onChangeText={handleUsernameChange}
          onFocus={() => setUsernameFocused(true)}
          onBlur={() => setUsernameFocused(false)}
          placeholder="your_handle"
          placeholderTextColor={theme.colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={USERNAME_MAX}
          accessibilityLabel="Username"
        />
      </View>

      <View style={styles.validationRow}>
        <MaterialCommunityIcons
          name={usernameLengthOk ? 'check-circle' : 'alert-circle-outline'}
          size={20}
          color={usernameLengthOk ? theme.colors.brand : theme.colors.textMuted}
        />
        <View style={styles.validationTextBlock}>
          <Text
            style={[
              styles.validationTitle,
              usernameLengthOk ? styles.validationTitleOk : styles.validationTitleMuted,
            ]}
          >
            {usernameLengthOk
              ? 'Username looks good'
              : normalizedUsername.length === 0
                ? `Use ${USERNAME_MIN}–${USERNAME_MAX} characters`
                : normalizedUsername.length < USERNAME_MIN
                  ? `${USERNAME_MIN - normalizedUsername.length} more character${USERNAME_MIN - normalizedUsername.length === 1 ? '' : 's'} needed`
                  : 'Too long — max 16 characters'}
          </Text>
          <Text style={styles.charMeta}>
            <Text style={styles.charMetaStrong}>{normalizedUsername.length}</Text>
            <Text style={styles.charMetaFaint}> / {USERNAME_MAX}</Text>
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
  sectionLabel: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.md,
    color: theme.colors.textPrimary,
    letterSpacing: -0.2,
  },
  sectionHint: {
    marginTop: 6,
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textMuted,
    lineHeight: 20,
    marginBottom: 20,
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
  avatarRingEmpty: {
    backgroundColor: BRAND_TINT,
    borderWidth: 2,
    borderColor: BRAND_TINT_STRONG,
    borderStyle: 'dashed',
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
  avatarEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyTitle: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.md,
    color: theme.colors.textPrimary,
  },
  emptySubtitle: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.textMuted,
    textAlign: 'center',
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
    marginTop: 16,
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
    marginVertical: 28,
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
    paddingRight: 14,
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
  atPrefix: {
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
  },
  validationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 16,
    paddingHorizontal: 2,
  },
  validationTextBlock: {
    flex: 1,
  },
  validationTitle: {
    fontFamily: theme.typography.medium,
    fontSize: theme.fintSizes.sm,
    lineHeight: 20,
  },
  validationTitleOk: {
    color: theme.colors.textPrimary,
  },
  validationTitleMuted: {
    color: theme.colors.textMuted,
  },
  charMeta: {
    marginTop: 4,
  },
  charMetaStrong: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  charMetaFaint: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.textMuted,
  },
});
