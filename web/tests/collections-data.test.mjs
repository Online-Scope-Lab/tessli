import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  buildReleaseCatalogue,
  COLLECTION_SCHEMA_PATH,
  COLLECTION_SOURCE_PATH,
  prepareCollectionComposition,
  validateCollectionSource,
} from "../scripts/release-catalogue-lib.mjs";
import { sourceProvenanceSha256 } from "../scripts/catalogue-lib.mjs";

const currentFile = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(currentFile), "../..");

let cachedRelease;
async function releaseBuild() {
  cachedRelease ??= buildReleaseCatalogue({ root: repoRoot });
  return cachedRelease;
}

async function collectionInputs() {
  const [sourceBuffer, schemaText] = await Promise.all([
    readFile(path.join(repoRoot, COLLECTION_SOURCE_PATH)),
    readFile(path.join(repoRoot, COLLECTION_SCHEMA_PATH), "utf8"),
  ]);

  return {
    sourceBuffer,
    source: JSON.parse(sourceBuffer.toString("utf8")),
    schema: JSON.parse(schemaText),
  };
}

test("release catalogue contains six version-2 published Playbooks", async () => {
  const [{ catalogue, report }, { source, schema }] = await Promise.all([
    releaseBuild(),
    collectionInputs(),
  ]);

  assert.equal(source.version, 2);
  assert.equal(schema.properties.version.const, 2);
  assert.equal(report.issues.errors.length, 0);
  assert.equal(catalogue.collections.length, 6);
  assert.equal(report.summary.collections, 6);
  assert.equal(report.summary.collectionItems, 44);

  // The v1.2 triage (2026-10-11) archived members of five Playbooks; each kept
  // at least five, and only the untouched one keeps its July review date.
  const expected = {
    "saas-landing-pages": [5, "2026-10-11"],
    "typography-font-tools": [7, "2026-10-11"],
    "motion-starter-pack": [8, "2026-10-11"],
    "open-source-ui-libraries": [7, "2026-10-11"],
    "accessible-colour-tools": [7, "2026-10-11"],
    "design-systems-worth-studying": [10, "2026-07-29"],
  };
  assert.deepEqual(
    catalogue.collections.map((playbook) => playbook.slug),
    Object.keys(expected),
  );

  for (const playbook of catalogue.collections) {
    const [memberCount, reviewedAt] = expected[playbook.slug];
    assert.equal(playbook.status, "published");
    assert.equal(playbook.lastReviewedAt, reviewedAt);
    assert.ok(playbook.outcome.trim());
    assert.ok(playbook.audience.trim());
    assert.equal(playbook.resourceIds.length, memberCount);
    assert.ok(playbook.resourceIds.length >= 5);
    assert.equal(playbook.stages.length, 3);
    const stagedIds = playbook.stages.flatMap((stage) =>
      stage.items.map((item) => item.resourceId),
    );
    assert.deepEqual(stagedIds, playbook.resourceIds);
    assert.equal(new Set(stagedIds).size, memberCount);
    assert.equal(
      playbook.stages.every(
        (stage) =>
          stage.title.trim() &&
          stage.inspect.trim() &&
          stage.decision.trim() &&
          stage.items.every((item) => item.role.trim()),
      ),
      true,
    );
    assert.equal(Object.hasOwn(playbook, "curator"), false);
  }
});

test("Playbook membership still matches each stated workflow", async () => {
  const { catalogue } = await releaseBuild();
  const resources = new Map(
    catalogue.resources.map((resource) => [resource.id, resource]),
  );
  const playbooks = new Map(
    catalogue.collections.map((playbook) => [playbook.slug, playbook]),
  );

  const assertMembers = (slug, predicate) => {
    const playbook = playbooks.get(slug);
    assert.ok(playbook, `Missing Playbook: ${slug}`);
    for (const resourceId of playbook.resourceIds) {
      const resource = resources.get(resourceId);
      assert.ok(resource, `${slug} references unknown resource ${resourceId}`);
      assert.notEqual(resource.status, "archived", `${slug}: ${resource.name}`);
      assert.equal(
        predicate(resource),
        true,
        `${resource.name} mismatches ${slug}`,
      );
    }
  };

  assertMembers(
    "saas-landing-pages",
    (resource) => resource.category === "landing-marketing",
  );
  assertMembers(
    "typography-font-tools",
    (resource) => resource.category === "typography",
  );
  assertMembers(
    "motion-starter-pack",
    (resource) => resource.category === "motion-3d",
  );
  assertMembers(
    "open-source-ui-libraries",
    (resource) =>
      resource.category === "ui-libraries" && resource.access === "open-source",
  );
  assertMembers(
    "accessible-colour-tools",
    (resource) => resource.category === "color-accessibility",
  );
  assertMembers(
    "design-systems-worth-studying",
    (resource) => resource.category === "design-systems",
  );
});

