/* AFTO 750 MAIN-PAGE portable export adapter (browser + Node).

   Maps ONE saved `ei-project-reviews/1` review onto the main AFTO Form 750
   page (20200805 user-supplied original): 12 header fields, all 33 S/D/NA
   checklist rows, the YES/NO implementation-impact pair, and up to two
   explicitly selected issue blocks. The source PDF is never mutated; PDF.js
   5.6.205 `annotationStorage` writes into a NEW byte array.

   The PDF.js XFA dataIds are ephemeral and differ between parse sessions.
   No numeric dataId is hardcoded here. Instead `FIELD_LAYOUT` carries an
   independent semantic identity (page, field-name prefix, tag/type, and
   authored page geometry in millimetres) extracted from the supplied XFA
   template. `bindFields` matches each descriptor against `allXfaHtml` by that
   identity, not by runtime traversal order. Every assigned value is verified
   by reopening the saved bytes and matching the same geometry-bound fields.

   Signatures, CurrentPage/PageCount, and the ambiguous NumericField1 are never
   written. NumericField1 is captured before and after and must remain
   byte-for-byte the same value; the other preserved widgets are not asserted
   blank. Typed names are attribution text only, never signature marks. */
function __afto750PacketImport(name) {
  if (typeof name !== "string" || !/^[A-Za-z0-9.-]+$/.test(name)) {
    throw new Error("unexpected AFTO 750 packet dependency name");
  }
  const base = new URL(import.meta.url);
  const url = new URL(name, base);
  url.search = base.search;
  return import(url.href);
}
const { planReviewPacket } = await __afto750PacketImport("afto750-packet-plan.mjs");

export const EDITION = "AFTO Form 750, 20200805";
export const FIELD_MAP_SHA256 = "c88e85cabc0cf8fb830cfca3473ec6e500d85eb101d673c557f39455cec270e5";

const ANSWERS = ["", "S", "D", "NA"];
const IMPACTS = ["", "yes", "no"];
const MAX_ISSUES = 2;
const PAGE = 0;
const GEOMETRY_TOLERANCE_MM = 0.6;

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Reflect.ownKeys(value)) deepFreeze(value[key]);
  }
  return value;
}

/* The two columns and their three answer positions, in the order the XFA
   template emits them. x=0 is S (or YES for the impact pair), x=10.4 is D,
   x=20.54 is NA (or NO for the impact pair). Child order varies by row, so
   every row is listed in its proven template order rather than assuming
   S,D,NA. */
const PRE_TEXT_CHECKBOX_ROWS = [
  ["cover_contact_phones", ["NA", "D", "S"]],
  ["task_instructions_clear", ["NA", "D", "S"]],
  ["task_publication_references", ["S", "D", "NA"]],
  ["task_drawing_references", ["S", "D", "NA"]],
  ["task_implementation_feasibility", ["NA", "D", "S"]],
  ["test_data_sheets", ["S", "D", "NA"]],
  ["task_test_plan", ["NA", "D", "S"]],
  ["tab_b_attachments", ["S", "D", "NA"]],
  ["support_agreement", ["S", "D", "NA"]],
  ["psa_siting_installation", ["NA", "D", "S"]],
  ["psa_civil_engineering", ["NA", "D", "S"]],
  ["psa_communications", ["S", "D", "NA"]],
  ["psa_drawings", ["NA", "D", "S"]],
  ["psa_concurrence", ["S", "D", "NA"]],
  ["project_drawings", ["NA", "D", "S"]],
  ["psa_host_base_support", ["S", "D", "NA"]],
  ["drawings_correct", ["NA", "D", "S"]],
  ["drawing_specifications", ["NA", "D", "S"]],
  ["drawing_clarity", ["S", "D", "NA"]]
];

