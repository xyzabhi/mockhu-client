import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../presentation/theme/theme';

/**
 * Replace with your main app tabs / drawer when ready.
 */
export function MainPlaceholderScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Home</Text>
      <Text style={styles.subtitle}>Main app navigation goes here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f6f8fc',
    paddingHorizontal: 24,
    paddingTop: 32,
    justifyContent: 'center',
  },
  title: {
    fontFamily: theme.typography.bold,
    fontSize: theme.fintSizes.xxl,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    marginTop: 8,
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textMuted,
    lineHeight: 20,
  },
});
