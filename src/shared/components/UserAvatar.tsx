import { Image, StyleSheet, View } from 'react-native';
import { isUsableAvatarDraftUri } from '../../features/onboarding/onboardingDraft';
import { theme } from '../../presentation/theme/theme';
import { pickDogAvatarUri } from '../utils/dogAvatarUris';

export type UserAvatarProps = {
  /** Used to pick a stable dog image when there is no real avatar. */
  seed: string;
  avatarUrl?: string | null;
  /** Inner circle diameter (default 48). */
  size?: number;
};

/**
 * Circular avatar: remote photo when set, otherwise a deterministic dog image.
 * Ring uses brand border + light brand fill.
 */
export function UserAvatar({ seed, avatarUrl, size = 48 }: UserAvatarProps) {
  /** Outer box: inner image `size` + 2px brand border on each side (RN border is inside width). */
  const outer = size + 4;
  const trimmed = typeof avatarUrl === 'string' ? avatarUrl.trim() : '';
  const uri = isUsableAvatarDraftUri(trimmed) ? trimmed : pickDogAvatarUri(seed);

  return (
    <View
      style={[
        styles.ring,
        {
          width: outer,
          height: outer,
          borderRadius: outer / 2,
        },
      ]}
      accessibilityIgnoresInvertColors
    >
      <Image
        source={{ uri }}
        style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    borderWidth: theme.borderWidth.cta,
    borderColor: theme.colors.brand,
    backgroundColor: theme.colors.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    backgroundColor: theme.colors.brandLight,
  },
});
