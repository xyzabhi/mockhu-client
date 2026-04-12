import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppError,
  examCatalogApi,
  hydrateSessionUserFromMe,
  meResponseToTokenUserPatch,
  mergeSessionUser,
  normalizeTokenUserProfile,
  useSession,
  useUserInterests,
  userApi,
} from '../../api';
import { GenderPicker } from '../../features/onboarding/presentation/components/GenderPicker';
import { OnboardingExamPicker } from '../../features/onboarding/presentation/components/OnboardingExamPicker';
import { TargetYearPicker } from '../../features/onboarding/presentation/components/TargetYearPicker';
import {
  minTargetYear,
  type SelectedExamDraft,
  validateOnboardingExamsStep,
  validateOnboardingYearStep,
} from '../../features/onboarding/onboardingDraft';
import {
  createOnboardingStepStyles,
  onboardingInputShadow,
} from '../../features/onboarding/onboardingStepStyles';
import { theme } from '../../presentation/theme/theme';
import { type ThemeColors, useThemeColors } from '../../presentation/theme/ThemeContext';
import { useMessageModal } from '../../shared/components/MessageModal';
import type { RootStackParamList } from '../types';

const textAndroid = Platform.OS === 'android' ? ({ includeFontPadding: false } as const) : {};

type EditSectionId = 'name' | 'personalInfo' | 'bio' | 'academics' | 'examPrep';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

