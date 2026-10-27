function __afto752Import(name) {
  const base = new URL(import.meta.url);
  const url = new URL(name, base); url.search = base.search;
  return import(url.href);
}
/* Original-template AFTO752 export. No filesystem, UI, clock, or signatures. */
const {measureAscii, measuredLines} = await __afto752Import("afto752-export-font-metrics.mjs");
const {SLOTS, TEMPLATE_SHA256, FIELD_MAP_SHA256} = await __afto752Import("afto752-export-field-map.mjs");
export {SLOTS, TEMPLATE_SHA256, FIELD_MAP_SHA256};
const repeat = {'complement': ['tc_id',11], 'visits':['visit_id',7], 'coordination.other':['co_id',3]};
const get = (o,p) => p.split('.').reduce((v,k)=>v?.[k],o);
function fail(message,code='invalid_export') { const e=new Error(message); e.code=code; throw e; }
const freeze = o => { if(o && typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);} return o; };
freeze(SLOTS);
function leaves(o,segments=[],out=[]) { if(o && typeof o==='object'){for(const k of Object.keys(o)) leaves(o[k],segments.concat(k),out);}else out.push([segments,o]); return out; }
const pathIdentity = segments => JSON.stringify(segments);
const pointer = segments => '/' + segments.map(s => s.replaceAll('~','~0').replaceAll('/','~1')).join('/');
export function createPlan(record, projectId, model) {
  model.validate(record);
  if(typeof projectId!=='string'||!projectId.trim()||record.project!==projectId) fail('Saved report project does not match the selected project.','project_mismatch');
  if(!record.created||!record.updated) fail('Save the report before generating its PDF.','unsaved_report');
  const snapshot=JSON.parse(JSON.stringify(record)), rows={};
  for(const [path,[,capacity]] of Object.entries(repeat)) {
    rows[path]=Object.keys(get(snapshot,path)).filter(k=>get(snapshot,path)[k]!==null).sort();
    if(rows[path].length>capacity) fail(`${path} has ${rows[path].length} rows; original form holds ${capacity}. No rows were omitted.`, 'repeat_overflow');
  }
  const used=new Set(), assignments=SLOTS.map(slot=>{
    let path=slot.semantic_key;
    for(const [prefix,[placeholder]] of Object.entries(repeat)) if(path.includes(placeholder)) {
      const id=rows[prefix][slot.physical_slot-1];
      path=id ? path.replace('<'+placeholder+'>',id) : null; break;
    }
    if(path) used.add(pathIdentity(path.split('.')));
    const raw=path ? get(snapshot,path) : null;
    if(path && raw===undefined) fail('Mapped source is missing: '+path);
    let value=raw==null?'':String(raw);
    if(slot.model_kind==='flag') value=slot.enum_values[String(raw)] ?? '';
    if(slot.model_kind==='date' && raw) value=raw.replaceAll('-','');
    if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) fail(`Unsupported control characters in ${path}.`);
    return {slot,path,value,raw:raw??null};
  });
  // Compare structural segments, never joined strings: extension keys can
  // contain dots and must not impersonate a known field or metadata subtree.
  const metadata=new Set(['schema','project','created','updated']);
  const unknown=leaves(snapshot).filter(([segments,v])=>!used.has(pathIdentity(segments))&&!metadata.has(segments[0])&&v!==null&&v!=='');
  if(unknown.length) fail('Unmapped saved data: '+unknown.map(x=>pointer(x[0])).join(', '),'unmapped_data');
  return freeze({projectId,snapshot,rows,assignments,fieldMapSha256:FIELD_MAP_SHA256});
}
/* Semantic ancestor names are exact names, never prefixes of unstable dataIds. */
export function collectControls(root) {
  const result=[], occurrences=new Map(), named=new WeakMap();
  function walk(node, ancestors=[]) {
    const a=node.attributes||{};
    if(a.dataId && ['input','textarea','select'].includes(node.name)) {
      const owner=[...ancestors].reverse().find(n=>n.attributes?.xfaName && n.attributes?.class?.some(c=>c==='xfaField'||c==='xfaExclgroup'));
      if(!owner) fail('Unidentified XFA control.');
      const field=owner.attributes.xfaName;
      const page=ancestors.find(n=>/^Page[12]$/.test(n.attributes?.xfaName))?.attributes.xfaName;
      if(!named.has(owner)){const k=page+'.'+field;named.set(owner,occurrences.get(k)||0);occurrences.set(k,(occurrences.get(k)||0)+1);}
      const oi=ancestors.indexOf(owner), wrapper=ancestors[oi-1]?.attributes?.style||{};
      const font=[...ancestors].reverse().find(n=>n.attributes?.style?.fontSize)?.attributes.style;
      result.push({field,page,occurrence:named.get(owner),tag:node.name,type:a.type||null,on:a.xfaOn||null,
        geometry:wrapper,fontSize:parseFloat(font?.fontSize)||0,fontFamily:font?.fontFamily||'',fontStyle:font?.fontStyle||'',fontWeight:font?.fontWeight||'',letterSpacing:font?.letterSpacing||'',lineHeight:font?.lineHeight??null,dataId:a.dataId,value:a.value??a.textContent??'',checked:a.checked===true});
    }
    for(const child of node.children||[]) walk(child,[...ancestors,node]);
  }
  walk(root);return result;
}
function key(c){return [c.page,c.field,c.occurrence].join('.');}
function descriptor(c){return {field:c.field,page:c.page,occurrence:c.occurrence,tag:c.tag,type:c.type,on:c.on,geometry:c.geometry,fontSize:c.fontSize,fontFamily:c.fontFamily,fontStyle:c.fontStyle,fontWeight:c.fontWeight,letterSpacing:c.letterSpacing,lineHeight:c.lineHeight};}
export function assessFit(a,controls) {
  if(!a.value || a.slot.model_kind==='flag')return;
  const c=controls[0], size=c.fontSize;
  if(!size) fail(`Cannot establish text fit for ${a.path}: template font size is zero.`, 'visual_fit_unknown');
  if(c.fontFamily !== '"Times New Roman"' || c.fontStyle !== 'normal' || c.fontWeight !== 'normal' || c.letterSpacing !== '0px' || !(Number.isFinite(c.lineHeight) && c.lineHeight >= 1))
    fail(`Unsupported template font style at ${a.path}.`, 'visual_fit_unknown');
  if(/[^\x20-\x7e\n\r]/.test(a.value))fail(`Unsupported font glyphs in ${a.path}; preserve the record and shorten or transliterate explicitly.`, 'visual_fit_unknown');
  const width=a.slot.geometry_mm.w*72/25.4-3, height=a.slot.geometry_mm.h*72/25.4;
  // XFA layout uses 72pt coordinates. Standard Times advances plus 8% safety
  // margin replace full-em character counts. Viewer substitution still needs
  // acceptance; neither the original template nor saved text is rewritten.
  const measuredSize=size*1.08;
  const textLines=a.value.replace(/\r\n?/g,'\n').split('\n');
  const availableLines=Math.floor((height-2)/(size*c.lineHeight));
  const overflows=a.slot.multiline
    ? measuredLines(a.value,measuredSize,width)>availableLines
    : textLines.length>1 || measureAscii(a.value,measuredSize)>width || size>height;
  if(overflows) fail(`Text may exceed the original form cell at ${a.path}; no content was truncated.`, 'text_overflow');
}

