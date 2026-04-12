import { Platform, StyleSheet } from 'react-native';
import type { ThemeColors } from '../../presentation/theme/ThemeContext';
import { theme } from '../../presentation/theme/theme';

/** Matches `DropDown` trigger — pill-shaped onboarding controls. */
export const ONBOARDING_INPUT_RADIUS = 24;

export const ONBOARDING_STEP = {
  contentPaddingTop: 8,
  fieldGap: 20,
  labelToControlGap: 8,
  rowColumnGap: 12,
} as const;

/** Shared shadow for text fields (aligned with DropDown). */
export function onboardingInputShadow() {
  return Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
    },
    android: { elevation: 1 },
    default: {},
  });
}

/**
 * Shared layout + labels for onboarding form fields (OnboardingCompletionScreen).
 */
export function createOnboardingStepStyles(colors: ThemeColors) {
  return StyleSheet.create({
    scroll: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    scrollContent: {
      paddingHorizontal: theme.spacing.screenPaddingH,
      paddingTop: ONBOARDING_STEP.contentPaddingTop,
      paddingBottom: 24,
      flexGrow: 1,
    },
    /** Photo & username: a bit more bottom room for keyboard. */
    scrollContentLoose: {
      paddingHorizontal: theme.spacing.screenPaddingH,
      paddingTop: ONBOARDING_STEP.contentPaddingTop,
      paddingBottom: 32,
      flexGrow: 1,
    },
    container: {
      flex: 1,
      backgroundColor: colors.surface,
      paddingHorizontal: theme.spacing.screenPaddingH,
      paddingTop: ONBOARDING_STEP.contentPaddingTop,
      gap: ONBOARDING_STEP.fieldGap,
    },
    field: {
      width: '100%',
      gap: ONBOARDING_STEP.labelToControlGap,
      zIndex: 1,
    },
    fieldRaised: {
      zIndex: 40,
    },
    fieldLabel: {
      fontSize: theme.fintSizes.sm,
      fontFamily: theme.typography.semiBold,
      color: colors.textPrimary,
      letterSpacing: -0.1,
    },
    /** Uppercase section headers (Photo, Username block, etc.) */
    sectionLabel: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.sm,
      color: colors.textMuted,
      marginBottom: 12,
      letterSpacing: 0.3,
      textTransform: 'uppercase',
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.borderSubtle,
      marginVertical: 24,
    },
    helpText: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.textMuted,
      lineHeight: theme.lineHeight.body,
      marginBottom: 16,
    },
    dobRow: {
      flexDirection: 'row',
      columnGap: ONBOARDING_STEP.rowColumnGap,
      alignItems: 'flex-start',
    },
    dobColSm: {
      flex: 1,
      gap: ONBOARDING_STEP.labelToControlGap,
    },
    dobColLg: {
      flex: 1.4,
      gap: ONBOARDING_STEP.labelToControlGap,
    },
  });
}
