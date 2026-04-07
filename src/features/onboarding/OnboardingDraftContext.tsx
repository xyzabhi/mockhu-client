import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AppError, mergeSessionUser, postOnboarding, userApi } from '../../api';
import {
  buildOnboardingPayload,
  initialOnboardingDraft,
  isUsableAvatarDraftUri,
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

    let draftForPayload = draft;
    const avatarTrim = draft.avatar_url.trim();
    if (
      isUsableAvatarDraftUri(avatarTrim) &&
      !/^https?:\/\//i.test(avatarTrim)
    ) {
      try {
        const up = await userApi.uploadMeAvatar(avatarTrim);
        await mergeSessionUser({
          avatar_url: up.avatar_url,
          avatar_urls: up.avatar_urls,
          avatar_updated_at: up.avatar_updated_at,
        });
        draftForPayload = { ...draft, avatar_url: up.avatar_url };
      } catch (e) {
        if (e instanceof AppError && e.code === 'SERVICE_UNAVAILABLE') {
          throw new AppError(
            'Photo upload is temporarily unavailable. Skip the new photo or try again later.',
            'user',
            'SERVICE_UNAVAILABLE',
            e.status ?? 503,
          );
        }
        throw e;
      }
    }

    const payload = buildOnboardingPayload(draftForPayload);
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
    await mergeSessionUser(sessionUserPatchFromOnboardingResponse(data, draftForPayload));
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
