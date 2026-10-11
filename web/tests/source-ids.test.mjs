import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  buildCatalogue,
  SCHEMA_PATH,
  SOURCE_PATH,
} from "../scripts/catalogue-lib.mjs";

const currentFile = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(currentFile), "../..");
const TRIAGE_PATH = "docs/v1.2/catalogue-triage-final.csv";

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

  assert.equal(report.issues.errors.length, 0);
  assert.equal(catalogue.resources.length, triage.size);
  let matched = 0;
  for (const resource of catalogue.resources) {
    assert.equal(
      resource.id,
      triage.get(resource.slug),
      `ID drift for ${resource.slug}`,
    );
    matched += 1;
  }
  assert.equal(matched, triage.size);
});

test("frozen IDs are unique", async () => {
  const { catalogue } = await buildCatalogue({ root: repoRoot });
  const ids = catalogue.resources.map((resource) => resource.id);

  assert.equal(new Set(ids).size, ids.length);
});

test("IDs are read from the source data and never derived from the URL", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "tessli-ids-"));
  try {
    await cp(path.join(repoRoot, SCHEMA_PATH), path.join(root, SCHEMA_PATH), {
      recursive: true,
    });
    const original = await readFile(path.join(repoRoot, SOURCE_PATH), "utf8");
    const { catalogue: before } = await buildCatalogue({ root: repoRoot });
    const first = before.resources[0];
    const moved = original.replace(
      `,${first.url},`,
      ",https://moved.example.org/new-home,",
    );
    assert.notEqual(moved, original);
    await cp(path.join(repoRoot, "lib_data"), path.join(root, "lib_data"), {
      recursive: true,
    });
    await writeFile(path.join(root, SOURCE_PATH), moved, "utf8");

    const { catalogue: after } = await buildCatalogue({ root });
    const relocated = after.resources.find(
      (resource) => resource.slug === first.slug,
    );

    assert.equal(relocated.url, "https://moved.example.org/new-home");
    assert.equal(relocated.id, first.id);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
