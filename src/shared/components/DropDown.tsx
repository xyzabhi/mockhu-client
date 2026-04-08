import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { theme } from '../../presentation/theme/theme';
import {
  type ThemeColors,
  useThemeColors,
} from '../../presentation/theme/ThemeContext';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type DropDownOption = {
  label: string;
  value: string;
  icon?: IconName;
};

type DropDownProps = {
  options: DropDownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
};

const INPUT_RADIUS = 24;

function createDropDownStyles(colors: ThemeColors) {
  const triggerShadow = Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
    },
    android: { elevation: 1 },
    default: {},
  });

  return StyleSheet.create({
    container: {
      width: '100%',
      position: 'relative',
      zIndex: 30,
    },
    trigger: {
      minHeight: 52,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: INPUT_RADIUS,
      backgroundColor: colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      ...triggerShadow,
    },
    triggerOpen: {
      borderWidth: 2,
      borderColor: colors.brand,
      backgroundColor: colors.surface,
    },
    triggerPressed: {
      opacity: 0.96,
    },
    triggerText: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.md,
      color: colors.textPrimary,
    },
    triggerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 8,
    },
    placeholder: {
      fontFamily: theme.typography.regular,
      color: colors.textMuted,
    },
    menu: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: '100%',
      marginTop: 6,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
      borderRadius: 16,
      backgroundColor: colors.surface,
      overflow: 'hidden',
      zIndex: 100,
      elevation: 8,
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
    },
    menuScroll: {
      maxHeight: 220,
    },
    menuItem: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderSubtle,
    },
    menuItemLast: {
      borderBottomWidth: 0,
    },
    menuItemSelected: {
      backgroundColor: colors.brand,
    },
    menuItemPressed: {
      opacity: 0.9,
    },
    menuItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 8,
    },
    menuText: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.md,
      color: colors.textPrimary,
    },
    menuTextSelected: {
      fontFamily: theme.typography.semiBold,
      color: colors.onBrand,
    },
  });
}

function DropDown({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  isOpen: controlledIsOpen,
  onOpenChange,
}: DropDownProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createDropDownStyles(colors), [colors]);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = typeof controlledIsOpen === 'boolean';
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;
  const selected = options.find((option) => option.value === value);

  const setOpen = (nextOpen: boolean) => {
    if (!isControlled) {
      setInternalIsOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [
          styles.trigger,
          isOpen && styles.triggerOpen,
          pressed && styles.triggerPressed,
        ]}
        onPress={() => setOpen(!isOpen)}
        hitSlop={4}
        android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
      >
        <View style={styles.triggerLeft}>
          {selected?.icon ? (
            <MaterialCommunityIcons
              name={selected.icon}
              size={18}
              color={colors.textPrimary}
            />
          ) : null}
          <Text style={[styles.triggerText, !selected && styles.placeholder]}>
            {selected ? selected.label : placeholder}
          </Text>
        </View>
        <MaterialCommunityIcons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={22}
          color={colors.textPrimary}
        />
      </Pressable>

      {isOpen ? (
        <View style={styles.menu}>
          <ScrollView
            bounces={false}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            style={styles.menuScroll}
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              const isLastItem = index === options.length - 1;
              return (
                <Pressable
                  key={option.value}
                  style={({ pressed }) => [
                    styles.menuItem,
                    isLastItem && styles.menuItemLast,
                    isSelected && styles.menuItemSelected,
                    pressed && styles.menuItemPressed,
                  ]}
                  onPress={() => handleSelect(option.value)}
                  android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                >
                  <View style={styles.menuItemLeft}>
                    {option.icon ? (
                      <MaterialCommunityIcons
                        name={option.icon}
                        size={18}
                        color={
                          isSelected ? colors.onBrand : colors.textPrimary
                        }
                      />
                    ) : null}
                    <Text
                      style={[
                        styles.menuText,
                        isSelected && styles.menuTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </View>
                  {isSelected ? (
                    <MaterialCommunityIcons
                      name="check"
                      size={18}
                      color={colors.onBrand}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

export { DropDown };
