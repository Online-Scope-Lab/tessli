import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";

import {
  buildRegistry,
  compileItemSchema,
  parseNotes,
  REPO_ROOT,
} from "../scripts/registry-lib.mjs";
import {
  itemRuleProblems,
  RULE_CATEGORIES,
  TESSLI_INDEX_MAX_BYTES,
  TESSLI_INDEX_PATH,
  TESSLI_INDEX_TARGET,
} from "../scripts/rules-lib.mjs";
import {
  createPublicLibraryItemRepresentation,
  serializePublicLibraryItemMarkdown,
} from "../lib/public-representations.mjs";

const read = (file) => readFile(path.join(REPO_ROOT, file), "utf8");
const schema = JSON.parse(await read("schemas/rule.schema.json"));
const validate = compileItemSchema(schema);
const ruleFiles = (await readdir(path.join(REPO_ROOT, "rules")))
  .filter((name) => name !== "TESSLI.md")
  .sort();
const ruleFrontmatter = await Promise.all(
  ruleFiles.map(
    async (name) =>
      parseNotes(await read(`rules/${name}`), `rules/${name}`).frontmatter,
  ),
);
const { files, items, rules } = await buildRegistry();
const sample = ruleFrontmatter.find((rule) => rule.id === "H-01");

function withRule(changes) {
  const rule = { ...sample, ...changes };
  for (const [key, value] of Object.entries(changes)) {
    if (value === undefined) delete rule[key];
  }
  return rule;
}

test("every rule file validates and its id matches the file name", () => {
  assert.ok(ruleFiles.length > 0);
  for (const [index, name] of ruleFiles.entries()) {
    const rule = ruleFrontmatter[index];
    assert.match(name, /^[A-Z]{1,2}-\d{2}\.md$/);
    assert.equal(
      validate(rule),
      true,
      `${name}: ${JSON.stringify(validate.errors)}`,
    );
    assert.equal(`${rule.id}.md`, name);
  }
});

test("rule ids are unique and their prefix matches the category", () => {
  const ids = rules.map((rule) => rule.id);
  assert.equal(new Set(ids).size, ids.length);
  const prefixes = new Map(RULE_CATEGORIES.map((c) => [c.id, c.prefix]));
  for (const rule of rules) {
    assert.equal(rule.id.split("-")[0], prefixes.get(rule.category), rule.id);
  }
  assert.equal(
    new Set(RULE_CATEGORIES.map((c) => c.prefix)).size,
    RULE_CATEGORIES.length,
    "prefixes are unique",
  );
  assert.deepEqual(
    [...schema.properties.category.enum].sort(),
    RULE_CATEGORIES.map((c) => c.id).sort(),
  );
});

test("the launch set has 30-40 draft rules across every category", () => {
  assert.ok(rules.length >= 30 && rules.length <= 40, `${rules.length} rules`);
  for (const category of RULE_CATEGORIES) {
    assert.ok(
      rules.some((rule) => rule.category === category.id),
      `${category.id} has a rule`,
    );
  }
  // Agents draft rules; only a maintainer signs one reviewed.
  for (const rule of rules) {
    assert.equal(rule.status, "draft", rule.id);
    assert.deepEqual(rule.reviewed_by, [], rule.id);
    assert.equal(rule.reviewed_at, null, rule.id);
  }
});

test("the schema rejects malformed rules", () => {
  assert.equal(validate(sample), true);
  for (const changes of [
    { id: "X-01" },
    { id: "H-1" },
    { id: "h-01" },
    { category: "palette" },
    { status: "reviewed" },
    { status: "reviewed", reviewed_by: ["octocat"] },
    { reviewed_by: ["octocat"] },
    { reviewed_at: "2026-10-11" },
    { statement: "Too short." },
    { statement: "Keep it short. ".repeat(7).trim() },
    { check: "x".repeat(96) },
    { sources: [] },
    { why: undefined },
    { anti_pattern: undefined },
    { surprise: true },
  ]) {
    assert.equal(validate(withRule(changes)), false, JSON.stringify(changes));
  }
  assert.equal(
    validate(
      withRule({
        status: "reviewed",
        reviewed_by: ["octocat"],
        reviewed_at: "2026-10-11",
      }),
    ),
    true,
  );
});

