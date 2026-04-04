export type OnboardingStepScreenProps = {
  /** Tell the layout whether the bottom primary (Next / Finish) should be enabled. */
  onStepValidityChange?: (canContinue: boolean) => void;
};
