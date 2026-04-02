import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../presentation/theme/theme';

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

function DropDown({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  isOpen: controlledIsOpen,
  onOpenChange,
}: DropDownProps) {
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
          isOpen && styles.triggerFocused,
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
              color={theme.colors.textPrimary}
            />
          ) : null}
          <Text style={[styles.triggerText, !selected && styles.placeholder]}>
            {selected ? selected.label : placeholder}
          </Text>
        </View>
        <MaterialCommunityIcons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={theme.colors.textPrimary}
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
                      color={theme.colors.textPrimary}
                    />
                  ) : null}
                  <Text style={[styles.menuText, isSelected && styles.menuTextSelected]}>
                    {option.label}
                  </Text>
                </View>
                {isSelected ? (
                  <MaterialCommunityIcons
                    name="check"
                    size={18}
                    color={theme.colors.textPrimary}
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

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    zIndex: 30,
  },
  trigger: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerFocused: {
    borderColor: theme.colors.borderStrong,
    borderWidth: 2,
  },
  triggerPressed: {
    opacity: 0.96,
  },
  triggerText: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textPrimary,
  },
  triggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  placeholder: {
    fontFamily: theme.typography.regular,
    color: theme.colors.textMuted,
  },
  menu: {
    position: 'absolute',
    top: 54,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
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
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemSelected: {
    backgroundColor: '#F3F4F6',
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
    color: theme.colors.textPrimary,
  },
  menuTextSelected: {
    fontFamily: theme.typography.semiBold,
  },
});

export { DropDown };