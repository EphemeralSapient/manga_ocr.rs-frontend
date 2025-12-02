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

  // Settings - Model Buttons
  flashBtn: document.getElementById('flashBtn') as HTMLButtonElement,
  liteBtn: document.getElementById('liteBtn') as HTMLButtonElement,
  proBtn: document.getElementById('proBtn') as HTMLButtonElement,
  languageInput: document.getElementById('targetLanguage') as HTMLInputElement,
  languageClear: document.getElementById('languageClear') as HTMLButtonElement,
  languageToggle: document.getElementById('languageToggle') as HTMLButtonElement,
  languageSuggestions: document.getElementById('languageSuggestions') as HTMLUListElement,
  builtinChip: document.getElementById('builtinChip') as HTMLButtonElement,
  googleChip: document.getElementById('googleChip') as HTMLButtonElement,
  builtinFontField: document.getElementById('builtinFontField')!,
  googleFontField: document.getElementById('googleFontField')!,
  fontDropdown: document.getElementById('fontDropdown')!,
  fontFamily: document.getElementById('fontFamily') as HTMLButtonElement,
  googleFontInput: document.getElementById('googleFontFamily') as HTMLInputElement,
  googleFontClear: document.getElementById('googleFontClear') as HTMLButtonElement,
  googleFontToggle: document.getElementById('googleFontToggle') as HTMLButtonElement,
  googleFontSuggestions: document.getElementById('googleFontSuggestions') as HTMLUListElement,
  fontPreviewText: document.getElementById('fontPreviewText') as HTMLDivElement,
  builtinFontPreviewText: document.getElementById('builtinFontPreviewText') as HTMLDivElement,
  fontStatus: document.getElementById('fontStatus') as HTMLDivElement,
  fontStatusIcon: document.getElementById('fontStatusIcon') as HTMLSpanElement,
  fontStatusText: document.getElementById('fontStatusText') as HTMLSpanElement,
  includeFreeText: document.getElementById('includeFreeText') as HTMLInputElement,
  bananaMode: document.getElementById('bananaMode') as HTMLInputElement,
  bananaField: document.getElementById('bananaField')!,
  blurBgBtn: document.getElementById('blurBgBtn') as HTMLButtonElement,
  whiteBgBtn: document.getElementById('whiteBgBtn') as HTMLButtonElement,
  backgroundTypeField: document.getElementById('backgroundTypeField')!,
  textStroke: document.getElementById('textStroke') as HTMLInputElement,
  cache: document.getElementById('cache') as HTMLInputElement,
  metricsDetail: document.getElementById('metricsDetail') as HTMLInputElement,
  geminiThinking: document.getElementById('geminiThinking') as HTMLButtonElement,
  tighterBounds: document.getElementById('tighterBounds') as HTMLInputElement,
  filterOrphanRegions: document.getElementById('filterOrphanRegions') as HTMLInputElement,
  mergeImg: document.getElementById('mergeImg') as HTMLInputElement,
  batchSize: document.getElementById('batchSize') as HTMLInputElement,
  sessionLimit: document.getElementById('sessionLimit') as HTMLInputElement,
  targetSize: document.getElementById('targetSize') as HTMLButtonElement,
  targetSizeDropdown: document.getElementById('targetSizeDropdown')!,
  l1Debug: document.getElementById('l1Debug') as HTMLInputElement,

  // Local OCR Options
  localOcr: document.getElementById('localOcr') as HTMLInputElement,
  cerebrasOptions: document.getElementById('cerebrasOptions')!,
  useCerebras: document.getElementById('useCerebras') as HTMLInputElement,
  cerebrasApiKey: document.getElementById('cerebrasApiKey') as HTMLInputElement,
  toggleCerebrasKey: document.getElementById('toggleCerebrasKey') as HTMLButtonElement,
  cerebrasKeySection: document.getElementById('cerebrasKeySection')!,
  geminiKeysSection: document.getElementById('geminiKeysSection')!,

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

  // Action Buttons
  processAllBtn: document.getElementById('processAllBtn') as HTMLButtonElement,
  selectImageBtn: document.getElementById('selectImageBtn') as HTMLButtonElement,
};

