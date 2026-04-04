import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../presentation/theme/theme';

const MOCK_STATS = [
  { label: 'Mocks this week', value: '3', icon: 'clipboard-text-outline' as const },
  { label: 'Streak', value: '5 days', icon: 'fire' as const },
  { label: 'Topics reviewed', value: '12', icon: 'book-check-outline' as const },
];

export function ProgressScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Progress</Text>
      <Text style={styles.subtitle}>A snapshot of your study rhythm — connect to real data later.</Text>
      <View style={styles.grid}>
        {MOCK_STATS.map((row) => (
          <View key={row.label} style={styles.card}>
            <MaterialCommunityIcons name={row.icon} size={28} color={theme.colors.progress} />
            <Text style={styles.value}>{row.value}</Text>
            <Text style={styles.label}>{row.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.surfaceSubtle,
    paddingHorizontal: theme.spacing.screenPaddingH,
    paddingTop: 24,
  },
  title: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fontSizes.screenTitle,
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textMuted,
    lineHeight: 20,
    marginBottom: 24,
  },
  grid: {
    gap: 12,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  value: {
    marginTop: 10,
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.xxl,
    color: theme.colors.textPrimary,
  },
  label: {
    marginTop: 4,
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textMuted,
  },
});
