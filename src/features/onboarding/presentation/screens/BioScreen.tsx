import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { theme } from '../../../../presentation/theme/theme';
import { useOnboardingDraft } from '../../OnboardingDraftContext';
import type { OnboardingStepScreenProps } from '../../onboardingStepTypes';

const MAX_CHARS = 500;

export function BioScreen({ onStepValidityChange }: OnboardingStepScreenProps) {
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
        placeholderTextColor={theme.colors.textMuted}
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

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.screenPaddingH,
    paddingTop: 4,
    paddingBottom: 24,
    flexGrow: 1,
  },
  input: {
    minHeight: 160,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.md,
    lineHeight: 24,
    color: theme.colors.textPrimary,
    backgroundColor: '#ffffff',
  },
  inputHasText: {
    backgroundColor: '#ffffff',
    fontFamily: theme.typography.regular,
  },
  inputFocused: {
    borderColor: theme.colors.brand,
    borderWidth: 2,
    backgroundColor: '#ffffff',
  },
  inputAtLimit: {
    borderColor: theme.colors.brand,
  },
  charCount: {
    alignSelf: 'flex-end',
    marginTop: 10,
    fontFamily: theme.typography.medium,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  charCountWarn: {
    color: theme.colors.textPrimary,
  },
  charCountLimit: {
    color: theme.colors.brand,
  },
});
