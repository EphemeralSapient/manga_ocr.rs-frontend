/**
 * Background Service Worker
 * Handles keyboard shortcuts and message forwarding
 */

import type { Message } from './types';

console.log('[BACKGROUND] Manga Text Processor: Service worker initializing...');

/**
 * Handle keyboard shortcuts
 */
chrome.commands.onCommand.addListener(async (command) => {
  console.log(`[BACKGROUND] Command received: ${command}`);

  if (command === 'process-page-images' || command === 'select-single-image') {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab?.id) {
        console.error('[BACKGROUND] No active tab found');
        return;
      }

      // Ensure content script is injected
      await ensureContentScript(tab.id);

      // Get saved settings
      const settings = await chrome.storage.sync.get([
        'serverUrl',
        'apiKeys',
        'translateModel',
        'targetLanguage',
        'fontSource',
        'fontFamily',
        'googleFontFamily',
        'includeFreeText',
        'bananaMode',
        'textStroke',
        'backgroundType',
        'cache',
        'metricsDetail',
        'geminiThinking',
        'tighterBounds',
        'filterOrphanRegions',
        'maskMode',
        'mergeImg',
        'batchSize',
        'sessionLimit',
        'targetSize',
        'localOcr',
        'useCerebras',
        'cerebrasApiKey',
      ]);

      // Determine if using Cerebras (requires local OCR + Cerebras toggle)
      const usingCerebras = settings.localOcr && settings.useCerebras;

      const config = {
        serverUrl: settings.serverUrl || 'http://localhost:1420',
        // Only send Gemini API keys if NOT using Cerebras
        apiKeys: usingCerebras ? [] : (settings.apiKeys || []),
        translateModel: settings.translateModel || 'gemini-flash-latest',
        targetLanguage: settings.targetLanguage || 'English',
        fontSource: settings.fontSource || 'builtin',
        fontFamily: settings.fontFamily || 'arial',
        googleFontFamily: settings.googleFontFamily || 'Roboto',
        includeFreeText: settings.includeFreeText || false,
        bananaMode: settings.bananaMode || false,
        textStroke: settings.textStroke || false,
        backgroundType: settings.backgroundType || 'blur',
        cache: settings.cache !== undefined ? settings.cache : true,
        metricsDetail: settings.metricsDetail !== undefined ? settings.metricsDetail : true,
        geminiThinking: settings.geminiThinking ?? true,
        tighterBounds: settings.tighterBounds !== undefined ? settings.tighterBounds : true,
        filterOrphanRegions: settings.filterOrphanRegions || false,
        maskMode: settings.maskMode || 'fast',
        mergeImg: settings.mergeImg || false,
        batchSize: settings.batchSize || 5,
        sessionLimit: settings.sessionLimit || 8,
        targetSize: settings.targetSize || 640,
        localOcr: settings.localOcr || false,
        useCerebras: settings.useCerebras || false,
        // Only send Cerebras API key when using Cerebras
        cerebrasApiKey: usingCerebras ? (settings.cerebrasApiKey || '') : '',
      };

      // Send appropriate message to content script
      const action = command === 'select-single-image' ? 'enter-selection-mode' : 'process-images';
      const response = await chrome.tabs.sendMessage(tab.id, {
        action,
        config,
      });

      console.log('[BACKGROUND] Response:', response);
    } catch (error) {
      console.error('[BACKGROUND] Failed to process:', error);
    }
  }
});

/**
 * Promise with timeout wrapper
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), ms)
    )
  ]);
}

/**
 * Ensure content script is loaded in a tab, inject if needed
 */
