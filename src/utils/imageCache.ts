/**
 * Image Cache Utility
 * Caches processed images to avoid redundant processing
 */

export interface CachedImage {
  hash: string;
  dataUrl: string;
  timestamp: number;
  config: string; // Stringified config hash to invalidate when settings change
}

const CACHE_KEY_PREFIX = 'imageCache_';
const CACHE_INDEX_KEY = 'imageCacheIndex';
const MAX_CACHE_SIZE = 500; // Maximum number of cached images
const CACHE_EXPIRY_DAYS = 7; // Cache expiry in days

/**
 * Generate a hash from image blob using SHA-256
 */
export async function hashImageBlob(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Generate a hash from processing config to detect config changes
 */
export function hashConfig(config: Record<string, unknown>): string {
  // Only hash relevant processing parameters that affect output
  const relevantConfig = {
    translateModel: config.translateModel,
    targetLanguage: config.targetLanguage,
    fontSource: config.fontSource,
    fontFamily: config.fontFamily,
    googleFontFamily: config.googleFontFamily,
    includeFreeText: config.includeFreeText,
    bananaMode: config.bananaMode,
    textStroke: config.textStroke,
    backgroundType: config.backgroundType,
    tighterBounds: config.tighterBounds,
    filterOrphanRegions: config.filterOrphanRegions,
    maskMode: config.maskMode,
    mergeImg: config.mergeImg,
  };

  return JSON.stringify(relevantConfig);
}

/**
 * Get cached image if available and not expired
 */
export async function getCachedImage(
  imageHash: string,
  configHash: string
): Promise<string | null> {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${imageHash}`;
    const result = await chrome.storage.local.get(cacheKey);
    const cached: CachedImage | undefined = result[cacheKey];

    if (!cached) {
      return null;
    }

    // Check if config matches
    if (cached.config !== configHash) {
      console.log(`[CACHE] Config mismatch for ${imageHash.substring(0, 8)}..., invalidating`);
      await chrome.storage.local.remove(cacheKey);
      await removeFromIndex(imageHash);
      return null;
    }

    // Check if expired
    const age = Date.now() - cached.timestamp;
    const maxAge = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    if (age > maxAge) {
      console.log(`[CACHE] Expired entry for ${imageHash.substring(0, 8)}..., invalidating`);
      await chrome.storage.local.remove(cacheKey);
      await removeFromIndex(imageHash);
      return null;
    }

    console.log(`[CACHE] Hit for ${imageHash.substring(0, 8)}...`);
    return cached.dataUrl;
  } catch (error) {
    console.error('[CACHE] Error getting cached image:', error);
    return null;
  }
}

/**
 * Store processed image in cache
 */
export async function setCachedImage(
  imageHash: string,
  dataUrl: string,
  configHash: string
): Promise<void> {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${imageHash}`;
    const cached: CachedImage = {
      hash: imageHash,
      dataUrl,
      timestamp: Date.now(),
      config: configHash,
    };

    // Store the cached image
    await chrome.storage.local.set({ [cacheKey]: cached });

    // Update the index
    await addToIndex(imageHash);

    // Enforce cache size limit
    await enforceMaxCacheSize();

    console.log(`[CACHE] Stored ${imageHash.substring(0, 8)}...`);
  } catch (error) {
    console.error('[CACHE] Error setting cached image:', error);
    // If quota exceeded, clear old entries
    if ((error as Error).message?.includes('QUOTA')) {
      console.warn('[CACHE] Quota exceeded, clearing old cache entries');
      await clearOldestCacheEntries(50);
    }
  }
}

/**
 * Get cache index (list of all cached image hashes)
 */
async function getCacheIndex(): Promise<string[]> {
  const result = await chrome.storage.local.get(CACHE_INDEX_KEY);
  return result[CACHE_INDEX_KEY] || [];
}

/**
 * Add hash to cache index
 */
async function addToIndex(hash: string): Promise<void> {
  const index = await getCacheIndex();
  if (!index.includes(hash)) {
    index.push(hash);
    await chrome.storage.local.set({ [CACHE_INDEX_KEY]: index });
  }
}

/**
 * Remove hash from cache index
 */
async function removeFromIndex(hash: string): Promise<void> {
  const index = await getCacheIndex();
  const newIndex = index.filter((h) => h !== hash);
  await chrome.storage.local.set({ [CACHE_INDEX_KEY]: newIndex });
}

/**
 * Enforce maximum cache size by removing oldest entries
 */
async function enforceMaxCacheSize(): Promise<void> {
  const index = await getCacheIndex();

  if (index.length > MAX_CACHE_SIZE) {
    const toRemove = index.length - MAX_CACHE_SIZE;
    await clearOldestCacheEntries(toRemove);
  }
}

/**
 * Clear oldest cache entries
 */
async function clearOldestCacheEntries(count: number): Promise<void> {
  const index = await getCacheIndex();

  // Get all cached images with timestamps
  const cacheKeys = index.map((hash) => `${CACHE_KEY_PREFIX}${hash}`);
  const result = await chrome.storage.local.get(cacheKeys);

  const entries: Array<{ hash: string; timestamp: number }> = [];

  Object.entries(result).forEach(([, value]) => {
    const cached = value as CachedImage;
    entries.push({ hash: cached.hash, timestamp: cached.timestamp });
  });

  // Sort by timestamp (oldest first)
  entries.sort((a, b) => a.timestamp - b.timestamp);

  // Remove oldest entries
  const toRemove = entries.slice(0, count);
  const keysToRemove = toRemove.map((entry) => `${CACHE_KEY_PREFIX}${entry.hash}`);

  await chrome.storage.local.remove(keysToRemove);

  // Update index
  const hashesToRemove = toRemove.map((entry) => entry.hash);
  const newIndex = index.filter((hash) => !hashesToRemove.includes(hash));
  await chrome.storage.local.set({ [CACHE_INDEX_KEY]: newIndex });

  console.log(`[CACHE] Cleared ${toRemove.length} old entries`);
}

/**
 * Clear all cached images
 */
export async function clearAllCache(): Promise<void> {
  const index = await getCacheIndex();
  const cacheKeys = index.map((hash) => `${CACHE_KEY_PREFIX}${hash}`);

  await chrome.storage.local.remove([...cacheKeys, CACHE_INDEX_KEY]);

  console.log(`[CACHE] Cleared all ${index.length} cached images`);
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  count: number;
  oldestTimestamp: number | null;
  newestTimestamp: number | null;
}> {
  const index = await getCacheIndex();
  const cacheKeys = index.map((hash) => `${CACHE_KEY_PREFIX}${hash}`);
  const result = await chrome.storage.local.get(cacheKeys);

  const timestamps = Object.values(result).map((cached) => (cached as CachedImage).timestamp);

  return {
    count: index.length,
    oldestTimestamp: timestamps.length > 0 ? Math.min(...timestamps) : null,
    newestTimestamp: timestamps.length > 0 ? Math.max(...timestamps) : null,
  };
}
