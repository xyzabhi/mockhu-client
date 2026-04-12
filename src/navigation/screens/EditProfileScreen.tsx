import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

export function EditProfileScreen({ navigation }: Props) {
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
  const [username, setUsername] = useState('');
  const [grade, setGrade] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [targetYearText, setTargetYearText] = useState(String(minTargetYear()));
  const [selectedExams, setSelectedExams] = useState<SelectedExamDraft[]>([]);
  const [examsReady, setExamsReady] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setFirstName(profile.first_name?.trim() ?? '');
    setLastName(profile.last_name?.trim() ?? '');
    setBio(profile.bio?.trim() ?? '');
    setUsername(profile.username?.trim() ?? '');
    setGrade(profile.grade?.trim() ?? '');
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

  const handleSave = useCallback(async () => {
    if (!userId) return;
    setFormError(null);
    if (!firstName.trim() || !lastName.trim()) {
      setFormError('First and last name are required.');
      return;
    }
    const examErr = validateOnboardingExamsStep(selectedExams);
    if (examErr) {
      setFormError(examErr);
      return;
    }
    const yearErr = validateOnboardingYearStep(targetYearText);
    if (yearErr) {
      setFormError(yearErr);
      return;
    }
    const targetYear = Number.parseInt(targetYearText.trim(), 10);
    setSubmitting(true);
    try {
      const me = await userApi.patchMe({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        bio: bio.trim() || null,
        username: username.trim() || null,
        gender: gender.trim() || null,
        grade: grade.trim() || null,
        dob: dob.trim() || null,
        target_year: targetYear,
      });
      await userApi.patchUserInterests(userId, {
        exam_ids: selectedExams.map((e) => e.id),
        exam_category_ids: interests?.exam_category_ids ?? [],
      });
      mergeSessionUser(meResponseToTokenUserPatch(me));
      mergeSessionUser({
        target_year: targetYear,
        exam_ids: selectedExams.map((e) => e.id),
        exam_category_ids: interests?.exam_category_ids ?? [],
      });
      await hydrateSessionUserFromMe({ includeInterests: true });
      void refetchInterests();
      navigation.goBack();
    } catch (e) {
      const msg =
        e instanceof AppError
          ? e.message
          : 'Could not save. If this persists, your API may not support profile or interests updates yet.';
      showModal({ title: 'Could not save', message: msg });
    } finally {
      setSubmitting(false);
    }
  }, [
    userId,
    firstName,
    lastName,
    bio,
    username,
    grade,
    gender,
    dob,
    targetYearText,
    selectedExams,
    interests?.exam_category_ids,
    navigation,
    refetchInterests,
    showModal,
  ]);

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
            <Text style={stepStyles.helpText}>
              Update how you show up on Mockhu. Exams and target year feed recommendations and your profile.
            </Text>

            {formError ? (
              <View style={styles.bannerErr}>
                <Text style={styles.bannerErrText}>{formError}</Text>
              </View>
            ) : null}

            <View style={[stepStyles.field, styles.fieldGap]}>
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
            <View style={[stepStyles.field, styles.fieldGap]}>
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

            <View style={[stepStyles.field, styles.fieldGap]}>
              <Text style={stepStyles.fieldLabel}>Username</Text>
              <TextInput
                style={[
                  styles.textInput,
                  styles.inputIdle,
                  username.length > 0 ? styles.inputFilled : styles.inputDefault,
                  inputShadow,
                ]}
                value={username}
                onChangeText={setUsername}
                placeholder="username"
                placeholderTextColor={colors.textHint}
                autoCapitalize="none"
                autoCorrect={false}
                {...textAndroid}
              />
            </View>

            <View style={[stepStyles.field, styles.fieldGap]}>
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
                placeholder="Short bio"
                placeholderTextColor={colors.textHint}
                multiline
                {...textAndroid}
              />
            </View>

            <View style={[stepStyles.field, styles.fieldGap]}>
              <Text style={stepStyles.fieldLabel}>Grade</Text>
              <TextInput
                style={[
                  styles.textInput,
                  styles.inputIdle,
                  grade.length > 0 ? styles.inputFilled : styles.inputDefault,
                  inputShadow,
                ]}
                value={grade}
                onChangeText={setGrade}
                placeholder="e.g. 12th"
                placeholderTextColor={colors.textHint}
                {...textAndroid}
              />
            </View>
            <View style={[stepStyles.field, styles.fieldGap]}>
              <Text style={stepStyles.fieldLabel}>Gender</Text>
              <TextInput
                style={[
                  styles.textInput,
                  styles.inputIdle,
                  gender.length > 0 ? styles.inputFilled : styles.inputDefault,
                  inputShadow,
                ]}
                value={gender}
                onChangeText={setGender}
                placeholder="Optional"
                placeholderTextColor={colors.textHint}
                {...textAndroid}
              />
            </View>
            <View style={[stepStyles.field, styles.fieldGap]}>
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

            <View style={[stepStyles.field, stepStyles.fieldRaised, styles.fieldGap]}>
              <Text style={stepStyles.fieldLabel}>Target exam year</Text>
              <TargetYearPicker value={targetYearText} onChange={setTargetYearText} />
            </View>

            <View style={styles.examBlock}>
              <Text style={stepStyles.fieldLabel}>Exams you&apos;re preparing for</Text>
              <Text style={styles.examSub}>
                Choose up to 4 exams. These power your feed and profile chips.
              </Text>
              <OnboardingExamPicker selectedExams={selectedExams} onSelectionChange={setSelectedExams} />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.saveBtn,
                (submitting || showLoader) && styles.saveBtnDisabled,
                pressed && !submitting && !showLoader && styles.saveBtnPressed,
              ]}
              onPress={() => void handleSave()}
              disabled={submitting || showLoader}
              accessibilityRole="button"
              accessibilityLabel="Save profile"
            >
              {submitting ? (
                <ActivityIndicator color={colors.onBrand} />
              ) : (
                <>
                  <MaterialCommunityIcons name="check" size={22} color={colors.onBrand} />
                  <Text style={styles.saveBtnText}>Save</Text>
                </>
              )}
            </Pressable>
          </>
        )}
      </ScrollView>
      {modal}
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    fieldGap: {
      marginBottom: 4,
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
    bannerErr: {
      padding: 12,
      borderRadius: 12,
      backgroundColor: 'rgba(239, 68, 68, 0.12)',
      marginBottom: 4,
    },
    bannerErrText: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.danger,
      lineHeight: 20,
    },
    examBlock: {
      width: '100%',
      marginTop: 8,
      gap: 8,
    },
    examSub: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.xs,
      color: colors.textMuted,
      lineHeight: 18,
      marginBottom: 4,
    },
    saveBtn: {
      marginTop: 24,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      minHeight: 52,
      borderRadius: theme.radius.button,
      backgroundColor: colors.brand,
    },
    saveBtnDisabled: {
      opacity: 0.55,
    },
    saveBtnPressed: {
      opacity: 0.9,
    },
    saveBtnText: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.md,
      color: colors.onBrand,
    },
  });
}
