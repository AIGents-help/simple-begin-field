/**
 * Demo Mode — global flag + helpers.
 *
 * The flag lives in localStorage so it survives navigation but is purely client-side.
 * Service-layer code reads `isDemoMode()` synchronously to short-circuit DB reads.
 */

const STORAGE_KEY = 'sp_demo_mode';

export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function enterDemoMode(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, 'true');
  } catch {
    /* noop */
  }
}

export function exitDemoMode(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}
