/* AFTO 750 + 750A complete review packet COORDINATOR (browser + Node, pure ESM).

   Generates an ordered set of INDEPENDENT original-XFA PDFs for one saved
   `ei-project-reviews/1` review: exactly one AFTO 750 main document, followed
   by zero or more AFTO 750A continuation documents each carrying at most five
   active issues. The PDFs are never flattened, concatenated, or merged; the
   coordinator returns one byte array per form plus a JSON inventory.

   The immutable planner captures a validated detached record snapshot and the
   complete deterministic allocation synchronously, before the first await.
   Both pinned template buffers are copied before the first await as well, so
   caller-side record/template mutation during asynchronous hashing or PDF
   generation cannot change the packet bytes.

   This module performs no filesystem, history, or store work. `complete: true`
   means every generated component passed its digest/map/geometry/reparse and
   assigned+preserved value gates; it is not a written-file receipt, an
   acceptance decision, or a compliance claim. */
function __afto750PacketImport(name) {
  if (typeof name !== "string" || !/^[A-Za-z0-9.-]+$/.test(name)) {
    throw new Error("unexpected AFTO 750 packet dependency name");
  }
  const base = new URL(import.meta.url);
  const url = new URL(name, base);
  url.search = base.search;
  return import(url.href);
}
const { planReviewPacket, MAIN_FORM, CONTINUATION_FORM } = await __afto750PacketImport("afto750-packet-plan.mjs");
const {
  generatePacketMain,
  FIELD_MAP_SHA256: MAIN_FIELD_MAP_SHA256
} = await __afto750PacketImport("afto750-export-adapter.mjs");
const {
  generateFilledPdf: generateContinuationPdf,
  FIELD_MAP_SHA256: CONTINUATION_FIELD_MAP_SHA256
} = await __afto750PacketImport("afto750a-export-adapter.mjs");

export const PACKET_SCHEMA = "ei-afto750-review-packet/1";

const VALID_SHA256 = /^[a-f0-9]{64}$/;
const MAIN_ROLE = "main";
const CONTINUATION_ROLE = "continuation";

function fail(message, code) {
  const err = new Error(message);
  if (code) { err.code = code; err.kind = code; }
  throw err;
}

function copyBytes(value, label) {
  if (value instanceof Uint8Array) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength).slice();
  }
  fail(label + " bytes must be a Uint8Array or ArrayBuffer view.", "invalid_template_bytes");
}

function captureTemplate(input, label) {
  if (!input || typeof input !== "object") fail(label + " template is missing.", "missing_template");
  if (typeof input.expectedSha256 !== "string" || !VALID_SHA256.test(input.expectedSha256)) {
    fail(label + " template must carry a pinned lowercase SHA-256.", "invalid_template_sha256");
  }
  return { bytes: copyBytes(input.bytes, label), expectedSha256: input.expectedSha256 };
}

async function digestHex(sha256, bytes, label) {
  if (typeof sha256 !== "function") fail("A sha256 function is required to verify packet bytes.", "sha256_missing");
  const result = await sha256(bytes);
  if (typeof result !== "string" || !VALID_SHA256.test(result)) {
    fail(label + " produced an invalid SHA-256 return value.", "invalid_sha256_return");
  }
  return result;
}

function assertTemplateDigest(actual, expected, label) {
  if (actual !== expected) {
    const err = new Error(label + " template SHA-256 mismatch; refusing to fill a modified template");
    err.code = "template_sha_mismatch"; err.kind = err.code;
    err.expected = expected; err.actual = actual;
    throw err;
  }
}

function assertIdsEqual(actual, expected, label) {
  if (!Array.isArray(actual) || !Array.isArray(expected) || actual.length !== expected.length) {
    fail(label + " has an unexpected ordered ID set.", "allocation_mismatch");
  }
  for (let i = 0; i < actual.length; i++) {
    if (actual[i] !== expected[i]) fail(label + " has an unexpected ordered ID set.", "allocation_mismatch");
  }
}