const POST_TEXT_CHECKBOX_ROWS = [
  ["package_cover", ["NA", "D", "S"]],
  ["special_instructions", ["NA", "D", "S"]],
  ["task_listing", ["NA", "D", "S"]],
  ["special_tools_test_equipment", ["S", "D", "NA"]],
  ["publications_list", ["S", "D", "NA"]],
  ["safety", ["NA", "D", "S"]],
  ["drawing_list", ["S", "D", "NA"]],
  ["other_activity_work", ["S", "D", "NA"]],
  ["systems_interface", ["NA", "D", "S"]],
  ["project_description", ["S", "D", "NA"]],
  ["installation_description", ["S", "D", "NA"]],
  ["materiel_section_two", ["NA", "D", "S"]],
  ["materiel_section_one", ["S", "D", "NA"]]
];

const COVER_SHEET_CHECKBOXES = ["S", "D", "NA"];

/* Authored per-control page geometry from the pinned 20200805 template.
   Every answer position is retained at its authored precision rather than a
   synthesized S/D/NA grid (for example systems_interface NA is 97.067mm and
   publications_list NA is 97.229mm, not a uniform 97.254mm). */
const ROW_GEOMETRY = deepFreeze({
  cover_contact_phones: { yMm: 72.700, xMm: { S: 76.715, D: 87.115, NA: 97.254 } },
  task_instructions_clear: { yMm: 62.040, xMm: { S: 173.697, D: 184.097, NA: 194.239 } },
  task_publication_references: { yMm: 67.381, xMm: { S: 173.697, D: 184.097, NA: 194.239 } },
  task_drawing_references: { yMm: 72.838, xMm: { S: 173.697, D: 184.097, NA: 194.236 } },
  task_implementation_feasibility: { yMm: 77.918, xMm: { S: 173.697, D: 184.097, NA: 194.236 } },
  test_data_sheets: { yMm: 93.659, xMm: { S: 173.697, D: 184.097, NA: 194.236 } },
  task_test_plan: { yMm: 83.118, xMm: { S: 173.697, D: 184.097, NA: 194.236 } },
  tab_b_attachments: { yMm: 88.720, xMm: { S: 173.697, D: 184.097, NA: 194.236 } },
  support_agreement: { yMm: 98.859, xMm: { S: 173.697, D: 184.097, NA: 194.236 } },
  psa_siting_installation: { yMm: 104.200, xMm: { S: 173.697, D: 184.097, NA: 194.236 } },
  psa_civil_engineering: { yMm: 109.657, xMm: { S: 173.697, D: 184.097, NA: 194.236 } },
  psa_communications: { yMm: 114.998, xMm: { S: 173.697, D: 184.097, NA: 194.236 } },
  psa_drawings: { yMm: 120.579, xMm: { S: 173.697, D: 184.097, NA: 194.236 } },
  psa_concurrence: { yMm: 131.639, xMm: { S: 173.697, D: 184.097, NA: 194.236 } },
  project_drawings: { yMm: 137.238, xMm: { S: 173.697, D: 184.097, NA: 194.236 } },
  psa_host_base_support: { yMm: 125.920, xMm: { S: 173.697, D: 184.097, NA: 194.236 } },
  drawings_correct: { yMm: 142.699, xMm: { S: 173.697, D: 184.097, NA: 194.236 } },
  drawing_specifications: { yMm: 148.678, xMm: { S: 173.697, D: 184.097, NA: 194.236 } },
  drawing_clarity: { yMm: 154.019, xMm: { S: 173.697, D: 184.097, NA: 194.236 } },
  package_cover: { yMm: 98.979, xMm: { S: 76.715, D: 87.115, NA: 97.254 } },
  special_instructions: { yMm: 126.040, xMm: { S: 76.715, D: 87.115, NA: 97.254 } },
  task_listing: { yMm: 153.878, xMm: { S: 76.715, D: 87.115, NA: 97.254 } },
  special_tools_test_equipment: { yMm: 148.541, xMm: { S: 76.715, D: 87.115, NA: 97.254 } },
  publications_list: { yMm: 142.558, xMm: { S: 76.715, D: 87.115, NA: 97.229 } },
  safety: { yMm: 131.498, xMm: { S: 76.715, D: 87.115, NA: 97.254 } },
  drawing_list: { yMm: 137.100, xMm: { S: 76.715, D: 87.115, NA: 97.254 } },
  other_activity_work: { yMm: 120.699, xMm: { S: 76.715, D: 87.115, NA: 97.254 } },
  systems_interface: { yMm: 115.118, xMm: { S: 76.715, D: 87.115, NA: 97.067 } },
  project_description: { yMm: 109.777, xMm: { S: 76.715, D: 87.115, NA: 97.254 } },
  installation_description: { yMm: 104.320, xMm: { S: 76.715, D: 87.115, NA: 97.254 } },
  materiel_section_two: { yMm: 88.579, xMm: { S: 76.715, D: 87.115, NA: 97.254 } },
  materiel_section_one: { yMm: 83.238, xMm: { S: 76.715, D: 87.115, NA: 97.254 } },
  cover_sheet_749: { yMm: 61.898, xMm: { S: 76.715, D: 87.115, NA: 97.257 } }
});