// Current dropdown values
let currentTranslateModel = 'gemini-flash-latest';
let currentTargetLanguage = 'English';
let currentFontSource = 'builtin';
let currentFontFamily = 'arial';
let currentGoogleFontFamily = 'Roboto';
let currentBackgroundType = 'blur';
let currentTargetSize = 640;

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

    // Set model selection
    currentTranslateModel = settings.translateModel;
    updateModelSelection(currentTranslateModel);

    currentTargetLanguage = settings.targetLanguage || 'English';
    el.languageInput.value = currentTargetLanguage;

    currentFontSource = settings.fontSource || 'builtin';
    updateChipSelection(currentFontSource);

    currentFontFamily = settings.fontFamily || 'arial';
    setDropdownValue(el.fontDropdown, currentFontFamily, (value) => { currentFontFamily = value; });

    currentGoogleFontFamily = settings.googleFontFamily || 'Roboto';
    el.googleFontInput.value = currentGoogleFontFamily;

    updateFontFieldVisibility();

    // Load and preview the saved Google Font
    if (currentFontSource === 'google') {
      loadGoogleFontPreview(currentGoogleFontFamily);
    }

    currentBackgroundType = settings.backgroundType || 'blur';
    updateBackgroundTypeSelection(currentBackgroundType);

    el.includeFreeText.checked = settings.includeFreeText;
    el.textStroke.checked = settings.textStroke;
    el.bananaMode.checked = settings.bananaMode;

    updateFreeTextFieldsVisibility();
    el.cache.checked = settings.cache;
    el.metricsDetail.checked = settings.metricsDetail;
    el.geminiThinking.setAttribute('aria-pressed', String(settings.geminiThinking ?? true));
    el.tighterBounds.checked = settings.tighterBounds ?? true;
    el.filterOrphanRegions.checked = settings.filterOrphanRegions ?? false;

    el.mergeImg.checked = settings.mergeImg ?? false;
    el.batchSize.value = String(settings.batchSize ?? 5);
    el.sessionLimit.value = String(settings.sessionLimit ?? 8);

    currentTargetSize = settings.targetSize ?? 640;
    setDropdownValue(el.targetSizeDropdown, String(currentTargetSize), (value) => { currentTargetSize = parseInt(value); });

    // Load debug options
    el.l1Debug.checked = settings.l1Debug ?? false;

    // Load OCR options
    el.localOcr.checked = settings.localOcr ?? false;
    el.useCerebras.checked = settings.useCerebras ?? false;
    el.cerebrasApiKey.value = settings.cerebrasApiKey ?? '';

    // Update OCR conditional visibility (no animation on load)
    updateOcrOptionsVisibility(false);

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
      targetLanguage: currentTargetLanguage,
      fontSource: currentFontSource,
      fontFamily: currentFontFamily,
      googleFontFamily: currentGoogleFontFamily,
      includeFreeText: el.includeFreeText.checked,
      textStroke: el.textStroke.checked,
      backgroundType: currentBackgroundType,
      bananaMode: el.bananaMode.checked,
      cache: el.cache.checked,
      metricsDetail: el.metricsDetail.checked,
      geminiThinking: el.geminiThinking.getAttribute('aria-pressed') === 'true',
      tighterBounds: el.tighterBounds.checked,
      filterOrphanRegions: el.filterOrphanRegions.checked,
      useMask: true,  // Always enabled (UI removed)
      maskMode: 'fast',  // Always 'fast' (UI removed)
      mergeImg: el.mergeImg.checked,
      batchSize: Math.max(1, Math.min(50, parseInt(el.batchSize.value) || 5)),
      sessionLimit: Math.max(1, Math.min(32, parseInt(el.sessionLimit.value) || 8)),
      targetSize: currentTargetSize,
      l1Debug: el.l1Debug.checked,
      localOcr: el.localOcr.checked,
      useCerebras: el.useCerebras.checked,
      cerebrasApiKey: el.cerebrasApiKey.value.trim(),
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
async function syncServerToggle(toggle: 'mergeimg' | 'thinking', showNotification = true): Promise<void> {
  const endpoint = toggle === 'mergeimg' ? '/mergeimg-toggle' : '/thinking-toggle';
  const toggleName = toggle === 'mergeimg' ? 'Batch inference' : 'Gemini thinking';

  try {
    const response = await fetch(`${serverUrl}${endpoint}`, {
      method: 'POST',
    });

    if (response.ok) {
      const data = await response.json();
      const enabled = toggle === 'mergeimg' ? data.merge_img_enabled : data.gemini_thinking_enabled;
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
    const localThinkingEnabled = el.geminiThinking.getAttribute('aria-pressed') === 'true';
    const needsSyncMergeImg = data.config.merge_img_enabled !== el.mergeImg.checked;
    const needsSyncThinking = data.config.gemini_thinking_enabled !== localThinkingEnabled;

    if (needsSyncMergeImg || needsSyncThinking) {
      console.log('[Popup] Server state mismatch detected, syncing frontend settings to server');

      // Sync mismatched settings (silently)
      if (needsSyncMergeImg) {
        console.log(`  - MergeImg: server=${data.config.merge_img_enabled}, local=${el.mergeImg.checked} → syncing`);
        await syncServerToggle('mergeimg', false);
      }

      if (needsSyncThinking) {
        console.log(`  - Thinking: server=${data.config.gemini_thinking_enabled}, local=${localThinkingEnabled} → syncing`);
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
    if ((error as Error).name === 'AbortError') {
      showToast('⚠️', 'Connection timeout - Check server and Local Network Access permission');
    } else {
      showToast('⚠️', 'Server offline or unreachable - Check Local Network Access permission');
    }
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
    const hasLabelCounts = currentAnalytics.label_0_count || currentAnalytics.label_1_count || currentAnalytics.label_2_count;

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
      ${hasLabelCounts ? `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-sm); margin-top: var(--space-md);">
        <div style="padding: var(--space-xs); text-align: center; background: var(--bg-secondary); border-radius: var(--radius-sm);">
          <div style="font-size: var(--text-xs); color: var(--text-secondary);">Bubbles (L0)</div>
          <div style="font-size: var(--text-lg); font-weight: var(--font-semibold); color: var(--text-primary);">
            ${currentAnalytics.label_0_count || 0}
          </div>
        </div>
        <div style="padding: var(--space-xs); text-align: center; background: var(--bg-secondary); border-radius: var(--radius-sm);">
          <div style="font-size: var(--text-xs); color: var(--text-secondary);">Inner (L1)</div>
          <div style="font-size: var(--text-lg); font-weight: var(--font-semibold); color: var(--text-primary);">
            ${currentAnalytics.label_1_count || 0}
          </div>
        </div>
        <div style="padding: var(--space-xs); text-align: center; background: var(--bg-secondary); border-radius: var(--radius-sm);">
          <div style="font-size: var(--text-xs); color: var(--text-secondary);">Free (L2)</div>
          <div style="font-size: var(--text-lg); font-weight: var(--font-semibold); color: var(--text-primary);">
            ${currentAnalytics.label_2_count || 0}
          </div>
        </div>
      </div>
      ` : ''}
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
    const hasLabelCounts = cumulativeStats.totalLabel0 || cumulativeStats.totalLabel1 || cumulativeStats.totalLabel2;

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

      ${hasLabelCounts ? `
      <h3 class="settings-group-title" style="margin-bottom: var(--space-sm);">Label Breakdown</h3>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-sm); margin-bottom: var(--space-md);">
        <div style="padding: var(--space-xs); text-align: center; background: var(--bg-secondary); border-radius: var(--radius-sm);">
          <div style="font-size: var(--text-xs); color: var(--text-secondary);">Bubbles (L0)</div>
          <div style="font-size: var(--text-lg); font-weight: var(--font-semibold); color: var(--text-primary);">
            ${(cumulativeStats.totalLabel0 || 0).toLocaleString()}
          </div>
        </div>
        <div style="padding: var(--space-xs); text-align: center; background: var(--bg-secondary); border-radius: var(--radius-sm);">
          <div style="font-size: var(--text-xs); color: var(--text-secondary);">Inner (L1)</div>
          <div style="font-size: var(--text-lg); font-weight: var(--font-semibold); color: var(--text-primary);">
            ${(cumulativeStats.totalLabel1 || 0).toLocaleString()}
          </div>
        </div>
        <div style="padding: var(--space-xs); text-align: center; background: var(--bg-secondary); border-radius: var(--radius-sm);">
          <div style="font-size: var(--text-xs); color: var(--text-secondary);">Free (L2)</div>
          <div style="font-size: var(--text-lg); font-weight: var(--font-semibold); color: var(--text-primary);">
            ${(cumulativeStats.totalLabel2 || 0).toLocaleString()}
          </div>
        </div>
      </div>
      ` : ''}


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

// ===== OCR Options Visibility =====
function updateOcrOptionsVisibility(animateToApiTab = false): void {
  const localOcrEnabled = el.localOcr.checked;
  const useCerebrasEnabled = el.useCerebras.checked;

  // Show Cerebras options only when local OCR is enabled
  el.cerebrasOptions.hidden = !localOcrEnabled;

  // Update API Keys tab sections
  const cerebrasActive = localOcrEnabled && useCerebrasEnabled;

  // Show/hide Cerebras key section and dim Gemini section
  el.cerebrasKeySection.hidden = !cerebrasActive;
  el.geminiKeysSection.classList.toggle('dimmed', cerebrasActive);

  // Animate to API Keys tab when Cerebras is toggled on
  if (animateToApiTab && cerebrasActive) {
    setTimeout(() => {
      switchTab('apiKeys');
      el.tabApiKeys.classList.add('highlight');
      setTimeout(() => el.tabApiKeys.classList.remove('highlight'), 600);
      setTimeout(() => el.cerebrasApiKey.focus(), 300);
    }, 150);
  }
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
  el.includeFreeText.addEventListener('change', () => {
    updateFreeTextFieldsVisibility();
    saveCurrentSettings();
  });
  el.textStroke.addEventListener('change', saveCurrentSettings);
  el.bananaMode.addEventListener('change', () => {
    updateFreeTextFieldsVisibility();
    saveCurrentSettings();
  });
  el.cache.addEventListener('change', saveCurrentSettings);
  el.metricsDetail.addEventListener('change', saveCurrentSettings);
  el.tighterBounds.addEventListener('change', saveCurrentSettings);
  el.batchSize.addEventListener('change', saveCurrentSettings);
  el.sessionLimit.addEventListener('change', saveCurrentSettings);
  el.l1Debug.addEventListener('change', saveCurrentSettings);

  // OCR toggles with conditional visibility
  el.localOcr.addEventListener('change', () => {
    updateOcrOptionsVisibility(false);
    saveCurrentSettings();
  });
  el.useCerebras.addEventListener('change', () => {
    // Animate to API tab when enabling Cerebras
    const shouldAnimate = el.useCerebras.checked;
    updateOcrOptionsVisibility(shouldAnimate);
    saveCurrentSettings();
  });
  el.cerebrasApiKey.addEventListener('change', saveCurrentSettings);
  el.cerebrasApiKey.addEventListener('input', saveCurrentSettings);

  // Toggle Cerebras API key visibility
  el.toggleCerebrasKey.addEventListener('click', () => {
    const isPassword = el.cerebrasApiKey.type === 'password';
    el.cerebrasApiKey.type = isPassword ? 'text' : 'password';
  });

  // Server-synced toggles (also update server state)
  el.mergeImg.addEventListener('change', async () => {
    await saveCurrentSettings();
    await syncServerToggle('mergeimg');
  });

  // Think button toggle
  el.geminiThinking.addEventListener('click', async () => {
    const isPressed = el.geminiThinking.getAttribute('aria-pressed') === 'true';
    el.geminiThinking.setAttribute('aria-pressed', String(!isPressed));
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

  // Action Buttons
  el.processAllBtn.addEventListener('click', () => triggerAction('process-page-images'));
  el.selectImageBtn.addEventListener('click', () => triggerAction('select-single-image'));
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
    setActionButtonsLoading(false);
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
    setActionButtonsLoading(false);
    showToast('✗', msg.error);
  }

  sendResponse({ status: 'ok' });
  return false;
});

// ===== Action Button Trigger =====
async function triggerAction(command: 'process-page-images' | 'select-single-image'): Promise<void> {
  console.log(`[Popup] Triggering action: ${command}`);

  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id) {
      showToast('⚠️', 'No active tab found');
      return;
    }

    // Check if we're on a restricted page
    const restrictedPrefixes = ['chrome://', 'chrome-extension://', 'edge://', 'about:'];
    if (tab.url && restrictedPrefixes.some(prefix => tab.url!.startsWith(prefix))) {
      showToast('⚠️', 'Cannot run on this page');
      return;
    }

    // Set loading state
    setActionButtonsLoading(true);

    // Ensure content script is injected
    await ensureContentScriptInjected(tab.id);

    // Get current settings
    const settings = await loadSettings();

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
      geminiThinking: settings.geminiThinking || false,
      tighterBounds: settings.tighterBounds !== undefined ? settings.tighterBounds : true,
      filterOrphanRegions: settings.filterOrphanRegions || false,
      maskMode: settings.maskMode || 'fast',
      mergeImg: settings.mergeImg || false,
      batchSize: settings.batchSize || 5,
      sessionLimit: settings.sessionLimit || 8,
      targetSize: settings.targetSize || 640,
      l1Debug: settings.l1Debug || false,
      // OCR and Cerebras settings
      localOcr: settings.localOcr || false,
      useCerebras: settings.useCerebras || false,
      cerebrasApiKey: usingCerebras ? (settings.cerebrasApiKey || '') : '',
    };

    // Send message to content script
    const action = command === 'select-single-image' ? 'enter-selection-mode' : 'process-images';

    // Close popup for selection mode (user needs to interact with page)
    if (command === 'select-single-image') {
      await sendMessageWithTimeout(tab.id, { action, config }, 3000);
      window.close();
      return;
    }

    // For process-all, send message with timeout for initial response
    // The content script will respond immediately and send progress updates separately
    const response = await sendMessageWithTimeout<{ success: boolean; error?: string }>(
      tab.id,
      { action, config },
      10000 // 10 second timeout for initial response
    );
    console.log('[Popup] Response:', response);

    if (!response?.success) {
      setActionButtonsLoading(false);
      showToast('⚠️', response?.error || 'Processing failed');
    }
    // Note: Loading state stays on - will be cleared by processing-complete message
  } catch (error) {
    console.error('[Popup] Action failed:', error);
    setActionButtonsLoading(false);
    showToast('✗', (error as Error).message || 'Action failed');
  }
}

/**
 * Send message to tab with timeout to prevent hanging
 */
function sendMessageWithTimeout<T>(
  tabId: number,
  message: unknown,
  timeoutMs: number = 5000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Message timeout - content script not responding'));
    }, timeoutMs);

    chrome.tabs.sendMessage(tabId, message)
      .then((response) => {
        clearTimeout(timeoutId);
        resolve(response as T);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * Ensure content script is injected into the tab
 * This handles pages that were open before the extension was installed/reloaded
 */
async function ensureContentScriptInjected(tabId: number): Promise<void> {
  console.log('[Popup] Checking if content script is loaded...');

  try {
    // Try to ping the content script with a short timeout
    await sendMessageWithTimeout(tabId, { action: 'ping' }, 1000);
    console.log('[Popup] Content script already loaded');
    return;
  } catch (error) {
    console.log('[Popup] Ping failed, will inject script:', (error as Error).message);
  }

  // Content script not loaded, inject it
  console.log('[Popup] Injecting content script...');
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['scripts/content.js'],
    });
    // Wait for script to initialize
    await new Promise(resolve => setTimeout(resolve, 200));

    // Verify injection worked
    try {
      await sendMessageWithTimeout(tabId, { action: 'ping' }, 2000);
      console.log('[Popup] Content script injected and verified');
    } catch {
      throw new Error('Script injected but not responding');
    }
  } catch (injectError) {
    console.error('[Popup] Failed to inject content script:', injectError);
    const errorMsg = (injectError as Error).message;

    // Check if the error is related to file:// access
    if (errorMsg.includes('file://') || errorMsg.includes('File access')) {
      throw new Error('To use this extension on local files, enable "Allow access to file URLs" in chrome://extensions/');
    }

    throw new Error('Cannot access this page. Try refreshing.');
  }
}

