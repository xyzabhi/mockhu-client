import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../../../presentation/theme/theme';
import {
  type ThemeColors,
  useThemeColors,
} from '../../../../presentation/theme/ThemeContext';
import { MAX_TARGET_YEAR, minTargetYear } from '../../onboardingDraft';

/**
 * Years from the current calendar year through `MAX_TARGET_YEAR`, ascending (e.g. 2026…2035).
 */
function buildTargetYears(): number[] {
  const lo = minTargetYear();
  const out: number[] = [];
  for (let y = lo; y <= MAX_TARGET_YEAR; y += 1) {
    out.push(y);
  }
  return out;
}

const textAndroid = Platform.OS === 'android' ? ({ includeFontPadding: false } as const) : {};

type TargetYearPickerProps = {
  /** Selected year as string, e.g. `"2026"` */
  value: string;
  onChange: (yearStr: string) => void;
  placeholder?: string;
  error?: boolean;
  accessibilityLabel?: string;
};

export function TargetYearPicker({
  value,
  onChange,
  placeholder = 'Select year',
  error = false,
  accessibilityLabel = 'Target exam year',
}: TargetYearPickerProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const targetYears = useMemo(() => buildTargetYears(), []);

  const displayLabel = useMemo(() => {
    const t = value.trim();
    if (!t) return null;
    const n = Number.parseInt(t, 10);
    const lo = minTargetYear();
    if (!Number.isFinite(n) || n < lo || n > MAX_TARGET_YEAR) return null;
    return String(n);
  }, [value]);

  const handleSelect = useCallback(
    (y: number) => {
      onChange(String(y));
      setOpen(false);
    },
    [onChange],
  );

  const renderYear = useCallback(
    ({ item }: { item: number }) => {
      const selected = displayLabel === String(item);
      return (
        <Pressable
          onPress={() => handleSelect(item)}
          style={({ pressed }) => [
            styles.yearRow,
            selected && styles.yearRowSelected,
            pressed && styles.yearRowPressed,
          ]}
          accessibilityRole="button"
          accessibilityState={{ selected }}
          accessibilityLabel={`Year ${item}`}
        >
          <Text
            style={[styles.yearRowText, textAndroid, selected && styles.yearRowTextSelected]}
          >
            {item}
          </Text>
          {selected ? (
            <MaterialCommunityIcons name="check" size={26} color={colors.brand} />
          ) : null}
        </Pressable>
      );
    },
    [colors.brand, displayLabel, handleSelect, styles],
  );

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.trigger,
          error && styles.triggerError,
          open && styles.triggerOpen,
          pressed && styles.triggerPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Opens a list of years to choose from"
      >
        <Text
          style={[styles.triggerYearText, textAndroid, !displayLabel && styles.triggerPlaceholder]}
          numberOfLines={1}
        >
          {displayLabel ?? placeholder}
        </Text>
        <MaterialCommunityIcons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={26}
          color={colors.textPrimary}
        />
      </Pressable>

      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(false)}
        statusBarTranslucent
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setOpen(false)}
            accessibilityLabel="Close year picker"
          />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            <View style={styles.sheetGrab} />
            <View style={styles.sheetHeader}>
              <Pressable
                onPress={() => setOpen(false)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Done"
              >
                <MaterialCommunityIcons name="close" size={26} color={colors.textPrimary} />
              </Pressable>
            </View>
            <FlatList
              data={targetYears}
              keyExtractor={(item) => String(item)}
              renderItem={renderYear}
              showsVerticalScrollIndicator={false}
              style={styles.yearList}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      width: '100%',
      zIndex: 20,
    },
    trigger: {
      minHeight: 64,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 24,
      backgroundColor: colors.surface,
      paddingHorizontal: 20,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
        },
        android: { elevation: 1 },
        default: {},
      }),
    },
    triggerOpen: {
      borderWidth: 2,
      borderColor: colors.brand,
    },
    triggerError: {
      borderWidth: 2,
      borderColor: colors.danger,
    },
    triggerPressed: {
      opacity: 0.96,
    },
    triggerYearText: {
      flex: 1,
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.xxxl,
      lineHeight: 34,
      letterSpacing: -0.5,
      color: colors.textPrimary,
    },
    triggerPlaceholder: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.md,
      color: colors.textMuted,
    },
    modalRoot: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    modalBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheet: {
      zIndex: 1,
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '88%',
      paddingHorizontal: theme.spacing.screenPaddingH,
      paddingTop: 8,
    },
    sheetGrab: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.borderSubtle,
      marginBottom: 12,
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginBottom: 8,
    },
    yearList: {
      flexGrow: 0,
      maxHeight: 360,
    },
    yearRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 60,
      paddingVertical: 12,
      paddingHorizontal: 4,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderSubtle,
    },
    yearRowSelected: {
      backgroundColor: colors.brandLight,
    },
    yearRowPressed: {
      opacity: 0.92,
    },
    yearRowText: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.xxl,
      letterSpacing: -0.3,
      color: colors.textPrimary,
    },
    yearRowTextSelected: {
      color: colors.brand,
    },
  });
}
