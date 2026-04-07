import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  examCatalogApi,
  normalizeTokenUserProfile,
  useSession,
  useUserInterests,
} from '../../api';
import type { Exam } from '../../api/exam/types';
import { theme } from '../../presentation/theme/theme';
import { type ThemeColors, useThemeColors } from '../../presentation/theme/ThemeContext';

const MOCK_STATS = [
  { label: 'Mocks this week', value: '3', icon: 'clipboard-text-outline' as const },
  { label: 'Streak', value: '5 days', icon: 'fire' as const },
  { label: 'Topics reviewed', value: '12', icon: 'book-check-outline' as const },
];

type ProgressTab = 'all' | number;

export function ProgressScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createProgressStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { user } = useSession();
  const profile = user ? normalizeTokenUserProfile(user) : null;
  const currentUserId = profile?.id?.trim();

  const { examIdsForFilter, loading: interestsLoading, error: interestsError } =
    useUserInterests(currentUserId);

  const uniqueExamIds = useMemo(
    () => [...new Set(examIdsForFilter)].sort((a, b) => a - b),
    [examIdsForFilter],
  );

  /** Stable string so we only reset the selected tab when interests actually change. */
  const examIdsKey = useMemo(
    () => uniqueExamIds.join(','),
    [uniqueExamIds],
  );

  const [examMeta, setExamMeta] = useState<Map<number, Exam>>(new Map());
  const [examsLoading, setExamsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<ProgressTab>('all');

  useEffect(() => {
    if (uniqueExamIds.length === 0) {
      setExamMeta(new Map());
      setExamsLoading(false);
      return;
    }
    let cancelled = false;
    setExamsLoading(true);
    void (async () => {
      const pairs = await Promise.all(
        uniqueExamIds.map(async (id) => {
          try {
            const e = await examCatalogApi.getExam(id);
            return [id, e] as const;
          } catch {
            return [id, null] as const;
          }
        }),
      );
      if (cancelled) return;
      const next = new Map<number, Exam>();
      for (const [id, e] of pairs) {
        if (e) next.set(id, e);
      }
      setExamMeta(next);
    })()
      .finally(() => {
        if (!cancelled) setExamsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [uniqueExamIds]);

  /** Tabs: one exam → single tab; multiple → "All" plus each exam, sorted by name. */
  const tabs = useMemo(() => {
    const rows: { key: string; tab: ProgressTab; label: string }[] = [];
    if (uniqueExamIds.length === 0) return rows;
    const withNames = uniqueExamIds.map((id) => ({
      id,
      name: examMeta.get(id)?.name?.trim() ?? `Exam #${id}`,
    }));
    withNames.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    if (uniqueExamIds.length === 1) {
      const { id, name } = withNames[0];
      rows.push({ key: `exam-${id}`, tab: id, label: name });
      return rows;
    }
    rows.push({ key: 'all', tab: 'all', label: 'All' });
    for (const { id, name } of withNames) {
      rows.push({ key: `exam-${id}`, tab: id, label: name });
    }
    return rows;
  }, [uniqueExamIds, examMeta]);

  useEffect(() => {
    if (!examIdsKey) return;
    const ids = examIdsKey.split(',').map(Number).filter((n) => Number.isFinite(n));
    if (ids.length === 1) setSelectedTab(ids[0]!);
    else if (ids.length > 1) setSelectedTab('all');
  }, [examIdsKey]);

  const contextSubtitle = useMemo(() => {
    if (uniqueExamIds.length === 0) {
      return 'Add exam interests in your profile to see per-exam progress here.';
    }
    if (selectedTab === 'all') {
      return 'A snapshot across every exam you follow — connect to real data later.';
    }
    const name = examMeta.get(selectedTab)?.name?.trim() ?? `Exam #${selectedTab}`;
    return `Progress for ${name} — connect to real data later.`;
  }, [selectedTab, uniqueExamIds.length, examMeta]);

  const showInterestsGate = currentUserId != null && !interestsLoading && uniqueExamIds.length === 0;

  const onSelectTab = useCallback((tab: ProgressTab) => {
    setSelectedTab(tab);
  }, []);

  return (
    <View style={[styles.root, { paddingTop: Math.max(insets.top, 8) }]}>
      <Text style={styles.title}>Progress</Text>

      {!currentUserId ? (
        <Text style={styles.subtitle}>
          Sign in to see progress broken down by the exams you care about.
        </Text>
      ) : interestsLoading ? (
        <View style={styles.centerRow}>
          <ActivityIndicator size="small" color={colors.brand} />
          <Text style={styles.mutedInline}>Loading your interests…</Text>
        </View>
      ) : interestsError ? (
        <Text style={styles.errorText}>{interestsError.message}</Text>
      ) : showInterestsGate ? (
        <Text style={styles.subtitle}>
          You have not added exam interests yet. Add them from your profile or onboarding to unlock
          per-exam tabs here.
        </Text>
      ) : (
        <>
          {tabs.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipScroll}
              contentContainerStyle={styles.chipScrollContent}
              accessibilityLabel="Progress by exam"
            >
              {tabs.map(({ key, tab, label }) => {
                const selected =
                  tab === 'all' ? selectedTab === 'all' : selectedTab === tab;
                return (
                  <Pressable
                    key={key}
                    onPress={() => onSelectTab(tab)}
                    style={({ pressed }) => [
                      styles.chip,
                      selected && styles.chipSelected,
                      pressed && styles.chipPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${label} progress`}
                  >
                    <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]} numberOfLines={1}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}

          {examsLoading && uniqueExamIds.length > 0 ? (
            <View style={styles.centerRow}>
              <ActivityIndicator size="small" color={colors.brand} />
              <Text style={styles.mutedInline}>Loading exam names…</Text>
            </View>
          ) : null}

          <Text style={styles.subtitle}>{contextSubtitle}</Text>
        </>
      )}

      <View style={styles.grid}>
        {MOCK_STATS.map((row) => (
          <View key={row.label} style={styles.card}>
            <MaterialCommunityIcons name={row.icon} size={28} color={colors.progress} />
            <Text style={styles.value}>{row.value}</Text>
            <Text style={styles.label}>{row.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function createProgressStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.surfaceSubtle,
      paddingHorizontal: theme.spacing.screenPaddingH,
    },
    title: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fontSizes.screenTitle,
      color: colors.textPrimary,
      marginBottom: 8,
    },
    subtitle: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.textMuted,
      lineHeight: 20,
      marginBottom: 20,
    },
    centerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 16,
    },
    mutedInline: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.textMuted,
    },
    errorText: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.danger,
      marginBottom: 16,
    },
    chipScroll: {
      marginBottom: 12,
      flexGrow: 0,
    },
    chipScrollContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingBottom: 4,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: theme.radius.pill,
      backgroundColor: colors.surfaceSubtle,
      borderWidth: theme.borderWidth.default,
      borderColor: colors.borderSubtle,
      maxWidth: 220,
    },
    chipSelected: {
      backgroundColor: colors.brand,
      borderWidth: 1,
      borderColor: colors.buttonBorder,
    },
    chipPressed: {
      opacity: 0.88,
    },
    chipLabel: {
      fontFamily: theme.typography.medium,
      fontSize: theme.fontSizes.filterChip,
      color: colors.textPrimary,
    },
    chipLabelSelected: {
      color: colors.onBrand,
    },
    grid: {
      gap: 12,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: theme.radius.card,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    value: {
      marginTop: 10,
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.xxl,
      color: colors.textPrimary,
    },
    label: {
      marginTop: 4,
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.textMuted,
    },
  });
}
