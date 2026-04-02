type ReauthHandler = () => void;

let onReauthRequired: ReauthHandler | null = null;

/** Register once (e.g. from RootNavigator) to reset navigation to login after refresh failure. */
export function setReauthHandler(handler: ReauthHandler | null): void {
  onReauthRequired = handler;
}

export function notifyReauthRequired(): void {
  try {
    onReauthRequired?.();
  } catch {
    /* navigation may not be ready */
  }
}
