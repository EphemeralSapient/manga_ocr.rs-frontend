var T=Object.defineProperty;var I=(e,t,n)=>t in e?T(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n;var u=(e,t,n)=>I(e,typeof t!="symbol"?t+"":t,n);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))i(o);new MutationObserver(o=>{for(const a of o)if(a.type==="childList")for(const c of a.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&i(c)}).observe(document,{childList:!0,subtree:!0});function n(o){const a={};return o.integrity&&(a.integrity=o.integrity),o.referrerPolicy&&(a.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?a.credentials="include":o.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function i(o){if(o.ep)return;o.ep=!0;const a=n(o);fetch(o.href,a)}})();const m={serverUrl:"http://localhost:1420",apiKeys:[],translateModel:"gemini-flash-latest",includeFreeText:!1,bananaMode:!1,textStroke:!1,blurFreeTextBg:!1,cache:!0,metricsDetail:!0,theme:"auto"};async function B(){try{const e=await chrome.storage.sync.get(Object.keys(m));return{...m,...e}}catch(e){return console.error("[Storage] Failed to load settings:",e),m}}async function F(e){try{await chrome.storage.sync.set(e)}catch(t){throw console.error("[Storage] Failed to save settings:",t),t}}class K{constructor(t){u(this,"container");u(this,"previouslyFocused",null);u(this,"isActive",!1);u(this,"handleTab",t=>{if(!this.isActive||t.key!=="Tab")return;const n=this.getFocusableElements(),i=n[0],o=n[n.length-1];if(!(!i||!o)){if(t.shiftKey&&document.activeElement===i){t.preventDefault(),o.focus();return}!t.shiftKey&&document.activeElement===o&&(t.preventDefault(),i.focus())}});this.container=t}getFocusableElements(){const t=["a[href]","button:not([disabled])","textarea:not([disabled])","input:not([disabled])","select:not([disabled])",'[tabindex]:not([tabindex="-1"])'].join(",");return Array.from(this.container.querySelectorAll(t)).filter(i=>!i.hasAttribute("disabled")&&i.offsetParent!==null)}activate(){if(this.isActive)return;this.previouslyFocused=document.activeElement;const t=this.getFocusableElements();t.length>0&&t[0].focus(),document.addEventListener("keydown",this.handleTab),this.isActive=!0}deactivate(){this.isActive&&(document.removeEventListener("keydown",this.handleTab),this.previouslyFocused&&typeof this.previouslyFocused.focus=="function"&&this.previouslyFocused.focus(),this.isActive=!1)}isActivated(){return this.isActive}}function M(e){return new K(e)}function $(e,t){const n=e.key.toLowerCase()===t.key.toLowerCase(),i=!!t.ctrl===(e.ctrlKey||e.metaKey),o=!!t.shift===e.shiftKey,a=!!t.alt===e.altKey;return n&&i&&o&&a}class C{constructor(){u(this,"shortcuts",[]);u(this,"isListening",!1);u(this,"handleKeydown",t=>{for(const n of this.shortcuts)if($(t,n)){t.preventDefault(),n.handler(t);return}})}add(t){this.shortcuts.push(t)}remove(t){const n=this.shortcuts.indexOf(t);n>-1&&this.shortcuts.splice(n,1)}listen(){this.isListening||(document.addEventListener("keydown",this.handleKeydown),this.isListening=!0)}stop(){this.isListening&&(document.removeEventListener("keydown",this.handleKeydown),this.isListening=!1)}getShortcuts(){return[...this.shortcuts]}}console.log("[Popup] Initializing...");let v="http://localhost:1420",r=null,f=null;const s={connectionStatus:document.getElementById("connectionStatus"),connectionLabel:document.getElementById("connectionLabel"),serverUrl:document.getElementById("serverUrl"),tabSettings:document.getElementById("tab-settings"),tabApiKeys:document.getElementById("tab-apiKeys"),tabStats:document.getElementById("tab-stats"),panelSettings:document.getElementById("panel-settings"),panelApiKeys:document.getElementById("panel-apiKeys"),panelStats:document.getElementById("panel-stats"),translateModel:document.getElementById("translateModel"),includeFreeText:document.getElementById("includeFreeText"),textStroke:document.getElementById("textStroke"),blurFreeTextBg:document.getElementById("blurFreeTextBg"),bananaMode:document.getElementById("bananaMode"),cache:document.getElementById("cache"),metricsDetail:document.getElementById("metricsDetail"),apiKeysList:document.getElementById("apiKeysList"),addApiKey:document.getElementById("addApiKey"),statsContent:document.getElementById("statsContent"),toast:document.getElementById("toast"),processingOverlay:document.getElementById("processingOverlay"),processingDetail:document.getElementById("processingDetail"),progressFill:document.getElementById("progressFill")};document.addEventListener("DOMContentLoaded",async()=>{await P(),console.log("[Popup] Ready")});async function P(){await _(),U(),q(),S()}async function _(){try{const e=await B();e.serverUrl&&(v=e.serverUrl,s.serverUrl.value=v),s.translateModel.value=e.translateModel,s.includeFreeText.checked=e.includeFreeText,s.textStroke.checked=e.textStroke,s.blurFreeTextBg.checked=e.blurFreeTextBg,s.bananaMode.checked=e.bananaMode,s.cache.checked=e.cache,s.metricsDetail.checked=e.metricsDetail,e.apiKeys&&e.apiKeys.length>0?e.apiKeys.forEach(t=>E(t)):E(""),console.log("[Popup] Settings loaded")}catch(e){console.error("[Popup] Failed to load settings:",e),h("⚠️","Failed to load settings")}}async function l(){try{const e=s.apiKeysList.querySelectorAll(".api-key-input"),t=Array.from(e).map(i=>i.value.trim()).filter(i=>i.length>0),n={serverUrl:s.serverUrl.value,apiKeys:t,translateModel:s.translateModel.value,includeFreeText:s.includeFreeText.checked,textStroke:s.textStroke.checked,blurFreeTextBg:s.blurFreeTextBg.checked,bananaMode:s.bananaMode.checked,cache:s.cache.checked,metricsDetail:s.metricsDetail.checked};await F(n),v=n.serverUrl,console.log("[Popup] Settings saved")}catch(e){console.error("[Popup] Failed to save settings:",e),h("✗","Failed to save settings")}}function E(e=""){const t=document.createElement("div");t.className="api-key-item",t.setAttribute("role","listitem");const n=`api-key-${Date.now()}`,i=`visibility-${Date.now()}`;t.innerHTML=`
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
        id="${i}"
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
  `;const o=t.querySelector(".api-key-input"),a=t.querySelector(".api-key-toggle-visibility"),c=t.querySelector(".api-key-remove"),w=a.querySelector(".icon-eye"),A=a.querySelector(".icon-eye-off");a.addEventListener("click",()=>{const p=o.type==="password";o.type=p?"text":"password",w.style.display=p?"none":"block",A.style.display=p?"block":"none",a.setAttribute("aria-pressed",p?"true":"false")}),c.addEventListener("click",()=>{s.apiKeysList.querySelectorAll(".api-key-item").length>1?(t.remove(),l()):h("⚠️","At least one API key field is required")}),o.addEventListener("blur",()=>{l()}),s.apiKeysList.appendChild(t)}async function S(){console.log("[Popup] Checking connection..."),b("checking");try{const e=new AbortController,t=setTimeout(()=>e.abort(),5e3),n=await fetch(`${v}/health`,{method:"GET",signal:e.signal});if(clearTimeout(t),n.ok)b("connected"),console.log("[Popup] Connected");else throw new Error(`HTTP ${n.status}`)}catch(e){console.error("[Popup] Connection failed:",e),b("error"),h("⚠️","Server offline or unreachable")}}function b(e){s.connectionStatus.className=`status-dot ${e}`;const t={connected:"Connected",checking:"Checking...",error:"Offline"};s.connectionLabel.textContent=t[e],s.connectionStatus.setAttribute("aria-label",`Server connection status: ${t[e]}`)}function D(){f&&clearTimeout(f),f=setTimeout(()=>{l(),S()},1e3)}function y(e){const t=[s.tabSettings,s.tabApiKeys,s.tabStats],n=[s.panelSettings,s.panelApiKeys,s.panelStats];t.forEach((i,o)=>{const a=i.id===`tab-${e}`;i.classList.toggle("active",a),i.setAttribute("aria-selected",a?"true":"false"),i.setAttribute("tabindex",a?"0":"-1"),n[o].classList.toggle("active",a),n[o].hidden=!a})}const L=M(s.processingOverlay);function x(e,t="Initializing...",n=0){var i;e?(s.processingOverlay.hidden=!1,s.processingDetail.textContent=t,s.progressFill.style.width=`${n}%`,(i=s.progressFill.parentElement)==null||i.setAttribute("aria-valuenow",n.toString()),L.activate()):(s.processingOverlay.hidden=!0,L.deactivate())}function O(){if(!r){s.statsContent.innerHTML=`
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
      ${d("Detection",g(r.phase1_time_ms))}
      ${d("Translation",g(r.phase2_time_ms))}
      ${d("Text Removal",g(r.phase3_time_ms))}
      ${d("Rendering",g(r.phase4_time_ms))}
      ${d("Total",`<strong>${g(r.total_time_ms)}</strong>`)}
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
      ${d("Hit Rate",z(r))}
    </div>
  `;s.statsContent.innerHTML=e}function d(e,t){return`
    <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-sm) 0;">
      <span style="font-size: var(--text-sm); color: var(--text-secondary);">${e}</span>
      <span style="font-size: var(--text-sm); color: var(--text-primary);">${t}</span>
    </div>
  `}function g(e){return e?e<1e3?`${Math.round(e)}ms`:`${(e/1e3).toFixed(2)}s`:"N/A"}function z(e){const t=e.cache_hits||0,n=e.cache_misses||0,i=t+n;return i===0?"N/A":`${(t/i*100).toFixed(1)}%`}let k=null;function h(e,t,n=3e3){const i=s.toast.querySelector(".toast-icon"),o=s.toast.querySelector(".toast-message");i.textContent=e,o.textContent=t,s.toast.hidden=!1,s.toast.classList.add("show"),k&&clearTimeout(k),k=setTimeout(()=>{s.toast.classList.remove("show"),setTimeout(()=>{s.toast.hidden=!0},200)},n)}function U(){s.serverUrl.addEventListener("input",D),s.serverUrl.addEventListener("blur",()=>{l(),S()}),s.translateModel.addEventListener("change",l),s.includeFreeText.addEventListener("change",l),s.textStroke.addEventListener("change",l),s.blurFreeTextBg.addEventListener("change",l),s.bananaMode.addEventListener("change",l),s.cache.addEventListener("change",l),s.metricsDetail.addEventListener("change",l),s.tabSettings.addEventListener("click",()=>y("settings")),s.tabApiKeys.addEventListener("click",()=>y("apiKeys")),s.tabStats.addEventListener("click",()=>y("stats")),[s.tabSettings,s.tabApiKeys,s.tabStats].forEach((e,t)=>{e.addEventListener("keydown",n=>{var o,a;const i=["settings","apiKeys","stats"];if(n.key==="ArrowRight"){n.preventDefault();const c=(t+1)%i.length;y(i[c]),(o=document.getElementById(`tab-${i[c]}`))==null||o.focus()}else if(n.key==="ArrowLeft"){n.preventDefault();const c=(t-1+i.length)%i.length;y(i[c]),(a=document.getElementById(`tab-${i[c]}`))==null||a.focus()}})}),s.addApiKey.addEventListener("click",()=>{var t;E("");const e=s.apiKeysList.querySelectorAll(".api-key-input");(t=e[e.length-1])==null||t.focus()})}function q(){const e=new C;e.add({key:"Escape",handler:()=>{s.processingOverlay.hidden}}),e.listen()}chrome.runtime.onMessage.addListener((e,t,n)=>(console.log("[Popup] Message:",e),e.action==="processing-update"?x(!0,e.details,e.progress):e.action==="processing-complete"?(x(!1),e.analytics&&(r=e.analytics,s.tabStats.disabled=!1,O())):e.action==="processing-error"&&(x(!1),h("✗",e.error)),n({status:"ok"}),!1));console.log("[Popup] Script loaded");
