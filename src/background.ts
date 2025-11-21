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

      // Get saved settings
      const settings = await chrome.storage.sync.get([
        'serverUrl',
        'apiKeys',
        'translateModel',
        'includeFreeText',
        'bananaMode',
        'textStroke',
        'blurFreeTextBg',
        'cache',
        'metricsDetail',
        'geminiThinking',
        'tighterBounds',
        'useMask',
        'mergeImg',
        'batchSize',
        'sessionLimit',
      ]);

      const config = {
        serverUrl: settings.serverUrl || 'http://localhost:1420',
        apiKeys: settings.apiKeys || [],
        translateModel: settings.translateModel || 'gemini-flash-latest',
        includeFreeText: settings.includeFreeText || false,
        bananaMode: settings.bananaMode || false,
        textStroke: settings.textStroke || false,
        blurFreeTextBg: settings.blurFreeTextBg || false,
        cache: settings.cache !== undefined ? settings.cache : true,
        metricsDetail: settings.metricsDetail !== undefined ? settings.metricsDetail : true,
        geminiThinking: settings.geminiThinking || false,
        tighterBounds: settings.tighterBounds !== undefined ? settings.tighterBounds : true,
        useMask: settings.useMask !== undefined ? settings.useMask : true,
        mergeImg: settings.mergeImg || false,
        batchSize: settings.batchSize || 5,
        sessionLimit: settings.sessionLimit || 8,
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
      includeFreeText: false,
      bananaMode: false,
      textStroke: false,
      blurFreeTextBg: false,
      cache: true,
      metricsDetail: true,
      useMask: true,
      mergeImg: false,
      batchSize: 5,
      sessionLimit: 8,
      theme: 'auto',
    };

    chrome.storage.sync.set(defaultSettings);
    console.log('[BACKGROUND] Default settings initialized');
  }
});

console.log('[BACKGROUND] Service worker ready');
console.log('[BACKGROUND] Keyboard shortcut: Ctrl+Shift+M (Cmd+Shift+M on Mac)');
