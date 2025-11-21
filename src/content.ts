/**
 * Content Script - Process images on web pages
 * Injects into all pages to handle manga image processing
 */

import type { ProcessConfig, ServerResult, Message } from './types';

console.log('[CONTENT] Manga Text Processor: Content script loaded');

// Inline statistics storage (avoids module splitting issues)
async function addSessionStats(sessionAnalytics: {
  total_images?: number;
  total_regions?: number;
  simple_bg_count?: number;
  complex_bg_count?: number;
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
    const STATS_KEY = 'cumulativeStats';
    const result = await chrome.storage.local.get(STATS_KEY);
    const current = result[STATS_KEY] || {
      totalSessions: 0,
      totalImages: 0,
      totalRegions: 0,
      totalSimpleBg: 0,
      totalComplexBg: 0,
      totalApiCalls: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCacheHits: 0,
      totalCacheMisses: 0,
      totalProcessingTimeMs: 0,
    };

    const updated = {
      totalSessions: current.totalSessions + 1,
      totalImages: current.totalImages + (sessionAnalytics.total_images || 0),
      totalRegions: current.totalRegions + (sessionAnalytics.total_regions || 0),
      totalSimpleBg: current.totalSimpleBg + (sessionAnalytics.simple_bg_count || 0),
      totalComplexBg: current.totalComplexBg + (sessionAnalytics.complex_bg_count || 0),
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
  } catch (error) {
    console.error('[CONTENT] Failed to save cumulative stats:', error);
  }
}

// State
let isProcessing = false;
let isInSelectionMode = false;
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

  if (message.action === 'enter-selection-mode' && message.config) {
    enterSelectionMode(message.config);
    sendResponse({ success: true });
    return false;
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
    showNotification('Task in progress', 'warning', 'Please wait for the current operation to complete before starting a new one.');
    throw new Error('Processing already in progress');
  }

  console.log('[CONTENT] Starting page image processing...');
  console.log('[CONTENT] Config:', config);

  // Check if API keys are configured
  if (!config.apiKeys || config.apiKeys.length === 0) {
    showNotification('API keys required', 'error', 'Open extension settings and add your Gemini API keys to enable translation.');
    throw new Error('No API keys configured');
  }

  // Check server connection
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const healthResponse = await fetch(`${config.serverUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!healthResponse.ok) {
      showNotification('Server unavailable', 'error', 'The server returned an error. Verify the server is running correctly.');
      throw new Error('Server health check failed');
    }
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      showNotification('Connection timeout', 'error', 'Could not reach the server within 5 seconds. Check if the server is running and Local Network Access permission is granted.');
    } else if ((error as Error).message !== 'Server health check failed') {
      showNotification('Connection failed', 'error', `Unable to connect to ${config.serverUrl}. Verify the URL, server status, and Chrome Local Network Access permission.`);
    }
    throw error;
  }

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
      showNotification('No images detected', 'info', 'No images larger than 200×200px found. Try scrolling to load more content.');
      return { processed: 0 };
    }

    const dismissProcessing = showNotification(
      `Processing ${largeImages.length} image${largeImages.length > 1 ? 's' : ''}...`,
      'info',
      undefined,
      true
    );
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

    // Add config (using correct field names that match backend serde renames)
    const serverConfig = {
      apiKeys: config.apiKeys,
      ocr_translation_model: config.translateModel,  // Fixed: backend expects ocr_translation_model
      includeFreeText: config.includeFreeText,
      bananaMode: config.bananaMode,
      textStroke: config.textStroke,
      blurFreeTextBg: config.blurFreeTextBg,
      cache: config.cache,
      metricsDetail: config.metricsDetail,
      useMask: config.useMask,
      mergeImg: config.mergeImg,
      sessionLimit: config.sessionLimit,  // Max ONNX sessions per model
    };
    formData.append('config', JSON.stringify(serverConfig));

    // Add timeout for processing endpoint (90 seconds for OCR/translation)
    const processController = new AbortController();
    const processTimeoutId = setTimeout(() => processController.abort(), 90000);

    const response = await fetch(`${config.serverUrl}/process`, {
      method: 'POST',
      body: formData,
      signal: processController.signal,
    });

    clearTimeout(processTimeoutId);

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

    // Dismiss processing notification
    dismissProcessing();

    // Show completion notification
    const analytics = result.analytics;
    let detailText: string | undefined;

    if (config.metricsDetail && analytics) {
      // Detailed metrics - comprehensive view
      const lines: string[] = [];

      // Time breakdown
      const totalSecs = analytics.total_time_ms ? (analytics.total_time_ms / 1000).toFixed(1) : '0';
      const phase1 = analytics.phase1_time_ms ? (analytics.phase1_time_ms / 1000).toFixed(1) : null;
      const phase2 = analytics.phase2_time_ms ? (analytics.phase2_time_ms / 1000).toFixed(1) : null;

      let timeLine = `${totalSecs}s total`;
      if (phase1 && phase2) {
        timeLine += ` (detect: ${phase1}s, translate: ${phase2}s)`;
      }
      lines.push(timeLine);

      // Regions and background info
      const regions = analytics.total_regions || 0;
      const simple = analytics.simple_bg_count || 0;
      const complex = analytics.complex_bg_count || 0;
      if (regions > 0) {
        let regionLine = `${regions} region${regions !== 1 ? 's' : ''}`;
        if (simple || complex) {
          regionLine += ` · ${simple} simple, ${complex} complex bg`;
        }
        lines.push(regionLine);
      }

      // API and cache info
      const apiCalls = (analytics.api_calls_simple || 0) + (analytics.api_calls_complex || 0);
      const hits = analytics.cache_hits || 0;
      const misses = analytics.cache_misses || 0;
      const cacheTotal = hits + misses;

      if (apiCalls > 0 || cacheTotal > 0) {
        let apiLine = '';
        if (apiCalls > 0) {
          apiLine += `${apiCalls} API call${apiCalls !== 1 ? 's' : ''}`;
        }
        if (cacheTotal > 0) {
          const hitRate = ((hits / cacheTotal) * 100).toFixed(0);
          apiLine += apiLine ? ` · ${hitRate}% cache hit` : `${hitRate}% cache hit`;
        }
        if (apiLine) lines.push(apiLine);
      }

      // Token usage
      const totalTokens = (analytics.input_tokens || 0) + (analytics.output_tokens || 0);
      if (totalTokens > 0) {
        lines.push(`${totalTokens.toLocaleString()} tokens used`);
      }

      detailText = lines.join('\n');
    } else if (analytics) {
      // Simple info
      const durationSecs = analytics.total_time_ms
        ? (analytics.total_time_ms / 1000).toFixed(1)
        : null;
      detailText = durationSecs ? `Completed in ${durationSecs}s` : undefined;
    }

    showNotification(
      `${appliedCount} image${appliedCount !== 1 ? 's' : ''} processed`,
      'success',
      detailText,
      false,
      config.metricsDetail
    );

    // Send completion message with analytics
    sendCompletionMessage(result.analytics);

    // Save statistics
    if (result.analytics) {
      await addSessionStats(result.analytics);
    }

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
 * Convert img element to blob using background script (bypasses CORS)
 */
async function imageToBlob(img: HTMLImageElement): Promise<Blob> {
  const imageUrl = img.src;

  // Handle data URLs directly
  if (imageUrl.startsWith('data:')) {
    return dataUrlToBlob(imageUrl);
  }

  // Handle blob URLs directly
  if (imageUrl.startsWith('blob:')) {
    const response = await fetch(imageUrl);
    return response.blob();
  }

  // Use background script to fetch (bypasses CORS)
  const response = await chrome.runtime.sendMessage({
    action: 'fetch-image',
    url: imageUrl,
  });

  if (!response.success) {
    throw new Error(`Background fetch failed: ${response.error}`);
  }

  // Convert base64 data URL to blob
  const blob = dataUrlToBlob(response.base64);

  // If already PNG, return directly
  if (blob.type === 'image/png') {
    return blob;
  }

  // Convert to PNG via canvas using blob URL (won't taint canvas)
  return await convertBlobToPng(blob, img.naturalWidth || img.width, img.naturalHeight || img.height);
}

/**
 * Convert a blob to PNG format using canvas
 */
async function convertBlobToPng(blob: Blob, width: number, height: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const blobUrl = URL.createObjectURL(blob);
    const tempImg = new Image();

    tempImg.onload = () => {
      URL.revokeObjectURL(blobUrl);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      canvas.width = width || tempImg.naturalWidth;
      canvas.height = height || tempImg.naturalHeight;

      ctx.drawImage(tempImg, 0, 0);

      canvas.toBlob((pngBlob) => {
        if (pngBlob) {
          resolve(pngBlob);
        } else {
          // Return original blob if PNG conversion fails
          resolve(blob);
        }
      }, 'image/png');
    };

    tempImg.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      // Return original blob if image load fails
      resolve(blob);
    };

    tempImg.src = blobUrl;
  });
}

/**
 * Convert data URL to blob
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const bstr = atob(parts[1]);
  const n = bstr.length;
  const u8arr = new Uint8Array(n);

  for (let i = 0; i < n; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }

  return new Blob([u8arr], { type: mime });
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
 * Returns a function to dismiss the notification (for persistent notifications)
 */
function showNotification(
  message: string,
  type: 'info' | 'success' | 'error' | 'warning' = 'info',
  details?: string,
  persistent: boolean = false,
  expandedByDefault: boolean = false
): () => void {
  console.log(`[CONTENT] Notification: ${message}`);

  // Icons for different types
  const icons = {
    info: '',
    success: '✓',
    error: '✕',
    warning: '!',
  };

  // For persistent info (processing), use animated dot
  const isProcessing = type === 'info' && persistent;

  // Create notification element
  const notification = document.createElement('div');
  notification.setAttribute('role', 'status');
  notification.setAttribute('aria-live', 'polite');

  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(30, 30, 30, 0.55);
    backdrop-filter: blur(50px) saturate(150%);
    -webkit-backdrop-filter: blur(50px) saturate(150%);
    color: rgba(255, 255, 255, 0.95);
    padding: 12px 16px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 400;
    z-index: 999999;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.08);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    animation: mangaNotifSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    max-width: 340px;
    cursor: ${details ? 'pointer' : 'default'};
    user-select: none;
  `;

  // Build notification content
  const contentWrapper = document.createElement('div');
  contentWrapper.style.cssText = 'display: flex; align-items: flex-start; gap: 10px;';

  // Icon
  const iconEl = document.createElement('span');

  if (isProcessing) {
    // Animated green dot for processing
    iconEl.style.cssText = `
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 5px;
      animation: mangaPulse 1.5s ease-in-out infinite;
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
    `;
  } else {
    iconEl.textContent = icons[type];
    iconEl.style.cssText = `
      font-size: 14px;
      font-weight: 600;
      opacity: 0.8;
      flex-shrink: 0;
      margin-top: 1px;
      color: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : 'rgba(255, 255, 255, 0.8)'};
    `;
  }

  // Text container
  const textContainer = document.createElement('div');
  textContainer.style.cssText = 'flex: 1; min-width: 0;';

  // Main message
  const messageEl = document.createElement('div');
  messageEl.textContent = message;
  messageEl.style.cssText = `
    font-weight: 500;
    line-height: 1.4;
    color: rgba(255, 255, 255, 0.95);
  `;
  textContainer.appendChild(messageEl);

  // Details (expandable)
  if (details) {
    const detailsEl = document.createElement('div');
    detailsEl.innerText = details;
    detailsEl.style.cssText = `
      font-size: 11px;
      color: rgba(255, 255, 255, 0.6);
      margin-top: 6px;
      line-height: 1.5;
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease, margin-top 0.2s ease;
      white-space: pre-wrap;
    `;

    const expandHint = document.createElement('div');
    expandHint.textContent = 'Click for details';
    expandHint.style.cssText = `
      font-size: 10px;
      color: rgba(255, 255, 255, 0.4);
      margin-top: 4px;
      transition: opacity 0.2s ease;
    `;

    textContainer.appendChild(detailsEl);
    textContainer.appendChild(expandHint);

    // Toggle details on click
    let expanded = expandedByDefault;

    // Apply initial state if expanded by default
    if (expanded) {
      detailsEl.style.maxHeight = '200px';
      detailsEl.style.marginTop = '8px';
      expandHint.style.opacity = '0';
    }

    notification.addEventListener('click', () => {
      expanded = !expanded;
      if (expanded) {
        detailsEl.style.maxHeight = '200px';
        detailsEl.style.marginTop = '8px';
        expandHint.style.opacity = '0';
      } else {
        detailsEl.style.maxHeight = '0';
        detailsEl.style.marginTop = '0';
        expandHint.style.opacity = '1';
      }
    });
  }

  contentWrapper.appendChild(iconEl);
  contentWrapper.appendChild(textContainer);

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '×';
  closeBtn.style.cssText = `
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.4);
    font-size: 18px;
    font-weight: 300;
    cursor: pointer;
    padding: 0 0 0 8px;
    margin: -2px -4px -2px 0;
    line-height: 1;
    transition: color 0.15s ease;
    flex-shrink: 0;
  `;
  closeBtn.onmouseenter = () => { closeBtn.style.color = 'rgba(255, 255, 255, 0.8)'; };
  closeBtn.onmouseleave = () => { closeBtn.style.color = 'rgba(255, 255, 255, 0.4)'; };

  contentWrapper.appendChild(closeBtn);
  notification.appendChild(contentWrapper);

  // Add animation styles
  if (!document.getElementById('manga-processor-styles')) {
    const style = document.createElement('style');
    style.id = 'manga-processor-styles';
    style.textContent = `
      @keyframes mangaNotifSlideIn {
        from {
          transform: translateX(400px) scale(0.9);
          opacity: 0;
        }
        to {
          transform: translateX(0) scale(1);
          opacity: 1;
        }
      }
      @keyframes mangaNotifSlideOut {
        from {
          transform: translateX(0) scale(1);
          opacity: 1;
        }
        to {
          transform: translateX(400px) scale(0.9);
          opacity: 0;
        }
      }
      @keyframes mangaPulse {
        0%, 100% {
          opacity: 1;
          transform: scale(1);
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
        }
        50% {
          opacity: 0.6;
          transform: scale(0.85);
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.8);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        @keyframes mangaNotifSlideIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes mangaNotifSlideOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  // Dismiss function
  const dismiss = () => {
    notification.style.animation = 'mangaNotifSlideOut 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
    setTimeout(() => notification.remove(), 300);
  };

  // Close button click
  closeBtn.onclick = (e) => {
    e.stopPropagation();
    dismiss();
  };

  // Auto-remove with hover pause (unless persistent)
  if (!persistent) {
    const duration = details ? 6000 : 4000;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let remainingTime = duration;
    let startTime = Date.now();

    const startTimer = () => {
      startTime = Date.now();
      timeoutId = setTimeout(dismiss, remainingTime);
    };

    const pauseTimer = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
        remainingTime -= Date.now() - startTime;
      }
    };

    notification.addEventListener('mouseenter', pauseTimer);
    notification.addEventListener('mouseleave', startTimer);

    // Start initial timer
    startTimer();
  }

  return dismiss;
}

/**
 * Enter single-image selection mode
 */
function enterSelectionMode(config: ProcessConfig): void {
  if (isInSelectionMode) {
    console.log('[CONTENT] Already in selection mode');
    return;
  }

  if (isProcessing) {
    showNotification('Task in progress', 'warning', 'Please wait for the current operation to complete.');
    return;
  }

  console.log('[CONTENT] Entering selection mode...');
  isInSelectionMode = true;

  // Create overlay with instructions
  const overlay = document.createElement('div');
  overlay.id = 'manga-selection-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    z-index: 999998;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: crosshair;
    animation: mangaFadeIn 0.2s ease-out;
  `;

  const instructions = document.createElement('div');
  instructions.style.cssText = `
    background: rgba(30, 30, 30, 0.95);
    color: rgba(255, 255, 255, 0.95);
    padding: 24px 32px;
    border-radius: 16px;
    font-size: 16px;
    font-weight: 500;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    pointer-events: none;
    max-width: 400px;
  `;
  instructions.innerHTML = `
    <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">Click on an image to translate</div>
    <div style="font-size: 13px; color: rgba(255, 255, 255, 0.6);">Press ESC to cancel</div>
  `;

  overlay.appendChild(instructions);

  // Add fade-in animation
  if (!document.getElementById('manga-selection-styles')) {
    const style = document.createElement('style');
    style.id = 'manga-selection-styles';
    style.textContent = `
      @keyframes mangaFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes mangaFadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      .manga-image-highlight {
        outline: 3px solid #10b981 !important;
        outline-offset: 2px;
        box-shadow: 0 0 20px rgba(16, 185, 129, 0.5) !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
      }
      .manga-image-highlight:hover {
        outline-width: 4px !important;
        outline-offset: 3px;
        box-shadow: 0 0 30px rgba(16, 185, 129, 0.7) !important;
        transform: scale(1.02) !important;
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(overlay);

  // Find all images
  const allImages = Array.from(document.querySelectorAll<HTMLImageElement>('img'));
  const largeImages = allImages.filter((img) => {
    const rect = img.getBoundingClientRect();
    return rect.width > 200 && rect.height > 200 && img.offsetParent !== null &&
           img.naturalWidth > 200 && img.naturalHeight > 200;
  });

  console.log(`[CONTENT] Found ${largeImages.length} selectable images`);

  // Highlight images on hover
  const imageHoverHandler = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (largeImages.includes(target as HTMLImageElement)) {
      (target as HTMLImageElement).classList.add('manga-image-highlight');
    }
  };

  const imageLeaveHandler = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (largeImages.includes(target as HTMLImageElement)) {
      (target as HTMLImageElement).classList.remove('manga-image-highlight');
    }
  };

  // Click handler for images
  const imageClickHandler = async (e: MouseEvent) => {
    const target = e.target as HTMLElement;

    if (largeImages.includes(target as HTMLImageElement)) {
      e.preventDefault();
      e.stopPropagation();

      const selectedImage = target as HTMLImageElement;
      console.log('[CONTENT] Image selected:', selectedImage.src);

      // Exit selection mode
      exitSelectionMode();

      // Process single image
      await processSingleImage(selectedImage, config);
    }
  };

  // ESC key handler
  const escHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      console.log('[CONTENT] Selection mode cancelled');
      exitSelectionMode();
    }
  };

  // Overlay click handler (cancel on overlay click, but not on instructions)
  const overlayClickHandler = (e: MouseEvent) => {
    if (e.target === overlay) {
      exitSelectionMode();
    }
  };

  // Exit selection mode function
  function exitSelectionMode() {
    if (!isInSelectionMode) return;

    isInSelectionMode = false;

    // Remove event listeners
    document.removeEventListener('mouseover', imageHoverHandler, true);
    document.removeEventListener('mouseout', imageLeaveHandler, true);
    document.removeEventListener('click', imageClickHandler, true);
    document.removeEventListener('keydown', escHandler, true);
    overlay.removeEventListener('click', overlayClickHandler);

    // Remove highlights
    largeImages.forEach(img => img.classList.remove('manga-image-highlight'));

    // Fade out and remove overlay
    overlay.style.animation = 'mangaFadeOut 0.2s ease-out';
    setTimeout(() => overlay.remove(), 200);
  }

  // Attach event listeners
  document.addEventListener('mouseover', imageHoverHandler, true);
  document.addEventListener('mouseout', imageLeaveHandler, true);
  document.addEventListener('click', imageClickHandler, true);
  document.addEventListener('keydown', escHandler, true);
  overlay.addEventListener('click', overlayClickHandler);
}

/**
 * Process a single selected image
 */
async function processSingleImage(img: HTMLImageElement, config: ProcessConfig): Promise<void> {
  if (isProcessing) {
    showNotification('Task in progress', 'warning', 'Please wait for the current operation to complete.');
    return;
  }

  console.log('[CONTENT] Processing single image...');

  // Check if API keys are configured
  if (!config.apiKeys || config.apiKeys.length === 0) {
    showNotification('API keys required', 'error', 'Open extension settings and add your Gemini API keys to enable translation.');
    return;
  }

  // Check server connection
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const healthResponse = await fetch(`${config.serverUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!healthResponse.ok) {
      showNotification('Server unavailable', 'error', 'The server returned an error. Verify the server is running correctly.');
      return;
    }
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      showNotification('Connection timeout', 'error', 'Could not reach the server within 5 seconds. Check if the server is running and Local Network Access permission is granted.');
    } else {
      showNotification('Connection failed', 'error', `Unable to connect to ${config.serverUrl}. Verify the URL, server status, and Chrome Local Network Access permission.`);
    }
    return;
  }

  isProcessing = true;

  try {
    const dismissProcessing = showNotification('Processing image...', 'info', undefined, true);
    sendProgressUpdate(0, 'Converting image...');

    // Convert image to blob
    const blob = await imageToBlob(img);
    const originalSrc = img.src;

    sendProgressUpdate(30, 'Converted image...');
    console.log('[CONTENT] Converted single image to blob');

    // Send to server
    sendProgressUpdate(40, 'Sending to server...');

    const formData = new FormData();
    formData.append('images', blob, 'image_0.png');

    // Add config
    const serverConfig = {
      apiKeys: config.apiKeys,
      ocr_translation_model: config.translateModel,
      includeFreeText: config.includeFreeText,
      bananaMode: config.bananaMode,
      textStroke: config.textStroke,
      blurFreeTextBg: config.blurFreeTextBg,
      cache: config.cache,
      metricsDetail: config.metricsDetail,
      useMask: config.useMask,
      mergeImg: config.mergeImg,
      sessionLimit: config.sessionLimit,
    };
    formData.append('config', JSON.stringify(serverConfig));

    // Add timeout for processing endpoint (90 seconds for OCR/translation)
    const processController = new AbortController();
    const processTimeoutId = setTimeout(() => processController.abort(), 90000);

    const response = await fetch(`${config.serverUrl}/process`, {
      method: 'POST',
      body: formData,
      signal: processController.signal,
    });

    clearTimeout(processTimeoutId);

    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    sendProgressUpdate(70, 'Processing on server...');

    const result: ServerResult = await response.json();
    console.log('[CONTENT] Server response:', result);

    sendProgressUpdate(90, 'Applying result...');

    // Apply processed image
    if (result.results && result.results[0]?.success && result.results[0].data_url) {
      // Store original
      processedImages.set(img, originalSrc);

      // Replace with processed image
      img.src = result.results[0].data_url;
      img.dataset.processed = 'true';

      console.log('[CONTENT] Applied processed image');
    }

    sendProgressUpdate(100, 'Complete!');

    // Dismiss processing notification
    dismissProcessing();

    // Show completion notification
    const analytics = result.analytics;
    let detailText: string | undefined;

    if (config.metricsDetail && analytics) {
      const lines: string[] = [];

      const totalSecs = analytics.total_time_ms ? (analytics.total_time_ms / 1000).toFixed(1) : '0';
      const phase1 = analytics.phase1_time_ms ? (analytics.phase1_time_ms / 1000).toFixed(1) : null;
      const phase2 = analytics.phase2_time_ms ? (analytics.phase2_time_ms / 1000).toFixed(1) : null;

      let timeLine = `${totalSecs}s total`;
      if (phase1 && phase2) {
        timeLine += ` (detect: ${phase1}s, translate: ${phase2}s)`;
      }
      lines.push(timeLine);

      const regions = analytics.total_regions || 0;
      if (regions > 0) {
        lines.push(`${regions} region${regions !== 1 ? 's' : ''} translated`);
      }

      detailText = lines.join('\n');
    } else if (analytics) {
      const durationSecs = analytics.total_time_ms
        ? (analytics.total_time_ms / 1000).toFixed(1)
        : null;
      detailText = durationSecs ? `Completed in ${durationSecs}s` : undefined;
    }

    showNotification(
      'Image processed successfully',
      'success',
      detailText,
      false,
      config.metricsDetail
    );

    // Send completion message with analytics
    sendCompletionMessage(result.analytics);

    // Save statistics
    if (result.analytics) {
      await addSessionStats(result.analytics);
    }

    console.log('[CONTENT] Single image processing complete');
  } catch (error) {
    console.error('[CONTENT] Single image processing error:', error);
    showNotification('Processing failed', 'error', (error as Error).message);
  } finally {
    isProcessing = false;
  }
}

console.log('[CONTENT] Content script ready');
