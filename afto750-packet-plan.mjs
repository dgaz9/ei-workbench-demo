/* AFTO 750 complete review packet PLANNER (browser + Node, pure ESM).

   Builds the deterministic document allocation for one saved
   `ei-project-reviews/1` review: exactly one AFTO 750 main document, followed
   by zero or more AFTO 750A continuation documents each carrying up to five
   active issues. The planner is intentionally a PLANNING artifact only.

   It never opens a PDF, writes a file, hashes bytes, renders a page, verifies
   a visual signature/acceptance/compliance state, or claims a PDF page count.
   Callers receive a deeply frozen plan with one detached full-record snapshot
   so a later renderer cannot mix revisions or silently drop unknown saved
   fields. There is no clock and no randomness; identical semantic inputs
   produce the identical allocation.

   Source/selection authority is the supplied project-review model. Selection
   arrays are inspected through property descriptors BEFORE any value is read,
   so a hostile indexed getter is never invoked. The record is also descriptor
   preflighted before `model.validate`, then model.exportInputs supplies the
   canonical main projection and the stable number-then-ID remaining order. */

export const PLAN_SCHEMA = "ei-afto750-packet-plan/1";
export const MAIN_FORM = "AFTO750";
export const CONTINUATION_FORM = "AFTO750A";
export const MAIN_ISSUE_CAPACITY = 2;
export const CONTINUATION_ISSUE_CAPACITY = 5;

const VALID_ISSUE_ID = /^ri_[0-9a-f]{32}$/;
const VALID_REVIEW_ID = /^rv_[0-9a-f]{32}$/;
const VALID_ISSUE_NUMBER = /^\d{3}$/;

function fail(message, code) {
  const err = new Error(message);
  if (code) { err.code = code; err.kind = code; }
  throw err;
}

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function canonicalIndex(key) {
  return /^(0|[1-9][0-9]*)$/.test(key);
}

function isPlainArray(value) {
  return Array.isArray(value) && Object.getPrototypeOf(value) === Array.prototype;
}

function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  if (proto === null) return true;
  if (Object.getPrototypeOf(proto) !== null) return false;
  const descriptor = Object.getOwnPropertyDescriptor(proto, "constructor");
  if (!descriptor || !hasOwn(descriptor, "value") || typeof descriptor.value !== "function") return false;
  const ctor = descriptor.value;
  const prototypeDescriptor = Object.getOwnPropertyDescriptor(ctor, "prototype");
  return !!prototypeDescriptor && hasOwn(prototypeDescriptor, "value") &&
    prototypeDescriptor.value === proto &&
    Function.prototype.toString.call(ctor) === Function.prototype.toString.call(Object);
}

/* Descriptor-only dense-array check. Reads no indexed value until the caller
   separately validates each ID, so accessors and holes fail without a getter
   invocation. */
function assertPlainArray(value, label, maxLength) {
  if (!Array.isArray(value)) fail(label + " must be a list.", "invalid_selection");
  if (!isPlainArray(value)) fail(label + " must be a plain array.", "invalid_selection");
  if (typeof maxLength === "number" && value.length > maxLength) {
    fail(label + " has too many entries.", "too_many_issues");
  }
  const symbols = Object.getOwnPropertySymbols(value);
  if (symbols.length) fail(label + " cannot contain symbol-keyed properties.", "invalid_selection");
  const names = Object.getOwnPropertyNames(value);
  for (const key of names) {
    if (key === "length") continue;
    if (!canonicalIndex(key) || Number(key) >= value.length) {
      fail(label + " cannot contain missing or named entries.", "invalid_selection");
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !descriptor.enumerable) fail(label + " cannot contain hidden entries.", "invalid_selection");
    if (hasOwn(descriptor, "get") || hasOwn(descriptor, "set")) {
      fail(label + " cannot contain accessor properties.", "invalid_selection");
    }
  }
  for (let i = 0; i < value.length; i++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(i));
    if (!descriptor || !descriptor.enumerable) fail(label + " cannot contain missing, named or hidden entries.", "invalid_selection");
    if (hasOwn(descriptor, "get") || hasOwn(descriptor, "set")) {
      fail(label + " cannot contain accessor properties.", "invalid_selection");
    }
  }
}

