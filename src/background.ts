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

  if (command === 'process-page-images') {
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
      };

      // Send message to content script
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'process-images',
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
      theme: 'auto',
    };

    chrome.storage.sync.set(defaultSettings);
    console.log('[BACKGROUND] Default settings initialized');
  }
});

console.log('[BACKGROUND] Service worker ready');
console.log('[BACKGROUND] Keyboard shortcut: Ctrl+Shift+M (Cmd+Shift+M on Mac)');
