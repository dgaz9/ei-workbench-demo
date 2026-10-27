function __afto754Url(name) {const u=new URL(name,import.meta.url);u.search=new URL(import.meta.url).search;return u.href;}
async function __afto754Json(name) {const r=await fetch(__afto754Url(name),{cache:'no-store'});if(!r.ok)throw new Error('AFTO754 JSON unavailable');return r.json();}
/* Fixed same-host trusted loader. Fetched-asset hashes do not attest execution. */
let loaded=null,pending=null,retry=0;
const EXPECTED_ASSETS=["AFTO749-PDFJS-LICENSE.txt", "AFTO754-template-provenance.json", "AFTO754-template.pdf", "afto749-pdf-5.6.205.min.mjs", "afto749-pdf.worker-5.6.205.min.mjs", "afto754-browser-boot.mjs", "afto754-draft-adapter.mjs", "afto754-field-map.json", "afto754-font-metrics.mjs", "afto754-mapping.mjs", "afto754-preflight.mjs", "afto754-preview.mjs", "afto754-reference-fit.mjs", "afto754-reference-layout.json", "afto754-value-formatting.mjs", "afto754-xfa-layer.css"];
const fixed={adapter:'afto754-draft-adapter.mjs',reference:'afto754-reference-fit.mjs',preview:'afto754-preview.mjs',engine:'afto749-pdf-5.6.205.min.mjs',worker:'afto749-pdf.worker-5.6.205.min.mjs',template:'AFTO754-template.pdf',css:'afto754-xfa-layer.css'};
function asset(name,attempt){const u=new URL(name,window.location.href);u.searchParams.set('key',new URLSearchParams(window.location.search).get('key')||'');u.searchParams.set('eiRetry',String(attempt));return u.href;}
const hash=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('');
async function load(){
 if(loaded)return loaded;if(pending)return pending;
 const attempt=retry,config=window.EI_AFTO754_DRAFT||{};
 pending=(async()=>{
  if(config.available!==true||!config.asset_hashes)throw new Error(config.reason||'AFTO754 draft assets unavailable.');
  const names=Object.keys(config.asset_hashes),bytes=new Map();
  if(JSON.stringify(names.slice().sort())!==JSON.stringify(EXPECTED_ASSETS))throw new Error('AFTO754 asset graph differs from the fixed release.');
  for(const n of Object.values(fixed))if(!names.includes(n))throw new Error('AFTO754 asset graph is incomplete.');
  // Names come from fixed build output but still reject paths/origins explicitly.
  await Promise.all(names.map(async name=>{if(!/^[A-Za-z0-9.-]+$/.test(name)||name.includes('..')||!/^[a-f0-9]{64}$/.test(config.asset_hashes[name]))throw new Error('Invalid draft asset configuration.');const response=await fetch(asset(name,attempt),{cache:'no-store'});if(!response.ok)throw new Error('Draft asset unavailable: '+name);const value=new Uint8Array(await response.arrayBuffer());if(await hash(value)!==config.asset_hashes[name])throw new Error('Draft asset hash mismatch: '+name);bytes.set(name,value);}));
  const [adapter,reference,preview,pdfjs]=await Promise.all([import(asset(fixed.adapter,attempt)),import(asset(fixed.reference,attempt)),import(asset(fixed.preview,attempt)),import(asset(fixed.engine,attempt))]);
  pdfjs.GlobalWorkerOptions.workerSrc=asset(fixed.worker,attempt);
  const result={
   reference:(record,options,model)=>reference.referenceCapacity(record,options,model),
   generate:options=>adapter.generateDraft({...options,pdfjs,sha256:hash,sourceBytes:new Uint8Array(bytes.get(fixed.template)),engineBytes:new Uint8Array(bytes.get(fixed.engine)),workerBytes:new Uint8Array(bytes.get(fixed.worker)),workerSrc:asset(fixed.worker,attempt)}),
   preview:options=>preview.createPreview({...options,pdfjs,sha256:hash,stylesheetUrl:asset(fixed.css,attempt)})
  };
  loaded=Object.freeze(result);return loaded;
 })();
 try{return await pending;}catch(error){retry++;throw error;}finally{pending=null;}
}
window.__afto754DraftAssets=Object.freeze({load});
