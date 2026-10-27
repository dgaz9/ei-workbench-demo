/* AFTO 750A CONTINUATION-PAGE portable export adapter (browser + Node).

   Maps ONE saved `ei-project-reviews/1` review onto ONE explicit AFTO Form
   750A continuation page (20200805 user-supplied original): the three repeated
   header fields (CIPS requirement number, project location, project title) and
   up to five caller-selected issue blocks. This is a single continuation sheet,
   not a complete-review export: any other active issue IDs are disclosed as
   `remainingIssueIds` for a future packet coordinator. No issue is auto-selected
   and no second page is implicitly allocated.

   The source PDF is never mutated; PDF.js 5.6.205 `annotationStorage` writes
   into a NEW byte array. The PDF.js XFA dataIds are ephemeral and differ between
   parse sessions, so no numeric dataId is hardcoded. `FIELD_LAYOUT` carries an
   independent semantic identity (page, field-name prefix, tag/type, and authored
   page geometry in millimetres) extracted from the supplied XFA template and
   verified against the runtime `allXfaHtml`. `bindFields` matches each descriptor
   by that identity, never by runtime traversal order or numeric field-name order.
   Every assigned value is verified by reopening the saved bytes and matching the
   same geometry-bound fields. Unselected issue-block fields are never written and
   are re-checked against their captured source values.

   Signature widgets and CurrentPage/PageCount are not observable in this form's
   runtime `allXfaHtml` dataId set, so no signature or page-number state is
   claimed; typed names are attribution text only, never signature marks. */
function __afto750PacketImport(name) {
  if (typeof name !== "string" || !/^[A-Za-z0-9.-]+$/.test(name)) {
    throw new Error("unexpected AFTO 750 packet dependency name");
  }
  const base = new URL(import.meta.url);
  const url = new URL(name, base);
  url.search = base.search;
  return import(url.href);
}
const { issueNarrative } = await __afto750PacketImport("afto750-export-adapter.mjs");
export { issueNarrative };

export const EDITION = "AFTO Form 750A, 20200805";
export const FIELD_MAP_SHA256 = "fb6529937d649ea1535c673a577b4925dd9ed0fbc73ea4bdc0299a9be4cdf4b1";

const MAX_ISSUES = 5;
const PAGE = 0;
const GEOMETRY_TOLERANCE_MM = 0.6;
const FONT_PT = 9;
const VALID_ISSUE_ID = /^ri_[0-9a-f]{32}$/;
const VALID_REVIEW_ID = /^rv_[0-9a-f]{32}$/;

function fail(message, code) {
  const err = new Error(message);
  if (code) { err.code = code; err.kind = code; }
  throw err;
}

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Reflect.ownKeys(value)) deepFreeze(value[key]);
  }
  return value;
}

function headerEntry(field, occurrence, fieldKey, role, xMm, yMm, wMm, hMm) {
  return { field, occurrence, tag: "input", type: "text", kind: "header", fieldKey, role, page: PAGE, xMm, yMm, wMm, hMm, fontPt: FONT_PT };
}
function issueEntry(field, occurrence, tag, kind, block, role, xMm, yMm, wMm, hMm) {
  return { field, occurrence, tag, type: tag === "input" ? "text" : null, kind, block, role, page: PAGE, xMm, yMm, wMm, hMm, fontPt: FONT_PT };
}

const HEADER_FIELDS = [
  headerEntry("Text4", 0, "requirementNumber", "CIPS REQUIREMENT NUMBER", 51.749, 14.446, 71.847, 3.541),
  headerEntry("Text5", 0, "location", "PROJECT LOCATION", 41.257, 19.258, 62.239, 3.849),
  headerEntry("Text6", 0, "title", "PROJECT TITLE", 124.358, 19.156, 76.835, 3.793)
];

/* Five issue blocks in authored page order (top to bottom), not numeric
   TextField name order. Text8/9/10/11 repeat three times; Text35/36/37/39
   repeat twice. Occurrence tracks the per-field-name instance index. */
