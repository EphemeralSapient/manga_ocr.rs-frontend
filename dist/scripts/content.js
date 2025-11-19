console.log("[CONTENT] Manga Text Processor: Content script loaded");let _=!1;const $=new Map;chrome.runtime.onMessage.addListener((e,n,o)=>(console.log("[CONTENT] Message received:",e),e.action==="process-images"&&e.config?(M(e.config).then(a=>{o({success:!0,result:a})}).catch(a=>{console.error("[CONTENT] Processing error:",a),o({success:!1,error:a.message})}),!0):(e.action==="restore-images"&&(R(),o({success:!0})),!1)));async function M(e){if(_)throw x("Task in progress","warning","Please wait for the current operation to complete before starting a new one."),new Error("Processing already in progress");if(console.log("[CONTENT] Starting page image processing..."),console.log("[CONTENT] Config:",e),!e.apiKeys||e.apiKeys.length===0)throw x("API keys required","error","Open extension settings and add your Gemini API keys to enable translation."),new Error("No API keys configured");try{const n=new AbortController,o=setTimeout(()=>n.abort(),3e3),a=await fetch(`${e.serverUrl}/health`,{method:"GET",signal:n.signal});if(clearTimeout(o),!a.ok)throw x("Server unavailable","error","The server returned an error. Verify the server is running correctly."),new Error("Server health check failed")}catch(n){throw n.name==="AbortError"?x("Connection timeout","error","Could not reach the server within 3 seconds. Check if the server is running."):n.message!=="Server health check failed"&&x("Connection failed","error",`Unable to connect to ${e.serverUrl}. Verify the URL and server status.`),n}_=!0;try{const n=Array.from(document.querySelectorAll("img"));console.log(`[CONTENT] Found ${n.length} total images`);const o=n.filter(s=>{const i=s.getBoundingClientRect();return i.width>200&&i.height>200&&s.offsetParent!==null&&s.naturalWidth>200&&s.naturalHeight>200});if(console.log(`[CONTENT] Filtered to ${o.length} large images`),o.length===0)return x("No images detected","info","No images larger than 200×200px found. Try scrolling to load more content."),{processed:0};const a=x(`Processing ${o.length} image${o.length>1?"s":""}...`,"info",void 0,!0);C(0,`Converting ${o.length} images...`);const m=[],g=[],p=o.map((s,i)=>A(s).then(d=>(console.log(`[CONTENT] Converted image ${i+1}/${o.length}`),{blob:d,img:s,index:i})).catch(d=>(console.error(`[CONTENT] Failed to convert image ${i+1}:`,d),null))),r=await Promise.all(p);r.forEach(s=>{s&&(m.push(s.blob),g.push({img:s.img,originalSrc:s.img.src}))});const u=Math.round(r.length/o.length*30);if(C(u,`Converted ${m.length}/${o.length} images...`),console.log(`[CONTENT] Converted ${m.length} images to blobs`),m.length===0)throw new Error("Failed to convert any images");C(40,"Sending to server...");const h=new FormData;m.forEach((s,i)=>{h.append("images",s,`image_${i}.png`)});const T={api_keys:e.apiKeys,translate_model:e.translateModel,include_free_text:e.includeFreeText,banana_mode:e.bananaMode,text_stroke:e.textStroke,blur_free_text_bg:e.blurFreeTextBg,cache:e.cache,metrics_detail:e.metricsDetail};h.append("config",JSON.stringify(T));const y=await fetch(`${e.serverUrl}/process`,{method:"POST",body:h});if(!y.ok)throw new Error(`Server error: ${y.status} ${y.statusText}`);C(70,"Processing on server...");const l=await y.json();console.log("[CONTENT] Server response:",l),C(90,"Applying results...");let f=0;l.results&&l.results.length>0&&l.results.forEach((s,i)=>{if(s.success&&s.data_url&&g[i]){const{img:d,originalSrc:w}=g[i];$.set(d,w),d.src=s.data_url,d.dataset.processed="true",f++,console.log(`[CONTENT] Applied processed image ${i+1}`)}}),C(100,"Complete!"),a();const t=l.analytics;let c;if(e.metricsDetail&&t){const s=[],i=t.total_time_ms?(t.total_time_ms/1e3).toFixed(1):"0",d=t.phase1_time_ms?(t.phase1_time_ms/1e3).toFixed(1):null,w=t.phase2_time_ms?(t.phase2_time_ms/1e3).toFixed(1):null;let k=`${i}s total`;d&&w&&(k+=` (detect: ${d}s, translate: ${w}s)`),s.push(k);const N=t.total_regions||0,O=t.simple_bg_count||0,P=t.complex_bg_count||0;if(N>0){let b=`${N} region${N!==1?"s":""}`;(O||P)&&(b+=` · ${O} simple, ${P} complex bg`),s.push(b)}const E=(t.api_calls_simple||0)+(t.api_calls_complex||0),S=t.cache_hits||0,L=t.cache_misses||0,v=S+L;if(E>0||v>0){let b="";if(E>0&&(b+=`${E} API call${E!==1?"s":""}`),v>0){const U=(S/v*100).toFixed(0);b+=b?` · ${U}% cache hit`:`${U}% cache hit`}b&&s.push(b)}const I=(t.input_tokens||0)+(t.output_tokens||0);I>0&&s.push(`${I.toLocaleString()} tokens used`),c=s.join(`
`)}else if(t){const s=t.total_time_ms?(t.total_time_ms/1e3).toFixed(1):null;c=s?`Completed in ${s}s`:void 0}return x(`${f} image${f!==1?"s":""} processed`,"success",c,!1,e.metricsDetail),z(l.analytics),console.log(`[CONTENT] Processing complete: ${f}/${m.length} images applied`),{processed:f,analytics:l.analytics}}finally{_=!1}}async function A(e){const n=e.src;if(n.startsWith("data:"))return F(n);if(n.startsWith("blob:"))return(await fetch(n)).blob();const o=await chrome.runtime.sendMessage({action:"fetch-image",url:n});if(!o.success)throw new Error(`Background fetch failed: ${o.error}`);const a=F(o.base64);return a.type==="image/png"?a:await B(a,e.naturalWidth||e.width,e.naturalHeight||e.height)}async function B(e,n,o){return new Promise((a,m)=>{const g=URL.createObjectURL(e),p=new Image;p.onload=()=>{URL.revokeObjectURL(g);const r=document.createElement("canvas"),u=r.getContext("2d");if(!u){m(new Error("Failed to get canvas context"));return}r.width=n||p.naturalWidth,r.height=o||p.naturalHeight,u.drawImage(p,0,0),r.toBlob(h=>{a(h||e)},"image/png")},p.onerror=()=>{URL.revokeObjectURL(g),a(e)},p.src=g})}function F(e){const n=e.split(","),o=n[0].match(/:(.*?);/),a=o?o[1]:"image/png",m=atob(n[1]),g=m.length,p=new Uint8Array(g);for(let r=0;r<g;r++)p[r]=m.charCodeAt(r);return new Blob([p],{type:a})}function R(){console.log("[CONTENT] Restoring original images...");let e=0;$.forEach((n,o)=>{o&&o.parentElement&&(o.src=n,delete o.dataset.processed,e++)}),$.clear(),console.log(`[CONTENT] Restored ${e} images`),x(`Restored ${e} image(s)`,"info")}function C(e,n){chrome.runtime.sendMessage({action:"processing-update",progress:e,details:n}).catch(o=>{console.log("[CONTENT] Failed to send progress update:",o.message)})}function z(e){chrome.runtime.sendMessage({action:"processing-complete",analytics:e}).catch(n=>{console.log("[CONTENT] Failed to send completion message:",n.message)})}function x(e,n="info",o,a=!1,m=!1){console.log(`[CONTENT] Notification: ${e}`);const g={info:"",success:"✓",error:"✕",warning:"!"},p=n==="info"&&a,r=document.createElement("div");r.setAttribute("role","status"),r.setAttribute("aria-live","polite"),r.style.cssText=`
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
  `;const u=document.createElement("div");u.style.cssText="display: flex; align-items: flex-start; gap: 10px;";const h=document.createElement("span");p?h.style.cssText=`
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 5px;
      animation: mangaPulse 1.5s ease-in-out infinite;
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
    `:(h.textContent=g[n],h.style.cssText=`
      font-size: 14px;
      font-weight: 600;
      opacity: 0.8;
      flex-shrink: 0;
      margin-top: 1px;
      color: ${n==="success"?"#10b981":n==="error"?"#ef4444":n==="warning"?"#f59e0b":"rgba(255, 255, 255, 0.8)"};
    `);const T=document.createElement("div");T.style.cssText="flex: 1; min-width: 0;";const y=document.createElement("div");if(y.textContent=e,y.style.cssText=`
    font-weight: 500;
    line-height: 1.4;
    color: rgba(255, 255, 255, 0.95);
  `,T.appendChild(y),o){const t=document.createElement("div");t.innerText=o,t.style.cssText=`
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
    `,T.appendChild(t),T.appendChild(c);let s=m;s&&(t.style.maxHeight="200px",t.style.marginTop="8px",c.style.opacity="0"),r.addEventListener("click",()=>{s=!s,s?(t.style.maxHeight="200px",t.style.marginTop="8px",c.style.opacity="0"):(t.style.maxHeight="0",t.style.marginTop="0",c.style.opacity="1")})}u.appendChild(h),u.appendChild(T);const l=document.createElement("button");if(l.innerHTML="×",l.style.cssText=`
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
  `,l.onmouseenter=()=>{l.style.color="rgba(255, 255, 255, 0.8)"},l.onmouseleave=()=>{l.style.color="rgba(255, 255, 255, 0.4)"},u.appendChild(l),r.appendChild(u),!document.getElementById("manga-processor-styles")){const t=document.createElement("style");t.id="manga-processor-styles",t.textContent=`
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
    `,document.head.appendChild(t)}document.body.appendChild(r);const f=()=>{r.style.animation="mangaNotifSlideOut 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",setTimeout(()=>r.remove(),300)};if(l.onclick=t=>{t.stopPropagation(),f()},!a){const t=o?6e3:4e3;let c=null,s=t,i=Date.now();const d=()=>{i=Date.now(),c=setTimeout(f,s)},w=()=>{c&&(clearTimeout(c),c=null,s-=Date.now()-i)};r.addEventListener("mouseenter",w),r.addEventListener("mouseleave",d),d()}return f}console.log("[CONTENT] Content script ready");
