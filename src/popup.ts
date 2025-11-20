/**
 * Popup Script - Main UI Controller
 * Handles all popup interactions, settings, and processing coordination
 */

import type { ExtensionSettings, Analytics, ConnectionStatus, Tab } from './types';
import { loadSettings, saveSettings, loadCumulativeStats, resetCumulativeStats, type CumulativeStats } from './utils/storage';
import { createFocusTrap } from './utils/focus-trap';
import { KeyboardManager } from './utils/keyboard';

console.log('[Popup] Initializing...');

// ===== State =====
let serverUrl = 'http://localhost:1420';
let currentAnalytics: Analytics | null = null;
let cumulativeStats: CumulativeStats | null = null;
let checkTimeout: ReturnType<typeof setTimeout> | null = null;

// ===== DOM Elements =====
const el = {
  // Server Config & Status
  connectionStatus: document.getElementById('connectionStatus')!,
  connectionLabel: document.getElementById('connectionLabel')!,
  serverUrl: document.getElementById('serverUrl') as HTMLInputElement,

  // Tabs
  tabSettings: document.getElementById('tab-settings')!,
  tabApiKeys: document.getElementById('tab-apiKeys')!,
  tabStats: document.getElementById('tab-stats')!,

  // Tab Panels
  panelSettings: document.getElementById('panel-settings')!,
  panelApiKeys: document.getElementById('panel-apiKeys')!,
  panelStats: document.getElementById('panel-stats')!,

  // Settings - Custom Dropdown
  modelDropdown: document.getElementById('modelDropdown')!,
  translateModel: document.getElementById('translateModel') as HTMLButtonElement,
  includeFreeText: document.getElementById('includeFreeText') as HTMLInputElement,
  textStroke: document.getElementById('textStroke') as HTMLInputElement,
  blurFreeTextBg: document.getElementById('blurFreeTextBg') as HTMLInputElement,
  bananaMode: document.getElementById('bananaMode') as HTMLInputElement,
  cache: document.getElementById('cache') as HTMLInputElement,
  metricsDetail: document.getElementById('metricsDetail') as HTMLInputElement,
  geminiThinking: document.getElementById('geminiThinking') as HTMLInputElement,
  tighterBounds: document.getElementById('tighterBounds') as HTMLInputElement,
  useMask: document.getElementById('useMask') as HTMLInputElement,
  mergeImg: document.getElementById('mergeImg') as HTMLInputElement,
  batchSize: document.getElementById('batchSize') as HTMLInputElement,
  sessionLimit: document.getElementById('sessionLimit') as HTMLInputElement,

  // Backend Info
  backendInfo: document.getElementById('backendInfo')!,
  backendType: document.getElementById('backendType')!,
  backendAcceleration: document.getElementById('backendAcceleration')!,
  mergeImgField: document.getElementById('mergeImgField')!,
  batchSizeField: document.getElementById('batchSizeField')!,
  sessionLimitField: document.getElementById('sessionLimitField')!,

  // API Keys
  apiKeysList: document.getElementById('apiKeysList')!,
  addApiKey: document.getElementById('addApiKey')!,

  // Stats
  statsContent: document.getElementById('statsContent')!,

  // Toast
  toast: document.getElementById('toast')!,

  // Processing Overlay
  processingOverlay: document.getElementById('processingOverlay')!,
  processingDetail: document.getElementById('processingDetail')!,
  progressFill: document.getElementById('progressFill')!,
};

// Current dropdown value
let currentTranslateModel = 'gemini-flash-latest';

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', async () => {
  await initialize();
  console.log('[Popup] Ready');
});

async function initialize(): Promise<void> {
  // Load settings
  await loadAndApplySettings();

  // Load cumulative statistics
  cumulativeStats = await loadCumulativeStats();
  updateStatisticsPanel();

  // Setup event listeners
  setupEventListeners();

  // Setup keyboard shortcuts
  setupKeyboardShortcuts();

  // Setup accordion
  setupAccordion();

  // Check server connection
  checkConnection();
}