const ISSUE_BLOCKS = [
  { number: ["TextField2", 0, 28.543, 23.227], narrative: ["Text8", 0, 13.180, 27.658], response: ["Text9", 0, 13.257, 47.318], initiatorName: ["Text10", 0, 13.857, 66.414], engineerName: ["Text11", 0, 108.342, 66.414] },
  { number: ["TextField1", 0, 28.614, 72.115], narrative: ["Text8", 1, 13.250, 76.546], response: ["Text9", 1, 13.328, 96.206], initiatorName: ["Text10", 1, 13.928, 115.302], engineerName: ["Text11", 1, 108.416, 115.302] },
  { number: ["TextField3", 0, 28.882, 121.433], narrative: ["Text8", 2, 13.518, 125.864], response: ["Text9", 2, 13.596, 145.524], initiatorName: ["Text10", 2, 14.196, 164.620], engineerName: ["Text11", 2, 108.680, 164.620] },
  { number: ["TextField4", 0, 30.268, 170.095], narrative: ["Text35", 0, 14.041, 174.509], response: ["Text36", 0, 14.623, 194.825], initiatorName: ["Text37", 0, 14.041, 214.581], engineerName: ["Text39", 0, 108.931, 214.581] },
  { number: ["TextField5", 0, 28.882, 219.992], narrative: ["Text35", 1, 13.981, 223.993], response: ["Text36", 1, 14.559, 244.309], initiatorName: ["Text37", 1, 13.981, 264.068], engineerName: ["Text39", 1, 109.224, 264.248] }
];

const ISSUE_DIMENSIONS = {
  number: { wMm: 9.061, hMm: 4.287 },
  narrativeText8: { wMm: 188.886, hMm: 15.443 },
  responseText9: { wMm: 188.666, hMm: 15.195 },
  initiatorText10: { wMm: 37.233, hMm: 4.566 },
  engineerText11: { wMm: 41.062, hMm: 4.543 },
  narrativeText35: { wMm: 188.217, hMm: 15.852 },
  responseText36: { wMm: 187.547, hMm: 15.629 },
  initiatorText37: { wMm: 107.591 * 25.4 / 72, hMm: 4.544 },
  engineerText39: { wMm: 114.553 * 25.4 / 72, hMm: 4.544 }
};

const ISSUE_TEXT_FIELDS = [];
for (let block = 0; block < ISSUE_BLOCKS.length; block++) {
  const b = ISSUE_BLOCKS[block];
  const dim = {
    narrative: block < 3 ? ISSUE_DIMENSIONS.narrativeText8 : ISSUE_DIMENSIONS.narrativeText35,
    response: block < 3 ? ISSUE_DIMENSIONS.responseText9 : ISSUE_DIMENSIONS.responseText36,
    initiatorName: block < 3 ? ISSUE_DIMENSIONS.initiatorText10 : ISSUE_DIMENSIONS.initiatorText37,
    engineerName: block < 3 ? ISSUE_DIMENSIONS.engineerText11 : ISSUE_DIMENSIONS.engineerText39
  };
  ISSUE_TEXT_FIELDS.push(issueEntry(b.number[0], b.number[1], "input", "issue_number", block, "number", b.number[2], b.number[3], ISSUE_DIMENSIONS.number.wMm, ISSUE_DIMENSIONS.number.hMm));
  ISSUE_TEXT_FIELDS.push(issueEntry(b.narrative[0], b.narrative[1], "textarea", "issue_narrative", block, "narrative", b.narrative[2], b.narrative[3], dim.narrative.wMm, dim.narrative.hMm));
  ISSUE_TEXT_FIELDS.push(issueEntry(b.response[0], b.response[1], "textarea", "issue_text", block, "response", b.response[2], b.response[3], dim.response.wMm, dim.response.hMm));
  ISSUE_TEXT_FIELDS.push(issueEntry(b.initiatorName[0], b.initiatorName[1], "input", "issue_text", block, "initiatorName", b.initiatorName[2], b.initiatorName[3], dim.initiatorName.wMm, dim.initiatorName.hMm));
  ISSUE_TEXT_FIELDS.push(issueEntry(b.engineerName[0], b.engineerName[1], "input", "issue_text", block, "engineerName", b.engineerName[2], b.engineerName[3], dim.engineerName.wMm, dim.engineerName.hMm));
}

