import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../../../presentation/theme/theme';
import { DropDown } from '../../../../shared/components/DropDown';

export function DOBScreen() {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
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

  const selectedDate = day && month && year ? `${day}/${month}/${year}` : '';

  return (
    <View style={styles.container}>
      <View style={styles.formCard}>
        <View style={styles.row}>
          <View style={styles.colSm}>
            <Text style={styles.label}>Day</Text>
            <DropDown
              value={day}
              onChange={setDay}
              placeholder="DD"
              options={dayOptions}
              isOpen={openField === 'day'}
              onOpenChange={(isOpen) => setOpenField(isOpen ? 'day' : null)}
            />
          </View>
          <View style={styles.colLg}>
            <Text style={styles.label}>Month</Text>
            <DropDown
              value={month}
              onChange={setMonth}
              placeholder="Month"
              options={monthOptions}
              isOpen={openField === 'month'}
              onOpenChange={(isOpen) => setOpenField(isOpen ? 'month' : null)}
            />
          </View>
          <View style={styles.colSm}>
            <Text style={styles.label}>Year</Text>
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
    gap: 14,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  sectionTitle: {
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
  row: {
    flexDirection: 'row',
    columnGap: 10,
    alignItems: 'flex-start',
  },
  colSm: {
    flex: 1,
    gap: 6,
  },
  colLg: {
    flex: 1.4,
    gap: 6,
  },
  label: {
    fontSize: theme.fintSizes.sm,
    fontFamily: theme.typography.medium,
    color: theme.colors.textPrimary,
  },
  selected: {
    marginTop: 2,
    fontFamily: theme.typography.medium,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textPrimary,
  },
});