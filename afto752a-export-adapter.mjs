/* AFTO 752A portable export adapter (browser + Node).

   Maps ONE explicitly selected `ei-daily-log/1` entry plus separately supplied
   metadata (requirement number, location, title) onto the five fillable XFA
   slots of the user-supplied 20200806 daily-log continuation form, then fills
   the ORIGINAL PDF bytes with pinned PDF.js 5.6.205 `annotationStorage` and
   saves a NEW byte array. The source PDF is never mutated.

   The five intended fields were mapped by extracted label + geometry, not by
   guessing Text-number order:
     Text1   (input)    1. CIPS REQUIREMENT NUMBER   x=60.42mm  y=20.022mm
     Text2   (input)    2. PROJECT LOCATION          x=47.98mm  y=25.727mm
     Text3   (input)    3. PROJECT TITLE             x=142.7mm  y=25.58mm
     Text224 (textarea) DATE column                  x=16.407mm y=37.912mm
     Text223 (textarea) COMMENTS column              x=41.748mm y=37.913mm
   `CurrentPage`/`PageCount` and the instruction text are never filled.

   Signatures and a fabricated date are never written. The output is reparsed
   and every one of the five assigned values must equal the intended value
   before the caller may persist the bytes. This module is the isolated, lazily
   loaded modern-module adapter; app/shell/*.js stays ES5. */
export const SLOTS = [
  { index: 0, field: "Text1",   occurrence: 0, tag: "input",    role: "CIPS REQUIREMENT NUMBER", kind: "metadata", fieldKey: "requirementNumber", xMm: 60.42,   yMm: 20.022, wMm: 144.612, hMm: 4.445,  fontPt: 9, label: "1. CIPS REQUIREMENT NUMBER", labelXmm: 20.35,  labelYmm: 20.87 },
  { index: 1, field: "Text2",   occurrence: 0, tag: "input",    role: "PROJECT LOCATION",        kind: "metadata", fieldKey: "location",           xMm: 47.98,   yMm: 25.727, wMm: 66.04,   hMm: 4.313,  fontPt: 9, label: "2. PROJECT LOCATION",        labelXmm: 19.595, labelYmm: 26.439 },
  { index: 2, field: "Text3",   occurrence: 0, tag: "input",    role: "PROJECT TITLE",           kind: "metadata", fieldKey: "title",              xMm: 142.7,   yMm: 25.58,  wMm: 62.075,  hMm: 4.444,  fontPt: 9, label: "3. PROJECT TITLE",           labelXmm: 118.212, labelYmm: 26.204 },
  { index: 3, field: "Text224", occurrence: 0, tag: "textarea", role: "DATE",                     kind: "date",                               xMm: 16.407,  yMm: 37.912, wMm: 23.645,  hMm: 220.175, fontPt: 9, label: "DATE",                      labelXmm: 20.079, labelYmm: 31.71 },
  { index: 4, field: "Text223", occurrence: 0, tag: "textarea", role: "COMMENTS",                 kind: "comments",                            xMm: 41.748,  yMm: 37.913, wMm: 162.929, hMm: 220.176, fontPt: 9, label: "COMMENTS",                  labelXmm: 46.576, labelYmm: 31.97 }
];

/* Stable fingerprint of the canonical slot descriptor (field, occurrence, tag,
   role, kind and the extracted geometry used to map each label). Kept as a
   literal so the browser module needs no Node crypto; Node tests recompute it
   and require equality. */
export const FIELD_MAP_SHA256 = "4cd7937c474e419787093ac018a741df448c81b1543bb52e310149b37888e934";

const ENTRY_ID_RE = /^dl_[0-9a-f]{32}$/;
const FIELD_NAMES = SLOTS.map(s => s.field).sort((a, b) => b.length - a.length);

export function canonicalSlots() {
  return SLOTS.map(({ field, occurrence, tag, role, kind, xMm, yMm, wMm, hMm }) => ({ field, occurrence, tag, role, kind, xMm, yMm, wMm, hMm }));
}