test("rules teach structure, not the Tessli palette, and claim no outcome", () => {
  for (const rule of rules) {
    const text = [rule.statement, rule.why, rule.check, rule.anti_pattern]
      .join(" ")
      .toLowerCase();
    assert.doesNotMatch(
      text,
      /newsreader|instrument sans|orange|cream|terracotta|grain|#[0-9a-f]{3,8}\b/,
      rule.id,
    );
    assert.doesNotMatch(
      text,
      /improves? ai|ai taste|better ai output|study shows|research shows|\d+% of/,
      rule.id,
    );
  }
});

test("every item applies 3-8 rules that exist", () => {
  const ids = new Set(rules.map((rule) => rule.id));
  assert.ok(items.length >= 3);
  for (const item of items) {
    assert.ok(
      item.notes.rules.length >= 3 && item.notes.rules.length <= 8,
      `${item.slug} applies ${item.notes.rules.length} rules`,
    );
    for (const id of item.notes.rules)
      assert.ok(ids.has(id), `${item.slug}: ${id}`);
  }
  const broken = [{ slug: "demo", notes: { rules: ["H-01", "Z-99"] } }];
  assert.deepEqual(itemRuleProblems(broken, rules, "web/registry/items"), [
    "web/registry/items/demo/notes.md: rules lists Z-99, but rules/Z-99.md does not exist.",
  ]);
});

test("each rule lists exactly the items whose notes apply it", async () => {
  const data = JSON.parse(await read("web/data/rules.json"));
  assert.equal(data.rules.length, rules.length);
  for (const rule of data.rules) {
    const expected = items
      .filter((item) => item.notes.rules.includes(rule.id))
      .map((item) => item.slug)
      .sort();
    assert.deepEqual(
      rule.items.map((item) => item.slug),
      expected,
      rule.id,
    );
  }
  assert.equal(data.index, await read(TESSLI_INDEX_PATH));
});

test("TESSLI.md is a small, complete, generated index", async () => {
  const index = await read(TESSLI_INDEX_PATH);
  assert.equal(files.get(TESSLI_INDEX_PATH), index, "TESSLI.md has no drift");
  assert.ok(
    Buffer.byteLength(index) < TESSLI_INDEX_MAX_BYTES,
    `${Buffer.byteLength(index)} bytes`,
  );
  assert.equal(TESSLI_INDEX_MAX_BYTES, 8192);
  const header = index.split("\n## ")[0];
  assert.match(header, /^# Tessli UI rules\n/);
  assert.match(header, /open-source UI library/);
  assert.match(header, /draft until a maintainer signs it/);
  assert.match(header, /1440, 768 and 390/);
  assert.doesNotMatch(index, /improves? AI|gives AI taste/i);
  for (const rule of rules) {
    const lines = index
      .split("\n")
      .filter((line) => line.startsWith(`- ${rule.id} `));
    assert.deepEqual(lines, [`- ${rule.id} ${rule.statement} | ${rule.check}`]);
  }
});

test("registry.json installs TESSLI.md at the project root", async () => {
  const registry = JSON.parse(await read("registry.json"));
  const entry = registry.items.find((item) => item.name === "rules");
  assert.ok(entry, "rules item");
  assert.equal(entry.type, "registry:file");
  assert.deepEqual(entry.files, [
    {
      path: TESSLI_INDEX_PATH,
      type: "registry:file",
      target: TESSLI_INDEX_TARGET,
    },
  ]);
  assert.equal(TESSLI_INDEX_TARGET, "~/TESSLI.md");
  const published = JSON.parse(await read("web/public/r/rules.json"));
  assert.equal(published.files[0].content, await read(TESSLI_INDEX_PATH));
  assert.equal(published.name, "rules");
});

test("item representations carry each applied rule's statement", async () => {
  const library = JSON.parse(await read("web/data/library.json"));
  const item = library.items.find((entry) => entry.slug === "pricing-tiers");
  const document = createPublicLibraryItemRepresentation(
    item,
    library.installPrefix,
    rules,
  );
  assert.equal(document.item.rules.length, item.notes.rules.length);
  const first = document.item.rules[0];
  assert.equal(first.path, `/rules/${first.id}`);
  assert.equal(
    first.statement,
    rules.find((rule) => rule.id === first.id).statement,
  );
  const markdown = serializePublicLibraryItemMarkdown(document);
  assert.ok(markdown.includes(`- ${first.id} — `));
  assert.doesNotMatch(markdown, /rule set is not published/);
});
