import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from './theme';
import {
  type ThemeColors,
  type ThemePreference,
  useThemeColors,
  useThemePreference,
} from './ThemeContext';

const OPTIONS: { id: ThemePreference; label: string }[] = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'System' },
];

export function ThemeAppearanceToggle() {
  const colors = useThemeColors();
  const { preference, setPreference } = useThemePreference();
  const styles = useMemo(() => createToggleStyles(colors), [colors]);

  return (
    <View style={styles.wrap} accessibilityRole="radiogroup" accessibilityLabel="App appearance">
      <Text style={styles.title}>Appearance</Text>
      <View style={styles.row}>
        {OPTIONS.map(({ id, label }) => {
          const selected = preference === id;
          return (
            <Pressable
              key={id}
              onPress={() => setPreference(id)}
              style={({ pressed }) => [
                styles.chip,
                selected && styles.chipSelected,
                pressed && styles.chipPressed,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function createToggleStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      marginTop: 24,
      alignSelf: 'stretch',
    },
    title: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.sm,
      color: colors.textMuted,
      marginBottom: 10,
      letterSpacing: 0.2,
    },
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: theme.radius.pill,
      borderWidth: theme.borderWidth.default,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surface,
    },
    chipSelected: {
      borderColor: colors.brand,
      backgroundColor: colors.brandLight,
    },
    chipPressed: {
      opacity: 0.88,
    },
    chipText: {
      fontFamily: theme.typography.medium,
      fontSize: theme.fintSizes.sm,
      color: colors.textPrimary,
    },
    chipTextSelected: {
      fontFamily: theme.typography.semiBold,
      color: colors.brand,
    },
  });
}
