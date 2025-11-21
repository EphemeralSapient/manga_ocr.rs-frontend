/**
 * Storage Utilities - Chrome Storage API Helpers
 */

import type { ExtensionSettings } from '../types';

const DEFAULT_SETTINGS: ExtensionSettings = {
  serverUrl: 'http://localhost:1420',
  apiKeys: [],
  translateModel: 'gemini-flash-latest',
  targetLanguage: 'English',
  fontSource: 'builtin',
  fontFamily: 'arial',
  googleFontFamily: 'Roboto',
  includeFreeText: false,
  bananaMode: false,
  textStroke: false,
  backgroundType: 'blur',
  cache: true,
  metricsDetail: true,
  geminiThinking: false,
  tighterBounds: false,
  filterOrphanRegions: false,
  useMask: true,
  mergeImg: false,
  batchSize: 5,
  sessionLimit: 8, // Default: will be max(cores/2, 8) on backend
  targetSize: 640, // Default: 640px (range: 0 for source, or [320, 2048])
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

/**
 * Cumulative Statistics Storage
 */
export interface CumulativeStats {
  totalSessions: number;
  totalImages: number;
  totalRegions: number;
  totalSimpleBg: number;
  totalComplexBg: number;
  totalLabel0: number;
  totalLabel1: number;
  totalLabel2: number;
  totalApiCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheHits: number;
  totalCacheMisses: number;
  totalProcessingTimeMs: number;
  lastProcessedAt?: number;
  firstProcessedAt?: number;
}

const STATS_KEY = 'cumulativeStats';

export async function loadCumulativeStats(): Promise<CumulativeStats> {
  try {
    const result = await chrome.storage.local.get(STATS_KEY);
    return result[STATS_KEY] || {
      totalSessions: 0,
      totalImages: 0,
      totalRegions: 0,
      totalSimpleBg: 0,
      totalComplexBg: 0,
      totalLabel0: 0,
      totalLabel1: 0,
      totalLabel2: 0,
      totalApiCalls: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCacheHits: 0,
      totalCacheMisses: 0,
      totalProcessingTimeMs: 0,
    };
  } catch (error) {
    console.error('[Storage] Failed to load cumulative stats:', error);
    return {
      totalSessions: 0,
      totalImages: 0,
      totalRegions: 0,
      totalSimpleBg: 0,
      totalComplexBg: 0,
      totalLabel0: 0,
      totalLabel1: 0,
      totalLabel2: 0,
      totalApiCalls: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCacheHits: 0,
      totalCacheMisses: 0,
      totalProcessingTimeMs: 0,
    };
  }
}

export async function addSessionStats(sessionAnalytics: {
  total_images?: number;
  total_regions?: number;
  simple_bg_count?: number;
  complex_bg_count?: number;
  label_0_count?: number;
  label_1_count?: number;
  label_2_count?: number;
  api_calls_simple?: number;
  api_calls_complex?: number;
  api_calls_banana?: number;
  input_tokens?: number;
  output_tokens?: number;
  cache_hits?: number;
  cache_misses?: number;
  total_time_ms?: number;
}): Promise<void> {
  try {
    const current = await loadCumulativeStats();

    const updated: CumulativeStats = {
      totalSessions: current.totalSessions + 1,
      totalImages: current.totalImages + (sessionAnalytics.total_images || 0),
      totalRegions: current.totalRegions + (sessionAnalytics.total_regions || 0),
      totalSimpleBg: current.totalSimpleBg + (sessionAnalytics.simple_bg_count || 0),
      totalComplexBg: current.totalComplexBg + (sessionAnalytics.complex_bg_count || 0),
      totalLabel0: current.totalLabel0 + (sessionAnalytics.label_0_count || 0),
      totalLabel1: current.totalLabel1 + (sessionAnalytics.label_1_count || 0),
      totalLabel2: current.totalLabel2 + (sessionAnalytics.label_2_count || 0),
      totalApiCalls: current.totalApiCalls +
        (sessionAnalytics.api_calls_simple || 0) +
        (sessionAnalytics.api_calls_complex || 0) +
        (sessionAnalytics.api_calls_banana || 0),
      totalInputTokens: current.totalInputTokens + (sessionAnalytics.input_tokens || 0),
      totalOutputTokens: current.totalOutputTokens + (sessionAnalytics.output_tokens || 0),
      totalCacheHits: current.totalCacheHits + (sessionAnalytics.cache_hits || 0),
      totalCacheMisses: current.totalCacheMisses + (sessionAnalytics.cache_misses || 0),
      totalProcessingTimeMs: current.totalProcessingTimeMs + (sessionAnalytics.total_time_ms || 0),
      lastProcessedAt: Date.now(),
      firstProcessedAt: current.firstProcessedAt || Date.now(),
    };

    await chrome.storage.local.set({ [STATS_KEY]: updated });
    console.log('[Storage] Cumulative stats updated:', updated);
  } catch (error) {
    console.error('[Storage] Failed to save cumulative stats:', error);
  }
}

export async function resetCumulativeStats(): Promise<void> {
  try {
    await chrome.storage.local.remove(STATS_KEY);
    console.log('[Storage] Cumulative stats reset');
  } catch (error) {
    console.error('[Storage] Failed to reset cumulative stats:', error);
  }
}
