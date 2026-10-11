import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import {
  OSS_HUMAN_REVIEW_CANDIDATE_ROUTE,
  OSS_HUMAN_REVIEW_CONTRACT,
  OSS_HUMAN_REVIEW_DIMENSIONS,
  OSS_HUMAN_REVIEW_STORAGE_KEY,
  createEmptyOssHumanReviewDraft,
  createOssHumanReviewArtifact,
  normalizeOssHumanReviewDraft,
  validateOssHumanReviewDraft,
} from "../lib/oss-human-review.mjs";

const canonicalDimensionIds = [
  "task-fit",
  "hierarchy",
  "mobile-usability",
  "discoverability",
  "density",
  "coherence",
  "consistency",
  "component-reuse",
  "accessibility",
  "restraint",
  "regression-risk",
  "ship-readiness",
];

function completeDraft() {
  const draft = createEmptyOssHumanReviewDraft("2026-08-04");
  draft.reviewer = "Owner review — Deepak";
  draft.decision = "revise";
  draft.overallNotes =
    "Keep the direction and correct the evidence gaps before production adaptation.";
  for (const [index, dimension] of OSS_HUMAN_REVIEW_DIMENSIONS.entries()) {
    draft.dimensions[dimension.id] = {
      score: (index % 5) + 1,
      note: `Evidence recorded for ${dimension.label.toLocaleLowerCase()}.`,
    };
  }
  return draft;
}

test("review dimensions remain canonical, ordered, and unscored by default", () => {
  assert.deepEqual(
    OSS_HUMAN_REVIEW_DIMENSIONS.map((dimension) => dimension.id),
    canonicalDimensionIds,
  );
  assert.equal(new Set(canonicalDimensionIds).size, 12);
  for (const dimension of OSS_HUMAN_REVIEW_DIMENSIONS) {
    assert.ok(dimension.label.trim());
    assert.ok(dimension.prompt.trim());
    assert.ok(dimension.lowAnchor.trim());
    assert.ok(dimension.highAnchor.trim());
  }

  const draft = createEmptyOssHumanReviewDraft("2026-08-04");
  assert.equal(
    Object.values(draft.dimensions).every(
      (dimension) => dimension.score === null && dimension.note === "",
    ),
    true,
  );
  assert.equal(draft.decision, "");
  assert.equal(draft.overallNotes, "");
});

test("validation requires attributable complete human evidence", () => {
  const empty = validateOssHumanReviewDraft(createEmptyOssHumanReviewDraft(""));
  assert.equal(empty.valid, false);
  assert.equal(empty.errors.length, 28);
  assert.deepEqual(
    empty.errors.slice(0, 2).map((error) => error.path),
    ["reviewer", "reviewedAt"],
  );
  assert.deepEqual(
    empty.errors.slice(-2).map((error) => error.path),
    ["decision", "overallNotes"],
  );

  const complete = validateOssHumanReviewDraft(completeDraft());
  assert.equal(complete.valid, true);
  assert.deepEqual(complete.errors, []);
});

test("completed review artifact is deterministic and preserves human boundary", () => {
  const first = createOssHumanReviewArtifact(completeDraft());
  const second = createOssHumanReviewArtifact(completeDraft());
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(first.json, second.json);
  assert.equal(first.filename, "oss-homepage-human-review-2026-08-04.json");
  assert.equal(first.json.endsWith("\n"), true);
  assert.doesNotMatch(first.json, /[ \t]+$/gmu);

  const parsed = JSON.parse(first.json);
  assert.equal(parsed.contract, OSS_HUMAN_REVIEW_CONTRACT);
  assert.equal(parsed.candidateRoute, OSS_HUMAN_REVIEW_CANDIDATE_ROUTE);
  assert.deepEqual(
    parsed.dimensions.map((dimension) => dimension.id),
    canonicalDimensionIds,
  );
  assert.equal(parsed.blindReview.used, false);
  assert.match(parsed.blindReview.reason, /one retained candidate/u);
  assert.match(parsed.evidenceBoundary, /reviewer-recorded human judgment/u);
});

test("malformed local data degrades to a bounded empty draft", () => {
  const normalized = normalizeOssHumanReviewDraft(
    {
      reviewer: 42,
      reviewedAt: "2026-02-31",
      dimensions: {
        "task-fit": { score: 8, note: ["not text"] },
        invented: { score: 5, note: "must be ignored" },
      },
      decision: "approve-everything",
      overallNotes: null,
    },
    "2026-08-04",
  );
  assert.equal(normalized.reviewer, "");
  assert.equal(normalized.reviewedAt, "2026-08-04");
  assert.equal(normalized.dimensions["task-fit"].score, null);
  assert.equal(normalized.dimensions["task-fit"].note, "");
  assert.equal(Object.hasOwn(normalized.dimensions, "invented"), false);
  assert.equal(normalized.decision, "");
  assert.equal(normalized.overallNotes, "");
});

test("review template and packet contain no invented human judgment", async () => {
  const [templateText, packet] = await Promise.all([
    readFile(
      new URL(
        "../../docs/proofs/oss-homepage/human-review-template.json",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "../../docs/proofs/oss-homepage/human-review-packet.md",
        import.meta.url,
      ),
      "utf8",
    ),
  ]);
  const template = JSON.parse(templateText);
  assert.equal(template.status, "pending-human-input");
  assert.deepEqual(
    template.dimensions.map((dimension) => dimension.id),
    canonicalDimensionIds,
  );
  assert.equal(
    template.dimensions.every(
      (dimension) => dimension.score === null && dimension.note === "",
    ),
    true,
  );
  assert.equal(template.decision, "");
  assert.equal(template.overallNotes, "");
  assert.match(packet, /Automated checks are not human approval/u);
  assert.match(packet, /Blind review is not used here/u);
  assert.match(packet, /awaiting genuine reviewer input/u);
  assert.match(packet, /cannot be completed by automated checks alone/u);
});

test("review route and client remain isolated and local-only", async () => {
  const [page, component, sitemap, navigation] = await Promise.all([
    readFile(
      new URL("../app/proofs/oss-homepage/review/page.tsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL(
        "../components/oss-human-review/oss-human-review-form.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(new URL("../app/sitemap.ts", import.meta.url), "utf8"),
    readFile(
      new URL("../components/site-header/navigation.ts", import.meta.url),
      "utf8",
    ),
  ]);
  assert.match(page, /index: false/u);
  assert.match(page, /follow: false/u);
  assert.doesNotMatch(sitemap, /proofs\/oss-homepage\/review/u);
  assert.doesNotMatch(navigation, /proofs\/oss-homepage\/review/u);
  assert.equal(
    OSS_HUMAN_REVIEW_STORAGE_KEY,
    "tessli-oss-homepage-human-review-v1",
  );
  assert.match(component, /OSS_HUMAN_REVIEW_STORAGE_KEY/u);
  assert.match(component, /navigator\.clipboard\.writeText\(result\.json\)/u);
  assert.match(component, /downloadText\(result\.filename, result\.json\)/u);
  assert.match(component, /window\.localStorage\.removeItem/u);
  assert.doesNotMatch(
    component,
    /fetch\(|XMLHttpRequest|process\.env|cookies\(|supabase|analytics/iu,
  );
});
