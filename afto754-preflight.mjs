function __afto754Url(name) {const u=new URL(name,import.meta.url);u.search=new URL(import.meta.url).search;return u.href;}
async function __afto754Json(name) {const r=await fetch(__afto754Url(name),{cache:'no-store'});if(!r.ok)throw new Error('AFTO754 JSON unavailable');return r.json();}
/* Source accounting only. No serializer, fit estimate, renderer or permission to
   emit output. See docs/specs/2026-10-08-afto754-preflight.md. */
const {MAP} = await import(__afto754Url("afto754-mapping.mjs"));
const FINDING_FIELDS=['deficiency','corrective_action','recommendation','status','reference','opr'];
const AUDIT_FIELDS=['at','by'];
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
function fail(message,code){throw Object.assign(new Error(message),{code});}
const pointer=path=>'/'+path.map(s=>s.replaceAll('~','~0').replaceAll('/','~1')).join('/');
const entry=(path,raw)=>({path:[...path],pointer:pointer(path),raw});
const get=(root,path)=>path.reduce((value,key)=>value[key],root);
function branch(){return {kind:'branch',children:new Map()};}
function schema(){
 const root=branch();
 function add(path,kind){let node=root;for(const [i,key]of path.entries()){if(!node.children.has(key))node.children.set(key,i===path.length-1?{kind}:branch());node=node.children.get(key);}}
 for(const slot of MAP.slots)add(slot.sourcePath,'mapped');
 for(const role of ['team_chief','evaluator'])add(['identity',role,'office_symbol'],'office');
 add(['created'],'audit');add(['updated'],'audit');add(['findings'],'findings');return root;
}
const SELECTED_SCHEMA=schema();
export function preflightSelectedEvaluation(record,options,model){
 if(!options||!Object.hasOwn(options,'projectId')||typeof options.projectId!=='string'||!options.projectId.trim())fail('An explicit exact project identity is required.','project_mismatch');
 const {projectId,evaluationId}=options;
 model.validate(record,projectId);
 if(!Object.hasOwn(options,'evaluationId')||typeof evaluationId!=='string'||!Object.hasOwn(record.evaluations,evaluationId)||record.evaluations[evaluationId]===null)fail('Select one existing evaluation explicitly.','evaluation_required');
 const snapshot=JSON.parse(JSON.stringify(record)),selected=snapshot.evaluations[evaluationId],base=['evaluations',evaluationId];
 const blockers=[],unknownExtensions=[],officeSymbols=[],auditMetadata=[],sourceIdentity=[];
 const findings={emptyCollection:Object.keys(selected.findings).length===0,live:[],retired:[]};
 function block(code,path,raw,message){blockers.push({...entry(path,raw),code,message});}
 function unknown(path,raw){const fact=entry(path,raw);unknownExtensions.push(fact);block('unsupported_extension',path,raw,'This source extension has no reviewed destination on the selected evaluation face.');}
 function audit(value,path){
  if(value===null){auditMetadata.push({...entry(path,null),kind:'null-stamp'});return;}
  for(const key of Object.keys(value)){
   if(AUDIT_FIELDS.includes(key))auditMetadata.push({...entry([...path,key],value[key]),kind:'audit-field'});
   else unknown([...path,key],value[key]);
  }
 }
 function findingRows(value,path){
  for(const id of Object.keys(value)){
   const row=value[id],rowPath=[...path,id];
   if(row===null){findings.retired.push({...entry(rowPath,null),id});continue;}
   const facts=Object.fromEntries(FINDING_FIELDS.map(key=>[key,row[key]]));
   findings.live.push({...entry(rowPath,row),id,authoredFacts:facts,blankAuthoredFields:FINDING_FIELDS.every(key=>row[key]==='')});
   block('finding_has_no_face_fields',rowPath,row,'This authored finding row, including an empty row, needs a separate reviewed document destination.');
   for(const key of Object.keys(row)){
    if(key==='created'||key==='updated')audit(row[key],[...rowPath,key]);
    else if(!FINDING_FIELDS.includes(key))unknown([...rowPath,key],row[key]);
   }
  }
 }
 function walk(value,node,path){
  if(node.kind==='mapped')return;
  if(node.kind==='audit'){audit(value,path);return;}
  if(node.kind==='findings'){findingRows(value,path);return;}
  if(node.kind==='office'){
   officeSymbols.push({...entry(path,value),blank:value===''});
   if(value!=='')block('office_symbol_has_no_face_field',path,value,'Office symbol has no separate field on the original face; it is not appended to organization.');
   return;
  }
  for(const key of Object.keys(value)){
   const child=node.children.get(key);
   if(child)walk(value[key],child,[...path,key]);else unknown([...path,key],value[key]);
  }
 }
 walk(selected,SELECTED_SCHEMA,base);
 for(const key of Object.keys(snapshot)){
  if(key==='schema'||key==='project')sourceIdentity.push(entry([key],snapshot[key]));
  else if(key==='created'||key==='updated')audit(snapshot[key],[key]);
  else if(key!=='evaluations')unknown([key],snapshot[key]);
 }
 const mappedValues=MAP.slots.map(slot=>({...entry([...base,...slot.sourcePath],get(selected,slot.sourcePath)),kind:slot.kind}));
 const unselectedEvaluationIds=Object.keys(snapshot.evaluations).filter(id=>id!==evaluationId&&snapshot.evaluations[id]!==null);
 const retiredEvaluationIds=Object.keys(snapshot.evaluations).filter(id=>snapshot.evaluations[id]===null);
 return freeze({projectId,evaluationId,scope:'selected-evaluation-face',sourceStatus:blockers.length?'blocked':'supported-for-selected-face',mappedValues,blockers,
  disclosures:{officeSymbols,findings,unknownExtensions,auditMetadata,sourceIdentity,unselectedEvaluationIds,retiredEvaluationIds},snapshot,
  renderingStatus:'unverified',renderingVerified:false,outputPermitted:false,outputProduced:false,savedBytesVerified:false});
}
