function __afto754Url(name) {const u=new URL(name,import.meta.url);u.search=new URL(import.meta.url).search;return u.href;}
async function __afto754Json(name) {const r=await fetch(__afto754Url(name),{cache:'no-store'});if(!r.ok)throw new Error('AFTO754 JSON unavailable');return r.json();}
/* In-memory DATA-VERIFIED DRAFT only. No filesystem, UI or signatures. */
const {MAP,TEMPLATE_SHA256,collectRuntime} = await import(__afto754Url("afto754-mapping.mjs"));
const {referenceCapacity,REFERENCE_LAYOUT,verifyReferenceLayout} = await import(__afto754Url("afto754-reference-fit.mjs"));
const POLICY='afto754-data-verified-draft/1';
function fail(message,code){throw Object.assign(new Error(message),{code});}
function freeze(v){if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;}
const key=d=>JSON.stringify([d.ancestry,d.field,d.occurrence]);
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function copy(v){if(!(v instanceof Uint8Array)||!v.length)fail('Required asset bytes are missing.','asset_bytes_required');return new Uint8Array(v);}
function controls(tree){
 const found=new Map(),seen=new Map(),ids=new Set();
 function walk(n,anc=[]){const a=n.attributes||{};if((a.class||[]).includes('xfaField')){const ancestry=anc.map(x=>x.attributes?.xfaName).filter(Boolean),owner=JSON.stringify([...ancestry,a.xfaName]),occurrence=seen.get(owner)||0;seen.set(owner,occurrence+1);const identity={ancestry,field:a.xfaName,occurrence};
 function input(c){if(['input','textarea','select'].includes(c.name)){const x=c.attributes||{};if(identity.field==='SignatureField1'||c.name!=='input'||x.type!=='text'||typeof x.dataId!=='string'||!x.dataId||ids.has(x.dataId)||found.has(key(identity)))fail('Unexpected or duplicate original control.','control_mismatch');ids.add(x.dataId);found.set(key(identity),{id:x.dataId,value:String(x.value??x.textContent??'')});}for(const t of c.children||[])input(t);}input(n);}for(const c of n.children||[])walk(c,[...anc,n]);}walk(tree);
 if(found.size!==225||ids.size!==225)fail('Original control census changed.','control_mismatch');return found;
}
export async function generateDraft({record,projectId,evaluationId,model,pdfjs,sourceBytes,engineBytes,workerBytes,sha256,workerSrc}){
 const plan=referenceCapacity(record,{projectId,evaluationId},model);
 if(plan.referenceStatus!=='assessed'||plan.measurements.length!==225)fail('Source includes content without an original face field.','source_unsupported');
 if(plan.measurements.some(m=>m.status!=='reference-horizontal-fit'))fail('A value requires correction or a supported rendering policy; no draft was produced.','reference_rejected');
 const source=copy(sourceBytes),engine=copy(engineBytes),worker=copy(workerBytes);
 if(typeof sha256!=='function'||typeof pdfjs?.getDocument!=='function'||pdfjs.version!=='5.6.205'||typeof workerSrc!=='string'||!workerSrc)fail('Pinned PDF runtime is required.','engine_required');
 const sourceHash=await sha256(new Uint8Array(source)),engineHash=await sha256(new Uint8Array(engine)),workerHash=await sha256(new Uint8Array(worker));
 if(sourceHash!==TEMPLATE_SHA256)fail('Original AFTO754 bytes changed.','template_sha_mismatch');
 if(engineHash!==REFERENCE_LAYOUT.provenance.engine||workerHash!==REFERENCE_LAYOUT.provenance.worker)fail('Pinned PDF engine bytes changed.','engine_sha_mismatch');
 pdfjs.GlobalWorkerOptions.workerSrc=workerSrc;
 const open=bytes=>pdfjs.getDocument({data:new Uint8Array(bytes),enableXfa:true,isEvalSupported:false,disableFontFace:true,verbosity:0}).promise;
 let doc,again;
 try{
  doc=await open(source);
  const evidence=async d=>({sourceSha256:sourceHash,pages:d.numPages,isPureXfa:d.isPureXfa,fieldObjects:await d.getFieldObjects(),tree:d.allXfaHtml});
  verifyReferenceLayout(await evidence(doc));const before=collectRuntime(doc.allXfaHtml),targets=controls(doc.allXfaHtml),expected=new Map();
  for(let i=0;i<225;i++){const assignment=plan.assignments[i],slot=MAP.slots[i];if(!eq(assignment.path.slice(2),slot.sourcePath))fail('Mapped source identity changed.','assignment_mismatch');const k=key(slot.runtime),target=targets.get(k);if(!target)fail('Mapped control is missing.','control_mismatch');expected.set(k,assignment.value);doc.annotationStorage.setValue(target.id,{value:assignment.value});}
  if(expected.size!==225||doc.annotationStorage.size!==225)fail('Assignment census changed.','assignment_mismatch');
  const saved=copy(await doc.saveDocument());
  if(saved.length<source.length||source.some((byte,i)=>saved[i]!==byte))fail('Original PDF prefix was not preserved.','prefix_mismatch');
  again=await open(saved);verifyReferenceLayout(await evidence(again));if(!eq(collectRuntime(again.allXfaHtml),before))fail('Saved PDF structure changed.','descriptor_mismatch');
  const after=controls(again.allXfaHtml);for(const [k,c]of after)if(!expected.has(k)||c.value!==expected.get(k))fail('Saved PDF values do not match authored values.','saved_value_mismatch');
  const draftHash=await sha256(new Uint8Array(saved));
  const facts=freeze({policy:POLICY,classification:'DATA-VERIFIED DRAFT',dataVerified:true,visualReviewRequired:true,renderingVerified:false,signaturesAssigned:0,signatureValidity:'not-assessed',sourceSha256:sourceHash,engineAssetSha256:engineHash,workerAssetSha256:workerHash,runtimeBinding:'trusted-caller-loader; not independently attested',draftSha256:draftHash,mappedValuesVerified:225,fieldDescriptorsVerified:233,originalPrefixVerified:true,sourceEvidence:plan});
  return Object.freeze({evidence:facts,get draftBytes(){return new Uint8Array(saved);}});
 }finally{if(again)await again.destroy();if(doc)await doc.destroy();}
}
