import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { theme } from '../../../../presentation/theme/theme';
import { DropDown } from '../../../../shared/components/DropDown';

export function NameDobScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [focusedField, setFocusedField] = useState<'firstName' | 'lastName' | null>(null);

  return (
    <View style={styles.container}>
      <View style={styles.formCard}>

        <View style={styles.form}>
          <View style={styles.nameRow}>
            <View style={styles.halfField}>
              <Text style={styles.label}>First name</Text>
              <TextInput
                style={[
                  styles.input,
                  firstName.length > 0 ? styles.inputFilled : styles.inputDefault,
                  focusedField === 'firstName' ? styles.inputFocused : null,
                ]}
                placeholder="First"
                placeholderTextColor={theme.colors.textMuted}
                autoCapitalize="words"
                value={firstName}
                onChangeText={setFirstName}
                onFocus={() => setFocusedField('firstName')}
                onBlur={() => setFocusedField(null)}
              />
               
            </View>

            <View style={styles.halfField}>
              <Text style={styles.label}>Last name</Text>
              <TextInput
                style={[
                  styles.input,
                  lastName.length > 0 ? styles.inputFilled : styles.inputDefault,
                  focusedField === 'lastName' ? styles.inputFocused : null,
                ]}
                placeholder="Last"
                placeholderTextColor={theme.colors.textMuted}
                autoCapitalize="words"
                value={lastName}
                onChangeText={setLastName}
                onFocus={() => setFocusedField('lastName')}
                onBlur={() => setFocusedField(null)}
              />
              
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Gender</Text>
            <DropDown
              options={[
                { label: 'Male', value: 'male'},
                { label: 'Female', value: 'female' },
                { label: 'Other', value: 'other' },
                { label: 'Prefer not to say', value: 'prefer_not_to_say' },
              ]}
              value={gender}
              onChange={setGender}
              placeholder="Select gender"
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  formCard: {
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    padding: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  form: {
    width: '100%',
    gap: 14,
  },
  nameRow: {
    width: '100%',
    flexDirection: 'row',
    columnGap: 10,
  },
  halfField: {
    flex: 1,
    gap: 6,
  },
  field: {
    width: '100%',
    gap: 6,
  },
  label: {
    fontSize: theme.fintSizes.sm,
    fontFamily: theme.typography.medium,
    color: theme.colors.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface,
    height: 48,
  },
  inputDefault: {
    fontFamily: theme.typography.regular,
    color: theme.colors.textMuted,
    borderColor: theme.colors.borderSubtle,
  },
  inputFocused: {
    borderColor: theme.colors.borderStrong,
    borderWidth: 2,
  },
  inputFilled: {
    fontFamily: theme.typography.medium,
    color: theme.colors.textPrimary,
  },
});
