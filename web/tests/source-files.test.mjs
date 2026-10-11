import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { parse, stringify } from "yaml";

import {
  buildCatalogue,
  CATALOGUE_PATH,
  composeCatalogue,
  domainFromUrl,
  REPORT_PATH,
  SCHEMA_PATH,
  SOURCE_SCHEMA_PATH,
  SOURCES_DIR,
  sourceProvenanceSha256,
  sourceSetSha256,
  validateCatalogueAgainstSchema,
} from "../scripts/catalogue-lib.mjs";
import { buildReleaseCatalogue } from "../scripts/release-catalogue-lib.mjs";

const currentFile = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(currentFile), "../..");

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(repoRoot, relativePath), "utf8"));
}

async function schemas() {
  const [sourceSchema, catalogueSchema] = await Promise.all([
    readJson(SOURCE_SCHEMA_PATH),
    readJson(SCHEMA_PATH),
  ]);
  return { sourceSchema, catalogueSchema };
}

function sourceFile(overrides = {}) {
  const data = {
    id: "resource-fixture-a",
    slug: "fixture-a",
    name: "Fixture A",
    url: "https://www.fixture-a.example",
    category: "typography",
    kind: "asset",
    access: "free",
    summary: "A fixture source used only by tests to check the generator.",
    status: "active",
    added_at: "2026-10-11",
    added_via: "curator",
    last_checked: null,
    ...overrides,
  };
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) delete data[key];
  }
  return { name: `${data.slug}.yml`, text: stringify(data) };
}

async function compose(files, order = { version: 1, ids: [] }) {
  return composeCatalogue(files, { ...(await schemas()), order });
}

function errorCodes(result) {
  return result.report.issues.errors.map((error) => error.code);
}

let cachedBuild;
async function catalogueBuild() {
  cachedBuild ??= buildCatalogue({ root: repoRoot });
  return cachedBuild;
}

test("every file in sources/ becomes exactly one catalogue resource", async () => {
  const [{ catalogue, report }, entries] = await Promise.all([
    catalogueBuild(),
    readdir(path.join(repoRoot, SOURCES_DIR)),
  ]);

  assert.deepEqual(report.issues.errors, []);
  assert.equal(catalogue.source.path, SOURCES_DIR);
  assert.equal(catalogue.source.fileCount, entries.length);
  assert.equal(catalogue.resources.length, entries.length);
  assert.deepEqual(
    catalogue.resources.map((resource) => `${resource.slug}.yml`).sort(),
    [...entries].sort(),
  );
  assert.equal(report.summary.resources, entries.length);
  assert.equal(
    Object.values(report.summary.status).reduce((sum, count) => sum + count),
    entries.length,
  );
});

test("source files keep only the v1.2 fields; derived and dropped fields are not stored", async () => {
  const entries = await readdir(path.join(repoRoot, SOURCES_DIR));
  for (const entry of entries) {
    const data = parse(
      await readFile(path.join(repoRoot, SOURCES_DIR, entry), "utf8"),
    );
    for (const dropped of [
      "domain",
      "subscriptionRequired",
      "usefulFor",
      "tags",
      "previewSource",
    ]) {
      assert.equal(Object.hasOwn(data, dropped), false, `${entry}: ${dropped}`);
    }
  }

  const { catalogue } = await catalogueBuild();
  for (const resource of catalogue.resources) {
    assert.equal(resource.domain, domainFromUrl(resource.url));
    for (const dropped of [
      "subscriptionRequired",
      "usefulFor",
      "tags",
      "previewSource",
    ]) {
      assert.equal(Object.hasOwn(resource, dropped), false);
    }
  }
});

test("best_for and limitations copy an intelligence profile verbatim when one exists", async () => {
  const profiles = new Map();
  const profileDir = path.join(repoRoot, "web/data/intelligence-profiles");
  for (const entry of await readdir(profileDir)) {
    const profile = JSON.parse(
      await readFile(path.join(profileDir, entry), "utf8"),
    );
    profiles.set(profile.resourceId, profile);
  }
  for (const batch of ["1.3", "1.4"]) {
    const { profiles: batchProfiles } = await readJson(
      `web/data/intelligence-profile-batches/${batch}.json`,
    );
    for (const profile of batchProfiles)
      profiles.set(profile.resourceId, profile);
  }

  const { catalogue } = await catalogueBuild();
  let copied = 0;
  for (const resource of catalogue.resources) {
    const profile =
      profiles.get(resource.slug) ?? profiles.get(resource.id) ?? null;
    if (!profile) continue;
    if (resource.bestFor) {
      assert.deepEqual(resource.bestFor, profile.workflowFit, resource.slug);
      copied += 1;
    }
    if (resource.limitations) {
      assert.deepEqual(
        resource.limitations,
        profile.limitations,
        resource.slug,
      );
      copied += 1;
    }
  }
  assert.ok(copied > 0);
});

