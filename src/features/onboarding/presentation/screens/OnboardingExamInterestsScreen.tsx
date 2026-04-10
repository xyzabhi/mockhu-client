import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useExamCategories, useExamsList } from '../../../../api';
import type { Exam, ExamCategory } from '../../../../api';
import {
  type ThemeColors,
  useThemeColors,
} from '../../../../presentation/theme/ThemeContext';
import { theme } from '../../../../presentation/theme/theme';
import { formatCompactCount } from '../../../../shared/utils/formatCompactCount';
import { useOnboardingDraft } from '../../OnboardingDraftContext';
import { createOnboardingStepStyles } from '../../onboardingStepStyles';
import {
  type MessageModalShowConfig,
  useMessageModal,
} from '../../../../shared/components/MessageModal';
import type { OnboardingStepScreenProps } from '../../onboardingStepTypes';

type PickedCategory = { id: number; name: string };

type SelectedExamEntry = {
  id: number;
  name: string;
  category_id: number;
  user_count?: number;
};

const MAX_EXAM_SELECTIONS = 4;

function categoryNameSlug(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

/** Plain label for categories and exams (no # prefix). */
function categoryExamDisplayName(name: string): string {
  const t = name.trim();
  if (!t) return '';
  return t.startsWith('#') ? t.slice(1).trim() : t;
}

const CHIP_GAP = 10;

function createOnboardingExamInterestsStyles(colors: ThemeColors) {
  return StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  listFlex: {
    flex: 1,
  },
  categoriesScrollContent: {
    paddingHorizontal: theme.spacing.screenPaddingH,
    paddingTop: 8,
    paddingBottom: 24,
    flexGrow: 1,
  },
  modalSearchBlock: {
    paddingBottom: 12,
    paddingTop: 4,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CHIP_GAP,
  },
  /** Chip: form-style border; brand fill when selected (no check icon). */
  examChoiceChip: {
    alignSelf: 'flex-start',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    overflow: 'hidden',
    minHeight: 42,
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    maxWidth: '100%',
  },
  examChoiceChipPressed: {
    opacity: 0.92,
  },
  examChoiceChipTrack: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surface,
  },
  examChoiceChipFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.brand,
  },
  examChoiceChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 1,
  },
  examChoiceChipLabel: {
    flexShrink: 1,
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    lineHeight: 18,
    color: colors.textPrimary,
  },
  examChoiceChipLabelOnFill: {
    color: colors.onBrand,
  },
  /** Brand-filled chips (selected exam, open category, …): 1px strong border */
  examChoiceChipSelected: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  examChoiceChipMeta: {
    fontFamily: theme.typography.medium,
    fontSize: 11,
    lineHeight: 14,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  examChoiceChipMetaSelected: {
    color: colors.onBrand,
  },
  searchShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: theme.radius.input,
    paddingHorizontal: 12,
    backgroundColor: colors.surfaceSubtle,
  },
  searchInput: {
    flex: 1,
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.md,
    color: colors.textPrimary,
    paddingVertical: 10,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalAlignEnd: {
    width: '100%',
    justifyContent: 'flex-end',
    flex: 1,
  },
  sheetOuter: {
    width: '100%',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: theme.radius.pill,
    borderTopRightRadius: theme.radius.pill,
    paddingTop: 8,
    paddingHorizontal: theme.spacing.screenPaddingH,
    overflow: 'hidden',
  },
  sheetFlex: {
    flex: 1,
  },
  modalChrome: {
    paddingBottom: 4,
  },
  modalGrab: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderSubtle,
    marginBottom: 12,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  modalTitle: {
    flex: 1,
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.lg,
    color: colors.textPrimary,
  },
  modalClose: {
    padding: 4,
  },
  modalFlatList: {
    flex: 1,
    minHeight: 200,
  },
  modalListContent: {
    paddingBottom: 12,
    flexGrow: 1,
  },
  modalRequestBar: {
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
  modalRequestButton: {
    borderRadius: 24,
    borderWidth: 0,
    overflow: 'hidden',
    minHeight: 48,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalRequestButtonDisabled: {
    opacity: 0.42,
  },
  modalRequestButtonPressed: {
    opacity: 0.92,
  },
  modalRequestTrack: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.borderSubtle,
  },
  modalRequestFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.brand,
  },
  modalRequestText: {
    zIndex: 1,
    fontFamily: theme.typography.bold,
    fontSize: theme.fintSizes.md,
    color: colors.textPrimary,
  },
  modalRequestTextOnBrand: {
    color: colors.onBrand,
  },
  modalBodyFill: {
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  modalBodyGrow: {
    flex: 1,
  },
  footerBlock: {
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
  },
  loadMore: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  loadMoreText: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.sm,
    color: colors.textPrimary,
  },
  retrySmall: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  retrySmallText: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.sm,
    color: colors.brand,
  },
  errorInline: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.screenPaddingH,
    paddingVertical: 32,
    backgroundColor: colors.surface,
  },
  errorText: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  retry: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: theme.spacing.screenPaddingH,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  retryText: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.sm,
    color: colors.textPrimary,
  },
  empty: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  emptyCta: {
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    minWidth: 200,
    alignItems: 'center',
  },
  emptyCtaPressed: {
    opacity: 0.9,
  },
  emptyCtaText: {
    fontFamily: theme.typography.bold,
    fontSize: theme.fintSizes.md,
    color: colors.textPrimary,
  },
  selectedBlock: {
    marginBottom: 20,
  },
  selectedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  selectedSectionTitle: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.sm,
    color: colors.textMuted,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  selectedCountMeta: {
    fontFamily: theme.typography.medium,
    fontSize: theme.fintSizes.sm,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  });
}