function setActionButtonsLoading(loading: boolean): void {
  if (loading) {
    el.processAllBtn.classList.add('loading');
    el.selectImageBtn.classList.add('loading');
    el.processAllBtn.disabled = true;
    el.selectImageBtn.disabled = true;
  } else {
    el.processAllBtn.classList.remove('loading');
    el.selectImageBtn.classList.remove('loading');
    el.processAllBtn.disabled = false;
    el.selectImageBtn.disabled = false;
  }
}

// ===== Custom Dropdown =====
function setupCustomDropdown(): void {
  // Setup model buttons
  setupModelButtons();

  // Setup language combobox
  setupCombobox();

  // Setup font source chips
  setupFontSourceChips();

  // Setup background type buttons
  setupBackgroundTypeButtons();

  // Setup built-in font dropdown
  setupDropdown(el.fontDropdown, el.fontFamily, (value) => {
    currentFontFamily = value;
    loadBuiltinFontPreview(value);
    saveCurrentSettings();
  });

  // Setup target size dropdown
  setupDropdown(el.targetSizeDropdown, el.targetSize, (value) => {
    currentTargetSize = parseInt(value);
    saveCurrentSettings();
  });

  // Setup Google Fonts combobox
  setupGoogleFontsCombobox();
}

function setupFontSourceChips(): void {
  el.builtinChip.addEventListener('click', () => {
    if (currentFontSource !== 'builtin') {
      currentFontSource = 'builtin';
      updateChipSelection('builtin');
      updateFontFieldVisibility();
      saveCurrentSettings();
    }
  });

  el.googleChip.addEventListener('click', () => {
    if (currentFontSource !== 'google') {
      currentFontSource = 'google';
      updateChipSelection('google');
      updateFontFieldVisibility();
      saveCurrentSettings();
    }
  });
}