async function ensureContentScript(tabId: number): Promise<void> {
  // First check if script is already loaded
  try {
    const response = await withTimeout(
      chrome.tabs.sendMessage(tabId, { action: 'ping' }),
      500
    );
    if (response?.loaded) {
      console.log(`[BACKGROUND] Content script already loaded in tab ${tabId}`);
      return;
    }
  } catch {
    // Script not loaded, will try to inject
  }

  // Try to inject the content script
  console.log(`[BACKGROUND] Injecting content script into tab ${tabId}...`);

  try {
    // Get tab info to check if it's a valid target
    const tab = await chrome.tabs.get(tabId);
    const url = tab.url || '';
    console.log(`[BACKGROUND] Tab URL: ${url.substring(0, 80)}`);

    // Check for restricted URLs
    if (!url || url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
      throw new Error('Cannot inject into this page type');
    }

    // Special handling for file:// URLs - provide helpful error message
    if (url.startsWith('file://')) {
      console.log(`[BACKGROUND] Detected file:// URL, checking access...`);
      // Try to inject - if it fails, it's likely due to missing permission
      // The error will be caught and we'll provide a helpful message
    }

    // For blob: URLs, executeScript hangs - rely on manifest injection
    // Just wait a bit and check if manifest already injected it
    if (url.startsWith('blob:')) {
      console.log(`[BACKGROUND] Blob URL detected - checking if manifest injected script...`);
      await new Promise(resolve => setTimeout(resolve, 500));

      try {
        const pingResponse = await withTimeout(
          chrome.tabs.sendMessage(tabId, { action: 'ping' }),
          1000
        );
        if (pingResponse?.loaded) {
          console.log(`[BACKGROUND] Content script found in blob URL tab`);
          return;
        }
      } catch {
        // Script not available
      }

      throw new Error('Blob URLs require page refresh. Please refresh and try again.');
    }

    // Inject the script for regular URLs
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      files: ['scripts/content.js'],
    });

    console.log(`[BACKGROUND] Injection result:`, results);

    // Wait for script to initialize and verify it's working
    await new Promise(resolve => setTimeout(resolve, 200));

    // Verify the script is responding
    const pingResponse = await withTimeout(
      chrome.tabs.sendMessage(tabId, { action: 'ping' }),
      1000
    );

    if (pingResponse?.loaded) {
      console.log(`[BACKGROUND] Content script verified in tab ${tabId}`);
    } else {
      throw new Error('Script injected but not responding');
    }
  } catch (error) {
    const msg = (error as Error).message;
    console.error(`[BACKGROUND] Injection failed for tab ${tabId}: ${msg}`);

    // Get tab URL for better error messages
    try {
      const tab = await chrome.tabs.get(tabId);
      const url = tab.url || '';

      // Provide helpful error for file:// URLs
      if (url.startsWith('file://')) {
        throw new Error('File access not enabled. Go to chrome://extensions/, find "Manga Text Processor", and enable "Allow access to file URLs"');
      }
    } catch (tabError) {
      // If we can't get the tab, fall through to generic error
    }

    throw new Error(`Cannot access page: ${msg}`);
  }
}

/**
 * Forward messages between content script and popup
 */
chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  console.log('[BACKGROUND] Message received:', message);

  // Handle image fetch requests from content script (bypasses CORS)
  if (message.action === 'fetch-image' && message.url) {
    fetchImageAsBase64(message.url)
      .then((base64) => {
        sendResponse({ success: true, base64 });
      })
      .catch((error) => {
        console.error('[BACKGROUND] Failed to fetch image:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Async response
  }

  // Forward processing updates to popup if it's open
  const forwardActions = ['processing-update', 'processing-complete', 'processing-error'];

  if (forwardActions.includes(message.action)) {
    // Try to send to popup (may fail if popup is closed)
    chrome.runtime.sendMessage(message).catch((error) => {
      console.log('[BACKGROUND] Could not forward to popup:', error.message);
    });
  }

  sendResponse({ status: 'received' });
  return false;
});

/**
 * Fetch image from URL and return as base64 (bypasses CORS in background script)
 */
async function fetchImageAsBase64(url: string): Promise<string> {
  // Add timeout for image fetch (30 seconds)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert to base64'));
        }
      };
      reader.onerror = () => reject(new Error('FileReader error'));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    clearTimeout(timeoutId);
    if ((error as Error).name === 'AbortError') {
      throw new Error('Image fetch timeout after 30 seconds');
    }
    throw error;
  }
}

/**
 * Initialize default settings on installation
 */
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[BACKGROUND] Extension installed/updated:', details.reason);

  if (details.reason === 'install') {
    const defaultSettings = {
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
      geminiThinking: true,
      tighterBounds: true,
      filterOrphanRegions: false,
      maskMode: 'fast',
      mergeImg: false,
      batchSize: 5,
      sessionLimit: 8,
      targetSize: 640,
      theme: 'auto',
      localOcr: false,
      useCerebras: false,
      cerebrasApiKey: '',
    };

    chrome.storage.sync.set(defaultSettings);
    console.log('[BACKGROUND] Default settings initialized');
  }

  // Note: We don't inject into existing tabs here because:
  // 1. executeScript can hang on inactive/discarded tabs in MV3
  // 2. Permissions may not be fully applied during onInstalled
  // Instead, we inject on-demand when user triggers an action
  console.log('[BACKGROUND] Content scripts will be injected on-demand when needed');
});

console.log('[BACKGROUND] Service worker ready');
console.log('[BACKGROUND] Keyboard shortcuts: Alt+Q (Process All), Alt+W (Select Image)');
