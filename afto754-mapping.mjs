function __afto754Url(name) {const u=new URL(name,import.meta.url);u.search=new URL(import.meta.url).search;return u.href;}
async function __afto754Json(name) {const r=await fetch(__afto754Url(name),{cache:'no-store'});if(!r.ok)throw new Error('AFTO754 JSON unavailable');return r.json();}
/* Read-only field mapping: no PDF modification, text formatting, or export. */
const mapping = await __afto754Json("afto754-field-map.json");
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
export const MAP=freeze(mapping);
export const TEMPLATE_SHA256=MAP.templateSha256;
const key=d=>JSON.stringify([d.ancestry,d.field,d.occurrence]);
function canonical(v){if(Array.isArray(v))return v.map(canonical);if(v&&typeof v==='object')return Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])]));return v;}
function fail(message,code){throw Object.assign(new Error(message),{code});}
export function collectRuntime(root){
 const result=[],occurrences=new Map();
 function visit(node,ancestors=[]){
  const a=node.attributes||{};
  if((a.class||[]).includes('xfaField')){
   const ancestry=ancestors.map(n=>n.attributes?.xfaName).filter(Boolean),id=JSON.stringify([...ancestry,a.xfaName]);
   const occurrence=occurrences.get(id)||0;occurrences.set(id,occurrence+1);
   const controls=[];
   function inputs(n){if(['input','textarea','select'].includes(n.name))controls.push({tag:n.name,type:n.attributes?.type??null,hasDataId:!!n.attributes?.dataId});for(const c of n.children||[])inputs(c);}
   inputs(node);
   result.push({ancestry,field:a.xfaName,occurrence,geometry:ancestors.at(-1)?.attributes?.style||{},controls});
  }
  if(['input','textarea','select'].includes(node.name)&&!ancestors.some(n=>(n.attributes?.class||[]).includes('xfaField')))fail('Unowned runtime input.','runtime_mismatch');
  for(const c of node.children||[])visit(c,[...ancestors,node]);
 }
 visit(root);return result;
}
/* Caller supplies a SHA from original bytes. This is a census verifier, not
   proof that any saved value will fit or survive an output roundtrip. */
export function verifyRuntime({sourceSha256,pages,isPureXfa,fieldObjects,tree}){
 if(sourceSha256!==TEMPLATE_SHA256)fail('Original AFTO754 bytes do not match the pinned source.','template_sha_mismatch');
 if(pages!==4||isPureXfa!==true||fieldObjects!==null)fail('Original PDF structure changed.','runtime_mismatch');
 const observed=collectRuntime(tree),expected=[...MAP.slots.map(s=>s.runtime),...MAP.runtimeExclusions.map(s=>s.runtime)];
 const sorted=a=>a.slice().sort((x,y)=>key(x).localeCompare(key(y)));
 if(new Set(observed.map(key)).size!==233||JSON.stringify(canonical(sorted(observed)))!==JSON.stringify(canonical(sorted(expected))))fail('Original field census, ancestry, geometry or controls changed.','runtime_mismatch');
 return freeze({mappedInputs:225,signatureWrappers:8,auditOnlyPagination:2,pages:4,outputProduced:false});
}
function leaves(value,path=[],out=[]){
 if(value&&typeof value==='object'){for(const k of Object.keys(value))leaves(value[k],[...path,k],out);}
 else out.push({path,value});
 return out;
}
const get=(r,path)=>path.reduce((value,k)=>value?.[k],r);
/* Raw selected source facts only. Full frozen snapshot and explicit non-face
   inventory prevent this helper being mistaken for a complete PDF plan. */
export function inspectEvaluation(record,projectId,evaluationId,model){
 if(typeof projectId!=='string'||!projectId.trim()||record?.project!==projectId)fail('Exact project identity is required.','project_mismatch');
 model.validate(record,projectId);
 if(typeof evaluationId!=='string'||!Object.hasOwn(record.evaluations,evaluationId)||record.evaluations[evaluationId]===null)fail('Select one existing evaluation explicitly.','evaluation_required');
 const snapshot=JSON.parse(JSON.stringify(record)),evaluation=snapshot.evaluations[evaluationId];
 const paths=new Set(MAP.slots.map(s=>JSON.stringify(s.sourcePath)));
 const values=MAP.slots.map(slot=>{const raw=get(evaluation,slot.sourcePath);if(raw===undefined)fail('Mapped source path is absent.','source_mismatch');return {sourcePath:slot.sourcePath,kind:slot.kind,raw};});
 const unmapped=[];
 function disclose(leaf,prefix=[]){
  if(leaf.value===null||leaf.value==='')return;
  let reason='extension';
  if(!prefix.length&&leaf.path[0]==='findings')reason='narrative-finding-no-face-field';
  else if(!prefix.length&&leaf.path.length===3&&leaf.path[0]==='identity'&&leaf.path[2]==='office_symbol')reason='office-symbol-no-face-field';
  else if(['created','updated'].includes(leaf.path[0])&&leaf.path.length===2&&['at','by'].includes(leaf.path[1]))reason='audit-metadata';
  else if(prefix.length&&leaf.path.length===1&&['schema','project'].includes(leaf.path[0]))reason='source-identity';
  unmapped.push({path:[...prefix,...leaf.path],raw:leaf.value,reason});
 }
 for(const leaf of leaves(evaluation))if(!paths.has(JSON.stringify(leaf.path)))disclose(leaf);
 for(const k of Object.keys(snapshot))if(k!=='evaluations')for(const leaf of leaves(snapshot[k],[k]))disclose(leaf,['$collection']);
 return freeze({projectId,evaluationId,snapshot,values,unmapped,unselectedEvaluationIds:Object.keys(snapshot.evaluations).filter(id=>id!==evaluationId&&snapshot.evaluations[id]!==null),retiredEvaluationIds:Object.keys(snapshot.evaluations).filter(id=>snapshot.evaluations[id]===null),renderingVerified:false,outputProduced:false});
}
