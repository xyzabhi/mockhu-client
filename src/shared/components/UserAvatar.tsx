import { Image, StyleSheet, View } from 'react-native';
import { isUsableAvatarDraftUri } from '../../features/onboarding/onboardingDraft';
import { theme } from '../../presentation/theme/theme';
import { pickAvatarDisplayUrl } from '../utils/avatarDisplayUrl';
import { pickDogAvatarUri } from '../utils/dogAvatarUris';

export type UserAvatarProps = {
  /** Used to pick a stable dog image when there is no real avatar. */
  seed: string;
  avatarUrl?: string | null;
  /** R2 `avatar_urls` from `/me` — smaller keys used for lists/thumbnails. */
  avatarUrls?: Record<string, string> | null;
  /** Inner circle diameter (default 48). */
  size?: number;
};

/**
 * Circular avatar: remote photo when set, otherwise a deterministic dog image.
 */
export function UserAvatar({ seed, avatarUrl, avatarUrls, size = 48 }: UserAvatarProps) {
  const trimmed = typeof avatarUrl === 'string' ? avatarUrl.trim() : '';
  const fromCdn = pickAvatarDisplayUrl(trimmed || null, avatarUrls ?? null, size);
  const candidate = fromCdn ?? trimmed;
  const uri = isUsableAvatarDraftUri(candidate) ? candidate : pickDogAvatarUri(seed);

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
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
  wrap: {
    backgroundColor: theme.colors.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    backgroundColor: theme.colors.brandLight,
  },
});
