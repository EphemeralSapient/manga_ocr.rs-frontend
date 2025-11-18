/**
 * Content Script - Process images on web pages
 * Injects into all pages to handle manga image processing
 */

import type { ProcessConfig, ServerResult, Message } from './types';

console.log('[CONTENT] Manga Text Processor: Content script loaded');

// State
let isProcessing = false;
const processedImages = new Map<HTMLImageElement, string>();

/**
 * Listen for messages from popup or background
 */
chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  console.log('[CONTENT] Message received:', message);

  if (message.action === 'process-images' && message.config) {
    processPageImages(message.config)
      .then((result) => {
        sendResponse({ success: true, result });
      })
      .catch((error) => {
        console.error('[CONTENT] Processing error:', error);
        sendResponse({ success: false, error: error.message });
      });

    return true; // Async response
  }

  if (message.action === 'restore-images') {
    restoreOriginalImages();
    sendResponse({ success: true });
  }

  return false;
});

/**
 * Process all manga images on the page
 */
async function processPageImages(config: ProcessConfig) {
  if (isProcessing) {
    throw new Error('Processing already in progress');
  }

  console.log('[CONTENT] Starting page image processing...');
  console.log('[CONTENT] Config:', config);

  isProcessing = true;

  try {
    // Find all images on the page
    const allImages = Array.from(document.querySelectorAll<HTMLImageElement>('img'));
    console.log(`[CONTENT] Found ${allImages.length} total images`);

    // Filter for large images (likely manga/comic images)
    const largeImages = allImages.filter((img) => {
      const rect = img.getBoundingClientRect();
      const isVisible = rect.width > 200 && rect.height > 200 && img.offsetParent !== null;
      return isVisible && img.naturalWidth > 200 && img.naturalHeight > 200;
    });

    console.log(`[CONTENT] Filtered to ${largeImages.length} large images`);

    if (largeImages.length === 0) {
      showNotification('No manga images found on page', 'info');
      return { processed: 0 };
    }

    showNotification(`Processing ${largeImages.length} image(s)...`, 'info');
    sendProgressUpdate(0, `Converting ${largeImages.length} images...`);

    // Convert images to blobs in parallel
    const imageBlobs: Blob[] = [];
    const imageMappings: Array<{ img: HTMLImageElement; originalSrc: string }> = [];

    // Parallelize image conversion
    const conversionPromises = largeImages.map((img, index) =>
      imageToBlob(img)
        .then((blob) => {
          console.log(`[CONTENT] Converted image ${index + 1}/${largeImages.length}`);
          return { blob, img, index };
        })
        .catch((error) => {
          console.error(`[CONTENT] Failed to convert image ${index + 1}:`, error);
          return null;
        })
    );

    const results = await Promise.all(conversionPromises);

    results.forEach((result) => {
      if (result) {
        imageBlobs.push(result.blob);
        imageMappings.push({ img: result.img, originalSrc: result.img.src });
      }
    });

    const progress = Math.round((results.length / largeImages.length) * 30);
    sendProgressUpdate(progress, `Converted ${imageBlobs.length}/${largeImages.length} images...`);

    console.log(`[CONTENT] Converted ${imageBlobs.length} images to blobs`);

    if (imageBlobs.length === 0) {
      throw new Error('Failed to convert any images');
    }

    // Send to server
    sendProgressUpdate(40, 'Sending to server...');

    const formData = new FormData();
    imageBlobs.forEach((blob, index) => {
      formData.append('images', blob, `image_${index}.png`);
    });

    // Add config
    const serverConfig = {
      api_keys: config.apiKeys,
      translate_model: config.translateModel,
      include_free_text: config.includeFreeText,
      banana_mode: config.bananaMode,
      text_stroke: config.textStroke,
      blur_free_text_bg: config.blurFreeTextBg,
      cache: config.cache,
      metrics_detail: config.metricsDetail,
    };
    formData.append('config', JSON.stringify(serverConfig));

    const response = await fetch(`${config.serverUrl}/process`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    sendProgressUpdate(70, 'Processing on server...');

    const result: ServerResult = await response.json();
    console.log('[CONTENT] Server response:', result);

    sendProgressUpdate(90, 'Applying results...');

    // Apply processed images to page
    let appliedCount = 0;

    if (result.results && result.results.length > 0) {
      result.results.forEach((pageResult, index) => {
        if (pageResult.success && pageResult.data_url && imageMappings[index]) {
          const { img, originalSrc } = imageMappings[index];

          // Store original
          processedImages.set(img, originalSrc);

          // Replace with processed image
          img.src = pageResult.data_url;
          img.dataset.processed = 'true';

          appliedCount++;
          console.log(`[CONTENT] Applied processed image ${index + 1}`);
        }
      });
    }

    sendProgressUpdate(100, 'Complete!');

    // Show completion notification
    const duration = result.analytics?.total_time_ms
      ? `in ${(result.analytics.total_time_ms / 1000).toFixed(1)}s`
      : '';
    showNotification(`✓ Processed ${appliedCount} image(s) ${duration}`, 'success');

    // Send completion message with analytics
    sendCompletionMessage(result.analytics);

    console.log(
      `[CONTENT] Processing complete: ${appliedCount}/${imageBlobs.length} images applied`
    );

    return {
      processed: appliedCount,
      analytics: result.analytics,
    };
  } finally {
    isProcessing = false;
  }
}

/**
 * Convert img element to blob
 */
async function imageToBlob(img: HTMLImageElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;

      // Handle CORS
      const crossOriginImg = new Image();
      crossOriginImg.crossOrigin = 'anonymous';

      crossOriginImg.onload = () => {
        try {
          ctx.drawImage(crossOriginImg, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          }, 'image/png');
        } catch (error) {
          // CORS fallback
          console.warn('[CONTENT] CORS failed, trying original image...');
          try {
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to create blob'));
              }
            }, 'image/png');
          } catch (fallbackError) {
            reject(new Error(`Canvas error: ${(fallbackError as Error).message}`));
          }
        }
      };

      crossOriginImg.onerror = () => {
        // Fallback to original image
        console.warn('[CONTENT] Image load failed, using original...');
        try {
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          }, 'image/png');
        } catch (error) {
          reject(new Error(`Canvas error: ${(error as Error).message}`));
        }
      };

      crossOriginImg.src = img.src;
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Restore original images
 */