/* A PDF.js XFA dataId is the XFA field name followed by numeric instance data
   (for example Text1 -> Text1585, Text224 -> Text224588). Matching longest-name
   first avoids the ambiguity where "Text2" is also a prefix of "Text224" and
   "Text223". */
export function fieldNameOf(dataId) {
  if (typeof dataId !== "string") return null;
  for (let i = 0; i < FIELD_NAMES.length; i++) {
    const name = FIELD_NAMES[i];
    if (dataId.startsWith(name)) {
      const suffix = dataId.slice(name.length);
      if (/^[0-9]+$/.test(suffix)) return name;
    }
  }
  return null;
}

export function dataIdIsSlot(dataId, slot) {
  return fieldNameOf(dataId) === slot.field;
}

export function selectedEntry(record, entryId, model) {
  model.validate(record);
  if (typeof entryId !== "string" || !ENTRY_ID_RE.test(entryId)) {
    const err = new Error("The selected daily-log entry ID is not readable.");
    err.code = "invalid_entry_id"; err.kind = err.code; throw err;
  }
  if (!Object.prototype.hasOwnProperty.call(record.entries, entryId)) {
    const err = new Error("The selected daily-log entry is not in this log.");
    err.code = "unknown_entry"; err.kind = err.code; throw err;
  }
  const entry = record.entries[entryId];
  if (entry === null) {
    const err = new Error("The selected daily-log entry has been removed (tombstoned).");
    err.code = "tombstoned_entry"; err.kind = err.code; throw err;
  }
  return entry;
}

/* Metadata is supplied as exact explicit strings and is never derived from the
   internal project ID or the CIPS project number. Missing keys stay blank and
   are named in `missing` so the caller can report them honestly. */
export function metadataStrings(metadata) {
  const m = metadata && typeof metadata === "object" && !Array.isArray(metadata) ? metadata : {};
  const str = v => (typeof v === "string" ? v : "");
  const out = {
    requirementNumber: str(m.requirementNumber),
    location: str(m.location),
    title: str(m.title)
  };
  out.missing = ["requirementNumber", "location", "title"].filter(k => !out[k]);
  return out;
}

/* One selected entry -> five intended values. The stored date and the
   accomplishment are preserved verbatim; when the stored phase is exactly
   "pss", the comments are prefixed with a clearly separate "PSS" line per the
   supplied form instructions. The phase is never inferred from the text. */
export function entryValues(record, entryId, metadata, model) {
  const entry = selectedEntry(record, entryId, model);
  const meta = metadataStrings(metadata);
  const comments = entry.phase === "pss" ? "PSS\n" + entry.accomplishment : entry.accomplishment;
  return {
    values: [meta.requirementNumber, meta.location, meta.title, entry.date, comments],
    missing: meta.missing,
    entry: { date: entry.date, accomplishment: entry.accomplishment, phase: entry.phase || "" }
  };
}

const MM_TO_PT = 72 / 25.4;
function singleLineCapacity(slot) {
  const availablePt = slot.wMm * MM_TO_PT - 4;
  return Math.max(0, Math.floor(availablePt / (slot.fontPt * 0.52)));
}
function textAreaCapacity(slot) {
  const charsPerLine = Math.max(1, Math.floor((slot.wMm * MM_TO_PT - 4) / (slot.fontPt * 0.52)));
  const lines = Math.max(1, Math.floor((slot.hMm * MM_TO_PT - 2) / (slot.fontPt * 1.2)));
  return charsPerLine * lines;
}

