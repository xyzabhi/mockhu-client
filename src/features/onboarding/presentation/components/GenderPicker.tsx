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

const textAndroid = Platform.OS === 'android' ? ({ includeFontPadding: false } as const) : {};

type Choice = { key: string; label: string; value: string };

const STANDARD: Choice[] = [
  { key: 'female', label: 'Female', value: 'Female' },
  { key: 'male', label: 'Male', value: 'Male' },
  { key: 'nonbinary', label: 'Non-binary', value: 'Non-binary' },
  { key: 'prefer_not', label: 'Prefer not to say', value: 'Prefer not to say' },
  { key: 'clear', label: 'Not specified', value: '' },
];

function choicesForCurrentValue(value: string): Choice[] {
  const t = value.trim();
   if (!t) return STANDARD;
  if (STANDARD.some((c) => c.value === t)) return STANDARD;
  return [{ key: 'legacy', label: t, value: t }, ...STANDARD];
}

type GenderPickerProps = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  accessibilityLabel?: string;
};

export function GenderPicker({
  value,
  onChange,
  placeholder = 'Select gender',
  accessibilityLabel = 'Gender',
}: GenderPickerProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const rows = useMemo(() => choicesForCurrentValue(value), [value]);

  const displayLabel = useMemo(() => {
    const t = value.trim();
    return t || null;
  }, [value]);

  const handleSelect = useCallback(
    (v: string) => {
      onChange(v);
      setOpen(false);
    },
    [onChange],
  );

  const renderRow = useCallback(
    ({ item }: { item: Choice }) => {
      const selected =
        value.trim() === item.value.trim() || (!value.trim() && item.value === '');
      return (
        <Pressable
          onPress={() => handleSelect(item.value)}
          style={({ pressed }) => [
            styles.row,
            selected && styles.rowSelected,
            pressed && styles.rowPressed,
          ]}
          accessibilityRole="button"
          accessibilityState={{ selected }}
          accessibilityLabel={item.label}
        >
          <Text style={[styles.rowText, textAndroid, selected && styles.rowTextSelected]}>
            {item.label}
          </Text>
          {selected ? (
            <MaterialCommunityIcons name="check" size={22} color={colors.brand} />
          ) : null}
        </Pressable>
      );
    },
    [colors.brand, handleSelect, styles, value],
  );

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.trigger,
          open && styles.triggerOpen,
          pressed && styles.triggerPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Opens a list of gender options"
      >
        <Text
          style={[styles.triggerText, textAndroid, !displayLabel && styles.triggerPlaceholder]}
          numberOfLines={1}
        >
          {displayLabel ?? placeholder}
        </Text>
        <MaterialCommunityIcons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={22}
          color={colors.textMuted}
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
            accessibilityLabel="Close gender picker"
          />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            <View style={styles.sheetGrab} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Gender</Text>
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
              data={rows}
              keyExtractor={(item) => item.key}
              renderItem={renderRow}
              showsVerticalScrollIndicator={false}
              style={styles.list}
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
      minHeight: 50,
      marginTop: 8,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: theme.radius.input,
      backgroundColor: colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 13,
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
    triggerPressed: {
      opacity: 0.96,
    },
    triggerText: {
      flex: 1,
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.md,
      color: colors.textPrimary,
    },
    triggerPlaceholder: {
      fontFamily: theme.typography.regular,
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
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    sheetTitle: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.md,
      color: colors.textPrimary,
    },
    list: {
      flexGrow: 0,
      maxHeight: 360,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 52,
      paddingVertical: 12,
      paddingHorizontal: 4,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderSubtle,
    },
    rowSelected: {
      backgroundColor: colors.brandLight,
    },
    rowPressed: {
      opacity: 0.92,
    },
    rowText: {
      fontFamily: theme.typography.medium,
      fontSize: theme.fintSizes.md,
      color: colors.textPrimary,
    },
    rowTextSelected: {
      color: colors.brand,
    },
  });
}
