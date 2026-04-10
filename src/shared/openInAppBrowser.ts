import * as WebBrowser from 'expo-web-browser';

/**
 * Opens a URL inside the app (SFSafariViewController on iOS, Chrome Custom Tabs on Android).
 * Falls back silently if the URL is invalid.
 */
export async function openInAppBrowser(url: string): Promise<void> {
  try {
    await WebBrowser.openBrowserAsync(url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      controlsColor: '#7C3AED',
    });
  } catch {
    // swallow — invalid URL or user cancelled
  }
}
