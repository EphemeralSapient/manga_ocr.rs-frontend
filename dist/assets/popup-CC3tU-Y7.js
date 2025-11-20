import{l as B,a as U,r as q,s as O}from"./storage-D0JZkDY4.js";class R{container;previouslyFocused=null;isActive=!1;constructor(n){this.container=n}getFocusableElements(){const n=["a[href]","button:not([disabled])","textarea:not([disabled])","input:not([disabled])","select:not([disabled])",'[tabindex]:not([tabindex="-1"])'].join(",");return Array.from(this.container.querySelectorAll(n)).filter(s=>!s.hasAttribute("disabled")&&s.offsetParent!==null)}handleTab=n=>{if(!this.isActive||n.key!=="Tab")return;const i=this.getFocusableElements(),s=i[0],a=i[i.length-1];if(!(!s||!a)){if(n.shiftKey&&document.activeElement===s){n.preventDefault(),a.focus();return}!n.shiftKey&&document.activeElement===a&&(n.preventDefault(),s.focus())}};activate(){if(this.isActive)return;this.previouslyFocused=document.activeElement;const n=this.getFocusableElements();n.length>0&&n[0].focus(),document.addEventListener("keydown",this.handleTab),this.isActive=!0}deactivate(){this.isActive&&(document.removeEventListener("keydown",this.handleTab),this.previouslyFocused&&typeof this.previouslyFocused.focus=="function"&&this.previouslyFocused.focus(),this.isActive=!1)}isActivated(){return this.isActive}}function N(e){return new R(e)}function H(e,n){const i=e.key.toLowerCase()===n.key.toLowerCase(),s=!!n.ctrl===(e.ctrlKey||e.metaKey),a=!!n.shift===e.shiftKey,o=!!n.alt===e.altKey;return i&&s&&a&&o}class V{shortcuts=[];isListening=!1;add(n){this.shortcuts.push(n)}remove(n){const i=this.shortcuts.indexOf(n);i>-1&&this.shortcuts.splice(i,1)}handleKeydown=n=>{for(const i of this.shortcuts)if(H(n,i)){n.preventDefault(),i.handler(n);return}};listen(){this.isListening||(document.addEventListener("keydown",this.handleKeydown),this.isListening=!0)}stop(){this.isListening&&(document.removeEventListener("keydown",this.handleKeydown),this.isListening=!1)}getShortcuts(){return[...this.shortcuts]}}console.log("[Popup] Initializing...");let b="http://localhost:1420",p=null,l=null,E=null;const t={connectionStatus:document.getElementById("connectionStatus"),connectionLabel:document.getElementById("connectionLabel"),serverUrl:document.getElementById("serverUrl"),tabSettings:document.getElementById("tab-settings"),tabApiKeys:document.getElementById("tab-apiKeys"),tabStats:document.getElementById("tab-stats"),panelSettings:document.getElementById("panel-settings"),panelApiKeys:document.getElementById("panel-apiKeys"),panelStats:document.getElementById("panel-stats"),modelDropdown:document.getElementById("modelDropdown"),translateModel:document.getElementById("translateModel"),includeFreeText:document.getElementById("includeFreeText"),textStroke:document.getElementById("textStroke"),blurFreeTextBg:document.getElementById("blurFreeTextBg"),bananaMode:document.getElementById("bananaMode"),cache:document.getElementById("cache"),metricsDetail:document.getElementById("metricsDetail"),geminiThinking:document.getElementById("geminiThinking"),tighterBounds:document.getElementById("tighterBounds"),useMask:document.getElementById("useMask"),mergeImg:document.getElementById("mergeImg"),batchSize:document.getElementById("batchSize"),sessionLimit:document.getElementById("sessionLimit"),backendInfo:document.getElementById("backendInfo"),backendType:document.getElementById("backendType"),backendAcceleration:document.getElementById("backendAcceleration"),mergeImgField:document.getElementById("mergeImgField"),batchSizeField:document.getElementById("batchSizeField"),sessionLimitField:document.getElementById("sessionLimitField"),apiKeysList:document.getElementById("apiKeysList"),addApiKey:document.getElementById("addApiKey"),statsContent:document.getElementById("statsContent"),toast:document.getElementById("toast"),processingOverlay:document.getElementById("processingOverlay"),processingDetail:document.getElementById("processingDetail"),progressFill:document.getElementById("progressFill")};let M="gemini-flash-latest";document.addEventListener("DOMContentLoaded",async()=>{await j(),console.log("[Popup] Ready")});async function j(){await G(),l=await B(),C(),Q(),Z(),ee(),F()}async function G(){try{const e=await U();e.serverUrl&&(b=e.serverUrl,t.serverUrl.value=b),M=e.translateModel,se(e.translateModel),t.includeFreeText.checked=e.includeFreeText,t.textStroke.checked=e.textStroke,t.blurFreeTextBg.checked=e.blurFreeTextBg,t.bananaMode.checked=e.bananaMode,t.cache.checked=e.cache,t.metricsDetail.checked=e.metricsDetail,t.geminiThinking.checked=e.geminiThinking??!1,t.tighterBounds.checked=e.tighterBounds??!0,t.useMask.checked=e.useMask??!0,t.mergeImg.checked=e.mergeImg??!1,t.batchSize.value=String(e.batchSize??5),t.sessionLimit.value=String(e.sessionLimit??8),e.apiKeys&&e.apiKeys.length>0?e.apiKeys.forEach(n=>A(n)):A(""),console.log("[Popup] Settings loaded")}catch(e){console.error("[Popup] Failed to load settings:",e),y("⚠️","Failed to load settings")}}async function d(){try{const e=t.apiKeysList.querySelectorAll(".api-key-input"),n=Array.from(e).map(s=>s.value.trim()).filter(s=>s.length>0),i={serverUrl:t.serverUrl.value,apiKeys:n,translateModel:M,includeFreeText:t.includeFreeText.checked,textStroke:t.textStroke.checked,blurFreeTextBg:t.blurFreeTextBg.checked,bananaMode:t.bananaMode.checked,cache:t.cache.checked,metricsDetail:t.metricsDetail.checked,geminiThinking:t.geminiThinking.checked,tighterBounds:t.tighterBounds.checked,useMask:t.useMask.checked,mergeImg:t.mergeImg.checked,batchSize:Math.max(1,Math.min(50,parseInt(t.batchSize.value)||5)),sessionLimit:Math.max(1,Math.min(32,parseInt(t.sessionLimit.value)||8))};await O(i),b=i.serverUrl,console.log("[Popup] Settings saved")}catch(e){console.error("[Popup] Failed to save settings:",e),y("✗","Failed to save settings")}}async function h(e,n=!0){const i=e==="mask"?"/mask-toggle":e==="mergeimg"?"/mergeimg-toggle":"/thinking-toggle",s=e==="mask"?"Mask mode":e==="mergeimg"?"Batch inference":"Gemini thinking";try{const a=await fetch(`${b}${i}`,{method:"POST"});if(a.ok){const o=await a.json(),r=e==="mask"?o.mask_enabled:e==="mergeimg"?o.merge_img_enabled:o.gemini_thinking_enabled;console.log(`[Popup] ${s} synced: ${r}`),n&&y("✓",`${s} ${r?"enabled":"disabled"}`)}else throw new Error(`HTTP ${a.status}`)}catch(a){console.error(`[Popup] Failed to sync ${s}:`,a),n&&y("⚠️",`Failed to sync ${s} with server`)}}async function X(){try{const e=await fetch(`${b}/health`);if(!e.ok)return;const n=await e.json();if(!n.config)return;n.backend&&Y(n.backend);const i=n.config.mask_enabled!==t.useMask.checked,s=n.config.merge_img_enabled!==t.mergeImg.checked,a=n.config.gemini_thinking_enabled!==t.geminiThinking.checked;i||s||a?(console.log("[Popup] Server state mismatch detected, syncing frontend settings to server"),i&&(console.log(`  - Mask: server=${n.config.mask_enabled}, local=${t.useMask.checked} → syncing`),await h("mask",!1)),s&&(console.log(`  - MergeImg: server=${n.config.merge_img_enabled}, local=${t.mergeImg.checked} → syncing`),await h("mergeimg",!1)),a&&(console.log(`  - Thinking: server=${n.config.gemini_thinking_enabled}, local=${t.geminiThinking.checked} → syncing`),await h("thinking",!1)),console.log("[Popup] ✓ Frontend settings synced to server")):console.log("[Popup] ✓ Server state matches frontend, no sync needed")}catch(e){console.error("[Popup] Failed to check/sync server settings:",e)}}function Y(e){t.backendType.textContent=e,t.backendInfo.style.display="block";const n=["DirectML","DirectML+CPU","CUDA","TensorRT","CoreML"],i=["XNNPACK","OpenVINO","OpenVINO-CPU"];let s="",a=!1;n.some(o=>e.includes(o))?(s="(GPU Accelerated)",a=e.includes("DirectML")):i.some(o=>e.includes(o))?s="(CPU Accelerated)":e==="CPU"&&(s="(Slow CPU Backend)"),t.backendAcceleration.textContent=s,a?(console.log("[Popup] DirectML detected, disabling batch options"),t.mergeImg.checked=!1,t.mergeImg.disabled=!0,t.mergeImgField.style.opacity="0.5",t.mergeImgField.style.pointerEvents="none",t.batchSizeField.style.opacity="0.5",t.batchSizeField.style.pointerEvents="none",t.batchSize.disabled=!0,t.sessionLimitField.style.opacity="0.5",t.sessionLimitField.style.pointerEvents="none",t.sessionLimit.disabled=!0):(t.mergeImg.disabled=!1,t.mergeImgField.style.opacity="1",t.mergeImgField.style.pointerEvents="auto",t.batchSizeField.style.opacity="1",t.batchSizeField.style.pointerEvents="auto",t.batchSize.disabled=!1,t.sessionLimitField.style.opacity="1",t.sessionLimitField.style.pointerEvents="auto",t.sessionLimit.disabled=!1)}function A(e=""){const n=document.createElement("div");n.className="api-key-item",n.setAttribute("role","listitem");const i=`api-key-${Date.now()}`,s=`visibility-${Date.now()}`;n.innerHTML=`
    <div class="api-key-input-wrapper">
      <input
        type="password"
        id="${i}"
        class="api-key-input"
        placeholder="AIza..."
        value="${e}"
        aria-label="API Key"
        aria-describedby="${i}-help"
      >
      <span id="${i}-help" class="sr-only">Enter your Google Gemini API key</span>
      <button
        id="${s}"
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
  `;const a=n.querySelector(".api-key-input"),o=n.querySelector(".api-key-toggle-visibility"),r=n.querySelector(".api-key-remove"),c=o.querySelector(".icon-eye"),m=o.querySelector(".icon-eye-off");o.addEventListener("click",()=>{const u=a.type==="password";a.type=u?"text":"password",c.style.display=u?"none":"block",m.style.display=u?"block":"none",o.setAttribute("aria-pressed",u?"true":"false")}),r.addEventListener("click",()=>{t.apiKeysList.querySelectorAll(".api-key-item").length>1?(n.remove(),d()):y("⚠️","At least one API key field is required")}),a.addEventListener("blur",()=>{d()}),t.apiKeysList.appendChild(n)}async function F(){console.log("[Popup] Checking connection..."),I("checking");try{const e=new AbortController,n=setTimeout(()=>e.abort(),5e3),i=await fetch(`${b}/health`,{method:"GET",signal:e.signal});if(clearTimeout(n),i.ok)I("connected"),console.log("[Popup] Connected"),await X();else throw new Error(`HTTP ${i.status}`)}catch(e){console.error("[Popup] Connection failed:",e),I("error"),y("⚠️","Server offline or unreachable")}}function I(e){t.connectionStatus.className=`status-dot ${e}`;const n={connected:"Connected",checking:"Checking...",error:"Offline"};t.connectionLabel.textContent=n[e],t.connectionStatus.setAttribute("aria-label",`Server connection status: ${n[e]}`)}function J(){E&&clearTimeout(E),E=setTimeout(()=>{d(),F()},1e3)}function k(e){const n=[t.tabSettings,t.tabApiKeys,t.tabStats],i=[t.panelSettings,t.panelApiKeys,t.panelStats];n.forEach((s,a)=>{const o=s.id===`tab-${e}`;s.classList.toggle("active",o),s.setAttribute("aria-selected",o?"true":"false"),s.setAttribute("tabindex",o?"0":"-1"),i[a].classList.toggle("active",o),i[a].hidden=!o})}const D=N(t.processingOverlay);function w(e,n="Initializing...",i=0){e?(t.processingOverlay.hidden=!1,t.processingDetail.textContent=n,t.progressFill.style.width=`${i}%`,t.progressFill.parentElement?.setAttribute("aria-valuenow",i.toString()),D.activate()):(t.processingOverlay.hidden=!0,D.deactivate())}function C(){if((p||l&&l.totalSessions>0)&&(t.tabStats.disabled=!1),!p&&(!l||l.totalSessions===0)){t.statsContent.innerHTML=`
      <div class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 3v18h18M18 17V9m-5 8V5m-5 12v-3"/>
        </svg>
        <h3 class="empty-title">No Statistics Available</h3>
        <p class="empty-description">
          Process some manga images to see detailed statistics and analytics.
        </p>
      </div>
    `;return}let e="";if(p&&(e+=`
    <div class="settings-group" style="border-left: 3px solid var(--primary);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-sm);">
        <h3 class="settings-group-title">Latest Session</h3>
        <span style="font-size: var(--text-xs); color: var(--primary); font-weight: var(--font-semibold);">RECENT</span>
      </div>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-md);">
        <div class="stat-card">
          <div style="font-size: var(--text-xs); color: var(--text-secondary);">Images</div>
          <div style="font-size: var(--text-2xl); font-weight: var(--font-bold); color: var(--text-primary);">
            ${p.total_images||0}
          </div>
        </div>
        <div class="stat-card">
          <div style="font-size: var(--text-xs); color: var(--text-secondary);">Regions</div>
          <div style="font-size: var(--text-2xl); font-weight: var(--font-bold); color: var(--text-primary);">
            ${p.total_regions||0}
          </div>
        </div>
      </div>
      ${f("Processing Time",P(p.total_time_ms),!0)}
      ${p.input_tokens||p.output_tokens?f("Tokens Used",((p.input_tokens||0)+(p.output_tokens||0)).toLocaleString(),!0):""}
    </div>
    `),l&&l.totalSessions>0){const i=l.totalProcessingTimeMs/l.totalSessions,s=l.totalImages/l.totalSessions,a=l.totalInputTokens+l.totalOutputTokens,o=l.totalCacheHits+l.totalCacheMisses,r=o>0?(l.totalCacheHits/o*100).toFixed(1)+"%":"N/A";e+=`
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
            ${l.totalSessions.toLocaleString()}
          </div>
        </div>
        <div class="stat-card">
          <div style="font-size: var(--text-xs); color: var(--text-secondary);">Total Images</div>
          <div style="font-size: var(--text-2xl); font-weight: var(--font-bold); color: var(--text-primary);">
            ${l.totalImages.toLocaleString()}
          </div>
        </div>
        <div class="stat-card">
          <div style="font-size: var(--text-xs); color: var(--text-secondary);">Total Regions</div>
          <div style="font-size: var(--text-2xl); font-weight: var(--font-bold); color: var(--text-primary);">
            ${l.totalRegions.toLocaleString()}
          </div>
        </div>
        <div class="stat-card">
          <div style="font-size: var(--text-xs); color: var(--text-secondary);">API Calls</div>
          <div style="font-size: var(--text-2xl); font-weight: var(--font-bold); color: var(--text-primary);">
            ${l.totalApiCalls.toLocaleString()}
          </div>
        </div>
      </div>

      <h3 class="settings-group-title" style="margin-top: var(--space-lg); margin-bottom: var(--space-md);">Averages</h3>
      ${f("Avg. Images/Session",s.toFixed(1))}
      ${f("Avg. Time/Session",P(i))}
      ${a>0?f("Total Tokens",a.toLocaleString()):""}
      ${f("Cache Hit Rate",r)}

      ${l.firstProcessedAt?`
      <div style="margin-top: var(--space-md); padding-top: var(--space-md); border-top: 1px solid var(--border-subtle); font-size: var(--text-xs); color: var(--text-tertiary); text-align: center;">
        First used: ${new Date(l.firstProcessedAt).toLocaleDateString()}
      </div>
      `:""}
    </div>
    `}t.statsContent.innerHTML=e;const n=document.getElementById("resetStats");n&&n.addEventListener("click",async()=>{confirm("Reset all lifetime statistics? This cannot be undone.")&&(await q(),l=await B(),C(),y("✓","Statistics reset successfully"))})}function f(e,n,i=!1){return`
    <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-sm) 0; ${i?"margin-top: var(--space-sm);":""}">
      <span style="font-size: var(--text-sm); color: var(--text-secondary);">${e}</span>
      <span style="font-size: var(--text-sm); color: var(--text-primary);">${n}</span>
    </div>
  `}function P(e){return e?e<1e3?`${Math.round(e)}ms`:`${(e/1e3).toFixed(2)}s`:"N/A"}let L=null;function y(e,n,i=3e3){const s=t.toast.querySelector(".toast-icon"),a=t.toast.querySelector(".toast-message");s.textContent=e,a.textContent=n,t.toast.hidden=!1,t.toast.classList.add("show"),L&&clearTimeout(L),L=setTimeout(()=>{t.toast.classList.remove("show"),setTimeout(()=>{t.toast.hidden=!0},200)},i)}function Q(){t.serverUrl.addEventListener("input",J),t.serverUrl.addEventListener("blur",()=>{d(),F()}),t.includeFreeText.addEventListener("change",d),t.textStroke.addEventListener("change",d),t.blurFreeTextBg.addEventListener("change",d),t.bananaMode.addEventListener("change",d),t.cache.addEventListener("change",d),t.metricsDetail.addEventListener("change",d),t.geminiThinking.addEventListener("change",d),t.tighterBounds.addEventListener("change",d),t.batchSize.addEventListener("change",d),t.sessionLimit.addEventListener("change",d),t.useMask.addEventListener("change",async()=>{await d(),await h("mask")}),t.mergeImg.addEventListener("change",async()=>{await d(),await h("mergeimg")}),t.geminiThinking.addEventListener("change",async()=>{await d(),await h("thinking")}),ne(),t.tabSettings.addEventListener("click",()=>k("settings")),t.tabApiKeys.addEventListener("click",()=>k("apiKeys")),t.tabStats.addEventListener("click",()=>k("stats")),[t.tabSettings,t.tabApiKeys,t.tabStats].forEach((e,n)=>{e.addEventListener("keydown",i=>{const s=["settings","apiKeys","stats"];if(i.key==="ArrowRight"){i.preventDefault();const a=(n+1)%s.length;k(s[a]),document.getElementById(`tab-${s[a]}`)?.focus()}else if(i.key==="ArrowLeft"){i.preventDefault();const a=(n-1+s.length)%s.length;k(s[a]),document.getElementById(`tab-${s[a]}`)?.focus()}})}),t.addApiKey.addEventListener("click",()=>{A("");const e=t.apiKeysList.querySelectorAll(".api-key-input");e[e.length-1]?.focus()}),W()}function W(){document.querySelectorAll(".number-stepper-btn").forEach(n=>{const i=n.dataset.target;if(!i)return;const s=document.getElementById(i);if(!s)return;const a=n.classList.contains("increment"),o=n.classList.contains("decrement"),r=()=>{const c=parseInt(s.value)||0,m=parseInt(s.min)||0,u=parseInt(s.max)||1/0,g=s.closest(".number-input-wrapper");if(!g)return;const v=g.querySelector(".number-stepper-btn.decrement"),$=g.querySelector(".number-stepper-btn.increment");v&&(v.disabled=c<=m),$&&($.disabled=c>=u)};n.addEventListener("click",()=>{const c=parseInt(s.value)||0,m=parseInt(s.min)||0,u=parseInt(s.max)||1/0,g=parseInt(s.step)||1;let v=c;a&&c<u?v=Math.min(c+g,u):o&&c>m&&(v=Math.max(c-g,m)),v!==c&&(s.value=String(v),s.dispatchEvent(new Event("change",{bubbles:!0})),r())}),s.addEventListener("input",r),s.addEventListener("change",r),s.addEventListener("keydown",c=>{const m=parseInt(s.min)||0,u=parseInt(s.max)||1/0;let g=parseInt(s.value)||0;c.key==="ArrowUp"?(c.preventDefault(),g<u&&(s.value=String(Math.min(g+1,u)),s.dispatchEvent(new Event("change",{bubbles:!0})),r())):c.key==="ArrowDown"&&(c.preventDefault(),g>m&&(s.value=String(Math.max(g-1,m)),s.dispatchEvent(new Event("change",{bubbles:!0})),r()))}),r()})}function Z(){const e=new V;e.add({key:"Escape",handler:()=>{}}),e.listen()}const T="accordionState";async function ee(){const e=document.querySelectorAll(".accordion-header"),n=await _();e.forEach(i=>{const s=i.getAttribute("aria-controls");if(!s)return;const a=document.getElementById(s);if(!a)return;const o=n[s]??!0;K(i,a,o),i.addEventListener("click",()=>{const c=!(i.getAttribute("aria-expanded")==="true");K(i,a,c),te(s,c)}),i.addEventListener("keydown",r=>{if(r.key==="ArrowDown"||r.key==="ArrowUp"){r.preventDefault();const c=Array.from(e),m=c.indexOf(i),u=r.key==="ArrowDown"?(m+1)%c.length:(m-1+c.length)%c.length;c[u].focus()}})})}function K(e,n,i){e.setAttribute("aria-expanded",i.toString()),n.hidden=!i}async function _(){try{return(await chrome.storage.local.get(T))[T]||{}}catch(e){return console.error("[Accordion] Failed to load state:",e),{}}}async function te(e,n){try{const i=await _();i[e]=n,await chrome.storage.local.set({[T]:i})}catch(i){console.error("[Accordion] Failed to save state:",i)}}chrome.runtime.onMessage.addListener((e,n,i)=>(console.log("[Popup] Message:",e),e.action==="processing-update"?w(!0,e.details,e.progress):e.action==="processing-complete"?(w(!1),e.analytics&&(p=e.analytics,B().then(s=>{l=s,C()}))):e.action==="processing-error"&&(w(!1),y("✗",e.error)),i({status:"ok"}),!1));function ne(){const e=t.translateModel,n=t.modelDropdown,i=n.querySelectorAll(".dropdown-item");e.addEventListener("click",a=>{a.stopPropagation(),n.classList.contains("open")?x():z()}),i.forEach(a=>{a.addEventListener("click",()=>{const o=a.dataset.value;o&&(S(o),x(),d())})}),document.addEventListener("click",a=>{n.contains(a.target)||x()}),e.addEventListener("keydown",a=>{if(a.key==="Enter"||a.key===" ")a.preventDefault(),n.classList.contains("open")?x():z();else if(a.key==="Escape")x();else if(a.key==="ArrowDown"&&n.classList.contains("open")){a.preventDefault();const o=s(),r=Math.min(o+1,i.length-1);S(i[r].dataset.value)}else if(a.key==="ArrowUp"&&n.classList.contains("open")){a.preventDefault();const o=s(),r=Math.max(o-1,0);S(i[r].dataset.value)}});function s(){return Array.from(i).findIndex(o=>o.classList.contains("selected"))}}function z(){t.modelDropdown.classList.add("open"),t.translateModel.setAttribute("aria-expanded","true")}function x(){t.modelDropdown.classList.remove("open"),t.translateModel.setAttribute("aria-expanded","false")}function S(e){const n=t.modelDropdown,i=n.querySelectorAll(".dropdown-item"),s=n.querySelector(".dropdown-selected");i.forEach(a=>{const o=a.dataset.value===e;if(a.classList.toggle("selected",o),a.setAttribute("aria-selected",o?"true":"false"),o){const r=a.querySelector(".dropdown-item-text")?.textContent||"";s.textContent=r,M=e}})}function se(e){S(e)}console.log("[Popup] Script loaded");