function assertIssueNumbersEqual(actual, expected, label) {
  if (!Array.isArray(actual) || !Array.isArray(expected) || actual.length !== expected.length) {
    fail(label + " has an unexpected stable-number set.", "allocation_mismatch");
  }
  for (let i = 0; i < actual.length; i++) {
    if (actual[i] !== expected[i]) fail(label + " has an unexpected stable-number set.", "allocation_mismatch");
  }
}

function assertAllocationMatches(plan, allocation) {
  if (!allocation || typeof allocation !== "object") fail("The main component did not return its allocation.", "allocation_missing");
  if (allocation.continuationSheetCount !== plan.continuationSheetCount ||
      allocation.documentCount !== plan.documentCount ||
      allocation.selectedIssueCount !== plan.selectedIssueCount ||
      allocation.remainingIssueCount !== plan.remainingIssueCount ||
      allocation.activeIssueCount !== plan.activeIssueCount) {
    fail("The main component allocation counts do not match the packet plan.", "allocation_mismatch");
  }
  assertIdsEqual(allocation.selectedIssueIds, plan.selectedIssueIds, "The main component selected allocation");
  assertIdsEqual(allocation.remainingIssueIds, plan.remainingIssueIds, "The main component remaining allocation");
  if (!Array.isArray(allocation.pages) || allocation.pages.length !== plan.pages.length) {
    fail("The main component page allocation does not match the packet plan.", "allocation_mismatch");
  }
  for (let i = 0; i < plan.pages.length; i++) {
    const planned = plan.pages[i];
    const returned = allocation.pages[i];
    if (!returned || returned.form !== planned.form || returned.role !== planned.role || returned.capacity !== planned.capacity) {
      fail("A returned allocation page does not match the packet plan.", "allocation_mismatch");
    }
    assertIdsEqual(returned.issueIds, planned.issueIds, "A returned allocation page");
    assertIssueNumbersEqual(returned.issues.map(issue => issue.number), planned.issues.map(issue => issue.number), "A returned allocation page");
    const plannedIndex = planned.continuationIndex ?? null;
    if ((returned.continuationIndex ?? null) !== plannedIndex) {
      fail("A returned continuation index does not match the packet plan.", "allocation_mismatch");
    }
  }
}

function assertProjectionSelection(report, page, label) {
  const projection = report && report.projection;
  const issues = projection && projection.review && Array.isArray(projection.review.issues) ? projection.review.issues : [];
  assertIdsEqual(issues.map(issue => issue.id), page.issueIds, label + " selected IDs");
  assertIssueNumbersEqual(issues.map(issue => issue.number), page.issues.map(issue => issue.number), label + " stable numbers");
}

function assertOutputBytes(report, label) {
  if (!(report.outputBytes instanceof Uint8Array) || report.outputBytes.length === 0) {
    fail(label + " did not return verified generated PDF bytes.", "missing_output_bytes");
  }
}

function assertComponentGates(report, form, label) {
  if (!report || typeof report !== "object") fail(label + " did not return a verification report.", "missing_component_report");
  assertOutputBytes(report, label);
  const checks = report.checks;
  if (!checks || typeof checks !== "object") fail(label + " did not return its checks.", "missing_component_checks");
  const requiredTrue = [
    "template_sha_verified",
    "source_field_count",
    "field_order_names_types_match",
    "reparse_field_count",
    "output_is_pure_xfa",
    "output_page_count_match",
    "reparse_field_order_names_types_match",
    "reparse_values_match",
    "preserved_fields_match"
  ];
  if (form === CONTINUATION_FORM) requiredTrue.push("field_identity_match");
  for (const key of requiredTrue) {
    if (checks[key] !== true) fail(label + " did not pass the " + key + " gate.", "component_gate_failed");
  }
  if (!Number.isFinite(checks.source_page_count) || !Number.isFinite(checks.reparse_page_count)) {
    fail(label + " did not report observable page counts.", "component_gate_failed");
  }
  if (!Number.isInteger(checks.reparse_values_count) || checks.reparse_values_count < 1) {
    fail(label + " did not report a positive reparse value count.", "component_gate_failed");
  }
}

