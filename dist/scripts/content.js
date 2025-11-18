console.log("[CONTENT] Manga Text Processor: Content script loaded");let T=!1;const N=new Map;chrome.runtime.onMessage.addListener((e,r,o)=>(console.log("[CONTENT] Message received:",e),e.action==="process-images"&&e.config?(b(e.config).then(t=>{o({success:!0,result:t})}).catch(t=>{console.error("[CONTENT] Processing error:",t),o({success:!1,error:t.message})}),!0):(e.action==="restore-images"&&($(),o({success:!0})),!1)));async function b(e){var r;if(T)throw new Error("Processing already in progress");console.log("[CONTENT] Starting page image processing..."),console.log("[CONTENT] Config:",e),T=!0;try{const o=Array.from(document.querySelectorAll("img"));console.log(`[CONTENT] Found ${o.length} total images`);const t=o.filter(s=>{const a=s.getBoundingClientRect();return a.width>200&&a.height>200&&s.offsetParent!==null&&s.naturalWidth>200&&s.naturalHeight>200});if(console.log(`[CONTENT] Filtered to ${t.length} large images`),t.length===0)return h("No manga images found on page","info"),{processed:0};h(`Processing ${t.length} image(s)...`,"info"),m(0,`Converting ${t.length} images...`);const n=[],l=[],i=t.map((s,a)=>O(s).then(g=>(console.log(`[CONTENT] Converted image ${a+1}/${t.length}`),{blob:g,img:s,index:a})).catch(g=>(console.error(`[CONTENT] Failed to convert image ${a+1}:`,g),null))),d=await Promise.all(i);d.forEach(s=>{s&&(n.push(s.blob),l.push({img:s.img,originalSrc:s.img.src}))});const y=Math.round(d.length/t.length*30);if(m(y,`Converted ${n.length}/${t.length} images...`),console.log(`[CONTENT] Converted ${n.length} images to blobs`),n.length===0)throw new Error("Failed to convert any images");m(40,"Sending to server...");const f=new FormData;n.forEach((s,a)=>{f.append("images",s,`image_${a}.png`)});const C={api_keys:e.apiKeys,translate_model:e.translateModel,include_free_text:e.includeFreeText,banana_mode:e.bananaMode,text_stroke:e.textStroke,blur_free_text_bg:e.blurFreeTextBg,cache:e.cache,metrics_detail:e.metricsDetail};f.append("config",JSON.stringify(C));const p=await fetch(`${e.serverUrl}/process`,{method:"POST",body:f});if(!p.ok)throw new Error(`Server error: ${p.status} ${p.statusText}`);m(70,"Processing on server...");const c=await p.json();console.log("[CONTENT] Server response:",c),m(90,"Applying results...");let u=0;c.results&&c.results.length>0&&c.results.forEach((s,a)=>{if(s.success&&s.data_url&&l[a]){const{img:g,originalSrc:w}=l[a];N.set(g,w),g.src=s.data_url,g.dataset.processed="true",u++,console.log(`[CONTENT] Applied processed image ${a+1}`)}}),m(100,"Complete!");const E=(r=c.analytics)!=null&&r.total_time_ms?`in ${(c.analytics.total_time_ms/1e3).toFixed(1)}s`:"";return h(`✓ Processed ${u} image(s) ${E}`,"success"),x(c.analytics),console.log(`[CONTENT] Processing complete: ${u}/${n.length} images applied`),{processed:u,analytics:c.analytics}}finally{T=!1}}async function O(e){return new Promise((r,o)=>{try{const t=document.createElement("canvas"),n=t.getContext("2d");if(!n){o(new Error("Failed to get canvas context"));return}t.width=e.naturalWidth||e.width,t.height=e.naturalHeight||e.height;const l=new Image;l.crossOrigin="anonymous",l.onload=()=>{try{n.drawImage(l,0,0),t.toBlob(i=>{i?r(i):o(new Error("Failed to create blob"))},"image/png")}catch{console.warn("[CONTENT] CORS failed, trying original image...");try{n.drawImage(e,0,0),t.toBlob(d=>{d?r(d):o(new Error("Failed to create blob"))},"image/png")}catch(d){o(new Error(`Canvas error: ${d.message}`))}}},l.onerror=()=>{console.warn("[CONTENT] Image load failed, using original...");try{n.drawImage(e,0,0),t.toBlob(i=>{i?r(i):o(new Error("Failed to create blob"))},"image/png")}catch(i){o(new Error(`Canvas error: ${i.message}`))}},l.src=e.src}catch(t){o(t)}})}function $(){console.log("[CONTENT] Restoring original images...");let e=0;N.forEach((r,o)=>{o&&o.parentElement&&(o.src=r,delete o.dataset.processed,e++)}),N.clear(),console.log(`[CONTENT] Restored ${e} images`),h(`Restored ${e} image(s)`,"info")}function m(e,r){chrome.runtime.sendMessage({action:"processing-update",progress:e,details:r}).catch(o=>{console.log("[CONTENT] Failed to send progress update:",o.message)})}function x(e){chrome.runtime.sendMessage({action:"processing-complete",analytics:e}).catch(r=>{console.log("[CONTENT] Failed to send completion message:",r.message)})}function h(e,r="info"){console.log(`[CONTENT] Notification: ${e}`);const o=document.createElement("div");o.textContent=e,o.setAttribute("role","status"),o.setAttribute("aria-live","polite");const t={info:"#3b82f6",success:"#10b981",error:"#ef4444",warning:"#f59e0b"};if(o.style.cssText=`
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${t[r]};
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    z-index: 999999;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    animation: slideInFromRight 0.3s ease-out;
    max-width: 400px;
  `,!document.getElementById("manga-processor-styles")){const n=document.createElement("style");n.id="manga-processor-styles",n.textContent=`
      @keyframes slideInFromRight {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        @keyframes slideInFromRight {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      }
    `,document.head.appendChild(n)}document.body.appendChild(o),setTimeout(()=>{o.style.animation="slideInFromRight 0.3s ease-out reverse",setTimeout(()=>o.remove(),300)},4e3)}console.log("[CONTENT] Content script ready");