function assertSafeValue(value, parents) {
  const type = typeof value;
  if (value === null || type === "string" || type === "boolean") return;
  if (type === "number") {
    if (!Number.isFinite(value)) fail("The saved record must contain finite numbers.", "unsafe_record");
    return;
  }
  if (type !== "object") fail("The saved record must contain readable JSON values.", "unsafe_record");
  if (parents.indexOf(value) >= 0) fail("The saved record contains a circular value.", "unsafe_record");
  if (Object.getOwnPropertySymbols(value).length) fail("The saved record cannot contain symbol-keyed properties.", "unsafe_record");

  if (Array.isArray(value)) {
    assertPlainArray(value, "Saved record array", undefined);
    parents.push(value);
    for (let i = 0; i < value.length; i++) assertSafeValue(value[i], parents);
    parents.pop();
    return;
  }

  if (!isPlainObject(value)) fail("The saved record must contain plain records.", "unsafe_record");
  const names = Object.getOwnPropertyNames(value);
  if (names.length !== Object.keys(value).length) fail("The saved record cannot contain non-enumerable properties.", "unsafe_record");
  parents.push(value);
  for (const key of names) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      fail("The saved record contains an unsupported property name.", "unsafe_record");
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || hasOwn(descriptor, "get") || hasOwn(descriptor, "set")) {
      fail("The saved record cannot contain accessor properties.", "unsafe_record");
    }
    assertSafeValue(descriptor.value, parents);
  }
  parents.pop();
}

function clonePlain(value) {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    const out = new Array(value.length);
    for (let i = 0; i < value.length; i++) out[i] = clonePlain(value[i]);
    return out;
  }
  const out = {};
  for (const key of Object.keys(value)) out[key] = clonePlain(value[key]);
  return out;
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Reflect.ownKeys(value)) deepFreeze(value[key]);
  }
  return value;
}

function assertModel(model) {
  if (!model || typeof model.validate !== "function" || typeof model.exportInputs !== "function") {
    fail("A project-review model is required.", "model_missing");
  }
}

function validateMainIds(mainIssueIds) {
  assertPlainArray(mainIssueIds, "Main issue IDs", MAIN_ISSUE_CAPACITY);
  const out = [];
  const seen = new Set();
  for (let i = 0; i < mainIssueIds.length; i++) {
    const id = mainIssueIds[i];
    if (typeof id !== "string" || !VALID_ISSUE_ID.test(id)) fail("A selected issue ID is invalid.", "invalid_issue_id");
    if (seen.has(id)) fail("The same issue cannot be selected twice.", "duplicate_issue_id");
    seen.add(id);
    out.push(id);
  }
  return out;
}

function validateIdList(ids, label, allowEmpty) {
  assertPlainArray(ids, label, undefined);
  const out = [];
  const seen = new Set();
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    if (typeof id !== "string" || !VALID_ISSUE_ID.test(id)) fail(label + " contains an invalid issue ID.", "invalid_remaining_issue_id");
    if (seen.has(id)) fail(label + " contains the same issue twice.", "duplicate_remaining_issue_id");
    seen.add(id);
    out.push(id);
  }
  if (!allowEmpty && !out.length) fail(label + " must not be empty.", "invalid_remaining_issue_id");
  return out;
}

function issueIdentity(issue) {
  if (!issue || typeof issue !== "object") fail("A canonical issue projection is unreadable.", "projection_invalid");
  if (typeof issue.id !== "string" || !VALID_ISSUE_ID.test(issue.id)) fail("A canonical issue projection has an invalid permanent ID.", "projection_invalid");
  if (typeof issue.number !== "string" || !VALID_ISSUE_NUMBER.test(issue.number)) fail("A canonical issue projection has an invalid stable number.", "projection_invalid");
  return { id: issue.id, number: issue.number };
}

function assertProjection(projection, record, expectedProjectId, reviewId) {
  if (!projection || typeof projection !== "object") fail("The review projection is not readable.", "projection_invalid");
  if (typeof projection.schema !== "string" || projection.schema !== record.schema) fail("The review projection schema does not match the saved record.", "projection_invalid");
  if (typeof projection.project !== "string" || projection.project !== record.project || projection.project !== expectedProjectId) {
    fail("This plan names a different project.", "different_project");
  }
  if (!projection.review || typeof projection.review !== "object") fail("The review projection is missing its review.", "projection_invalid");
  if (projection.review.id !== reviewId) fail("The review projection names a different review.", "projection_invalid");
  if (!Array.isArray(projection.review.issues)) fail("The review projection is missing its issues.", "projection_invalid");
  if (!Array.isArray(projection.remainingIssueIds)) fail("The review projection is missing remainingIssueIds.", "projection_invalid");
}

function selectedIssueById(projection) {
  const byId = new Map();
  for (const issue of projection.review.issues) {
    const identity = issueIdentity(issue);
    byId.set(identity.id, identity);
  }
  return byId;
}

