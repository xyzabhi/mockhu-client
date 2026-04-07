import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { PermissionStatus } from 'expo-image-picker';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { theme } from '../../presentation/theme/theme';
import { type ThemeColors, useThemeColors } from '../../presentation/theme/ThemeContext';
import { AvatarCropModal } from './AvatarCropModal';

export type AvatarImageCropPickerProps = {
  value: string | null;
  onChange: (uri: string | null) => void;
  /** Circular preview diameter */
  displaySize?: number;
  /** Show “Reset” when a photo is set */
  showReset?: boolean;
};

const DEFAULT_DISPLAY = 144;

/**
 * Profile photo picker with a custom themed crop step (pan + zoom), then JPEG export.
 */
export function AvatarImageCropPicker({
  value,
  onChange,
  displaySize = DEFAULT_DISPLAY,
  showReset = true,
}: AvatarImageCropPickerProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors, displaySize), [colors, displaySize]);
  const { width: windowW } = useWindowDimensions();

  const [cropUri, setCropUri] = useState<string | null>(null);
  const [cropVisible, setCropVisible] = useState(false);

  const cropViewportSize = useMemo(
    () => Math.max(260, Math.min(340, Math.floor(windowW - theme.spacing.screenPaddingH * 2))),
    [windowW],
  );

  const openLibrary = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== PermissionStatus.GRANTED) {
      Alert.alert(
        'Photo library access',
        'Allow access to your photos to choose a profile picture. You can enable this in Settings.',
        [
          { text: 'Not now', style: 'cancel' },
          ...(Platform.OS !== 'web'
            ? [{ text: 'Open Settings', onPress: () => void Linking.openSettings() }]
            : []),
        ],
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled || !result.assets[0]?.uri) return;
    setCropUri(result.assets[0].uri);
    setCropVisible(true);
  }, []);

  const onCropped = useCallback(
    (uri: string) => {
      onChange(uri);
      setCropUri(null);
      setCropVisible(false);
    },
    [onChange],
  );

  const closeCrop = useCallback(() => {
    setCropUri(null);
    setCropVisible(false);
  }, []);

  return (
    <>
      <View style={styles.avatarBlock}>
        <Pressable
          style={({ pressed }) => [
            styles.avatarPressable,
            pressed && styles.avatarPressablePressed,
          ]}
          onPress={openLibrary}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={value ? 'Change profile photo' : 'Choose profile photo'}
        >
          <View
            style={[
              styles.avatarRing,
              value ? styles.avatarRingFilled : styles.avatarRingDefault,
            ]}
          >
            {value ? (
              <>
                <Image
                  source={{ uri: value }}
                  style={styles.avatarImage}
                  accessibilityIgnoresInvertColors
                />
                <View style={styles.editBadge} pointerEvents="none">
                  <MaterialCommunityIcons
                    name="camera-outline"
                    size={18}
                    color={colors.textPrimary}
                  />
                </View>
              </>
            ) : (
              <MaterialCommunityIcons
                name="account"
                size={Math.round(displaySize * 0.45)}
                color={colors.brand}
              />
            )}
          </View>
        </Pressable>

        <View style={styles.photoActions}>
          <Pressable
            onPress={openLibrary}
            style={({ pressed }) => [styles.textLink, pressed && styles.textLinkPressed]}
            hitSlop={8}
          >
            <Text style={styles.textLinkLabel}>{value ? 'Change' : 'Upload'}</Text>
          </Pressable>
          {showReset && value ? (
            <Pressable
              onPress={() => onChange(null)}
              style={({ pressed }) => [styles.textLinkMuted, pressed && styles.textLinkPressed]}
              hitSlop={8}
            >
              <Text style={styles.textLinkMutedLabel}>Reset</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <AvatarCropModal
        visible={cropVisible && cropUri != null}
        uri={cropUri}
        onClose={closeCrop}
        onConfirm={onCropped}
        cropViewportSize={cropViewportSize}
      />
    </>
  );
}

function createStyles(colors: ThemeColors, displaySize: number) {
  const ring = displaySize;
  return StyleSheet.create({
    avatarBlock: {
      alignItems: 'center',
      marginBottom: 8,
    },
    avatarPressable: {
      borderRadius: ring / 2 + 8,
    },
    avatarPressablePressed: {
      opacity: 0.92,
      transform: [{ scale: 0.98 }],
    },
    avatarRing: {
      width: ring,
      height: ring,
      borderRadius: ring / 2,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarRingDefault: {
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.brand,
    },
    avatarRingFilled: {
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 3,
      borderColor: colors.surface,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
        },
        android: { elevation: 6 },
        default: {},
      }),
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
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
        },
        android: { elevation: 4 },
        default: {},
      }),
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
      color: colors.brand,
    },
    textLinkMuted: {
      paddingVertical: 4,
    },
    textLinkMutedLabel: {
      fontFamily: theme.typography.medium,
      fontSize: theme.fintSizes.sm,
      color: colors.textMuted,
    },
  });
}
