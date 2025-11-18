// Background Service Worker
console.log('[BACKGROUND] Manga Text Processor: Service worker loaded');

// Listen for keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  console.log(`[BACKGROUND] Command received: ${command}`);

  if (command === 'process-page-images') {
    console.log('[BACKGROUND] Processing page images via keyboard shortcut');

    // Get active tab
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]) {
        try {
          // Get saved settings
          const settings = await chrome.storage.sync.get([
            'serverUrl',
            'fontFamily',
            'ocrModel'
          ]);

          const config = {
            serverUrl: settings.serverUrl || 'http://localhost:1420',
            fontFamily: settings.fontFamily || 'arial',
            ocrModel: settings.ocrModel || 'gemini-2.5-flash',
          };

          // Send message to content script
          chrome.tabs.sendMessage(
            tabs[0].id,
            {
              action: 'process-images',
              config,
            },
            (response) => {
              if (chrome.runtime.lastError) {
                console.error('[BACKGROUND] Error:', chrome.runtime.lastError.message);
              } else {
                console.log('[BACKGROUND] Response:', response);
              }
            }
          );
        } catch (error) {
          console.error('[BACKGROUND] Failed to get settings:', error);
        }
      }
    });
  }
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[BACKGROUND] Message received:', message);

  // Forward processing updates to popup if it's open
  if (message.action === 'processing-update' ||
      message.action === 'processing-complete' ||
      message.action === 'processing-error') {

    // Try to send to popup
    chrome.runtime.sendMessage(message).catch(error => {
      // Popup might be closed, ignore error
      console.log('[BACKGROUND] Could not forward to popup:', error.message);
    });
  }

  return false;
});

// Handle extension installation or update
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[BACKGROUND] Extension installed/updated:', details.reason);

  if (details.reason === 'install') {
    // Set default settings
    chrome.storage.sync.set({
      serverUrl: 'http://localhost:1420',
      fontFamily: 'arial',
      ocrModel: 'gemini-2.5-flash',
    });

    console.log('[BACKGROUND] Default settings initialized');
  }
});

console.log('[BACKGROUND] Service worker ready');
console.log('[BACKGROUND] Keyboard shortcut: Ctrl+Shift+M (Cmd+Shift+M on Mac)');
