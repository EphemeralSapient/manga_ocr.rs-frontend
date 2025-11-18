// Manga Processor - Popup
console.log('[Popup] Init');

// State
let serverUrl = 'http://localhost:1420';
let currentAnalytics = null;
let checkTimeout = null;

// DOM Elements
const $ = (id) => document.getElementById(id);

const el = {
  // Connection
  serverUrl: $('serverUrl'),
  connectionStatus: $('connectionStatus'),

  // Main Settings
  translateModel: $('translateModel'),
  includeFreeText: $('includeFreeText'),

  // Process Button
  processBtn: $('processBtn'),

  // Advanced
  advancedToggle: $('advancedToggle'),
  advancedContent: $('advancedContent'),
  apiKeysList: $('apiKeysList'),
  addApiKey: $('addApiKey'),
  bananaMode: $('bananaMode'),
  textStroke: $('textStroke'),
  blurFreeTextBg: $('blurFreeTextBg'),
  cache: $('cache'),
  metricsDetail: $('metricsDetail'),

  // Stats
  viewStats: $('viewStats'),

  // Overlays
  toast: $('toast'),
  toastIcon: $('toast').querySelector('.toast-icon'),
  toastMessage: $('toast').querySelector('.toast-message'),
  processing: $('processing'),
  processingDetail: $('processing').querySelector('.processing-detail'),
  progress: $('progress'),
  analytics: $('analytics'),
  closeAnalytics: $('closeAnalytics'),
  analyticsContent: $('analyticsContent'),
};

// Init
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  setupListeners();
  checkConnection();
  console.log('[Popup] Ready');
});

// ===== Settings =====
async function loadSettings() {
  try {
    const data = await chrome.storage.sync.get([
      'serverUrl',
      'apiKeys',
      'translateModel',
      'includeFreeText',
      'bananaMode',
      'textStroke',
      'blurFreeTextBg',
      'cache',
      'metricsDetail'
    ]);

    if (data.serverUrl) {
      serverUrl = data.serverUrl;
      el.serverUrl.value = serverUrl;
    }

    if (data.apiKeys && Array.isArray(data.apiKeys)) {
      data.apiKeys.forEach(key => addApiKeyInput(key));
    } else {
      addApiKeyInput(''); // Default empty input
    }

    el.translateModel.value = data.translateModel || 'gemini-flash-latest';
    el.includeFreeText.checked = data.includeFreeText || false;
    el.bananaMode.checked = data.bananaMode || false;
    el.textStroke.checked = data.textStroke || false;
    el.blurFreeTextBg.checked = data.blurFreeTextBg || false;
    el.cache.checked = data.cache !== undefined ? data.cache : true;
    el.metricsDetail.checked = data.metricsDetail !== undefined ? data.metricsDetail : true;

    console.log('[Popup] Settings loaded');
  } catch (err) {
    console.error('[Popup] Load settings error:', err);
  }
}

async function saveSettings() {
  try {
    // Get API keys from inputs
    const apiKeyInputs = el.apiKeysList.querySelectorAll('.api-key-input');
    const apiKeys = Array.from(apiKeyInputs)
      .map(input => input.value.trim())
      .filter(key => key.length > 0);

    const settings = {
      serverUrl: el.serverUrl.value,
      apiKeys,
      translateModel: el.translateModel.value,
      includeFreeText: el.includeFreeText.checked,
      bananaMode: el.bananaMode.checked,
      textStroke: el.textStroke.checked,
      blurFreeTextBg: el.blurFreeTextBg.checked,
      cache: el.cache.checked,
      metricsDetail: el.metricsDetail.checked,
    };

    await chrome.storage.sync.set(settings);
    serverUrl = settings.serverUrl;
    console.log('[Popup] Settings saved');
  } catch (err) {
    console.error('[Popup] Save settings error:', err);
  }
}

// ===== API Keys Management =====
function addApiKeyInput(value = '') {
  const item = document.createElement('div');
  item.className = 'api-key-item';

  item.innerHTML = `
    <input
      type="password"
      class="api-key-input"
      placeholder="sk-..."
      value="${value}"
    >
    <button class="api-key-remove">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  `;

  // Remove button listener
  item.querySelector('.api-key-remove').addEventListener('click', () => {
    if (el.apiKeysList.children.length > 1) {
      item.remove();
      saveSettings();
    } else {
      showToast('⚠️', 'At least one API key field required');
    }
  });

  // Save on input
  item.querySelector('.api-key-input').addEventListener('blur', saveSettings);

  el.apiKeysList.appendChild(item);
}