function updateChipSelection(source: string): void {
  if (source === 'google') {
    el.builtinChip.classList.remove('active');
    el.builtinChip.setAttribute('aria-pressed', 'false');
    el.googleChip.classList.add('active');
    el.googleChip.setAttribute('aria-pressed', 'true');
  } else {
    el.builtinChip.classList.add('active');
    el.builtinChip.setAttribute('aria-pressed', 'true');
    el.googleChip.classList.remove('active');
    el.googleChip.setAttribute('aria-pressed', 'false');
  }
}

function setupBackgroundTypeButtons(): void {
  el.blurBgBtn.addEventListener('click', () => {
    if (currentBackgroundType !== 'blur') {
      currentBackgroundType = 'blur';
      updateBackgroundTypeSelection('blur');
      saveCurrentSettings();
    }
  });

  el.whiteBgBtn.addEventListener('click', () => {
    if (currentBackgroundType !== 'white') {
      currentBackgroundType = 'white';
      updateBackgroundTypeSelection('white');
      saveCurrentSettings();
    }
  });
}

function updateBackgroundTypeSelection(type: string): void {
  if (type === 'white') {
    el.blurBgBtn.classList.remove('active');
    el.blurBgBtn.setAttribute('aria-pressed', 'false');
    el.whiteBgBtn.classList.add('active');
    el.whiteBgBtn.setAttribute('aria-pressed', 'true');
  } else {
    el.blurBgBtn.classList.add('active');
    el.blurBgBtn.setAttribute('aria-pressed', 'true');
    el.whiteBgBtn.classList.remove('active');
    el.whiteBgBtn.setAttribute('aria-pressed', 'false');
  }
}

