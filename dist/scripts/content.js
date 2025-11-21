console.log("[CONTENT] Manga Text Processor: Content script loaded");async function B(e){try{const t="cumulativeStats",n=(await chrome.storage.local.get(t))[t]||{totalSessions:0,totalImages:0,totalRegions:0,totalSimpleBg:0,totalComplexBg:0,totalApiCalls:0,totalInputTokens:0,totalOutputTokens:0,totalCacheHits:0,totalCacheMisses:0,totalProcessingTimeMs:0},c={totalSessions:n.totalSessions+1,totalImages:n.totalImages+(e.total_images||0),totalRegions:n.totalRegions+(e.total_regions||0),totalSimpleBg:n.totalSimpleBg+(e.simple_bg_count||0),totalComplexBg:n.totalComplexBg+(e.complex_bg_count||0),totalApiCalls:n.totalApiCalls+(e.api_calls_simple||0)+(e.api_calls_complex||0)+(e.api_calls_banana||0),totalInputTokens:n.totalInputTokens+(e.input_tokens||0),totalOutputTokens:n.totalOutputTokens+(e.output_tokens||0),totalCacheHits:n.totalCacheHits+(e.cache_hits||0),totalCacheMisses:n.totalCacheMisses+(e.cache_misses||0),totalProcessingTimeMs:n.totalProcessingTimeMs+(e.total_time_ms||0),lastProcessedAt:Date.now(),firstProcessedAt:n.firstProcessedAt||Date.now()};await chrome.storage.local.set({[t]:c})}catch(t){console.error("[CONTENT] Failed to save cumulative stats:",t)}}let C=!1,_=!1;const k=new Map;chrome.runtime.onMessage.addListener((e,t,o)=>(console.log("[CONTENT] Message received:",e),e.action==="process-images"&&e.config?(H(e.config).then(n=>{o({success:!0,result:n})}).catch(n=>{console.error("[CONTENT] Processing error:",n),o({success:!1,error:n.message})}),!0):e.action==="enter-selection-mode"&&e.config?(K(e.config),o({success:!0}),!1):(e.action==="restore-images"&&(z(),o({success:!0})),!1)));async function H(e){if(C)throw h("Task in progress","warning","Please wait for the current operation to complete before starting a new one."),new Error("Processing already in progress");if(console.log("[CONTENT] Starting page image processing..."),console.log("[CONTENT] Config:",e),!e.apiKeys||e.apiKeys.length===0)throw h("API keys required","error","Open extension settings and add your Gemini API keys to enable translation."),new Error("No API keys configured");try{const t=new AbortController,o=setTimeout(()=>t.abort(),3e3),n=await fetch(`${e.serverUrl}/health`,{method:"GET",signal:t.signal});if(clearTimeout(o),!n.ok)throw h("Server unavailable","error","The server returned an error. Verify the server is running correctly."),new Error("Server health check failed")}catch(t){throw t.name==="AbortError"?h("Connection timeout","error","Could not reach the server within 3 seconds. Check if the server is running."):t.message!=="Server health check failed"&&h("Connection failed","error",`Unable to connect to ${e.serverUrl}. Verify the URL and server status.`),t}C=!0;try{const t=Array.from(document.querySelectorAll("img"));console.log(`[CONTENT] Found ${t.length} total images`);const o=t.filter(a=>{const f=a.getBoundingClientRect();return f.width>200&&f.height>200&&a.offsetParent!==null&&a.naturalWidth>200&&a.naturalHeight>200});if(console.log(`[CONTENT] Filtered to ${o.length} large images`),o.length===0)return h("No images detected","info","No images larger than 200×200px found. Try scrolling to load more content."),{processed:0};const n=h(`Processing ${o.length} image${o.length>1?"s":""}...`,"info",void 0,!0);b(0,`Converting ${o.length} images...`);const c=[],g=[],p=o.map((a,f)=>U(a).then(y=>(console.log(`[CONTENT] Converted image ${f+1}/${o.length}`),{blob:y,img:a,index:f})).catch(y=>(console.error(`[CONTENT] Failed to convert image ${f+1}:`,y),null))),l=await Promise.all(p);l.forEach(a=>{a&&(c.push(a.blob),g.push({img:a.img,originalSrc:a.img.src}))});const d=Math.round(l.length/o.length*30);if(b(d,`Converted ${c.length}/${o.length} images...`),console.log(`[CONTENT] Converted ${c.length} images to blobs`),c.length===0)throw new Error("Failed to convert any images");b(40,"Sending to server...");const m=new FormData;c.forEach((a,f)=>{m.append("images",a,`image_${f}.png`)});const x={apiKeys:e.apiKeys,ocr_translation_model:e.translateModel,includeFreeText:e.includeFreeText,bananaMode:e.bananaMode,textStroke:e.textStroke,blurFreeTextBg:e.blurFreeTextBg,cache:e.cache,metricsDetail:e.metricsDetail,useMask:e.useMask,mergeImg:e.mergeImg,sessionLimit:e.sessionLimit};m.append("config",JSON.stringify(x));const r=await fetch(`${e.serverUrl}/process`,{method:"POST",body:m});if(!r.ok)throw new Error(`Server error: ${r.status} ${r.statusText}`);b(70,"Processing on server...");const i=await r.json();console.log("[CONTENT] Server response:",i),b(90,"Applying results...");let T=0;i.results&&i.results.length>0&&i.results.forEach((a,f)=>{if(a.success&&a.data_url&&g[f]){const{img:y,originalSrc:w}=g[f];k.set(y,w),y.src=a.data_url,y.dataset.processed="true",T++,console.log(`[CONTENT] Applied processed image ${f+1}`)}}),b(100,"Complete!"),n();const s=i.analytics;let u;if(e.metricsDetail&&s){const a=[],f=s.total_time_ms?(s.total_time_ms/1e3).toFixed(1):"0",y=s.phase1_time_ms?(s.phase1_time_ms/1e3).toFixed(1):null,w=s.phase2_time_ms?(s.phase2_time_ms/1e3).toFixed(1):null;let $=`${f}s total`;y&&w&&($+=` (detect: ${y}s, translate: ${w}s)`),a.push($);const N=s.total_regions||0,O=s.simple_bg_count||0,I=s.complex_bg_count||0;if(N>0){let v=`${N} region${N!==1?"s":""}`;(O||I)&&(v+=` · ${O} simple, ${I} complex bg`),a.push(v)}const E=(s.api_calls_simple||0)+(s.api_calls_complex||0),P=s.cache_hits||0,D=s.cache_misses||0,S=P+D;if(E>0||S>0){let v="";if(E>0&&(v+=`${E} API call${E!==1?"s":""}`),S>0){const F=(P/S*100).toFixed(0);v+=v?` · ${F}% cache hit`:`${F}% cache hit`}v&&a.push(v)}const L=(s.input_tokens||0)+(s.output_tokens||0);L>0&&a.push(`${L.toLocaleString()} tokens used`),u=a.join(`
`)}else if(s){const a=s.total_time_ms?(s.total_time_ms/1e3).toFixed(1):null;u=a?`Completed in ${a}s`:void 0}return h(`${T} image${T!==1?"s":""} processed`,"success",u,!1,e.metricsDetail),A(i.analytics),i.analytics&&await B(i.analytics),console.log(`[CONTENT] Processing complete: ${T}/${c.length} images applied`),{processed:T,analytics:i.analytics}}finally{C=!1}}async function U(e){const t=e.src;if(t.startsWith("data:"))return M(t);if(t.startsWith("blob:"))return(await fetch(t)).blob();const o=await chrome.runtime.sendMessage({action:"fetch-image",url:t});if(!o.success)throw new Error(`Background fetch failed: ${o.error}`);const n=M(o.base64);return n.type==="image/png"?n:await R(n,e.naturalWidth||e.width,e.naturalHeight||e.height)}async function R(e,t,o){return new Promise((n,c)=>{const g=URL.createObjectURL(e),p=new Image;p.onload=()=>{URL.revokeObjectURL(g);const l=document.createElement("canvas"),d=l.getContext("2d");if(!d){c(new Error("Failed to get canvas context"));return}l.width=t||p.naturalWidth,l.height=o||p.naturalHeight,d.drawImage(p,0,0),l.toBlob(m=>{n(m||e)},"image/png")},p.onerror=()=>{URL.revokeObjectURL(g),n(e)},p.src=g})}function M(e){const t=e.split(","),o=t[0].match(/:(.*?);/),n=o?o[1]:"image/png",c=atob(t[1]),g=c.length,p=new Uint8Array(g);for(let l=0;l<g;l++)p[l]=c.charCodeAt(l);return new Blob([p],{type:n})}function z(){console.log("[CONTENT] Restoring original images...");let e=0;k.forEach((t,o)=>{o&&o.parentElement&&(o.src=t,delete o.dataset.processed,e++)}),k.clear(),console.log(`[CONTENT] Restored ${e} images`),h(`Restored ${e} image(s)`,"info")}function b(e,t){chrome.runtime.sendMessage({action:"processing-update",progress:e,details:t}).catch(o=>{console.log("[CONTENT] Failed to send progress update:",o.message)})}function A(e){chrome.runtime.sendMessage({action:"processing-complete",analytics:e}).catch(t=>{console.log("[CONTENT] Failed to send completion message:",t.message)})}function h(e,t="info",o,n=!1,c=!1){console.log(`[CONTENT] Notification: ${e}`);const g={info:"",success:"✓",error:"✕",warning:"!"},p=t==="info"&&n,l=document.createElement("div");l.setAttribute("role","status"),l.setAttribute("aria-live","polite"),l.style.cssText=`
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
  `;const d=document.createElement("div");d.style.cssText="display: flex; align-items: flex-start; gap: 10px;";const m=document.createElement("span");p?m.style.cssText=`
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 5px;
      animation: mangaPulse 1.5s ease-in-out infinite;
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
    `:(m.textContent=g[t],m.style.cssText=`
      font-size: 14px;
      font-weight: 600;
      opacity: 0.8;
      flex-shrink: 0;
      margin-top: 1px;
      color: ${t==="success"?"#10b981":t==="error"?"#ef4444":t==="warning"?"#f59e0b":"rgba(255, 255, 255, 0.8)"};
    `);const x=document.createElement("div");x.style.cssText="flex: 1; min-width: 0;";const r=document.createElement("div");if(r.textContent=e,r.style.cssText=`
    font-weight: 500;
    line-height: 1.4;
    color: rgba(255, 255, 255, 0.95);
  `,x.appendChild(r),o){const s=document.createElement("div");s.innerText=o,s.style.cssText=`
      font-size: 11px;
      color: rgba(255, 255, 255, 0.6);
      margin-top: 6px;
      line-height: 1.5;
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease, margin-top 0.2s ease;
      white-space: pre-wrap;
    `;const u=document.createElement("div");u.textContent="Click for details",u.style.cssText=`
      font-size: 10px;
      color: rgba(255, 255, 255, 0.4);
      margin-top: 4px;
      transition: opacity 0.2s ease;
    `,x.appendChild(s),x.appendChild(u);let a=c;a&&(s.style.maxHeight="200px",s.style.marginTop="8px",u.style.opacity="0"),l.addEventListener("click",()=>{a=!a,a?(s.style.maxHeight="200px",s.style.marginTop="8px",u.style.opacity="0"):(s.style.maxHeight="0",s.style.marginTop="0",u.style.opacity="1")})}d.appendChild(m),d.appendChild(x);const i=document.createElement("button");if(i.innerHTML="×",i.style.cssText=`
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
  `,i.onmouseenter=()=>{i.style.color="rgba(255, 255, 255, 0.8)"},i.onmouseleave=()=>{i.style.color="rgba(255, 255, 255, 0.4)"},d.appendChild(i),l.appendChild(d),!document.getElementById("manga-processor-styles")){const s=document.createElement("style");s.id="manga-processor-styles",s.textContent=`
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
    `,document.head.appendChild(s)}document.body.appendChild(l);const T=()=>{l.style.animation="mangaNotifSlideOut 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",setTimeout(()=>l.remove(),300)};if(i.onclick=s=>{s.stopPropagation(),T()},!n){const s=o?6e3:4e3;let u=null,a=s,f=Date.now();const y=()=>{f=Date.now(),u=setTimeout(T,a)},w=()=>{u&&(clearTimeout(u),u=null,a-=Date.now()-f)};l.addEventListener("mouseenter",w),l.addEventListener("mouseleave",y),y()}return T}function K(e){if(_){console.log("[CONTENT] Already in selection mode");return}if(C){h("Task in progress","warning","Please wait for the current operation to complete.");return}console.log("[CONTENT] Entering selection mode..."),_=!0;const t=document.createElement("div");t.id="manga-selection-overlay",t.style.cssText=`
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
  `,t.appendChild(o),!document.getElementById("manga-selection-styles")){const r=document.createElement("style");r.id="manga-selection-styles",r.textContent=`
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
    `,document.head.appendChild(r)}document.body.appendChild(t);const c=Array.from(document.querySelectorAll("img")).filter(r=>{const i=r.getBoundingClientRect();return i.width>200&&i.height>200&&r.offsetParent!==null&&r.naturalWidth>200&&r.naturalHeight>200});console.log(`[CONTENT] Found ${c.length} selectable images`);const g=r=>{const i=r.target;c.includes(i)&&i.classList.add("manga-image-highlight")},p=r=>{const i=r.target;c.includes(i)&&i.classList.remove("manga-image-highlight")},l=async r=>{const i=r.target;if(c.includes(i)){r.preventDefault(),r.stopPropagation();const T=i;console.log("[CONTENT] Image selected:",T.src),x(),await j(T,e)}},d=r=>{r.key==="Escape"&&(r.preventDefault(),console.log("[CONTENT] Selection mode cancelled"),x())},m=r=>{r.target===t&&x()};function x(){_&&(_=!1,document.removeEventListener("mouseover",g,!0),document.removeEventListener("mouseout",p,!0),document.removeEventListener("click",l,!0),document.removeEventListener("keydown",d,!0),t.removeEventListener("click",m),c.forEach(r=>r.classList.remove("manga-image-highlight")),t.style.animation="mangaFadeOut 0.2s ease-out",setTimeout(()=>t.remove(),200))}document.addEventListener("mouseover",g,!0),document.addEventListener("mouseout",p,!0),document.addEventListener("click",l,!0),document.addEventListener("keydown",d,!0),t.addEventListener("click",m)}async function j(e,t){if(C){h("Task in progress","warning","Please wait for the current operation to complete.");return}if(console.log("[CONTENT] Processing single image..."),!t.apiKeys||t.apiKeys.length===0){h("API keys required","error","Open extension settings and add your Gemini API keys to enable translation.");return}try{const o=new AbortController,n=setTimeout(()=>o.abort(),3e3),c=await fetch(`${t.serverUrl}/health`,{method:"GET",signal:o.signal});if(clearTimeout(n),!c.ok){h("Server unavailable","error","The server returned an error. Verify the server is running correctly.");return}}catch(o){o.name==="AbortError"?h("Connection timeout","error","Could not reach the server within 3 seconds. Check if the server is running."):h("Connection failed","error",`Unable to connect to ${t.serverUrl}. Verify the URL and server status.`);return}C=!0;try{const o=h("Processing image...","info",void 0,!0);b(0,"Converting image...");const n=await U(e),c=e.src;b(30,"Converted image..."),console.log("[CONTENT] Converted single image to blob"),b(40,"Sending to server...");const g=new FormData;g.append("images",n,"image_0.png");const p={apiKeys:t.apiKeys,ocr_translation_model:t.translateModel,includeFreeText:t.includeFreeText,bananaMode:t.bananaMode,textStroke:t.textStroke,blurFreeTextBg:t.blurFreeTextBg,cache:t.cache,metricsDetail:t.metricsDetail,useMask:t.useMask,mergeImg:t.mergeImg,sessionLimit:t.sessionLimit};g.append("config",JSON.stringify(p));const l=await fetch(`${t.serverUrl}/process`,{method:"POST",body:g});if(!l.ok)throw new Error(`Server error: ${l.status} ${l.statusText}`);b(70,"Processing on server...");const d=await l.json();console.log("[CONTENT] Server response:",d),b(90,"Applying result..."),d.results&&d.results[0]?.success&&d.results[0].data_url&&(k.set(e,c),e.src=d.results[0].data_url,e.dataset.processed="true",console.log("[CONTENT] Applied processed image")),b(100,"Complete!"),o();const m=d.analytics;let x;if(t.metricsDetail&&m){const r=[],i=m.total_time_ms?(m.total_time_ms/1e3).toFixed(1):"0",T=m.phase1_time_ms?(m.phase1_time_ms/1e3).toFixed(1):null,s=m.phase2_time_ms?(m.phase2_time_ms/1e3).toFixed(1):null;let u=`${i}s total`;T&&s&&(u+=` (detect: ${T}s, translate: ${s}s)`),r.push(u);const a=m.total_regions||0;a>0&&r.push(`${a} region${a!==1?"s":""} translated`),x=r.join(`
`)}else if(m){const r=m.total_time_ms?(m.total_time_ms/1e3).toFixed(1):null;x=r?`Completed in ${r}s`:void 0}h("Image processed successfully","success",x,!1,t.metricsDetail),A(d.analytics),d.analytics&&await B(d.analytics),console.log("[CONTENT] Single image processing complete")}catch(o){console.error("[CONTENT] Single image processing error:",o),h("Processing failed","error",o.message)}finally{C=!1}}console.log("[CONTENT] Content script ready");
