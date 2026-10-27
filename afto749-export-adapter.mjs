/* AFTO 749 portable export adapter (browser + Node).

   Maps an `ei-afto749/1` record to the 23 fillable XFA slots of the user-supplied
   20200805 cover sheet, then fills the ORIGINAL PDF bytes with PDF.js 5.6.205
   `annotationStorage` and saves a NEW byte array. The source PDF is never
   mutated. Ephemeral PDF.js dataIds are derived from DOM order + field-name
   prefix and validated before any write; none are hardcoded here.

   Signatures and a fabricated issue date are never written. The output is
   reparsed and every one of the 23 values must equal the intended value before
   the caller may persist the bytes. This module is the isolated, lazily loaded
   modern-module adapter; app/shell/*.js stays ES5. */
export const SLOTS = [
  { index: 0,  field: "Text7",  occurrence: 0, tag: "textarea", role: "HOME UNIT ADDRESS", kind: "scalar", fieldKey: "home_unit_address", widthMm: 90.849, heightMm: 8.865, fontPt: 9 },
  { index: 1,  field: "Text8",  occurrence: 0, tag: "textarea", role: "PROJECT DESIGNATOR (SECTION 1)", kind: "designator", widthMm: 143.833, heightMm: 5.957, fontPt: 9 },
  { index: 2,  field: "Text9",  occurrence: 0, tag: "textarea", role: "PROJECT TITLE AND LOCATION (SECTION 2)", kind: "scalar", fieldKey: "project_title_location", widthMm: 188.859, heightMm: 8.787, fontPt: 9 },
  { index: 3,  field: "Text10", occurrence: 0, tag: "input",    role: "PROJECT MANAGER NAME", kind: "contact", contact: "project_manager", contactKey: "name", widthMm: 47.241, heightMm: 6.15, fontPt: 9 },
  { index: 4,  field: "Text11", occurrence: 0, tag: "input",    role: "PROJECT MANAGER ORGANIZATION", kind: "contact", contact: "project_manager", contactKey: "organization", widthMm: 26.325, heightMm: 6.15, fontPt: 9 },
  { index: 5,  field: "Text12", occurrence: 0, tag: "input",    role: "PROJECT MANAGER OFFICE SYMBOL", kind: "contact", contact: "project_manager", contactKey: "office_symbol", widthMm: 23.548, heightMm: 6.369, fontPt: 9 },
  { index: 6,  field: "Text13", occurrence: 0, tag: "input",    role: "PROJECT MANAGER DSN", kind: "contact", contact: "project_manager", contactKey: "dsn", widthMm: 26.445, heightMm: 6.15, fontPt: 9 },
  { index: 7,  field: "Text14", occurrence: 0, tag: "input",    role: "PROJECT MANAGER E-MAIL", kind: "contact", contact: "project_manager", contactKey: "email", widthMm: 58.924, heightMm: 6.149, fontPt: 9 },
  { index: 8,  field: "Text5",  occurrence: 0, tag: "input",    role: "DATE OF ISSUE", kind: "date", widthMm: 37.226, heightMm: 6.149, fontPt: 9 },
  { index: 9,  field: "Text13", occurrence: 0, tag: "input",    role: "PROJECT ENGINEER DSN", kind: "contact", contact: "project_engineer", contactKey: "dsn", widthMm: 27.132, heightMm: 6.15, fontPt: 9 },
  { index: 10, field: "Text12", occurrence: 0, tag: "input",    role: "PROJECT ENGINEER OFFICE SYMBOL", kind: "contact", contact: "project_engineer", contactKey: "office_symbol", widthMm: 23.548, heightMm: 6.149, fontPt: 9 },
  { index: 11, field: "Text11", occurrence: 0, tag: "input",    role: "PROJECT ENGINEER ORGANIZATION", kind: "contact", contact: "project_engineer", contactKey: "organization", widthMm: 33.728, heightMm: 6.15, fontPt: 9 },
  { index: 12, field: "Text10", occurrence: 0, tag: "input",    role: "PROJECT ENGINEER NAME", kind: "contact", contact: "project_engineer", contactKey: "name", widthMm: 99.624, heightMm: 6.15, fontPt: 9 },
  { index: 13, field: "Text14", occurrence: 0, tag: "input",    role: "PROJECT ENGINEER E-MAIL", kind: "contact", contact: "project_engineer", contactKey: "email", widthMm: 58.924, heightMm: 6.149, fontPt: 9 },
  { index: 14, field: "Text24", occurrence: 0, tag: "textarea", role: "FUNCTIONAL DESCRIPTION (SECTION 6)", kind: "scalar", fieldKey: "functional_description", widthMm: 188.808, heightMm: 24.56, fontPt: 0 },
  { index: 15, field: "Text29", occurrence: 0, tag: "textarea", role: "COMMENTS AND/OR DISTRIBUTION (SECTION 8)", kind: "scalar", fieldKey: "comments_distribution", widthMm: 188.485, heightMm: 71.687, fontPt: 0 },
  { index: 16, field: "Text7",  occurrence: 1, tag: "textarea", role: "PREPARED BY", kind: "scalar", fieldKey: "prepared_by", widthMm: 95.747, heightMm: 8.865, fontPt: 9 },
  { index: 17, field: "Text13", occurrence: 0, tag: "input",    role: "RELEASING ENGINEER DSN", kind: "contact", contact: "releasing_engineer", contactKey: "dsn", widthMm: 27.132, heightMm: 6.15, fontPt: 9 },
  { index: 18, field: "Text12", occurrence: 0, tag: "input",    role: "RELEASING ENGINEER OFFICE SYMBOL", kind: "contact", contact: "releasing_engineer", contactKey: "office_symbol", widthMm: 23.548, heightMm: 6.149, fontPt: 9 },
  { index: 19, field: "Text11", occurrence: 0, tag: "input",    role: "RELEASING ENGINEER ORGANIZATION", kind: "contact", contact: "releasing_engineer", contactKey: "organization", widthMm: 33.728, heightMm: 6.15, fontPt: 9 },
  { index: 20, field: "Text10", occurrence: 0, tag: "input",    role: "RELEASING ENGINEER NAME", kind: "contact", contact: "releasing_engineer", contactKey: "name", widthMm: 99.624, heightMm: 6.15, fontPt: 9 },
  { index: 21, field: "Text14", occurrence: 0, tag: "input",    role: "RELEASING ENGINEER E-MAIL", kind: "contact", contact: "releasing_engineer", contactKey: "email", widthMm: 58.924, heightMm: 6.149, fontPt: 9 },
  { index: 22, field: "Text24", occurrence: 1, tag: "textarea", role: "ASSOCIATED PROJECTS (SECTION 7)", kind: "scalar", fieldKey: "associated_projects", widthMm: 188.808, heightMm: 24.56, fontPt: 0 }
];