function setupModelButtons(): void {
  el.flashBtn.addEventListener('click', () => {
    if (currentTranslateModel !== 'gemini-flash-latest') {
      currentTranslateModel = 'gemini-flash-latest';
      updateModelSelection('gemini-flash-latest');
      saveCurrentSettings();
    }
  });

  el.liteBtn.addEventListener('click', () => {
    if (currentTranslateModel !== 'gemini-flash-lite-latest') {
      currentTranslateModel = 'gemini-flash-lite-latest';
      updateModelSelection('gemini-flash-lite-latest');
      saveCurrentSettings();
    }
  });

  el.proBtn.addEventListener('click', () => {
    if (currentTranslateModel !== 'gemini-pro-latest') {
      currentTranslateModel = 'gemini-pro-latest';
      updateModelSelection('gemini-pro-latest');
      saveCurrentSettings();
    }
  });
}

function updateModelSelection(model: string): void {
  // Remove active from all
  el.flashBtn.classList.remove('active');
  el.flashBtn.setAttribute('aria-pressed', 'false');
  el.liteBtn.classList.remove('active');
  el.liteBtn.setAttribute('aria-pressed', 'false');
  el.proBtn.classList.remove('active');
  el.proBtn.setAttribute('aria-pressed', 'false');

  // Set active based on model
  if (model === 'gemini-pro-latest') {
    el.proBtn.classList.add('active');
    el.proBtn.setAttribute('aria-pressed', 'true');
  } else if (model === 'gemini-flash-lite-latest') {
    el.liteBtn.classList.add('active');
    el.liteBtn.setAttribute('aria-pressed', 'true');
  } else {
    el.flashBtn.classList.add('active');
    el.flashBtn.setAttribute('aria-pressed', 'true');
  }
}

function updateFontFieldVisibility(): void {
  // Use smooth transitions by toggling hidden attribute
  if (currentFontSource === 'google') {
    // Show Google, hide builtin
    el.builtinFontField.hidden = true;
    el.googleFontField.hidden = false;

    // Load preview for the current Google font
    if (currentGoogleFontFamily) {
      loadGoogleFontPreview(currentGoogleFontFamily);
    }
  } else {
    // Show builtin, hide Google
    el.builtinFontField.hidden = false;
    el.googleFontField.hidden = true;

    // Load preview for built-in font
    loadBuiltinFontPreview(currentFontFamily);
  }
}

function updateFreeTextFieldsVisibility(): void {
  const isEnabled = el.includeFreeText.checked;
  const isBananaMode = el.bananaMode.checked;

  el.bananaField.hidden = !isEnabled;
  el.backgroundTypeField.hidden = !isEnabled || isBananaMode;
}