function SearchField({
  value,
  onChange,
  placeholder,
  accessibilityLabel,
  styles,
  colors,
}: {
  value: string;
  onChange: (t: string) => void;
  placeholder: string;
  accessibilityLabel: string;
  styles: ReturnType<typeof createOnboardingExamInterestsStyles>;
  colors: ThemeColors;
}) {
  return (
    <View style={styles.searchShell}>
      <MaterialCommunityIcons name="magnify" size={22} color={colors.textMuted} />
      <TextInput
        style={styles.searchInput}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel={accessibilityLabel}
      />
      {value.length > 0 ? (
        <Pressable onPress={() => onChange('')} hitSlop={8} accessibilityLabel="Clear search">
          <MaterialCommunityIcons name="close-circle" size={20} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** Exams list + search + chips; mounts only while modal is open for a category. */
function CategoryExamsModalBody({
  categoryId,
  categoryName,
  onClose,
  selectedExamIds,
  onToggleExam,
  onRegisterSheetMessageShow,
  bottomInset,
  styles,
  colors,
}: {
  categoryId: number;
  categoryName: string;
  onClose: () => void;
  selectedExamIds: Set<number>;
  onToggleExam: (
    examId: number,
    examName: string,
    categoryId: number,
    userCount?: number,
  ) => void;
  /** Exposes this sheet’s MessageModal `show` so the parent can open alerts above the category modal. */
  onRegisterSheetMessageShow?: (
    show: ((config: MessageModalShowConfig) => void) | null,
  ) => void;
  bottomInset: number;
  styles: ReturnType<typeof createOnboardingExamInterestsStyles>;
  colors: ThemeColors;
}) {
  const [examSearch, setExamSearch] = useState('');
  const { modal, show: showModal } = useMessageModal();

  useEffect(() => {
    onRegisterSheetMessageShow?.(showModal);
    return () => {
      onRegisterSheetMessageShow?.(null);
    };
  }, [showModal, onRegisterSheetMessageShow]);
  const {
    items,
    loading,
    loadingMore,
    error: listError,
    refresh,
    loadMore,
    hasMore,
  } = useExamsList({ categoryId });

  const filteredItems = useMemo(() => {
    const q = examSearch.trim().toLowerCase();
    if (!q) return items;
    const qSlug = q.replace(/^#/, '');
    return items.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.description?.toLowerCase().includes(q) ?? false) ||
        categoryNameSlug(e.name).includes(qSlug),
    );
  }, [items, examSearch]);

  const renderExamChipNode = useCallback(
    (item: Exam) => {
      const selected = selectedExamIds.has(item.id);
      return (
        <Pressable
          style={({ pressed }) => [
            styles.examChoiceChip,
            selected && styles.examChoiceChipSelected,
            pressed && styles.examChoiceChipPressed,
          ]}
          onPress={() => onToggleExam(item.id, item.name, item.category_id, item.user_count)}
          android_ripple={{
            color: selected ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)',
          }}
          accessibilityRole="button"
          accessibilityState={{ selected }}
          accessibilityHint={selected ? 'Double tap to deselect' : 'Double tap to select'}
          accessibilityLabel={categoryExamDisplayName(item.name)}
        >
          <View style={styles.examChoiceChipTrack} pointerEvents="none" />
          {selected ? <View style={styles.examChoiceChipFill} pointerEvents="none" /> : null}
          <View style={styles.examChoiceChipRow}>
            <Text
              style={[styles.examChoiceChipLabel, selected && styles.examChoiceChipLabelOnFill]}
              numberOfLines={1}
            >
              {categoryExamDisplayName(item.name)}
            </Text>
            {item.user_count > 0 ? (
              <Text
                style={[styles.examChoiceChipMeta, selected && styles.examChoiceChipMetaSelected]}
              >
                {formatCompactCount(item.user_count)}
              </Text>
            ) : null}
          </View>
        </Pressable>
      );
    },
    [selectedExamIds, onToggleExam, styles],
  );

  const handleExamScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
      const threshold = 180;
      if (contentSize.height <= layoutMeasurement.height) return;
      if (layoutMeasurement.height + contentOffset.y >= contentSize.height - threshold) {
        if (hasMore && !loadingMore && !loading) void loadMore();
      }
    },
    [hasMore, loadingMore, loading, loadMore],
  );

  const footer = useCallback(() => {
    if (listError && items.length > 0) {
      return (
        <View style={styles.footerBlock}>
          <Text style={styles.errorInline}>{listError.message}</Text>
          <Pressable onPress={refresh} style={styles.retrySmall}>
            <Text style={styles.retrySmallText}>Retry</Text>
          </Pressable>
        </View>
      );
    }
    if (!hasMore || items.length === 0) return null;
    return (
      <View style={styles.footerBlock}>
        {loadingMore ? (
          <ActivityIndicator color={colors.brand} />
        ) : (
          <Pressable
            style={styles.loadMore}
            onPress={() => void loadMore()}
            accessibilityRole="button"
            accessibilityLabel="Load more exams"
          >
            <Text style={styles.loadMoreText}>Load more</Text>
          </Pressable>
        )}
      </View>
    );
  }, [listError, items.length, hasMore, loadingMore, loadMore, refresh, styles, colors.brand]);

  const q = examSearch.trim();
  const emptyMessage =
    items.length === 0
      ? 'No exams in this category.'
      : q
        ? 'No exams match your search. Try another term or load more.'
        : 'No exams in this category.';

  const searchMiss = q.length > 0 && filteredItems.length === 0;
  const selectedHere = useMemo(
    () => items.filter((e) => selectedExamIds.has(e.id)),
    [items, selectedExamIds],
  );
  /** Enabled when at least one exam in this category is selected, or search returned no matches. */
  const primaryEnabled = selectedHere.length > 0 || searchMiss;
  /** Default label is Select; only switches to Request when search has no matches and nothing is selected. */
  const primaryLabel =
    searchMiss && selectedHere.length === 0 ? 'Request' : 'Select';

  const handlePrimaryPress = useCallback(() => {
    const picked = items.filter((e) => selectedExamIds.has(e.id));
    const term = examSearch.trim();
    const miss = term.length > 0 && filteredItems.length === 0;
    if (picked.length === 0 && !miss) return;
    if (picked.length > 0) {
      onClose();
      return;
    }
    const cat = categoryExamDisplayName(categoryName);
    showModal({ title: 'Request an exam', message: `We’ll note your request for “${term}” under ${cat}.` });
  }, [items, selectedExamIds, examSearch, filteredItems, categoryName, onClose, showModal]);

  const listHeader = (
    <View style={styles.modalSearchBlock}>
      <SearchField
        value={examSearch}
        onChange={setExamSearch}
        placeholder="Search exams"
        accessibilityLabel="Search exams"
        styles={styles}
        colors={colors}
      />
    </View>
  );

  const sheetMax = Math.round(Dimensions.get('window').height * 0.88);

  if (loading && items.length === 0 && !listError) {
    return (
      <View style={[styles.sheetOuter, { height: sheetMax }]}>
        {modal}
        <View style={[styles.sheet, styles.sheetFlex, { paddingBottom: bottomInset + 16 }]}>
          <ModalChrome title={categoryExamDisplayName(categoryName)} onClose={onClose} styles={styles} colors={colors} />
          <View style={[styles.modalBodyFill, styles.modalBodyGrow]}>
            <ActivityIndicator size="large" color={colors.brand} />
          </View>
        </View>
      </View>
    );
  }

  if (listError && items.length === 0) {
    return (
      <View style={[styles.sheetOuter, { height: sheetMax }]}>
        {modal}
        <View style={[styles.sheet, styles.sheetFlex, { paddingBottom: bottomInset + 16 }]}>
          <ModalChrome title={categoryExamDisplayName(categoryName)} onClose={onClose} styles={styles} colors={colors} />
          <View style={[styles.modalBodyFill, styles.modalBodyGrow]}>
            <Text style={styles.errorText}>{listError.message}</Text>
            <Pressable style={styles.retry} onPress={refresh}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.sheetOuter, { height: sheetMax }]}>
      {modal}
      <View style={[styles.sheet, styles.sheetFlex]}>
        <ModalChrome title={categoryExamDisplayName(categoryName)} onClose={onClose} styles={styles} colors={colors} />
        <ScrollView
          style={styles.modalFlatList}
          contentContainerStyle={styles.modalListContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={loading && items.length > 0} onRefresh={refresh} />}
          onScroll={handleExamScroll}
          scrollEventThrottle={400}
        >
          {listHeader}
          {filteredItems.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{emptyMessage}</Text>
              {items.length === 0 && q.length === 0 ? (
                <Pressable
                  style={({ pressed }) => [styles.emptyCta, pressed && styles.emptyCtaPressed]}
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel="Continue without selecting an exam"
                >
                  <Text style={styles.emptyCtaText}>Continue</Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            <View style={styles.chipWrap}>
              {filteredItems.map((item) => (
                <Fragment key={item.id}>{renderExamChipNode(item)}</Fragment>
              ))}
            </View>
          )}
          <View>{footer()}</View>
        </ScrollView>
        <View style={[styles.modalRequestBar, { paddingBottom: bottomInset + 12 }]}>
          <Pressable
            style={({ pressed }) => [
              styles.modalRequestButton,
              !primaryEnabled && styles.modalRequestButtonDisabled,
              primaryEnabled && pressed && styles.modalRequestButtonPressed,
            ]}
            onPress={handlePrimaryPress}
            disabled={!primaryEnabled}
            android_ripple={
              primaryEnabled ? { color: 'rgba(255,255,255,0.2)' } : { color: 'transparent' }
            }
            accessibilityRole="button"
            accessibilityState={{ disabled: !primaryEnabled }}
            accessibilityLabel={
              primaryEnabled
                ? selectedHere.length > 0
                  ? 'Select interested exams and close'
                  : 'Request an exam missing from search results'
                : 'Select exams or search for a missing exam to continue'
            }
          >
            <View style={styles.modalRequestTrack} pointerEvents="none" />
            {primaryEnabled ? <View style={styles.modalRequestFill} pointerEvents="none" /> : null}
            <Text
              style={[
                styles.modalRequestText,
                primaryEnabled && styles.modalRequestTextOnBrand,
              ]}
            >
              {primaryLabel}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function ModalChrome({
  title,
  onClose,
  styles,
  colors,
}: {
  title: string;
  onClose: () => void;
  styles: ReturnType<typeof createOnboardingExamInterestsStyles>;
  colors: ThemeColors;
}) {
  return (
    <View style={styles.modalChrome}>
      <View style={styles.modalGrab} accessibilityLabel="Sheet" />
      <View style={styles.modalTitleRow}>
        <Text style={styles.modalTitle} numberOfLines={1}>
          {title}
        </Text>
        <Pressable
          onPress={onClose}
          style={styles.modalClose}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <MaterialCommunityIcons name="close" size={26} color={colors.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Interests step: category list only; tap a category to pick exams in the sheet.
 */
export function OnboardingExamInterestsScreen({ onStepValidityChange }: OnboardingStepScreenProps) {
  const colors = useThemeColors();
  const styles = useMemo(
    () => ({
      ...createOnboardingStepStyles(colors),
      ...createOnboardingExamInterestsStyles(colors),
    }),
    [colors],
  );
  const { draft, updateDraft } = useOnboardingDraft();
  const { modal, show: showModal } = useMessageModal();
  const sheetMessageShowRef = useRef<((c: MessageModalShowConfig) => void) | null>(null);
  const registerSheetMessageShow = useCallback(
    (fn: ((c: MessageModalShowConfig) => void) | null) => {
      sheetMessageShowRef.current = fn;
    },
    [],
  );
  const insets = useSafeAreaInsets();
  const [picked, setPicked] = useState<PickedCategory | null>(null);
  const [selectedExams, setSelectedExams] = useState<SelectedExamEntry[]>(() =>
    draft.selected_exams.slice(0, MAX_EXAM_SELECTIONS),
  );
  const selectedExamsRef = useRef(selectedExams);
  selectedExamsRef.current = selectedExams;

  const selectedExamIds = useMemo(
    () => new Set(selectedExams.map((e) => e.id)),
    [selectedExams],
  );

  const { categories, loading, error, refresh } = useExamCategories();

  const toggleExam = useCallback(
    (examId: number, examName: string, categoryId: number, userCount?: number) => {
      const prev = selectedExamsRef.current;
      if (prev.some((e) => e.id === examId)) {
        const next = prev.filter((e) => e.id !== examId);
        updateDraft({ selected_exams: next });
        setSelectedExams(next);
        return;
      }
      if (prev.length >= MAX_EXAM_SELECTIONS) {
        const showLimit =
          sheetMessageShowRef.current != null
            ? sheetMessageShowRef.current
            : showModal;
        showLimit({
          title: 'Limit reached',
          message: `You have already selected ${MAX_EXAM_SELECTIONS} exams. Remove one to add another.`,
        });
        return;
      }
      const next = [
        ...prev,
        { id: examId, name: examName, category_id: categoryId, user_count: userCount },
      ];
      updateDraft({ selected_exams: next });
      setSelectedExams(next);
    },
    [updateDraft, showModal],
  );

  /** One-time: cap persisted draft if it had more than 4 exams. */
  useEffect(() => {
    if (draft.selected_exams.length > MAX_EXAM_SELECTIONS) {
      const trimmed = draft.selected_exams.slice(0, MAX_EXAM_SELECTIONS);
      setSelectedExams(trimmed);
      updateDraft({ selected_exams: trimmed });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- migration only
  }, []);

  useEffect(() => {
    onStepValidityChange?.(selectedExams.length > 0);
  }, [selectedExams.length, onStepValidityChange]);

  const closeModal = useCallback(() => setPicked(null), []);

  if (loading && !categories) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  if (error && !categories?.length) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error.message}</Text>
        <Pressable style={styles.retry} onPress={refresh} accessibilityRole="button">
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screenRoot}>
      <ScrollView
        style={styles.listFlex}
        contentContainerStyle={styles.categoriesScrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={loading && Boolean(categories?.length)} onRefresh={refresh} />
        }
      >
        {selectedExams.length > 0 ? (
          <View style={styles.selectedBlock}>
            <View style={styles.selectedHeaderRow}>
              <Text style={styles.selectedSectionTitle}>Selected exams</Text>
              <Text style={styles.selectedCountMeta}>
                {selectedExams.length}/{MAX_EXAM_SELECTIONS}
              </Text>
            </View>
            <View style={styles.chipWrap}>
              {selectedExams.map((e) => (
                <Pressable
                  key={e.id}
                  style={({ pressed }) => [
                    styles.examChoiceChip,
                    styles.examChoiceChipSelected,
                    pressed && styles.examChoiceChipPressed,
                  ]}
                  onPress={() =>
                    toggleExam(e.id, e.name, e.category_id, e.user_count)
                  }
                  android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${categoryExamDisplayName(e.name)}`}
                  accessibilityHint="Double tap to remove from your interests"
                >
                  <View style={styles.examChoiceChipTrack} pointerEvents="none" />
                  <View style={styles.examChoiceChipFill} pointerEvents="none" />
                  <View style={styles.examChoiceChipRow}>
                    <Text
                      style={[
                        styles.examChoiceChipLabel,
                        styles.examChoiceChipLabelOnFill,
                      ]}
                      numberOfLines={2}
                    >
                      {categoryExamDisplayName(e.name)}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
        <Text style={styles.helpText}>
          Tap a category to open exams. You can pick up to {MAX_EXAM_SELECTIONS} in total.
        </Text>
        <View style={styles.chipWrap}>
          {(categories ?? []).map((cat) => {
            const active = picked?.id === cat.id;
            return (
              <Pressable
                key={cat.id}
                style={({ pressed }) => [
                  styles.examChoiceChip,
                  active && styles.examChoiceChipSelected,
                  pressed && styles.examChoiceChipPressed,
                ]}
                onPress={() => setPicked({ id: cat.id, name: cat.name })}
                android_ripple={{
                  color: active ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)',
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={categoryExamDisplayName(cat.name)}
              >
                <View style={styles.examChoiceChipTrack} pointerEvents="none" />
                {active ? <View style={styles.examChoiceChipFill} pointerEvents="none" /> : null}
                <View style={styles.examChoiceChipRow}>
                  <Text
                    style={[styles.examChoiceChipLabel, active && styles.examChoiceChipLabelOnFill]}
                    numberOfLines={1}
                  >
                    {categoryExamDisplayName(cat.name)}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
        {(categories ?? []).length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No categories yet.</Text>
          </View>
        ) : null}
      </ScrollView>

      <Modal
        visible={picked != null}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
        statusBarTranslucent
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={closeModal} accessibilityLabel="Dismiss" />
          <View style={styles.modalAlignEnd} pointerEvents="box-none">
            {picked ? (
              <CategoryExamsModalBody
                key={picked.id}
                categoryId={picked.id}
                categoryName={picked.name}
                onClose={closeModal}
                selectedExamIds={selectedExamIds}
                onToggleExam={toggleExam}
                onRegisterSheetMessageShow={registerSheetMessageShow}
                bottomInset={insets.bottom}
                styles={styles}
                colors={colors}
              />
            ) : null}
          </View>
        </View>
      </Modal>
      {modal}
    </View>
  );
}

