import { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { theme } from '../../../../presentation/theme/theme';
import type { OnboardingStepScreenProps } from '../../onboardingStepTypes';
import { DropDown } from '../../../../shared/components/DropDown';

const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
  { label: 'Prefer not to say', value: 'prefer_not_to_say' },
] as const;

export function NameGenderScreen({
  onStepValidityChange,
}: OnboardingStepScreenProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [focusedField, setFocusedField] = useState<'firstName' | 'lastName' | null>(null);
  const [openField, setOpenField] = useState<'gender' | null>(null);

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
            firstName.length > 0 ? styles.inputFilled : styles.inputPlaceholderTypography,
            focusedField === 'firstName' && styles.inputFocused,
          ]}
          placeholder="First"
          placeholderTextColor={theme.colors.textMuted}
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
            lastName.length > 0 ? styles.inputFilled : styles.inputPlaceholderTypography,
            focusedField === 'lastName' && styles.inputFocused,
          ]}
          placeholder="Last"
          placeholderTextColor={theme.colors.textMuted}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingTop: 4,
    gap: 20,
  },
  field: {
    width: '100%',
    gap: 6,
    zIndex: 1,
  },
  fieldRaised: {
    zIndex: 40,
  },
  label: {
    fontSize: theme.fintSizes.sm,
    fontFamily: theme.typography.medium,
    color: theme.colors.textPrimary,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: theme.fintSizes.md,
    color: theme.colors.textPrimary,
    backgroundColor: '#ffffff',
  },
  inputPlaceholderTypography: {
    fontFamily: theme.typography.regular,
  },
  inputFilled: {
    fontFamily: theme.typography.semiBold,
  },
  inputFocused: {
    borderColor: theme.colors.borderStrong,
    borderWidth: 2,
  },
});
