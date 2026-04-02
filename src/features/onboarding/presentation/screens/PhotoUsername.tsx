import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { theme } from '../../../../presentation/theme/theme';

const USERNAME_MIN = 3;
const USERNAME_MAX = 16;

export function PhotoUsernameScreen() {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [usernameFocused, setUsernameFocused] = useState(false);

  const normalizedUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
  const usernameLengthOk =
    normalizedUsername.length >= USERNAME_MIN &&
    normalizedUsername.length <= USERNAME_MAX;

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
    <View style={styles.container}>
      <View style={styles.formCard}>

        <Pressable
          style={styles.photoWrap}
          onPress={pickImage}
          android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
        >
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photoImage} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <MaterialCommunityIcons
                name="camera-plus"
                size={40}
                color={theme.colors.textMuted}
              />
              <Text style={styles.photoHint}>Tap to add photo</Text>
            </View>
          )}
        </Pressable>

        <View style={styles.field}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={[
              styles.input,
              normalizedUsername.length > 0 ? styles.inputFilled : styles.inputDefault,
              usernameFocused ? styles.inputFocused : null,
            ]}
            value={username}
            onChangeText={handleUsernameChange}
            onFocus={() => setUsernameFocused(true)}
            onBlur={() => setUsernameFocused(false)}
            placeholder="your_username"
            placeholderTextColor={theme.colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={USERNAME_MAX}
          />
          <Text
            style={[
              styles.hint,
              usernameLengthOk ? styles.hintOk : styles.hintMuted,
            ]}
          >
            {normalizedUsername.length}/{USERNAME_MAX}
            {usernameLengthOk ? ' · looks good' : ` · ${USERNAME_MIN}+ chars`}
          </Text>
        </View>
      </View>
    </View>
  );
}

const AVATAR_SIZE = 120;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  formCard: {
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    padding: 24,
    gap: 14,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  title: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.xl,
    color: theme.colors.textPrimary,
  },
  helper: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  photoWrap: {
    alignSelf: 'center',
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: '#F9FAFB',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  photoHint: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: theme.fintSizes.sm,
    fontFamily: theme.typography.medium,
    color: theme.colors.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface,
    height: 48,
  },
  inputDefault: {
    fontFamily: theme.typography.regular,
  },
  inputFilled: {
    fontFamily: theme.typography.medium,
    color: theme.colors.textPrimary,
  },
  inputFocused: {
    borderColor: theme.colors.borderStrong,
    borderWidth: 2,
  },
  hint: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.xs,
  },
  hintMuted: {
    color: theme.colors.textMuted,
  },
  hintOk: {
    color: theme.colors.textPrimary,
  },
});
