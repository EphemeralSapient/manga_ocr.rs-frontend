const H="imageCache_",L="imageCacheIndex";async function oe(e){const t=await e.arrayBuffer(),o=await crypto.subtle.digest("SHA-256",t);return Array.from(new Uint8Array(o)).map(g=>g.toString(16).padStart(2,"0")).join("")}function W(e){const t={translateModel:e.translateModel,targetLanguage:e.targetLanguage,fontSource:e.fontSource,fontFamily:e.fontFamily,googleFontFamily:e.googleFontFamily,includeFreeText:e.includeFreeText,bananaMode:e.bananaMode,textStroke:e.textStroke,backgroundType:e.backgroundType,tighterBounds:e.tighterBounds,filterOrphanRegions:e.filterOrphanRegions,maskMode:e.maskMode,mergeImg:e.mergeImg};return JSON.stringify(t)}async function se(e,t){try{const o=`${H}${e}`,a=(await chrome.storage.local.get(o))[o];if(!a)return null;if(a.config!==t)return console.log(`[CACHE] Config mismatch for ${e.substring(0,8)}..., invalidating`),await chrome.storage.local.remove(o),await j(e),null;const g=Date.now()-a.timestamp,l=7*24*60*60*1e3;return g>l?(console.log(`[CACHE] Expired entry for ${e.substring(0,8)}..., invalidating`),await chrome.storage.local.remove(o),await j(e),null):(console.log(`[CACHE] Hit for ${e.substring(0,8)}...`),a.dataUrl)}catch(o){return console.error("[CACHE] Error getting cached image:",o),null}}async function ae(e,t,o){try{const s=`${H}${e}`,a={hash:e,dataUrl:t,timestamp:Date.now(),config:o};await chrome.storage.local.set({[s]:a}),await re(e),await ne(),console.log(`[CACHE] Stored ${e.substring(0,8)}...`)}catch(s){console.error("[CACHE] Error setting cached image:",s),s.message?.includes("QUOTA")&&(console.warn("[CACHE] Quota exceeded, clearing old cache entries"),await G(50))}}async function D(){return(await chrome.storage.local.get(L))[L]||[]}async function re(e){const t=await D();t.includes(e)||(t.push(e),await chrome.storage.local.set({[L]:t}))}async function j(e){const o=(await D()).filter(s=>s!==e);await chrome.storage.local.set({[L]:o})}async function ne(){const e=await D();if(e.length>500){const t=e.length-500;await G(t)}}async function G(e){const t=await D(),o=t.map(u=>`${H}${u}`),s=await chrome.storage.local.get(o),a=[];Object.entries(s).forEach(([,u])=>{const p=u;a.push({hash:p.hash,timestamp:p.timestamp})}),a.sort((u,p)=>u.timestamp-p.timestamp);const g=a.slice(0,e),l=g.map(u=>`${H}${u.hash}`);await chrome.storage.local.remove(l);const i=g.map(u=>u.hash),d=t.filter(u=>!i.includes(u));await chrome.storage.local.set({[L]:d}),console.log(`[CACHE] Cleared ${g.length} old entries`)}const K=window.__mangaTextProcessorLoaded===!0;K&&console.log("[CONTENT] Script already loaded, skipping re-initialization");window.__mangaTextProcessorLoaded=!0;async function J(e){try{const t="cumulativeStats",s=(await chrome.storage.local.get(t))[t]||{totalSessions:0,totalImages:0,totalRegions:0,totalSimpleBg:0,totalComplexBg:0,totalLabel0:0,totalLabel1:0,totalLabel2:0,totalApiCalls:0,totalInputTokens:0,totalOutputTokens:0,totalCacheHits:0,totalCacheMisses:0,totalProcessingTimeMs:0},a={totalSessions:s.totalSessions+1,totalImages:s.totalImages+(e.total_images||0),totalRegions:s.totalRegions+(e.total_regions||0),totalSimpleBg:s.totalSimpleBg+(e.simple_bg_count||0),totalComplexBg:s.totalComplexBg+(e.complex_bg_count||0),totalLabel0:(s.totalLabel0||0)+(e.label_0_count||0),totalLabel1:(s.totalLabel1||0)+(e.label_1_count||0),totalLabel2:(s.totalLabel2||0)+(e.label_2_count||0),totalApiCalls:s.totalApiCalls+(e.api_calls_simple||0)+(e.api_calls_complex||0)+(e.api_calls_banana||0),totalInputTokens:s.totalInputTokens+(e.input_tokens||0),totalOutputTokens:s.totalOutputTokens+(e.output_tokens||0),totalCacheHits:s.totalCacheHits+(e.cache_hits||0),totalCacheMisses:s.totalCacheMisses+(e.cache_misses||0),totalProcessingTimeMs:s.totalProcessingTimeMs+(e.total_time_ms||0),lastProcessedAt:Date.now(),firstProcessedAt:s.firstProcessedAt||Date.now()};await chrome.storage.local.set({[t]:a})}catch(t){console.error("[CONTENT] Failed to save cumulative stats:",t)}}let $=!1,P=!1;const A=new Map;function Z(e){if(!e.isConnected)return!1;const t=window.getComputedStyle(e);return t.display==="none"||t.visibility==="hidden"||t.opacity==="0"?!1:e.offsetParent===null?t.position==="fixed":!0}function U(){A.clear(),$=!1,P=!1}K||(window.addEventListener("beforeunload",U),window.addEventListener("pagehide",U),window.addEventListener("popstate",U));K||(chrome.runtime.onMessage.addListener((e,t,o)=>(console.log("[CONTENT] Message received:",e),e.action==="ping"?(o({success:!0,loaded:!0}),!1):e.action==="process-images"&&e.config?$?(o({success:!1,error:"Already processing"}),!1):(o({success:!0,started:!0}),le(e.config).then(s=>{console.log("[CONTENT] Processing complete:",s)}).catch(s=>{console.error("[CONTENT] Processing error:",s),chrome.runtime.sendMessage({action:"processing-error",error:s.message}).catch(()=>{})}),!1):e.action==="enter-selection-mode"&&e.config?(me(e.config),o({success:!0}),!1):(e.action==="restore-images"&&(de(),o({success:!0})),!1))),console.log("[CONTENT] Manga Text Processor ready"));async function ie(e,t,o,s){console.log(`[CONTENT] Processing all ${e.length} images in a single request`);const a={apiKeys:o.apiKeys,ocr_translation_model:o.translateModel,targetLanguage:o.targetLanguage,font_source:o.fontSource,includeFreeText:o.includeFreeText,bananaMode:o.bananaMode,textStroke:o.textStroke,backgroundType:o.backgroundType,cache:o.cache,metricsDetail:o.metricsDetail,tighterBounds:o.tighterBounds,filterOrphanRegions:o.filterOrphanRegions,useMask:o.maskMode!=="off",maskMode:o.maskMode||"fast",mergeImg:o.mergeImg,sessionLimit:o.sessionLimit,targetSize:o.targetSize,l1Debug:o.l1Debug,ocr:o.localOcr,useCerebras:o.useCerebras,cerebrasApiKey:o.cerebrasApiKey};o.fontSource==="google"?a.google_font_family=o.googleFontFamily:a.font_family=o.fontFamily;const g=new FormData;e.forEach((d,u)=>{g.append("images",d,`image_${u}.png`)}),g.append("config",JSON.stringify(a)),s(40,`Sending ${e.length} images to server...`);const l=new AbortController,i=setTimeout(()=>l.abort(),3e5);try{const d=await fetch(`${o.serverUrl}/process`,{method:"POST",body:g,signal:l.signal});if(clearTimeout(i),!d.ok)throw new Error(`Server error: ${d.status} ${d.statusText}`);s(80,"Processing on server...");const u=await d.json();return console.log(`[CONTENT] Successfully processed all ${e.length} images`),u}catch(d){throw clearTimeout(i),d.name==="AbortError"?new Error("Processing timeout after 5 minutes"):d}}async function le(e){if($)throw f("Task in progress","warning","Please wait for the current operation to complete before starting a new one."),new Error("Processing already in progress");console.log("[CONTENT] Starting page image processing..."),console.log("[CONTENT] Config:",e);const t=e.localOcr&&e.useCerebras;if(!t&&(!e.apiKeys||e.apiKeys.length===0))throw f("API keys required","error","Open extension settings and add your Gemini API keys to enable translation."),new Error("No API keys configured");if(t&&!e.cerebrasApiKey)throw f("Cerebras API key required","error","Open extension settings and add your Cerebras API key to use Cerebras translation."),new Error("No Cerebras API key configured");try{const o=new AbortController,s=setTimeout(()=>o.abort(),5e3),a=await fetch(`${e.serverUrl}/health`,{method:"GET",signal:o.signal});if(clearTimeout(s),!a.ok)throw f("Server unavailable","error","The server returned an error. Verify the server is running correctly."),new Error("Server health check failed")}catch(o){throw o.name==="AbortError"?f("Connection timeout","error","Could not reach the server within 5 seconds. Check if the server is running and Local Network Access permission is granted."):o.message!=="Server health check failed"&&f("Connection failed","error",`Unable to connect to ${e.serverUrl}. Verify the URL, server status, and Chrome Local Network Access permission.`),o}$=!0;try{const o=Array.from(document.querySelectorAll("img"));console.log(`[CONTENT] Found ${o.length} total images`);const s=o.filter(c=>{const h=c.getBoundingClientRect();return h.width>=200&&h.height>=200&&Z(c)&&c.naturalWidth>=200&&c.naturalHeight>=200});if(console.log(`[CONTENT] Filtered to ${s.length} large images`),s.length===0)return f("No images detected","info","No images larger than 200×200px found. Try scrolling to load more content."),{processed:0};const a=f(`Processing ${s.length} image${s.length>1?"s":""}...`,"info",void 0,!0),g=e.cache?`Converting and hashing ${s.length} images...`:`Converting ${s.length} images...`;x(0,g);const l=[],i=[],d=[],u=s.map((c,h)=>Q(c).then(async T=>{let v="";return e.cache?(v=await oe(T),console.log(`[CONTENT] Converted and hashed image ${h+1}/${s.length} (${v.substring(0,8)}...)`)):console.log(`[CONTENT] Converted image ${h+1}/${s.length}`),{blob:T,img:c,hash:v,index:h}}).catch(T=>(console.error(`[CONTENT] Failed to convert image ${h+1}:`,T),null))),p=await Promise.all(u);p.forEach(c=>{c&&(l.push(c.blob),i.push({img:c.img,originalSrc:c.img.src}),d.push(c.hash))});const n=Math.round(p.length/s.length*20);if(x(n,`Converted ${l.length}/${s.length} images...`),console.log(`[CONTENT] Converted ${l.length} images to blobs`),l.length===0)throw new Error("Failed to convert any images");let r=0,b=l,m=i,w=d;if(e.cache){x(25,"Checking cache...");const c=W(e),h=d.map(N=>se(N,c)),T=await Promise.all(h),v=[];if(b=[],m=[],w=[],T.forEach((N,S)=>{if(N){const{img:I,originalSrc:M}=i[S];A.set(I,M),I.src=N,I.dataset.processed="true",r++}else v.push(S),b.push(l[S]),m.push(i[S]),w.push(d[S])}),console.log(`[CONTENT] Cache: ${r} hits, ${b.length} misses`),r>0&&f(`Cache hit: ${r} image${r!==1?"s":""} loaded from cache`,"info",void 0,!1),b.length===0)return x(100,"Complete (all from cache)!"),a(),f(`${l.length} image${l.length!==1?"s":""} loaded from cache`,"success","No server processing required",!1),{processed:l.length,analytics:{total_images:l.length}}}const E=e.cache?`Processing ${b.length} uncached images...`:`Processing ${b.length} images...`;x(30,E);const y=await ie(b,m,e,(c,h)=>x(c,h));if(e.cache&&y.results&&y.results.length>0){const c=W(e),h=y.results.map((T,v)=>{if(T.success&&T.data_url){const N=w[v];return ae(N,T.data_url,c)}return Promise.resolve()});await Promise.all(h),console.log(`[CONTENT] Cached ${y.results.length} newly processed images`)}console.log("[CONTENT] All chunks processed:",y),x(90,"Applying results...");let _=0;y.results&&y.results.length>0&&y.results.forEach((c,h)=>{if(c.success&&c.data_url&&m[h]){const{img:T,originalSrc:v}=m[h];A.set(T,v),T.src=c.data_url,T.dataset.processed="true",_++,console.log(`[CONTENT] Applied processed image ${h+1}`)}});const k=r+_;x(100,"Complete!"),a();const C=y.analytics;let B;if(e.metricsDetail&&C){const c=[];e.cache&&r>0&&c.push(`${r} from cache, ${_} newly processed`);const h=C.total_time_ms?(C.total_time_ms/1e3).toFixed(1):"0",T=C.phase1_time_ms?(C.phase1_time_ms/1e3).toFixed(1):null,v=C.phase2_time_ms?(C.phase2_time_ms/1e3).toFixed(1):null;let N=`${h}s total`;T&&v&&(N+=` (detect: ${T}s, translate: ${v}s)`),c.push(N);const S=C.total_regions||0,I=C.simple_bg_count||0,M=C.complex_bg_count||0;if(S>0){let O=`${S} region${S!==1?"s":""}`;(I||M)&&(O+=` · ${I} simple, ${M} complex bg`),c.push(O)}const F=(C.api_calls_simple||0)+(C.api_calls_complex||0),z=C.cache_hits||0,te=C.cache_misses||0,R=z+te;if(F>0||R>0){let O="";if(F>0&&(O+=`${F} API call${F!==1?"s":""}`),R>0){const q=(z/R*100).toFixed(0);O+=O?` · ${q}% cache hit`:`${q}% cache hit`}O&&c.push(O)}const X=(C.input_tokens||0)+(C.output_tokens||0);X>0&&c.push(`${X.toLocaleString()} tokens used`),B=c.join(`
`)}else if(C){const c=C.total_time_ms?(C.total_time_ms/1e3).toFixed(1):null;let h=c?`Completed in ${c}s`:void 0;e.cache&&r>0&&(h=h?`${h} (${r} from cache)`:`${r} from cache`),B=h}return f(`${k} image${k!==1?"s":""} processed`,"success",B,!1,e.metricsDetail),ee(y.analytics),y.analytics&&await J(y.analytics),console.log(`[CONTENT] Processing complete: ${k} total (${r} cached, ${_} newly processed)`),{processed:k,analytics:y.analytics}}finally{$=!1}}async function Q(e){const t=e.src;if(t.startsWith("data:"))return Y(t);if(t.startsWith("blob:"))return(await fetch(t)).blob();try{const a=await V(e);if(a)return a}catch(a){console.log("[CONTENT] Direct canvas conversion failed, trying CORS reload:",a)}console.log("[CONTENT] Attempting to reload image with CORS headers:",t);const o=await ce(t);if(o){const a=await V(o);if(a)return console.log("[CONTENT] Successfully converted image after CORS reload"),a}console.log("[CONTENT] Falling back to background fetch for:",t);const s=await chrome.runtime.sendMessage({action:"fetch-image",url:t});if(!s.success)throw new Error(`Background fetch failed: ${s.error}`);return Y(s.base64)}async function V(e){return new Promise(t=>{try{if(typeof OffscreenCanvas<"u"){const l=new OffscreenCanvas(e.naturalWidth||e.width,e.naturalHeight||e.height),i=l.getContext("2d");if(i){i.drawImage(e,0,0);const d=setTimeout(()=>t(null),5e3);l.convertToBlob({type:"image/webp",quality:.95}).then(u=>{clearTimeout(d),t(u)}).catch(()=>{clearTimeout(d),t(null)});return}}const o=document.createElement("canvas"),s=o.getContext("2d");if(!s){t(null);return}o.width=e.naturalWidth||e.width,o.height=e.naturalHeight||e.height,s.drawImage(e,0,0);const a=setTimeout(()=>t(null),5e3);let g=!1;o.toBlob(l=>{g||(g=!0,clearTimeout(a),t(l))},"image/webp",.95)}catch{t(null)}})}async function ce(e){return new Promise(t=>{const o=new Image;o.crossOrigin="anonymous";const s=setTimeout(()=>{o.onload=null,o.onerror=null,t(null)},1e4);o.onload=()=>{clearTimeout(s),t(o)},o.onerror=()=>{clearTimeout(s),t(null)},o.src=e})}function Y(e){try{const t=e.split(",");if(t.length<2)throw new Error("Invalid data URL format");const o=t[0].match(/:(.*?);/),s=o?o[1]:"image/png",a=atob(t[1]),g=a.length,l=new Uint8Array(g);for(let i=0;i<g;i++)l[i]=a.charCodeAt(i);return new Blob([l],{type:s})}catch(t){return console.error("[CONTENT] Failed to convert data URL to blob:",t),new Blob([],{type:"image/png"})}}function de(){console.log("[CONTENT] Restoring original images...");let e=0;A.forEach((t,o)=>{o&&o.parentElement&&(o.src=t,delete o.dataset.processed,e++)}),A.clear(),console.log(`[CONTENT] Restored ${e} images`),f(`Restored ${e} image(s)`,"info")}function x(e,t){chrome.runtime.sendMessage({action:"processing-update",progress:e,details:t}).catch(o=>{console.log("[CONTENT] Failed to send progress update:",o.message)})}function ee(e){chrome.runtime.sendMessage({action:"processing-complete",analytics:e}).catch(t=>{console.log("[CONTENT] Failed to send completion message:",t.message)})}function f(e,t="info",o,s=!1,a=!1){console.log(`[CONTENT] Notification: ${e}`);const g={info:"",success:"✓",error:"✕",warning:"!"},l=t==="info"&&s,i=document.createElement("div");i.setAttribute("role","status"),i.setAttribute("aria-live","polite"),i.style.cssText=`
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(30, 30, 30, 0.55);
    backdrop-filter: blur(50px) saturate(150%);
    -webkit-backdrop-filter: blur(50px) saturate(150%);
    color: rgba(255, 255, 255, 0.95);
    padding: 12px 16px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 400;
    z-index: 999999;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.08);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    animation: mangaNotifSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    max-width: 340px;
    cursor: ${o?"pointer":"default"};
    user-select: none;
  `;const d=document.createElement("div");d.style.cssText="display: flex; align-items: flex-start; gap: 10px;";const u=document.createElement("span");l?u.style.cssText=`
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 5px;
      animation: mangaPulse 1.5s ease-in-out infinite;
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
    `:(u.textContent=g[t],u.style.cssText=`
      font-size: 14px;
      font-weight: 600;
      opacity: 0.8;
      flex-shrink: 0;
      margin-top: 1px;
      color: ${t==="success"?"#10b981":t==="error"?"#ef4444":t==="warning"?"#f59e0b":"rgba(255, 255, 255, 0.8)"};
    `);const p=document.createElement("div");p.style.cssText="flex: 1; min-width: 0;";const n=document.createElement("div");if(n.textContent=e,n.style.cssText=`
    font-weight: 500;
    line-height: 1.4;
    color: rgba(255, 255, 255, 0.95);
  `,p.appendChild(n),o){const m=document.createElement("div");m.innerText=o,m.style.cssText=`
      font-size: 11px;
      color: rgba(255, 255, 255, 0.6);
      margin-top: 6px;
      line-height: 1.5;
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease, margin-top 0.2s ease;
      white-space: pre-wrap;
    `;const w=document.createElement("div");w.textContent="Click for details",w.style.cssText=`
      font-size: 10px;
      color: rgba(255, 255, 255, 0.4);
      margin-top: 4px;
      transition: opacity 0.2s ease;
    `,p.appendChild(m),p.appendChild(w);let E=a;E&&(m.style.maxHeight="200px",m.style.marginTop="8px",w.style.opacity="0"),i.addEventListener("click",()=>{E=!E,E?(m.style.maxHeight="200px",m.style.marginTop="8px",w.style.opacity="0"):(m.style.maxHeight="0",m.style.marginTop="0",w.style.opacity="1")})}d.appendChild(u),d.appendChild(p);const r=document.createElement("button");if(r.innerHTML="×",r.style.cssText=`
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.4);
    font-size: 18px;
    font-weight: 300;
    cursor: pointer;
    padding: 0 0 0 8px;
    margin: -2px -4px -2px 0;
    line-height: 1;
    transition: color 0.15s ease;
    flex-shrink: 0;
  `,r.onmouseenter=()=>{r.style.color="rgba(255, 255, 255, 0.8)"},r.onmouseleave=()=>{r.style.color="rgba(255, 255, 255, 0.4)"},d.appendChild(r),i.appendChild(d),!document.getElementById("manga-processor-styles")){const m=document.createElement("style");m.id="manga-processor-styles",m.textContent=`
      @keyframes mangaNotifSlideIn {
        from {
          transform: translateX(400px) scale(0.9);
          opacity: 0;
        }
        to {
          transform: translateX(0) scale(1);
          opacity: 1;
        }
      }
      @keyframes mangaNotifSlideOut {
        from {
          transform: translateX(0) scale(1);
          opacity: 1;
        }
        to {
          transform: translateX(400px) scale(0.9);
          opacity: 0;
        }
      }
      @keyframes mangaPulse {
        0%, 100% {
          opacity: 1;
          transform: scale(1);
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
        }
        50% {
          opacity: 0.6;
          transform: scale(0.85);
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.8);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        @keyframes mangaNotifSlideIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes mangaNotifSlideOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      }
    `,document.head.appendChild(m)}document.body.appendChild(i);const b=()=>{i.style.animation="mangaNotifSlideOut 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",setTimeout(()=>i.remove(),300)};if(r.onclick=m=>{m.stopPropagation(),b()},!s){const m=o?6e3:4e3;let w=null,E=m,y=Date.now();const _=()=>{y=Date.now(),w=setTimeout(b,E)},k=()=>{w&&(clearTimeout(w),w=null,E-=Date.now()-y)};i.addEventListener("mouseenter",k),i.addEventListener("mouseleave",_),_()}return b}function me(e){if(P){console.log("[CONTENT] Already in selection mode");return}if($){f("Task in progress","warning","Please wait for the current operation to complete.");return}console.log("[CONTENT] Entering selection mode..."),P=!0;const t=document.createElement("div");t.id="manga-selection-overlay",t.style.cssText=`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    z-index: 999998;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: crosshair;
    animation: mangaFadeIn 0.2s ease-out;
  `;const o=document.createElement("div");if(o.style.cssText=`
    background: rgba(30, 30, 30, 0.95);
    color: rgba(255, 255, 255, 0.95);
    padding: 24px 32px;
    border-radius: 16px;
    font-size: 16px;
    font-weight: 500;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    pointer-events: none;
    max-width: 400px;
  `,o.innerHTML=`
    <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">Click on an image to translate</div>
    <div style="font-size: 13px; color: rgba(255, 255, 255, 0.6);">Press ESC to cancel</div>
  `,t.appendChild(o),!document.getElementById("manga-selection-styles")){const n=document.createElement("style");n.id="manga-selection-styles",n.textContent=`
      @keyframes mangaFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes mangaFadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      .manga-image-highlight {
        outline: 3px solid #10b981 !important;
        outline-offset: 2px;
        box-shadow: 0 0 20px rgba(16, 185, 129, 0.5) !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
      }
      .manga-image-highlight:hover {
        outline-width: 4px !important;
        outline-offset: 3px;
        box-shadow: 0 0 30px rgba(16, 185, 129, 0.7) !important;
        transform: scale(1.02) !important;
      }
    `,document.head.appendChild(n)}document.body.appendChild(t);const a=Array.from(document.querySelectorAll("img")).filter(n=>{const r=n.getBoundingClientRect();return r.width>=200&&r.height>=200&&Z(n)&&n.naturalWidth>=200&&n.naturalHeight>=200});console.log(`[CONTENT] Found ${a.length} selectable images`);const g=n=>{const r=n.target;a.includes(r)&&r.classList.add("manga-image-highlight")},l=n=>{const r=n.target;a.includes(r)&&r.classList.remove("manga-image-highlight")},i=async n=>{const r=n.target;if(a.includes(r)){n.preventDefault(),n.stopPropagation();const b=r;console.log("[CONTENT] Image selected:",b.src),p(),await ue(b,e)}},d=n=>{n.key==="Escape"&&(n.preventDefault(),console.log("[CONTENT] Selection mode cancelled"),p())},u=n=>{n.target===t&&p()};function p(){P&&(P=!1,document.removeEventListener("mouseover",g,!0),document.removeEventListener("mouseout",l,!0),document.removeEventListener("click",i,!0),document.removeEventListener("keydown",d,!0),t.removeEventListener("click",u),a.forEach(n=>n.classList.remove("manga-image-highlight")),t.style.animation="mangaFadeOut 0.2s ease-out",setTimeout(()=>t.remove(),200))}document.addEventListener("mouseover",g,!0),document.addEventListener("mouseout",l,!0),document.addEventListener("click",i,!0),document.addEventListener("keydown",d,!0),t.addEventListener("click",u)}async function ue(e,t){if($){f("Task in progress","warning","Please wait for the current operation to complete.");return}console.log("[CONTENT] Processing single image...");const o=t.localOcr&&t.useCerebras;if(!o&&(!t.apiKeys||t.apiKeys.length===0)){f("API keys required","error","Open extension settings and add your Gemini API keys to enable translation.");return}if(o&&!t.cerebrasApiKey){f("Cerebras API key required","error","Open extension settings and add your Cerebras API key to use Cerebras translation.");return}try{const s=new AbortController,a=setTimeout(()=>s.abort(),5e3),g=await fetch(`${t.serverUrl}/health`,{method:"GET",signal:s.signal});if(clearTimeout(a),!g.ok){f("Server unavailable","error","The server returned an error. Verify the server is running correctly.");return}}catch(s){s.name==="AbortError"?f("Connection timeout","error","Could not reach the server within 5 seconds. Check if the server is running and Local Network Access permission is granted."):f("Connection failed","error",`Unable to connect to ${t.serverUrl}. Verify the URL, server status, and Chrome Local Network Access permission.`);return}$=!0;try{const s=f("Processing image...","info",void 0,!0);x(0,"Converting image...");const a=await Q(e),g=e.src;x(30,"Converted image..."),console.log("[CONTENT] Converted single image to blob"),x(40,"Sending to server...");const l=new FormData;l.append("images",a,"image_0.png");const i={apiKeys:t.apiKeys,ocr_translation_model:t.translateModel,targetLanguage:t.targetLanguage,font_source:t.fontSource,includeFreeText:t.includeFreeText,bananaMode:t.bananaMode,textStroke:t.textStroke,backgroundType:t.backgroundType,cache:t.cache,metricsDetail:t.metricsDetail,tighterBounds:t.tighterBounds,filterOrphanRegions:t.filterOrphanRegions,useMask:t.maskMode!=="off",maskMode:t.maskMode||"fast",mergeImg:t.mergeImg,sessionLimit:t.sessionLimit,targetSize:t.targetSize,l1Debug:t.l1Debug,ocr:t.localOcr,useCerebras:t.useCerebras,cerebrasApiKey:t.cerebrasApiKey};t.fontSource==="google"?i.google_font_family=t.googleFontFamily:i.font_family=t.fontFamily,l.append("config",JSON.stringify(i));const d=new AbortController,u=setTimeout(()=>d.abort(),9e4),p=await fetch(`${t.serverUrl}/process`,{method:"POST",body:l,signal:d.signal});if(clearTimeout(u),!p.ok)throw new Error(`Server error: ${p.status} ${p.statusText}`);x(70,"Processing on server...");const n=await p.json();console.log("[CONTENT] Server response:",n),x(90,"Applying result..."),n.results&&n.results[0]?.success&&n.results[0].data_url&&(A.set(e,g),e.src=n.results[0].data_url,e.dataset.processed="true",console.log("[CONTENT] Applied processed image")),x(100,"Complete!"),s();const r=n.analytics;let b;if(t.metricsDetail&&r){const m=[],w=r.total_time_ms?(r.total_time_ms/1e3).toFixed(1):"0",E=r.phase1_time_ms?(r.phase1_time_ms/1e3).toFixed(1):null,y=r.phase2_time_ms?(r.phase2_time_ms/1e3).toFixed(1):null;let _=`${w}s total`;E&&y&&(_+=` (detect: ${E}s, translate: ${y}s)`),m.push(_);const k=r.total_regions||0;k>0&&m.push(`${k} region${k!==1?"s":""} translated`),b=m.join(`
`)}else if(r){const m=r.total_time_ms?(r.total_time_ms/1e3).toFixed(1):null;b=m?`Completed in ${m}s`:void 0}f("Image processed successfully","success",b,!1,t.metricsDetail),ee(n.analytics),n.analytics&&await J(n.analytics),console.log("[CONTENT] Single image processing complete")}catch(s){console.error("[CONTENT] Single image processing error:",s),f("Processing failed","error",s.message)}finally{$=!1}}
