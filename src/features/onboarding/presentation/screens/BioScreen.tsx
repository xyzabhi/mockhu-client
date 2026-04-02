import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { theme } from '../../../../presentation/theme/theme';
import type { OnboardingStepScreenProps } from '../../onboardingStepTypes';

const MAX_CHARS = 500;

export function BioScreen({ onStepValidityChange }: OnboardingStepScreenProps) {
  const [bio, setBio] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const length = bio.length;
  const nearLimit = length > MAX_CHARS * 0.85;
  const atLimit = length >= MAX_CHARS;

  const words = useMemo(() => {
    const t = bio.trim();
    return t.length > 0 ? t.split(/\s+/).filter(Boolean).length : 0;
  }, [bio]);

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
      <View style={styles.optionalPill}>
        <MaterialCommunityIcons
          name="information-outline"
          size={14}
          color={theme.colors.textMuted}
        />
        <Text style={styles.optionalPillText}>Optional step</Text>
      </View>

      <Text style={styles.label}>Bio</Text>
      <Text style={styles.hint}>
        A short intro helps others relate to you. Exams, subjects, or hobbies all work.
      </Text>

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
        placeholder="Example: Class 12, focusing on PCM and mock tests on weekends."
        placeholderTextColor={theme.colors.textMuted}
        accessibilityLabel="Bio"
        maxLength={MAX_CHARS}
      />

      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <MaterialCommunityIcons
            name={words >= 3 ? 'check-circle' : 'text-box-outline'}
            size={18}
            color={words >= 3 ? theme.colors.brand : theme.colors.textMuted}
          />
          <Text style={styles.footerLeftText}>
            {words >= 3 ? 'Nice — you’re on track' : 'A sentence or two is enough'}
          </Text>
        </View>
        <Text
          style={[
            styles.charCount,
            nearLimit && styles.charCountWarn,
            atLimit && styles.charCountLimit,
          ]}
        >
          {length}/{MAX_CHARS}
        </Text>
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    flexGrow: 1,
  },
  optionalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginBottom: 20,
  },
  optionalPillText: {
    fontFamily: theme.typography.medium,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.textMuted,
  },
  label: {
    fontFamily: theme.typography.medium,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  hint: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textMuted,
    lineHeight: 20,
    marginBottom: 14,
  },
  input: {
    minHeight: 200,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.md,
    lineHeight: 24,
    color: theme.colors.textPrimary,
    backgroundColor: '#FAFAFA',
  },
  inputHasText: {
    backgroundColor: '#ffffff',
    fontFamily: theme.typography.regular,
  },
  inputFocused: {
    borderColor: theme.colors.borderStrong,
    borderWidth: 2,
    backgroundColor: '#ffffff',
  },
  inputAtLimit: {
    borderColor: theme.colors.brand,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    gap: 12,
  },
  footerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerLeftText: {
    flex: 1,
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.textMuted,
    lineHeight: 16,
  },
  charCount: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.sm,
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