export function assessValues(slotsWithValues) {
  const risks = [];
  const unsupported = [];
  for (const { slot, value } of slotsWithValues) {
    if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value)) {
      unsupported.push({ index: slot.index, field: slot.field, reason: "control character" });
    }
    for (let i = 0; i < value.length; i++) {
      const code = value.charCodeAt(i);
      if (code >= 0xD800 && code <= 0xDBFF) {
        if (i + 1 >= value.length || value.charCodeAt(i + 1) < 0xDC00 || value.charCodeAt(i + 1) > 0xDFFF) {
          unsupported.push({ index: slot.index, field: slot.field, reason: "unpaired surrogate" });
        }
        i++;
      } else if (code >= 0xDC00 && code <= 0xDFFF) {
        unsupported.push({ index: slot.index, field: slot.field, reason: "unpaired surrogate" });
      }
    }
    if (/[^\x00-\x7F]/.test(value)) {
      risks.push({ index: slot.index, field: slot.field, role: slot.role, risk: "unicode_visual_glyph", note: "dataset preserves the string; Times New Roman may not render every glyph in the official viewer" });
    }
    if (!value) continue;
    const capacity = slot.tag === "input" ? singleLineCapacity(slot) : textAreaCapacity(slot);
    if (capacity !== null && value.length > capacity) {
      risks.push({ index: slot.index, field: slot.field, role: slot.role, risk: "overflow_estimate", length: value.length, estimated_capacity: capacity, estimate: "advisory" });
    }
  }
  return { risks, unsupported };
}

export function leafValue(node) {
  if (!node) return "";
  const a = node.attributes || {};
  if (a.value !== null && a.value !== undefined && a.value !== "") return a.value;
  if (a.textContent !== null && a.textContent !== undefined && a.textContent !== "") return a.textContent;
  if (a.value !== null && a.value !== undefined) return a.value;
  if (a.textContent !== null && a.textContent !== undefined) return a.textContent;
  return "";
}

export function collectFields(root) {
  const out = [];
  const walk = node => {
    if (!node) return;
    const a = node.attributes || {};
    if (a.dataId && ["input", "textarea", "select"].includes(node.name)) {
      out.push({ dataId: a.dataId, tag: node.name, type: a.type ?? null, value: leafValue(node) });
    }
    if (node.children) for (const child of node.children) walk(child);
  };
  walk(root);
  return out;
}

export function allDataIds(root) {
  const ids = [];
  const walk = node => {
    if (!node) return;
    const a = node.attributes || {};
    if (a.dataId) ids.push(a.dataId);
    if (node.children) for (const child of node.children) walk(child);
  };
  walk(root);
  return ids;
}

export function validateDynamicMap(fields) {
  const errors = [];
  if (fields.length !== SLOTS.length) errors.push(`field count: expected ${SLOTS.length}, got ${fields.length}`);
  for (let i = 0; i < SLOTS.length; i++) {
    const slot = SLOTS[i];
    const field = fields[i];
    if (!field) { errors.push(`missing field at index ${i} (${slot.field}[${slot.occurrence}])`); continue; }
    if (fieldNameOf(field.dataId) !== slot.field) errors.push(`index ${i}: dataId ${field.dataId} does not map to ${slot.field}`);
    if (field.tag !== slot.tag) errors.push(`index ${i}: expected tag ${slot.tag}, got ${field.tag}`);
  }
  return errors;
}

async function loadDocument(pdfjs, bytes, workerSrc) {
  if (workerSrc && pdfjs.GlobalWorkerOptions) pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
  if (pdfjs.GlobalWorkerOptions) pdfjs.GlobalWorkerOptions.workerPort = null;
  const doc = pdfjs.getDocument({
    data: new Uint8Array(bytes),
    enableXfa: true,
    disableFontFace: true,
    isEvalSupported: false,
    verbosity: 0
  });
  return await doc.promise;
}

/* Generate a filled PDF byte array from one validated entry. Returns the report
   without persisting anything; the caller is the only writer. */
