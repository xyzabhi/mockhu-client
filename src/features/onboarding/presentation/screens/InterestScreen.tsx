import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../../../presentation/theme/theme';
import type { OnboardingStepScreenProps } from '../../onboardingStepTypes';

export function InterestScreen({ onStepValidityChange }: OnboardingStepScreenProps) {
  useEffect(() => {
    onStepValidityChange?.(true);
  }, [onStepValidityChange]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Interest Screen</Text>
      <Text style={styles.subtitle}>Placeholder — white background.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  title: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.lg,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    marginTop: 8,
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textMuted,
  },
});