function setupCombobox(): void {
  const input = el.languageInput;
  const clear = el.languageClear;
  const toggle = el.languageToggle;
  const menu = el.languageSuggestions;
  const items = menu.querySelectorAll<HTMLLIElement>('.combobox-item');

  let isOpen = false;
  let blurTimeout: ReturnType<typeof setTimeout> | null = null;

  const updateClearButton = () => {
    if (input.value.trim()) {
      clear.style.display = 'flex';
      clear.classList.add('visible');
    } else {
      clear.classList.remove('visible');
      // Delay hiding to allow animation
      setTimeout(() => {
        if (!clear.classList.contains('visible')) {
          clear.style.display = 'none';
        }
      }, 150);
    }
  };

  const openMenu = () => {
    // Clear any pending blur timeout
    if (blurTimeout) {
      clearTimeout(blurTimeout);
      blurTimeout = null;
    }
    isOpen = true;
    input.setAttribute('aria-expanded', 'true');
    menu.hidden = false;
    filterSuggestions(input.value);
  };

  const closeMenu = () => {
    isOpen = false;
    input.setAttribute('aria-expanded', 'false');
    menu.hidden = true;
  };

  const filterSuggestions = (query: string) => {
    const lowerQuery = query.toLowerCase().trim();
    let hasVisibleItems = false;

    items.forEach((item) => {
      const value = item.dataset.value || '';
      const matches = value.toLowerCase().includes(lowerQuery);
      item.hidden = !matches;
      if (matches) hasVisibleItems = true;
    });

    // If no matches, show all suggestions
    if (!hasVisibleItems && lowerQuery === '') {
      items.forEach(item => item.hidden = false);
    }
  };

  const selectSuggestion = (value: string) => {
    input.value = value;
    currentTargetLanguage = value;
    closeMenu();
    saveCurrentSettings();
  };

  // Clear button - use mousedown to prevent blur from closing menu
  clear.addEventListener('mousedown', (e) => {
    e.preventDefault();
    input.value = '';
    currentTargetLanguage = '';
    updateClearButton();
    saveCurrentSettings();
    // Delay opening to ensure blur doesn't interfere
    setTimeout(() => {
      openMenu();
      input.focus();
    }, 10);
  });

  // Input events
  input.addEventListener('input', () => {
    currentTargetLanguage = input.value;
    updateClearButton();
    if (isOpen) {
      filterSuggestions(input.value);
    }
    saveCurrentSettings();
  });

  // Initialize clear button visibility
  updateClearButton();

  input.addEventListener('focus', () => {
    openMenu();
  });

  input.addEventListener('blur', () => {
    // Delay to allow click on suggestion
    blurTimeout = setTimeout(() => {
      closeMenu();
      blurTimeout = null;
    }, 150);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMenu();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        openMenu();
      } else {
        const visibleItems = Array.from(items).filter(item => !item.hidden);
        if (visibleItems.length > 0) {
          visibleItems[0].focus();
        }
      }
    }
  });

  // Toggle button
  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
      input.focus();
    }
  });

  // Suggestion items
  items.forEach((item) => {
    item.addEventListener('mousedown', (e) => {
      // Use mousedown instead of click to fire before blur
      e.preventDefault(); // Prevent blur from input
      const value = item.dataset.value;
      if (value) {
        selectSuggestion(value);
        input.blur(); // Manually blur after selection
      }
    });

    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const value = item.dataset.value;
        if (value) {
          selectSuggestion(value);
          input.focus();
        }
      } else if (e.key === 'Escape') {
        closeMenu();
        input.focus();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = item.nextElementSibling as HTMLLIElement | null;
        if (next && !next.hidden) {
          next.focus();
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = item.previousElementSibling as HTMLLIElement | null;
        if (prev && !prev.hidden) {
          prev.focus();
        } else {
          input.focus();
        }
      }
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!input.contains(e.target as Node) &&
        !toggle.contains(e.target as Node) &&
        !menu.contains(e.target as Node)) {
      closeMenu();
    }
  });
}

function setupDropdown(
  dropdown: HTMLElement,
  trigger: HTMLButtonElement,
  onSelect: (value: string) => void
): void {
  const items = dropdown.querySelectorAll<HTMLLIElement>('.dropdown-item');

  const openDropdown = () => {
    // Check if dropdown should open upward
    const rect = trigger.getBoundingClientRect();
    const menuHeight = 300; // Approximate max height of dropdown menu
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    // If not enough space below and more space above, open upward
    if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
      dropdown.classList.add('open-upward');
    } else {
      dropdown.classList.remove('open-upward');
    }

    dropdown.classList.add('open');
    trigger.setAttribute('aria-expanded', 'true');
  };

  const closeDropdown = () => {
    dropdown.classList.remove('open');
    trigger.setAttribute('aria-expanded', 'false');
  };

  const getCurrentItemIndex = (): number => {
    const itemsArray = Array.from(items);
    return itemsArray.findIndex(item => item.classList.contains('selected'));
  };

  const selectItem = (value: string) => {
    const selectedText = dropdown.querySelector('.dropdown-selected')!;

    items.forEach((item) => {
      const isSelected = item.dataset.value === value;
      item.classList.toggle('selected', isSelected);
      item.setAttribute('aria-selected', isSelected ? 'true' : 'false');

      if (isSelected) {
        const text = item.querySelector('.dropdown-item-text')?.textContent || '';
        selectedText.textContent = text;
        onSelect(value);
      }
    });
  };

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
        selectItem(value);
        closeDropdown();
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
      selectItem(items[nextIndex].dataset.value!);
    } else if (e.key === 'ArrowUp' && dropdown.classList.contains('open')) {
      e.preventDefault();
      const currentIndex = getCurrentItemIndex();
      const prevIndex = Math.max(currentIndex - 1, 0);
      selectItem(items[prevIndex].dataset.value!);
    }
  });
}

function setDropdownValue(
  dropdown: HTMLElement,
  value: string,
  onSelect: (value: string) => void
): void {
  const items = dropdown.querySelectorAll<HTMLLIElement>('.dropdown-item');
  const selectedText = dropdown.querySelector('.dropdown-selected')!;

  items.forEach((item) => {
    const isSelected = item.dataset.value === value;
    item.classList.toggle('selected', isSelected);
    item.setAttribute('aria-selected', isSelected ? 'true' : 'false');

    if (isSelected) {
      const text = item.querySelector('.dropdown-item-text')?.textContent || '';
      selectedText.textContent = text;
      onSelect(value);
    }
  });
}

// Google Fonts API cache
let allGoogleFonts: string[] | null = null;
let googleFontsLoading = false;

