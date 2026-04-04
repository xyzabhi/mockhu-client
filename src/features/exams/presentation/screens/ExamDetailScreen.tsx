import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useExamById } from '../../../../api';
import { theme } from '../../../../presentation/theme/theme';
import type { RootStackParamList } from '../../../../navigation/types';

export type ExamDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'ExamDetail'>;

export function ExamDetailScreen({ navigation, route }: ExamDetailScreenProps) {
  const { examId } = route.params;
  const { exam, loading, error } = useExamById(examId);

  useEffect(() => {
    navigation.setOptions({
      title: exam?.name ?? 'Exam',
    });
  }, [exam?.name, navigation]);

  if (loading && !exam) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.brand} />
      </View>
    );
  }

  if (error && !exam) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error.message}</Text>
      </View>
    );
  }

  if (!exam) {
    return null;
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        {exam.icon_url ? (
          <Image source={{ uri: exam.icon_url }} style={styles.heroImage} />
        ) : (
          <View style={styles.heroPlaceholder}>
            <MaterialCommunityIcons name="file-document-outline" size={40} color={theme.colors.textMuted} />
          </View>
        )}
      </View>
      <Text style={styles.title}>{exam.name}</Text>
      {exam.description ? <Text style={styles.description}>{exam.description}</Text> : null}
      <View style={styles.metaRow}>
        <MaterialCommunityIcons name="account-group-outline" size={18} color={theme.colors.textMuted} />
        <Text style={styles.metaText}>{exam.user_count.toLocaleString()} learners</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  hero: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  heroImage: {
    width: 96,
    height: 96,
    borderRadius: 20,
  },
  heroPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: theme.typography.bold,
    fontSize: theme.fintSizes.xl,
    color: theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  description: {
    marginTop: 12,
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.md,
    color: theme.colors.textMuted,
    lineHeight: 24,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  metaText: {
    fontFamily: theme.typography.medium,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textMuted,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  errorText: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
});
