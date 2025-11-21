console.log("[CONTENT] Manga Text Processor: Content script loaded");async function U(e){try{const t="cumulativeStats",r=(await chrome.storage.local.get(t))[t]||{totalSessions:0,totalImages:0,totalRegions:0,totalSimpleBg:0,totalComplexBg:0,totalApiCalls:0,totalInputTokens:0,totalOutputTokens:0,totalCacheHits:0,totalCacheMisses:0,totalProcessingTimeMs:0},c={totalSessions:r.totalSessions+1,totalImages:r.totalImages+(e.total_images||0),totalRegions:r.totalRegions+(e.total_regions||0),totalSimpleBg:r.totalSimpleBg+(e.simple_bg_count||0),totalComplexBg:r.totalComplexBg+(e.complex_bg_count||0),totalApiCalls:r.totalApiCalls+(e.api_calls_simple||0)+(e.api_calls_complex||0)+(e.api_calls_banana||0),totalInputTokens:r.totalInputTokens+(e.input_tokens||0),totalOutputTokens:r.totalOutputTokens+(e.output_tokens||0),totalCacheHits:r.totalCacheHits+(e.cache_hits||0),totalCacheMisses:r.totalCacheMisses+(e.cache_misses||0),totalProcessingTimeMs:r.totalProcessingTimeMs+(e.total_time_ms||0),lastProcessedAt:Date.now(),firstProcessedAt:r.firstProcessedAt||Date.now()};await chrome.storage.local.set({[t]:c})}catch(t){console.error("[CONTENT] Failed to save cumulative stats:",t)}}let E=!1,N=!1;const S=new Map;chrome.runtime.onMessage.addListener((e,t,o)=>(console.log("[CONTENT] Message received:",e),e.action==="process-images"&&e.config?(z(e.config).then(r=>{o({success:!0,result:r})}).catch(r=>{console.error("[CONTENT] Processing error:",r),o({success:!1,error:r.message})}),!0):e.action==="enter-selection-mode"&&e.config?(W(e.config),o({success:!0}),!1):(e.action==="restore-images"&&(j(),o({success:!0})),!1)));async function z(e){if(E)throw y("Task in progress","warning","Please wait for the current operation to complete before starting a new one."),new Error("Processing already in progress");if(console.log("[CONTENT] Starting page image processing..."),console.log("[CONTENT] Config:",e),!e.apiKeys||e.apiKeys.length===0)throw y("API keys required","error","Open extension settings and add your Gemini API keys to enable translation."),new Error("No API keys configured");try{const t=new AbortController,o=setTimeout(()=>t.abort(),5e3),r=await fetch(`${e.serverUrl}/health`,{method:"GET",signal:t.signal});if(clearTimeout(o),!r.ok)throw y("Server unavailable","error","The server returned an error. Verify the server is running correctly."),new Error("Server health check failed")}catch(t){throw t.name==="AbortError"?y("Connection timeout","error","Could not reach the server within 5 seconds. Check if the server is running and Local Network Access permission is granted."):t.message!=="Server health check failed"&&y("Connection failed","error",`Unable to connect to ${e.serverUrl}. Verify the URL, server status, and Chrome Local Network Access permission.`),t}E=!0;try{const t=Array.from(document.querySelectorAll("img"));console.log(`[CONTENT] Found ${t.length} total images`);const o=t.filter(n=>{const T=n.getBoundingClientRect();return T.width>200&&T.height>200&&n.offsetParent!==null&&n.naturalWidth>200&&n.naturalHeight>200});if(console.log(`[CONTENT] Filtered to ${o.length} large images`),o.length===0)return y("No images detected","info","No images larger than 200×200px found. Try scrolling to load more content."),{processed:0};const r=y(`Processing ${o.length} image${o.length>1?"s":""}...`,"info",void 0,!0);b(0,`Converting ${o.length} images...`);const c=[],p=[],h=o.map((n,T)=>R(n).then(C=>(console.log(`[CONTENT] Converted image ${T+1}/${o.length}`),{blob:C,img:n,index:T})).catch(C=>(console.error(`[CONTENT] Failed to convert image ${T+1}:`,C),null))),i=await Promise.all(h);i.forEach(n=>{n&&(c.push(n.blob),p.push({img:n.img,originalSrc:n.img.src}))});const x=Math.round(i.length/o.length*30);if(b(x,`Converted ${c.length}/${o.length} images...`),console.log(`[CONTENT] Converted ${c.length} images to blobs`),c.length===0)throw new Error("Failed to convert any images");b(40,"Sending to server...");const u=new FormData;c.forEach((n,T)=>{u.append("images",n,`image_${T}.png`)});const d={apiKeys:e.apiKeys,ocr_translation_model:e.translateModel,targetLanguage:e.targetLanguage,font_source:e.fontSource,font_family:e.fontFamily,google_font_family:e.googleFontFamily,includeFreeText:e.includeFreeText,bananaMode:e.bananaMode,textStroke:e.textStroke,backgroundType:e.backgroundType,cache:e.cache,metricsDetail:e.metricsDetail,tighterBounds:e.tighterBounds,filterOrphanRegions:e.filterOrphanRegions,useMask:e.useMask,mergeImg:e.mergeImg,sessionLimit:e.sessionLimit,targetSize:e.targetSize};u.append("config",JSON.stringify(d));const s=new AbortController,m=setTimeout(()=>s.abort(),9e4),f=await fetch(`${e.serverUrl}/process`,{method:"POST",body:u,signal:s.signal});if(clearTimeout(m),!f.ok)throw new Error(`Server error: ${f.status} ${f.statusText}`);b(70,"Processing on server...");const l=await f.json();console.log("[CONTENT] Server response:",l),b(90,"Applying results...");let g=0;l.results&&l.results.length>0&&l.results.forEach((n,T)=>{if(n.success&&n.data_url&&p[T]){const{img:C,originalSrc:k}=p[T];S.set(C,k),C.src=n.data_url,C.dataset.processed="true",g++,console.log(`[CONTENT] Applied processed image ${T+1}`)}}),b(100,"Complete!"),r();const a=l.analytics;let v;if(e.metricsDetail&&a){const n=[],T=a.total_time_ms?(a.total_time_ms/1e3).toFixed(1):"0",C=a.phase1_time_ms?(a.phase1_time_ms/1e3).toFixed(1):null,k=a.phase2_time_ms?(a.phase2_time_ms/1e3).toFixed(1):null;let I=`${T}s total`;C&&k&&(I+=` (detect: ${C}s, translate: ${k}s)`),n.push(I);const O=a.total_regions||0,P=a.simple_bg_count||0,L=a.complex_bg_count||0;if(O>0){let w=`${O} region${O!==1?"s":""}`;(P||L)&&(w+=` · ${P} simple, ${L} complex bg`),n.push(w)}const _=(a.api_calls_simple||0)+(a.api_calls_complex||0),M=a.cache_hits||0,H=a.cache_misses||0,$=M+H;if(_>0||$>0){let w="";if(_>0&&(w+=`${_} API call${_!==1?"s":""}`),$>0){const A=(M/$*100).toFixed(0);w+=w?` · ${A}% cache hit`:`${A}% cache hit`}w&&n.push(w)}const F=(a.input_tokens||0)+(a.output_tokens||0);F>0&&n.push(`${F.toLocaleString()} tokens used`),v=n.join(`
`)}else if(a){const n=a.total_time_ms?(a.total_time_ms/1e3).toFixed(1):null;v=n?`Completed in ${n}s`:void 0}return y(`${g} image${g!==1?"s":""} processed`,"success",v,!1,e.metricsDetail),D(l.analytics),l.analytics&&await U(l.analytics),console.log(`[CONTENT] Processing complete: ${g}/${c.length} images applied`),{processed:g,analytics:l.analytics}}finally{E=!1}}async function R(e){const t=e.src;if(t.startsWith("data:"))return B(t);if(t.startsWith("blob:"))return(await fetch(t)).blob();const o=await chrome.runtime.sendMessage({action:"fetch-image",url:t});if(!o.success)throw new Error(`Background fetch failed: ${o.error}`);const r=B(o.base64);return r.type==="image/png"?r:await K(r,e.naturalWidth||e.width,e.naturalHeight||e.height)}async function K(e,t,o){return new Promise((r,c)=>{const p=URL.createObjectURL(e),h=new Image;h.onload=()=>{URL.revokeObjectURL(p);const i=document.createElement("canvas"),x=i.getContext("2d");if(!x){c(new Error("Failed to get canvas context"));return}i.width=t||h.naturalWidth,i.height=o||h.naturalHeight,x.drawImage(h,0,0),i.toBlob(u=>{r(u||e)},"image/png")},h.onerror=()=>{URL.revokeObjectURL(p),r(e)},h.src=p})}function B(e){const t=e.split(","),o=t[0].match(/:(.*?);/),r=o?o[1]:"image/png",c=atob(t[1]),p=c.length,h=new Uint8Array(p);for(let i=0;i<p;i++)h[i]=c.charCodeAt(i);return new Blob([h],{type:r})}function j(){console.log("[CONTENT] Restoring original images...");let e=0;S.forEach((t,o)=>{o&&o.parentElement&&(o.src=t,delete o.dataset.processed,e++)}),S.clear(),console.log(`[CONTENT] Restored ${e} images`),y(`Restored ${e} image(s)`,"info")}function b(e,t){chrome.runtime.sendMessage({action:"processing-update",progress:e,details:t}).catch(o=>{console.log("[CONTENT] Failed to send progress update:",o.message)})}function D(e){chrome.runtime.sendMessage({action:"processing-complete",analytics:e}).catch(t=>{console.log("[CONTENT] Failed to send completion message:",t.message)})}function y(e,t="info",o,r=!1,c=!1){console.log(`[CONTENT] Notification: ${e}`);const p={info:"",success:"✓",error:"✕",warning:"!"},h=t==="info"&&r,i=document.createElement("div");i.setAttribute("role","status"),i.setAttribute("aria-live","polite"),i.style.cssText=`
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
  `;const x=document.createElement("div");x.style.cssText="display: flex; align-items: flex-start; gap: 10px;";const u=document.createElement("span");h?u.style.cssText=`
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 5px;
      animation: mangaPulse 1.5s ease-in-out infinite;
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
    `:(u.textContent=p[t],u.style.cssText=`
      font-size: 14px;
      font-weight: 600;
      opacity: 0.8;
      flex-shrink: 0;
      margin-top: 1px;
      color: ${t==="success"?"#10b981":t==="error"?"#ef4444":t==="warning"?"#f59e0b":"rgba(255, 255, 255, 0.8)"};
    `);const d=document.createElement("div");d.style.cssText="flex: 1; min-width: 0;";const s=document.createElement("div");if(s.textContent=e,s.style.cssText=`
    font-weight: 500;
    line-height: 1.4;
    color: rgba(255, 255, 255, 0.95);
  `,d.appendChild(s),o){const l=document.createElement("div");l.innerText=o,l.style.cssText=`
      font-size: 11px;
      color: rgba(255, 255, 255, 0.6);
      margin-top: 6px;
      line-height: 1.5;
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease, margin-top 0.2s ease;
      white-space: pre-wrap;
    `;const g=document.createElement("div");g.textContent="Click for details",g.style.cssText=`
      font-size: 10px;
      color: rgba(255, 255, 255, 0.4);
      margin-top: 4px;
      transition: opacity 0.2s ease;
    `,d.appendChild(l),d.appendChild(g);let a=c;a&&(l.style.maxHeight="200px",l.style.marginTop="8px",g.style.opacity="0"),i.addEventListener("click",()=>{a=!a,a?(l.style.maxHeight="200px",l.style.marginTop="8px",g.style.opacity="0"):(l.style.maxHeight="0",l.style.marginTop="0",g.style.opacity="1")})}x.appendChild(u),x.appendChild(d);const m=document.createElement("button");if(m.innerHTML="×",m.style.cssText=`
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
  `,m.onmouseenter=()=>{m.style.color="rgba(255, 255, 255, 0.8)"},m.onmouseleave=()=>{m.style.color="rgba(255, 255, 255, 0.4)"},x.appendChild(m),i.appendChild(x),!document.getElementById("manga-processor-styles")){const l=document.createElement("style");l.id="manga-processor-styles",l.textContent=`
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
    `,document.head.appendChild(l)}document.body.appendChild(i);const f=()=>{i.style.animation="mangaNotifSlideOut 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",setTimeout(()=>i.remove(),300)};if(m.onclick=l=>{l.stopPropagation(),f()},!r){const l=o?6e3:4e3;let g=null,a=l,v=Date.now();const n=()=>{v=Date.now(),g=setTimeout(f,a)},T=()=>{g&&(clearTimeout(g),g=null,a-=Date.now()-v)};i.addEventListener("mouseenter",T),i.addEventListener("mouseleave",n),n()}return f}function W(e){if(N){console.log("[CONTENT] Already in selection mode");return}if(E){y("Task in progress","warning","Please wait for the current operation to complete.");return}console.log("[CONTENT] Entering selection mode..."),N=!0;const t=document.createElement("div");t.id="manga-selection-overlay",t.style.cssText=`
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
  `,t.appendChild(o),!document.getElementById("manga-selection-styles")){const s=document.createElement("style");s.id="manga-selection-styles",s.textContent=`
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
    `,document.head.appendChild(s)}document.body.appendChild(t);const c=Array.from(document.querySelectorAll("img")).filter(s=>{const m=s.getBoundingClientRect();return m.width>200&&m.height>200&&s.offsetParent!==null&&s.naturalWidth>200&&s.naturalHeight>200});console.log(`[CONTENT] Found ${c.length} selectable images`);const p=s=>{const m=s.target;c.includes(m)&&m.classList.add("manga-image-highlight")},h=s=>{const m=s.target;c.includes(m)&&m.classList.remove("manga-image-highlight")},i=async s=>{const m=s.target;if(c.includes(m)){s.preventDefault(),s.stopPropagation();const f=m;console.log("[CONTENT] Image selected:",f.src),d(),await V(f,e)}},x=s=>{s.key==="Escape"&&(s.preventDefault(),console.log("[CONTENT] Selection mode cancelled"),d())},u=s=>{s.target===t&&d()};function d(){N&&(N=!1,document.removeEventListener("mouseover",p,!0),document.removeEventListener("mouseout",h,!0),document.removeEventListener("click",i,!0),document.removeEventListener("keydown",x,!0),t.removeEventListener("click",u),c.forEach(s=>s.classList.remove("manga-image-highlight")),t.style.animation="mangaFadeOut 0.2s ease-out",setTimeout(()=>t.remove(),200))}document.addEventListener("mouseover",p,!0),document.addEventListener("mouseout",h,!0),document.addEventListener("click",i,!0),document.addEventListener("keydown",x,!0),t.addEventListener("click",u)}async function V(e,t){if(E){y("Task in progress","warning","Please wait for the current operation to complete.");return}if(console.log("[CONTENT] Processing single image..."),!t.apiKeys||t.apiKeys.length===0){y("API keys required","error","Open extension settings and add your Gemini API keys to enable translation.");return}try{const o=new AbortController,r=setTimeout(()=>o.abort(),5e3),c=await fetch(`${t.serverUrl}/health`,{method:"GET",signal:o.signal});if(clearTimeout(r),!c.ok){y("Server unavailable","error","The server returned an error. Verify the server is running correctly.");return}}catch(o){o.name==="AbortError"?y("Connection timeout","error","Could not reach the server within 5 seconds. Check if the server is running and Local Network Access permission is granted."):y("Connection failed","error",`Unable to connect to ${t.serverUrl}. Verify the URL, server status, and Chrome Local Network Access permission.`);return}E=!0;try{const o=y("Processing image...","info",void 0,!0);b(0,"Converting image...");const r=await R(e),c=e.src;b(30,"Converted image..."),console.log("[CONTENT] Converted single image to blob"),b(40,"Sending to server...");const p=new FormData;p.append("images",r,"image_0.png");const h={apiKeys:t.apiKeys,ocr_translation_model:t.translateModel,includeFreeText:t.includeFreeText,bananaMode:t.bananaMode,textStroke:t.textStroke,backgroundType:t.backgroundType,cache:t.cache,metricsDetail:t.metricsDetail,tighterBounds:t.tighterBounds,filterOrphanRegions:t.filterOrphanRegions,useMask:t.useMask,mergeImg:t.mergeImg,sessionLimit:t.sessionLimit};p.append("config",JSON.stringify(h));const i=new AbortController,x=setTimeout(()=>i.abort(),9e4),u=await fetch(`${t.serverUrl}/process`,{method:"POST",body:p,signal:i.signal});if(clearTimeout(x),!u.ok)throw new Error(`Server error: ${u.status} ${u.statusText}`);b(70,"Processing on server...");const d=await u.json();console.log("[CONTENT] Server response:",d),b(90,"Applying result..."),d.results&&d.results[0]?.success&&d.results[0].data_url&&(S.set(e,c),e.src=d.results[0].data_url,e.dataset.processed="true",console.log("[CONTENT] Applied processed image")),b(100,"Complete!"),o();const s=d.analytics;let m;if(t.metricsDetail&&s){const f=[],l=s.total_time_ms?(s.total_time_ms/1e3).toFixed(1):"0",g=s.phase1_time_ms?(s.phase1_time_ms/1e3).toFixed(1):null,a=s.phase2_time_ms?(s.phase2_time_ms/1e3).toFixed(1):null;let v=`${l}s total`;g&&a&&(v+=` (detect: ${g}s, translate: ${a}s)`),f.push(v);const n=s.total_regions||0;n>0&&f.push(`${n} region${n!==1?"s":""} translated`),m=f.join(`
`)}else if(s){const f=s.total_time_ms?(s.total_time_ms/1e3).toFixed(1):null;m=f?`Completed in ${f}s`:void 0}y("Image processed successfully","success",m,!1,t.metricsDetail),D(d.analytics),d.analytics&&await U(d.analytics),console.log("[CONTENT] Single image processing complete")}catch(o){console.error("[CONTENT] Single image processing error:",o),y("Processing failed","error",o.message)}finally{E=!1}}console.log("[CONTENT] Content script ready");
