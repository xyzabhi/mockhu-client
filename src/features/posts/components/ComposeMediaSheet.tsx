import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useMemo } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ThemeColors } from '../../../presentation/theme/ThemeContext';
import { theme } from '../../../presentation/theme/theme';

type ComposeMediaSheetProps = {
  /** Pass from parent (`ComposePostScreen`) so the sheet matches theme — RN Modal can miss ThemeContext. */
  colors: ThemeColors;
  visible: boolean;
  onClose: () => void;
  onChoosePhotos: () => void;
  onChooseVideo: () => void;
  onChoosePdf: () => void;
};

type SheetRow = {
  key: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  subtitle: string;
  onPress: () => void;
  iconBg: string;
  iconColor: string;
};

function createSheetStyles(colors: ThemeColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderSubtle,
      paddingHorizontal: theme.spacing.screenPaddingH,
      paddingTop: 10,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
        },
        android: { elevation: 24 },
        default: {},
      }),
    },
    handle: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.borderSubtle,
      marginBottom: 16,
    },
    title: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.lg,
      color: colors.textPrimary,
      marginBottom: 4,
      letterSpacing: -0.3,
    },
    subtitle: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.textMuted,
      marginBottom: 18,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: theme.radius.card,
      marginBottom: 8,
      gap: 14,
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    rowPressed: {
      opacity: 0.92,
    },
    iconBubble: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowTextCol: {
      flex: 1,
      minWidth: 0,
    },
    rowTitle: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.md,
      color: colors.textPrimary,
    },
    rowSub: {
      marginTop: 2,
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.xs,
      color: colors.textMuted,
    },
    cancelBtn: {
      marginTop: 4,
      marginBottom: 4,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radius.card,
    },
    cancelText: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.md,
      color: colors.textPrimary,
    },
  });
}

export function ComposeMediaSheet({
  colors,
  visible,
  onClose,
  onChoosePhotos,
  onChooseVideo,
  onChoosePdf,
}: ComposeMediaSheetProps) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createSheetStyles(colors), [colors]);

  const rows: SheetRow[] = useMemo(
    () => [
      {
        key: 'photos',
        icon: 'image-multiple',
        title: 'Photos',
        subtitle: 'Up to 4 images — JPEG, PNG, WebP, GIF, or HEIC (max 5 MB each)',
        iconBg: colors.brandLight,
        iconColor: colors.brand,
        onPress: onChoosePhotos,
      },
      {
        key: 'video',
        icon: 'play-circle',
        title: 'Video',
        subtitle: 'Pick a clip from your gallery',
        iconBg: colors.brandLight,
        iconColor: colors.brand,
        onPress: onChooseVideo,
      },
      {
        key: 'pdf',
        icon: 'file-pdf-box',
        title: 'PDF',
        subtitle: 'Attach a document',
        iconBg: 'rgba(239, 68, 68, 0.1)',
        iconColor: colors.danger,
        onPress: onChoosePdf,
      },
    ],
    [colors, onChoosePdf, onChoosePhotos, onChooseVideo],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Dismiss"
        />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <View style={styles.handle} accessibilityElementsHidden />
          <Text style={styles.title}>Add media</Text>
          <Text style={styles.subtitle}>Photos, video, or PDF — choose what to attach.</Text>

          {rows.map((row) => (
            <Pressable
              key={row.key}
              onPress={() => {
                row.onPress();
              }}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              android_ripple={{ color: 'rgba(124, 58, 237, 0.18)' }}
              accessibilityRole="button"
              accessibilityLabel={`${row.title}. ${row.subtitle}`}
            >
              <View style={[styles.iconBubble, { backgroundColor: row.iconBg }]}>
                <MaterialCommunityIcons name={row.icon} size={26} color={row.iconColor} />
              </View>
              <View style={styles.rowTextCol}>
                <Text style={styles.rowTitle}>{row.title}</Text>
                <Text style={styles.rowSub}>{row.subtitle}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
            </Pressable>
          ))}

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.cancelBtn, pressed && styles.rowPressed]}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
