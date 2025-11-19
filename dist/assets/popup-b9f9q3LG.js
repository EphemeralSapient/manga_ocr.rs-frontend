const f={serverUrl:"http://localhost:1420",apiKeys:[],translateModel:"gemini-flash-latest",includeFreeText:!1,bananaMode:!1,textStroke:!1,blurFreeTextBg:!1,cache:!0,metricsDetail:!0,theme:"auto"};async function F(){try{const e=await chrome.storage.sync.get(Object.keys(f));return{...f,...e}}catch(e){return console.error("[Storage] Failed to load settings:",e),f}}async function K(e){try{await chrome.storage.sync.set(e)}catch(t){throw console.error("[Storage] Failed to save settings:",t),t}}class M{container;previouslyFocused=null;isActive=!1;constructor(t){this.container=t}getFocusableElements(){const t=["a[href]","button:not([disabled])","textarea:not([disabled])","input:not([disabled])","select:not([disabled])",'[tabindex]:not([tabindex="-1"])'].join(",");return Array.from(this.container.querySelectorAll(t)).filter(i=>!i.hasAttribute("disabled")&&i.offsetParent!==null)}handleTab=t=>{if(!this.isActive||t.key!=="Tab")return;const n=this.getFocusableElements(),i=n[0],o=n[n.length-1];if(!(!i||!o)){if(t.shiftKey&&document.activeElement===i){t.preventDefault(),o.focus();return}!t.shiftKey&&document.activeElement===o&&(t.preventDefault(),i.focus())}};activate(){if(this.isActive)return;this.previouslyFocused=document.activeElement;const t=this.getFocusableElements();t.length>0&&t[0].focus(),document.addEventListener("keydown",this.handleTab),this.isActive=!0}deactivate(){this.isActive&&(document.removeEventListener("keydown",this.handleTab),this.previouslyFocused&&typeof this.previouslyFocused.focus=="function"&&this.previouslyFocused.focus(),this.isActive=!1)}isActivated(){return this.isActive}}function D(e){return new M(e)}function $(e,t){const n=e.key.toLowerCase()===t.key.toLowerCase(),i=!!t.ctrl===(e.ctrlKey||e.metaKey),o=!!t.shift===e.shiftKey,a=!!t.alt===e.altKey;return n&&i&&o&&a}class C{shortcuts=[];isListening=!1;add(t){this.shortcuts.push(t)}remove(t){const n=this.shortcuts.indexOf(t);n>-1&&this.shortcuts.splice(n,1)}handleKeydown=t=>{for(const n of this.shortcuts)if($(t,n)){t.preventDefault(),n.handler(t);return}};listen(){this.isListening||(document.addEventListener("keydown",this.handleKeydown),this.isListening=!0)}stop(){this.isListening&&(document.removeEventListener("keydown",this.handleKeydown),this.isListening=!1)}getShortcuts(){return[...this.shortcuts]}}console.log("[Popup] Initializing...");let h="http://localhost:1420",r=null,b=null;const s={connectionStatus:document.getElementById("connectionStatus"),connectionLabel:document.getElementById("connectionLabel"),serverUrl:document.getElementById("serverUrl"),tabSettings:document.getElementById("tab-settings"),tabApiKeys:document.getElementById("tab-apiKeys"),tabStats:document.getElementById("tab-stats"),panelSettings:document.getElementById("panel-settings"),panelApiKeys:document.getElementById("panel-apiKeys"),panelStats:document.getElementById("panel-stats"),modelDropdown:document.getElementById("modelDropdown"),translateModel:document.getElementById("translateModel"),includeFreeText:document.getElementById("includeFreeText"),textStroke:document.getElementById("textStroke"),blurFreeTextBg:document.getElementById("blurFreeTextBg"),bananaMode:document.getElementById("bananaMode"),cache:document.getElementById("cache"),metricsDetail:document.getElementById("metricsDetail"),apiKeysList:document.getElementById("apiKeysList"),addApiKey:document.getElementById("addApiKey"),statsContent:document.getElementById("statsContent"),toast:document.getElementById("toast"),processingOverlay:document.getElementById("processingOverlay"),processingDetail:document.getElementById("processingDetail"),progressFill:document.getElementById("progressFill")};let S="gemini-flash-latest";document.addEventListener("DOMContentLoaded",async()=>{await P(),console.log("[Popup] Ready")});async function P(){await _(),O(),R(),L()}async function _(){try{const e=await F();e.serverUrl&&(h=e.serverUrl,s.serverUrl.value=h),S=e.translateModel,G(e.translateModel),s.includeFreeText.checked=e.includeFreeText,s.textStroke.checked=e.textStroke,s.blurFreeTextBg.checked=e.blurFreeTextBg,s.bananaMode.checked=e.bananaMode,s.cache.checked=e.cache,s.metricsDetail.checked=e.metricsDetail,e.apiKeys&&e.apiKeys.length>0?e.apiKeys.forEach(t=>w(t)):w(""),console.log("[Popup] Settings loaded")}catch(e){console.error("[Popup] Failed to load settings:",e),v("⚠️","Failed to load settings")}}async function c(){try{const e=s.apiKeysList.querySelectorAll(".api-key-input"),t=Array.from(e).map(i=>i.value.trim()).filter(i=>i.length>0),n={serverUrl:s.serverUrl.value,apiKeys:t,translateModel:S,includeFreeText:s.includeFreeText.checked,textStroke:s.textStroke.checked,blurFreeTextBg:s.blurFreeTextBg.checked,bananaMode:s.bananaMode.checked,cache:s.cache.checked,metricsDetail:s.metricsDetail.checked};await K(n),h=n.serverUrl,console.log("[Popup] Settings saved")}catch(e){console.error("[Popup] Failed to save settings:",e),v("✗","Failed to save settings")}}function w(e=""){const t=document.createElement("div");t.className="api-key-item",t.setAttribute("role","listitem");const n=`api-key-${Date.now()}`,i=`visibility-${Date.now()}`;t.innerHTML=`
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
  `;const o=t.querySelector(".api-key-input"),a=t.querySelector(".api-key-toggle-visibility"),d=t.querySelector(".api-key-remove"),I=a.querySelector(".icon-eye"),B=a.querySelector(".icon-eye-off");a.addEventListener("click",()=>{const u=o.type==="password";o.type=u?"text":"password",I.style.display=u?"none":"block",B.style.display=u?"block":"none",a.setAttribute("aria-pressed",u?"true":"false")}),d.addEventListener("click",()=>{s.apiKeysList.querySelectorAll(".api-key-item").length>1?(t.remove(),c()):v("⚠️","At least one API key field is required")}),o.addEventListener("blur",()=>{c()}),s.apiKeysList.appendChild(t)}async function L(){console.log("[Popup] Checking connection..."),x("checking");try{const e=new AbortController,t=setTimeout(()=>e.abort(),5e3),n=await fetch(`${h}/health`,{method:"GET",signal:e.signal});if(clearTimeout(t),n.ok)x("connected"),console.log("[Popup] Connected");else throw new Error(`HTTP ${n.status}`)}catch(e){console.error("[Popup] Connection failed:",e),x("error"),v("⚠️","Server offline or unreachable")}}function x(e){s.connectionStatus.className=`status-dot ${e}`;const t={connected:"Connected",checking:"Checking...",error:"Offline"};s.connectionLabel.textContent=t[e],s.connectionStatus.setAttribute("aria-label",`Server connection status: ${t[e]}`)}function q(){b&&clearTimeout(b),b=setTimeout(()=>{c(),L()},1e3)}function p(e){const t=[s.tabSettings,s.tabApiKeys,s.tabStats],n=[s.panelSettings,s.panelApiKeys,s.panelStats];t.forEach((i,o)=>{const a=i.id===`tab-${e}`;i.classList.toggle("active",a),i.setAttribute("aria-selected",a?"true":"false"),i.setAttribute("tabindex",a?"0":"-1"),n[o].classList.toggle("active",a),n[o].hidden=!a})}const A=D(s.processingOverlay);function k(e,t="Initializing...",n=0){e?(s.processingOverlay.hidden=!1,s.processingDetail.textContent=t,s.progressFill.style.width=`${n}%`,s.progressFill.parentElement?.setAttribute("aria-valuenow",n.toString()),A.activate()):(s.processingOverlay.hidden=!0,A.deactivate())}function z(){if(!r){s.statsContent.innerHTML=`
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
      ${l("Detection",y(r.phase1_time_ms))}
      ${l("Translation",y(r.phase2_time_ms))}
      ${l("Text Removal",y(r.phase3_time_ms))}
      ${l("Rendering",y(r.phase4_time_ms))}
      ${l("Total",`<strong>${y(r.total_time_ms)}</strong>`)}
    </div>

    ${r.input_tokens||r.output_tokens?`
    <div class="settings-group">
      <h3 class="settings-group-title">Token Usage</h3>
      ${l("Input Tokens",(r.input_tokens||0).toLocaleString())}
      ${l("Output Tokens",(r.output_tokens||0).toLocaleString())}
    </div>
    `:""}

    <div class="settings-group">
      <h3 class="settings-group-title">Cache Performance</h3>
      ${l("Hits",(r.cache_hits||0).toString())}
      ${l("Misses",(r.cache_misses||0).toString())}
      ${l("Hit Rate",U(r))}
    </div>
  `;s.statsContent.innerHTML=e}function l(e,t){return`
    <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-sm) 0;">
      <span style="font-size: var(--text-sm); color: var(--text-secondary);">${e}</span>
      <span style="font-size: var(--text-sm); color: var(--text-primary);">${t}</span>
    </div>
  `}function y(e){return e?e<1e3?`${Math.round(e)}ms`:`${(e/1e3).toFixed(2)}s`:"N/A"}function U(e){const t=e.cache_hits||0,n=e.cache_misses||0,i=t+n;return i===0?"N/A":`${(t/i*100).toFixed(1)}%`}let E=null;function v(e,t,n=3e3){const i=s.toast.querySelector(".toast-icon"),o=s.toast.querySelector(".toast-message");i.textContent=e,o.textContent=t,s.toast.hidden=!1,s.toast.classList.add("show"),E&&clearTimeout(E),E=setTimeout(()=>{s.toast.classList.remove("show"),setTimeout(()=>{s.toast.hidden=!0},200)},n)}function O(){s.serverUrl.addEventListener("input",q),s.serverUrl.addEventListener("blur",()=>{c(),L()}),s.includeFreeText.addEventListener("change",c),s.textStroke.addEventListener("change",c),s.blurFreeTextBg.addEventListener("change",c),s.bananaMode.addEventListener("change",c),s.cache.addEventListener("change",c),s.metricsDetail.addEventListener("change",c),H(),s.tabSettings.addEventListener("click",()=>p("settings")),s.tabApiKeys.addEventListener("click",()=>p("apiKeys")),s.tabStats.addEventListener("click",()=>p("stats")),[s.tabSettings,s.tabApiKeys,s.tabStats].forEach((e,t)=>{e.addEventListener("keydown",n=>{const i=["settings","apiKeys","stats"];if(n.key==="ArrowRight"){n.preventDefault();const o=(t+1)%i.length;p(i[o]),document.getElementById(`tab-${i[o]}`)?.focus()}else if(n.key==="ArrowLeft"){n.preventDefault();const o=(t-1+i.length)%i.length;p(i[o]),document.getElementById(`tab-${i[o]}`)?.focus()}})}),s.addApiKey.addEventListener("click",()=>{w("");const e=s.apiKeysList.querySelectorAll(".api-key-input");e[e.length-1]?.focus()})}function R(){const e=new C;e.add({key:"Escape",handler:()=>{}}),e.listen()}chrome.runtime.onMessage.addListener((e,t,n)=>(console.log("[Popup] Message:",e),e.action==="processing-update"?k(!0,e.details,e.progress):e.action==="processing-complete"?(k(!1),e.analytics&&(r=e.analytics,s.tabStats.disabled=!1,z())):e.action==="processing-error"&&(k(!1),v("✗",e.error)),n({status:"ok"}),!1));function H(){const e=s.translateModel,t=s.modelDropdown,n=t.querySelectorAll(".dropdown-item");e.addEventListener("click",o=>{o.stopPropagation(),t.classList.contains("open")?g():T()}),n.forEach(o=>{o.addEventListener("click",()=>{const a=o.dataset.value;a&&(m(a),g(),c())})}),document.addEventListener("click",o=>{t.contains(o.target)||g()}),e.addEventListener("keydown",o=>{if(o.key==="Enter"||o.key===" ")o.preventDefault(),t.classList.contains("open")?g():T();else if(o.key==="Escape")g();else if(o.key==="ArrowDown"&&t.classList.contains("open")){o.preventDefault();const a=i(),d=Math.min(a+1,n.length-1);m(n[d].dataset.value)}else if(o.key==="ArrowUp"&&t.classList.contains("open")){o.preventDefault();const a=i(),d=Math.max(a-1,0);m(n[d].dataset.value)}});function i(){return Array.from(n).findIndex(a=>a.classList.contains("selected"))}}function T(){s.modelDropdown.classList.add("open"),s.translateModel.setAttribute("aria-expanded","true")}function g(){s.modelDropdown.classList.remove("open"),s.translateModel.setAttribute("aria-expanded","false")}function m(e){const t=s.modelDropdown,n=t.querySelectorAll(".dropdown-item"),i=t.querySelector(".dropdown-selected");n.forEach(o=>{const a=o.dataset.value===e;if(o.classList.toggle("selected",a),o.setAttribute("aria-selected",a?"true":"false"),a){const d=o.querySelector(".dropdown-item-text")?.textContent||"";i.textContent=d,S=e}})}function G(e){m(e)}console.log("[Popup] Script loaded");