const IMPACT_GEOMETRY = deepFreeze({
  yes: { xMm: 109.470, yMm: 159.029 },
  no: { xMm: 132.091, yMm: 159.029 }
});

function checkbox(rowId, answer) {
  const geometry = ROW_GEOMETRY[rowId];
  if (!geometry || !geometry.xMm[answer]) throw new Error("Missing authored geometry for " + rowId + "/" + answer);
  return { field: "CheckBox1", occurrence: 0, tag: "input", type: "checkbox", kind: "checklist", rowId, answer, page: PAGE, xMm: geometry.xMm[answer], yMm: geometry.yMm };
}
function impact(answer) {
  const geometry = IMPACT_GEOMETRY[answer];
  if (!geometry) throw new Error("Missing authored geometry for impact/" + answer);
  return { field: "CheckBox1", occurrence: 0, tag: "input", type: "checkbox", kind: "impact", answer, page: PAGE, xMm: geometry.xMm, yMm: geometry.yMm };
}
function headerEntry(field, occurrence, tag, fieldKey, role, xMm, yMm, wMm, hMm) {
  return { field, occurrence, tag, type: tag === "input" ? "text" : null, kind: "header", fieldKey, role, page: PAGE, xMm, yMm, wMm, hMm, fontPt: 9 };
}
function issueEntry(field, occurrence, tag, kind, block, role, xMm, yMm, wMm, hMm) {
  return { field, occurrence, tag, type: tag === "input" ? "text" : null, kind, block, role, page: PAGE, xMm, yMm, wMm, hMm, fontPt: 9 };
}

const PRE_TEXT_CHECKBOXES = [];
for (const [rowId, answers] of PRE_TEXT_CHECKBOX_ROWS) {
  for (const answer of answers) PRE_TEXT_CHECKBOXES.push(checkbox(rowId, answer));
}
PRE_TEXT_CHECKBOXES.push(impact("yes"), impact("no"));
for (const [rowId, answers] of POST_TEXT_CHECKBOX_ROWS) {
  for (const answer of answers) PRE_TEXT_CHECKBOXES.push(checkbox(rowId, answer));
}

const HEADER_FIELDS = [
  headerEntry("Text1", 0, "input", "requirementNumber", "CIPS REQUIREMENT NUMBER", 13.540, 21.047, 62.08, 6.28),
  headerEntry("Text2", 0, "input", "dateInitiated", "DATE INITIATED", 100.940, 17.166, 21.604, 4.249),
  headerEntry("Text4", 0, "input", "teamChiefReviewCompleteDate", "TEAM CHIEF REVIEW COMPLETE DATE", 175.532, 17.159, 26.935, 4.249),
  headerEntry("Text3", 0, "input", "projectStartDate", "PROJECT START DATE", 109.837, 22.154, 12.85, 5.172),
  headerEntry("Text5", 0, "input", "engineerResponseCompleteDate", "ENGINEER RESPONSE COMPLETE DATE", 177.888, 22.599, 24.441, 4.618),
  headerEntry("Text5", 1, "input", "teamChiefSuspenseDate", "TEAM CHIEF SUSPENSE DATE", 175.623, 28.459, 26.705, 4.618),
  headerEntry("Text13", 0, "textarea", "title", "PROJECT TITLE", 13.653, 31.725, 61.87, 7.85),
  headerEntry("Text14", 0, "textarea", "location", "PROJECT LOCATION", 76.828, 32.120, 45.655, 7.583),
  headerEntry("Text16", 0, "input", "engineerSuspenseDate", "ENGINEER SUSPENSE DATE", 164.645, 34.512, 37.633, 4.922),
  headerEntry("Text6", 0, "textarea", "reviewingWorkCenter", "REVIEWING WORK CENTER", 13.875, 43.907, 62.08, 7.02),
  headerEntry("Text7", 0, "textarea", "engineeringActivity", "ENGINEERING ACTIVITY", 76.867, 43.737, 45.91, 7.02),
  headerEntry("Text12", 0, "textarea", "courtesyCopy", "COURTESY COPY", 124.777, 43.875, 77.23, 7.021)
];

