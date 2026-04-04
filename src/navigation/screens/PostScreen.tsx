import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../presentation/theme/theme';

export function PostScreen() {
  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <MaterialCommunityIcons name="plus-circle-outline" size={56} color={theme.colors.brand} />
        <Text style={styles.title}>Create a post</Text>
        <Text style={styles.body}>
          Share tips, questions, or wins with students preparing for the same exams. This screen
          will hook up to compose and publish when the API is ready.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.surfaceSubtle,
    paddingHorizontal: theme.spacing.screenPaddingH,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  title: {
    marginTop: 16,
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fontSizes.screenTitle,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  body: {
    marginTop: 12,
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textMuted,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
  },
});
