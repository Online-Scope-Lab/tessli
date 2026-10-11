import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";

import {
  buildRegistry,
  compileItemSchema,
  importSpecifiers,
  KIND_TO_TYPE,
  parseNotes,
  REPO_ROOT,
  SHADCN_UI_DIR,
} from "../scripts/registry-lib.mjs";
import {
  PUBLIC_LIBRARY_ITEM_REPRESENTATION_CONTRACT,
  createPublicLibraryItemRepresentation,
  serializePublicLibraryItemMarkdown,
} from "../lib/public-representations.mjs";

const read = (file) => readFile(path.join(REPO_ROOT, file), "utf8");
const schema = JSON.parse(await read("schemas/library-item.schema.json"));
const validate = compileItemSchema(schema);
const templateNotes = parseNotes(
  await read("web/registry/_template/notes.md"),
  "template",
).frontmatter;

function withNotes(changes) {
  const notes = { ...templateNotes, ...changes };
  for (const [key, value] of Object.entries(changes)) {
    if (value === undefined) delete notes[key];
  }
  return notes;
}

test("the item template shows every field and validates", () => {
  assert.equal(validate(templateNotes), true, JSON.stringify(validate.errors));
  for (const field of schema.required) {
    assert.ok(field in templateNotes, `template shows ${field}`);
  }
});

test("only maintainers' sign-off makes an item reviewed", () => {
  assert.equal(validate(withNotes({ status: "reviewed" })), false);
  assert.equal(
    validate(withNotes({ status: "reviewed", reviewed_by: ["octocat"] })),
    false,
    "reviewed needs a date",
  );
  assert.equal(
    validate(
      withNotes({
        status: "reviewed",
        reviewed_by: ["octocat"],
        reviewed_at: "2026-10-11",
      }),
    ),
    true,
  );
  assert.equal(
    validate(withNotes({ reviewed_by: ["octocat"] })),
    false,
    "community items carry no reviewer",
  );
  assert.equal(validate(withNotes({ reviewed_at: "2026-10-11" })), false);
});

test("adapted work names its source and licence", () => {
  assert.equal(validate(withNotes({ provenance: "adapted" })), false);
  assert.equal(
    validate(
      withNotes({
        provenance: "adapted",
        source_url: "https://example.com/original",
        source_license: "MIT",
      }),
    ),
    true,
  );
  assert.equal(
    validate(withNotes({ source_url: "https://example.com/original" })),
    false,
    "original work has no source_url",
  );
});

test("the schema rejects malformed notes", () => {
  for (const changes of [
    { rules: ["hierarchy", "H-01", "A-01"] },
    { rules: ["H-2", "H-01", "A-01"] },
    { rules: ["H-01", "A-01"] },
    { kind: "widget" },
    { category: "misc" },
    { license: "Apache-2.0" },
    { states: [] },
    { use_when: [] },
    { summary: "Too short." },
    { surprise: true },
    { responsive: { desktop: "Two columns." } },
    { title: undefined },
  ]) {
    assert.equal(validate(withNotes(changes)), false, JSON.stringify(changes));
  }
  assert.equal(validate(withNotes({ rules: ["H-02", "ST-01", "A-01"] })), true);
});

test("folded YAML scalars are trimmed before validation", () => {
  const { frontmatter, body } = parseNotes(
    "---\nai_default: >\n  Three identical cards.\nid: x\n---\n\nProse.\n",
    "inline",
  );
  assert.equal(frontmatter.ai_default, "Three identical cards.");
  assert.equal(body, "Prose.");
  assert.throws(() => parseNotes("no frontmatter", "inline"));
});

test("import scanning finds static imports and re-exports only", () => {
  const source = `"use client";
import * as React from "react";
import { cn } from "@/registry/shadcn/lib/utils";
import {
  Button,
  type ButtonProps,
} from "@/registry/shadcn/ui/button";
export { x } from "./local";
const text = "import from Markdown";
export function Item() {}
`;
  assert.deepEqual(importSpecifiers(source).sort(), [
    "./local",
    "@/registry/shadcn/lib/utils",
    "@/registry/shadcn/ui/button",
    "react",
  ]);
});

test("the registry build is deterministic and matches the committed files", async () => {
  const first = await buildRegistry();
  const second = await buildRegistry();
  assert.deepEqual([...first.files.keys()], [...second.files.keys()]);
  for (const [file, contents] of first.files) {
    assert.equal(second.files.get(file), contents, file);
    assert.equal(await read(file), contents, `${file} is up to date`);
  }
});

