// Content Script - Process images on web pages
console.log('[CONTENT] Manga Text Processor: Content script loaded');

// State
let isProcessing = false;
let processedImages = new Map(); // Track processed images: img element -> original src

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[CONTENT] Message received:', message);

  if (message.action === 'process-images') {
    processPageImages(message.config)
      .then(result => {
        sendResponse({ success: true, result });
      })
      .catch(error => {
        console.error('[CONTENT] Processing error:', error);
        sendResponse({ success: false, error: error.message });
      });

    // Return true to indicate async response
    return true;
  }

  if (message.action === 'restore-images') {
    restoreOriginalImages();
    sendResponse({ success: true });
  }

  return false;
});

// Process all images on the page
async function processPageImages(config) {
  if (isProcessing) {
    throw new Error('Processing already in progress');
  }

  console.log('[CONTENT] Starting page image processing...');
  console.log('[CONTENT] Config:', config);

  isProcessing = true;

  try {
    // Find all images on the page
    const allImages = document.querySelectorAll('img');
    console.log(`[CONTENT] Found ${allImages.length} total images`);

    // Filter for large images (likely manga/comic images)
    const largeImages = Array.from(allImages).filter(img => {
      const rect = img.getBoundingClientRect();
      const isVisible = rect.width > 200 && rect.height > 200 && img.offsetParent !== null;
      return isVisible && img.naturalWidth > 200 && img.naturalHeight > 200;
    });

    console.log(`[CONTENT] Filtered to ${largeImages.length} large images`);

    if (largeImages.length === 0) {
      showNotification('No manga images found on page', 'info');
      return { processed: 0 };
    }

    // Show notification
    showNotification(`Processing ${largeImages.length} image(s)...`, 'info');

    // Send progress update
    sendProgressUpdate(0, `Converting ${largeImages.length} images...`);

    // Convert images to blobs
    const imageBlobs = [];
    const imageMappings = []; // Track which blob belongs to which img element

    for (let i = 0; i < largeImages.length; i++) {
      const img = largeImages[i];
      console.log(`[CONTENT] Converting image ${i + 1}/${largeImages.length}...`);

      try {
        const blob = await imageToBlob(img);
        imageBlobs.push(blob);
        imageMappings.push({ img, originalSrc: img.src });

        // Update progress
        const progress = Math.round(((i + 1) / largeImages.length) * 30); // 0-30%
        sendProgressUpdate(progress, `Converted ${i + 1}/${largeImages.length} images...`);
      } catch (error) {
        console.error(`[CONTENT] Failed to convert image ${i + 1}:`, error);
      }
    }

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
      font_family: config.fontFamily || 'arial',
      ocr_translation_model: config.ocrModel || 'gemini-2.5-flash',
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

    const result = await response.json();
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

    console.log(`[CONTENT] Processing complete: ${appliedCount}/${imageBlobs.length} images applied`);

    return {
      processed: appliedCount,
      analytics: result.analytics,
    };

  } finally {
    isProcessing = false;
  }
}

// Convert img element to blob
async function imageToBlob(img) {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;

      // Handle CORS
      const crossOriginImg = new Image();
      crossOriginImg.crossOrigin = 'anonymous';

      crossOriginImg.onload = () => {
        try {
          ctx.drawImage(crossOriginImg, 0, 0);
          canvas.toBlob(blob => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          }, 'image/png');
        } catch (error) {
          // If CORS fails, try with original image
          console.warn('[CONTENT] CORS failed, trying original image...');
          try {
            ctx.drawImage(img, 0, 0);
            canvas.toBlob(blob => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to create blob'));
              }
            }, 'image/png');
          } catch (fallbackError) {
            reject(new Error(`Canvas error: ${fallbackError.message}`));
          }
        }
      };

      crossOriginImg.onerror = () => {
        // Fallback to original image
        console.warn('[CONTENT] Image load failed, using original...');
        try {
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(blob => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          }, 'image/png');
        } catch (error) {
          reject(new Error(`Canvas error: ${error.message}`));
        }
      };

      crossOriginImg.src = img.src;

    } catch (error) {
      reject(error);
    }
  });
}

// Restore original images
function restoreOriginalImages() {
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

// Send progress update to popup
function sendProgressUpdate(progress, details) {
  chrome.runtime.sendMessage({
    action: 'processing-update',
    progress,
    details,
  }).catch(error => {
    // Popup might be closed, ignore error
    console.log('[CONTENT] Failed to send progress update:', error.message);
  });
}

// Send completion message to popup
function sendCompletionMessage(analytics) {
  chrome.runtime.sendMessage({
    action: 'processing-complete',
    analytics,
  }).catch(error => {
    console.log('[CONTENT] Failed to send completion message:', error.message);
  });
}

// Show notification to user
function showNotification(message, type = 'info') {
  console.log(`[CONTENT] Notification: ${message}`);

  // Create notification element
  const notification = document.createElement('div');
  notification.textContent = message;

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
    background: ${colors[type] || colors.info};
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
