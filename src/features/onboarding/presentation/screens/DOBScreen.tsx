import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useThemeColors } from '../../../../presentation/theme/ThemeContext';
import { useOnboardingDraft } from '../../OnboardingDraftContext';
import type { OnboardingStepScreenProps } from '../../onboardingStepTypes';
import { createOnboardingStepStyles } from '../../onboardingStepStyles';
import { DropDown } from '../../../../shared/components/DropDown';

function splitDob(iso: string): { day: string; month: string; year: string } {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return { day: '', month: '', year: '' };
  return { year: m[1], month: m[2], day: m[3] };
}

export function DOBScreen({ onStepValidityChange }: OnboardingStepScreenProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createOnboardingStepStyles(colors), [colors]);
  const { draft, updateDraft } = useOnboardingDraft();
  const initial = splitDob(draft.dob);
  const [day, setDay] = useState(initial.day);
  const [month, setMonth] = useState(initial.month);
  const [year, setYear] = useState(initial.year);
  const [openField, setOpenField] = useState<'day' | 'month' | 'year' | null>(null);

  const dayOptions = useMemo(
    () => Array.from({ length: 31 }, (_, i) => {
      const value = String(i + 1).padStart(2, '0');
      return { label: value, value };
    }),
    [],
  );

  const monthOptions = useMemo(
    () => [
      { label: 'January', value: '01' },
      { label: 'February', value: '02' },
      { label: 'March', value: '03' },
      { label: 'April', value: '04' },
      { label: 'May', value: '05' },
      { label: 'June', value: '06' },
      { label: 'July', value: '07' },
      { label: 'August', value: '08' },
      { label: 'September', value: '09' },
      { label: 'October', value: '10' },
      { label: 'November', value: '11' },
      { label: 'December', value: '12' },
    ],
    [],
  );

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 90 }, (_, i) => {
      const value = String(currentYear - 13 - i);
      return { label: value, value };
    });
  }, []);

  useEffect(() => {
    const dob = day && month && year ? `${year}-${month}-${day}` : '';
    updateDraft({ dob });
  }, [day, month, year, updateDraft]);

  useEffect(() => {
    onStepValidityChange?.(Boolean(day && month && year));
  }, [day, month, year, onStepValidityChange]);

  return (
    <View style={styles.container}>
      <View style={styles.dobRow}>
        <View style={styles.dobColSm}>
          <Text style={styles.fieldLabel}>Day</Text>
          <DropDown
            value={day}
            onChange={setDay}
            placeholder="DD"
            options={dayOptions}
            isOpen={openField === 'day'}
            onOpenChange={(isOpen) => setOpenField(isOpen ? 'day' : null)}
          />
        </View>
        <View style={styles.dobColLg}>
          <Text style={styles.fieldLabel}>Month</Text>
          <DropDown
            value={month}
            onChange={setMonth}
            placeholder="Month"
            options={monthOptions}
            isOpen={openField === 'month'}
            onOpenChange={(isOpen) => setOpenField(isOpen ? 'month' : null)}
          />
        </View>
        <View style={styles.dobColSm}>
          <Text style={styles.fieldLabel}>Year</Text>
          <DropDown
            value={year}
            onChange={setYear}
            placeholder="YYYY"
            options={yearOptions}
            isOpen={openField === 'year'}
            onOpenChange={(isOpen) => setOpenField(isOpen ? 'year' : null)}
          />
        </View>
      </View>
    </View>
  );
}