export function EditProfileScreen(_props: Props) {
  const colors = useThemeColors();
  const stepStyles = useMemo(() => createOnboardingStepStyles(colors), [colors]);
  const inputShadow = onboardingInputShadow();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { user } = useSession();
  const { modal, show: showModal } = useMessageModal();

  const profile = user ? normalizeTokenUserProfile(user) : null;
  const userId = profile?.id?.trim();

  const {
    interests,
    loading: interestsLoading,
    refetch: refetchInterests,
  } = useUserInterests(userId);

  const examIdsKey = useMemo(
    () => (interests?.exam_ids?.length ? [...interests.exam_ids].sort((a, b) => a - b).join(',') : ''),
    [interests?.exam_ids],
  );

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [grade, setGrade] = useState('');
  const [institute, setInstitute] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [targetYearText, setTargetYearText] = useState(String(minTargetYear()));
  const [selectedExams, setSelectedExams] = useState<SelectedExamDraft[]>([]);
  const [examsReady, setExamsReady] = useState(false);

  const [expandedSection, setExpandedSection] = useState<EditSectionId | null>(null);
  const [sectionSaving, setSectionSaving] = useState<EditSectionId | null>(null);
  const [sectionErrors, setSectionErrors] = useState<Partial<Record<EditSectionId, string>>>({});
  const [sectionSavedFlash, setSectionSavedFlash] = useState<Partial<Record<EditSectionId, boolean>>>({});

  useEffect(() => {
    if (!profile) return;
    setFirstName(profile.first_name?.trim() ?? '');
    setLastName(profile.last_name?.trim() ?? '');
    setBio(profile.bio?.trim() ?? '');
    setGrade(profile.grade?.trim() ?? '');
    setInstitute(profile.institute?.trim() ?? '');
    setGender(profile.gender?.trim() ?? '');
    setDob(profile.dob?.trim() ?? '');
    setTargetYearText(
      profile.target_year != null && Number.isFinite(profile.target_year)
        ? String(profile.target_year)
        : String(minTargetYear()),
    );
  }, [profile?.id]);

  useEffect(() => {
    if (!userId || interestsLoading) return;
    let cancelled = false;
    const ids = interests?.exam_ids ?? [];
    if (ids.length === 0) {
      setSelectedExams([]);
      setExamsReady(true);
      return;
    }
    setExamsReady(false);
    void (async () => {
      try {
        const settled = await Promise.allSettled(ids.map((id) => examCatalogApi.getExam(id)));
        if (cancelled) return;
        const rows: SelectedExamDraft[] = [];
        settled.forEach((s, i) => {
          if (s.status !== 'fulfilled') return;
          const e = s.value;
          rows.push({
            id: e.id,
            name: e.name?.trim() || 'Exam',
            category_id: e.category_id,
            user_count: e.user_count,
          });
        });
        setSelectedExams(rows);
      } catch {
        if (!cancelled) setSelectedExams([]);
      } finally {
        if (!cancelled) setExamsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, interestsLoading, examIdsKey]);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const toggleSection = useCallback((id: EditSectionId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSection((cur) => (cur === id ? null : id));
    setSectionErrors((e) => {
      if (!e[id]) return e;
      const next = { ...e };
      delete next[id];
      return next;
    });
  }, []);

  const flashSectionSaved = useCallback((id: EditSectionId) => {
    setSectionSavedFlash((s) => ({ ...s, [id]: true }));
    setTimeout(() => {
      setSectionSavedFlash((s) => {
        const next = { ...s };
        delete next[id];
        return next;
      });
    }, 2200);
  }, []);

  const saveNameSection = useCallback(async () => {
    if (!userId) return;
    if (!firstName.trim() || !lastName.trim()) {
      setSectionErrors((e) => ({ ...e, name: 'First and last name are required.' }));
      return;
    }
    setSectionSaving('name');
    setSectionErrors((e) => {
      const next = { ...e };
      delete next.name;
      return next;
    });
    try {
      const me = await userApi.patchMe({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      });
      mergeSessionUser(meResponseToTokenUserPatch(me));
      await hydrateSessionUserFromMe({ includeInterests: false });
      flashSectionSaved('name');
    } catch (e) {
      const msg =
        e instanceof AppError
          ? e.message
          : 'Could not update your name. Check your connection and try again.';
      setSectionErrors((er) => ({ ...er, name: msg }));
    } finally {
      setSectionSaving(null);
    }
  }, [userId, firstName, lastName, flashSectionSaved]);

  const savePersonalInfoSection = useCallback(async () => {
    if (!userId) return;
    setSectionSaving('personalInfo');
    setSectionErrors((e) => {
      const next = { ...e };
      delete next.personalInfo;
      return next;
    });
    try {
      const me = await userApi.patchMe({
        gender: gender.trim() ? gender.trim() : null,
        dob: dob.trim() ? dob.trim() : null,
      });
      mergeSessionUser(meResponseToTokenUserPatch(me));
      await hydrateSessionUserFromMe({ includeInterests: false });
      flashSectionSaved('personalInfo');
    } catch (e) {
      const msg =
        e instanceof AppError
          ? e.message
          : 'Could not update personal info. Check your connection and try again.';
      setSectionErrors((er) => ({ ...er, personalInfo: msg }));
    } finally {
      setSectionSaving(null);
    }
  }, [userId, gender, dob, flashSectionSaved]);

  const saveBioSection = useCallback(async () => {
    if (!userId) return;
    setSectionSaving('bio');
    setSectionErrors((e) => {
      const next = { ...e };
      delete next.bio;
      return next;
    });
    try {
      const me = await userApi.patchMe({
        bio: bio.trim() ? bio.trim() : null,
      });
      mergeSessionUser(meResponseToTokenUserPatch(me));
      await hydrateSessionUserFromMe({ includeInterests: false });
      flashSectionSaved('bio');
    } catch (e) {
      const msg =
        e instanceof AppError
          ? e.message
          : 'Could not update your bio. Check your connection and try again.';
      setSectionErrors((er) => ({ ...er, bio: msg }));
    } finally {
      setSectionSaving(null);
    }
  }, [userId, bio, flashSectionSaved]);

  const saveAcademicsSection = useCallback(async () => {
    if (!userId) return;
    setSectionSaving('academics');
    setSectionErrors((e) => {
      const next = { ...e };
      delete next.academics;
      return next;
    });
    try {
      const me = await userApi.patchMe({
        grade: grade.trim() ? grade.trim() : null,
        institute: institute.trim() ? institute.trim() : null,
      });
      mergeSessionUser(meResponseToTokenUserPatch(me));
      await hydrateSessionUserFromMe({ includeInterests: false });
      flashSectionSaved('academics');
    } catch (e) {
      const msg =
        e instanceof AppError
          ? e.message
          : 'Could not update academics. Check your connection and try again.';
      setSectionErrors((er) => ({ ...er, academics: msg }));
    } finally {
      setSectionSaving(null);
    }
  }, [userId, grade, institute, flashSectionSaved]);

  const saveExamPrepSection = useCallback(async () => {
    if (!userId) return;
    const yearErr = validateOnboardingYearStep(targetYearText);
    if (yearErr) {
      setSectionErrors((e) => ({ ...e, examPrep: yearErr }));
      return;
    }
    const examErr = validateOnboardingExamsStep(selectedExams);
    if (examErr) {
      setSectionErrors((e) => ({ ...e, examPrep: examErr }));
      return;
    }
    const targetYear = Number.parseInt(targetYearText.trim(), 10);
    setSectionSaving('examPrep');
    setSectionErrors((e) => {
      const next = { ...e };
      delete next.examPrep;
      return next;
    });
    try {
      const me = await userApi.patchMe({ target_year: targetYear });
      mergeSessionUser(meResponseToTokenUserPatch(me));
      mergeSessionUser({ target_year: targetYear });
      await userApi.patchUserInterests(userId, {
        exam_ids: selectedExams.map((e) => e.id),
        exam_category_ids: interests?.exam_category_ids ?? [],
      });
      mergeSessionUser({
        exam_ids: selectedExams.map((e) => e.id),
        exam_category_ids: interests?.exam_category_ids ?? [],
      });
      await hydrateSessionUserFromMe({ includeInterests: true });
      void refetchInterests();
      flashSectionSaved('examPrep');
    } catch (e) {
      const msg =
        e instanceof AppError
          ? e.message
          : 'Could not update exam prep. Check your connection and try again.';
      setSectionErrors((er) => ({ ...er, examPrep: msg }));
    } finally {
      setSectionSaving(null);
    }
  }, [
    userId,
    targetYearText,
    selectedExams,
    interests?.exam_category_ids,
    refetchInterests,
    flashSectionSaved,
  ]);

  const nameSummary = useMemo(() => {
    const name = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
    return name || 'Add first and last name';
  }, [firstName, lastName]);

  const personalInfoSummary = useMemo(() => {
    const g = gender.trim();
    const d = dob.trim();
    if (!g && !d) return 'Gender and date of birth';
    return [g || '—', d || '—'].join(' · ');
  }, [gender, dob]);

  const bioSummary = useMemo(() => {
    const t = bio.trim();
    if (!t) return 'No bio yet';
    return t.length > 48 ? `${t.slice(0, 48)}…` : t;
  }, [bio]);

  const academicsSummary = useMemo(() => {
    const g = grade.trim();
    const inst = institute.trim();
    if (!g && !inst) return 'Qualification and institute';
    const parts: string[] = [];
    if (g) parts.push(g);
    if (inst) parts.push(inst.length > 28 ? `${inst.slice(0, 28)}…` : inst);
    return parts.join(' · ');
  }, [grade, institute]);

  const examPrepSummary = useMemo(() => {
    const y = targetYearText.trim();
    const n = selectedExams.length;
    const yearPart = y ? `Year ${y}` : 'Target year';
    const examPart = n === 0 ? 'No exams' : `${n} exam${n === 1 ? '' : 's'}`;
    return `${yearPart} · ${examPart}`;
  }, [targetYearText, selectedExams.length]);

  if (!userId) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.muted}>Sign in to edit your profile.</Text>
      </View>
    );
  }

  const showLoader = interestsLoading || !examsReady;

  return (
    <KeyboardAvoidingView
      style={stepStyles.scroll}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
    >
      <ScrollView
        style={stepStyles.scroll}
        contentContainerStyle={[stepStyles.scrollContentLoose, { paddingBottom: Math.max(insets.bottom, 24) }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {showLoader ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={colors.brand} />
            <Text style={styles.muted}>Loading your profile…</Text>
          </View>
        ) : (
          <>
            <View style={styles.screenIntro}>
              <Text style={styles.screenIntroTitle}>Edit profile</Text>
              <Text style={styles.screenIntroBody}>
                Each section is its own card. Open it, edit, and save — only that section is sent to your profile.
              </Text>
            </View>

            <View style={styles.sectionList}>
              <View style={styles.accShell}>
                <Pressable
                  onPress={() => toggleSection('name')}
                  android_ripple={{ color: colors.borderSubtle }}
                  style={({ pressed }) => [
                    styles.accHeader,
                    expandedSection === 'name' && styles.accHeaderOpen,
                    Platform.OS === 'ios' && pressed && styles.accHeaderPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: expandedSection === 'name' }}
                  accessibilityHint="Shows or hides name fields"
                >
                  <View style={styles.accHeaderRow}>
                    <View style={styles.accIconWrap}>
                      <MaterialCommunityIcons name="account-edit-outline" size={24} color={colors.brand} />
                    </View>
                    <View style={styles.accHeaderText}>
                      <Text style={styles.accTitle}>Name</Text>
                      <Text style={styles.accKicker}>First and last name</Text>
                      <Text style={styles.accSummary} numberOfLines={2}>
                        {nameSummary}
                      </Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons
                    name={expandedSection === 'name' ? 'chevron-up' : 'chevron-down'}
                    size={22}
                    color={colors.textHint}
                  />
                </Pressable>
                {expandedSection === 'name' ? (
                  <View style={styles.accBody}>
                    <Text style={styles.accBodyLead}>This is how your name appears on your profile. Both are required.</Text>
                    <View style={styles.accField}>
                      <Text style={stepStyles.fieldLabel}>First name</Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          styles.inputIdle,
                          firstName.length > 0 ? styles.inputFilled : styles.inputDefault,
                          inputShadow,
                        ]}
                        value={firstName}
                        onChangeText={setFirstName}
                        placeholder="First name"
                        placeholderTextColor={colors.textHint}
                        autoCapitalize="words"
                        {...textAndroid}
                      />
                    </View>
                    <View style={[styles.accField, styles.accFieldLast]}>
                      <Text style={stepStyles.fieldLabel}>Last name</Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          styles.inputIdle,
                          lastName.length > 0 ? styles.inputFilled : styles.inputDefault,
                          inputShadow,
                        ]}
                        value={lastName}
                        onChangeText={setLastName}
                        placeholder="Last name"
                        placeholderTextColor={colors.textHint}
                        autoCapitalize="words"
                        {...textAndroid}
                      />
                    </View>
                    {sectionErrors.name ? <Text style={styles.sectionErrText}>{sectionErrors.name}</Text> : null}
                    <Pressable
                      style={({ pressed }) => [
                        styles.sectionUpdateBtn,
                        sectionSaving === 'name' && styles.sectionUpdateBtnDisabled,
                        pressed && sectionSaving !== 'name' && styles.sectionUpdateBtnPressed,
                      ]}
                      onPress={() => void saveNameSection()}
                      disabled={sectionSaving !== null}
                      accessibilityRole="button"
                      accessibilityLabel="Save name"
                    >
                      {sectionSaving === 'name' ? (
                        <ActivityIndicator color={colors.onBrand} />
                      ) : (
                        <>
                          <MaterialCommunityIcons name="check" size={20} color={colors.onBrand} />
                          <Text style={styles.sectionUpdateBtnText}>Save name</Text>
                        </>
                      )}
                    </Pressable>
                    {sectionSavedFlash.name ? <Text style={styles.sectionSavedText}>Saved</Text> : null}
                  </View>
                ) : null}
              </View>

              <View style={styles.accShell}>
                <Pressable
                  onPress={() => toggleSection('personalInfo')}
                  android_ripple={{ color: colors.borderSubtle }}
                  style={({ pressed }) => [
                    styles.accHeader,
                    expandedSection === 'personalInfo' && styles.accHeaderOpen,
                    Platform.OS === 'ios' && pressed && styles.accHeaderPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: expandedSection === 'personalInfo' }}
                  accessibilityHint="Shows or hides personal info fields"
                >
                  <View style={styles.accHeaderRow}>
                    <View style={styles.accIconWrap}>
                      <MaterialCommunityIcons name="card-account-details-outline" size={24} color={colors.brand} />
                    </View>
                    <View style={styles.accHeaderText}>
                      <Text style={styles.accTitle}>Personal info</Text>
                      <Text style={styles.accKicker}>Gender and date of birth</Text>
                      <Text style={styles.accSummary} numberOfLines={2}>
                        {personalInfoSummary}
                      </Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons
                    name={expandedSection === 'personalInfo' ? 'chevron-up' : 'chevron-down'}
                    size={22}
                    color={colors.textHint}
                  />
                </Pressable>
                {expandedSection === 'personalInfo' ? (
                  <View style={styles.accBody}>
                    <Text style={styles.accBodyLead}>Optional details for your profile.</Text>
                    <View style={[styles.accField, stepStyles.fieldRaised]}>
                      <Text style={stepStyles.fieldLabel}>Gender</Text>
                      <GenderPicker value={gender} onChange={setGender} />
                    </View>
                    <View style={[styles.accField, styles.accFieldLast]}>
                      <Text style={stepStyles.fieldLabel}>Date of birth</Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          styles.inputIdle,
                          dob.length > 0 ? styles.inputFilled : styles.inputDefault,
                          inputShadow,
                        ]}
                        value={dob}
                        onChangeText={setDob}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={colors.textHint}
                        {...textAndroid}
                      />
                    </View>
                    {sectionErrors.personalInfo ? (
                      <Text style={styles.sectionErrText}>{sectionErrors.personalInfo}</Text>
                    ) : null}
                    <Pressable
                      style={({ pressed }) => [
                        styles.sectionUpdateBtn,
                        sectionSaving === 'personalInfo' && styles.sectionUpdateBtnDisabled,
                        pressed && sectionSaving !== 'personalInfo' && styles.sectionUpdateBtnPressed,
                      ]}
                      onPress={() => void savePersonalInfoSection()}
                      disabled={sectionSaving !== null}
                      accessibilityRole="button"
                      accessibilityLabel="Save personal info"
                    >
                      {sectionSaving === 'personalInfo' ? (
                        <ActivityIndicator color={colors.onBrand} />
                      ) : (
                        <>
                          <MaterialCommunityIcons name="check" size={20} color={colors.onBrand} />
                          <Text style={styles.sectionUpdateBtnText}>Save personal info</Text>
                        </>
                      )}
                    </Pressable>
                    {sectionSavedFlash.personalInfo ? <Text style={styles.sectionSavedText}>Saved</Text> : null}
                  </View>
                ) : null}
              </View>

              <View style={styles.accShell}>
                <Pressable
                  onPress={() => toggleSection('bio')}
                  android_ripple={{ color: colors.borderSubtle }}
                  style={({ pressed }) => [
                    styles.accHeader,
                    expandedSection === 'bio' && styles.accHeaderOpen,
                    Platform.OS === 'ios' && pressed && styles.accHeaderPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: expandedSection === 'bio' }}
                  accessibilityHint="Shows or hides bio"
                >
                  <View style={styles.accHeaderRow}>
                    <View style={styles.accIconWrap}>
                      <MaterialCommunityIcons name="text-box-outline" size={24} color={colors.brand} />
                    </View>
                    <View style={styles.accHeaderText}>
                      <Text style={styles.accTitle}>Bio</Text>
                      <Text style={styles.accKicker}>About you</Text>
                      <Text style={styles.accSummary} numberOfLines={2}>
                        {bioSummary}
                      </Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons
                    name={expandedSection === 'bio' ? 'chevron-up' : 'chevron-down'}
                    size={22}
                    color={colors.textHint}
                  />
                </Pressable>
                {expandedSection === 'bio' ? (
                  <View style={styles.accBody}>
                    <Text style={styles.accBodyLead}>A short line about your goals or interests.</Text>
                    <View style={[styles.accField, styles.accFieldLast]}>
                      <Text style={stepStyles.fieldLabel}>Bio</Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          styles.inputMultiline,
                          styles.inputIdle,
                          bio.length > 0 ? styles.inputFilled : styles.inputDefault,
                          inputShadow,
                        ]}
                        value={bio}
                        onChangeText={setBio}
                        placeholder="Goals, interests, or what you’re preparing for"
                        placeholderTextColor={colors.textHint}
                        multiline
                        {...textAndroid}
                      />
                    </View>
                    {sectionErrors.bio ? <Text style={styles.sectionErrText}>{sectionErrors.bio}</Text> : null}
                    <Pressable
                      style={({ pressed }) => [
                        styles.sectionUpdateBtn,
                        sectionSaving === 'bio' && styles.sectionUpdateBtnDisabled,
                        pressed && sectionSaving !== 'bio' && styles.sectionUpdateBtnPressed,
                      ]}
                      onPress={() => void saveBioSection()}
                      disabled={sectionSaving !== null}
                      accessibilityRole="button"
                      accessibilityLabel="Save bio"
                    >
                      {sectionSaving === 'bio' ? (
                        <ActivityIndicator color={colors.onBrand} />
                      ) : (
                        <>
                          <MaterialCommunityIcons name="check" size={20} color={colors.onBrand} />
                          <Text style={styles.sectionUpdateBtnText}>Save bio</Text>
                        </>
                      )}
                    </Pressable>
                    {sectionSavedFlash.bio ? <Text style={styles.sectionSavedText}>Saved</Text> : null}
                  </View>
                ) : null}
              </View>

              <View style={styles.accShell}>
                <Pressable
                  onPress={() => toggleSection('academics')}
                  android_ripple={{ color: colors.borderSubtle }}
                  style={({ pressed }) => [
                    styles.accHeader,
                    expandedSection === 'academics' && styles.accHeaderOpen,
                    Platform.OS === 'ios' && pressed && styles.accHeaderPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: expandedSection === 'academics' }}
                  accessibilityHint="Shows or hides academics fields"
                >
                  <View style={styles.accHeaderRow}>
                    <View style={styles.accIconWrap}>
                      <MaterialCommunityIcons name="school-outline" size={24} color={colors.brand} />
                    </View>
                    <View style={styles.accHeaderText}>
                      <Text style={styles.accTitle}>Academics</Text>
                      <Text style={styles.accKicker}>Qualification and institute</Text>
                      <Text style={styles.accSummary} numberOfLines={2}>
                        {academicsSummary}
                      </Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons
                    name={expandedSection === 'academics' ? 'chevron-up' : 'chevron-down'}
                    size={22}
                    color={colors.textHint}
                  />
                </Pressable>
                {expandedSection === 'academics' ? (
                  <View style={styles.accBody}>
                    <Text style={styles.accBodyLead}>Where you study and your level.</Text>
                    <View style={styles.accField}>
                      <Text style={stepStyles.fieldLabel}>Qualification</Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          styles.inputIdle,
                          grade.length > 0 ? styles.inputFilled : styles.inputDefault,
                          inputShadow,
                        ]}
                        value={grade}
                        onChangeText={setGrade}
                        placeholder="e.g. 12th, 2nd year UG"
                        placeholderTextColor={colors.textHint}
                        {...textAndroid}
                      />
                    </View>
                    <View style={[styles.accField, styles.accFieldLast]}>
                      <Text style={stepStyles.fieldLabel}>Institute</Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          styles.inputIdle,
                          institute.length > 0 ? styles.inputFilled : styles.inputDefault,
                          inputShadow,
                        ]}
                        value={institute}
                        onChangeText={setInstitute}
                        placeholder="School, college, or coaching (optional)"
                        placeholderTextColor={colors.textHint}
                        {...textAndroid}
                      />
                    </View>
                    {sectionErrors.academics ? (
                      <Text style={styles.sectionErrText}>{sectionErrors.academics}</Text>
                    ) : null}
                    <Pressable
                      style={({ pressed }) => [
                        styles.sectionUpdateBtn,
                        sectionSaving === 'academics' && styles.sectionUpdateBtnDisabled,
                        pressed && sectionSaving !== 'academics' && styles.sectionUpdateBtnPressed,
                      ]}
                      onPress={() => void saveAcademicsSection()}
                      disabled={sectionSaving !== null}
                      accessibilityRole="button"
                      accessibilityLabel="Save academics"
                    >
                      {sectionSaving === 'academics' ? (
                        <ActivityIndicator color={colors.onBrand} />
                      ) : (
                        <>
                          <MaterialCommunityIcons name="check" size={20} color={colors.onBrand} />
                          <Text style={styles.sectionUpdateBtnText}>Save academics</Text>
                        </>
                      )}
                    </Pressable>
                    {sectionSavedFlash.academics ? <Text style={styles.sectionSavedText}>Saved</Text> : null}
                  </View>
                ) : null}
              </View>

              <View style={styles.accShell}>
                <Pressable
                  onPress={() => toggleSection('examPrep')}
                  android_ripple={{ color: colors.borderSubtle }}
                  style={({ pressed }) => [
                    styles.accHeader,
                    expandedSection === 'examPrep' && styles.accHeaderOpen,
                    Platform.OS === 'ios' && pressed && styles.accHeaderPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: expandedSection === 'examPrep' }}
                  accessibilityHint="Shows or hides exam preparation fields"
                >
                  <View style={styles.accHeaderRow}>
                    <View style={styles.accIconWrap}>
                      <MaterialCommunityIcons name="clipboard-text-outline" size={24} color={colors.brand} />
                    </View>
                    <View style={styles.accHeaderText}>
                      <Text style={styles.accTitle}>Exam preparing</Text>
                      <Text style={styles.accKicker}>Target year and exams you follow</Text>
                      <Text style={styles.accSummary} numberOfLines={2}>
                        {examPrepSummary}
                      </Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons
                    name={expandedSection === 'examPrep' ? 'chevron-up' : 'chevron-down'}
                    size={22}
                    color={colors.textHint}
                  />
                </Pressable>
                {expandedSection === 'examPrep' ? (
                  <View style={styles.accBody}>
                    <Text style={styles.accBodyLead}>
                      Your target year and exam picks shape your feed and recommendations.
                    </Text>
                    <View style={[styles.accField, stepStyles.fieldRaised]}>
                      <Text style={stepStyles.fieldLabel}>Target year</Text>
                      <TargetYearPicker value={targetYearText} onChange={setTargetYearText} />
                    </View>
                    <Text style={styles.examSub}>
                      Selected exams (max 4). Search to add or tap a chip to remove.
                    </Text>
                    <View style={styles.examPickerEmbed}>
                      <OnboardingExamPicker
                        compact
                        selectedExams={selectedExams}
                        onSelectionChange={setSelectedExams}
                      />
                    </View>
                    {sectionErrors.examPrep ? (
                      <Text style={styles.sectionErrText}>{sectionErrors.examPrep}</Text>
                    ) : null}
                    <Pressable
                      style={({ pressed }) => [
                        styles.sectionUpdateBtn,
                        sectionSaving === 'examPrep' && styles.sectionUpdateBtnDisabled,
                        pressed && sectionSaving !== 'examPrep' && styles.sectionUpdateBtnPressed,
                      ]}
                      onPress={() => void saveExamPrepSection()}
                      disabled={sectionSaving !== null}
                      accessibilityRole="button"
                      accessibilityLabel="Save exam preparing"
                    >
                      {sectionSaving === 'examPrep' ? (
                        <ActivityIndicator color={colors.onBrand} />
                      ) : (
                        <>
                          <MaterialCommunityIcons name="check" size={20} color={colors.onBrand} />
                          <Text style={styles.sectionUpdateBtnText}>Save exam preparing</Text>
                        </>
                      )}
                    </Pressable>
                    {sectionSavedFlash.examPrep ? <Text style={styles.sectionSavedText}>Saved</Text> : null}
                  </View>
                ) : null}
              </View>
            </View>
          </>
        )}
      </ScrollView>
      {modal}
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screenIntro: {
      marginBottom: 18,
    },
    screenIntroTitle: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.lg,
      color: colors.textPrimary,
      letterSpacing: -0.2,
      marginBottom: 6,
    },
    screenIntroBody: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.textMuted,
      lineHeight: 21,
    },
    sectionList: {
      gap: 14,
    },
    accShell: {
      backgroundColor: colors.surface,
      borderRadius: theme.radius.card,
      borderWidth: theme.borderWidth.default,
      borderColor: colors.borderSubtle,
      overflow: 'hidden',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 3,
        },
        android: { elevation: 1 },
        default: {},
      }),
    },
    accHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      paddingVertical: 16,
      paddingHorizontal: 14,
      minHeight: 72,
    },
    accHeaderRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      minWidth: 0,
    },
    accIconWrap: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: colors.brandLight,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.brandBorder,
    },
    accHeaderOpen: {
      backgroundColor: colors.surfaceSubtle,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderSubtle,
    },
    accHeaderPressed: {
      opacity: 0.92,
    },
    accHeaderText: {
      flex: 1,
      minWidth: 0,
    },
    accTitle: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.md,
      color: colors.textPrimary,
      letterSpacing: -0.15,
    },
    accKicker: {
      marginTop: 3,
      fontFamily: theme.typography.regular,
      fontSize: theme.fontSizes.meta,
      color: colors.textMuted,
      lineHeight: 18,
    },
    accSummary: {
      marginTop: 6,
      fontFamily: theme.typography.regular,
      fontSize: theme.fontSizes.meta,
      color: colors.textHint,
      lineHeight: 18,
    },
    accBody: {
      backgroundColor: colors.surfaceSubtle,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 20,
    },
    accBodyLead: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.textMuted,
      lineHeight: 20,
      marginBottom: 16,
    },
    accSubhead: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fontSizes.meta,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: 10,
    },
    accRule: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.borderSubtle,
      marginVertical: 16,
    },
    accField: {
      marginBottom: 14,
    },
    accFieldLast: {
      marginBottom: 0,
    },
    sectionErrText: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.danger,
      marginBottom: 12,
      lineHeight: 20,
    },
    sectionSavedText: {
      marginTop: 10,
      fontFamily: theme.typography.medium,
      fontSize: theme.fontSizes.meta,
      color: colors.progress,
    },
    sectionUpdateBtn: {
      marginTop: 4,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      minHeight: 48,
      borderRadius: theme.radius.button,
      backgroundColor: colors.brand,
    },
    sectionUpdateBtnDisabled: {
      opacity: 0.55,
    },
    sectionUpdateBtnPressed: {
      opacity: 0.9,
    },
    sectionUpdateBtnText: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.sm,
      color: colors.onBrand,
    },
    textInput: {
      minHeight: 52,
      marginTop: 8,
      borderRadius: 24,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: theme.fintSizes.md,
      color: colors.textPrimary,
    },
    inputMultiline: {
      minHeight: 100,
      paddingTop: 14,
      textAlignVertical: 'top',
    },
    inputIdle: {
      borderWidth: 1,
      borderColor: colors.inputBorder,
      backgroundColor: colors.surface,
    },
    inputDefault: {
      fontFamily: theme.typography.regular,
    },
    inputFilled: {
      fontFamily: theme.typography.semiBold,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundColor: colors.surface,
    },
    muted: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.textMuted,
      textAlign: 'center',
    },
    loaderWrap: {
      paddingVertical: 48,
      alignItems: 'center',
      gap: 12,
    },
    examSub: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.xs,
      color: colors.textMuted,
      lineHeight: 18,
      marginTop: 4,
      marginBottom: 8,
    },
    examPickerEmbed: {
      marginHorizontal: -4,
      minHeight: 120,
    },
  });
}