/* Stable fingerprint of the canonical slot descriptor (field, occurrence, tag,
   role, kind in DOM order). Kept as a literal so the browser module needs no
   Node crypto; Node tests recompute it and require equality. */
export const FIELD_MAP_SHA256 = "4be634d3219ba4f6695c52eb98130a37063ae00dce1d3fa820c40c7be392670b";

export function canonicalSlots() {
  return SLOTS.map(({ field, occurrence, tag, role, kind }) => ({ field, occurrence, tag, role, kind }));
}

export function dataIdIsSlot(dataId, slot) {
  const suffix = dataId.slice(slot.field.length);
  return dataId.startsWith(slot.field) && /^[0-9]+$/.test(suffix);
}

export function recordToValues(record, model) {
  const rec = model.validate(record);
  const f = rec.fields || {};
  const str = v => (typeof v === "string" ? v : "");
  const text = key => str(f[key]);
  const contact = (role, key) => {
    const c = f[role];
    return c && typeof c === "object" ? str(c[key]) : "";
  };

  return SLOTS.map(slot => {
    if (slot.kind === "scalar") return { slot, value: text(slot.fieldKey) };
    if (slot.kind === "date") return { slot, value: text("date_of_issue") };
    if (slot.kind === "designator") {
      const cips = text("cips_project_number");
      const requirement = text("requirement_number");
      return { slot, value: [cips, requirement].filter(Boolean).join(" / ") };
    }
    if (slot.kind === "contact") return { slot, value: contact(slot.contact, slot.contactKey) };
    throw new Error("unknown slot kind " + slot.kind);
  });
}

const MM_TO_PT = 72 / 25.4;
function singleLineCapacity(slot) {
  const availablePt = slot.widthMm * MM_TO_PT - 4;
  return Math.max(0, Math.floor(availablePt / (slot.fontPt * 0.52)));
}
function textAreaCapacity(slot) {
  if (!slot.fontPt) return null;
  const charsPerLine = Math.max(1, Math.floor((slot.widthMm * MM_TO_PT - 4) / (slot.fontPt * 0.52)));
  const lines = Math.max(1, Math.floor((slot.heightMm * MM_TO_PT - 2) / (slot.fontPt * 1.2)));
  return charsPerLine * lines;
}