async function fetchAllGoogleFonts(): Promise<string[]> {
  if (allGoogleFonts) {
    console.log(`[Google Fonts] Using cached ${allGoogleFonts.length} fonts`);
    return allGoogleFonts;
  }
  if (googleFontsLoading) {
    console.log('[Google Fonts] Already loading, waiting...');
    // Wait for existing fetch
    while (googleFontsLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return allGoogleFonts || [];
  }

  googleFontsLoading = true;
  console.log('[Google Fonts] Starting fetch from API...');

  try {
    // Try public API endpoint without key first
    console.log('[Google Fonts] Attempting: https://www.googleapis.com/webfonts/v1/webfonts?sort=popularity');
    const response = await fetch('https://www.googleapis.com/webfonts/v1/webfonts?sort=popularity');

    console.log(`[Google Fonts] Response status: ${response.status}`);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    console.log('[Google Fonts] API response received:', data);

    const fonts = data.items?.map((font: any) => font.family) || [];
    allGoogleFonts = fonts;
    console.log(`[Google Fonts] ✓ Successfully loaded ${fonts.length} fonts from API`);
    return fonts;
  } catch (error) {
    console.error('[Google Fonts] API fetch failed:', error);
    console.log('[Google Fonts] Falling back to popular fonts list...');

    // Fallback to popular fonts
    const { POPULAR_GOOGLE_FONTS } = await import('./data/googleFonts.js');
    allGoogleFonts = [...POPULAR_GOOGLE_FONTS];
    console.log(`[Google Fonts] ✓ Using ${allGoogleFonts.length} popular fonts as fallback`);
    return allGoogleFonts;
  } finally {
    googleFontsLoading = false;
  }
}

function setupGoogleFontsCombobox(): void {
  const input = el.googleFontInput;
  const clear = el.googleFontClear;
  const toggle = el.googleFontToggle;
  const menu = el.googleFontSuggestions;

  const updateClearButton = () => {
    if (input.value.trim()) {
      clear.style.display = 'flex';
      clear.classList.add('visible');
    } else {
      clear.classList.remove('visible');
      setTimeout(() => {
        if (!clear.classList.contains('visible')) {
          clear.style.display = 'none';
        }
      }, 150);
    }
  };

  let isOpen = false;
  let blurTimeout: ReturnType<typeof setTimeout> | null = null;
  let searchTimeout: ReturnType<typeof setTimeout> | null = null;

  const renderSuggestions = (fonts: string[], query: string = '') => {
    const lowerQuery = query.toLowerCase().trim();
    let matchedFonts = fonts;

    if (lowerQuery) {
      matchedFonts = fonts.filter(font =>
        font.toLowerCase().includes(lowerQuery)
      );
      console.log(`[Google Fonts Search] Found ${matchedFonts.length} matches for "${query}"`);
    } else {
      console.log(`[Google Fonts Search] Showing all ${fonts.length} fonts`);
    }

    // Limit to 50 suggestions for performance
    const displayFonts = matchedFonts.slice(0, 50);
    console.log(`[Google Fonts Search] Displaying ${displayFonts.length} fonts`);

    if (displayFonts.length === 0) {
      menu.innerHTML = '<li class="combobox-item combobox-no-results" style="color: var(--text-tertiary); font-style: italic; cursor: default;">No fonts found</li>';
    } else {
      menu.innerHTML = displayFonts.map(font =>
        `<li class="combobox-item" role="option" data-value="${font}">${font}</li>`
      ).join('');

      // Re-attach click handlers
      menu.querySelectorAll<HTMLLIElement>('.combobox-item').forEach((item) => {
        if (!item.classList.contains('combobox-no-results')) {
          item.addEventListener('mousedown', (e) => {
            e.preventDefault();
            const value = item.dataset.value;
            if (value) {
              selectSuggestion(value);
              input.blur();
            }
          });
        }
      });
    }
  };

  const searchFonts = async (query: string) => {
    console.log(`[Google Fonts Search] Query: "${query}"`);

    // Debounce search
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    searchTimeout = setTimeout(async () => {
      console.log(`[Google Fonts Search] Executing search for: "${query}"`);
      const fonts = await fetchAllGoogleFonts();
      console.log(`[Google Fonts Search] Filtering ${fonts.length} fonts...`);
      renderSuggestions(fonts, query);
    }, 150);
  };

  const openMenu = async () => {
    console.log('[Google Fonts] Opening menu...');

    if (blurTimeout) {
      clearTimeout(blurTimeout);
      blurTimeout = null;
    }
    isOpen = true;
    input.setAttribute('aria-expanded', 'true');
    menu.hidden = false;

    // Show loading state
    menu.innerHTML = '<li class="combobox-item combobox-loading" style="color: var(--text-tertiary); font-style: italic; cursor: default;">Loading fonts...</li>';

    // Load and display fonts
    const fonts = await fetchAllGoogleFonts();
    console.log('[Google Fonts] Menu opened with fonts loaded');
    renderSuggestions(fonts, input.value);
  };

  const closeMenu = () => {
    isOpen = false;
    input.setAttribute('aria-expanded', 'false');
    menu.hidden = true;
  };

  const selectSuggestion = (value: string) => {
    input.value = value;
    currentGoogleFontFamily = value;
    closeMenu();
    loadGoogleFontPreview(value);
    saveCurrentSettings();
  };

    // Clear button - use mousedown to prevent blur from closing menu
    clear.addEventListener('mousedown', (e) => {
      e.preventDefault();
      input.value = '';
      currentGoogleFontFamily = '';
      updateClearButton();
      saveCurrentSettings();
      // Delay opening to ensure blur doesn't interfere
      setTimeout(() => {
        openMenu();
        input.focus();
      }, 10);
    });

  // Input events
  input.addEventListener('input', () => {
    currentGoogleFontFamily = input.value;
    updateClearButton();
    if (isOpen) {
      searchFonts(input.value);
    }
    saveCurrentSettings();
  });

    // Initialize clear button visibility
    updateClearButton();

    input.addEventListener('change', () => {
      const fontName = input.value.trim();
      // Only load preview if font name is valid (at least 2 characters)
      if (fontName.length >= 2) {
        loadGoogleFontPreview(fontName);
      }
    });

    input.addEventListener('focus', () => {
      openMenu();
    });

    input.addEventListener('blur', () => {
      // Longer delay to allow click events to register
      blurTimeout = setTimeout(() => {
        closeMenu();
        blurTimeout = null;
      }, 250);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeMenu();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!isOpen) {
          openMenu();
        } else {
          const visibleItems = menu.querySelectorAll<HTMLLIElement>('.combobox-item:not(.combobox-no-results):not(.combobox-loading)');
          if (visibleItems.length > 0) {
            visibleItems[0].focus();
          }
        }
      }
    });

    // Toggle button
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
        input.focus();
      }
    });

  // Note: Event handlers for suggestions are now attached in renderSuggestions()

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!input.contains(e.target as Node) &&
        !toggle.contains(e.target as Node) &&
        !menu.contains(e.target as Node)) {
      closeMenu();
    }
  });

  // Initialize clear button visibility
  updateClearButton();
}

