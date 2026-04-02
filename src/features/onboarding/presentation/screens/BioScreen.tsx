import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { theme } from '../../../../presentation/theme/theme';

const MIN_WORDS = 50;

export function BioScreen() {
  const [bio, setBio] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const words = useMemo(() => {
    const trimmed = bio.trim();
    return trimmed.length > 0 ? trimmed.split(/\s+/).length : 0;
  }, [bio]);

  const remaining = Math.max(0, MIN_WORDS - words);
  const isValid = words >= MIN_WORDS;

  return (
    <View style={styles.container}>
      <View style={styles.formCard}>
        <TextInput
          style={[styles.input, isFocused && styles.inputFocused]}
          value={bio}
          onChangeText={setBio}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          multiline
          textAlignVertical="top"
          placeholder="I am a class 11 student preparing for IIT JEE. I enjoy Physics and Mathematics, especially solving challenging numericals and improving my concepts every week. I follow a daily study plan, revise short notes, and take mock tests on weekends. I am working on time management, accuracy, and consistency to build confidence and achieve my target rank."
          placeholderTextColor={theme.colors.textMuted}
        />

        <Text style={[styles.counter, isValid ? styles.counterValid : styles.counterMuted]}>
          {isValid ? `Great! ${words} words` : `${words}/50 words (${remaining} more to go)`}
        </Text>
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
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  title: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.xl,
    color: theme.colors.textPrimary,
  },
  helper: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  input: {
    minHeight: 170,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface,
  },
  inputFocused: {
    borderColor: theme.colors.borderStrong,
    borderWidth: 2,
  },
  counter: {
    fontFamily: theme.typography.medium,
    fontSize: theme.fintSizes.sm,
  },
  counterMuted: {
    color: theme.colors.textMuted,
  },
  counterValid: {
    color: theme.colors.textPrimary,
  },
});
