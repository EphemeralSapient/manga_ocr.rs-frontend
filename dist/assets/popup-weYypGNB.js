var K=Object.defineProperty;var M=(e,t,o)=>t in e?K(e,t,{enumerable:!0,configurable:!0,writable:!0,value:o}):e[t]=o;var u=(e,t,o)=>M(e,typeof t!="symbol"?t+"":t,o);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))i(n);new MutationObserver(n=>{for(const a of n)if(a.type==="childList")for(const r of a.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&i(r)}).observe(document,{childList:!0,subtree:!0});function o(n){const a={};return n.integrity&&(a.integrity=n.integrity),n.referrerPolicy&&(a.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?a.credentials="include":n.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function i(n){if(n.ep)return;n.ep=!0;const a=o(n);fetch(n.href,a)}})();const x={serverUrl:"http://localhost:1420",apiKeys:[],translateModel:"gemini-flash-latest",includeFreeText:!1,bananaMode:!1,textStroke:!1,blurFreeTextBg:!1,cache:!0,metricsDetail:!0,theme:"auto"};async function D(){try{const e=await chrome.storage.sync.get(Object.keys(x));return{...x,...e}}catch(e){return console.error("[Storage] Failed to load settings:",e),x}}async function $(e){try{await chrome.storage.sync.set(e)}catch(t){throw console.error("[Storage] Failed to save settings:",t),t}}class C{constructor(t){u(this,"container");u(this,"previouslyFocused",null);u(this,"isActive",!1);u(this,"handleTab",t=>{if(!this.isActive||t.key!=="Tab")return;const o=this.getFocusableElements(),i=o[0],n=o[o.length-1];if(!(!i||!n)){if(t.shiftKey&&document.activeElement===i){t.preventDefault(),n.focus();return}!t.shiftKey&&document.activeElement===n&&(t.preventDefault(),i.focus())}});this.container=t}getFocusableElements(){const t=["a[href]","button:not([disabled])","textarea:not([disabled])","input:not([disabled])","select:not([disabled])",'[tabindex]:not([tabindex="-1"])'].join(",");return Array.from(this.container.querySelectorAll(t)).filter(i=>!i.hasAttribute("disabled")&&i.offsetParent!==null)}activate(){if(this.isActive)return;this.previouslyFocused=document.activeElement;const t=this.getFocusableElements();t.length>0&&t[0].focus(),document.addEventListener("keydown",this.handleTab),this.isActive=!0}deactivate(){this.isActive&&(document.removeEventListener("keydown",this.handleTab),this.previouslyFocused&&typeof this.previouslyFocused.focus=="function"&&this.previouslyFocused.focus(),this.isActive=!1)}isActivated(){return this.isActive}}function P(e){return new C(e)}function _(e,t){const o=e.key.toLowerCase()===t.key.toLowerCase(),i=!!t.ctrl===(e.ctrlKey||e.metaKey),n=!!t.shift===e.shiftKey,a=!!t.alt===e.altKey;return o&&i&&n&&a}class O{constructor(){u(this,"shortcuts",[]);u(this,"isListening",!1);u(this,"handleKeydown",t=>{for(const o of this.shortcuts)if(_(t,o)){t.preventDefault(),o.handler(t);return}})}add(t){this.shortcuts.push(t)}remove(t){const o=this.shortcuts.indexOf(t);o>-1&&this.shortcuts.splice(o,1)}listen(){this.isListening||(document.addEventListener("keydown",this.handleKeydown),this.isListening=!0)}stop(){this.isListening&&(document.removeEventListener("keydown",this.handleKeydown),this.isListening=!1)}getShortcuts(){return[...this.shortcuts]}}console.log("[Popup] Initializing...");let h="http://localhost:1420",c=null,k=null;const s={connectionStatus:document.getElementById("connectionStatus"),connectionLabel:document.getElementById("connectionLabel"),serverUrl:document.getElementById("serverUrl"),tabSettings:document.getElementById("tab-settings"),tabApiKeys:document.getElementById("tab-apiKeys"),tabStats:document.getElementById("tab-stats"),panelSettings:document.getElementById("panel-settings"),panelApiKeys:document.getElementById("panel-apiKeys"),panelStats:document.getElementById("panel-stats"),modelDropdown:document.getElementById("modelDropdown"),translateModel:document.getElementById("translateModel"),includeFreeText:document.getElementById("includeFreeText"),textStroke:document.getElementById("textStroke"),blurFreeTextBg:document.getElementById("blurFreeTextBg"),bananaMode:document.getElementById("bananaMode"),cache:document.getElementById("cache"),metricsDetail:document.getElementById("metricsDetail"),apiKeysList:document.getElementById("apiKeysList"),addApiKey:document.getElementById("addApiKey"),statsContent:document.getElementById("statsContent"),toast:document.getElementById("toast"),processingOverlay:document.getElementById("processingOverlay"),processingDetail:document.getElementById("processingDetail"),progressFill:document.getElementById("progressFill")};let A="gemini-flash-latest";document.addEventListener("DOMContentLoaded",async()=>{await q(),console.log("[Popup] Ready")});async function q(){await z(),H(),G(),I()}async function z(){try{const e=await D();e.serverUrl&&(h=e.serverUrl,s.serverUrl.value=h),A=e.translateModel,V(e.translateModel),s.includeFreeText.checked=e.includeFreeText,s.textStroke.checked=e.textStroke,s.blurFreeTextBg.checked=e.blurFreeTextBg,s.bananaMode.checked=e.bananaMode,s.cache.checked=e.cache,s.metricsDetail.checked=e.metricsDetail,e.apiKeys&&e.apiKeys.length>0?e.apiKeys.forEach(t=>L(t)):L(""),console.log("[Popup] Settings loaded")}catch(e){console.error("[Popup] Failed to load settings:",e),m("⚠️","Failed to load settings")}}async function l(){try{const e=s.apiKeysList.querySelectorAll(".api-key-input"),t=Array.from(e).map(i=>i.value.trim()).filter(i=>i.length>0),o={serverUrl:s.serverUrl.value,apiKeys:t,translateModel:A,includeFreeText:s.includeFreeText.checked,textStroke:s.textStroke.checked,blurFreeTextBg:s.blurFreeTextBg.checked,bananaMode:s.bananaMode.checked,cache:s.cache.checked,metricsDetail:s.metricsDetail.checked};await $(o),h=o.serverUrl,console.log("[Popup] Settings saved")}catch(e){console.error("[Popup] Failed to save settings:",e),m("✗","Failed to save settings")}}function L(e=""){const t=document.createElement("div");t.className="api-key-item",t.setAttribute("role","listitem");const o=`api-key-${Date.now()}`,i=`visibility-${Date.now()}`;t.innerHTML=`
    <div class="api-key-input-wrapper">
      <input
        type="password"
        id="${o}"
        class="api-key-input"
        placeholder="AIza..."
        value="${e}"
        aria-label="API Key"
        aria-describedby="${o}-help"
      >
      <span id="${o}-help" class="sr-only">Enter your Google Gemini API key</span>
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
  `;const n=t.querySelector(".api-key-input"),a=t.querySelector(".api-key-toggle-visibility"),r=t.querySelector(".api-key-remove"),b=a.querySelector(".icon-eye"),F=a.querySelector(".icon-eye-off");a.addEventListener("click",()=>{const p=n.type==="password";n.type=p?"text":"password",b.style.display=p?"none":"block",F.style.display=p?"block":"none",a.setAttribute("aria-pressed",p?"true":"false")}),r.addEventListener("click",()=>{s.apiKeysList.querySelectorAll(".api-key-item").length>1?(t.remove(),l()):m("⚠️","At least one API key field is required")}),n.addEventListener("blur",()=>{l()}),s.apiKeysList.appendChild(t)}async function I(){console.log("[Popup] Checking connection..."),E("checking");try{const e=new AbortController,t=setTimeout(()=>e.abort(),5e3),o=await fetch(`${h}/health`,{method:"GET",signal:e.signal});if(clearTimeout(t),o.ok)E("connected"),console.log("[Popup] Connected");else throw new Error(`HTTP ${o.status}`)}catch(e){console.error("[Popup] Connection failed:",e),E("error"),m("⚠️","Server offline or unreachable")}}function E(e){s.connectionStatus.className=`status-dot ${e}`;const t={connected:"Connected",checking:"Checking...",error:"Offline"};s.connectionLabel.textContent=t[e],s.connectionStatus.setAttribute("aria-label",`Server connection status: ${t[e]}`)}function U(){k&&clearTimeout(k),k=setTimeout(()=>{l(),I()},1e3)}function y(e){const t=[s.tabSettings,s.tabApiKeys,s.tabStats],o=[s.panelSettings,s.panelApiKeys,s.panelStats];t.forEach((i,n)=>{const a=i.id===`tab-${e}`;i.classList.toggle("active",a),i.setAttribute("aria-selected",a?"true":"false"),i.setAttribute("tabindex",a?"0":"-1"),o[n].classList.toggle("active",a),o[n].hidden=!a})}const T=P(s.processingOverlay);function w(e,t="Initializing...",o=0){var i;e?(s.processingOverlay.hidden=!1,s.processingDetail.textContent=t,s.progressFill.style.width=`${o}%`,(i=s.progressFill.parentElement)==null||i.setAttribute("aria-valuenow",o.toString()),T.activate()):(s.processingOverlay.hidden=!0,T.deactivate())}function N(){if(!c){s.statsContent.innerHTML=`
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
            ${c.total_images||0}
          </div>
        </div>
        <div class="stat-card">
          <div style="font-size: var(--text-xs); color: var(--text-secondary);">Regions</div>
          <div style="font-size: var(--text-2xl); font-weight: var(--font-bold); color: var(--text-primary);">
            ${c.total_regions||0}
          </div>
        </div>
        <div class="stat-card">
          <div style="font-size: var(--text-xs); color: var(--text-secondary);">Simple BG</div>
          <div style="font-size: var(--text-2xl); font-weight: var(--font-bold); color: var(--text-primary);">
            ${c.simple_bg_count||0}
          </div>
        </div>
        <div class="stat-card">
          <div style="font-size: var(--text-xs); color: var(--text-secondary);">Complex BG</div>
          <div style="font-size: var(--text-2xl); font-weight: var(--font-bold); color: var(--text-primary);">
            ${c.complex_bg_count||0}
          </div>
        </div>
      </div>
    </div>

    <div class="settings-group">
      <h3 class="settings-group-title">Processing Time</h3>
      ${d("Detection",g(c.phase1_time_ms))}
      ${d("Translation",g(c.phase2_time_ms))}
      ${d("Text Removal",g(c.phase3_time_ms))}
      ${d("Rendering",g(c.phase4_time_ms))}
      ${d("Total",`<strong>${g(c.total_time_ms)}</strong>`)}
    </div>

    ${c.input_tokens||c.output_tokens?`
    <div class="settings-group">
      <h3 class="settings-group-title">Token Usage</h3>
      ${d("Input Tokens",(c.input_tokens||0).toLocaleString())}
      ${d("Output Tokens",(c.output_tokens||0).toLocaleString())}
    </div>
    `:""}

    <div class="settings-group">
      <h3 class="settings-group-title">Cache Performance</h3>
      ${d("Hits",(c.cache_hits||0).toString())}
      ${d("Misses",(c.cache_misses||0).toString())}
      ${d("Hit Rate",R(c))}
    </div>
  `;s.statsContent.innerHTML=e}function d(e,t){return`
    <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-sm) 0;">
      <span style="font-size: var(--text-sm); color: var(--text-secondary);">${e}</span>
      <span style="font-size: var(--text-sm); color: var(--text-primary);">${t}</span>
    </div>
  `}function g(e){return e?e<1e3?`${Math.round(e)}ms`:`${(e/1e3).toFixed(2)}s`:"N/A"}function R(e){const t=e.cache_hits||0,o=e.cache_misses||0,i=t+o;return i===0?"N/A":`${(t/i*100).toFixed(1)}%`}let S=null;function m(e,t,o=3e3){const i=s.toast.querySelector(".toast-icon"),n=s.toast.querySelector(".toast-message");i.textContent=e,n.textContent=t,s.toast.hidden=!1,s.toast.classList.add("show"),S&&clearTimeout(S),S=setTimeout(()=>{s.toast.classList.remove("show"),setTimeout(()=>{s.toast.hidden=!0},200)},o)}function H(){s.serverUrl.addEventListener("input",U),s.serverUrl.addEventListener("blur",()=>{l(),I()}),s.includeFreeText.addEventListener("change",l),s.textStroke.addEventListener("change",l),s.blurFreeTextBg.addEventListener("change",l),s.bananaMode.addEventListener("change",l),s.cache.addEventListener("change",l),s.metricsDetail.addEventListener("change",l),j(),s.tabSettings.addEventListener("click",()=>y("settings")),s.tabApiKeys.addEventListener("click",()=>y("apiKeys")),s.tabStats.addEventListener("click",()=>y("stats")),[s.tabSettings,s.tabApiKeys,s.tabStats].forEach((e,t)=>{e.addEventListener("keydown",o=>{var n,a;const i=["settings","apiKeys","stats"];if(o.key==="ArrowRight"){o.preventDefault();const r=(t+1)%i.length;y(i[r]),(n=document.getElementById(`tab-${i[r]}`))==null||n.focus()}else if(o.key==="ArrowLeft"){o.preventDefault();const r=(t-1+i.length)%i.length;y(i[r]),(a=document.getElementById(`tab-${i[r]}`))==null||a.focus()}})}),s.addApiKey.addEventListener("click",()=>{var t;L("");const e=s.apiKeysList.querySelectorAll(".api-key-input");(t=e[e.length-1])==null||t.focus()})}function G(){const e=new O;e.add({key:"Escape",handler:()=>{s.processingOverlay.hidden}}),e.listen()}chrome.runtime.onMessage.addListener((e,t,o)=>(console.log("[Popup] Message:",e),e.action==="processing-update"?w(!0,e.details,e.progress):e.action==="processing-complete"?(w(!1),e.analytics&&(c=e.analytics,s.tabStats.disabled=!1,N())):e.action==="processing-error"&&(w(!1),m("✗",e.error)),o({status:"ok"}),!1));function j(){const e=s.translateModel,t=s.modelDropdown,o=t.querySelectorAll(".dropdown-item");e.addEventListener("click",n=>{n.stopPropagation(),t.classList.contains("open")?f():B()}),o.forEach(n=>{n.addEventListener("click",()=>{const a=n.dataset.value;a&&(v(a),f(),l())})}),document.addEventListener("click",n=>{t.contains(n.target)||f()}),e.addEventListener("keydown",n=>{if(n.key==="Enter"||n.key===" ")n.preventDefault(),t.classList.contains("open")?f():B();else if(n.key==="Escape")f();else if(n.key==="ArrowDown"&&t.classList.contains("open")){n.preventDefault();const a=i(),r=Math.min(a+1,o.length-1);v(o[r].dataset.value)}else if(n.key==="ArrowUp"&&t.classList.contains("open")){n.preventDefault();const a=i(),r=Math.max(a-1,0);v(o[r].dataset.value)}});function i(){return Array.from(o).findIndex(a=>a.classList.contains("selected"))}}function B(){s.modelDropdown.classList.add("open"),s.translateModel.setAttribute("aria-expanded","true")}function f(){s.modelDropdown.classList.remove("open"),s.translateModel.setAttribute("aria-expanded","false")}function v(e){const t=s.modelDropdown,o=t.querySelectorAll(".dropdown-item"),i=t.querySelector(".dropdown-selected");o.forEach(n=>{var r;const a=n.dataset.value===e;if(n.classList.toggle("selected",a),n.setAttribute("aria-selected",a?"true":"false"),a){const b=((r=n.querySelector(".dropdown-item-text"))==null?void 0:r.textContent)||"";i.textContent=b,A=e}})}function V(e){v(e)}console.log("[Popup] Script loaded");