// Show font status indicator
function showFontStatus(status: 'loading' | 'success' | 'error', message: string): void {
  if (!el.fontStatus) return;

  el.fontStatus.style.display = 'flex';
  el.fontStatus.style.alignItems = 'center';

  if (status === 'loading') {
    el.fontStatus.style.background = 'var(--bg-secondary)';
    el.fontStatus.style.color = 'var(--text-secondary)';
    el.fontStatusIcon.textContent = '⏳';
    el.fontStatusText.textContent = message;
  } else if (status === 'success') {
    el.fontStatus.style.background = 'rgba(16, 185, 129, 0.1)';
    el.fontStatus.style.color = 'rgb(16, 185, 129)';
    el.fontStatusIcon.textContent = '✓';
    el.fontStatusText.textContent = message;
  } else if (status === 'error') {
    el.fontStatus.style.background = 'rgba(239, 68, 68, 0.1)';
    el.fontStatus.style.color = 'rgb(239, 68, 68)';
    el.fontStatusIcon.textContent = '✗';
    el.fontStatusText.textContent = message;
  }
}

// Hide font status indicator
function hideFontStatus(): void {
  if (el.fontStatus) {
    el.fontStatus.style.display = 'none';
  }
}

// Load and preview Google Font
function loadGoogleFontPreview(fontFamily: string): void {
  // Validate font name before loading
  const cleanFontName = fontFamily?.trim();
  if (!cleanFontName || cleanFontName.length < 2 || !el.fontPreviewText) {
    console.warn('[Font Preview] Invalid font name:', fontFamily);
    hideFontStatus();
    return;
  }

  // Show elegant loading state
  el.fontPreviewText.classList.add('loading');
  el.fontPreviewText.innerHTML = `
    <span style="opacity: 0.5;">AaBbCc 123 あいうえお 你好</span>
    <span class="font-loading-text">Loading ${fontFamily}...</span>
  `;

  showFontStatus('loading', `Loading font "${cleanFontName}"...`);

  // Create a link element to load the Google Font
  const linkId = 'google-font-preview-link';
  let link = document.getElementById(linkId) as HTMLLinkElement;

  if (!link) {
    link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }

  // Load the font from Google Fonts API with proper encoding
  const fontName = encodeURIComponent(cleanFontName);
  link.href = `https://fonts.googleapis.com/css2?family=${fontName}&display=swap`;

  console.log('[Font Preview] Loading font:', cleanFontName);

  // Wait for font to load using FontFace API for better detection
  if (document.fonts && document.fonts.load) {
    document.fonts.load(`20px "${fontFamily}"`)
      .then(() => {
        applyFontPreview(fontFamily);
        showFontStatus('success', `Font "${cleanFontName}" loaded successfully`);
        console.log('[Font Preview] Font loaded successfully:', cleanFontName);
      })
      .catch((error) => {
        console.warn('[Font Preview] Font load error:', error);
        // Fallback: still apply but show warning
        setTimeout(() => {
          applyFontPreview(fontFamily);
          showFontStatus('error', `Font "${cleanFontName}" may not exist or failed to load`);
        }, 600);
      });
  } else {
    // Fallback for browsers without FontFace API
    setTimeout(() => {
      applyFontPreview(fontFamily);
      showFontStatus('success', `Font "${cleanFontName}" applied (verification unavailable)`);
    }, 600);
  }
}

function applyFontPreview(fontFamily: string): void {
  const cleanFontName = fontFamily?.trim();
  if (!el.fontPreviewText || !cleanFontName) return;

  el.fontPreviewText.style.fontFamily = `"${cleanFontName}", sans-serif`;
  el.fontPreviewText.innerHTML = 'AaBbCc 123 あいうえお 你好';
  el.fontPreviewText.classList.remove('loading');

  console.log('[Font Preview] Applied font:', cleanFontName);
}

function loadBuiltinFontPreview(fontFamily: string): void {
  if (!el.builtinFontPreviewText) return;

  // Map font IDs to actual font families
  const fontMap: Record<string, string> = {
    'arial': 'Arial, sans-serif',
    'comic-sans': '"Comic Sans MS", "Comic Sans", cursive',
    'anime-ace': '"Anime Ace", sans-serif',
    'anime-ace-3': '"Anime Ace 3", sans-serif',
    'ms-yahei': '"Microsoft YaHei", "微软雅黑", sans-serif',
    'noto-sans-mono-cjk': '"Noto Sans Mono CJK JP", monospace',
  };

  const actualFont = fontMap[fontFamily] || 'Arial, sans-serif';
  el.builtinFontPreviewText.style.fontFamily = actualFont;
  el.builtinFontPreviewText.innerHTML = 'AaBbCc 123 あいうえお 你好';
}

console.log('[Popup] Script loaded');
