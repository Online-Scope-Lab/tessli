import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { parse as parseYaml } from "yaml";

import { readSourceFiles } from "../scripts/catalogue-lib.mjs";

// The owner-approved v1.2 triage (2026-10-11). Every row must be applied
// exactly: ids frozen, no row deleted, archived rows carry a reason.
const TRIAGE_PATH = "docs/v1.2/catalogue-triage-final.csv";
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  const [header, ...body] = rows.filter((cells) => cells.some(Boolean));
  return body.map((cells) =>
    Object.fromEntries(header.map((key, index) => [key, cells[index] ?? ""])),
  );
}

async function loadTriage() {
  const [csvText, files] = await Promise.all([
    readFile(path.join(repoRoot, TRIAGE_PATH), "utf8"),
    readSourceFiles(repoRoot),
  ]);
  const sources = new Map(
    files.map(({ name, text }) => {
      const data = parseYaml(text);
      return [data.slug, { name, data }];
    }),
  );
  return { rows: parseCsv(csvText), files, sources };
}

const STATUS_FOR_DECISION = {
  keep: ["active"],
  archive: ["archived"],
  merge: ["archived"],
  // The URL fix could not be checked from the network the triage was applied
  // from, so a fixed row may wait for a human as needs-review.
  "fix-url": ["active", "needs-review"],
};

test("every triage row maps to exactly one source file with its frozen id", async () => {
  const { rows, files, sources } = await loadTriage();

  assert.equal(rows.length, 295);
  assert.equal(files.length, 295, "no source file is deleted");
  assert.deepEqual(
    [...new Set(rows.map((row) => row.slug))].sort(),
    [...sources.keys()].sort(),
  );
  for (const row of rows) {
    const source = sources.get(row.slug);
    assert.equal(source.name, `${row.slug}.yml`);
    assert.equal(source.data.id, row.id, `${row.slug} keeps its id`);
  }
});

test("source statuses match the owner decisions", async () => {
  const { rows, sources } = await loadTriage();

  for (const row of rows) {
    const { data } = sources.get(row.slug);
    const allowed = STATUS_FOR_DECISION[row.owner_decision];
    assert.ok(allowed, `${row.slug}: unknown decision ${row.owner_decision}`);
    assert.ok(
      allowed.includes(data.status),
      `${row.slug}: ${row.owner_decision} must be ${allowed.join(" or ")}, found ${data.status}`,
    );

    if (data.status === "archived") {
      assert.equal(typeof data.archived_reason, "string");
      assert.ok(data.archived_reason.trim(), `${row.slug} needs a reason`);
    } else {
      assert.equal(Object.hasOwn(data, "archived_reason"), false);
      assert.equal(Object.hasOwn(data, "replaced_by"), false);
    }

    if (data.replaced_by !== undefined) {
      const target = sources.get(data.replaced_by);
      assert.ok(target, `${row.slug} is replaced by a known source`);
      assert.notEqual(target.data.status, "archived");
    }
  }
});

test("merged rows name their target and fixed rows change URL or wait for review", async () => {
  const { rows, sources } = await loadTriage();

  const merges = rows.filter((row) => row.owner_decision === "merge");
  assert.deepEqual(
    merges.map((row) => [row.slug, row.merge_into]),
    [
      ["dark-design", "dark-mode-design"],
      ["ux-bites", "built-for-mars"],
    ],
  );
  for (const row of merges) {
    const { data } = sources.get(row.slug);
    const target = sources.get(row.merge_into).data;
    assert.ok(data.archived_reason.startsWith(`Merged into ${target.name}`));
    // A replacement must be active; Dark Mode Design is archived as well.
    assert.equal(
      data.replaced_by,
      target.status === "archived" ? undefined : row.merge_into,
    );
  }

  const fixes = rows.filter((row) => row.owner_decision === "fix-url");
  assert.deepEqual(fixes.map((row) => row.slug).sort(), [
    "origin-ui",
    "react-aria",
    "shopify-polaris",
    "v0",
  ]);
  for (const row of fixes) {
    const { data } = sources.get(row.slug);
    assert.ok(
      data.url !== row.url || data.status === "needs-review",
      `${row.slug}: a URL that was not changed must wait for review`,
    );
  }
  const origin = sources.get("origin-ui").data;
  assert.equal(origin.id, "resource-fd6228fd8e88");
  assert.equal(origin.name, "coss UI");
  assert.equal(origin.url, "https://coss.com/ui");
  assert.match(origin.summary, /formerly Origin UI/u);
  assert.equal(sources.get("v0").data.url, "https://v0.app");
});

test("triage leaves 129 listed sources and 166 archived ones", async () => {
  const { rows, sources } = await loadTriage();
  const count = (predicate) => [...sources.values()].filter(predicate).length;
  const decisions = (decision) =>
    rows.filter((row) => row.owner_decision === decision).length;

  assert.equal(decisions("keep"), 125);
  assert.equal(decisions("fix-url"), 4);
  assert.equal(decisions("archive"), 164);
  assert.equal(decisions("merge"), 2);

  // 125 keep rows are active; the 4 fix-url rows are needs-review until a
  // human opens the new URLs. Both are listed on the site.
  assert.equal(
    count(({ data }) => data.status === "active"),
    125,
  );
  assert.equal(
    count(({ data }) => data.status === "needs-review"),
    4,
  );
  assert.equal(
    count(({ data }) => data.status === "archived"),
    166,
  );
});