test("Playbook source provenance is deterministic and separate from source-file provenance", async () => {
  const [{ catalogue, report }, { sourceBuffer, source }] = await Promise.all([
    releaseBuild(),
    collectionInputs(),
  ]);
  const sourceSha256 = sourceProvenanceSha256(sourceBuffer);

  assert.deepEqual(catalogue.collections, source.collections);
  assert.equal(report.source.path, "sources");
  assert.equal(report.source.fileCount, catalogue.resources.length);
  assert.deepEqual(report.collectionSource, {
    path: COLLECTION_SOURCE_PATH,
    sha256: sourceSha256,
    collectionCount: 6,
  });
});

test("validator rejects duplicated, missing, and reordered staged membership", async () => {
  const [{ catalogue }, { source, schema }] = await Promise.all([
    releaseBuild(),
    collectionInputs(),
  ]);
  const invalid = structuredClone(source);
  invalid.collections[0].stages[1].id = invalid.collections[0].stages[0].id;
  invalid.collections[1].stages[1].items[0].resourceId =
    invalid.collections[1].stages[0].items[0].resourceId;
  invalid.collections[2].stages[0].items[0].resourceId =
    "resource-does-not-exist";
  invalid.collections[3].stages[0].items.reverse();

  const codes = new Set(
    validateCollectionSource(invalid, schema, catalogue.resources).map(
      (error) => error.code,
    ),
  );

  assert.equal(codes.has("duplicate-playbook-stage-id"), true);
  assert.equal(codes.has("duplicate-playbook-stage-resource"), true);
  assert.equal(codes.has("playbook-stage-nonmember"), true);
  assert.equal(codes.has("playbook-stage-order"), true);
});

test("validator rejects archived Playbook members", async () => {
  const [{ catalogue }, { source, schema }] = await Promise.all([
    releaseBuild(),
    collectionInputs(),
  ]);
  const archived = catalogue.resources.find(
    (resource) => resource.slug === "headless-ui",
  );
  assert.equal(archived.status, "archived");
  const invalid = structuredClone(source);
  invalid.collections[3].resourceIds[0] = archived.id;
  invalid.collections[3].stages[0].items[0].resourceId = archived.id;

  const errors = validateCollectionSource(invalid, schema, catalogue.resources);

  assert.deepEqual(
    errors.map((error) => [error.code, error.resourceId]),
    [["archived-collection-member", archived.id]],
  );
});

test("validator rejects malformed Playbook guidance", async () => {
  const [{ catalogue }, { source, schema }] = await Promise.all([
    releaseBuild(),
    collectionInputs(),
  ]);
  const invalid = structuredClone(source);
  invalid.collections[0].outcome = "";
  invalid.collections[1].audience = "";
  invalid.collections[2].stages = invalid.collections[2].stages.slice(0, 1);
  invalid.collections[3].stages[0].items[0].role = "";
  invalid.collections[4].stages[0].extra = true;

  const codes = new Set(
    validateCollectionSource(invalid, schema, catalogue.resources).map(
      (error) => error.code,
    ),
  );

  assert.equal(codes.has("collection-outcome"), true);
  assert.equal(codes.has("collection-audience"), true);
  assert.equal(codes.has("playbook-stage-count"), true);
  assert.equal(codes.has("playbook-stage-role"), true);
  assert.equal(codes.has("unexpected-keys"), true);
});

test("invalid Playbook source publishes no collections", async () => {
  const [{ catalogue }, { source, schema }] = await Promise.all([
    releaseBuild(),
    collectionInputs(),
  ]);
  const invalid = structuredClone(source);
  invalid.collections[0].stages = null;

  const composition = prepareCollectionComposition(
    invalid,
    schema,
    catalogue.resources,
  );

  assert.equal(composition.errors.length > 0, true);
  assert.equal(composition.sourceCollections.length, 6);
  assert.deepEqual(composition.collections, []);
  assert.equal(
    composition.errors.some((error) => error.code === "playbook-stage-array"),
    true,
  );
});

test("release catalogue and Playbook report output are deterministic", async () => {
  const first = await buildReleaseCatalogue({ root: repoRoot });
  const second = await buildReleaseCatalogue({ root: repoRoot });

  assert.equal(first.catalogueText, second.catalogueText);
  assert.equal(first.reportText, second.reportText);
});
