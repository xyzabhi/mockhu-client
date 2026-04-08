import { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  type ThemeColors,
  useThemeColors,
} from '../../../../presentation/theme/ThemeContext';
import { theme } from '../../../../presentation/theme/theme';
import { useOnboardingDraft } from '../../OnboardingDraftContext';
import type { OnboardingStepScreenProps } from '../../onboardingStepTypes';
import { DropDown } from '../../../../shared/components/DropDown';

const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
  { label: 'Prefer not to say', value: 'prefer_not_to_say' },
] as const;

const INPUT_RADIUS = 24;

function createNameGenderStyles(colors: ThemeColors) {
  const inputShadow = Platform.select({
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
      flex: 1,
      backgroundColor: colors.surface,
      paddingHorizontal: theme.spacing.screenPaddingH,
      paddingTop: 4,
      gap: 20,
    },
    field: {
      width: '100%',
      gap: 8,
      zIndex: 1,
    },
    fieldRaised: {
      zIndex: 40,
    },
    label: {
      fontSize: theme.fintSizes.sm,
      fontFamily: theme.typography.semiBold,
      color: colors.textPrimary,
      letterSpacing: -0.1,
    },
    input: {
      minHeight: 52,
      borderRadius: INPUT_RADIUS,
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
  const styles = useMemo(() => createNameGenderStyles(colors), [colors]);
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
        <Text style={styles.label}>First</Text>
        <TextInput
          style={[
            styles.input,
            styles.inputIdle,
            focusedField === 'firstName' && styles.inputFocused,
            firstName.length > 0 ? styles.inputFilled : styles.inputPlaceholderTypography,
          ]}
          placeholder="First"
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
        <Text style={styles.label}>Last</Text>
        <TextInput
          style={[
            styles.input,
            styles.inputIdle,
            focusedField === 'lastName' && styles.inputFocused,
            lastName.length > 0 ? styles.inputFilled : styles.inputPlaceholderTypography,
          ]}
          placeholder="Last"
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
        <Text style={styles.label}>Gender</Text>
        <DropDown
          options={[...GENDER_OPTIONS]}
          value={gender}
          onChange={setGender}
          placeholder="Choose"
          isOpen={openField === 'gender'}
          onOpenChange={(open) => setOpenField(open ? 'gender' : null)}
        />
      </View>
    </View>
  );
}