// ===== Settings Management =====
async function loadAndApplySettings(): Promise<void> {
  try {
    const settings = await loadSettings();

    if (settings.serverUrl) {
      serverUrl = settings.serverUrl;
      el.serverUrl.value = serverUrl;
    }

    // Set custom dropdown value
    currentTranslateModel = settings.translateModel;
    setDropdownValue(settings.translateModel);
    el.includeFreeText.checked = settings.includeFreeText;
    el.textStroke.checked = settings.textStroke;
    el.blurFreeTextBg.checked = settings.blurFreeTextBg;
    el.bananaMode.checked = settings.bananaMode;
    el.cache.checked = settings.cache;
    el.metricsDetail.checked = settings.metricsDetail;
    el.geminiThinking.checked = settings.geminiThinking ?? false;
    el.tighterBounds.checked = settings.tighterBounds ?? true;
    el.useMask.checked = settings.useMask ?? true;
    el.mergeImg.checked = settings.mergeImg ?? false;
    el.batchSize.value = String(settings.batchSize ?? 5);
    el.sessionLimit.value = String(settings.sessionLimit ?? 8);

    // Load API keys
    if (settings.apiKeys && settings.apiKeys.length > 0) {
      settings.apiKeys.forEach((key) => addApiKeyInput(key));
    } else {
      addApiKeyInput(''); // Default empty input
    }

    console.log('[Popup] Settings loaded');
  } catch (error) {
    console.error('[Popup] Failed to load settings:', error);
    showToast('⚠️', 'Failed to load settings');
  }
}

async function saveCurrentSettings(): Promise<void> {
  try {
    const apiKeyInputs = el.apiKeysList.querySelectorAll<HTMLInputElement>('.api-key-input');
    const apiKeys = Array.from(apiKeyInputs)
      .map((input) => input.value.trim())
      .filter((key) => key.length > 0);

    const settings: Partial<ExtensionSettings> = {
      serverUrl: el.serverUrl.value,
      apiKeys,
      translateModel: currentTranslateModel,
      includeFreeText: el.includeFreeText.checked,
      textStroke: el.textStroke.checked,
      blurFreeTextBg: el.blurFreeTextBg.checked,
      bananaMode: el.bananaMode.checked,
      cache: el.cache.checked,
      metricsDetail: el.metricsDetail.checked,
      geminiThinking: el.geminiThinking.checked,
      tighterBounds: el.tighterBounds.checked,
      useMask: el.useMask.checked,
      mergeImg: el.mergeImg.checked,
      batchSize: Math.max(1, Math.min(50, parseInt(el.batchSize.value) || 5)),
      sessionLimit: Math.max(1, Math.min(32, parseInt(el.sessionLimit.value) || 8)),
    };

    await saveSettings(settings);
    serverUrl = settings.serverUrl!;
    console.log('[Popup] Settings saved');
  } catch (error) {
    console.error('[Popup] Failed to save settings:', error);
    showToast('✗', 'Failed to save settings');
  }
}

