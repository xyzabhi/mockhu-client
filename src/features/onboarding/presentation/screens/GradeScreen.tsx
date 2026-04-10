import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useThemeColors } from '../../../../presentation/theme/ThemeContext';
import { useOnboardingDraft } from '../../OnboardingDraftContext';
import type { OnboardingStepScreenProps } from '../../onboardingStepTypes';
import { createOnboardingStepStyles } from '../../onboardingStepStyles';
import { DropDown } from '../../../../shared/components/DropDown';

/** Maps to `grade` in onboarding / profile payloads. */
const GRADE_OPTIONS = [
  { label: 'Class / Grade 1', value: '1' },
  { label: 'Class / Grade 2', value: '2' },
  { label: 'Class / Grade 3', value: '3' },
  { label: 'Class / Grade 4', value: '4' },
  { label: 'Class / Grade 5', value: '5' },
  { label: 'Class / Grade 6', value: '6' },
  { label: 'Class / Grade 7', value: '7' },
  { label: 'Class / Grade 8', value: '8' },
  { label: 'Class / Grade 9', value: '9' },
  { label: 'Class / Grade 10', value: '10' },
  { label: 'Class / Grade 11', value: '11' },
  { label: 'Class / Grade 12', value: '12' },
  { label: 'Undergraduate', value: 'undergraduate' },
  { label: 'Graduate', value: 'graduate' },
  { label: 'Other', value: 'other' },
] as const;

export function GradeScreen({ onStepValidityChange }: OnboardingStepScreenProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createOnboardingStepStyles(colors), [colors]);
  const { draft, updateDraft } = useOnboardingDraft();
  const [grade, setGrade] = useState(draft.grade);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    updateDraft({ grade });
  }, [grade, updateDraft]);

  useEffect(() => {
    onStepValidityChange?.(grade.length > 0);
  }, [grade, onStepValidityChange]);

  return (
    <View style={styles.container}>
      <View style={[styles.field, open && styles.fieldRaised]}>
        <Text style={styles.fieldLabel}>Class / Grade</Text>
        <DropDown
          options={[...GRADE_OPTIONS]}
          value={grade}
          onChange={setGrade}
          placeholder="Select your class or grade"
          isOpen={open}
          onOpenChange={setOpen}
        />
      </View>
    </View>
  );
}