const ISSUE_TEXT_FIELDS = [
  issueEntry("Text8", 0, "textarea", "issue_narrative", 0, "narrative", 13.547, 169.915, 188.93, 15.45),
  issueEntry("Text9", 0, "textarea", "issue_text", 0, "response", 13.624, 189.576, 188.71, 15.20),
  issueEntry("Text10", 0, "input", "issue_text", 0, "initiatorName", 14.224, 208.672, 37.24, 4.57),
  issueEntry("Text11", 0, "input", "issue_text", 0, "engineerName", 108.712, 208.672, 41.07, 4.54),
  issueEntry("Text35", 0, "textarea", "issue_narrative", 1, "narrative", 14.072, 218.560, 188.26, 15.85),
  issueEntry("Text36", 0, "textarea", "issue_text", 1, "response", 14.651, 238.876, 187.59, 15.63),
  issueEntry("Text37", 0, "input", "issue_text", 1, "initiatorName", 14.072, 258.632, 37.96, 4.544),
  issueEntry("Text39", 0, "input", "issue_text", 1, "engineerName", 108.962, 258.632, 40.42, 4.544)
];

const POST_TEXT_CHECKBOXES = COVER_SHEET_CHECKBOXES.map(a => checkbox("cover_sheet_749", a));

const TAIL_FIELDS = [
  issueEntry("TextField1", 0, "input", "issue_number", 0, "number", 28.910, 165.485, 9.061, 4.287),
  issueEntry("TextField2", 0, "input", "issue_number", 1, "number", 29.400, 214.189, 9.061, 4.287),
  { field: "NumericField1", occurrence: 0, tag: "input", type: "text", kind: "preserve", role: "AMBIGUOUS NUMERIC FIELD", page: PAGE, xMm: 193.788, yMm: 5.144, wMm: 9.061, hMm: 4.287, fontPt: 9 }
];

export const FIELD_LAYOUT = deepFreeze([
  ...PRE_TEXT_CHECKBOXES,
  ...HEADER_FIELDS,
  ...ISSUE_TEXT_FIELDS,
  ...POST_TEXT_CHECKBOXES,
  ...TAIL_FIELDS
]);

const FIELD_NAMES = Object.freeze([...new Set(FIELD_LAYOUT.map(e => e.field))].sort((a, b) => b.length - a.length));

/* A PDF.js XFA dataId is the XFA field name followed by numeric instance data
   (for example Text1 -> Text15182, TextField1 -> TextField116030). Some field
   names are numeric prefixes of each other (Text3/Text35), so a bare prefix
   match is ambiguous. The geometry match, not traversal order, resolves that
   ambiguity without hardcoding any numeric instance. */
export function dataIdIsField(dataId, field) {
  if (typeof dataId !== "string" || typeof field !== "string") return false;
  if (!dataId.startsWith(field)) return false;
  const suffix = dataId.slice(field.length);
  return /^[0-9]+$/.test(suffix);
}

export function dataIdIsSlot(dataId, field) {
  return dataIdIsField(dataId, field);
}

/* Ambiguity-aware lookup for diagnostics only. Returns a name when exactly one
   layout field name matches; returns null when the suffix could belong to two
   field names (for example Text3/Text35). Geometry-bound matching resolves the
   ambiguity during binding. */
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
    if (entry.rowId !== undefined) out.rowId = entry.rowId;
    if (entry.answer !== undefined) out.answer = entry.answer;
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

