/**
 * Storage Utilities - Chrome Storage API Helpers
 */

import type { ExtensionSettings } from '../types';

const DEFAULT_SETTINGS: ExtensionSettings = {
  serverUrl: 'http://localhost:1420',
  apiKeys: [],
  translateModel: 'gemini-flash-latest',
  includeFreeText: false,
  bananaMode: false,
  textStroke: false,
  blurFreeTextBg: false,
  cache: true,
  metricsDetail: true,
  useMask: true,
  mergeImg: false,
  batchSize: 5,
  sessionLimit: 8, // Default: will be max(cores/2, 8) on backend
  theme: 'auto',
};

/**
 * Load settings from Chrome storage
 */
export async function loadSettings(): Promise<ExtensionSettings> {
  try {
    const data = await chrome.storage.sync.get(Object.keys(DEFAULT_SETTINGS));
    return { ...DEFAULT_SETTINGS, ...data } as ExtensionSettings;
  } catch (error) {
    console.error('[Storage] Failed to load settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save settings to Chrome storage
 */
export async function saveSettings(settings: Partial<ExtensionSettings>): Promise<void> {
  try {
    await chrome.storage.sync.set(settings);
  } catch (error) {
    console.error('[Storage] Failed to save settings:', error);
    throw error;
  }
}

/**
 * Get a single setting value
 */
export async function getSetting<K extends keyof ExtensionSettings>(
  key: K
): Promise<ExtensionSettings[K]> {
  try {
    const data = await chrome.storage.sync.get(key);
    return data[key] ?? DEFAULT_SETTINGS[key];
  } catch (error) {
    console.error(`[Storage] Failed to get setting ${key}:`, error);
    return DEFAULT_SETTINGS[key];
  }
}

/**
 * Set a single setting value
 */
export async function setSetting<K extends keyof ExtensionSettings>(
  key: K,
  value: ExtensionSettings[K]
): Promise<void> {
  try {
    await chrome.storage.sync.set({ [key]: value });
  } catch (error) {
    console.error(`[Storage] Failed to set setting ${key}:`, error);
    throw error;
  }
}

/**
 * Reset settings to defaults
 */
export async function resetSettings(): Promise<void> {
  try {
    await chrome.storage.sync.clear();
    await chrome.storage.sync.set(DEFAULT_SETTINGS);
  } catch (error) {
    console.error('[Storage] Failed to reset settings:', error);
    throw error;
  }
}

/**
 * Listen for storage changes
 */
export function onSettingsChanged(
  callback: (changes: Partial<ExtensionSettings>) => void
): void {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync') {
      const settingsChanges: Partial<ExtensionSettings> = {};
      for (const [key, { newValue }] of Object.entries(changes)) {
        if (key in DEFAULT_SETTINGS) {
          settingsChanges[key as keyof ExtensionSettings] = newValue;
        }
      }
      if (Object.keys(settingsChanges).length > 0) {
        callback(settingsChanges);
      }
    }
  });
}