export async function generateFilledPdf({ record, entryId, metadata, model, pdfjs, sourceBytes, workerSrc, expectedSha256 = null, sha256 = null }) {
  const { values, missing, entry } = entryValues(record, entryId, metadata, model);
  const slotsWithValues = SLOTS.map((slot, i) => ({ slot, value: values[i] }));
  const { risks, unsupported } = assessValues(slotsWithValues);
  if (unsupported.length) {
    const err = new Error("selected entry contains unsupported characters");
    err.unsupported = unsupported;
    throw err;
  }

  if (typeof expectedSha256 !== "string" || !/^[a-f0-9]{64}$/.test(expectedSha256)) {
    throw new Error("A pinned template SHA-256 is required before filling.");
  }
  {
    if (typeof sha256 !== "function") throw new Error("expectedSha256 was provided without a sha256 function");
    const actual = await sha256(sourceBytes);
    if (actual !== expectedSha256) {
      const err = new Error("template SHA-256 mismatch; refusing to fill a modified template");
      err.code = "template_sha_mismatch"; err.kind = err.code;
      err.expected = expectedSha256; err.actual = actual;
      throw err;
    }
  }

  const sourceDoc = await loadDocument(pdfjs, sourceBytes, workerSrc);

  let reparseDoc = null;
  try {
    if (!sourceDoc.isPureXfa) throw new Error("source did not parse as pure XFA");
    const sourceFields = collectFields(sourceDoc.allXfaHtml);
    const mapErrors = validateDynamicMap(sourceFields);
    if (mapErrors.length) throw new Error("source XFA map mismatch: " + mapErrors.join("; "));

    const assignments = [];
    for (let i = 0; i < SLOTS.length; i++) {
      const slot = SLOTS[i];
      const dataId = sourceFields[i].dataId;
      sourceDoc.annotationStorage.setValue(dataId, { value: values[i] });
      assignments.push({ index: i, dataId, field: slot.field, occurrence: slot.occurrence, tag: sourceFields[i].tag, role: slot.role, value: values[i] });
    }

    const saved = await sourceDoc.saveDocument();
    const outBytes = new Uint8Array(saved);

    reparseDoc = await loadDocument(pdfjs, new Uint8Array(outBytes), workerSrc);
    const reparsed = collectFields(reparseDoc.allXfaHtml);
    const reparseMapErrors = validateDynamicMap(reparsed);
    const reparseValues = reparsed.map(f => f.value);
    const valuesMatch = reparsed.length === values.length && values.every((v, i) => v === reparseValues[i]);
    const outputDataIds = allDataIds(reparseDoc.allXfaHtml);
    const forbiddenPageFields = outputDataIds.filter(id => /^(CurrentPage|PageCount)/.test(id));
    const signatureFields = outputDataIds.filter(id => /^Signature/.test(id));
    if (reparseMapErrors.length || !valuesMatch || forbiddenPageFields.length || signatureFields.length) {
      throw new Error("Filled PDF verification failed; refusing to return unverified output bytes.");
    }

    return {
      outputBytes: outBytes,
      values,
      missing,
      entry,
      checks: {
        template_sha_verified: Boolean(expectedSha256),
        source_field_count: sourceFields.length === SLOTS.length,
        field_order_names_types_match: mapErrors.length === 0,
        reparse_field_count: reparsed.length === SLOTS.length,
        reparse_field_order_names_types_match: reparseMapErrors.length === 0,
        reparse_values_count: reparseValues.length,
        reparse_values_match: valuesMatch,
        page_fields_blank_or_absent: forbiddenPageFields.length === 0,
        signature_fields_blank_or_absent: signatureFields.length === 0,
        risks,
        overflow_risks: risks.filter(r => r.risk === "overflow_estimate"),
        unicode_visual_risks: risks.filter(r => r.risk === "unicode_visual_glyph"),
        source_field_names: sourceFields.map(f => f.dataId),
        reparse_field_names: reparsed.map(f => f.dataId)
      },
      assignments
    };
  } finally {
    if (reparseDoc) { try { await reparseDoc.destroy(); } catch {} }
    try { await sourceDoc.destroy(); } catch {}
    if (pdfjs.GlobalWorkerOptions) { pdfjs.GlobalWorkerOptions.workerPort = null; }
  }
}
