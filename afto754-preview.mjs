function __afto754Url(name) {const u=new URL(name,import.meta.url);u.search=new URL(import.meta.url).search;return u.href;}
async function __afto754Json(name) {const r=await fetch(__afto754Url(name),{cache:'no-store'});if(!r.ok)throw new Error('AFTO754 JSON unavailable');return r.json();}
/* Actual PDF-byte preview only; no review acknowledgement or output saving. */
export function createPreview({container,bytes,expectedSha256,pdfjs,sha256,stylesheetUrl}){
 if(!(bytes instanceof Uint8Array)||!bytes.length||!/^[a-f0-9]{64}$/.test(expectedSha256)||!container||container.shadowRoot||typeof sha256!=='function')throw new Error('A new preview container and verified draft bytes are required.');
 const saved=new Uint8Array(bytes),url=new URL(stylesheetUrl,window.location.href);
 if(url.origin!==window.location.origin||url.pathname!=='/afto754-xfa-layer.css')throw new Error('Preview stylesheet must use the fixed same-host asset.');
 const shadow=container.attachShadow({mode:'open'}),style=document.createElement('link'),surface=document.createElement('div');style.rel='stylesheet';style.href=url.href;shadow.append(style,surface);
 let closed=false,sequence=0,task=null,doc=null,styleCancel=null;
 const styles=new Promise((resolve,reject)=>{styleCancel=()=>reject(new Error('Preview closed.'));style.onload=resolve;style.onerror=()=>reject(new Error('Preview stylesheet could not load.'));});
 async function cleanup(){if(task){const owned=task;task=null;await owned.destroy();}doc=null;}
 const ready=(async()=>{
  try{if(await sha256(new Uint8Array(saved))!==expectedSha256)throw new Error('Preview PDF hash mismatch.');if(closed)throw new Error('Preview closed.');
   task=pdfjs.getDocument({data:new Uint8Array(saved),enableXfa:true,isEvalSupported:false,verbosity:0});doc=await task.promise;
   if(closed)throw new Error('Preview closed.');if(!doc.isPureXfa||doc.numPages!==4)throw new Error('Unexpected AFTO754 preview structure.');await styles;if(closed)throw new Error('Preview closed.');return {pages:4,sha256:expectedSha256,visualReviewRequired:true};
  }catch(error){await cleanup();throw error;}
 })();
 // Observe cancellation of either concurrent dependency without hiding ready failure.
 styles.catch(()=>{});ready.catch(()=>{});
 async function show({page=1,scale=1}={}){
  if(!Number.isInteger(page)||page<1||page>4||![1,1.5].includes(scale))throw new Error('Choose page1–4 and100% or150% scale.');const own=++sequence;
  await ready;if(closed||own!==sequence)return {rendered:false};const p=await doc.getPage(page);if(closed||own!==sequence)return {rendered:false};const tree=await p.getXfa();if(closed||own!==sequence)return {rendered:false};
  const viewport=p.getViewport({scale}),holder=document.createElement('div'),layer=document.createElement('div');holder.style.position='relative';holder.style.backgroundColor='#fff';layer.style.position='absolute';holder.style.width=viewport.width+'px';holder.style.height=viewport.height+'px';holder.setAttribute('aria-label','AFTO754 draft page '+page);holder.append(layer);
  pdfjs.XfaLayer.render({viewport:viewport.clone({dontFlip:true}),div:layer,xfaHtml:tree,annotationStorage:doc.annotationStorage,intent:'display',linkService:{addLinkAttributes(link){link.removeAttribute('href');}}});holder.inert=true;
  if(closed||own!==sequence)return {rendered:false};surface.replaceChildren(holder);return {rendered:true,page,scale,sha256:expectedSha256,visualReviewRequired:true};
 }
 function close(){if(closed)return Promise.resolve();closed=true;++sequence;styleCancel?.();shadow.replaceChildren();return cleanup();}
 return Object.freeze({ready,show,close});
}
