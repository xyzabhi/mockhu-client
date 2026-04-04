import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AppError, mergeSessionUser, postOnboarding } from '../../api';
import {
  buildOnboardingPayload,
  initialOnboardingDraft,
  sessionUserPatchFromOnboardingResponse,
  validateOnboardingDraft,
  type OnboardingDraft,
} from './onboardingDraft';

type OnboardingDraftContextValue = {
  draft: OnboardingDraft;
  updateDraft: (partial: Partial<OnboardingDraft>) => void;
  submitOnboarding: () => Promise<void>;
};

const OnboardingDraftContext = createContext<OnboardingDraftContextValue | null>(null);

export function OnboardingDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<OnboardingDraft>(initialOnboardingDraft);

  const updateDraft = useCallback((partial: Partial<OnboardingDraft>) => {
    setDraft((d) => ({ ...d, ...partial }));
  }, []);

  const submitOnboarding = useCallback(async () => {
    const err = validateOnboardingDraft(draft);
    if (err) {
      throw new AppError(err, 'user');
    }
    const payload = buildOnboardingPayload(draft);
    let data: Awaited<ReturnType<typeof postOnboarding>>;
    try {
      data = await postOnboarding(payload);
    } catch (e) {
      const msg =
        e instanceof AppError
          ? e.message
          : e instanceof Error
            ? e.message
            : String(e);
      console.warn('[onboarding]', msg);
      throw e;
    }
    await mergeSessionUser(sessionUserPatchFromOnboardingResponse(data, draft));
  }, [draft]);

  const value = useMemo(
    () => ({
      draft,
      updateDraft,
      submitOnboarding,
    }),
    [draft, updateDraft, submitOnboarding],
  );

  return (
    <OnboardingDraftContext.Provider value={value}>{children}</OnboardingDraftContext.Provider>
  );
}

export function useOnboardingDraft(): OnboardingDraftContextValue {
  const ctx = useContext(OnboardingDraftContext);
  if (!ctx) {
    throw new Error('useOnboardingDraft must be used within OnboardingDraftProvider');
  }
  return ctx;
}
