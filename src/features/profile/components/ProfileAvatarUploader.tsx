import { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import {
  AppError,
  meAvatarUploadToTokenUserPatch,
  mergeSessionUser,
  refreshSessionProfile,
  userApi,
} from '../../../api';
import { theme } from '../../../presentation/theme/theme';
import { type ThemeColors, useThemeColors } from '../../../presentation/theme/ThemeContext';
import { AvatarImageCropPicker } from '../../../shared/components/AvatarImageCropPicker';
import { UserAvatar } from '../../../shared/components/UserAvatar';
import { pickAvatarDisplayUrl } from '../../../shared/utils/avatarDisplayUrl';
import { isUsableAvatarDraftUri } from '../../onboarding/onboardingDraft';

type Props = {
  /** Current remote URL or local draft URI from session */
  avatarUrl: string | null | undefined;
  avatarUrls?: Record<string, string> | null;
  /** Stable seed for placeholder avatar */
  seed: string;
  /** When false, hide picker (e.g. R2 unavailable) */
  uploadEnabled: boolean;
  /** Avatar diameter in px (default 112). */
  displaySize?: number;
};

/**
 * Profile screen: change photo → POST /me/avatar → merge session + refresh `/me`.
 */
export function ProfileAvatarUploader({
  avatarUrl,
  avatarUrls,
  seed,
  uploadEnabled,
  displaySize = 112,
}: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => createUploaderStyles(colors), [colors]);
  const [busy, setBusy] = useState(false);
  const [r2Unavailable, setR2Unavailable] = useState(false);
  const [pendingPreviewUri, setPendingPreviewUri] = useState<string | null>(null);

  const displayUri = useMemo(() => {
    if (pendingPreviewUri) return pendingPreviewUri;
    const fromCdn = pickAvatarDisplayUrl(avatarUrl ?? null, avatarUrls ?? null, displaySize);
    const u = typeof fromCdn === 'string' ? fromCdn.trim() : '';
    if (!u) return null;
    if (u.startsWith('http://') || u.startsWith('https://')) return u;
    return isUsableAvatarDraftUri(u) ? u : null;
  }, [pendingPreviewUri, avatarUrl, avatarUrls, displaySize]);

  const applyUpload = useCallback(async (localUri: string | null) => {
    if (localUri == null) return;
    setPendingPreviewUri(localUri);
    setBusy(true);
    try {
      const data = await userApi.uploadMeAvatar(localUri);
      await mergeSessionUser(meAvatarUploadToTokenUserPatch(data));
      await refreshSessionProfile();
      setPendingPreviewUri(null);
    } catch (e) {
      const msg =
        e instanceof AppError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Upload failed.';
      if (
        e instanceof AppError &&
        (e.code === 'SERVICE_UNAVAILABLE' || e.status === 503)
      ) {
        setR2Unavailable(true);
        Alert.alert('Upload unavailable', 'Photo upload is temporarily unavailable. Try again later.');
      } else {
        Alert.alert('Could not update photo', msg);
      }
      setPendingPreviewUri(null);
    } finally {
      setBusy(false);
    }
  }, []);

  if (!uploadEnabled || r2Unavailable) {
    return (
      <View style={styles.fallbackCol}>
        <UserAvatar seed={seed} avatarUrl={avatarUrl} avatarUrls={avatarUrls} size={displaySize} />
        <View style={[styles.banner, styles.bannerSpaced]}>
          <Text style={styles.bannerText}>
            {r2Unavailable
              ? 'Photo upload is temporarily unavailable.'
              : 'Photo upload is unavailable.'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap} pointerEvents={busy ? 'none' : 'auto'}>
      <AvatarImageCropPicker
        value={displayUri}
        onChange={applyUpload}
        displaySize={displaySize}
        showReset={false}
      />
      {busy ? <Text style={styles.hint}>Uploading…</Text> : null}
    </View>
  );
}

function createUploaderStyles(colors: ThemeColors) {
  return StyleSheet.create({
    fallbackCol: {
      alignItems: 'center',
    },
    bannerSpaced: {
      marginTop: 12,
    },
    wrap: {
      alignItems: 'center',
    },
    hint: {
      marginTop: 8,
      fontFamily: theme.typography.regular,
      fontSize: theme.fontSizes.meta,
      color: colors.textMuted,
    },
    banner: {
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 12,
      backgroundColor: colors.surfaceSubtle,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
    },
    bannerText: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.textMuted,
      textAlign: 'center',
    },
  });
}
