import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  buildCatalogue,
  composeCatalogue,
  readSourceFiles,
  SCHEMA_PATH,
  SOURCE_ORDER_PATH,
  SOURCE_SCHEMA_PATH,
} from "../scripts/catalogue-lib.mjs";

const currentFile = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(currentFile), "../..");
const TRIAGE_PATH = "docs/v1.2/catalogue-triage-final.csv";

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(repoRoot, relativePath), "utf8"));
}

async function triageIdsBySlug() {
  const text = await readFile(path.join(repoRoot, TRIAGE_PATH), "utf8");
  const [header, ...rows] = text.split(/\r?\n/u).filter(Boolean);
  assert.match(header, /^row,id,slug,/u);
  // row, id and slug never contain commas or quotes, so the first three
  // fields can be read without a full CSV parser.
  return new Map(
    rows.map((row) => {
      const [, id, slug] = row.split(",");
      return [slug, id];
    }),
  );
}

test("every frozen ID equals the owner-approved triage ID for its slug", async () => {
  const [{ catalogue, report }, triage] = await Promise.all([
    buildCatalogue({ root: repoRoot }),
    triageIdsBySlug(),
  ]);
  const bySlug = new Map(
    catalogue.resources.map((resource) => [resource.slug, resource]),
  );

  assert.equal(report.issues.errors.length, 0);
  assert.ok(triage.size > 0, "The triage CSV has no rows");
  // Every triaged source is still present with its frozen ID. Sources added
  // after the triage are not in the CSV; they only need a unique,
  // schema-valid ID, which the generator and the tests below check.
  let matched = 0;
  for (const [slug, id] of triage) {
    const resource = bySlug.get(slug);
    assert.ok(resource, `Triaged source ${slug} is missing`);
    assert.equal(resource.id, id, `ID drift for ${slug}`);
    matched += 1;
  }
  assert.equal(matched, triage.size);
});

test("frozen IDs are unique", async () => {
  const { catalogue } = await buildCatalogue({ root: repoRoot });
  const ids = catalogue.resources.map((resource) => resource.id);

  assert.equal(new Set(ids).size, ids.length);
});

test("IDs are read from the source files and never derived from the URL", async () => {
  const [files, sourceSchema, catalogueSchema, order] = await Promise.all([
    readSourceFiles(repoRoot),
    readJson(SOURCE_SCHEMA_PATH),
    readJson(SCHEMA_PATH),
    readJson(SOURCE_ORDER_PATH),
  ]);
  const { catalogue: before } = composeCatalogue(files, {
    sourceSchema,
    catalogueSchema,
    order,
  });
  const first = before.resources[0];
  const moved = files.map((file) =>
    file.name === `${first.slug}.yml`
      ? {
          ...file,
          text: file.text.replace(
            `url: ${first.url}\n`,
            "url: https://moved.example.org/new-home\n",
          ),
        }
      : file,
  );
  assert.notDeepEqual(moved, files);

  const { catalogue: after, report } = composeCatalogue(moved, {
    sourceSchema,
    catalogueSchema,
    order,
  });
  const relocated = after.resources.find(
    (resource) => resource.slug === first.slug,
  );

  assert.deepEqual(report.issues.errors, []);
  assert.equal(relocated.url, "https://moved.example.org/new-home");
  assert.equal(relocated.id, first.id);
  assert.deepEqual(
    after.resources.map((resource) => resource.id),
    before.resources.map((resource) => resource.id),
  );
});
