function __afto754Url(name) {const u=new URL(name,import.meta.url);u.search=new URL(import.meta.url).search;return u.href;}
async function __afto754Json(name) {const r=await fetch(__afto754Url(name),{cache:'no-store'});if(!r.ok)throw new Error('AFTO754 JSON unavailable');return r.json();}
/* Reference advances only; never an output or rendered-ink permission. */
const layout = await __afto754Json("afto754-reference-layout.json");
const {MAP,verifyRuntime} = await import(__afto754Url("afto754-mapping.mjs"));
const {formatSelectedEvaluation} = await import(__afto754Url("afto754-value-formatting.mjs"));
const {TIMES_ASCII_WIDTHS} = await import(__afto754Url("afto754-font-metrics.mjs"));
/* Standard Times-Roman ASCII advance widths, units per 1000 em.
Derived from installed ReportLab 4.4.9 pdfbase/_fontdata_widths_timesroman.py
and its standard WinAnsi encoding using stringWidth(character, Times-Roman, 1000).
Source SHA256: 18328f25869055abe98487aadfd2e3dbe76ab26849b693b8165f00dcbe679f14
No font binary is embedded; no kerning reduction is applied.

#####################################################################################
#
#	Copyright (c) 2000-2024, ReportLab Inc.
#	All rights reserved.
#
#	Redistribution and use in source and binary forms, with or without modification,
#	are permitted provided that the following conditions are met:
#
#		*	Redistributions of source code must retain the above copyright notice,
#			this list of conditions and the following disclaimer. 
#		*	Redistributions in binary form must reproduce the above copyright notice,
#			this list of conditions and the following disclaimer in the documentation
#			and/or other materials provided with the distribution. 
#		*	Neither the name of the company nor the names of its contributors may be
#			used to endorse or promote products derived from this software without
#			specific prior written permission. 
#
#	THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
#	ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
#	WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
#	IN NO EVENT SHALL THE OFFICERS OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
#	INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
#	TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
#	OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER
#	IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
#	IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
#	SUCH DAMAGE.
#
#####################################################################################

*/
// Oslash reference advance from the same ReportLab source: 722/1000 em.
const OSLASH_WIDTH=722;
function freeze(v){if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;}
function fail(){throw Object.assign(new Error('AFTO754 reference layout is unsupported or changed.'),{code:'reference_layout_mismatch'});}
const key=v=>JSON.stringify([v.ancestry,v.field,v.occurrence]);
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
const equal=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
const px=v=>typeof v==='string'&&/^\d+(?:\.\d+)?px$/.test(v)?Number(v.slice(0,-2)):NaN;
export const REFERENCE_LAYOUT=freeze(layout);
function width(d){
 const f=d.fieldStyle,p=f.padding?.split(' ').map(px);
 if(!p||p.length!==4||p.some(x=>!Number.isFinite(x))||!['7.92px','8.91px'].includes(f.fontSize)||f.fontFamily!=='"Times New Roman"'||f.fontWeight!=='normal'||f.fontStyle!=='normal'||f.fontKerning!=='none'||f.letterSpacing!=='0px'||f.lineHeight!==1.347||d.inputs.length!==1||d.inputs[0].tag!=='input'||d.inputs[0].type!=='text')fail();
 const result=px(d.geometry.width)-p[1]-p[3];if(!Number.isFinite(result)||result<=0)fail();return result;
}
if(layout.policy!=='afto754-reference-layout/1'||layout.templateSha256!==MAP.templateSha256||layout.slots.length!==225)fail();
for(let i=0;i<225;i++){const d=layout.slots[i],s=MAP.slots[i];if(!equal(d.sourcePath,s.sourcePath)||d.kind!==s.kind||key(d.identity)!==key(s.runtime)||!equal(d.geometry,s.runtime.geometry))fail();width(d);}
/* Verifies original parsed styles as well as the existing map census. Does not
   attest a caller's file hash; the caller must calculate it from pinned bytes. */
export function verifyReferenceLayout(evidence){
 verifyRuntime(evidence);const found=new Map(),seen=new Map();
 function walk(n,anc=[]){const a=n.attributes||{};if((a.class||[]).includes('xfaField')){const ancestry=anc.map(x=>x.attributes?.xfaName).filter(Boolean),owner=JSON.stringify([...ancestry,a.xfaName]),occurrence=seen.get(owner)||0;seen.set(owner,occurrence+1);const inputs=[];function input(t){if(['input','textarea','select'].includes(t.name))inputs.push({tag:t.name,type:t.attributes?.type??null,style:t.attributes?.style||{}});for(const c of t.children||[])input(c);}input(n);found.set(key({ancestry,field:a.xfaName,occurrence}),{geometry:anc.at(-1)?.attributes?.style||{},fieldStyle:a.style||{},inputs});}for(const c of n.children||[])walk(c,[...anc,n]);}walk(evidence.tree);
 for(const d of layout.slots)if(!equal(found.get(key(d.identity)),{geometry:d.geometry,fieldStyle:d.fieldStyle,inputs:d.inputs}))fail();
 return freeze({mappedInputs:225,referenceDescriptorsVerified:true,outputPermitted:false});
}
export function referenceCapacity(record,options,model){
 const formatted=formatSelectedEvaluation(record,options,model);
 const measurements=formatted.assignments.map((a,i)=>{
  const d=layout.slots[i];if(!equal(a.path.slice(2),d.sourcePath)||a.kind!==d.kind)fail();
  const contentWidth=width(d),fontSize=px(d.fieldStyle.fontSize),v=a.value;
  let status,units=0;
  if(/[\x00-\x1f\x7f]/.test(v))status='unsupported-single-line-value';
  else if(v.startsWith(' ')||v.endsWith(' '))status='persistence-risk';
  else for(const ch of v){const code=ch.codePointAt(0);if(ch==='Ø')units+=OSLASH_WIDTH;else if(code>=32&&code<=126)units+=TIMES_ASCII_WIDTHS[code-32];else{status='unsupported-glyph';break;}}
  const referenceAdvance=status?null:units*fontSize/1000;
  return {...a,identity:d.identity,fontSize,referenceContentWidth:contentWidth,referenceAdvance,status:status||(referenceAdvance<=contentWidth?'reference-horizontal-fit':'reference-width-exceeded')};
 });
 return freeze({...formatted,referencePolicy:'afto754-reference-capacity/1',referenceStatus:formatted.formattingStatus==='blocked'?'not-assessed':'assessed',measurements,metricFamily:'Standard Times-Roman reference',verticalStatus:'unverified',inkContainmentStatus:'unverified',renderingVerified:false,renderingStatus:'unverified',outputPermitted:false,outputProduced:false,savedBytesVerified:false});
}
