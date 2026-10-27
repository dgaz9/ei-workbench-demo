function __afto754Url(name) {const u=new URL(name,import.meta.url);u.search=new URL(import.meta.url).search;return u.href;}
async function __afto754Json(name) {const r=await fetch(__afto754Url(name),{cache:'no-store'});if(!r.ok)throw new Error('AFTO754 JSON unavailable');return r.json();}
/* Serialization policy only: every result still denies PDF output. */
const {MAP} = await import(__afto754Url("afto754-mapping.mjs"));
const {preflightSelectedEvaluation} = await import(__afto754Url("afto754-preflight.mjs"));
const slots=new Map(MAP.slots.map(slot=>[JSON.stringify(slot.sourcePath),slot]));
const kinds=new Set(['text','mark','count','date']);
const POLICY='afto754-values/1';
function fail(message,code){throw Object.assign(new Error(message),{code});}
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
function validDate(raw){
 if(typeof raw!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(raw)||Number(raw.slice(0,4))<1)return false;
 const date=new Date(raw+'T00:00:00Z');return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===raw;
}
/* A scalar string is not a preflight or export plan. Exact mapped kind/path
   checks keep a future map extension from inheriting an accidental policy. */
export function formatMappedValue({sourcePath,kind},raw){
 if(!kinds.has(kind))fail('No formatting policy exists for this field kind.','unsupported_format_kind');
 const slot=slots.get(JSON.stringify(sourcePath));
 if(!slot||slot.kind!==kind)fail('No matching formatting policy exists for this source path.','unsupported_format_path');
 if(kind==='text'){
  if(typeof raw!=='string')fail('Expected authored text.','invalid_format_value');return raw;
 }
 if(raw===null)return '';
 if(kind==='mark'){
  if(raw!=='X'&&raw!=='-')fail('Expected an authored X, dash or blank mark.','invalid_format_value');return raw;
 }
 if(kind==='count'){
  if(!Number.isSafeInteger(raw)||raw<0)fail('Expected a nonnegative safe integer or blank count.','invalid_format_value');
  if(sourcePath[0]!=='checklist'||!['def','cor'].includes(sourcePath[2]))fail('No count policy exists for this source path.','unsupported_format_path');
  return raw===0&&sourcePath[2]==='def'?'Ø':String(raw);
 }
 if(!validDate(raw))fail('Expected an ISO calendar date or blank date.','invalid_format_value');
 if(sourcePath[0]==='header'&&['start_date','end_date'].includes(sourcePath[1]))return raw.replaceAll('-','');
 if(sourcePath[0]==='coordination'&&sourcePath[2]==='date')return raw;
 fail('No date policy exists for this source path.','unsupported_format_path');
}
export function formatSelectedEvaluation(record,options,model){
 // Never accept a preflight report as authority: validate and snapshot source.
 const preflight=preflightSelectedEvaluation(record,options,model);
 if(preflight.sourceStatus==='blocked')return freeze({...preflight,formattingPolicy:POLICY,formattingStatus:'blocked',assignments:[]});
 const assignments=preflight.mappedValues.map(value=>({path:[...value.path],pointer:value.pointer,kind:value.kind,raw:value.raw,value:formatMappedValue({sourcePath:value.path.slice(2),kind:value.kind},value.raw)}));
 return freeze({...preflight,formattingPolicy:POLICY,formattingStatus:'formatted',assignments});
}