// ===== Connection =====
async function checkConnection() {
  console.log('[Popup] Checking connection...');
  setStatus('checking');

  try {
    const res = await fetch(`${serverUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });

    if (res.ok) {
      setStatus('connected');
      el.processBtn.disabled = false;
      console.log('[Popup] Connected');
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (err) {
    console.error('[Popup] Connection failed:', err);
    setStatus('error');
    el.processBtn.disabled = true;
    showToast('⚠️', 'Server offline');
  }
}

function setStatus(status) {
  el.connectionStatus.className = `status-indicator ${status}`;
}

function scheduleCheck() {
  clearTimeout(checkTimeout);
  checkTimeout = setTimeout(() => {
    saveSettings();
    checkConnection();
  }, 1000);
}

// ===== Toast =====
function showToast(icon, message, duration = 3000) {
  el.toastIcon.textContent = icon;
  el.toastMessage.textContent = message;
  el.toast.classList.add('show');

  setTimeout(() => {
    el.toast.classList.remove('show');
  }, duration);
}

// ===== Processing =====
function showProcessing(show, detail = 'Initializing...', progress = 0) {
  if (show) {
    el.processing.classList.add('show');
    el.processingDetail.textContent = detail;
    el.progress.style.width = `${progress}%`;
  } else {
    el.processing.classList.remove('show');
  }
}

// ===== Process Page =====
async function processPage() {
  console.log('[Popup] Processing page...');
  showProcessing(true, 'Finding images...');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Get current settings
    const apiKeyInputs = el.apiKeysList.querySelectorAll('.api-key-input');
    const apiKeys = Array.from(apiKeyInputs)
      .map(input => input.value.trim())
      .filter(key => key.length > 0);

    if (apiKeys.length === 0) {
      throw new Error('At least one API key is required');
    }

    const config = {
      serverUrl,
      apiKeys,
      translateModel: el.translateModel.value,
      includeFreeText: el.includeFreeText.checked,
      bananaMode: el.bananaMode.checked,
      textStroke: el.textStroke.checked,
      blurFreeTextBg: el.blurFreeTextBg.checked,
      cache: el.cache.checked,
      metricsDetail: el.metricsDetail.checked,
    };

    const res = await chrome.tabs.sendMessage(tab.id, {
      action: 'process-images',
      config
    });

    if (res.success) {
      showProcessing(false);
      showToast('✓', `Processed ${res.result.processed} images`);

      if (res.result.analytics) {
        currentAnalytics = res.result.analytics;
        el.viewStats.disabled = false;
      }
    } else {
      throw new Error(res.error || 'Unknown error');
    }
  } catch (err) {
    console.error('[Popup] Process failed:', err);
    showProcessing(false);
    showToast('✗', err.message);
  }
}

// ===== Analytics =====
function showAnalytics() {
  if (!currentAnalytics) {
    showToast('ℹ️', 'No statistics available');
    return;
  }

  const html = `
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-label">Images</div>
        <div class="stat-value">${currentAnalytics.total_images || 0}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Regions</div>
        <div class="stat-value">${currentAnalytics.total_regions || 0}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Simple BG</div>
        <div class="stat-value">${currentAnalytics.simple_bg_count || 0}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Complex BG</div>
        <div class="stat-value">${currentAnalytics.complex_bg_count || 0}</div>
      </div>
    </div>

    <div class="stat-section">
      <div class="stat-section-title">API Usage</div>
      <div class="stat-row">
        <span class="stat-row-label">OCR Simple</span>
        <span class="stat-row-value">${currentAnalytics.api_calls_simple || 0}</span>
      </div>
      <div class="stat-row">
        <span class="stat-row-label">OCR Complex</span>
        <span class="stat-row-value">${currentAnalytics.api_calls_complex || 0}</span>
      </div>
      <div class="stat-row">
        <span class="stat-row-label">Banana Mode</span>
        <span class="stat-row-value">${currentAnalytics.api_calls_banana || 0}</span>
      </div>
    </div>

    ${currentAnalytics.input_tokens || currentAnalytics.output_tokens ? `
    <div class="stat-section">
      <div class="stat-section-title">Token Usage</div>
      <div class="stat-row">
        <span class="stat-row-label">Input</span>
        <span class="stat-row-value">${(currentAnalytics.input_tokens || 0).toLocaleString()}</span>
      </div>
      <div class="stat-row">
        <span class="stat-row-label">Output</span>
        <span class="stat-row-value">${(currentAnalytics.output_tokens || 0).toLocaleString()}</span>
      </div>
    </div>
    ` : ''}

    <div class="stat-section">
      <div class="stat-section-title">Cache</div>
      <div class="stat-row">
        <span class="stat-row-label">Hits</span>
        <span class="stat-row-value">${currentAnalytics.cache_hits || 0}</span>
      </div>
      <div class="stat-row">
        <span class="stat-row-label">Misses</span>
        <span class="stat-row-value">${currentAnalytics.cache_misses || 0}</span>
      </div>
      <div class="stat-row">
        <span class="stat-row-label">Hit Rate</span>
        <span class="stat-row-value">${calcHitRate(currentAnalytics)}</span>
      </div>
    </div>

    <div class="stat-section">
      <div class="stat-section-title">Processing Time</div>
      <div class="stat-row">
        <span class="stat-row-label">Detection</span>
        <span class="stat-row-value">${formatTime(currentAnalytics.phase1_time_ms)}</span>
      </div>
      <div class="stat-row">
        <span class="stat-row-label">Translation</span>
        <span class="stat-row-value">${formatTime(currentAnalytics.phase2_time_ms)}</span>
      </div>
      <div class="stat-row">
        <span class="stat-row-label">Text Removal</span>
        <span class="stat-row-value">${formatTime(currentAnalytics.phase3_time_ms)}</span>
      </div>
      <div class="stat-row">
        <span class="stat-row-label">Rendering</span>
        <span class="stat-row-value">${formatTime(currentAnalytics.phase4_time_ms)}</span>
      </div>
      <div class="stat-row">
        <span class="stat-row-label">Total</span>
        <span class="stat-row-value"><strong>${formatTime(currentAnalytics.total_time_ms)}</strong></span>
      </div>
    </div>
  `;

  el.analyticsContent.innerHTML = html;
  el.analytics.classList.add('show');
}

function calcHitRate(a) {
  const h = a.cache_hits || 0;
  const m = a.cache_misses || 0;
  const t = h + m;
  return t === 0 ? 'N/A' : `${((h / t) * 100).toFixed(1)}%`;
}

function formatTime(ms) {
  if (!ms) return 'N/A';
  return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(2)}s`;
}

// ===== Event Listeners =====
function setupListeners() {
  // Server URL
  el.serverUrl.addEventListener('input', scheduleCheck);
  el.serverUrl.addEventListener('blur', () => {
    saveSettings();
    checkConnection();
  });

  // Main Settings
  el.translateModel.addEventListener('change', saveSettings);
  el.includeFreeText.addEventListener('change', saveSettings);

  // Process Button
  el.processBtn.addEventListener('click', processPage);

  // Advanced Toggle
  el.advancedToggle.addEventListener('click', () => {
    document.querySelector('.collapsible').classList.toggle('expanded');
  });

  // Add API Key
  el.addApiKey.addEventListener('click', () => {
    addApiKeyInput('');
  });

  // Boolean Options
  el.bananaMode.addEventListener('change', saveSettings);
  el.textStroke.addEventListener('change', saveSettings);
  el.blurFreeTextBg.addEventListener('change', saveSettings);
  el.cache.addEventListener('change', saveSettings);
  el.metricsDetail.addEventListener('change', saveSettings);

  // View Stats
  el.viewStats.addEventListener('click', showAnalytics);

  // Close Analytics
  el.closeAnalytics.addEventListener('click', () => {
    el.analytics.classList.remove('show');
  });
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('[Popup] Message:', msg);

  if (msg.action === 'processing-update') {
    showProcessing(true, msg.details, msg.progress);
  } else if (msg.action === 'processing-complete') {
    showProcessing(false);
    if (msg.analytics) {
      currentAnalytics = msg.analytics;
      el.viewStats.disabled = false;
    }
  } else if (msg.action === 'processing-error') {
    showProcessing(false);
    showToast('✗', msg.error);
  }

  sendResponse({ status: 'ok' });
});

console.log('[Popup] Loaded');
