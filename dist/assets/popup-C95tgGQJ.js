const E={serverUrl:"http://localhost:1420",apiKeys:[],translateModel:"gemini-flash-latest",includeFreeText:!1,bananaMode:!1,textStroke:!1,blurFreeTextBg:!1,cache:!0,metricsDetail:!0,geminiThinking:!1,tighterBounds:!1,useMask:!0,mergeImg:!1,batchSize:5,sessionLimit:8,theme:"auto"};async function q(){try{const e=await chrome.storage.sync.get(Object.keys(E));return{...E,...e}}catch(e){return console.error("[Storage] Failed to load settings:",e),E}}async function R(e){try{await chrome.storage.sync.set(e)}catch(n){throw console.error("[Storage] Failed to save settings:",n),n}}const T="cumulativeStats";async function F(){try{return(await chrome.storage.local.get(T))[T]||{totalSessions:0,totalImages:0,totalRegions:0,totalSimpleBg:0,totalComplexBg:0,totalApiCalls:0,totalInputTokens:0,totalOutputTokens:0,totalCacheHits:0,totalCacheMisses:0,totalProcessingTimeMs:0}}catch(e){return console.error("[Storage] Failed to load cumulative stats:",e),{totalSessions:0,totalImages:0,totalRegions:0,totalSimpleBg:0,totalComplexBg:0,totalApiCalls:0,totalInputTokens:0,totalOutputTokens:0,totalCacheHits:0,totalCacheMisses:0,totalProcessingTimeMs:0}}}async function N(){try{await chrome.storage.local.remove(T),console.log("[Storage] Cumulative stats reset")}catch(e){console.error("[Storage] Failed to reset cumulative stats:",e)}}class H{container;previouslyFocused=null;isActive=!1;constructor(n){this.container=n}getFocusableElements(){const n=["a[href]","button:not([disabled])","textarea:not([disabled])","input:not([disabled])","select:not([disabled])",'[tabindex]:not([tabindex="-1"])'].join(",");return Array.from(this.container.querySelectorAll(n)).filter(s=>!s.hasAttribute("disabled")&&s.offsetParent!==null)}handleTab=n=>{if(!this.isActive||n.key!=="Tab")return;const i=this.getFocusableElements(),s=i[0],a=i[i.length-1];if(!(!s||!a)){if(n.shiftKey&&document.activeElement===s){n.preventDefault(),a.focus();return}!n.shiftKey&&document.activeElement===a&&(n.preventDefault(),s.focus())}};activate(){if(this.isActive)return;this.previouslyFocused=document.activeElement;const n=this.getFocusableElements();n.length>0&&n[0].focus(),document.addEventListener("keydown",this.handleTab),this.isActive=!0}deactivate(){this.isActive&&(document.removeEventListener("keydown",this.handleTab),this.previouslyFocused&&typeof this.previouslyFocused.focus=="function"&&this.previouslyFocused.focus(),this.isActive=!1)}isActivated(){return this.isActive}}function V(e){return new H(e)}function j(e,n){const i=e.key.toLowerCase()===n.key.toLowerCase(),s=!!n.ctrl===(e.ctrlKey||e.metaKey),a=!!n.shift===e.shiftKey,o=!!n.alt===e.altKey;return i&&s&&a&&o}class G{shortcuts=[];isListening=!1;add(n){this.shortcuts.push(n)}remove(n){const i=this.shortcuts.indexOf(n);i>-1&&this.shortcuts.splice(i,1)}handleKeydown=n=>{for(const i of this.shortcuts)if(j(n,i)){n.preventDefault(),i.handler(n);return}};listen(){this.isListening||(document.addEventListener("keydown",this.handleKeydown),this.isListening=!0)}stop(){this.isListening&&(document.removeEventListener("keydown",this.handleKeydown),this.isListening=!1)}getShortcuts(){return[...this.shortcuts]}}console.log("[Popup] Initializing...");let b="http://localhost:1420",p=null,l=null,I=null;const t={connectionStatus:document.getElementById("connectionStatus"),connectionLabel:document.getElementById("connectionLabel"),serverUrl:document.getElementById("serverUrl"),tabSettings:document.getElementById("tab-settings"),tabApiKeys:document.getElementById("tab-apiKeys"),tabStats:document.getElementById("tab-stats"),panelSettings:document.getElementById("panel-settings"),panelApiKeys:document.getElementById("panel-apiKeys"),panelStats:document.getElementById("panel-stats"),modelDropdown:document.getElementById("modelDropdown"),translateModel:document.getElementById("translateModel"),includeFreeText:document.getElementById("includeFreeText"),textStroke:document.getElementById("textStroke"),blurFreeTextBg:document.getElementById("blurFreeTextBg"),bananaMode:document.getElementById("bananaMode"),cache:document.getElementById("cache"),metricsDetail:document.getElementById("metricsDetail"),geminiThinking:document.getElementById("geminiThinking"),tighterBounds:document.getElementById("tighterBounds"),useMask:document.getElementById("useMask"),mergeImg:document.getElementById("mergeImg"),batchSize:document.getElementById("batchSize"),sessionLimit:document.getElementById("sessionLimit"),backendInfo:document.getElementById("backendInfo"),backendType:document.getElementById("backendType"),backendAcceleration:document.getElementById("backendAcceleration"),mergeImgField:document.getElementById("mergeImgField"),batchSizeField:document.getElementById("batchSizeField"),sessionLimitField:document.getElementById("sessionLimitField"),apiKeysList:document.getElementById("apiKeysList"),addApiKey:document.getElementById("addApiKey"),statsContent:document.getElementById("statsContent"),toast:document.getElementById("toast"),processingOverlay:document.getElementById("processingOverlay"),processingDetail:document.getElementById("processingDetail"),progressFill:document.getElementById("progressFill")};let C="gemini-flash-latest";document.addEventListener("DOMContentLoaded",async()=>{await Y(),console.log("[Popup] Ready")});async function Y(){await X(),l=await F(),$(),Z(),te(),ne(),D()}async function X(){try{const e=await q();e.serverUrl&&(b=e.serverUrl,t.serverUrl.value=b),C=e.translateModel,ae(e.translateModel),t.includeFreeText.checked=e.includeFreeText,t.textStroke.checked=e.textStroke,t.blurFreeTextBg.checked=e.blurFreeTextBg,t.bananaMode.checked=e.bananaMode,t.cache.checked=e.cache,t.metricsDetail.checked=e.metricsDetail,t.geminiThinking.checked=e.geminiThinking??!1,t.tighterBounds.checked=e.tighterBounds??!0,t.useMask.checked=e.useMask??!0,t.mergeImg.checked=e.mergeImg??!1,t.batchSize.value=String(e.batchSize??5),t.sessionLimit.value=String(e.sessionLimit??8),e.apiKeys&&e.apiKeys.length>0?e.apiKeys.forEach(n=>B(n)):B(""),console.log("[Popup] Settings loaded")}catch(e){console.error("[Popup] Failed to load settings:",e),y("⚠️","Failed to load settings")}}async function d(){try{const e=t.apiKeysList.querySelectorAll(".api-key-input"),n=Array.from(e).map(s=>s.value.trim()).filter(s=>s.length>0),i={serverUrl:t.serverUrl.value,apiKeys:n,translateModel:C,includeFreeText:t.includeFreeText.checked,textStroke:t.textStroke.checked,blurFreeTextBg:t.blurFreeTextBg.checked,bananaMode:t.bananaMode.checked,cache:t.cache.checked,metricsDetail:t.metricsDetail.checked,geminiThinking:t.geminiThinking.checked,tighterBounds:t.tighterBounds.checked,useMask:t.useMask.checked,mergeImg:t.mergeImg.checked,batchSize:Math.max(1,Math.min(50,parseInt(t.batchSize.value)||5)),sessionLimit:Math.max(1,Math.min(32,parseInt(t.sessionLimit.value)||8))};await R(i),b=i.serverUrl,console.log("[Popup] Settings saved")}catch(e){console.error("[Popup] Failed to save settings:",e),y("✗","Failed to save settings")}}async function f(e,n=!0){const i=e==="mask"?"/mask-toggle":e==="mergeimg"?"/mergeimg-toggle":"/thinking-toggle",s=e==="mask"?"Mask mode":e==="mergeimg"?"Batch inference":"Gemini thinking";try{const a=await fetch(`${b}${i}`,{method:"POST"});if(a.ok){const o=await a.json(),r=e==="mask"?o.mask_enabled:e==="mergeimg"?o.merge_img_enabled:o.gemini_thinking_enabled;console.log(`[Popup] ${s} synced: ${r}`),n&&y("✓",`${s} ${r?"enabled":"disabled"}`)}else throw new Error(`HTTP ${a.status}`)}catch(a){console.error(`[Popup] Failed to sync ${s}:`,a),n&&y("⚠️",`Failed to sync ${s} with server`)}}async function J(){try{const e=await fetch(`${b}/health`);if(!e.ok)return;const n=await e.json();if(!n.config)return;n.backend&&Q(n.backend);const i=n.config.mask_enabled!==t.useMask.checked,s=n.config.merge_img_enabled!==t.mergeImg.checked,a=n.config.gemini_thinking_enabled!==t.geminiThinking.checked;i||s||a?(console.log("[Popup] Server state mismatch detected, syncing frontend settings to server"),i&&(console.log(`  - Mask: server=${n.config.mask_enabled}, local=${t.useMask.checked} → syncing`),await f("mask",!1)),s&&(console.log(`  - MergeImg: server=${n.config.merge_img_enabled}, local=${t.mergeImg.checked} → syncing`),await f("mergeimg",!1)),a&&(console.log(`  - Thinking: server=${n.config.gemini_thinking_enabled}, local=${t.geminiThinking.checked} → syncing`),await f("thinking",!1)),console.log("[Popup] ✓ Frontend settings synced to server")):console.log("[Popup] ✓ Server state matches frontend, no sync needed")}catch(e){console.error("[Popup] Failed to check/sync server settings:",e)}}function Q(e){t.backendType.textContent=e,t.backendInfo.style.display="block";const n=["DirectML","DirectML+CPU","CUDA","TensorRT","CoreML"],i=["XNNPACK","OpenVINO","OpenVINO-CPU"];let s="",a=!1;n.some(o=>e.includes(o))?(s="(GPU Accelerated)",a=e.includes("DirectML")):i.some(o=>e.includes(o))?s="(CPU Accelerated)":e==="CPU"&&(s="(Slow CPU Backend)"),t.backendAcceleration.textContent=s,a?(console.log("[Popup] DirectML detected, disabling batch options"),t.mergeImg.checked=!1,t.mergeImg.disabled=!0,t.mergeImgField.style.opacity="0.5",t.mergeImgField.style.pointerEvents="none",t.batchSizeField.style.opacity="0.5",t.batchSizeField.style.pointerEvents="none",t.batchSize.disabled=!0,t.sessionLimitField.style.opacity="0.5",t.sessionLimitField.style.pointerEvents="none",t.sessionLimit.disabled=!0):(t.mergeImg.disabled=!1,t.mergeImgField.style.opacity="1",t.mergeImgField.style.pointerEvents="auto",t.batchSizeField.style.opacity="1",t.batchSizeField.style.pointerEvents="auto",t.batchSize.disabled=!1,t.sessionLimitField.style.opacity="1",t.sessionLimitField.style.pointerEvents="auto",t.sessionLimit.disabled=!1)}function B(e=""){const n=document.createElement("div");n.className="api-key-item",n.setAttribute("role","listitem");const i=`api-key-${Date.now()}`,s=`visibility-${Date.now()}`;n.innerHTML=`
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
  `;const a=n.querySelector(".api-key-input"),o=n.querySelector(".api-key-toggle-visibility"),r=n.querySelector(".api-key-remove"),c=o.querySelector(".icon-eye"),g=o.querySelector(".icon-eye-off");o.addEventListener("click",()=>{const u=a.type==="password";a.type=u?"text":"password",c.style.display=u?"none":"block",g.style.display=u?"block":"none",o.setAttribute("aria-pressed",u?"true":"false")}),r.addEventListener("click",()=>{t.apiKeysList.querySelectorAll(".api-key-item").length>1?(n.remove(),d()):y("⚠️","At least one API key field is required")}),a.addEventListener("blur",()=>{d()}),t.apiKeysList.appendChild(n)}async function D(){console.log("[Popup] Checking connection..."),w("checking");try{const e=new AbortController,n=setTimeout(()=>e.abort(),5e3),i=await fetch(`${b}/health`,{method:"GET",signal:e.signal});if(clearTimeout(n),i.ok)w("connected"),console.log("[Popup] Connected"),await J();else throw new Error(`HTTP ${i.status}`)}catch(e){console.error("[Popup] Connection failed:",e),w("error"),y("⚠️","Server offline or unreachable")}}function w(e){t.connectionStatus.className=`status-dot ${e}`;const n={connected:"Connected",checking:"Checking...",error:"Offline"};t.connectionLabel.textContent=n[e],t.connectionStatus.setAttribute("aria-label",`Server connection status: ${n[e]}`)}function W(){I&&clearTimeout(I),I=setTimeout(()=>{d(),D()},1e3)}function k(e){const n=[t.tabSettings,t.tabApiKeys,t.tabStats],i=[t.panelSettings,t.panelApiKeys,t.panelStats];n.forEach((s,a)=>{const o=s.id===`tab-${e}`;s.classList.toggle("active",o),s.setAttribute("aria-selected",o?"true":"false"),s.setAttribute("tabindex",o?"0":"-1"),i[a].classList.toggle("active",o),i[a].hidden=!o})}const K=V(t.processingOverlay);function L(e,n="Initializing...",i=0){e?(t.processingOverlay.hidden=!1,t.processingDetail.textContent=n,t.progressFill.style.width=`${i}%`,t.progressFill.parentElement?.setAttribute("aria-valuenow",i.toString()),K.activate()):(t.processingOverlay.hidden=!0,K.deactivate())}function $(){if((p||l&&l.totalSessions>0)&&(t.tabStats.disabled=!1),!p&&(!l||l.totalSessions===0)){t.statsContent.innerHTML=`
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
      ${h("Processing Time",z(p.total_time_ms),!0)}
      ${p.input_tokens||p.output_tokens?h("Tokens Used",((p.input_tokens||0)+(p.output_tokens||0)).toLocaleString(),!0):""}
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
      ${h("Avg. Images/Session",s.toFixed(1))}
      ${h("Avg. Time/Session",z(i))}
      ${a>0?h("Total Tokens",a.toLocaleString()):""}
      ${h("Cache Hit Rate",r)}

      ${l.firstProcessedAt?`
      <div style="margin-top: var(--space-md); padding-top: var(--space-md); border-top: 1px solid var(--border-subtle); font-size: var(--text-xs); color: var(--text-tertiary); text-align: center;">
        First used: ${new Date(l.firstProcessedAt).toLocaleDateString()}
      </div>
      `:""}
    </div>
    `}t.statsContent.innerHTML=e;const n=document.getElementById("resetStats");n&&n.addEventListener("click",async()=>{confirm("Reset all lifetime statistics? This cannot be undone.")&&(await N(),l=await F(),$(),y("✓","Statistics reset successfully"))})}function h(e,n,i=!1){return`
    <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-sm) 0; ${i?"margin-top: var(--space-sm);":""}">
      <span style="font-size: var(--text-sm); color: var(--text-secondary);">${e}</span>
      <span style="font-size: var(--text-sm); color: var(--text-primary);">${n}</span>
    </div>
  `}function z(e){return e?e<1e3?`${Math.round(e)}ms`:`${(e/1e3).toFixed(2)}s`:"N/A"}let A=null;function y(e,n,i=3e3){const s=t.toast.querySelector(".toast-icon"),a=t.toast.querySelector(".toast-message");s.textContent=e,a.textContent=n,t.toast.hidden=!1,t.toast.classList.add("show"),A&&clearTimeout(A),A=setTimeout(()=>{t.toast.classList.remove("show"),setTimeout(()=>{t.toast.hidden=!0},200)},i)}function Z(){t.serverUrl.addEventListener("input",W),t.serverUrl.addEventListener("blur",()=>{d(),D()}),t.includeFreeText.addEventListener("change",d),t.textStroke.addEventListener("change",d),t.blurFreeTextBg.addEventListener("change",d),t.bananaMode.addEventListener("change",d),t.cache.addEventListener("change",d),t.metricsDetail.addEventListener("change",d),t.geminiThinking.addEventListener("change",d),t.tighterBounds.addEventListener("change",d),t.batchSize.addEventListener("change",d),t.sessionLimit.addEventListener("change",d),t.useMask.addEventListener("change",async()=>{await d(),await f("mask")}),t.mergeImg.addEventListener("change",async()=>{await d(),await f("mergeimg")}),t.geminiThinking.addEventListener("change",async()=>{await d(),await f("thinking")}),ie(),t.tabSettings.addEventListener("click",()=>k("settings")),t.tabApiKeys.addEventListener("click",()=>k("apiKeys")),t.tabStats.addEventListener("click",()=>k("stats")),[t.tabSettings,t.tabApiKeys,t.tabStats].forEach((e,n)=>{e.addEventListener("keydown",i=>{const s=["settings","apiKeys","stats"];if(i.key==="ArrowRight"){i.preventDefault();const a=(n+1)%s.length;k(s[a]),document.getElementById(`tab-${s[a]}`)?.focus()}else if(i.key==="ArrowLeft"){i.preventDefault();const a=(n-1+s.length)%s.length;k(s[a]),document.getElementById(`tab-${s[a]}`)?.focus()}})}),t.addApiKey.addEventListener("click",()=>{B("");const e=t.apiKeysList.querySelectorAll(".api-key-input");e[e.length-1]?.focus()}),ee()}function ee(){document.querySelectorAll(".number-stepper-btn").forEach(n=>{const i=n.dataset.target;if(!i)return;const s=document.getElementById(i);if(!s)return;const a=n.classList.contains("increment"),o=n.classList.contains("decrement"),r=()=>{const c=parseInt(s.value)||0,g=parseInt(s.min)||0,u=parseInt(s.max)||1/0,m=s.closest(".number-input-wrapper");if(!m)return;const v=m.querySelector(".number-stepper-btn.decrement"),P=m.querySelector(".number-stepper-btn.increment");v&&(v.disabled=c<=g),P&&(P.disabled=c>=u)};n.addEventListener("click",()=>{const c=parseInt(s.value)||0,g=parseInt(s.min)||0,u=parseInt(s.max)||1/0,m=parseInt(s.step)||1;let v=c;a&&c<u?v=Math.min(c+m,u):o&&c>g&&(v=Math.max(c-m,g)),v!==c&&(s.value=String(v),s.dispatchEvent(new Event("change",{bubbles:!0})),r())}),s.addEventListener("input",r),s.addEventListener("change",r),s.addEventListener("keydown",c=>{const g=parseInt(s.min)||0,u=parseInt(s.max)||1/0;let m=parseInt(s.value)||0;c.key==="ArrowUp"?(c.preventDefault(),m<u&&(s.value=String(Math.min(m+1,u)),s.dispatchEvent(new Event("change",{bubbles:!0})),r())):c.key==="ArrowDown"&&(c.preventDefault(),m>g&&(s.value=String(Math.max(m-1,g)),s.dispatchEvent(new Event("change",{bubbles:!0})),r()))}),r()})}function te(){const e=new G;e.add({key:"Escape",handler:()=>{}}),e.listen()}const M="accordionState";async function ne(){const e=document.querySelectorAll(".accordion-header"),n=await O();e.forEach(i=>{const s=i.getAttribute("aria-controls");if(!s)return;const a=document.getElementById(s);if(!a)return;const o=n[s]??!0;_(i,a,o),i.addEventListener("click",()=>{const c=!(i.getAttribute("aria-expanded")==="true");_(i,a,c),se(s,c)}),i.addEventListener("keydown",r=>{if(r.key==="ArrowDown"||r.key==="ArrowUp"){r.preventDefault();const c=Array.from(e),g=c.indexOf(i),u=r.key==="ArrowDown"?(g+1)%c.length:(g-1+c.length)%c.length;c[u].focus()}})})}function _(e,n,i){e.setAttribute("aria-expanded",i.toString()),n.hidden=!i}async function O(){try{return(await chrome.storage.local.get(M))[M]||{}}catch(e){return console.error("[Accordion] Failed to load state:",e),{}}}async function se(e,n){try{const i=await O();i[e]=n,await chrome.storage.local.set({[M]:i})}catch(i){console.error("[Accordion] Failed to save state:",i)}}chrome.runtime.onMessage.addListener((e,n,i)=>(console.log("[Popup] Message:",e),e.action==="processing-update"?L(!0,e.details,e.progress):e.action==="processing-complete"?(L(!1),e.analytics&&(p=e.analytics,F().then(s=>{l=s,$()}))):e.action==="processing-error"&&(L(!1),y("✗",e.error)),i({status:"ok"}),!1));function ie(){const e=t.translateModel,n=t.modelDropdown,i=n.querySelectorAll(".dropdown-item");e.addEventListener("click",a=>{a.stopPropagation(),n.classList.contains("open")?S():U()}),i.forEach(a=>{a.addEventListener("click",()=>{const o=a.dataset.value;o&&(x(o),S(),d())})}),document.addEventListener("click",a=>{n.contains(a.target)||S()}),e.addEventListener("keydown",a=>{if(a.key==="Enter"||a.key===" ")a.preventDefault(),n.classList.contains("open")?S():U();else if(a.key==="Escape")S();else if(a.key==="ArrowDown"&&n.classList.contains("open")){a.preventDefault();const o=s(),r=Math.min(o+1,i.length-1);x(i[r].dataset.value)}else if(a.key==="ArrowUp"&&n.classList.contains("open")){a.preventDefault();const o=s(),r=Math.max(o-1,0);x(i[r].dataset.value)}});function s(){return Array.from(i).findIndex(o=>o.classList.contains("selected"))}}function U(){t.modelDropdown.classList.add("open"),t.translateModel.setAttribute("aria-expanded","true")}function S(){t.modelDropdown.classList.remove("open"),t.translateModel.setAttribute("aria-expanded","false")}function x(e){const n=t.modelDropdown,i=n.querySelectorAll(".dropdown-item"),s=n.querySelector(".dropdown-selected");i.forEach(a=>{const o=a.dataset.value===e;if(a.classList.toggle("selected",o),a.setAttribute("aria-selected",o?"true":"false"),o){const r=a.querySelector(".dropdown-item-text")?.textContent||"";s.textContent=r,C=e}})}function ae(e){x(e)}console.log("[Popup] Script loaded");
