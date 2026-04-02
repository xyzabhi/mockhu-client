import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../../../presentation/theme/theme';
import type { OnboardingStepScreenProps } from '../../onboardingStepTypes';

const OPTIONS = [
  'Exams',
  'STEM',
  'Languages',
  'Arts',
  'Sports',
  'Reading',
  'Career',
  'Mocks',
  'Debate',
  'Music',
  'Writing',
  'Science',
] as const;

export function InterestScreen({ onStepValidityChange }: OnboardingStepScreenProps) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    onStepValidityChange?.(true);
  }, [onStepValidityChange]);

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.chips}>
        {OPTIONS.map((label) => {
          const on = selected.has(label);
          return (
            <Pressable
              key={label}
              onPress={() => toggle(label)}
              style={({ pressed }) => [
                styles.chip,
                on && styles.chipSelected,
                pressed && styles.chipPressed,
              ]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={label}
            >
              <Text style={[styles.chipLabel, on && styles.chipLabelSelected]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 24,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: '#ffffff',
  },
  chipSelected: {
    borderColor: theme.colors.brand,
    backgroundColor: 'rgba(0, 210, 106, 0.08)',
  },
  chipPressed: {
    opacity: 0.85,
  },
  chipLabel: {
    fontFamily: theme.typography.medium,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textPrimary,
  },
  chipLabelSelected: {
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.semiBold,
  },
});
