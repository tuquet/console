const WELCOME_DISMISSED_KEY = 'operon:welcome-dismissed';

/**
 * Returns true if the user has not dismissed the startup Welcome page.
 */
export function shouldShowWelcomeOnStartup(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  return window.localStorage.getItem(WELCOME_DISMISSED_KEY) !== 'true';
}

/**
 * Persists whether the Welcome page should open automatically on startup.
 */
export function setShowWelcomeOnStartup(show: boolean): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  if (show) {
    window.localStorage.removeItem(WELCOME_DISMISSED_KEY);
  } else {
    window.localStorage.setItem(WELCOME_DISMISSED_KEY, 'true');
  }
}