function safeToken(value) {
  const cleaned = String(value).replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 80);
  return cleaned || "token";
}

function filenameFor(projectId, reviewId, form, ordinal) {
  const formToken = form === CONTINUATION_FORM ? "750a" : "750";
  const roleToken = form === CONTINUATION_FORM ? CONTINUATION_ROLE : MAIN_ROLE;
  return `ei-${formToken}-${safeToken(projectId)}-${safeToken(reviewId)}-${roleToken}-${String(ordinal).padStart(2, "0")}.pdf`;
}

function allocationView(plan) {
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

const CANONICAL_ISSUE_FIELDS = [
  "checklistRowId", "packageLocation", "problem", "recommendedAction",
  "toReference", "response", "initiatorName", "engineerName"
];

function canonicalIssue(id, issue) {
  const out = { id, number: issue.number };
  for (const key of CANONICAL_ISSUE_FIELDS) out[key] = issue[key];
  return out;
}

function canonicalInputs(plan, mainTemplate, continuationTemplate, mainProjection) {
  const snapshot = plan.recordSnapshot;
  const review = snapshot.reviews[plan.source.review.id];
  const orderedIds = plan.pages.flatMap(page => page.issueIds);
  return {
    schema: plan.source.schema,
    project: plan.source.project,
    review: {
      id: plan.source.review.id,
      label: plan.source.review.label,
      kind: plan.source.review.kind,
      source: plan.source.review.source,
      header: mainProjection.review.header,
      checklist: mainProjection.review.checklist,
      implementationImpact: review.implementationImpact,
      issues: orderedIds.map(id => canonicalIssue(id, review.issues[id]))
    },
    selection: {
      mainIssueIds: plan.selectedIssueIds.slice(),
      continuationGroups: plan.pages.slice(1).map(page => page.issueIds.slice())
    },
    templateIdentities: {
      main: { templateSha256: mainTemplate.expectedSha256, fieldMapSha256: MAIN_FIELD_MAP_SHA256 },
      continuation: { templateSha256: continuationTemplate.expectedSha256, fieldMapSha256: CONTINUATION_FIELD_MAP_SHA256 }
    }
  };
}

function documentView({ ordinal, page, report, digest, template, fieldMapSha256 }) {
  return {
    ordinal,
    form: page.form,
    role: page.role,
    continuationIndex: page.continuationIndex ?? null,
    filename: filenameFor(report.projection.project, report.projection.review.id, page.form, ordinal),
    selectedIssueIds: page.issueIds.slice(),
    selectedIssueNumbers: page.issues.map(issue => issue.number),
    sha256: digest,
    bytes: report.outputBytes,
    templateSha256: template.expectedSha256,
    fieldMapSha256,
    checks: report.checks,
    risks: report.checks && Array.isArray(report.checks.risks) ? report.checks.risks : [],
    preserved: report.preserved,
    assignments: report.assignments
  };
}

function inventoryView(documents, plan) {
  return {
    documentCount: plan.documentCount,
    continuationSheetCount: plan.continuationSheetCount,
    selectedIssueCount: plan.selectedIssueCount,
    remainingIssueCount: plan.remainingIssueCount,
    activeIssueCount: plan.activeIssueCount,
    files: documents.map(document => ({
      ordinal: document.ordinal,
      form: document.form,
      filename: document.filename,
      sha256: document.sha256,
      bytes: document.bytes.length,
      selectedIssueIds: document.selectedIssueIds.slice(),
      selectedIssueNumbers: document.selectedIssueNumbers.slice(),
      templateSha256: document.templateSha256,
      fieldMapSha256: document.fieldMapSha256,
      checks: document.checks,
      risks: document.risks
    }))
  };
}

/* Prepare the exact canonical packet.inputs object synchronously, without
   hashing the pinned templates or loading/running the PDF engine. This is the
   writer's currentness source: `generatePacket` must later produce the same
   `inputs` for the same validated record and selection. */
export function preparePacketInputs({
  record, expectedProjectId, reviewId, mainIssueIds = [], model,
  mainTemplate, continuationTemplate
}) {
  const plan = planReviewPacket(record, expectedProjectId, reviewId, mainIssueIds, model);
  const main = captureTemplate(mainTemplate, "main");
  const continuation = captureTemplate(continuationTemplate, "continuation");
  const mainProjection = model.exportInputs(record, expectedProjectId, reviewId, mainIssueIds);
  return canonicalInputs(plan, main, continuation, mainProjection);
}

/* Generate the complete packet. `mainTemplate` and `continuationTemplate` each
   carry `{ bytes, expectedSha256 }`. The caller's record, selection arrays, and
   both template buffers are never mutated. */
export async function generatePacket({
  record, expectedProjectId, reviewId, mainIssueIds = [], model, pdfjs,
  mainTemplate, continuationTemplate, workerSrc, sha256
}) {
  const plan = planReviewPacket(record, expectedProjectId, reviewId, mainIssueIds, model);
  const main = captureTemplate(mainTemplate, "main");
  const continuation = captureTemplate(continuationTemplate, "continuation");

  const mainTemplateDigest = await digestHex(sha256, main.bytes, "main template");
  const continuationTemplateDigest = await digestHex(sha256, continuation.bytes, "continuation template");
  assertTemplateDigest(mainTemplateDigest, main.expectedSha256, "main");
  assertTemplateDigest(continuationTemplateDigest, continuation.expectedSha256, "continuation");

  const mainReport = await generatePacketMain({
    record: plan.recordSnapshot,
    expectedProjectId,
    reviewId,
    mainIssueIds: plan.selectedIssueIds.slice(),
    model,
    pdfjs,
    sourceBytes: main.bytes,
    workerSrc,
    expectedSha256: main.expectedSha256,
    sha256
  });

  if (mainReport.scope !== "packet-main-component") {
    fail("The main component did not declare packet-main-component scope.", "scope_mismatch");
  }
  assertAllocationMatches(plan, mainReport.allocation);
  assertComponentGates(mainReport, MAIN_FORM, "main component");
  assertProjectionSelection(mainReport, plan.pages[0], "main component");

  const documents = [];
  const mainDigest = await digestHex(sha256, mainReport.outputBytes, "main PDF");
  documents.push(documentView({
    ordinal: 1,
    page: plan.pages[0],
    report: mainReport,
    digest: mainDigest,
    template: main,
    fieldMapSha256: MAIN_FIELD_MAP_SHA256
  }));

  for (let i = 1; i < plan.pages.length; i++) {
    const page = plan.pages[i];
    const continuationReport = await generateContinuationPdf({
      record: plan.recordSnapshot,
      expectedProjectId,
      reviewId,
      issueIds: page.issueIds.slice(),
      model,
      pdfjs,
      sourceBytes: continuation.bytes,
      workerSrc,
      expectedSha256: continuation.expectedSha256,
      sha256
    });
    assertComponentGates(continuationReport, CONTINUATION_FORM, "continuation component " + i);
    assertProjectionSelection(continuationReport, page, "continuation component " + i);
    const continuationDigest = await digestHex(sha256, continuationReport.outputBytes, "continuation PDF " + i);
    documents.push(documentView({
      ordinal: i + 1,
      page,
      report: continuationReport,
      digest: continuationDigest,
      template: continuation,
      fieldMapSha256: CONTINUATION_FIELD_MAP_SHA256
    }));
  }

  return {
    schema: PACKET_SCHEMA,
    complete: true,
    status: "verified_generated_bytes",
    scope: "complete_review_packet",
    completion: {
      generatedBytesVerified: true,
      filesystem: "not_written",
      history: "not_written",
      compliance: "not_claimed"
    },
    source: plan.source,
    allocation: allocationView(plan),
    documents,
    inventory: inventoryView(documents, plan),
    inputs: canonicalInputs(plan, main, continuation, mainReport.projection)
  };
}
