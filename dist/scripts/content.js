console.log("[CONTENT] Manga Text Processor: Content script loaded");let _=!1;const $=new Map;chrome.runtime.onMessage.addListener((e,r,o)=>(console.log("[CONTENT] Message received:",e),e.action==="process-images"&&e.config?(A(e.config).then(n=>{o({success:!0,result:n})}).catch(n=>{console.error("[CONTENT] Processing error:",n),o({success:!1,error:n.message})}),!0):(e.action==="restore-images"&&(L(),o({success:!0})),!1)));async function A(e){if(_)throw u("Task in progress","warning","Please wait for the current operation to complete before starting a new one."),new Error("Processing already in progress");if(console.log("[CONTENT] Starting page image processing..."),console.log("[CONTENT] Config:",e),!e.apiKeys||e.apiKeys.length===0)throw u("API keys required","error","Open extension settings and add your Gemini API keys to enable translation."),new Error("No API keys configured");try{const r=new AbortController,o=setTimeout(()=>r.abort(),3e3),n=await fetch(`${e.serverUrl}/health`,{method:"GET",signal:r.signal});if(clearTimeout(o),!n.ok)throw u("Server unavailable","error","The server returned an error. Verify the server is running correctly."),new Error("Server health check failed")}catch(r){throw r.name==="AbortError"?u("Connection timeout","error","Could not reach the server within 3 seconds. Check if the server is running."):r.message!=="Server health check failed"&&u("Connection failed","error",`Unable to connect to ${e.serverUrl}. Verify the URL and server status.`),r}_=!0;try{const r=Array.from(document.querySelectorAll("img"));console.log(`[CONTENT] Found ${r.length} total images`);const o=r.filter(s=>{const i=s.getBoundingClientRect();return i.width>200&&i.height>200&&s.offsetParent!==null&&s.naturalWidth>200&&s.naturalHeight>200});if(console.log(`[CONTENT] Filtered to ${o.length} large images`),o.length===0)return u("No images detected","info","No images larger than 200×200px found. Try scrolling to load more content."),{processed:0};const n=u(`Processing ${o.length} image${o.length>1?"s":""}...`,"info",void 0,!0);C(0,`Converting ${o.length} images...`);const g=[],p=[],m=o.map((s,i)=>B(s).then(d=>(console.log(`[CONTENT] Converted image ${i+1}/${o.length}`),{blob:d,img:s,index:i})).catch(d=>(console.error(`[CONTENT] Failed to convert image ${i+1}:`,d),null))),a=await Promise.all(m);a.forEach(s=>{s&&(g.push(s.blob),p.push({img:s.img,originalSrc:s.img.src}))});const T=Math.round(a.length/o.length*30);if(C(T,`Converted ${g.length}/${o.length} images...`),console.log(`[CONTENT] Converted ${g.length} images to blobs`),g.length===0)throw new Error("Failed to convert any images");C(40,"Sending to server...");const f=new FormData;g.forEach((s,i)=>{f.append("images",s,`image_${i}.png`)});const b={api_keys:e.apiKeys,translate_model:e.translateModel,include_free_text:e.includeFreeText,banana_mode:e.bananaMode,text_stroke:e.textStroke,blur_free_text_bg:e.blurFreeTextBg,cache:e.cache,metrics_detail:e.metricsDetail};f.append("config",JSON.stringify(b));const x=await fetch(`${e.serverUrl}/process`,{method:"POST",body:f});if(!x.ok)throw new Error(`Server error: ${x.status} ${x.statusText}`);C(70,"Processing on server...");const l=await x.json();console.log("[CONTENT] Server response:",l),C(90,"Applying results...");let h=0;l.results&&l.results.length>0&&l.results.forEach((s,i)=>{if(s.success&&s.data_url&&p[i]){const{img:d,originalSrc:w}=p[i];$.set(d,w),d.src=s.data_url,d.dataset.processed="true",h++,console.log(`[CONTENT] Applied processed image ${i+1}`)}}),C(100,"Complete!"),n();const t=l.analytics;let c;if(e.metricsDetail&&t){const s=[],i=t.total_time_ms?(t.total_time_ms/1e3).toFixed(1):"0",d=t.phase1_time_ms?(t.phase1_time_ms/1e3).toFixed(1):null,w=t.phase2_time_ms?(t.phase2_time_ms/1e3).toFixed(1):null;let k=`${i}s total`;d&&w&&(k+=` (detect: ${d}s, translate: ${w}s)`),s.push(k);const N=t.total_regions||0,O=t.simple_bg_count||0,S=t.complex_bg_count||0;if(N>0){let y=`${N} region${N!==1?"s":""}`;(O||S)&&(y+=` · ${O} simple, ${S} complex bg`),s.push(y)}const E=(t.api_calls_simple||0)+(t.api_calls_complex||0),P=t.cache_hits||0,M=t.cache_misses||0,v=P+M;if(E>0||v>0){let y="";if(E>0&&(y+=`${E} API call${E!==1?"s":""}`),v>0){const F=(P/v*100).toFixed(0);y+=y?` · ${F}% cache hit`:`${F}% cache hit`}y&&s.push(y)}const I=(t.input_tokens||0)+(t.output_tokens||0);I>0&&s.push(`${I.toLocaleString()} tokens used`),c=s.join(`
`)}else if(t){const s=t.total_time_ms?(t.total_time_ms/1e3).toFixed(1):null;c=s?`Completed in ${s}s`:void 0}return u(`${h} image${h!==1?"s":""} processed`,"success",c,!1,e.metricsDetail),z(l.analytics),console.log(`[CONTENT] Processing complete: ${h}/${g.length} images applied`),{processed:h,analytics:l.analytics}}finally{_=!1}}async function B(e){return new Promise((r,o)=>{try{const n=document.createElement("canvas"),g=n.getContext("2d");if(!g){o(new Error("Failed to get canvas context"));return}n.width=e.naturalWidth||e.width,n.height=e.naturalHeight||e.height;const p=new Image;p.crossOrigin="anonymous",p.onload=()=>{try{g.drawImage(p,0,0),n.toBlob(m=>{m?r(m):o(new Error("Failed to create blob"))},"image/png")}catch{console.warn("[CONTENT] CORS failed, trying original image...");try{g.drawImage(e,0,0),n.toBlob(a=>{a?r(a):o(new Error("Failed to create blob"))},"image/png")}catch(a){o(new Error(`Canvas error: ${a.message}`))}}},p.onerror=()=>{console.warn("[CONTENT] Image load failed, using original...");try{g.drawImage(e,0,0),n.toBlob(m=>{m?r(m):o(new Error("Failed to create blob"))},"image/png")}catch(m){o(new Error(`Canvas error: ${m.message}`))}},p.src=e.src}catch(n){o(n)}})}function L(){console.log("[CONTENT] Restoring original images...");let e=0;$.forEach((r,o)=>{o&&o.parentElement&&(o.src=r,delete o.dataset.processed,e++)}),$.clear(),console.log(`[CONTENT] Restored ${e} images`),u(`Restored ${e} image(s)`,"info")}function C(e,r){chrome.runtime.sendMessage({action:"processing-update",progress:e,details:r}).catch(o=>{console.log("[CONTENT] Failed to send progress update:",o.message)})}function z(e){chrome.runtime.sendMessage({action:"processing-complete",analytics:e}).catch(r=>{console.log("[CONTENT] Failed to send completion message:",r.message)})}function u(e,r="info",o,n=!1,g=!1){console.log(`[CONTENT] Notification: ${e}`);const p={info:"",success:"✓",error:"✕",warning:"!"},m=r==="info"&&n,a=document.createElement("div");a.setAttribute("role","status"),a.setAttribute("aria-live","polite"),a.style.cssText=`
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
  `;const T=document.createElement("div");T.style.cssText="display: flex; align-items: flex-start; gap: 10px;";const f=document.createElement("span");m?f.style.cssText=`
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 5px;
      animation: mangaPulse 1.5s ease-in-out infinite;
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
    `:(f.textContent=p[r],f.style.cssText=`
      font-size: 14px;
      font-weight: 600;
      opacity: 0.8;
      flex-shrink: 0;
      margin-top: 1px;
      color: ${r==="success"?"#10b981":r==="error"?"#ef4444":r==="warning"?"#f59e0b":"rgba(255, 255, 255, 0.8)"};
    `);const b=document.createElement("div");b.style.cssText="flex: 1; min-width: 0;";const x=document.createElement("div");if(x.textContent=e,x.style.cssText=`
    font-weight: 500;
    line-height: 1.4;
    color: rgba(255, 255, 255, 0.95);
  `,b.appendChild(x),o){const t=document.createElement("div");t.innerText=o,t.style.cssText=`
      font-size: 11px;
      color: rgba(255, 255, 255, 0.6);
      margin-top: 6px;
      line-height: 1.5;
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease, margin-top 0.2s ease;
      white-space: pre-wrap;
    `;const c=document.createElement("div");c.textContent="Click for details",c.style.cssText=`
      font-size: 10px;
      color: rgba(255, 255, 255, 0.4);
      margin-top: 4px;
      transition: opacity 0.2s ease;
    `,b.appendChild(t),b.appendChild(c);let s=g;s&&(t.style.maxHeight="200px",t.style.marginTop="8px",c.style.opacity="0"),a.addEventListener("click",()=>{s=!s,s?(t.style.maxHeight="200px",t.style.marginTop="8px",c.style.opacity="0"):(t.style.maxHeight="0",t.style.marginTop="0",c.style.opacity="1")})}T.appendChild(f),T.appendChild(b);const l=document.createElement("button");if(l.innerHTML="×",l.style.cssText=`
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
  `,l.onmouseenter=()=>{l.style.color="rgba(255, 255, 255, 0.8)"},l.onmouseleave=()=>{l.style.color="rgba(255, 255, 255, 0.4)"},T.appendChild(l),a.appendChild(T),!document.getElementById("manga-processor-styles")){const t=document.createElement("style");t.id="manga-processor-styles",t.textContent=`
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
    `,document.head.appendChild(t)}document.body.appendChild(a);const h=()=>{a.style.animation="mangaNotifSlideOut 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",setTimeout(()=>a.remove(),300)};if(l.onclick=t=>{t.stopPropagation(),h()},!n){const t=o?6e3:4e3;let c=null,s=t,i=Date.now();const d=()=>{i=Date.now(),c=setTimeout(h,s)},w=()=>{c&&(clearTimeout(c),c=null,s-=Date.now()-i)};a.addEventListener("mouseenter",w),a.addEventListener("mouseleave",d),d()}return h}console.log("[CONTENT] Content script ready");