function semanticLabel(entry) {
  const parts = [entry.field + "[" + (entry.occurrence ?? 0) + "]"];
  if (entry.rowId !== undefined) parts.push(entry.rowId);
  if (entry.answer !== undefined) parts.push(entry.answer);
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

/* The narrative area is one field but the record stores five separate text
   fields. The approved composite order is explicit and blank components are
   omitted. The checklist line is only for team-chief package reviews; no
   reverse checklist number is invented. */
export function issueNarrative(issue, kind, model) {
  const parts = [];
  if (kind === "team_chief_package_review" && issue && typeof issue.checklistRowId === "string" && issue.checklistRowId) {
    const row = model.catalogRow(issue.checklistRowId);
    if (row) parts.push("Checklist Reference: " + row.printedLabel);
  }
  if (issue && typeof issue.packageLocation === "string" && issue.packageLocation) parts.push("Where deficiency is located: " + issue.packageLocation);
  if (issue && typeof issue.problem === "string" && issue.problem) parts.push("What specifically is the deficiency: " + issue.problem);
  if (issue && typeof issue.recommendedAction === "string" && issue.recommendedAction) parts.push("Recommended corrective action: " + issue.recommendedAction);
  if (issue && typeof issue.toReference === "string" && issue.toReference) parts.push("Reference: " + issue.toReference);
  return parts.join("\n");
}

function validAnswer(value) {
  return typeof value === "string" && ANSWERS.indexOf(value) >= 0;
}
function validImpact(value) {
  return typeof value === "string" && IMPACTS.indexOf(value) >= 0;
}

function checkProjectionShape(projection, model) {
  if (!projection || typeof projection !== "object") throw new Error("The review projection is not readable.");
  const review = projection.review;
  if (!review || typeof review !== "object") throw new Error("The review projection is missing its review.");
  if (!Array.isArray(projection.remainingIssueIds)) throw new Error("The review projection is missing remainingIssueIds.");
  if (typeof review.label !== "string") throw new Error("The review projection is missing its label.");
  if (typeof review.kind !== "string") throw new Error("The review projection is missing its kind.");
  if (!review.source || typeof review.source.edition !== "string" || typeof review.source.sourceSha256 !== "string") {
    throw new Error("The review projection is missing its source provenance.");
  }
  if (typeof review.header !== "object" || review.header === null) throw new Error("The review header is not readable.");
  if (typeof review.checklist !== "object" || review.checklist === null) throw new Error("The review checklist is not readable.");
  if (!validImpact(review.implementationImpact)) throw new Error("The review implementation impact is unsupported.");
  if (!Array.isArray(review.issues) || review.issues.length > MAX_ISSUES) throw new Error("The review projection has too many selected issues.");
  const catalog = model.catalog();
  for (const row of catalog) {
    if (!Object.prototype.hasOwnProperty.call(review.checklist, row.id) || !validAnswer(review.checklist[row.id])) {
      throw new Error("A checklist answer is unreadable or unsupported: " + row.id);
    }
  }
  for (const issue of review.issues) {
    if (!issue || typeof issue !== "object" || typeof issue.number !== "string" || !/^[0-9]{3}$/.test(issue.number)) {
      throw new Error("A selected issue has an unreadable number.");
    }
    for (const key of ["checklistRowId", "packageLocation", "problem", "recommendedAction", "toReference", "response", "initiatorName", "engineerName"]) {
      if (typeof issue[key] !== "string") throw new Error("A selected issue has unreadable text: " + key);
    }
  }
  return projection;
}

function checkProjection(projection, model) {
  checkProjectionShape(projection, model);
  if (projection.remainingIssueIds.length) {
    const err = new Error("This review has issues beyond the two main-page blocks; continuation pages are not implemented yet.");
    err.code = "remaining_issues_present"; err.kind = err.code;
    err.remainingIssueIds = projection.remainingIssueIds.slice();
    throw err;
  }
  return projection;
}

/* Prepare the canonical projection and defensive value plan. The model is the
   authority for source/selection validation; this adapter only adds fail-closed
   checks and never mutates the supplied record or issueIds array. */
export function projectedInputs(record, expectedProjectId, reviewId, issueIds, model) {
  const projection = model.exportInputs(record, expectedProjectId, reviewId, issueIds);
  return checkProjection(projection, model);
}

export function valuesForProjection(projection, model) {
  const review = projection.review;
  const values = new Array(FIELD_LAYOUT.length).fill("");
  const assignments = [];
  const preservedIndices = [];
  for (let i = 0; i < FIELD_LAYOUT.length; i++) {
    const entry = FIELD_LAYOUT[i];
    let value;
    if (entry.kind === "checklist") {
      const answer = review.checklist[entry.rowId];
      if (!validAnswer(answer)) throw new Error("A checklist answer is unsupported: " + entry.rowId);
      value = answer === entry.answer ? "1" : "0";
    } else if (entry.kind === "impact") {
      if (!validImpact(review.implementationImpact)) throw new Error("The implementation impact is unsupported.");
      value = review.implementationImpact === entry.answer ? "1" : "0";
    } else if (entry.kind === "header") {
      const headerValue = review.header[entry.fieldKey];
      if (typeof headerValue !== "string") throw new Error("A header value is unreadable: " + entry.fieldKey);
      value = headerValue;
    } else if (entry.kind === "issue_narrative") {
      const issue = review.issues[entry.block] || null;
      value = issueNarrative(issue, review.kind, model);
    } else if (entry.kind === "issue_text") {
      const issue = review.issues[entry.block] || null;
      const text = issue ? issue[entry.role] : "";
      if (typeof text !== "string") throw new Error("An issue text value is unreadable: " + entry.role);
      value = text;
    } else if (entry.kind === "issue_number") {
      const issue = review.issues[entry.block] || null;
      value = issue ? issue.number : "";
    } else if (entry.kind === "preserve") {
      values[i] = null;
      preservedIndices.push(i);
      continue;
    } else {
      throw new Error("Unsupported layout kind: " + entry.kind);
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
    if (entry.kind === "checklist" || entry.kind === "impact" || entry.kind === "preserve") continue;
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

/* Prepare the defensive value plan for a canonical projection and refuse any
   unsupported characters before PDF engine work begins. */
function preparedValues(projection, model) {
  const plan = valuesForProjection(projection, model);
  const assessed = assessValues(plan.assignments.map(({ index, entry, value }) => ({ index, entry, value })));
  if (assessed.unsupported.length) {
    const err = new Error("The selected review contains unsupported characters.");
    err.unsupported = assessed.unsupported;
    throw err;
  }
  return { plan, assessed };
}

/* Copy the planner allocation into a caller-safe, JSON-friendly shape. The
   immutable plan remains the authority; this copy is only evidence for a
   coordinator that must compare component output against its own plan. */
function packetAllocation(plan) {
  return {
    selectedIssueIds: plan.selectedIssueIds.slice(),
    remainingIssueIds: plan.remainingIssueIds.slice(),
    continuationSheetCount: plan.continuationSheetCount,
    documentCount: plan.documentCount,
    selectedIssueCount: plan.selectedIssueCount,
    remainingIssueCount: plan.remainingIssueCount,
    activeIssueCount: plan.activeIssueCount,
    pages: plan.pages.map(page => ({
      form: page.form,
      role: page.role,
      issueIds: page.issueIds.slice(),
      issues: page.issues.map(issue => ({ id: issue.id, number: issue.number })),
      continuationIndex: page.continuationIndex ?? null,
      capacity: page.capacity
    }))
  };
}

/* Canonical projection checks shared by ordinary main export and packet-main
   export. It intentionally does not reject remaining active issues; that
   ordinary-main-only gate lives in `checkProjection`. */
function checkPacketMainProjection(projection, model) {
  checkProjectionShape(projection, model);
  if (projection.review.issues.length !== 0 && projection.review.issues.length > MAX_ISSUES) {
    throw new Error("The packet-main projection has too many selected issues.");
  }
  return projection;
}

/* Shared verified renderer. Both ordinary-main and packet-main callers must
   already have produced a canonical projection and defensive value plan; this
   routine performs only template capture/hash verification and the PDF.js
   source-map/reparse verification pass. */
async function renderVerifiedPdf({
  projection, plan, assessed, pdfjs, sourceBytes, workerSrc, expectedSha256, sha256
}) {
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

    const outputDataIds = allDataIds(reparseDoc.allXfaHtml);
    const signatureDataIds = outputDataIds.filter(id => /^Signature/.test(id));
    const pageDataIds = outputDataIds.filter(id => /^(CurrentPage|PageCount)/.test(id));

    if (reparsedBound.errors.length || !valuesMatch || !preservedFieldsMatch) {
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
        dataId: sourceBound.bindings[i] ? sourceBound.bindings[i].dataId : null,
        sourceValue: sourceBound.bindings[i] ? sourceBound.bindings[i].sourceValue : "",
        reparseValue: reparseValues[i],
        status: "measured"
      })),
      preservation: {
        observable_non_target_count: plan.preservedIndices.length,
        signature: {
          status: "NOT_VERIFIED",
          dataIds: signatureDataIds,
          note: "Signature widgets are not part of the 124-fillable XFA field set asserted here; no visual/render signature state is claimed."
        },
        page: {
          status: "NOT_VERIFIED",
          dataIds: pageDataIds,
          note: "CurrentPage/PageCount are not part of the 124-fillable XFA field set asserted here."
        }
      },
      checks: {
        template_sha_verified: Boolean(expectedSha256),
        source_field_count: sourceFields.length === FIELD_LAYOUT.length,
        source_page_count: sourceDoc.numPages,
        field_order_names_types_match: sourceBound.errors.length === 0,
        reparse_field_count: reparsedFields.length === FIELD_LAYOUT.length,
        reparse_page_count: reparseDoc.numPages,
        output_is_pure_xfa: reparseDoc.isPureXfa === true,
        output_page_count_match: reparseDoc.numPages === sourceDoc.numPages,
        reparse_field_order_names_types_match: reparsedBound.errors.length === 0,
        reparse_values_count: reparsedFields.length,
        reparse_values_match: valuesMatch,
        preserved_fields_count: plan.preservedIndices.length,
        preserved_fields_match: preservedFieldsMatch,
        signature_data_ids: signatureDataIds,
        page_data_ids: pageDataIds,
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

/* Generate a filled PDF byte array for one saved review. Returns the report
   without persisting anything; the caller is the only writer. */
export async function generateFilledPdf({
  record, expectedProjectId, reviewId, issueIds = [], model, pdfjs,
  sourceBytes, workerSrc, expectedSha256 = null, sha256 = null
}) {
  const projection = projectedInputs(record, expectedProjectId, reviewId, issueIds, model);
  const { plan, assessed } = preparedValues(projection, model);
  return await renderVerifiedPdf({
    projection, plan, assessed, pdfjs, sourceBytes, workerSrc, expectedSha256, sha256
  });
}

/* Generate ONLY the AFTO 750 main component of a complete packet. Unlike the
   ordinary single-document API, this entry point accepts the ORIGINAL full
   record (which may have more than two active issues) plus the explicit 0..2
   main selection and recomputes the complete planner allocation itself.

   The returned report is deliberately scoped to this one generated component;
   it never claims the continuation documents or a complete packet exist. */
export async function generatePacketMain({
  record, expectedProjectId, reviewId, mainIssueIds = [], model, pdfjs,
  sourceBytes, workerSrc, expectedSha256 = null, sha256 = null
}) {
  const plan = planReviewPacket(record, expectedProjectId, reviewId, mainIssueIds, model);
  const mainPage = plan.pages[0];
  const projection = model.exportInputs(plan.recordSnapshot, expectedProjectId, reviewId, mainPage.issueIds.slice());
  checkPacketMainProjection(projection, model);
  const { plan: valuePlan, assessed } = preparedValues(projection, model);
  const report = await renderVerifiedPdf({
    projection, plan: valuePlan, assessed, pdfjs, sourceBytes, workerSrc, expectedSha256, sha256
  });
  return {
    ...report,
    scope: "packet-main-component",
    allocation: packetAllocation(plan)
  };
}