export function assessValues(values) {
  const risks = [];
  const unsupported = [];
  for (const { slot, value } of values) {
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
    const nonLatin = /[^\x00-\x7F]/.test(value);
    if (nonLatin) risks.push({ index: slot.index, field: slot.field, role: slot.role, risk: "unicode_visual_glyph", note: "datasets preserve the string; Times New Roman may not render every glyph in the official viewer" });
    if (!value) continue;
    if (slot.fontPt === 0) {
      risks.push({ index: slot.index, field: slot.field, role: slot.role, risk: "zero_font_auto_size_preview", note: "PDF.js 5.6.205 renders this template slot as 0px; visual overflow cannot be verified without a preview adapter or Adobe/AEM XFA engine" });
      continue;
    }
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

export function validateDynamicMap(fields) {
  const errors = [];
  if (fields.length !== SLOTS.length) errors.push(`field count: expected ${SLOTS.length}, got ${fields.length}`);
  for (let i = 0; i < SLOTS.length; i++) {
    const slot = SLOTS[i];
    const field = fields[i];
    if (!field) { errors.push(`missing field at index ${i} (${slot.field}[${slot.occurrence}])`); continue; }
    if (!dataIdIsSlot(field.dataId, slot)) errors.push(`index ${i}: dataId ${field.dataId} does not prefix-match ${slot.field}`);
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

/* Generate a filled PDF byte array from a validated record. Returns the report
   without persisting anything; the caller is the only writer. */
export async function generateFilledPdf({ record, model, pdfjs, sourceBytes, workerSrc }) {
  const slotsWithValues = recordToValues(record, model);
  const values = slotsWithValues.map(v => v.value);
  const { risks, unsupported } = assessValues(slotsWithValues);
  if (unsupported.length) {
    const err = new Error("record contains unsupported characters");
    err.unsupported = unsupported;
    throw err;
  }

  const sourceDoc = await loadDocument(pdfjs, sourceBytes, workerSrc);
  if (!sourceDoc.isPureXfa) throw new Error("source did not parse as pure XFA");

  let reparseDoc = null;
  try {
    const sourceFields = collectFields(sourceDoc.allXfaHtml);
    const mapErrors = validateDynamicMap(sourceFields);
    if (mapErrors.length) throw new Error("source XFA map mismatch: " + mapErrors.join("; "));

    const assignments = [];
    for (let i = 0; i < SLOTS.length; i++) {
      const slot = SLOTS[i];
      const dataId = sourceFields[i].dataId;
      sourceDoc.annotationStorage.setValue(dataId, { value: values[i] });
      assignments.push({ index: i, dataId, field: slot.field, occurrence: slot.occurrence, tag: sourceFields[i].tag, value: values[i] });
    }

    const saved = await sourceDoc.saveDocument();
    const outBytes = new Uint8Array(saved);

    reparseDoc = await loadDocument(pdfjs, new Uint8Array(outBytes), workerSrc);
    const reparsed = collectFields(reparseDoc.allXfaHtml);
    const reparseValues = reparsed.map(f => f.value);
    const valuesMatch = values.length === reparseValues.length && values.every((v, i) => v === reparseValues[i]);
    const signatureDataIds = reparsed.filter(f => f.dataId.startsWith("Signature"));

    return {
      outputBytes: outBytes,
      checks: {
        source_field_count: sourceFields.length === SLOTS.length,
        field_order_names_types_match: mapErrors.length === 0,
        reparse_field_count: reparsed.length === SLOTS.length,
        reparse_values_count: reparseValues.length,
        reparse_values_match: valuesMatch,
        signatures_blank_or_absent: signatureDataIds.length === 0,
        risks,
        overflow_risks: risks.filter(r => r.risk === "overflow_estimate"),
        unicode_visual_risks: risks.filter(r => r.risk === "unicode_visual_glyph"),
        zero_font_preview_risks: risks.filter(r => r.risk === "zero_font_auto_size_preview"),
        source_field_names: sourceFields.map(f => f.dataId),
        reparse_field_names: reparsed.map(f => f.dataId)
      },
      assignments,
      values
    };
  } finally {
    if (reparseDoc) { try { await reparseDoc.destroy(); } catch {} }
    try { await sourceDoc.destroy(); } catch {}
    if (pdfjs.GlobalWorkerOptions) { pdfjs.GlobalWorkerOptions.workerPort = null; }
  }
}