function restoreOriginalImages(): void {
  console.log('[CONTENT] Restoring original images...');

  let restoredCount = 0;

  processedImages.forEach((originalSrc, img) => {
    if (img && img.parentElement) {
      img.src = originalSrc;
      delete img.dataset.processed;
      restoredCount++;
    }
  });

  processedImages.clear();

  console.log(`[CONTENT] Restored ${restoredCount} images`);
  showNotification(`Restored ${restoredCount} image(s)`, 'info');
}

/**
 * Send progress update to popup
 */
function sendProgressUpdate(progress: number, details: string): void {
  chrome.runtime
    .sendMessage({
      action: 'processing-update',
      progress,
      details,
    })
    .catch((error) => {
      console.log('[CONTENT] Failed to send progress update:', error.message);
    });
}

/**
 * Send completion message to popup
 */
function sendCompletionMessage(analytics: unknown): void {
  chrome.runtime
    .sendMessage({
      action: 'processing-complete',
      analytics,
    })
    .catch((error) => {
      console.log('[CONTENT] Failed to send completion message:', error.message);
    });
}

/**
 * Show notification to user
 */
function showNotification(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info'): void {
  console.log(`[CONTENT] Notification: ${message}`);

  // Create notification element
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.setAttribute('role', 'status');
  notification.setAttribute('aria-live', 'polite');

  const colors = {
    info: '#3b82f6',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
  };

  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${colors[type]};
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    z-index: 999999;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    animation: slideInFromRight 0.3s ease-out;
    max-width: 400px;
  `;

  // Add animation
  if (!document.getElementById('manga-processor-styles')) {
    const style = document.createElement('style');
    style.id = 'manga-processor-styles';
    style.textContent = `
      @keyframes slideInFromRight {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        @keyframes slideInFromRight {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  // Auto-remove after 4 seconds
  setTimeout(() => {
    notification.style.animation = 'slideInFromRight 0.3s ease-out reverse';
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

console.log('[CONTENT] Content script ready');
