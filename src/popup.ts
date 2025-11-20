/**
 * Popup Script - Main UI Controller
 * Handles all popup interactions, settings, and processing coordination
 */

import type { ExtensionSettings, Analytics, ConnectionStatus, Tab } from './types';
import { loadSettings, saveSettings } from './utils/storage';
import { createFocusTrap } from './utils/focus-trap';
import { KeyboardManager } from './utils/keyboard';

console.log('[Popup] Initializing...');

// ===== State =====
let serverUrl = 'http://localhost:1420';
let currentAnalytics: Analytics | null = null;
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
  useMask: document.getElementById('useMask') as HTMLInputElement,
  mergeImg: document.getElementById('mergeImg') as HTMLInputElement,
  batchSize: document.getElementById('batchSize') as HTMLInputElement,
  sessionLimit: document.getElementById('sessionLimit') as HTMLInputElement,

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

  // Setup event listeners
  setupEventListeners();

  // Setup keyboard shortcuts
  setupKeyboardShortcuts();

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
async function syncServerToggle(toggle: 'mask' | 'mergeimg', showNotification = true): Promise<void> {
  const endpoint = toggle === 'mask' ? '/mask-toggle' : '/mergeimg-toggle';
  const toggleName = toggle === 'mask' ? 'Mask mode' : 'Batch inference';

  try {
    const response = await fetch(`${serverUrl}${endpoint}`, {
      method: 'POST',
    });

    if (response.ok) {
      const data = await response.json();
      const enabled = toggle === 'mask' ? data.mask_enabled : data.merge_img_enabled;
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

    // Compare server state with local settings
    const needsSyncMask = data.config.mask_enabled !== el.useMask.checked;
    const needsSyncMergeImg = data.config.merge_img_enabled !== el.mergeImg.checked;

    if (needsSyncMask || needsSyncMergeImg) {
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

      console.log('[Popup] ✓ Frontend settings synced to server');
    } else {
      console.log('[Popup] ✓ Server state matches frontend, no sync needed');
    }
  } catch (error) {
    console.error('[Popup] Failed to check/sync server settings:', error);
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
  if (!currentAnalytics) {
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

  const html = `
    <div class="settings-group">
      <h3 class="settings-group-title">Image Processing</h3>
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
        <div class="stat-card">
          <div style="font-size: var(--text-xs); color: var(--text-secondary);">Simple BG</div>
          <div style="font-size: var(--text-2xl); font-weight: var(--font-bold); color: var(--text-primary);">
            ${currentAnalytics.simple_bg_count || 0}
          </div>
        </div>
        <div class="stat-card">
          <div style="font-size: var(--text-xs); color: var(--text-secondary);">Complex BG</div>
          <div style="font-size: var(--text-2xl); font-weight: var(--font-bold); color: var(--text-primary);">
            ${currentAnalytics.complex_bg_count || 0}
          </div>
        </div>
      </div>
    </div>

    <div class="settings-group">
      <h3 class="settings-group-title">Processing Time</h3>
      ${createStatRow('Detection', formatTime(currentAnalytics.phase1_time_ms))}
      ${createStatRow('Translation', formatTime(currentAnalytics.phase2_time_ms))}
      ${createStatRow('Text Removal', formatTime(currentAnalytics.phase3_time_ms))}
      ${createStatRow('Rendering', formatTime(currentAnalytics.phase4_time_ms))}
      ${createStatRow('Total', `<strong>${formatTime(currentAnalytics.total_time_ms)}</strong>`)}
    </div>

    ${
      currentAnalytics.input_tokens || currentAnalytics.output_tokens
        ? `
    <div class="settings-group">
      <h3 class="settings-group-title">Token Usage</h3>
      ${createStatRow('Input Tokens', (currentAnalytics.input_tokens || 0).toLocaleString())}
      ${createStatRow('Output Tokens', (currentAnalytics.output_tokens || 0).toLocaleString())}
    </div>
    `
        : ''
    }

    <div class="settings-group">
      <h3 class="settings-group-title">Cache Performance</h3>
      ${createStatRow('Hits', (currentAnalytics.cache_hits || 0).toString())}
      ${createStatRow('Misses', (currentAnalytics.cache_misses || 0).toString())}
      ${createStatRow('Hit Rate', calculateHitRate(currentAnalytics))}
    </div>
  `;

  el.statsContent.innerHTML = html;
}

function createStatRow(label: string, value: string): string {
  return `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-sm) 0;">
      <span style="font-size: var(--text-sm); color: var(--text-secondary);">${label}</span>
      <span style="font-size: var(--text-sm); color: var(--text-primary);">${value}</span>
    </div>
  `;
}

function formatTime(ms: number | undefined): string {
  if (!ms) return 'N/A';
  return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(2)}s`;
}

function calculateHitRate(analytics: Analytics): string {
  const hits = analytics.cache_hits || 0;
  const misses = analytics.cache_misses || 0;
  const total = hits + misses;
  return total === 0 ? 'N/A' : `${((hits / total) * 100).toFixed(1)}%`;
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

// ===== Message Listener =====
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  console.log('[Popup] Message:', msg);

  if (msg.action === 'processing-update') {
    showProcessing(true, msg.details, msg.progress);
  } else if (msg.action === 'processing-complete') {
    showProcessing(false);
    if (msg.analytics) {
      currentAnalytics = msg.analytics;
      (el.tabStats as HTMLButtonElement).disabled = false;
      updateStatisticsPanel();
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
