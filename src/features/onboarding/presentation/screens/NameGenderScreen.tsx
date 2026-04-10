import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
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
import { DropDown } from '../../../../shared/components/DropDown';

const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
  { label: 'Prefer not to say', value: 'prefer_not_to_say' },
] as const;

function createNameGenderStyles(colors: ThemeColors) {
  const inputShadow = onboardingInputShadow();

  return StyleSheet.create({
    input: {
      minHeight: 52,
      borderRadius: ONBOARDING_INPUT_RADIUS,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: theme.fintSizes.md,
      color: colors.textPrimary,
    },
    inputIdle: {
      borderWidth: 1,
      borderColor: colors.inputBorder,
      backgroundColor: colors.surface,
      ...inputShadow,
    },
    inputFocused: {
      borderWidth: 2,
      borderColor: colors.brand,
      backgroundColor: colors.surface,
    },
    inputPlaceholderTypography: {
      fontFamily: theme.typography.regular,
    },
    inputFilled: {
      fontFamily: theme.typography.semiBold,
    },
  });
}

export function NameGenderScreen({
  onStepValidityChange,
}: OnboardingStepScreenProps) {
  const colors = useThemeColors();
  const styles = useMemo(
    () => ({
      ...createOnboardingStepStyles(colors),
      ...createNameGenderStyles(colors),
    }),
    [colors],
  );
  const { draft, updateDraft } = useOnboardingDraft();
  const [firstName, setFirstName] = useState(draft.first_name);
  const [lastName, setLastName] = useState(draft.last_name);
  const [gender, setGender] = useState(draft.gender);
  const [focusedField, setFocusedField] = useState<'firstName' | 'lastName' | null>(
    null,
  );
  const [openField, setOpenField] = useState<'gender' | null>(null);

  useEffect(() => {
    updateDraft({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      gender,
    });
  }, [firstName, lastName, gender, updateDraft]);

  useEffect(() => {
    const ok =
      firstName.trim().length > 0 &&
      lastName.trim().length > 0 &&
      gender.length > 0;
    onStepValidityChange?.(ok);
  }, [firstName, lastName, gender, onStepValidityChange]);

  return (
    <View style={styles.container}>
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>First name</Text>
        <TextInput
          style={[
            styles.input,
            styles.inputIdle,
            focusedField === 'firstName' && styles.inputFocused,
            firstName.length > 0 ? styles.inputFilled : styles.inputPlaceholderTypography,
          ]}
          placeholder="First name"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="words"
          value={firstName}
          onChangeText={setFirstName}
          onFocus={() => setFocusedField('firstName')}
          onBlur={() => setFocusedField(null)}
          accessibilityLabel="First name"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Last name</Text>
        <TextInput
          style={[
            styles.input,
            styles.inputIdle,
            focusedField === 'lastName' && styles.inputFocused,
            lastName.length > 0 ? styles.inputFilled : styles.inputPlaceholderTypography,
          ]}
          placeholder="Last name"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="words"
          value={lastName}
          onChangeText={setLastName}
          onFocus={() => setFocusedField('lastName')}
          onBlur={() => setFocusedField(null)}
          accessibilityLabel="Last name"
        />
      </View>

      <View style={[styles.field, openField === 'gender' && styles.fieldRaised]}>
        <Text style={styles.fieldLabel}>Gender</Text>
        <DropDown
          options={[...GENDER_OPTIONS]}
          value={gender}
          onChange={setGender}
          placeholder="Choose gender"
          isOpen={openField === 'gender'}
          onOpenChange={(open) => setOpenField(open ? 'gender' : null)}
        />
      </View>
    </View>
  );
}