async function open(pdfjs,bytes,workerSrc){ if(workerSrc)pdfjs.GlobalWorkerOptions.workerSrc=workerSrc;return pdfjs.getDocument({data:new Uint8Array(bytes),enableXfa:true,isEvalSupported:false,disableFontFace:true,verbosity:0}).promise; }
export async function generateFilledPdf({record,projectId,model,pdfjs,sourceBytes,workerSrc,sha256}) {
  const plan=createPlan(record,projectId,model); // Snapshot before the first async boundary.
  const source=new Uint8Array(sourceBytes);
  if(typeof sha256!=='function'||await sha256(source)!==TEMPLATE_SHA256)fail('Original AFTO752 template hash mismatch.','template_sha_mismatch');
  let doc,again;
  try {
    doc=await open(pdfjs,source,workerSrc);
    if(!doc.isPureXfa||doc.numPages!==3)fail('Unexpected AFTO752 page structure.');
    const before=collectControls(doc.allXfaHtml), groups=new Map();
    for(const c of before){const k=key(c);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(c);}
    if(groups.size!==193||before.length!==223)fail('Unexpected AFTO752 control inventory.');
    const desired=new Map();
    for(const a of plan.assignments){
      const k=[a.slot.page,a.slot.field_name,a.slot.occurrence].join('.'), controls=groups.get(k);
      if(!controls||desired.has(k))fail('Missing or duplicate semantic mapping: '+k);
      const radio=a.slot.model_kind==='flag';
      if(radio ? controls.length!==2 || controls.some(c=>c.type!=='radio') || ![a.slot.enum_values.true,a.slot.enum_values.false].every(v=>controls.some(c=>c.on===v)) : controls.length!==1||controls[0].type==='radio')fail('Unexpected control type: '+k);
      assessFit(a,controls); desired.set(k,a.value);
      doc.annotationStorage.setValue(controls[0].dataId,{value:a.value});
    }
    const bytes=new Uint8Array(await doc.saveDocument());
    const originalBytesPreserved=bytes.length>=source.length && source.every((v,i)=>v===bytes[i]);
    if(!originalBytesPreserved) fail('PDF save did not preserve the original template bytes.');
    again=await open(pdfjs,bytes,workerSrc);const after=collectControls(again.allXfaHtml);
    if(again.numPages!==3||!again.isPureXfa||JSON.stringify(before.map(descriptor))!==JSON.stringify(after.map(descriptor)))fail('Output control identity changed.');
    for(let i=0;i<after.length;i++){
      const c=after[i], value=desired.get(key(c));
      if(value===undefined){if(c.value!==before[i].value||c.checked!==before[i].checked)fail('Untouched control changed.');}
      else if(c.type==='radio' ? c.checked!==(value===c.on) : String(c.value)!==value)fail('Output value mismatch: '+key(c));
    }
    return {outputBytes:bytes,plan,sourceSha256:TEMPLATE_SHA256,outputSha256:await sha256(bytes),fieldMapSha256:FIELD_MAP_SHA256,
      preservation:{signature:{status:'NOT_VERIFIED',note:'SignatureField1 is not exposed in the runtime control tree; no signature is written or approval inferred.'},pageFields:{status:'NOT_VERIFIED',note:'CurrentPage/PageCount are not exposed as editable controls.'}},
      checks:{original_bytes_preserved:originalBytesPreserved,reparse_values_match:true,control_identities_match:true,untouched_controls_match:true,source_control_count:before.length,pages:3,visual_fit:'Times ASCII advances plus 8% margin and template line height;  viewer visual acceptance remains required'}};
  } finally {if(again)await again.destroy();if(doc)await doc.destroy();}
}
