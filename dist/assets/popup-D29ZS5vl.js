const k={serverUrl:"http://localhost:1420",apiKeys:[],translateModel:"gemini-flash-latest",includeFreeText:!1,bananaMode:!1,textStroke:!1,blurFreeTextBg:!1,cache:!0,metricsDetail:!0,useMask:!0,mergeImg:!1,batchSize:5,sessionLimit:8,theme:"auto"};async function B(){try{const e=await chrome.storage.sync.get(Object.keys(k));return{...k,...e}}catch(e){return console.error("[Storage] Failed to load settings:",e),k}}async function F(e){try{await chrome.storage.sync.set(e)}catch(t){throw console.error("[Storage] Failed to save settings:",t),t}}class K{container;previouslyFocused=null;isActive=!1;constructor(t){this.container=t}getFocusableElements(){const t=["a[href]","button:not([disabled])","textarea:not([disabled])","input:not([disabled])","select:not([disabled])",'[tabindex]:not([tabindex="-1"])'].join(",");return Array.from(this.container.querySelectorAll(t)).filter(a=>!a.hasAttribute("disabled")&&a.offsetParent!==null)}handleTab=t=>{if(!this.isActive||t.key!=="Tab")return;const n=this.getFocusableElements(),a=n[0],o=n[n.length-1];if(!(!a||!o)){if(t.shiftKey&&document.activeElement===a){t.preventDefault(),o.focus();return}!t.shiftKey&&document.activeElement===o&&(t.preventDefault(),a.focus())}};activate(){if(this.isActive)return;this.previouslyFocused=document.activeElement;const t=this.getFocusableElements();t.length>0&&t[0].focus(),document.addEventListener("keydown",this.handleTab),this.isActive=!0}deactivate(){this.isActive&&(document.removeEventListener("keydown",this.handleTab),this.previouslyFocused&&typeof this.previouslyFocused.focus=="function"&&this.previouslyFocused.focus(),this.isActive=!1)}isActivated(){return this.isActive}}function D(e){return new K(e)}function _(e,t){const n=e.key.toLowerCase()===t.key.toLowerCase(),a=!!t.ctrl===(e.ctrlKey||e.metaKey),o=!!t.shift===e.shiftKey,i=!!t.alt===e.altKey;return n&&a&&o&&i}class P{shortcuts=[];isListening=!1;add(t){this.shortcuts.push(t)}remove(t){const n=this.shortcuts.indexOf(t);n>-1&&this.shortcuts.splice(n,1)}handleKeydown=t=>{for(const n of this.shortcuts)if(_(t,n)){t.preventDefault(),n.handler(t);return}};listen(){this.isListening||(document.addEventListener("keydown",this.handleKeydown),this.isListening=!0)}stop(){this.isListening&&(document.removeEventListener("keydown",this.handleKeydown),this.isListening=!1)}getShortcuts(){return[...this.shortcuts]}}console.log("[Popup] Initializing...");let g="http://localhost:1420",r=null,b=null;const s={connectionStatus:document.getElementById("connectionStatus"),connectionLabel:document.getElementById("connectionLabel"),serverUrl:document.getElementById("serverUrl"),tabSettings:document.getElementById("tab-settings"),tabApiKeys:document.getElementById("tab-apiKeys"),tabStats:document.getElementById("tab-stats"),panelSettings:document.getElementById("panel-settings"),panelApiKeys:document.getElementById("panel-apiKeys"),panelStats:document.getElementById("panel-stats"),modelDropdown:document.getElementById("modelDropdown"),translateModel:document.getElementById("translateModel"),includeFreeText:document.getElementById("includeFreeText"),textStroke:document.getElementById("textStroke"),blurFreeTextBg:document.getElementById("blurFreeTextBg"),bananaMode:document.getElementById("bananaMode"),cache:document.getElementById("cache"),metricsDetail:document.getElementById("metricsDetail"),useMask:document.getElementById("useMask"),mergeImg:document.getElementById("mergeImg"),batchSize:document.getElementById("batchSize"),sessionLimit:document.getElementById("sessionLimit"),apiKeysList:document.getElementById("apiKeysList"),addApiKey:document.getElementById("addApiKey"),statsContent:document.getElementById("statsContent"),toast:document.getElementById("toast"),processingOverlay:document.getElementById("processingOverlay"),processingDetail:document.getElementById("processingDetail"),progressFill:document.getElementById("progressFill")};let L="gemini-flash-latest";document.addEventListener("DOMContentLoaded",async()=>{await C(),console.log("[Popup] Ready")});async function C(){await z(),H(),G(),I()}async function z(){try{const e=await B();e.serverUrl&&(g=e.serverUrl,s.serverUrl.value=g),L=e.translateModel,j(e.translateModel),s.includeFreeText.checked=e.includeFreeText,s.textStroke.checked=e.textStroke,s.blurFreeTextBg.checked=e.blurFreeTextBg,s.bananaMode.checked=e.bananaMode,s.cache.checked=e.cache,s.metricsDetail.checked=e.metricsDetail,s.useMask.checked=e.useMask??!0,s.mergeImg.checked=e.mergeImg??!1,s.batchSize.value=String(e.batchSize??5),s.sessionLimit.value=String(e.sessionLimit??8),e.apiKeys&&e.apiKeys.length>0?e.apiKeys.forEach(t=>S(t)):S(""),console.log("[Popup] Settings loaded")}catch(e){console.error("[Popup] Failed to load settings:",e),u("⚠️","Failed to load settings")}}async function c(){try{const e=s.apiKeysList.querySelectorAll(".api-key-input"),t=Array.from(e).map(a=>a.value.trim()).filter(a=>a.length>0),n={serverUrl:s.serverUrl.value,apiKeys:t,translateModel:L,includeFreeText:s.includeFreeText.checked,textStroke:s.textStroke.checked,blurFreeTextBg:s.blurFreeTextBg.checked,bananaMode:s.bananaMode.checked,cache:s.cache.checked,metricsDetail:s.metricsDetail.checked,useMask:s.useMask.checked,mergeImg:s.mergeImg.checked,batchSize:Math.max(1,Math.min(50,parseInt(s.batchSize.value)||5)),sessionLimit:Math.max(1,Math.min(32,parseInt(s.sessionLimit.value)||8))};await F(n),g=n.serverUrl,console.log("[Popup] Settings saved")}catch(e){console.error("[Popup] Failed to save settings:",e),u("✗","Failed to save settings")}}async function f(e,t=!0){const n=e==="mask"?"/mask-toggle":"/mergeimg-toggle",a=e==="mask"?"Mask mode":"Batch inference";try{const o=await fetch(`${g}${n}`,{method:"POST"});if(o.ok){const i=await o.json(),l=e==="mask"?i.mask_enabled:i.merge_img_enabled;console.log(`[Popup] ${a} synced: ${l}`),t&&u("✓",`${a} ${l?"enabled":"disabled"}`)}else throw new Error(`HTTP ${o.status}`)}catch(o){console.error(`[Popup] Failed to sync ${a}:`,o),t&&u("⚠️",`Failed to sync ${a} with server`)}}async function q(){try{const e=await fetch(`${g}/health`);if(!e.ok)return;const t=await e.json();if(!t.config)return;const n=t.config.mask_enabled!==s.useMask.checked,a=t.config.merge_img_enabled!==s.mergeImg.checked;n||a?(console.log("[Popup] Server state mismatch detected, syncing frontend settings to server"),n&&(console.log(`  - Mask: server=${t.config.mask_enabled}, local=${s.useMask.checked} → syncing`),await f("mask",!1)),a&&(console.log(`  - MergeImg: server=${t.config.merge_img_enabled}, local=${s.mergeImg.checked} → syncing`),await f("mergeimg",!1)),console.log("[Popup] ✓ Frontend settings synced to server")):console.log("[Popup] ✓ Server state matches frontend, no sync needed")}catch(e){console.error("[Popup] Failed to check/sync server settings:",e)}}function S(e=""){const t=document.createElement("div");t.className="api-key-item",t.setAttribute("role","listitem");const n=`api-key-${Date.now()}`,a=`visibility-${Date.now()}`;t.innerHTML=`
    <div class="api-key-input-wrapper">
      <input
        type="password"
        id="${n}"
        class="api-key-input"
        placeholder="AIza..."
        value="${e}"
        aria-label="API Key"
        aria-describedby="${n}-help"
      >
      <span id="${n}-help" class="sr-only">Enter your Google Gemini API key</span>
      <button
        id="${a}"
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
  `;const o=t.querySelector(".api-key-input"),i=t.querySelector(".api-key-toggle-visibility"),l=t.querySelector(".api-key-remove"),T=i.querySelector(".icon-eye"),$=i.querySelector(".icon-eye-off");i.addEventListener("click",()=>{const p=o.type==="password";o.type=p?"text":"password",T.style.display=p?"none":"block",$.style.display=p?"block":"none",i.setAttribute("aria-pressed",p?"true":"false")}),l.addEventListener("click",()=>{s.apiKeysList.querySelectorAll(".api-key-item").length>1?(t.remove(),c()):u("⚠️","At least one API key field is required")}),o.addEventListener("blur",()=>{c()}),s.apiKeysList.appendChild(t)}async function I(){console.log("[Popup] Checking connection..."),x("checking");try{const e=new AbortController,t=setTimeout(()=>e.abort(),5e3),n=await fetch(`${g}/health`,{method:"GET",signal:e.signal});if(clearTimeout(t),n.ok)x("connected"),console.log("[Popup] Connected"),await q();else throw new Error(`HTTP ${n.status}`)}catch(e){console.error("[Popup] Connection failed:",e),x("error"),u("⚠️","Server offline or unreachable")}}function x(e){s.connectionStatus.className=`status-dot ${e}`;const t={connected:"Connected",checking:"Checking...",error:"Offline"};s.connectionLabel.textContent=t[e],s.connectionStatus.setAttribute("aria-label",`Server connection status: ${t[e]}`)}function U(){b&&clearTimeout(b),b=setTimeout(()=>{c(),I()},1e3)}function m(e){const t=[s.tabSettings,s.tabApiKeys,s.tabStats],n=[s.panelSettings,s.panelApiKeys,s.panelStats];t.forEach((a,o)=>{const i=a.id===`tab-${e}`;a.classList.toggle("active",i),a.setAttribute("aria-selected",i?"true":"false"),a.setAttribute("tabindex",i?"0":"-1"),n[o].classList.toggle("active",i),n[o].hidden=!i})}const A=D(s.processingOverlay);function w(e,t="Initializing...",n=0){e?(s.processingOverlay.hidden=!1,s.processingDetail.textContent=t,s.progressFill.style.width=`${n}%`,s.progressFill.parentElement?.setAttribute("aria-valuenow",n.toString()),A.activate()):(s.processingOverlay.hidden=!0,A.deactivate())}function O(){if(!r){s.statsContent.innerHTML=`
      <div class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 3v18h18M18 17V9m-5 8V5m-5 12v-3"/>
        </svg>
        <h3 class="empty-title">No Statistics Available</h3>
        <p class="empty-description">
          Process some manga images to see detailed statistics and analytics.
        </p>
      </div>
    `;return}const e=`
    <div class="settings-group">
      <h3 class="settings-group-title">Image Processing</h3>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-md);">
        <div class="stat-card">
          <div style="font-size: var(--text-xs); color: var(--text-secondary);">Images</div>
          <div style="font-size: var(--text-2xl); font-weight: var(--font-bold); color: var(--text-primary);">
            ${r.total_images||0}
          </div>
        </div>
        <div class="stat-card">
          <div style="font-size: var(--text-xs); color: var(--text-secondary);">Regions</div>
          <div style="font-size: var(--text-2xl); font-weight: var(--font-bold); color: var(--text-primary);">
            ${r.total_regions||0}
          </div>
        </div>
        <div class="stat-card">
          <div style="font-size: var(--text-xs); color: var(--text-secondary);">Simple BG</div>
          <div style="font-size: var(--text-2xl); font-weight: var(--font-bold); color: var(--text-primary);">
            ${r.simple_bg_count||0}
          </div>
        </div>
        <div class="stat-card">
          <div style="font-size: var(--text-xs); color: var(--text-secondary);">Complex BG</div>
          <div style="font-size: var(--text-2xl); font-weight: var(--font-bold); color: var(--text-primary);">
            ${r.complex_bg_count||0}
          </div>
        </div>
      </div>
    </div>

    <div class="settings-group">
      <h3 class="settings-group-title">Processing Time</h3>
      ${d("Detection",y(r.phase1_time_ms))}
      ${d("Translation",y(r.phase2_time_ms))}
      ${d("Text Removal",y(r.phase3_time_ms))}
      ${d("Rendering",y(r.phase4_time_ms))}
      ${d("Total",`<strong>${y(r.total_time_ms)}</strong>`)}
    </div>

    ${r.input_tokens||r.output_tokens?`
    <div class="settings-group">
      <h3 class="settings-group-title">Token Usage</h3>
      ${d("Input Tokens",(r.input_tokens||0).toLocaleString())}
      ${d("Output Tokens",(r.output_tokens||0).toLocaleString())}
    </div>
    `:""}

    <div class="settings-group">
      <h3 class="settings-group-title">Cache Performance</h3>
      ${d("Hits",(r.cache_hits||0).toString())}
      ${d("Misses",(r.cache_misses||0).toString())}
      ${d("Hit Rate",R(r))}
    </div>
  `;s.statsContent.innerHTML=e}function d(e,t){return`
    <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-sm) 0;">
      <span style="font-size: var(--text-sm); color: var(--text-secondary);">${e}</span>
      <span style="font-size: var(--text-sm); color: var(--text-primary);">${t}</span>
    </div>
  `}function y(e){return e?e<1e3?`${Math.round(e)}ms`:`${(e/1e3).toFixed(2)}s`:"N/A"}function R(e){const t=e.cache_hits||0,n=e.cache_misses||0,a=t+n;return a===0?"N/A":`${(t/a*100).toFixed(1)}%`}let E=null;function u(e,t,n=3e3){const a=s.toast.querySelector(".toast-icon"),o=s.toast.querySelector(".toast-message");a.textContent=e,o.textContent=t,s.toast.hidden=!1,s.toast.classList.add("show"),E&&clearTimeout(E),E=setTimeout(()=>{s.toast.classList.remove("show"),setTimeout(()=>{s.toast.hidden=!0},200)},n)}function H(){s.serverUrl.addEventListener("input",U),s.serverUrl.addEventListener("blur",()=>{c(),I()}),s.includeFreeText.addEventListener("change",c),s.textStroke.addEventListener("change",c),s.blurFreeTextBg.addEventListener("change",c),s.bananaMode.addEventListener("change",c),s.cache.addEventListener("change",c),s.metricsDetail.addEventListener("change",c),s.batchSize.addEventListener("change",c),s.sessionLimit.addEventListener("change",c),s.useMask.addEventListener("change",async()=>{await c(),await f("mask")}),s.mergeImg.addEventListener("change",async()=>{await c(),await f("mergeimg")}),N(),s.tabSettings.addEventListener("click",()=>m("settings")),s.tabApiKeys.addEventListener("click",()=>m("apiKeys")),s.tabStats.addEventListener("click",()=>m("stats")),[s.tabSettings,s.tabApiKeys,s.tabStats].forEach((e,t)=>{e.addEventListener("keydown",n=>{const a=["settings","apiKeys","stats"];if(n.key==="ArrowRight"){n.preventDefault();const o=(t+1)%a.length;m(a[o]),document.getElementById(`tab-${a[o]}`)?.focus()}else if(n.key==="ArrowLeft"){n.preventDefault();const o=(t-1+a.length)%a.length;m(a[o]),document.getElementById(`tab-${a[o]}`)?.focus()}})}),s.addApiKey.addEventListener("click",()=>{S("");const e=s.apiKeysList.querySelectorAll(".api-key-input");e[e.length-1]?.focus()})}function G(){const e=new P;e.add({key:"Escape",handler:()=>{}}),e.listen()}chrome.runtime.onMessage.addListener((e,t,n)=>(console.log("[Popup] Message:",e),e.action==="processing-update"?w(!0,e.details,e.progress):e.action==="processing-complete"?(w(!1),e.analytics&&(r=e.analytics,s.tabStats.disabled=!1,O())):e.action==="processing-error"&&(w(!1),u("✗",e.error)),n({status:"ok"}),!1));function N(){const e=s.translateModel,t=s.modelDropdown,n=t.querySelectorAll(".dropdown-item");e.addEventListener("click",o=>{o.stopPropagation(),t.classList.contains("open")?h():M()}),n.forEach(o=>{o.addEventListener("click",()=>{const i=o.dataset.value;i&&(v(i),h(),c())})}),document.addEventListener("click",o=>{t.contains(o.target)||h()}),e.addEventListener("keydown",o=>{if(o.key==="Enter"||o.key===" ")o.preventDefault(),t.classList.contains("open")?h():M();else if(o.key==="Escape")h();else if(o.key==="ArrowDown"&&t.classList.contains("open")){o.preventDefault();const i=a(),l=Math.min(i+1,n.length-1);v(n[l].dataset.value)}else if(o.key==="ArrowUp"&&t.classList.contains("open")){o.preventDefault();const i=a(),l=Math.max(i-1,0);v(n[l].dataset.value)}});function a(){return Array.from(n).findIndex(i=>i.classList.contains("selected"))}}function M(){s.modelDropdown.classList.add("open"),s.translateModel.setAttribute("aria-expanded","true")}function h(){s.modelDropdown.classList.remove("open"),s.translateModel.setAttribute("aria-expanded","false")}function v(e){const t=s.modelDropdown,n=t.querySelectorAll(".dropdown-item"),a=t.querySelector(".dropdown-selected");n.forEach(o=>{const i=o.dataset.value===e;if(o.classList.toggle("selected",i),o.setAttribute("aria-selected",i?"true":"false"),i){const l=o.querySelector(".dropdown-item-text")?.textContent||"";a.textContent=l,L=e}})}function j(e){v(e)}console.log("[Popup] Script loaded");