test("the generator has no hard-coded source, category or access counts", async () => {
  const result = await compose([
    sourceFile(),
    sourceFile({
      id: "resource-fixture-b",
      slug: "fixture-b",
      name: "Fixture B",
      url: "https://fixture-b.example/library",
      access: "paid",
    }),
  ]);

  assert.deepEqual(result.report.issues.errors, []);
  assert.equal(result.catalogue.resources.length, 2);
  assert.equal(result.report.summary.access.free, 1);
  assert.equal(result.report.summary.access.paid, 1);
  assert.equal(
    result.report.categoryCounts.find(
      (category) => category.category === "typography",
    ).total,
    2,
  );
});

test("invalid source files are reported, never dropped silently", async () => {
  const cases = [
    [{ name: "broken.yml", text: "id: [unclosed\n" }, "source-yaml"],
    [{ name: "Bad Name.yml", text: "" }, "source-file-name"],
    [{ name: "notes.yaml", text: "" }, "source-file-name"],
    [sourceFile({ summary: undefined }), "source-schema"],
    [sourceFile({ domain: "fixture-a.example" }), "source-schema"],
    [sourceFile({ status: "unavailable" }), "source-schema"],
    [sourceFile({ best_for: ["a", "b", "c", "d"] }), "source-schema"],
    [sourceFile({ limitations: ["a", "b", "c"] }), "source-schema"],
    [sourceFile({ url: "ftp://fixture-a.example" }), "source-schema"],
    [sourceFile({ added_at: "2026-02-30" }), "source-schema"],
    [sourceFile({ status: "archived" }), "source-schema"],
    [sourceFile({ archived_reason: "Not archived." }), "source-schema"],
    [sourceFile({ replaced_by: "fixture-b" }), "source-schema"],
    [sourceFile({ category: "colour" }), "unknown-category"],
    [{ name: "renamed.yml", text: sourceFile().text }, "source-slug"],
  ];

  for (const [file, code] of cases) {
    const result = await compose([file]);
    assert.ok(
      errorCodes(result).includes(code),
      `${file.name} should report ${code}: ${JSON.stringify(result.report.issues.errors)}`,
    );
    assert.equal(result.catalogue.resources.length, 0);
  }
});

test("IDs, URLs and replacements keep referential integrity", async () => {
  const duplicateId = await compose([
    sourceFile(),
    sourceFile({ slug: "fixture-b", url: "https://fixture-b.example" }),
  ]);
  assert.ok(errorCodes(duplicateId).includes("duplicate-id"));

  const duplicateUrl = await compose([
    sourceFile(),
    sourceFile({
      id: "resource-fixture-b",
      slug: "fixture-b",
      url: "https://www.fixture-a.example/",
    }),
  ]);
  assert.ok(errorCodes(duplicateUrl).includes("duplicate-url"));

  // An archived source may keep the URL it now redirects to when it names
  // the source at that URL as its replacement.
  const redirectedToSuccessor = await compose([
    sourceFile(),
    sourceFile({
      id: "resource-fixture-b",
      slug: "fixture-b",
      url: "https://www.fixture-a.example/",
      status: "archived",
      archived_reason: "Rebranded as Fixture A.",
      replaced_by: "fixture-a",
    }),
  ]);
  assert.ok(!errorCodes(redirectedToSuccessor).includes("duplicate-url"));

  const unknownReplacement = await compose([
    sourceFile({
      status: "archived",
      archived_reason: "Redirects elsewhere.",
      replaced_by: "missing-source",
    }),
  ]);
  assert.ok(errorCodes(unknownReplacement).includes("unknown-replacement"));

  const archivedReplacement = await compose([
    sourceFile({
      status: "archived",
      archived_reason: "Redirects elsewhere.",
      replaced_by: "fixture-b",
    }),
    sourceFile({
      id: "resource-fixture-b",
      slug: "fixture-b",
      url: "https://fixture-b.example",
      status: "archived",
      archived_reason: "Also gone.",
    }),
  ]);
  assert.ok(errorCodes(archivedReplacement).includes("archived-replacement"));

  const unknownOrder = await compose([sourceFile()], {
    version: 1,
    ids: ["resource-missing"],
  });
  assert.ok(errorCodes(unknownOrder).includes("source-order-unknown"));
});