export const FIELD_LAYOUT = deepFreeze([
  ...HEADER_FIELDS,
  ...ISSUE_TEXT_FIELDS
]);

const FIELD_NAMES = Object.freeze([...new Set(FIELD_LAYOUT.map(e => e.field))].sort((a, b) => b.length - a.length));

/* A PDF.js XFA dataId is the XFA field name followed by numeric instance data
   (for example Text4 -> Text42138, TextField1 -> TextField12150). */
export function dataIdIsField(dataId, field) {
  if (typeof dataId !== "string" || typeof field !== "string") return false;
  if (!dataId.startsWith(field)) return false;
  const suffix = dataId.slice(field.length);
  return /^[0-9]+$/.test(suffix);
}

export function dataIdIsSlot(dataId, field) {
  return dataIdIsField(dataId, field);
}

export function fieldNameOf(dataId) {
  if (typeof dataId !== "string") return null;
  const matches = FIELD_NAMES.filter(name => dataIdIsField(dataId, name));
  return matches.length === 1 ? matches[0] : null;
}

export function canonicalFieldMap() {
  return FIELD_LAYOUT.map((entry, index) => {
    const out = {
      index,
      field: entry.field,
      occurrence: entry.occurrence ?? 0,
      tag: entry.tag,
      type: entry.type ?? null,
      kind: entry.kind
    };
    if (entry.fieldKey !== undefined) out.fieldKey = entry.fieldKey;
    if (entry.role !== undefined) out.role = entry.role;
    if (entry.block !== undefined) out.block = entry.block;
    if (entry.page !== undefined) out.page = entry.page;
    if (entry.xMm !== undefined) out.xMm = entry.xMm;
    if (entry.yMm !== undefined) out.yMm = entry.yMm;
    if (entry.wMm !== undefined) out.wMm = entry.wMm;
    if (entry.hMm !== undefined) out.hMm = entry.hMm;
    if (entry.fontPt !== undefined) out.fontPt = entry.fontPt;
    return out;
  });
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
  const cssPx = value => {
    if (value === null || value === undefined) return 0;
    const m = /^(-?\d+(?:\.\d+)?)px$/.exec(String(value));
    return m ? Number(m[1]) : 0;
  };
  const walk = (node, page, offsetX, offsetY, ancestors) => {
    if (!node) return;
    const a = node.attributes || {};
    const style = a.style || {};
    const isWrapper = Array.isArray(a.class) && a.class.includes("xfaWrapper");
    const nextAncestors = isWrapper ? ancestors.concat([{ left: cssPx(style.left), top: cssPx(style.top) }]) : ancestors;
    const nextX = offsetX + (isWrapper ? cssPx(style.left) : 0);
    const nextY = offsetY + (isWrapper ? cssPx(style.top) : 0);
    if (a.dataId && ["input", "textarea", "select"].includes(node.name)) {
      out.push({
        dataId: a.dataId,
        tag: node.name,
        type: a.type ?? null,
        value: leafValue(node),
        page,
        xMm: nextX / 72 * 25.4,
        yMm: nextY / 72 * 25.4,
        ancestorOffsets: nextAncestors
      });
    }
    if (node.children) for (const child of node.children) walk(child, page, nextX, nextY, nextAncestors);
  };
  const children = root && root.children ? root.children : [root];
  for (let page = 0; page < children.length; page++) {
    walk(children[page], page, 0, 0, []);
  }
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

function semanticSignatures(fields) {
  return fields.map(f => (fieldNameOf(f.dataId) ?? f.dataId) + "\u0000" + f.tag + "\u0000" + (f.type ?? "")).sort();
}

function semanticLabel(entry) {
  const parts = [entry.field + "[" + (entry.occurrence ?? 0) + "]"];
  if (entry.fieldKey !== undefined) parts.push(entry.fieldKey);
  if (entry.role !== undefined) parts.push(entry.role);
  if (entry.block !== undefined) parts.push("block" + entry.block);
  return parts.join("/");
}

function fieldMatches(entry, field) {
  if (!field || typeof field.dataId !== "string") return false;
  if (!dataIdIsField(field.dataId, entry.field)) return false;
  if (field.tag !== entry.tag) return false;
  if ((field.type ?? null) !== (entry.type ?? null)) return false;
  if (field.page !== entry.page) return false;
  if (typeof field.xMm !== "number" || !Number.isFinite(field.xMm)) return false;
  if (typeof field.yMm !== "number" || !Number.isFinite(field.yMm)) return false;
  return Math.abs(field.xMm - entry.xMm) <= GEOMETRY_TOLERANCE_MM &&
    Math.abs(field.yMm - entry.yMm) <= GEOMETRY_TOLERANCE_MM;
}

/* Bind collected runtime fields to the proven template layout by semantic
   page/name/tag/type/geometry identity. Traversal order is intentionally not
   the match key: reordered, moved, duplicated, or missing controls fail even
   if they would pass a same-index or same-prefix comparison. */
export function bindFields(fields) {
  const errors = [];
  const bindings = [];
  if (!Array.isArray(fields)) {
    return { bindings, errors: ["runtime fields are not an array"] };
  }
  if (fields.length !== FIELD_LAYOUT.length) {
    errors.push(`fillable field count: expected ${FIELD_LAYOUT.length}, got ${fields.length}`);
  }
  const used = new Set();
  for (let i = 0; i < FIELD_LAYOUT.length; i++) {
    const entry = FIELD_LAYOUT[i];
    const candidates = [];
    for (let fieldIndex = 0; fieldIndex < fields.length; fieldIndex++) {
      if (fieldMatches(entry, fields[fieldIndex])) candidates.push({ field: fields[fieldIndex], fieldIndex });
    }
    if (!candidates.length) {
      errors.push(`index ${i}: no runtime field matches ${semanticLabel(entry)} at page ${entry.page} (${entry.xMm},${entry.yMm})`);
      bindings.push(null);
      continue;
    }
    if (candidates.length > 1) {
      errors.push(`index ${i}: ambiguous runtime match for ${semanticLabel(entry)} (${candidates.length} candidates)`);
      bindings.push(null);
      continue;
    }
    const { field, fieldIndex } = candidates[0];
    if (used.has(fieldIndex)) {
      errors.push(`index ${i}: runtime field ${fieldIndex} is already bound; ${semanticLabel(entry)} has no unique control`);
      bindings.push(null);
      continue;
    }
    used.add(fieldIndex);
    bindings.push({ index: i, dataId: field.dataId, sourceValue: field.value, fieldIndex, entry });
  }
  for (let fieldIndex = 0; fieldIndex < fields.length; fieldIndex++) {
    if (!used.has(fieldIndex)) errors.push(`runtime field ${fieldIndex} (${fields[fieldIndex] && fields[fieldIndex].dataId}) was not bound to a semantic slot`);
  }
  return { bindings, errors };
}

/* Strict dense-plain-array validation that reads property descriptors only, so
   an indexed getter is never invoked while rejecting a hostile selection. */
function assertPlainSelectionArray(value) {
  if (!Array.isArray(value)) fail("Selected issue IDs must be a list.", "invalid_selection");
  if (Object.getPrototypeOf(value) !== Array.prototype) fail("Selected issue IDs must be a plain array.", "invalid_selection");
  const symbols = Object.getOwnPropertySymbols(value);
  if (symbols.length) fail("Selected issue IDs cannot contain symbol-keyed properties.", "invalid_selection");
  const canonicalIndex = key => /^(0|[1-9][0-9]*)$/.test(key);
  const names = Object.getOwnPropertyNames(value);
  for (const key of names) {
    if (key === "length") continue;
    if (!canonicalIndex(key) || Number(key) >= value.length) fail("Selected issue IDs cannot contain missing or named entries.", "invalid_selection");
    const d = Object.getOwnPropertyDescriptor(value, key);
    if (!d || !d.enumerable) fail("Selected issue IDs cannot contain hidden entries.", "invalid_selection");
    if (hasOwn(d, "get") || hasOwn(d, "set")) fail("Selected issue IDs cannot contain accessor properties.", "invalid_selection");
  }
  for (let i = 0; i < value.length; i++) {
    const d = Object.getOwnPropertyDescriptor(value, String(i));
    if (!d || !d.enumerable) fail("Selected issue IDs cannot contain missing, named or hidden entries.", "invalid_selection");
    if (hasOwn(d, "get") || hasOwn(d, "set")) fail("Selected issue IDs cannot contain accessor properties.", "invalid_selection");
  }
}

/* Prepare the canonical continuation projection. The ORIGINAL selection is
   validated structurally and by value BEFORE any model call; the model is then
   called one validated ID at a time (its own cap is two) to obtain canonical
   issue projections. The record and issueIds are never mutated. */
export function projectedInputs(record, expectedProjectId, reviewId, issueIds, model) {
  if (!model || typeof model.validate !== "function" || typeof model.exportInputs !== "function" || typeof model.catalogRow !== "function") {
    fail("A project-review model is required.", "model_missing");
  }
  assertPlainSelectionArray(issueIds);
  if (issueIds.length > MAX_ISSUES) fail("Select at most five issues for one AFTO 750A continuation page.", "too_many_issues");

  const ids = [];
  const seen = new Set();
  for (let i = 0; i < issueIds.length; i++) {
    const id = issueIds[i];
    if (typeof id !== "string" || !VALID_ISSUE_ID.test(id)) fail("A selected issue ID is invalid.", "invalid_issue_id");
    if (seen.has(id)) fail("The same issue cannot be selected twice.", "duplicate_issue_id");
    seen.add(id);
    ids.push(id);
  }

  model.validate(record);
  if (typeof expectedProjectId !== "string" || expectedProjectId !== record.project) fail("This export names a different project.", "different_project");
  if (typeof reviewId !== "string" || !VALID_REVIEW_ID.test(reviewId) || !record.reviews || !hasOwn(record.reviews, reviewId) || record.reviews[reviewId] === null) {
    fail("This review is no longer in the project.", "review_missing");
  }

  const review = record.reviews[reviewId];
  const selected = [];
  for (const id of ids) {
    const issue = review.issues[id];
    if (!issue || issue === null) fail("A selected issue is no longer in this review.", "unknown_issue");
    if (issue.retired) fail("A retired issue cannot be selected for export.", "retired_issue");
    const canonical = model.exportInputs(record, expectedProjectId, reviewId, [id]);
    selected.push(canonical.review.issues[0]);
  }

  const allActive = model.exportInputs(record, expectedProjectId, reviewId, []).remainingIssueIds;
  const selectedSet = new Set(ids);
  const remaining = allActive.filter(id => !selectedSet.has(id));

  return {
    schema: record.schema,
    project: record.project,
    review: {
      id: reviewId,
      label: review.label,
      kind: review.kind,
      source: { edition: review.source.edition, sourceSha256: review.source.sourceSha256 },
      header: {
        requirementNumber: review.header.requirementNumber,
        location: review.header.location,
        title: review.header.title
      },
      issues: selected
    },
    remainingIssueIds: remaining
  };
}

/* Build the defensive value plan. Headers are always written; only the selected
   issue blocks are written and every unselected block is preserved untouched. */
export function valuesForProjection(projection, model) {
  if (!projection || typeof projection !== "object") fail("The review projection is not readable.", "projection_missing");
  const review = projection.review;
  if (!review || typeof review !== "object") fail("The review projection is missing its review.", "projection_missing");
  if (!review.header || typeof review.header !== "object") fail("The review header is not readable.", "projection_missing");
  if (!Array.isArray(review.issues)) fail("The review issues are not readable.", "projection_missing");

  const values = new Array(FIELD_LAYOUT.length).fill("");
  const assignments = [];
  const preservedIndices = [];
  for (let i = 0; i < FIELD_LAYOUT.length; i++) {
    const entry = FIELD_LAYOUT[i];
    let value;
    if (entry.kind === "header") {
      const headerValue = review.header[entry.fieldKey];
      if (typeof headerValue !== "string") fail("A header value is unreadable: " + entry.fieldKey, "unreadable_header");
      value = headerValue;
    } else if (entry.block >= review.issues.length) {
      values[i] = null;
      preservedIndices.push(i);
      continue;
    } else if (entry.kind === "issue_number") {
      const issue = review.issues[entry.block] || null;
      value = issue ? issue.number : "";
    } else if (entry.kind === "issue_narrative") {
      const issue = review.issues[entry.block] || null;
      value = issueNarrative(issue, review.kind, model);
    } else if (entry.kind === "issue_text") {
      const issue = review.issues[entry.block] || null;
      const text = issue ? issue[entry.role] : "";
      if (typeof text !== "string") fail("An issue text value is unreadable: " + entry.role, "unreadable_issue_text");
      value = text;
    } else {
      fail("Unsupported layout kind: " + entry.kind, "unsupported_layout_kind");
    }
    values[i] = value;
    assignments.push({ index: i, entry, value });
  }
  return { values, assignments, preservedIndices };
}

const MM_TO_PT = 72 / 25.4;
function singleLineCapacity(entry) {
  const wPt = entry.wMm * MM_TO_PT;
  return Math.max(0, Math.floor((wPt - 4) / (entry.fontPt * 0.52)));
}
function textAreaCapacity(entry) {
  const charsPerLine = Math.max(1, Math.floor((entry.wMm * MM_TO_PT - 4) / (entry.fontPt * 0.52)));
  const lines = Math.max(1, Math.floor((entry.hMm * MM_TO_PT - 2) / (entry.fontPt * 1.2)));
  return charsPerLine * lines;
}

/* Control characters and unpaired UTF-16 surrogates are hard refusals.
   Unicode and advisory overflow are risks only: the string is always written
   verbatim and is never truncated, and visual fit is not claimed. */
export function assessValues(slotsWithValues) {
  const risks = [];
  const unsupported = [];
  for (const { index, entry, value } of slotsWithValues) {
    if (!value) continue;
    if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value)) {
      unsupported.push({ index, field: entry.field, reason: "control character" });
    }
    for (let i = 0; i < value.length; i++) {
      const code = value.charCodeAt(i);
      if (code >= 0xD800 && code <= 0xDBFF) {
        if (i + 1 >= value.length || value.charCodeAt(i + 1) < 0xDC00 || value.charCodeAt(i + 1) > 0xDFFF) {
          unsupported.push({ index, field: entry.field, reason: "unpaired surrogate" });
        }
        i++;
      } else if (code >= 0xDC00 && code <= 0xDFFF) {
        unsupported.push({ index, field: entry.field, reason: "unpaired surrogate" });
      }
    }
    if (/[^\x00-\x7F]/.test(value)) {
      risks.push({ index, field: entry.field, occurrence: entry.occurrence ?? 0, role: entry.role ?? entry.kind, risk: "unicode_visual_glyph", note: "dataset preserves the string; the embedded font may not render every glyph" });
    }
    const capacity = entry.tag === "input" ? singleLineCapacity(entry) : textAreaCapacity(entry);
    if (value.length > capacity) {
      risks.push({ index, field: entry.field, occurrence: entry.occurrence ?? 0, role: entry.role ?? entry.kind, risk: "overflow_estimate", length: value.length, estimated_capacity: capacity, estimate: "advisory" });
    }
  }
  return { risks, unsupported };
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

