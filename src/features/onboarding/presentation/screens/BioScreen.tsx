import { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import {
  type ThemeColors,
  useThemeColors,
} from '../../../../presentation/theme/ThemeContext';
import { theme } from '../../../../presentation/theme/theme';
import { useOnboardingDraft } from '../../OnboardingDraftContext';
import type { OnboardingStepScreenProps } from '../../onboardingStepTypes';
import {
  createOnboardingStepStyles,
  onboardingInputShadow,
  ONBOARDING_INPUT_RADIUS,
} from '../../onboardingStepStyles';

const MAX_CHARS = 500;

function createBioStyles(colors: ThemeColors) {
  const shadow = onboardingInputShadow();
  return StyleSheet.create({
    input: {
      minHeight: 160,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: ONBOARDING_INPUT_RADIUS,
      paddingHorizontal: 16,
      paddingVertical: 16,
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.md,
      lineHeight: 24,
      color: colors.textPrimary,
      backgroundColor: colors.surface,
      ...shadow,
    },
    inputHasText: {
      backgroundColor: colors.surface,
      fontFamily: theme.typography.regular,
    },
    inputFocused: {
      borderColor: colors.brand,
      borderWidth: 2,
      backgroundColor: colors.surface,
      ...Platform.select({
        ios: { shadowOpacity: 0, shadowRadius: 0 },
        android: { elevation: 0 },
        default: {},
      }),
    },
    inputAtLimit: {
      borderColor: colors.brand,
    },
    charCount: {
      alignSelf: 'flex-end',
      marginTop: 10,
      fontFamily: theme.typography.medium,
      fontSize: theme.fintSizes.xs,
      color: colors.textMuted,
      fontVariant: ['tabular-nums'],
    },
    charCountWarn: {
      color: colors.textPrimary,
    },
    charCountLimit: {
      color: colors.brand,
    },
  });
}

export function BioScreen({ onStepValidityChange }: OnboardingStepScreenProps) {
  const colors = useThemeColors();
  const styles = useMemo(
    () => ({
      ...createOnboardingStepStyles(colors),
      ...createBioStyles(colors),
    }),
    [colors],
  );
  const { draft, updateDraft } = useOnboardingDraft();
  const [bio, setBio] = useState(draft.bio);
  const [isFocused, setIsFocused] = useState(false);

  const length = bio.length;
  const nearLimit = length > MAX_CHARS * 0.85;
  const atLimit = length >= MAX_CHARS;

  useEffect(() => {
    updateDraft({ bio });
  }, [bio, updateDraft]);

  useEffect(() => {
    onStepValidityChange?.(true);
  }, [onStepValidityChange]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.sectionLabel}>Bio</Text>
      <TextInput
        style={[
          styles.input,
          length > 0 ? styles.inputHasText : null,
          isFocused && styles.inputFocused,
          atLimit && styles.inputAtLimit,
        ]}
        value={bio}
        onChangeText={(t) => setBio(t.slice(0, MAX_CHARS))}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        multiline
        textAlignVertical="top"
        placeholder="Optional"
        placeholderTextColor={colors.textMuted}
        accessibilityLabel="Bio"
        maxLength={MAX_CHARS}
      />

      <Text
        style={[
          styles.charCount,
          nearLimit && styles.charCountWarn,
          atLimit && styles.charCountLimit,
        ]}
      >
        {length}/{MAX_CHARS}
      </Text>
    </ScrollView>
  );
}