function remainingIssueNumber(review, id) {
  const issue = review.issues[id];
  if (!issue || issue === null || issue.retired) fail("A remaining issue is no longer active in this review.", "remaining_issue_missing");
  if (typeof issue.number !== "string" || !VALID_ISSUE_NUMBER.test(issue.number)) {
    fail("A remaining issue has an invalid stable number.", "remaining_issue_missing");
  }
  return { id, number: issue.number };
}

/* Plan one complete review packet. `mainIssueIds` is the explicitly ordered
   0..2 issue selection for the single main document; all remaining active
   issues are allocated to continuation documents in canonical order. The returned plan is deeply frozen and owns no caller
   reference except for the supplied model, which is used only as an
   authority and is never captured. */
export function planReviewPacket(record, expectedProjectId, reviewId, mainIssueIds, model) {
  assertModel(model);
  const selectedIds = validateMainIds(mainIssueIds);

  /* Preflight the whole record before the model touches it. The model is the
     semantic validator, but this descriptor pass guarantees the snapshot below
     can be made without ever invoking a record getter. */
  assertSafeValue(record, []);
  model.validate(record);

  if (typeof expectedProjectId !== "string" || expectedProjectId !== record.project) {
    fail("This plan names a different project.", "different_project");
  }
  if (typeof reviewId !== "string" || !VALID_REVIEW_ID.test(reviewId) || !hasOwn(record, "reviews") ||
      !hasOwn(record.reviews, reviewId) || record.reviews[reviewId] === null) {
    fail("This review is no longer in the project.", "review_missing");
  }

  const review = record.reviews[reviewId];
  for (const id of selectedIds) {
    const issue = review.issues[id];
    if (!issue || issue === null) fail("A selected issue is no longer in this review.", "unknown_issue");
    if (issue.retired) fail("A retired issue cannot be selected for export.", "retired_issue");
  }

  /* One captured full snapshot of the validated source. Later renderers get
     this snapshot, not the caller's live record. */
  const recordSnapshot = deepFreeze(clonePlain(record));

  const mainProjection = model.exportInputs(record, expectedProjectId, reviewId, selectedIds);
  assertProjection(mainProjection, record, expectedProjectId, reviewId);

  const mainById = selectedIssueById(mainProjection);
  const mainIssues = selectedIds.map(id => {
    const identity = mainById.get(id);
    if (!identity) fail("The main projection omitted a selected issue.", "projection_invalid");
    return identity;
  });

  const remainingIds = validateIdList(mainProjection.remainingIssueIds, "Remaining issue IDs", true);
  const selectedSet = new Set(selectedIds);
  for (const id of remainingIds) {
    if (selectedSet.has(id)) fail("The main and remaining issue sets overlap.", "projection_invalid");
  }

  const remainingById = new Map();
  for (const id of remainingIds) remainingById.set(id, remainingIssueNumber(recordSnapshot.reviews[reviewId], id));

  const pages = [{
    form: MAIN_FORM,
    role: "main",
    issueIds: selectedIds.slice(),
    issues: mainIssues.map(issue => ({ id: issue.id, number: issue.number })),
    capacity: MAIN_ISSUE_CAPACITY
  }];

  const continuationSheetCount = Math.ceil(remainingIds.length / CONTINUATION_ISSUE_CAPACITY);
  for (let sheet = 0; sheet < continuationSheetCount; sheet++) {
    const start = sheet * CONTINUATION_ISSUE_CAPACITY;
    const ids = remainingIds.slice(start, start + CONTINUATION_ISSUE_CAPACITY);
    pages.push({
      form: CONTINUATION_FORM,
      role: "continuation",
      continuationIndex: sheet + 1,
      issueIds: ids.slice(),
      issues: ids.map(id => {
        const identity = remainingById.get(id);
        if (!identity) fail("A continuation allocation omitted an issue.", "planning_internal");
        return { id: identity.id, number: identity.number };
      }),
      capacity: CONTINUATION_ISSUE_CAPACITY
    });
  }

  const selectedIssueCount = selectedIds.length;
  const remainingIssueCount = remainingIds.length;
  const activeIssueCount = selectedIssueCount + remainingIssueCount;
  const documentCount = pages.length;

  return deepFreeze({
    schema: PLAN_SCHEMA,
    planning: {
      status: "validated",
      scope: "complete_review_packet",
      pdfGeneration: "not_performed"
    },
    source: {
      schema: record.schema,
      project: record.project,
      review: {
        id: reviewId,
        label: mainProjection.review.label,
        kind: mainProjection.review.kind,
        source: mainProjection.review.source
      }
    },
    selectedIssueIds: selectedIds.slice(),
    remainingIssueIds: remainingIds.slice(),
    pages,
    continuationSheetCount,
    documentCount,
    selectedIssueCount,
    remainingIssueCount,
    activeIssueCount,
    recordSnapshot
  });
}