function captureSourceBytes(sourceBytes) {
  if (sourceBytes instanceof Uint8Array) return new Uint8Array(sourceBytes);
  if (ArrayBuffer.isView(sourceBytes)) {
    return new Uint8Array(sourceBytes.buffer, sourceBytes.byteOffset, sourceBytes.byteLength).slice();
  }
  throw new Error("sourceBytes must be a Uint8Array or ArrayBuffer view");
}

/* Generate one filled 750A continuation page byte array for one saved review.
   Returns the report without persisting anything; the caller is the only writer. */
export async function generateFilledPdf({
  record, expectedProjectId, reviewId, issueIds = [], model, pdfjs,
  sourceBytes, workerSrc, expectedSha256 = null, sha256 = null
}) {
  const projection = projectedInputs(record, expectedProjectId, reviewId, issueIds, model);
  const plan = valuesForProjection(projection, model);
  const assessed = assessValues(plan.assignments.map(({ index, entry, value }) => ({ index, entry, value })));
  if (assessed.unsupported.length) {
    const err = new Error("The selected review contains unsupported characters.");
    err.unsupported = assessed.unsupported;
    throw err;
  }

  if (typeof expectedSha256 !== "string" || !/^[a-f0-9]{64}$/.test(expectedSha256)) {
    throw new Error("A pinned template SHA-256 is required before filling.");
  }

  {
    const sourceSnapshot = captureSourceBytes(sourceBytes);
    if (typeof sha256 !== "function") throw new Error("expectedSha256 was provided without a sha256 function");
    const actual = await sha256(sourceSnapshot);
    if (actual !== expectedSha256) {
      const err = new Error("template SHA-256 mismatch; refusing to fill a modified template");
      err.code = "template_sha_mismatch"; err.kind = err.code;
      err.expected = expectedSha256; err.actual = actual;
      throw err;
    }
    sourceBytes = sourceSnapshot;
  }

  const sourceDoc = await loadDocument(pdfjs, sourceBytes, workerSrc);
  let reparseDoc = null;
  try {
    if (!sourceDoc.isPureXfa) throw new Error("source did not parse as pure XFA");
    const sourceNumPages = sourceDoc.numPages;
    const sourceFields = collectFields(sourceDoc.allXfaHtml);
    const sourceBound = bindFields(sourceFields);
    if (sourceBound.errors.length) throw new Error("source XFA map mismatch: " + sourceBound.errors.join("; "));
    const sourceSignature = semanticSignatures(sourceFields);

    const assignments = [];
    for (const item of plan.assignments) {
      const binding = sourceBound.bindings[item.index];
      if (!binding) throw new Error("missing source binding for assigned field " + item.index);
      sourceDoc.annotationStorage.setValue(binding.dataId, { value: item.value });
      assignments.push({ index: item.index, dataId: binding.dataId, field: item.entry.field, occurrence: item.entry.occurrence ?? 0, tag: item.entry.tag, role: item.entry.role ?? item.entry.kind, value: item.value });
    }

    const saved = await sourceDoc.saveDocument();
    const outBytes = new Uint8Array(saved);

    reparseDoc = await loadDocument(pdfjs, new Uint8Array(outBytes), workerSrc);
    if (!reparseDoc.isPureXfa) throw new Error("filled output did not parse as pure XFA");
    if (reparseDoc.numPages !== sourceNumPages) {
      throw new Error("filled output page count changed from " + sourceNumPages + " to " + reparseDoc.numPages);
    }
    const reparsedFields = collectFields(reparseDoc.allXfaHtml);
    const reparsedBound = bindFields(reparsedFields);
    const reparseValues = reparsedBound.bindings.map(b => (b ? b.sourceValue : ""));
    const reparseSignature = semanticSignatures(reparsedFields);

    let valuesMatch = true;
    let preservedFieldsMatch = true;
    for (let i = 0; i < FIELD_LAYOUT.length; i++) {
      const expected = plan.values[i];
      if (plan.preservedIndices.indexOf(i) >= 0) {
        const sourceValue = sourceBound.bindings[i] ? sourceBound.bindings[i].sourceValue : "";
        if (reparseValues[i] !== sourceValue) preservedFieldsMatch = false;
      } else if (reparseValues[i] !== expected) {
        valuesMatch = false;
      }
    }
    const fieldIdentityMatch = sourceSignature.length === reparseSignature.length && sourceSignature.every((sig, i) => sig === reparseSignature[i]);

    if (reparsedBound.errors.length || !valuesMatch || !preservedFieldsMatch || !fieldIdentityMatch) {
      throw new Error("Filled PDF verification failed; refusing to return unverified output bytes.");
    }

    return {
      outputBytes: outBytes,
      projection,
      values: plan.values,
      assignments,
      preserved: plan.preservedIndices.map(i => ({
        index: i,
        field: FIELD_LAYOUT[i].field,
        occurrence: FIELD_LAYOUT[i].occurrence ?? 0,
        role: FIELD_LAYOUT[i].role ?? FIELD_LAYOUT[i].kind,
        dataId: sourceBound.bindings[i] ? sourceBound.bindings[i].dataId : null,
        sourceValue: sourceBound.bindings[i] ? sourceBound.bindings[i].sourceValue : "",
        reparseValue: reparseValues[i],
        status: "measured"
      })),
      preservation: {
        observable_fillable_count: sourceFields.length,
        assigned_count: plan.assignments.length,
        preserved_count: plan.preservedIndices.length,
        signature: {
          status: "NOT_VISIBLE",
          dataIds: [],
          note: "Signature widgets are not observable in this form's runtime allXfaHtml dataId set; no visual/render signature state is claimed."
        },
        page: {
          status: "NOT_VISIBLE",
          dataIds: [],
          note: "CurrentPage/PageCount are not observable in this form's runtime allXfaHtml dataId set."
        }
      },
      checks: {
        template_sha_verified: true,
        source_field_count: sourceFields.length === FIELD_LAYOUT.length,
        source_field_total: sourceFields.length,
        source_page_count: sourceNumPages,
        field_order_names_types_match: sourceBound.errors.length === 0,
        reparse_field_total: reparsedFields.length,
        reparse_field_count: reparsedFields.length === FIELD_LAYOUT.length,
        reparse_page_count: reparseDoc.numPages,
        output_is_pure_xfa: reparseDoc.isPureXfa === true,
        output_page_count_match: reparseDoc.numPages === sourceNumPages,
        reparse_field_order_names_types_match: reparsedBound.errors.length === 0,
        reparse_values_count: reparsedFields.length,
        reparse_values_match: valuesMatch,
        preserved_fields_count: plan.preservedIndices.length,
        preserved_fields_match: preservedFieldsMatch,
        field_identity_match: fieldIdentityMatch,
        unbound_source_fields: sourceBound.bindings.filter(b => !b).length,
        risks: assessed.risks,
        overflow_risks: assessed.risks.filter(r => r.risk === "overflow_estimate"),
        unicode_visual_risks: assessed.risks.filter(r => r.risk === "unicode_visual_glyph"),
        source_field_names: sourceFields.map(f => f.dataId),
        reparse_field_names: reparsedFields.map(f => f.dataId)
      }
    };
  } finally {
    if (reparseDoc) { try { await reparseDoc.destroy(); } catch {} }
    try { await sourceDoc.destroy(); } catch {}
    if (pdfjs.GlobalWorkerOptions) { pdfjs.GlobalWorkerOptions.workerPort = null; }
  }
}