// ===== Server Toggle Sync =====
async function syncServerToggle(toggle: 'mask' | 'mergeimg' | 'thinking', showNotification = true): Promise<void> {
  const endpoint = toggle === 'mask' ? '/mask-toggle' :
                   toggle === 'mergeimg' ? '/mergeimg-toggle' :
                   '/thinking-toggle';
  const toggleName = toggle === 'mask' ? 'Mask mode' :
                     toggle === 'mergeimg' ? 'Batch inference' :
                     'Gemini thinking';

  try {
    const response = await fetch(`${serverUrl}${endpoint}`, {
      method: 'POST',
    });

    if (response.ok) {
      const data = await response.json();
      const enabled = toggle === 'mask' ? data.mask_enabled :
                      toggle === 'mergeimg' ? data.merge_img_enabled :
                      data.gemini_thinking_enabled;
      console.log(`[Popup] ${toggleName} synced: ${enabled}`);
      if (showNotification) {
        showToast('✓', `${toggleName} ${enabled ? 'enabled' : 'disabled'}`);
      }
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    console.error(`[Popup] Failed to sync ${toggleName}:`, error);
    if (showNotification) {
      showToast('⚠️', `Failed to sync ${toggleName} with server`);
    }
  }
}

// ===== Check Server Health and Sync Settings =====
async function checkAndSyncServerSettings(): Promise<void> {
  try {
    // Fetch current server state
    const response = await fetch(`${serverUrl}/health`);
    if (!response.ok) {
      return; // Server not available, skip sync
    }

    const data = await response.json();
    if (!data.config) {
      return; // No config in response
    }

    // Display backend information
    if (data.backend) {
      displayBackendInfo(data.backend);
    }

    // Compare server state with local settings
    const needsSyncMask = data.config.mask_enabled !== el.useMask.checked;
    const needsSyncMergeImg = data.config.merge_img_enabled !== el.mergeImg.checked;
    const needsSyncThinking = data.config.gemini_thinking_enabled !== el.geminiThinking.checked;

    if (needsSyncMask || needsSyncMergeImg || needsSyncThinking) {
      console.log('[Popup] Server state mismatch detected, syncing frontend settings to server');

      // Sync mismatched settings (silently)
      if (needsSyncMask) {
        console.log(`  - Mask: server=${data.config.mask_enabled}, local=${el.useMask.checked} → syncing`);
        await syncServerToggle('mask', false);
      }

      if (needsSyncMergeImg) {
        console.log(`  - MergeImg: server=${data.config.merge_img_enabled}, local=${el.mergeImg.checked} → syncing`);
        await syncServerToggle('mergeimg', false);
      }

      if (needsSyncThinking) {
        console.log(`  - Thinking: server=${data.config.gemini_thinking_enabled}, local=${el.geminiThinking.checked} → syncing`);
        await syncServerToggle('thinking', false);
      }

      console.log('[Popup] ✓ Frontend settings synced to server');
    } else {
      console.log('[Popup] ✓ Server state matches frontend, no sync needed');
    }
  } catch (error) {
    console.error('[Popup] Failed to check/sync server settings:', error);
  }
}

// ===== Backend Display =====
function displayBackendInfo(backend: string): void {
  el.backendType.textContent = backend;
  el.backendInfo.style.display = 'block';

  // Determine acceleration type
  const gpuBackends = ['DirectML', 'DirectML+CPU', 'CUDA', 'TensorRT', 'CoreML'];
  const cpuBackends = ['XNNPACK', 'OpenVINO', 'OpenVINO-CPU'];

  let accelerationText = '';
  let isDirectML = false;

  if (gpuBackends.some(b => backend.includes(b))) {
    accelerationText = '(GPU Accelerated)';
    isDirectML = backend.includes('DirectML');
  } else if (cpuBackends.some(b => backend.includes(b))) {
    accelerationText = '(CPU Accelerated)';
  } else if (backend === 'CPU') {
    accelerationText = '(Slow CPU Backend)';
  }

  el.backendAcceleration.textContent = accelerationText;

  // Disable batch options for DirectML
  if (isDirectML) {
    console.log('[Popup] DirectML detected, disabling batch options');
    el.mergeImg.checked = false;
    el.mergeImg.disabled = true;
    el.mergeImgField.style.opacity = '0.5';
    el.mergeImgField.style.pointerEvents = 'none';

    el.batchSizeField.style.opacity = '0.5';
    el.batchSizeField.style.pointerEvents = 'none';
    el.batchSize.disabled = true;

    el.sessionLimitField.style.opacity = '0.5';
    el.sessionLimitField.style.pointerEvents = 'none';
    el.sessionLimit.disabled = true;
  } else {
    // Re-enable if not DirectML
    el.mergeImg.disabled = false;
    el.mergeImgField.style.opacity = '1';
    el.mergeImgField.style.pointerEvents = 'auto';

    el.batchSizeField.style.opacity = '1';
    el.batchSizeField.style.pointerEvents = 'auto';
    el.batchSize.disabled = false;

    el.sessionLimitField.style.opacity = '1';
    el.sessionLimitField.style.pointerEvents = 'auto';
    el.sessionLimit.disabled = false;
  }
}

// ===== API Key Management =====
function addApiKeyInput(value = ''): void {
  const item = document.createElement('div');
  item.className = 'api-key-item';
  item.setAttribute('role', 'listitem');

  const inputId = `api-key-${Date.now()}`;
  const visibilityId = `visibility-${Date.now()}`;

  item.innerHTML = `
    <div class="api-key-input-wrapper">
      <input
        type="password"
        id="${inputId}"
        class="api-key-input"
        placeholder="AIza..."
        value="${value}"
        aria-label="API Key"
        aria-describedby="${inputId}-help"
      >
      <span id="${inputId}-help" class="sr-only">Enter your Google Gemini API key</span>
      <button
        id="${visibilityId}"
        class="api-key-toggle-visibility"
        type="button"
        aria-label="Toggle API key visibility"
        aria-pressed="false">
        <svg class="icon-eye" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        <svg class="icon-eye-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
      </button>
    </div>
    <button
      class="api-key-remove"
      type="button"
      aria-label="Remove API key">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  `;

  // Get elements
  const input = item.querySelector<HTMLInputElement>('.api-key-input')!;
  const visibilityBtn = item.querySelector<HTMLButtonElement>('.api-key-toggle-visibility')!;
  const removeBtn = item.querySelector<HTMLButtonElement>('.api-key-remove')!;
  const iconEye = visibilityBtn.querySelector<SVGElement>('.icon-eye')!;
  const iconEyeOff = visibilityBtn.querySelector<SVGElement>('.icon-eye-off')!;

  // Toggle visibility
  visibilityBtn.addEventListener('click', () => {
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    iconEye.style.display = isPassword ? 'none' : 'block';
    iconEyeOff.style.display = isPassword ? 'block' : 'none';
    visibilityBtn.setAttribute('aria-pressed', isPassword ? 'true' : 'false');
  });

  // Remove button
  removeBtn.addEventListener('click', () => {
    const currentKeys = el.apiKeysList.querySelectorAll('.api-key-item');
    if (currentKeys.length > 1) {
      item.remove();
      saveCurrentSettings();
    } else {
      showToast('⚠️', 'At least one API key field is required');
    }
  });

  // Save on input
  input.addEventListener('blur', () => {
    saveCurrentSettings();
  });

  el.apiKeysList.appendChild(item);
}

// ===== Connection Management =====
async function checkConnection(): Promise<void> {
  console.log('[Popup] Checking connection...');
  setConnectionStatus('checking');

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${serverUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      setConnectionStatus('connected');
      console.log('[Popup] Connected');
      // Check server state and sync if needed (frontend is source of truth)
      await checkAndSyncServerSettings();
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    console.error('[Popup] Connection failed:', error);
    setConnectionStatus('error');
    showToast('⚠️', 'Server offline or unreachable');
  }
}

function setConnectionStatus(status: ConnectionStatus): void {
  el.connectionStatus.className = `status-dot ${status}`;

  const labels: Record<ConnectionStatus, string> = {
    connected: 'Connected',
    checking: 'Checking...',
    error: 'Offline',
  };

  el.connectionLabel.textContent = labels[status];
  el.connectionStatus.setAttribute(
    'aria-label',
    `Server connection status: ${labels[status]}`
  );
}

function scheduleConnectionCheck(): void {
  if (checkTimeout) {
    clearTimeout(checkTimeout);
  }
  checkTimeout = setTimeout(() => {
    saveCurrentSettings();
    checkConnection();
  }, 1000);
}

// ===== Tab Management =====
function switchTab(tab: Tab): void {
  // Update tab buttons
  const tabs = [el.tabSettings, el.tabApiKeys, el.tabStats];
  const panels = [el.panelSettings, el.panelApiKeys, el.panelStats];

  tabs.forEach((tabEl, index) => {
    const isActive = tabEl.id === `tab-${tab}`;
    tabEl.classList.toggle('active', isActive);
    tabEl.setAttribute('aria-selected', isActive ? 'true' : 'false');
    tabEl.setAttribute('tabindex', isActive ? '0' : '-1');

    panels[index].classList.toggle('active', isActive);
    panels[index].hidden = !isActive;
  });
}

// Processing is triggered via keyboard shortcut (Ctrl+Shift+M)
// handled by background.js and content.js
// Popup only displays processing updates via message listener

// ===== Processing Overlay =====
const processingFocusTrap = createFocusTrap(el.processingOverlay);

function showProcessing(show: boolean, detail = 'Initializing...', progress = 0): void {
  if (show) {
    el.processingOverlay.hidden = false;
    el.processingDetail.textContent = detail;
    el.progressFill.style.width = `${progress}%`;
    el.progressFill.parentElement?.setAttribute('aria-valuenow', progress.toString());
    processingFocusTrap.activate();
  } else {
    el.processingOverlay.hidden = true;
    processingFocusTrap.deactivate();
  }
}

// ===== Statistics =====
function updateStatisticsPanel(): void {
  // Enable stats tab if we have either current session or cumulative data
  if (currentAnalytics || (cumulativeStats && cumulativeStats.totalSessions > 0)) {
    (el.tabStats as HTMLButtonElement).disabled = false;
  }

  // Show empty state if no data
  if (!currentAnalytics && (!cumulativeStats || cumulativeStats.totalSessions === 0)) {
    el.statsContent.innerHTML = `
      <div class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 3v18h18M18 17V9m-5 8V5m-5 12v-3"/>
        </svg>
        <h3 class="empty-title">No Statistics Available</h3>
        <p class="empty-description">
          Process some manga images to see detailed statistics and analytics.
        </p>
      </div>
    `;
    return;
  }

  let html = '';

  // Current Session Stats (if available)
  if (currentAnalytics) {
    html += `
    <div class="settings-group" style="border-left: 3px solid var(--primary);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-sm);">
        <h3 class="settings-group-title">Latest Session</h3>
        <span style="font-size: var(--text-xs); color: var(--primary); font-weight: var(--font-semibold);">RECENT</span>
      </div>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-md);">
        <div class="stat-card">
          <div style="font-size: var(--text-xs); color: var(--text-secondary);">Images</div>
          <div style="font-size: var(--text-2xl); font-weight: var(--font-bold); color: var(--text-primary);">
            ${currentAnalytics.total_images || 0}
          </div>
        </div>
        <div class="stat-card">
          <div style="font-size: var(--text-xs); color: var(--text-secondary);">Regions</div>
          <div style="font-size: var(--text-2xl); font-weight: var(--font-bold); color: var(--text-primary);">
            ${currentAnalytics.total_regions || 0}
          </div>
        </div>
      </div>
      ${createStatRow('Processing Time', formatTime(currentAnalytics.total_time_ms), true)}
      ${(currentAnalytics.input_tokens || currentAnalytics.output_tokens) ?
        createStatRow('Tokens Used', ((currentAnalytics.input_tokens || 0) + (currentAnalytics.output_tokens || 0)).toLocaleString(), true) : ''}
    </div>
    `;
  }

  // Cumulative Stats (if available)
  if (cumulativeStats && cumulativeStats.totalSessions > 0) {
    const avgTimePerSession = cumulativeStats.totalProcessingTimeMs / cumulativeStats.totalSessions;
    const avgImagesPerSession = cumulativeStats.totalImages / cumulativeStats.totalSessions;
    const totalTokens = cumulativeStats.totalInputTokens + cumulativeStats.totalOutputTokens;
    const cacheTotal = cumulativeStats.totalCacheHits + cumulativeStats.totalCacheMisses;
    const hitRate = cacheTotal > 0 ? ((cumulativeStats.totalCacheHits / cacheTotal) * 100).toFixed(1) + '%' : 'N/A';

    html += `
    <div class="settings-group">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-sm);">
        <h3 class="settings-group-title">Lifetime Statistics</h3>
        <button id="resetStats" style="background: transparent; border: 1px solid var(--border-default); padding: 4px 8px; border-radius: var(--radius-sm); font-size: var(--text-xs); color: var(--text-secondary); cursor: pointer; transition: all var(--transition-base);">
          Reset
        </button>
      </div>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-md); margin-bottom: var(--space-md);">
        <div class="stat-card">
          <div style="font-size: var(--text-xs); color: var(--text-secondary);">Total Sessions</div>
          <div style="font-size: var(--text-2xl); font-weight: var(--font-bold); color: var(--text-primary);">
            ${cumulativeStats.totalSessions.toLocaleString()}
          </div>
        </div>
        <div class="stat-card">
          <div style="font-size: var(--text-xs); color: var(--text-secondary);">Total Images</div>
          <div style="font-size: var(--text-2xl); font-weight: var(--font-bold); color: var(--text-primary);">
            ${cumulativeStats.totalImages.toLocaleString()}
          </div>
        </div>
        <div class="stat-card">
          <div style="font-size: var(--text-xs); color: var(--text-secondary);">Total Regions</div>
          <div style="font-size: var(--text-2xl); font-weight: var(--font-bold); color: var(--text-primary);">
            ${cumulativeStats.totalRegions.toLocaleString()}
          </div>
        </div>
        <div class="stat-card">
          <div style="font-size: var(--text-xs); color: var(--text-secondary);">API Calls</div>
          <div style="font-size: var(--text-2xl); font-weight: var(--font-bold); color: var(--text-primary);">
            ${cumulativeStats.totalApiCalls.toLocaleString()}
          </div>
        </div>
      </div>

      <h3 class="settings-group-title" style="margin-top: var(--space-lg); margin-bottom: var(--space-md);">Averages</h3>
      ${createStatRow('Avg. Images/Session', avgImagesPerSession.toFixed(1))}
      ${createStatRow('Avg. Time/Session', formatTime(avgTimePerSession))}
      ${totalTokens > 0 ? createStatRow('Total Tokens', totalTokens.toLocaleString()) : ''}
      ${createStatRow('Cache Hit Rate', hitRate)}

      ${cumulativeStats.firstProcessedAt ? `
      <div style="margin-top: var(--space-md); padding-top: var(--space-md); border-top: 1px solid var(--border-subtle); font-size: var(--text-xs); color: var(--text-tertiary); text-align: center;">
        First used: ${new Date(cumulativeStats.firstProcessedAt).toLocaleDateString()}
      </div>
      ` : ''}
    </div>
    `;
  }

  el.statsContent.innerHTML = html;

  // Attach reset button listener
  const resetBtn = document.getElementById('resetStats');
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      if (confirm('Reset all lifetime statistics? This cannot be undone.')) {
        await resetCumulativeStats();
        cumulativeStats = await loadCumulativeStats();
        updateStatisticsPanel();
        showToast('✓', 'Statistics reset successfully');
      }
    });
  }
}

