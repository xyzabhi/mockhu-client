import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../presentation/theme/theme';
import type { RootStackParamList } from '../types';

export function ExploreScreen() {
  const navigation = useNavigation();
  const rootNav = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Explore</Text>
      <Text style={styles.body}>
        Browse exam categories, discover new mocks, and follow topics that match your goals.
      </Text>
      <Pressable
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        onPress={() => rootNav?.navigate('ExamCategories')}
        accessibilityRole="button"
        accessibilityLabel="Browse exams"
        android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
      >
        <MaterialCommunityIcons
          name="book-open-variant"
          size={22}
          color={theme.colors.onBrand}
        />
        <Text style={styles.ctaText}>Browse exams</Text>
      </Pressable>
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
    marginBottom: 12,
  },
  body: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textMuted,
    lineHeight: 22,
    marginBottom: 24,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    alignSelf: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.brand,
    minHeight: 48,
  },
  ctaPressed: {
    opacity: 0.9,
  },
  ctaText: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.md,
    color: theme.colors.onBrand,
  },
});