test("archived sources stay in the catalogue with their status and reason", async () => {
  const result = await compose([
    sourceFile({
      status: "archived",
      archived_reason: "The site now redirects to Fixture B.",
      replaced_by: "fixture-b",
    }),
    sourceFile({
      id: "resource-fixture-b",
      slug: "fixture-b",
      name: "Fixture B",
      url: "https://fixture-b.example",
    }),
  ]);

  assert.deepEqual(result.report.issues.errors, []);
  const archived = result.catalogue.resources.find(
    (resource) => resource.slug === "fixture-a",
  );
  assert.equal(archived.status, "archived");
  assert.equal(archived.archivedReason, "The site now redirects to Fixture B.");
  assert.equal(archived.replacedBy, "fixture-b");
  assert.deepEqual(result.report.summary.status, {
    active: 1,
    "needs-review": 0,
    archived: 1,
  });
});

test("curated order comes first; unlisted sources follow by category, then name", async () => {
  const files = [
    sourceFile({
      id: "resource-z",
      slug: "zeta",
      name: "Zeta",
      url: "https://zeta.example",
    }),
    sourceFile({
      id: "resource-a",
      slug: "alpha",
      name: "Alpha",
      url: "https://alpha.example",
    }),
    sourceFile({
      id: "resource-b",
      slug: "beta",
      name: "Beta",
      url: "https://beta.example",
      category: "website-inspiration",
      kind: "gallery",
    }),
    sourceFile({
      id: "resource-m",
      slug: "mu",
      name: "Mu",
      url: "https://mu.example",
    }),
  ];
  const result = await compose(files, { version: 1, ids: ["resource-m"] });

  assert.deepEqual(result.report.issues.errors, []);
  assert.deepEqual(
    result.catalogue.resources.map((resource) => resource.slug),
    ["mu", "beta", "alpha", "zeta"],
  );
});

test("catalogue output is deterministic and independent of file read order", async () => {
  const files = [
    sourceFile(),
    sourceFile({ id: "resource-b", slug: "beta", url: "https://beta.example" }),
  ];
  const first = await compose(files);
  const second = await compose([...files].reverse());

  assert.equal(first.catalogueText, second.catalogueText);
  assert.equal(first.reportText, second.reportText);
  assert.match(first.catalogue.source.sha256, /^[a-f0-9]{64}$/);
  assert.equal(
    sourceSetSha256([{ name: "a.yml", text: "id: a\r\n" }]),
    sourceSetSha256([{ name: "a.yml", text: "id: a\n" }]),
  );
  assert.equal(
    sourceProvenanceSha256("id: a\r\n"),
    sourceProvenanceSha256("id: a\n"),
  );
});

test("catalogue schema accepts optional properties and rejects unknown keys", async () => {
  const { catalogue } = await catalogueBuild();
  const schema = await readJson(SCHEMA_PATH);
  const withOptionalFields = structuredClone(catalogue);
  withOptionalFields.generatedAt = "2026-07-28T00:00:00.000Z";
  Object.assign(withOptionalFields.resources[0], {
    faviconUrl: "https://designindex.xyz/favicon.ico",
    previewImageUrl: "https://designindex.xyz/preview.webp",
    frameworks: ["react"],
    license: "MIT",
    submissionIssue: 12,
    lastChecked: "2026-10-11",
  });

  assert.deepEqual(
    validateCatalogueAgainstSchema(withOptionalFields, schema),
    [],
  );

  withOptionalFields.resources[0].unsupportedField = true;
  assert.equal(
    validateCatalogueAgainstSchema(withOptionalFields, schema).some((message) =>
      message.includes("unsupportedField"),
    ),
    true,
  );
});

test("committed catalogue data matches deterministic release composition", async () => {
  const result = await buildReleaseCatalogue({ root: repoRoot });
  const [committedCatalogue, committedReport] = await Promise.all([
    readFile(path.join(repoRoot, CATALOGUE_PATH), "utf8"),
    readFile(path.join(repoRoot, REPORT_PATH), "utf8"),
  ]);

  assert.equal(committedCatalogue, result.catalogueText);
  assert.equal(committedReport, result.reportText);
});