function createStatRow(label: string, value: string, withMargin = false): string {
  return `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-sm) 0; ${withMargin ? 'margin-top: var(--space-sm);' : ''}">
      <span style="font-size: var(--text-sm); color: var(--text-secondary);">${label}</span>
      <span style="font-size: var(--text-sm); color: var(--text-primary);">${value}</span>
    </div>
  `;
}

function formatTime(ms: number | undefined): string {
  if (!ms) return 'N/A';
  return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(2)}s`;
}

// ===== Toast Notifications =====
let toastTimeout: ReturnType<typeof setTimeout> | null = null;

function showToast(icon: string, message: string, duration = 3000): void {
  const iconEl = el.toast.querySelector('.toast-icon')!;
  const messageEl = el.toast.querySelector('.toast-message')!;

  iconEl.textContent = icon;
  messageEl.textContent = message;

  el.toast.hidden = false;
  el.toast.classList.add('show');

  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  toastTimeout = setTimeout(() => {
    el.toast.classList.remove('show');
    setTimeout(() => {
      el.toast.hidden = true;
    }, 200);
  }, duration);
}

// ===== Event Listeners =====
function setupEventListeners(): void {
  // Server URL
  el.serverUrl.addEventListener('input', scheduleConnectionCheck);
  el.serverUrl.addEventListener('blur', () => {
    saveCurrentSettings();
    checkConnection();
  });

  // Settings
  el.includeFreeText.addEventListener('change', saveCurrentSettings);
  el.textStroke.addEventListener('change', saveCurrentSettings);
  el.blurFreeTextBg.addEventListener('change', saveCurrentSettings);
  el.bananaMode.addEventListener('change', saveCurrentSettings);
  el.cache.addEventListener('change', saveCurrentSettings);
  el.metricsDetail.addEventListener('change', saveCurrentSettings);
  el.geminiThinking.addEventListener('change', saveCurrentSettings);
  el.tighterBounds.addEventListener('change', saveCurrentSettings);
  el.batchSize.addEventListener('change', saveCurrentSettings);
  el.sessionLimit.addEventListener('change', saveCurrentSettings);

  // Server-synced toggles (also update server state)
  el.useMask.addEventListener('change', async () => {
    await saveCurrentSettings();
    await syncServerToggle('mask');
  });
  el.mergeImg.addEventListener('change', async () => {
    await saveCurrentSettings();
    await syncServerToggle('mergeimg');
  });
  el.geminiThinking.addEventListener('change', async () => {
    await saveCurrentSettings();
    await syncServerToggle('thinking');
  });

  // Custom Dropdown
  setupCustomDropdown();

  // Tabs
  el.tabSettings.addEventListener('click', () => switchTab('settings'));
  el.tabApiKeys.addEventListener('click', () => switchTab('apiKeys'));
  el.tabStats.addEventListener('click', () => switchTab('stats'));

  // Tab keyboard navigation
  [el.tabSettings, el.tabApiKeys, el.tabStats].forEach((tab, index) => {
    tab.addEventListener('keydown', (e) => {
      const tabs = ['settings', 'apiKeys', 'stats'] as Tab[];
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const nextIndex = (index + 1) % tabs.length;
        switchTab(tabs[nextIndex]);
        document.getElementById(`tab-${tabs[nextIndex]}`)?.focus();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevIndex = (index - 1 + tabs.length) % tabs.length;
        switchTab(tabs[prevIndex]);
        document.getElementById(`tab-${tabs[prevIndex]}`)?.focus();
      }
    });
  });

  // Add API Key
  el.addApiKey.addEventListener('click', () => {
    addApiKeyInput('');
    // Focus the new input
    const inputs = el.apiKeysList.querySelectorAll<HTMLInputElement>('.api-key-input');
    inputs[inputs.length - 1]?.focus();
  });

  // Setup number input steppers
  setupNumberSteppers();
}

// ===== Number Input Steppers =====
function setupNumberSteppers(): void {
  const stepperButtons = document.querySelectorAll<HTMLButtonElement>('.number-stepper-btn');

  stepperButtons.forEach((button) => {
    const targetId = button.dataset.target;
    if (!targetId) return;

    const input = document.getElementById(targetId) as HTMLInputElement;
    if (!input) return;

    const isIncrement = button.classList.contains('increment');
    const isDecrement = button.classList.contains('decrement');

    // Update button states based on current value
    const updateButtonStates = () => {
      const value = parseInt(input.value) || 0;
      const min = parseInt(input.min) || 0;
      const max = parseInt(input.max) || Infinity;

      const wrapper = input.closest('.number-input-wrapper');
      if (!wrapper) return;

      const decrementBtn = wrapper.querySelector('.number-stepper-btn.decrement') as HTMLButtonElement;
      const incrementBtn = wrapper.querySelector('.number-stepper-btn.increment') as HTMLButtonElement;

      if (decrementBtn) {
        decrementBtn.disabled = value <= min;
      }
      if (incrementBtn) {
        incrementBtn.disabled = value >= max;
      }
    };

    // Button click handler
    button.addEventListener('click', () => {
      const currentValue = parseInt(input.value) || 0;
      const min = parseInt(input.min) || 0;
      const max = parseInt(input.max) || Infinity;
      const step = parseInt(input.step) || 1;

      let newValue = currentValue;

      if (isIncrement && currentValue < max) {
        newValue = Math.min(currentValue + step, max);
      } else if (isDecrement && currentValue > min) {
        newValue = Math.max(currentValue - step, min);
      }

      if (newValue !== currentValue) {
        input.value = String(newValue);
        // Trigger change event to save settings
        input.dispatchEvent(new Event('change', { bubbles: true }));
        updateButtonStates();
      }
    });

    // Update button states on input change
    input.addEventListener('input', updateButtonStates);
    input.addEventListener('change', updateButtonStates);

    // Keyboard support for input (arrow keys, etc.)
    input.addEventListener('keydown', (e) => {
      const min = parseInt(input.min) || 0;
      const max = parseInt(input.max) || Infinity;
      let currentValue = parseInt(input.value) || 0;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentValue < max) {
          input.value = String(Math.min(currentValue + 1, max));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          updateButtonStates();
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentValue > min) {
          input.value = String(Math.max(currentValue - 1, min));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          updateButtonStates();
        }
      }
    });

    // Initialize button states
    updateButtonStates();
  });
}

// ===== Keyboard Shortcuts =====
function setupKeyboardShortcuts(): void {
  const keyboardManager = new KeyboardManager();

  // Escape to close processing overlay (when it's shown)
  keyboardManager.add({
    key: 'Escape',
    handler: () => {
      if (!el.processingOverlay.hidden) {
        // Don't allow closing during processing
        // Just for UX, could be enabled if we add cancel functionality
      }
    },
  });

  keyboardManager.listen();
}

// ===== Accordion Management =====
const ACCORDION_STATE_KEY = 'accordionState';

async function setupAccordion(): Promise<void> {
  const accordionHeaders = document.querySelectorAll<HTMLButtonElement>('.accordion-header');

  // Load saved state
  const savedState = await loadAccordionState();

  accordionHeaders.forEach((header) => {
    const contentId = header.getAttribute('aria-controls');
    if (!contentId) return;

    const content = document.getElementById(contentId);
    if (!content) return;

    // Apply saved state (default: expanded)
    const isExpanded = savedState[contentId] ?? true;
    setAccordionState(header, content, isExpanded);

    // Click handler
    header.addEventListener('click', () => {
      const currentlyExpanded = header.getAttribute('aria-expanded') === 'true';
      const newState = !currentlyExpanded;

      setAccordionState(header, content, newState);

      // Save state
      saveAccordionState(contentId, newState);
    });

    // Keyboard support (Enter/Space already handled by button, add arrow keys for navigation)
    header.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const headers = Array.from(accordionHeaders);
        const currentIndex = headers.indexOf(header);
        const nextIndex = e.key === 'ArrowDown'
          ? (currentIndex + 1) % headers.length
          : (currentIndex - 1 + headers.length) % headers.length;
        (headers[nextIndex] as HTMLButtonElement).focus();
      }
    });
  });
}

function setAccordionState(header: HTMLButtonElement, content: HTMLElement, expanded: boolean): void {
  header.setAttribute('aria-expanded', expanded.toString());
  content.hidden = !expanded;
}

async function loadAccordionState(): Promise<Record<string, boolean>> {
  try {
    const result = await chrome.storage.local.get(ACCORDION_STATE_KEY);
    return result[ACCORDION_STATE_KEY] || {};
  } catch (error) {
    console.error('[Accordion] Failed to load state:', error);
    return {};
  }
}

async function saveAccordionState(contentId: string, expanded: boolean): Promise<void> {
  try {
    const currentState = await loadAccordionState();
    currentState[contentId] = expanded;
    await chrome.storage.local.set({ [ACCORDION_STATE_KEY]: currentState });
  } catch (error) {
    console.error('[Accordion] Failed to save state:', error);
  }
}

// ===== Message Listener =====
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  console.log('[Popup] Message:', msg);

  if (msg.action === 'processing-update') {
    showProcessing(true, msg.details, msg.progress);
  } else if (msg.action === 'processing-complete') {
    showProcessing(false);
    if (msg.analytics) {
      currentAnalytics = msg.analytics;
      // Reload cumulative stats after processing
      loadCumulativeStats().then((stats) => {
        cumulativeStats = stats;
        updateStatisticsPanel();
      });
    }
  } else if (msg.action === 'processing-error') {
    showProcessing(false);
    showToast('✗', msg.error);
  }

  sendResponse({ status: 'ok' });
  return false;
});

// ===== Custom Dropdown =====
function setupCustomDropdown(): void {
  const trigger = el.translateModel;
  const dropdown = el.modelDropdown;
  const items = dropdown.querySelectorAll<HTMLLIElement>('.dropdown-item');

  // Toggle dropdown on trigger click
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = dropdown.classList.contains('open');

    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  });

  // Handle item selection
  items.forEach((item) => {
    item.addEventListener('click', () => {
      const value = item.dataset.value;
      if (value) {
        selectDropdownItem(value);
        closeDropdown();
        saveCurrentSettings();
      }
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target as Node)) {
      closeDropdown();
    }
  });

  // Keyboard navigation
  trigger.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (dropdown.classList.contains('open')) {
        closeDropdown();
      } else {
        openDropdown();
      }
    } else if (e.key === 'Escape') {
      closeDropdown();
    } else if (e.key === 'ArrowDown' && dropdown.classList.contains('open')) {
      e.preventDefault();
      const currentIndex = getCurrentItemIndex();
      const nextIndex = Math.min(currentIndex + 1, items.length - 1);
      selectDropdownItem(items[nextIndex].dataset.value!);
    } else if (e.key === 'ArrowUp' && dropdown.classList.contains('open')) {
      e.preventDefault();
      const currentIndex = getCurrentItemIndex();
      const prevIndex = Math.max(currentIndex - 1, 0);
      selectDropdownItem(items[prevIndex].dataset.value!);
    }
  });

  function getCurrentItemIndex(): number {
    const itemsArray = Array.from(items);
    return itemsArray.findIndex(item => item.classList.contains('selected'));
  }
}

function openDropdown(): void {
  el.modelDropdown.classList.add('open');
  el.translateModel.setAttribute('aria-expanded', 'true');
}

function closeDropdown(): void {
  el.modelDropdown.classList.remove('open');
  el.translateModel.setAttribute('aria-expanded', 'false');
}

function selectDropdownItem(value: string): void {
  const dropdown = el.modelDropdown;
  const items = dropdown.querySelectorAll<HTMLLIElement>('.dropdown-item');
  const selectedText = dropdown.querySelector('.dropdown-selected')!;

  items.forEach((item) => {
    const isSelected = item.dataset.value === value;
    item.classList.toggle('selected', isSelected);
    item.setAttribute('aria-selected', isSelected ? 'true' : 'false');

    if (isSelected) {
      const text = item.querySelector('.dropdown-item-text')?.textContent || '';
      selectedText.textContent = text;
      currentTranslateModel = value;
    }
  });
}

function setDropdownValue(value: string): void {
  selectDropdownItem(value);
}

console.log('[Popup] Script loaded');
