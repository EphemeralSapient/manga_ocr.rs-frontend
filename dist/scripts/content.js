const F="imageCache_",O="imageCacheIndex";async function J(e){const t=await e.arrayBuffer(),s=await crypto.subtle.digest("SHA-256",t);return Array.from(new Uint8Array(s)).map(_=>_.toString(16).padStart(2,"0")).join("")}function Q(e){const t={translateModel:e.translateModel,targetLanguage:e.targetLanguage,fontSource:e.fontSource,fontFamily:e.fontFamily,googleFontFamily:e.googleFontFamily,includeFreeText:e.includeFreeText,bananaMode:e.bananaMode,textStroke:e.textStroke,backgroundType:e.backgroundType,tighterBounds:e.tighterBounds,filterOrphanRegions:e.filterOrphanRegions,maskMode:e.maskMode,mergeImg:e.mergeImg};return JSON.stringify(t)}async function ee(e,t){try{const s=`${F}${e}`,i=(await chrome.storage.local.get(s))[s];if(!i)return null;if(i.config!==t)return console.log(`[CACHE] Config mismatch for ${e.substring(0,8)}..., invalidating`),await chrome.storage.local.remove(s),await j(e),null;const _=Date.now()-i.timestamp,T=7*24*60*60*1e3;return _>T?(console.log(`[CACHE] Expired entry for ${e.substring(0,8)}..., invalidating`),await chrome.storage.local.remove(s),await j(e),null):(console.log(`[CACHE] Hit for ${e.substring(0,8)}...`),i.dataUrl)}catch(s){return console.error("[CACHE] Error getting cached image:",s),null}}async function te(e,t,s){try{const a=`${F}${e}`,i={hash:e,dataUrl:t,timestamp:Date.now(),config:s};await chrome.storage.local.set({[a]:i}),await se(e),await oe(),console.log(`[CACHE] Stored ${e.substring(0,8)}...`)}catch(a){console.error("[CACHE] Error setting cached image:",a),a.message?.includes("QUOTA")&&(console.warn("[CACHE] Quota exceeded, clearing old cache entries"),await Y(50))}}async function H(){return(await chrome.storage.local.get(O))[O]||[]}async function se(e){const t=await H();t.includes(e)||(t.push(e),await chrome.storage.local.set({[O]:t}))}async function j(e){const s=(await H()).filter(a=>a!==e);await chrome.storage.local.set({[O]:s})}async function oe(){const e=await H();if(e.length>500){const t=e.length-500;await Y(t)}}async function Y(e){const t=await H(),s=t.map(p=>`${F}${p}`),a=await chrome.storage.local.get(s),i=[];Object.entries(a).forEach(([,p])=>{const u=p;i.push({hash:u.hash,timestamp:u.timestamp})}),i.sort((p,u)=>p.timestamp-u.timestamp);const _=i.slice(0,e),T=_.map(p=>`${F}${p.hash}`);await chrome.storage.local.remove(T);const m=_.map(p=>p.hash),b=t.filter(p=>!m.includes(p));await chrome.storage.local.set({[O]:b}),console.log(`[CACHE] Cleared ${_.length} old entries`)}console.log("[CONTENT] Manga Text Processor: Content script loaded");async function Z(e){try{const t="cumulativeStats",a=(await chrome.storage.local.get(t))[t]||{totalSessions:0,totalImages:0,totalRegions:0,totalSimpleBg:0,totalComplexBg:0,totalApiCalls:0,totalInputTokens:0,totalOutputTokens:0,totalCacheHits:0,totalCacheMisses:0,totalProcessingTimeMs:0},i={totalSessions:a.totalSessions+1,totalImages:a.totalImages+(e.total_images||0),totalRegions:a.totalRegions+(e.total_regions||0),totalSimpleBg:a.totalSimpleBg+(e.simple_bg_count||0),totalComplexBg:a.totalComplexBg+(e.complex_bg_count||0),totalApiCalls:a.totalApiCalls+(e.api_calls_simple||0)+(e.api_calls_complex||0)+(e.api_calls_banana||0),totalInputTokens:a.totalInputTokens+(e.input_tokens||0),totalOutputTokens:a.totalOutputTokens+(e.output_tokens||0),totalCacheHits:a.totalCacheHits+(e.cache_hits||0),totalCacheMisses:a.totalCacheMisses+(e.cache_misses||0),totalProcessingTimeMs:a.totalProcessingTimeMs+(e.total_time_ms||0),lastProcessedAt:Date.now(),firstProcessedAt:a.firstProcessedAt||Date.now()};await chrome.storage.local.set({[t]:i})}catch(t){console.error("[CONTENT] Failed to save cumulative stats:",t)}}let S=!1,P=!1;const A=new Map;chrome.runtime.onMessage.addListener((e,t,s)=>(console.log("[CONTENT] Message received:",e),e.action==="process-images"&&e.config?(ne(e.config).then(a=>{s({success:!0,result:a})}).catch(a=>{console.error("[CONTENT] Processing error:",a),s({success:!1,error:a.message})}),!0):e.action==="enter-selection-mode"&&e.config?(le(e.config),s({success:!0}),!1):(e.action==="restore-images"&&(ie(),s({success:!0})),!1)));async function ae(e,t,s,a){const m=[];for(let n=0;n<e.length;n+=10)m.push({blobs:e.slice(n,n+10),mappings:t.slice(n,n+10),startIndex:n});console.log(`[CONTENT] Split ${e.length} images into ${m.length} chunks`);const b={apiKeys:s.apiKeys,ocr_translation_model:s.translateModel,targetLanguage:s.targetLanguage,font_source:s.fontSource,includeFreeText:s.includeFreeText,bananaMode:s.bananaMode,textStroke:s.textStroke,backgroundType:s.backgroundType,cache:s.cache,metricsDetail:s.metricsDetail,tighterBounds:s.tighterBounds,filterOrphanRegions:s.filterOrphanRegions,useMask:s.maskMode!=="off",maskMode:s.maskMode||"fast",mergeImg:s.mergeImg,sessionLimit:s.sessionLimit,targetSize:s.targetSize};s.fontSource==="google"?b.google_font_family=s.googleFontFamily:b.font_family=s.fontFamily;const p=async(n,o,c=0)=>{const y=new FormData;n.blobs.forEach((w,h)=>{y.append("images",w,`image_${n.startIndex+h}.png`)}),y.append("config",JSON.stringify(b));const d=new AbortController,v=setTimeout(()=>d.abort(),6e4);try{const w=await fetch(`${s.serverUrl}/process`,{method:"POST",body:y,signal:d.signal});if(clearTimeout(v),!w.ok)throw new Error(`Server error: ${w.status} ${w.statusText}`);const h=await w.json();return console.log(`[CONTENT] Chunk ${o+1}/${m.length} completed successfully`),h}catch(w){if(clearTimeout(v),c<2)return console.warn(`[CONTENT] Chunk ${o+1} failed (attempt ${c+1}/3), retrying...`,w),await new Promise(h=>setTimeout(h,1e3*(c+1))),p(n,o,c+1);throw console.error(`[CONTENT] Chunk ${o+1} failed after 3 attempts:`,w),w}},u=[];let r=0,g=0;for(let n=0;n<m.length;n+=3){const c=m.slice(n,n+3).map((d,v)=>{const w=n+v;return p(d,w).then(h=>{r++;const I=40+Math.round(r/m.length*50);return a(I,`Processing chunk ${r}/${m.length} (${d.blobs.length} images)...`),{success:!0,result:h}}).catch(h=>(g++,console.error(`[CONTENT] Chunk ${w+1} permanently failed:`,h),{success:!1,error:h,chunkIndex:w}))});(await Promise.all(c)).forEach(d=>{d.success&&"result"in d&&u.push(d.result)})}if(u.length===0)throw new Error(`All ${m.length} chunks failed to process`);g>0&&console.warn(`[CONTENT] ${g} chunk(s) failed, ${u.length} succeeded`);const C={results:[],analytics:{total_images:0,total_regions:0,simple_bg_count:0,complex_bg_count:0,api_calls_simple:0,api_calls_complex:0,api_calls_banana:0,input_tokens:0,output_tokens:0,cache_hits:0,cache_misses:0,total_time_ms:0,phase1_time_ms:0,phase2_time_ms:0}};return u.forEach(n=>{if(n.results&&C.results&&C.results.push(...n.results),n.analytics){const o=C.analytics,c=n.analytics;o.total_images=(o.total_images||0)+(c.total_images||0),o.total_regions=(o.total_regions||0)+(c.total_regions||0),o.simple_bg_count=(o.simple_bg_count||0)+(c.simple_bg_count||0),o.complex_bg_count=(o.complex_bg_count||0)+(c.complex_bg_count||0),o.api_calls_simple=(o.api_calls_simple||0)+(c.api_calls_simple||0),o.api_calls_complex=(o.api_calls_complex||0)+(c.api_calls_complex||0),o.api_calls_banana=(o.api_calls_banana||0)+(c.api_calls_banana||0),o.input_tokens=(o.input_tokens||0)+(c.input_tokens||0),o.output_tokens=(o.output_tokens||0)+(c.output_tokens||0),o.cache_hits=(o.cache_hits||0)+(c.cache_hits||0),o.cache_misses=(o.cache_misses||0)+(c.cache_misses||0),o.total_time_ms=Math.max(o.total_time_ms||0,c.total_time_ms||0),o.phase1_time_ms=Math.max(o.phase1_time_ms||0,c.phase1_time_ms||0),o.phase2_time_ms=Math.max(o.phase2_time_ms||0,c.phase2_time_ms||0)}}),console.log(`[CONTENT] Merged results from ${u.length} chunks, total images: ${C.results?.length||0}`),C}async function ne(e){if(S)throw x("Task in progress","warning","Please wait for the current operation to complete before starting a new one."),new Error("Processing already in progress");if(console.log("[CONTENT] Starting page image processing..."),console.log("[CONTENT] Config:",e),!e.apiKeys||e.apiKeys.length===0)throw x("API keys required","error","Open extension settings and add your Gemini API keys to enable translation."),new Error("No API keys configured");try{const t=new AbortController,s=setTimeout(()=>t.abort(),5e3),a=await fetch(`${e.serverUrl}/health`,{method:"GET",signal:t.signal});if(clearTimeout(s),!a.ok)throw x("Server unavailable","error","The server returned an error. Verify the server is running correctly."),new Error("Server health check failed")}catch(t){throw t.name==="AbortError"?x("Connection timeout","error","Could not reach the server within 5 seconds. Check if the server is running and Local Network Access permission is granted."):t.message!=="Server health check failed"&&x("Connection failed","error",`Unable to connect to ${e.serverUrl}. Verify the URL, server status, and Chrome Local Network Access permission.`),t}S=!0;try{const t=Array.from(document.querySelectorAll("img"));console.log(`[CONTENT] Found ${t.length} total images`);const s=t.filter(l=>{const f=l.getBoundingClientRect();return f.width>200&&f.height>200&&l.offsetParent!==null&&l.naturalWidth>200&&l.naturalHeight>200});if(console.log(`[CONTENT] Filtered to ${s.length} large images`),s.length===0)return x("No images detected","info","No images larger than 200×200px found. Try scrolling to load more content."),{processed:0};const a=x(`Processing ${s.length} image${s.length>1?"s":""}...`,"info",void 0,!0);k(0,`Converting and hashing ${s.length} images...`);const i=[],_=[],T=[],m=s.map((l,f)=>q(l).then(async E=>{const N=await J(E);return console.log(`[CONTENT] Converted and hashed image ${f+1}/${s.length} (${N.substring(0,8)}...)`),{blob:E,img:l,hash:N,index:f}}).catch(E=>(console.error(`[CONTENT] Failed to convert image ${f+1}:`,E),null))),b=await Promise.all(m);b.forEach(l=>{l&&(i.push(l.blob),_.push({img:l.img,originalSrc:l.img.src}),T.push(l.hash))});const p=Math.round(b.length/s.length*20);if(k(p,`Converted ${i.length}/${s.length} images...`),console.log(`[CONTENT] Converted ${i.length} images to blobs`),i.length===0)throw new Error("Failed to convert any images");k(25,"Checking cache...");const u=Q(e),r=T.map(l=>ee(l,u)),g=await Promise.all(r),C=[],n=[],o=[],c=[];let y=0;if(g.forEach((l,f)=>{if(l){const{img:E,originalSrc:N}=_[f];A.set(E,N),E.src=l,E.dataset.processed="true",y++}else C.push(f),n.push(i[f]),o.push(_[f]),c.push(T[f])}),console.log(`[CONTENT] Cache: ${y} hits, ${n.length} misses`),y>0&&x(`Cache hit: ${y} image${y!==1?"s":""} loaded from cache`,"info",void 0,!1),n.length===0)return k(100,"Complete (all from cache)!"),a(),x(`${i.length} image${i.length!==1?"s":""} loaded from cache`,"success","No server processing required",!1),{processed:i.length,analytics:{total_images:i.length}};k(30,`Processing ${n.length} uncached images in chunks...`);const d=await ae(n,o,e,(l,f)=>k(l,f));if(d.results&&d.results.length>0){const l=d.results.map((f,E)=>{if(f.success&&f.data_url){const N=c[E];return te(N,f.data_url,u)}return Promise.resolve()});await Promise.all(l),console.log(`[CONTENT] Cached ${d.results.length} newly processed images`)}console.log("[CONTENT] All chunks processed:",d),k(90,"Applying results...");let v=0;d.results&&d.results.length>0&&d.results.forEach((l,f)=>{if(l.success&&l.data_url&&o[f]){const{img:E,originalSrc:N}=o[f];A.set(E,N),E.src=l.data_url,E.dataset.processed="true",v++,console.log(`[CONTENT] Applied processed image ${f+1}`)}});const w=y+v;k(100,"Complete!"),a();const h=d.analytics;let I;if(e.metricsDetail&&h){const l=[];y>0&&l.push(`${y} from cache, ${v} newly processed`);const f=h.total_time_ms?(h.total_time_ms/1e3).toFixed(1):"0",E=h.phase1_time_ms?(h.phase1_time_ms/1e3).toFixed(1):null,N=h.phase2_time_ms?(h.phase2_time_ms/1e3).toFixed(1):null;let B=`${f}s total`;E&&N&&(B+=` (detect: ${E}s, translate: ${N}s)`),l.push(B);const L=h.total_regions||0,U=h.simple_bg_count||0,D=h.complex_bg_count||0;if(L>0){let $=`${L} region${L!==1?"s":""}`;(U||D)&&($+=` · ${U} simple, ${D} complex bg`),l.push($)}const M=(h.api_calls_simple||0)+(h.api_calls_complex||0),K=h.cache_hits||0,G=h.cache_misses||0,R=K+G;if(M>0||R>0){let $="";if(M>0&&($+=`${M} API call${M!==1?"s":""}`),R>0){const z=(K/R*100).toFixed(0);$+=$?` · ${z}% cache hit`:`${z}% cache hit`}$&&l.push($)}const X=(h.input_tokens||0)+(h.output_tokens||0);X>0&&l.push(`${X.toLocaleString()} tokens used`),I=l.join(`
`)}else if(h){const l=h.total_time_ms?(h.total_time_ms/1e3).toFixed(1):null;let f=l?`Completed in ${l}s`:void 0;y>0&&(f=f?`${f} (${y} from cache)`:`${y} from cache`),I=f}return x(`${w} image${w!==1?"s":""} processed`,"success",I,!1,e.metricsDetail),V(d.analytics),d.analytics&&await Z(d.analytics),console.log(`[CONTENT] Processing complete: ${w} total (${y} cached, ${v} newly processed)`),{processed:w,analytics:d.analytics}}finally{S=!1}}async function q(e){const t=e.src;if(t.startsWith("data:"))return W(t);if(t.startsWith("blob:"))return(await fetch(t)).blob();try{const a=await re(e);if(a)return a}catch{}const s=await chrome.runtime.sendMessage({action:"fetch-image",url:t});if(!s.success)throw new Error(`Background fetch failed: ${s.error}`);return W(s.base64)}async function re(e){return new Promise(t=>{try{if(typeof OffscreenCanvas<"u"){const i=new OffscreenCanvas(e.naturalWidth||e.width,e.naturalHeight||e.height),_=i.getContext("2d");if(_){_.drawImage(e,0,0),i.convertToBlob({type:"image/webp",quality:.95}).then(t).catch(()=>t(null));return}}const s=document.createElement("canvas"),a=s.getContext("2d");if(!a){t(null);return}s.width=e.naturalWidth||e.width,s.height=e.naturalHeight||e.height,a.drawImage(e,0,0),s.toBlob(i=>{t(i)},"image/webp",.95)}catch{t(null)}})}function W(e){const t=e.split(","),s=t[0].match(/:(.*?);/),a=s?s[1]:"image/png",i=atob(t[1]),_=i.length,T=new Uint8Array(_);for(let m=0;m<_;m++)T[m]=i.charCodeAt(m);return new Blob([T],{type:a})}function ie(){console.log("[CONTENT] Restoring original images...");let e=0;A.forEach((t,s)=>{s&&s.parentElement&&(s.src=t,delete s.dataset.processed,e++)}),A.clear(),console.log(`[CONTENT] Restored ${e} images`),x(`Restored ${e} image(s)`,"info")}function k(e,t){chrome.runtime.sendMessage({action:"processing-update",progress:e,details:t}).catch(s=>{console.log("[CONTENT] Failed to send progress update:",s.message)})}function V(e){chrome.runtime.sendMessage({action:"processing-complete",analytics:e}).catch(t=>{console.log("[CONTENT] Failed to send completion message:",t.message)})}function x(e,t="info",s,a=!1,i=!1){console.log(`[CONTENT] Notification: ${e}`);const _={info:"",success:"✓",error:"✕",warning:"!"},T=t==="info"&&a,m=document.createElement("div");m.setAttribute("role","status"),m.setAttribute("aria-live","polite"),m.style.cssText=`
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
    cursor: ${s?"pointer":"default"};
    user-select: none;
  `;const b=document.createElement("div");b.style.cssText="display: flex; align-items: flex-start; gap: 10px;";const p=document.createElement("span");T?p.style.cssText=`
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 5px;
      animation: mangaPulse 1.5s ease-in-out infinite;
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
    `:(p.textContent=_[t],p.style.cssText=`
      font-size: 14px;
      font-weight: 600;
      opacity: 0.8;
      flex-shrink: 0;
      margin-top: 1px;
      color: ${t==="success"?"#10b981":t==="error"?"#ef4444":t==="warning"?"#f59e0b":"rgba(255, 255, 255, 0.8)"};
    `);const u=document.createElement("div");u.style.cssText="flex: 1; min-width: 0;";const r=document.createElement("div");if(r.textContent=e,r.style.cssText=`
    font-weight: 500;
    line-height: 1.4;
    color: rgba(255, 255, 255, 0.95);
  `,u.appendChild(r),s){const n=document.createElement("div");n.innerText=s,n.style.cssText=`
      font-size: 11px;
      color: rgba(255, 255, 255, 0.6);
      margin-top: 6px;
      line-height: 1.5;
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease, margin-top 0.2s ease;
      white-space: pre-wrap;
    `;const o=document.createElement("div");o.textContent="Click for details",o.style.cssText=`
      font-size: 10px;
      color: rgba(255, 255, 255, 0.4);
      margin-top: 4px;
      transition: opacity 0.2s ease;
    `,u.appendChild(n),u.appendChild(o);let c=i;c&&(n.style.maxHeight="200px",n.style.marginTop="8px",o.style.opacity="0"),m.addEventListener("click",()=>{c=!c,c?(n.style.maxHeight="200px",n.style.marginTop="8px",o.style.opacity="0"):(n.style.maxHeight="0",n.style.marginTop="0",o.style.opacity="1")})}b.appendChild(p),b.appendChild(u);const g=document.createElement("button");if(g.innerHTML="×",g.style.cssText=`
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
  `,g.onmouseenter=()=>{g.style.color="rgba(255, 255, 255, 0.8)"},g.onmouseleave=()=>{g.style.color="rgba(255, 255, 255, 0.4)"},b.appendChild(g),m.appendChild(b),!document.getElementById("manga-processor-styles")){const n=document.createElement("style");n.id="manga-processor-styles",n.textContent=`
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
    `,document.head.appendChild(n)}document.body.appendChild(m);const C=()=>{m.style.animation="mangaNotifSlideOut 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",setTimeout(()=>m.remove(),300)};if(g.onclick=n=>{n.stopPropagation(),C()},!a){const n=s?6e3:4e3;let o=null,c=n,y=Date.now();const d=()=>{y=Date.now(),o=setTimeout(C,c)},v=()=>{o&&(clearTimeout(o),o=null,c-=Date.now()-y)};m.addEventListener("mouseenter",v),m.addEventListener("mouseleave",d),d()}return C}function le(e){if(P){console.log("[CONTENT] Already in selection mode");return}if(S){x("Task in progress","warning","Please wait for the current operation to complete.");return}console.log("[CONTENT] Entering selection mode..."),P=!0;const t=document.createElement("div");t.id="manga-selection-overlay",t.style.cssText=`
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
  `;const s=document.createElement("div");if(s.style.cssText=`
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
  `,s.innerHTML=`
    <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">Click on an image to translate</div>
    <div style="font-size: 13px; color: rgba(255, 255, 255, 0.6);">Press ESC to cancel</div>
  `,t.appendChild(s),!document.getElementById("manga-selection-styles")){const r=document.createElement("style");r.id="manga-selection-styles",r.textContent=`
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
    `,document.head.appendChild(r)}document.body.appendChild(t);const i=Array.from(document.querySelectorAll("img")).filter(r=>{const g=r.getBoundingClientRect();return g.width>200&&g.height>200&&r.offsetParent!==null&&r.naturalWidth>200&&r.naturalHeight>200});console.log(`[CONTENT] Found ${i.length} selectable images`);const _=r=>{const g=r.target;i.includes(g)&&g.classList.add("manga-image-highlight")},T=r=>{const g=r.target;i.includes(g)&&g.classList.remove("manga-image-highlight")},m=async r=>{const g=r.target;if(i.includes(g)){r.preventDefault(),r.stopPropagation();const C=g;console.log("[CONTENT] Image selected:",C.src),u(),await ce(C,e)}},b=r=>{r.key==="Escape"&&(r.preventDefault(),console.log("[CONTENT] Selection mode cancelled"),u())},p=r=>{r.target===t&&u()};function u(){P&&(P=!1,document.removeEventListener("mouseover",_,!0),document.removeEventListener("mouseout",T,!0),document.removeEventListener("click",m,!0),document.removeEventListener("keydown",b,!0),t.removeEventListener("click",p),i.forEach(r=>r.classList.remove("manga-image-highlight")),t.style.animation="mangaFadeOut 0.2s ease-out",setTimeout(()=>t.remove(),200))}document.addEventListener("mouseover",_,!0),document.addEventListener("mouseout",T,!0),document.addEventListener("click",m,!0),document.addEventListener("keydown",b,!0),t.addEventListener("click",p)}async function ce(e,t){if(S){x("Task in progress","warning","Please wait for the current operation to complete.");return}if(console.log("[CONTENT] Processing single image..."),!t.apiKeys||t.apiKeys.length===0){x("API keys required","error","Open extension settings and add your Gemini API keys to enable translation.");return}try{const s=new AbortController,a=setTimeout(()=>s.abort(),5e3),i=await fetch(`${t.serverUrl}/health`,{method:"GET",signal:s.signal});if(clearTimeout(a),!i.ok){x("Server unavailable","error","The server returned an error. Verify the server is running correctly.");return}}catch(s){s.name==="AbortError"?x("Connection timeout","error","Could not reach the server within 5 seconds. Check if the server is running and Local Network Access permission is granted."):x("Connection failed","error",`Unable to connect to ${t.serverUrl}. Verify the URL, server status, and Chrome Local Network Access permission.`);return}S=!0;try{const s=x("Processing image...","info",void 0,!0);k(0,"Converting image...");const a=await q(e),i=e.src;k(30,"Converted image..."),console.log("[CONTENT] Converted single image to blob"),k(40,"Sending to server...");const _=new FormData;_.append("images",a,"image_0.png");const T={apiKeys:t.apiKeys,ocr_translation_model:t.translateModel,targetLanguage:t.targetLanguage,font_source:t.fontSource,includeFreeText:t.includeFreeText,bananaMode:t.bananaMode,textStroke:t.textStroke,backgroundType:t.backgroundType,cache:t.cache,metricsDetail:t.metricsDetail,tighterBounds:t.tighterBounds,filterOrphanRegions:t.filterOrphanRegions,useMask:t.maskMode!=="off",maskMode:t.maskMode||"fast",mergeImg:t.mergeImg,sessionLimit:t.sessionLimit};t.fontSource==="google"?T.google_font_family=t.googleFontFamily:T.font_family=t.fontFamily,_.append("config",JSON.stringify(T));const m=new AbortController,b=setTimeout(()=>m.abort(),9e4),p=await fetch(`${t.serverUrl}/process`,{method:"POST",body:_,signal:m.signal});if(clearTimeout(b),!p.ok)throw new Error(`Server error: ${p.status} ${p.statusText}`);k(70,"Processing on server...");const u=await p.json();console.log("[CONTENT] Server response:",u),k(90,"Applying result..."),u.results&&u.results[0]?.success&&u.results[0].data_url&&(A.set(e,i),e.src=u.results[0].data_url,e.dataset.processed="true",console.log("[CONTENT] Applied processed image")),k(100,"Complete!"),s();const r=u.analytics;let g;if(t.metricsDetail&&r){const C=[],n=r.total_time_ms?(r.total_time_ms/1e3).toFixed(1):"0",o=r.phase1_time_ms?(r.phase1_time_ms/1e3).toFixed(1):null,c=r.phase2_time_ms?(r.phase2_time_ms/1e3).toFixed(1):null;let y=`${n}s total`;o&&c&&(y+=` (detect: ${o}s, translate: ${c}s)`),C.push(y);const d=r.total_regions||0;d>0&&C.push(`${d} region${d!==1?"s":""} translated`),g=C.join(`
`)}else if(r){const C=r.total_time_ms?(r.total_time_ms/1e3).toFixed(1):null;g=C?`Completed in ${C}s`:void 0}x("Image processed successfully","success",g,!1,t.metricsDetail),V(u.analytics),u.analytics&&await Z(u.analytics),console.log("[CONTENT] Single image processing complete")}catch(s){console.error("[CONTENT] Single image processing error:",s),x("Processing failed","error",s.message)}finally{S=!1}}console.log("[CONTENT] Content script ready");
