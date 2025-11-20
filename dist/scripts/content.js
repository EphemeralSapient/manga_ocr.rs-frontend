import{b as A}from"../assets/storage-D0JZkDY4.js";console.log("[CONTENT] Manga Text Processor: Content script loaded");let C=!1,N=!1;const k=new Map;chrome.runtime.onMessage.addListener((t,e,o)=>(console.log("[CONTENT] Message received:",t),t.action==="process-images"&&t.config?(H(t.config).then(l=>{o({success:!0,result:l})}).catch(l=>{console.error("[CONTENT] Processing error:",l),o({success:!1,error:l.message})}),!0):t.action==="enter-selection-mode"&&t.config?(j(t.config),o({success:!0}),!1):(t.action==="restore-images"&&(z(),o({success:!0})),!1)));async function H(t){if(C)throw h("Task in progress","warning","Please wait for the current operation to complete before starting a new one."),new Error("Processing already in progress");if(console.log("[CONTENT] Starting page image processing..."),console.log("[CONTENT] Config:",t),!t.apiKeys||t.apiKeys.length===0)throw h("API keys required","error","Open extension settings and add your Gemini API keys to enable translation."),new Error("No API keys configured");try{const e=new AbortController,o=setTimeout(()=>e.abort(),3e3),l=await fetch(`${t.serverUrl}/health`,{method:"GET",signal:e.signal});if(clearTimeout(o),!l.ok)throw h("Server unavailable","error","The server returned an error. Verify the server is running correctly."),new Error("Server health check failed")}catch(e){throw e.name==="AbortError"?h("Connection timeout","error","Could not reach the server within 3 seconds. Check if the server is running."):e.message!=="Server health check failed"&&h("Connection failed","error",`Unable to connect to ${t.serverUrl}. Verify the URL and server status.`),e}C=!0;try{const e=Array.from(document.querySelectorAll("img"));console.log(`[CONTENT] Found ${e.length} total images`);const o=e.filter(r=>{const f=r.getBoundingClientRect();return f.width>200&&f.height>200&&r.offsetParent!==null&&r.naturalWidth>200&&r.naturalHeight>200});if(console.log(`[CONTENT] Filtered to ${o.length} large images`),o.length===0)return h("No images detected","info","No images larger than 200×200px found. Try scrolling to load more content."),{processed:0};const l=h(`Processing ${o.length} image${o.length>1?"s":""}...`,"info",void 0,!0);T(0,`Converting ${o.length} images...`);const m=[],g=[],p=o.map((r,f)=>U(r).then(b=>(console.log(`[CONTENT] Converted image ${f+1}/${o.length}`),{blob:b,img:r,index:f})).catch(b=>(console.error(`[CONTENT] Failed to convert image ${f+1}:`,b),null))),i=await Promise.all(p);i.forEach(r=>{r&&(m.push(r.blob),g.push({img:r.img,originalSrc:r.img.src}))});const d=Math.round(i.length/o.length*30);if(T(d,`Converted ${m.length}/${o.length} images...`),console.log(`[CONTENT] Converted ${m.length} images to blobs`),m.length===0)throw new Error("Failed to convert any images");T(40,"Sending to server...");const c=new FormData;m.forEach((r,f)=>{c.append("images",r,`image_${f}.png`)});const y={apiKeys:t.apiKeys,ocr_translation_model:t.translateModel,includeFreeText:t.includeFreeText,bananaMode:t.bananaMode,textStroke:t.textStroke,blurFreeTextBg:t.blurFreeTextBg,cache:t.cache,metricsDetail:t.metricsDetail,useMask:t.useMask,mergeImg:t.mergeImg,sessionLimit:t.sessionLimit};c.append("config",JSON.stringify(y));const n=await fetch(`${t.serverUrl}/process`,{method:"POST",body:c});if(!n.ok)throw new Error(`Server error: ${n.status} ${n.statusText}`);T(70,"Processing on server...");const a=await n.json();console.log("[CONTENT] Server response:",a),T(90,"Applying results...");let x=0;a.results&&a.results.length>0&&a.results.forEach((r,f)=>{if(r.success&&r.data_url&&g[f]){const{img:b,originalSrc:w}=g[f];k.set(b,w),b.src=r.data_url,b.dataset.processed="true",x++,console.log(`[CONTENT] Applied processed image ${f+1}`)}}),T(100,"Complete!"),l();const s=a.analytics;let u;if(t.metricsDetail&&s){const r=[],f=s.total_time_ms?(s.total_time_ms/1e3).toFixed(1):"0",b=s.phase1_time_ms?(s.phase1_time_ms/1e3).toFixed(1):null,w=s.phase2_time_ms?(s.phase2_time_ms/1e3).toFixed(1):null;let S=`${f}s total`;b&&w&&(S+=` (detect: ${b}s, translate: ${w}s)`),r.push(S);const _=s.total_regions||0,O=s.simple_bg_count||0,I=s.complex_bg_count||0;if(_>0){let v=`${_} region${_!==1?"s":""}`;(O||I)&&(v+=` · ${O} simple, ${I} complex bg`),r.push(v)}const E=(s.api_calls_simple||0)+(s.api_calls_complex||0),P=s.cache_hits||0,D=s.cache_misses||0,$=P+D;if(E>0||$>0){let v="";if(E>0&&(v+=`${E} API call${E!==1?"s":""}`),$>0){const F=(P/$*100).toFixed(0);v+=v?` · ${F}% cache hit`:`${F}% cache hit`}v&&r.push(v)}const L=(s.input_tokens||0)+(s.output_tokens||0);L>0&&r.push(`${L.toLocaleString()} tokens used`),u=r.join(`
`)}else if(s){const r=s.total_time_ms?(s.total_time_ms/1e3).toFixed(1):null;u=r?`Completed in ${r}s`:void 0}return h(`${x} image${x!==1?"s":""} processed`,"success",u,!1,t.metricsDetail),B(a.analytics),a.analytics&&await A(a.analytics),console.log(`[CONTENT] Processing complete: ${x}/${m.length} images applied`),{processed:x,analytics:a.analytics}}finally{C=!1}}async function U(t){const e=t.src;if(e.startsWith("data:"))return M(e);if(e.startsWith("blob:"))return(await fetch(e)).blob();const o=await chrome.runtime.sendMessage({action:"fetch-image",url:e});if(!o.success)throw new Error(`Background fetch failed: ${o.error}`);const l=M(o.base64);return l.type==="image/png"?l:await R(l,t.naturalWidth||t.width,t.naturalHeight||t.height)}async function R(t,e,o){return new Promise((l,m)=>{const g=URL.createObjectURL(t),p=new Image;p.onload=()=>{URL.revokeObjectURL(g);const i=document.createElement("canvas"),d=i.getContext("2d");if(!d){m(new Error("Failed to get canvas context"));return}i.width=e||p.naturalWidth,i.height=o||p.naturalHeight,d.drawImage(p,0,0),i.toBlob(c=>{l(c||t)},"image/png")},p.onerror=()=>{URL.revokeObjectURL(g),l(t)},p.src=g})}function M(t){const e=t.split(","),o=e[0].match(/:(.*?);/),l=o?o[1]:"image/png",m=atob(e[1]),g=m.length,p=new Uint8Array(g);for(let i=0;i<g;i++)p[i]=m.charCodeAt(i);return new Blob([p],{type:l})}function z(){console.log("[CONTENT] Restoring original images...");let t=0;k.forEach((e,o)=>{o&&o.parentElement&&(o.src=e,delete o.dataset.processed,t++)}),k.clear(),console.log(`[CONTENT] Restored ${t} images`),h(`Restored ${t} image(s)`,"info")}function T(t,e){chrome.runtime.sendMessage({action:"processing-update",progress:t,details:e}).catch(o=>{console.log("[CONTENT] Failed to send progress update:",o.message)})}function B(t){chrome.runtime.sendMessage({action:"processing-complete",analytics:t}).catch(e=>{console.log("[CONTENT] Failed to send completion message:",e.message)})}function h(t,e="info",o,l=!1,m=!1){console.log(`[CONTENT] Notification: ${t}`);const g={info:"",success:"✓",error:"✕",warning:"!"},p=e==="info"&&l,i=document.createElement("div");i.setAttribute("role","status"),i.setAttribute("aria-live","polite"),i.style.cssText=`
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
  `;const d=document.createElement("div");d.style.cssText="display: flex; align-items: flex-start; gap: 10px;";const c=document.createElement("span");p?c.style.cssText=`
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 5px;
      animation: mangaPulse 1.5s ease-in-out infinite;
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
    `:(c.textContent=g[e],c.style.cssText=`
      font-size: 14px;
      font-weight: 600;
      opacity: 0.8;
      flex-shrink: 0;
      margin-top: 1px;
      color: ${e==="success"?"#10b981":e==="error"?"#ef4444":e==="warning"?"#f59e0b":"rgba(255, 255, 255, 0.8)"};
    `);const y=document.createElement("div");y.style.cssText="flex: 1; min-width: 0;";const n=document.createElement("div");if(n.textContent=t,n.style.cssText=`
    font-weight: 500;
    line-height: 1.4;
    color: rgba(255, 255, 255, 0.95);
  `,y.appendChild(n),o){const s=document.createElement("div");s.innerText=o,s.style.cssText=`
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
    `,y.appendChild(s),y.appendChild(u);let r=m;r&&(s.style.maxHeight="200px",s.style.marginTop="8px",u.style.opacity="0"),i.addEventListener("click",()=>{r=!r,r?(s.style.maxHeight="200px",s.style.marginTop="8px",u.style.opacity="0"):(s.style.maxHeight="0",s.style.marginTop="0",u.style.opacity="1")})}d.appendChild(c),d.appendChild(y);const a=document.createElement("button");if(a.innerHTML="×",a.style.cssText=`
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
  `,a.onmouseenter=()=>{a.style.color="rgba(255, 255, 255, 0.8)"},a.onmouseleave=()=>{a.style.color="rgba(255, 255, 255, 0.4)"},d.appendChild(a),i.appendChild(d),!document.getElementById("manga-processor-styles")){const s=document.createElement("style");s.id="manga-processor-styles",s.textContent=`
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
    `,document.head.appendChild(s)}document.body.appendChild(i);const x=()=>{i.style.animation="mangaNotifSlideOut 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",setTimeout(()=>i.remove(),300)};if(a.onclick=s=>{s.stopPropagation(),x()},!l){const s=o?6e3:4e3;let u=null,r=s,f=Date.now();const b=()=>{f=Date.now(),u=setTimeout(x,r)},w=()=>{u&&(clearTimeout(u),u=null,r-=Date.now()-f)};i.addEventListener("mouseenter",w),i.addEventListener("mouseleave",b),b()}return x}function j(t){if(N){console.log("[CONTENT] Already in selection mode");return}if(C){h("Task in progress","warning","Please wait for the current operation to complete.");return}console.log("[CONTENT] Entering selection mode..."),N=!0;const e=document.createElement("div");e.id="manga-selection-overlay",e.style.cssText=`
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
  `,e.appendChild(o),!document.getElementById("manga-selection-styles")){const n=document.createElement("style");n.id="manga-selection-styles",n.textContent=`
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
    `,document.head.appendChild(n)}document.body.appendChild(e);const m=Array.from(document.querySelectorAll("img")).filter(n=>{const a=n.getBoundingClientRect();return a.width>200&&a.height>200&&n.offsetParent!==null&&n.naturalWidth>200&&n.naturalHeight>200});console.log(`[CONTENT] Found ${m.length} selectable images`);const g=n=>{const a=n.target;m.includes(a)&&a.classList.add("manga-image-highlight")},p=n=>{const a=n.target;m.includes(a)&&a.classList.remove("manga-image-highlight")},i=async n=>{const a=n.target;if(m.includes(a)){n.preventDefault(),n.stopPropagation();const x=a;console.log("[CONTENT] Image selected:",x.src),y(),await K(x,t)}},d=n=>{n.key==="Escape"&&(n.preventDefault(),console.log("[CONTENT] Selection mode cancelled"),y())},c=n=>{n.target===e&&y()};function y(){N&&(N=!1,document.removeEventListener("mouseover",g,!0),document.removeEventListener("mouseout",p,!0),document.removeEventListener("click",i,!0),document.removeEventListener("keydown",d,!0),e.removeEventListener("click",c),m.forEach(n=>n.classList.remove("manga-image-highlight")),e.style.animation="mangaFadeOut 0.2s ease-out",setTimeout(()=>e.remove(),200))}document.addEventListener("mouseover",g,!0),document.addEventListener("mouseout",p,!0),document.addEventListener("click",i,!0),document.addEventListener("keydown",d,!0),e.addEventListener("click",c)}async function K(t,e){if(C){h("Task in progress","warning","Please wait for the current operation to complete.");return}if(console.log("[CONTENT] Processing single image..."),!e.apiKeys||e.apiKeys.length===0){h("API keys required","error","Open extension settings and add your Gemini API keys to enable translation.");return}try{const o=new AbortController,l=setTimeout(()=>o.abort(),3e3),m=await fetch(`${e.serverUrl}/health`,{method:"GET",signal:o.signal});if(clearTimeout(l),!m.ok){h("Server unavailable","error","The server returned an error. Verify the server is running correctly.");return}}catch(o){o.name==="AbortError"?h("Connection timeout","error","Could not reach the server within 3 seconds. Check if the server is running."):h("Connection failed","error",`Unable to connect to ${e.serverUrl}. Verify the URL and server status.`);return}C=!0;try{const o=h("Processing image...","info",void 0,!0);T(0,"Converting image...");const l=await U(t),m=t.src;T(30,"Converted image..."),console.log("[CONTENT] Converted single image to blob"),T(40,"Sending to server...");const g=new FormData;g.append("images",l,"image_0.png");const p={apiKeys:e.apiKeys,ocr_translation_model:e.translateModel,includeFreeText:e.includeFreeText,bananaMode:e.bananaMode,textStroke:e.textStroke,blurFreeTextBg:e.blurFreeTextBg,cache:e.cache,metricsDetail:e.metricsDetail,useMask:e.useMask,mergeImg:e.mergeImg,sessionLimit:e.sessionLimit};g.append("config",JSON.stringify(p));const i=await fetch(`${e.serverUrl}/process`,{method:"POST",body:g});if(!i.ok)throw new Error(`Server error: ${i.status} ${i.statusText}`);T(70,"Processing on server...");const d=await i.json();console.log("[CONTENT] Server response:",d),T(90,"Applying result..."),d.results&&d.results[0]?.success&&d.results[0].data_url&&(k.set(t,m),t.src=d.results[0].data_url,t.dataset.processed="true",console.log("[CONTENT] Applied processed image")),T(100,"Complete!"),o();const c=d.analytics;let y;if(e.metricsDetail&&c){const n=[],a=c.total_time_ms?(c.total_time_ms/1e3).toFixed(1):"0",x=c.phase1_time_ms?(c.phase1_time_ms/1e3).toFixed(1):null,s=c.phase2_time_ms?(c.phase2_time_ms/1e3).toFixed(1):null;let u=`${a}s total`;x&&s&&(u+=` (detect: ${x}s, translate: ${s}s)`),n.push(u);const r=c.total_regions||0;r>0&&n.push(`${r} region${r!==1?"s":""} translated`),y=n.join(`
`)}else if(c){const n=c.total_time_ms?(c.total_time_ms/1e3).toFixed(1):null;y=n?`Completed in ${n}s`:void 0}h("Image processed successfully","success",y,!1,e.metricsDetail),B(d.analytics),d.analytics&&await A(d.analytics),console.log("[CONTENT] Single image processing complete")}catch(o){console.error("[CONTENT] Single image processing error:",o),h("Processing failed","error",o.message)}finally{C=!1}}console.log("[CONTENT] Content script ready");
