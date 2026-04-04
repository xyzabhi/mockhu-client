import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../presentation/theme/theme';
import type { RootStackParamList } from '../types';

export function InboxScreen() {
  const navigation = useNavigation();
  const rootNav = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.root}>
      <View style={styles.emptyBlock}>
        <MaterialCommunityIcons name="inbox-arrow-down-outline" size={48} color={theme.colors.textHint} />
        <Text style={styles.emptyTitle}>No notifications yet</Text>
        <Text style={styles.emptySub}>
          Replies, mentions, and updates will show up here when they are available.
        </Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => rootNav?.navigate('ExamCategories')}
        accessibilityRole="button"
        accessibilityLabel="Browse exam catalog"
      >
        <View style={styles.cardIconWrap}>
          <MaterialCommunityIcons name="school-outline" size={26} color={theme.colors.brand} />
        </View>
        <View style={styles.cardTextCol}>
          <Text style={styles.cardTitle}>Exam catalog</Text>
          <Text style={styles.cardBody}>Browse categories and pick exams you care about.</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.textHint} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.surfaceSubtle,
    paddingHorizontal: theme.spacing.screenPaddingH,
  },
  emptyBlock: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 12,
  },
  emptyTitle: {
    marginTop: 16,
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.lg,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  emptySub: {
    marginTop: 8,
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  cardPressed: {
    opacity: 0.92,
  },
  cardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.badge,
    backgroundColor: theme.colors.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextCol: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.md,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  cardBody: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
});