test("root registry.json is a shadcn GitHub registry over web/registry/items", async () => {
  const registry = JSON.parse(await read("registry.json"));
  const { items } = await buildRegistry();
  assert.equal(registry.name, "tessli");
  assert.match(registry.homepage, /^https:\/\//);
  // Library items first, then the `rules` file item (tests/rules.test.mjs).
  assert.deepEqual(
    registry.items.map((item) => item.name),
    [...items.map((item) => item.slug), "rules"],
  );
  assert.ok(!registry.items.some((item) => item.name === "example-item"));
  const libraryEntries = registry.items.filter((item) => item.name !== "rules");
  assert.ok(libraryEntries.length >= 3);

  for (const entry of libraryEntries) {
    const notes = entry.meta.tessli;
    assert.equal(notes.id, entry.name);
    assert.equal(entry.type, KIND_TO_TYPE[notes.kind]);
    assert.equal(entry.title, notes.title);
    assert.equal(entry.description, notes.summary);
    assert.deepEqual(entry.categories, [notes.category]);
    assert.equal(validate(notes), true, entry.name);
    assert.deepEqual(entry.files, [
      {
        path: `web/registry/items/${entry.name}/${entry.name}.tsx`,
        type: "registry:component",
      },
    ]);
    // GitHub installs read file paths relative to the root registry.json.
    await access(path.join(REPO_ROOT, entry.files[0].path));
    for (const dependency of entry.registryDependencies) {
      await access(path.join(REPO_ROOT, SHADCN_UI_DIR, `${dependency}.tsx`));
    }

    const source = await read(entry.files[0].path);
    for (const specifier of importSpecifiers(source)) {
      assert.ok(
        !specifier.startsWith(".") &&
          (!specifier.startsWith("@/") ||
            /^@\/registry\/shadcn\/(ui\/[a-z0-9-]+|lib\/utils)$/.test(
              specifier,
            )),
        `${entry.name} imports ${specifier}`,
      );
    }
    // Semantic tokens only: no hard-coded colours or font families.
    assert.doesNotMatch(source, /#[0-9a-f]{3,8}\b|rgba?\(|hsl\(|oklch\(/i);
    assert.doesNotMatch(source, /font-(serif|mono)|fontFamily/);

    const publicItem = JSON.parse(
      await read(`web/public/r/${entry.name}.json`),
    );
    assert.equal(publicItem.files[0].content, source);
    assert.deepEqual(publicItem.meta, entry.meta);
  }
});

test("the starter items are honest community items", async () => {
  const registry = JSON.parse(await read("registry.json"));
  const names = registry.items.map((item) => item.name);
  // Plan §6.4: the twelve starter items. Only a human signs `reviewed`.
  const starter = [
    "auth-forms",
    "closing-cta-footer",
    "dashboard-overview",
    "data-table",
    "empty-state",
    "faq",
    "feature-evidence",
    "mobile-list-detail",
    "pricing-tiers",
    "product-hero",
    "settings-account",
    "social-proof-honest",
  ];
  for (const name of starter) {
    assert.ok(names.includes(name), name);
    const { tessli } = registry.items.find((item) => item.name === name).meta;
    assert.equal(tessli.status, "community", name);
    assert.deepEqual(tessli.reviewed_by, [], name);
    assert.equal(tessli.reviewed_at, null, name);
    assert.equal(tessli.provenance, "original", name);
  }
  const pricing = registry.items.find((item) => item.name === "pricing-tiers");
  assert.deepEqual(pricing.registryDependencies, ["button"]);
});

test("item representations carry the notes, install command and code", async () => {
  const library = JSON.parse(await read("web/data/library.json"));
  for (const item of library.items) {
    const document = createPublicLibraryItemRepresentation(
      item,
      library.installPrefix,
    );
    assert.equal(
      document.contract,
      PUBLIC_LIBRARY_ITEM_REPRESENTATION_CONTRACT,
    );
    assert.equal(document.canonicalPath, `/library/${item.slug}`);
    assert.equal(
      document.item.install,
      `npx shadcn@latest add online-scope-lab/tessli/${item.slug}`,
    );
    assert.equal(document.item.source.code, item.source);
    const markdown = serializePublicLibraryItemMarkdown(document);
    for (const heading of [
      "## Install",
      "## Use when",
      "## Avoid when",
      "## Common AI default",
      "## Why this is better",
      "## Accessibility",
      "## Credits",
      "```tsx",
    ]) {
      assert.ok(markdown.includes(heading), `${item.slug}: ${heading}`);
    }
    assert.match(markdown, /community \(not yet reviewed by a maintainer\)/);
    // The only mention is the boundary that disclaims the claim.
    assert.match(markdown, /Tessli does not claim that using an item improves/);
    assert.doesNotMatch(
      markdown.replace(/Tessli does not claim[^\n]*/, ""),
      /improves AI|gives AI taste/i,
    );
  }
});
