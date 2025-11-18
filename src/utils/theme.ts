/**
 * Theme Management Utilities
 */

import type { Theme } from '../types';

/**
 * Get user's system color scheme preference
 */
export function getSystemTheme(): Theme {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

/**
 * Apply theme to document
 */
export function applyTheme(theme: Theme | 'auto'): void {
  const resolvedTheme = theme === 'auto' ? getSystemTheme() : theme;
  document.documentElement.setAttribute('data-theme', resolvedTheme);

  // Also set a class for easier CSS targeting
  document.documentElement.classList.remove('theme-light', 'theme-dark');
  document.documentElement.classList.add(`theme-${resolvedTheme}`);
}

/**
 * Initialize theme from storage or system preference
 */
export async function initTheme(): Promise<Theme> {
  try {
    const { theme } = await chrome.storage.sync.get('theme');
    const themePreference = (theme as Theme | 'auto') || 'auto';
    applyTheme(themePreference);
    return themePreference === 'auto' ? getSystemTheme() : themePreference;
  } catch (error) {
    console.error('[Theme] Failed to initialize:', error);
    const systemTheme = getSystemTheme();
    applyTheme(systemTheme);
    return systemTheme;
  }
}

/**
 * Toggle between light and dark themes
 */
export async function toggleTheme(): Promise<Theme> {
  try {
    const currentTheme = document.documentElement.getAttribute('data-theme') as Theme;
    const newTheme: Theme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    await chrome.storage.sync.set({ theme: newTheme });
    return newTheme;
  } catch (error) {
    console.error('[Theme] Failed to toggle:', error);
    return getSystemTheme();
  }
}

/**
 * Listen for system theme changes
 */
export function watchSystemTheme(callback: (theme: Theme) => void): void {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handler = (e: MediaQueryListEvent) => {
    const newTheme: Theme = e.matches ? 'dark' : 'light';
    callback(newTheme);
  };

  // Modern browsers
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handler);
  } else {
    // Fallback for older browsers
    mediaQuery.addListener(handler);
  }
}
