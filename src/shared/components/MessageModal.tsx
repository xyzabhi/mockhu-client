import { useCallback, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  type ThemeColors,
  useThemeColors,
} from '../../presentation/theme/ThemeContext';
import { theme } from '../../presentation/theme/theme';

export type MessageModalButton = {
  label: string;
  onPress: () => void;
  /** Default `primary` for a single action; use `secondary` for cancel-style. */
  variant?: 'primary' | 'secondary' | 'destructive';
};

export type MessageModalProps = {
  visible: boolean;
  title?: string;
  message: string;
  /** Omit for a single default “OK” that calls `onClose`. */
  buttons?: MessageModalButton[];
  onClose: () => void;
  /** Tap backdrop to dismiss (default true). */
  dismissOnBackdropPress?: boolean;
};

/**
 * Custom cross-platform popup (iOS + Android) — same card UI, not `Alert.alert`.
 * Uses `Modal` + centered sheet with theme colors and safe-area padding.
 */
export function MessageModal({
  visible,
  title,
  message,
  buttons,
  onClose,
  dismissOnBackdropPress = true,
}: MessageModalProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const actions = useMemo(() => {
    if (buttons && buttons.length > 0) {
      return buttons.map((b) => ({
        ...b,
        variant: b.variant ?? 'primary',
      }));
    }
    return [{ label: 'OK', onPress: onClose, variant: 'primary' as const }];
  }, [buttons, onClose]);

  const handleBackdrop = useCallback(() => {
    if (dismissOnBackdropPress) onClose();
  }, [dismissOnBackdropPress, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Pressable
          style={styles.backdrop}
          onPress={handleBackdrop}
          accessibilityLabel="Dismiss dialog"
          accessibilityRole="button"
        />
        <View style={styles.cardWrap} pointerEvents="box-none">
          <View style={styles.card} accessibilityRole="none">
            {title ? (
              <Text style={styles.title} accessibilityRole="header">
                {title}
              </Text>
            ) : null}
            <ScrollView
              style={styles.messageScroll}
              contentContainerStyle={styles.messageScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.body}>{message}</Text>
            </ScrollView>
            <View style={styles.actions}>
              {actions.map((btn, i) => (
                <Pressable
                  key={`${btn.label}-${i}`}
                  onPress={() => {
                    btn.onPress();
                  }}
                  style={({ pressed }) => [
                    styles.btn,
                    btn.variant === 'primary' && styles.btnPrimary,
                    btn.variant === 'secondary' && styles.btnSecondary,
                    btn.variant === 'destructive' && styles.btnDestructive,
                    pressed && styles.btnPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={btn.label}
                >
                  <Text
                    style={[
                      styles.btnText,
                      btn.variant === 'primary' && styles.btnTextPrimary,
                      btn.variant === 'secondary' && styles.btnTextSecondary,
                      btn.variant === 'destructive' && styles.btnTextDestructive,
                    ]}
                    numberOfLines={2}
                  >
                    {btn.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export type MessageModalShowConfig = Omit<MessageModalProps, 'visible' | 'onClose'>;

/**
 * Imperative-style API: render `{modal}` once near the root of a screen and call `show` / `hide`.
 *
 * @example
 * const { modal, show, hide } = useMessageModal();
 * return (
 *   <View>
 *     {modal}
 *     <Button onPress={() => show({ title: 'Done', message: 'Saved successfully.' })} />
 *   </View>
 * );
 */
export function useMessageModal() {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<MessageModalShowConfig>({ message: '' });

  const show = useCallback((next: MessageModalShowConfig) => {
    setConfig(next);
    setOpen(true);
  }, []);

  const hide = useCallback(() => {
    setOpen(false);
  }, []);

  const modal = (
    <MessageModal
      visible={open}
      title={config.title}
      message={config.message}
      buttons={config.buttons}
      dismissOnBackdropPress={config.dismissOnBackdropPress}
      onClose={hide}
    />
  );

  return { modal, show, hide, visible: open };
}

function createStyles(colors: ThemeColors) {
  const cardShadow = Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18,
      shadowRadius: 24,
    },
    android: {
      elevation: 12,
    },
    default: {},
  });

  return StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    cardWrap: {
      width: '100%',
      maxWidth: 360,
    },
    card: {
      alignItems: 'stretch',
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
      overflow: 'hidden',
      ...cardShadow,
    },
    title: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.lg,
      color: colors.textPrimary,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 8,
      letterSpacing: -0.2,
      textAlign: 'center',
      width: '100%',
    },
    messageScroll: {
      maxHeight: 280,
      width: '100%',
      alignSelf: 'center',
    },
    messageScrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 8,
      alignItems: 'center',
      width: '100%',
    },
    body: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.md,
      color: colors.textPrimary,
      lineHeight: 22,
      textAlign: 'center',
      width: '100%',
    },
    actions: {
      flexDirection: 'column',
      alignItems: 'stretch',
      alignSelf: 'stretch',
      width: '100%',
      gap: 12,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderSubtle,
    },
    btn: {
      width: '100%',
      minHeight: 52,
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnPrimary: {
      backgroundColor: colors.brand,
      borderWidth: 1,
      borderColor: colors.buttonBorder,
    },
    btnSecondary: {
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.brand,
    },
    btnDestructive: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.danger,
    },
    btnPressed: {
      opacity: 0.88,
    },
    btnText: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.md,
      textAlign: 'center',
    },
    btnTextPrimary: {
      color: colors.onBrand,
    },
    btnTextSecondary: {
      color: colors.brand,
    },
    btnTextDestructive: {
      color: colors.danger,
    },
  });
}
