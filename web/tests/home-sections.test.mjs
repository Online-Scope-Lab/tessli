import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import library from "../data/library.json" with { type: "json" };
import rulesData from "../data/rules.json" with { type: "json" };

const currentFile = fileURLToPath(import.meta.url);
const webRoot = path.resolve(path.dirname(currentFile), "..");

async function read(relativePath) {
  return readFile(path.join(webRoot, relativePath), "utf8");
}

function slugs(source, name) {
  const match = source.match(
    new RegExp(`export const ${name} = \\[([\\s\\S]*?)\\]`),
  );
  assert.ok(match, `${name} is declared`);
  return [...match[1].matchAll(/"([a-z0-9-]+)"/g)].map((m) => m[1]);
}

test("home keeps the hero and adds the v1.2 sections in plan order", async () => {
  const home = await read("components/home/home-sections.tsx");

  const order = [
    "data-home-library",
    "data-home-anatomy",
    "data-home-for-ai",
    "data-home-sources",
    "data-home-contribute",
  ].map((marker) => home.indexOf(marker));
  assert.ok(order.every((index) => index > 0));
  assert.deepEqual(
    order,
    [...order].sort((a, b) => a - b),
  );
  assert.match(home, /UI with the reasoning attached\./);
  assert.match(home, /an open-source UI library that explains itself/i);
});

test("featured items are real library items shown as live, lazy, inert previews", async () => {
  const [home, thumbnail] = await Promise.all([
    read("components/home/home-sections.tsx"),
    read("components/library/preview-thumbnail.tsx"),
  ]);
  const featured = slugs(home, "FEATURED_ITEM_SLUGS");

  assert.ok(featured.length >= 3);
  const kinds = new Set();
  for (const slug of featured) {
    const item = library.items.find((entry) => entry.slug === slug);
    assert.ok(item, `${slug} is a library item`);
    assert.ok(item.notes.why_this_is_better.length > 0);
    kinds.add(item.notes.kind);
  }
  assert.equal(kinds.size, 3, "one component, one section and one page");
  // The one-line why is the item's own first "why this is better" note.
  assert.match(home, /item\.notes\.why_this_is_better\[0\]/);
  assert.match(
    home,
    /<PreviewThumbnail[\s\S]*?src=\{previewPath\(item\.slug\)\}/,
  );
  assert.match(thumbnail, /loading="lazy"/);
  assert.match(thumbnail, /\binert\b/);
  assert.match(thumbnail, /tabIndex=\{-1\}/);
});

test("anatomy shows one real item's own notes, not invented copy", async () => {
  const home = await read("components/home/home-sections.tsx");
  const slug = home.match(/ANATOMY_ITEM_SLUG = "([a-z0-9-]+)"/)?.[1];
  const item = library.items.find((entry) => entry.slug === slug);

  assert.ok(item, "the anatomy item exists");
  for (const field of [
    "anatomy.notes.use_when",
    "anatomy.notes.avoid_when",
    "anatomy.notes.ai_default",
    "anatomy.notes.why_this_is_better",
    "anatomy.notes.rules",
  ]) {
    assert.ok(home.includes(field), `anatomy reads ${field}`);
  }
  for (const id of item.notes.rules) {
    assert.ok(
      rulesData.rules.some((rule) => rule.id === id),
      `${id} is a real rule`,
    );
  }
  assert.match(home, /href=\{`\/rules\/\$\{rule\.id\}`\}/);
  assert.match(home, /href=\{`\/library\/\$\{anatomy\.slug\}`\}/);
});

test("For AI strip, Sources teaser and Contribute strip use real commands, derived counts and working routes", async () => {
  const home = await read("components/home/home-sections.tsx");

  assert.match(home, /command=\{rulesInstallCommand\(\)\}/);
  assert.match(home, /command=\{installCommand\(anatomy\.slug\)\}/);
  assert.match(home, /href=\{RULES_INDEX_PATH\}/);
  assert.match(home, /href="\/for-ai"/);
  assert.match(home, /getBrowsableSourceCounts\(\)/);
  assert.match(home, /\{sources\.sources\}/);
  assert.match(home, /href="\/resources"/);
  assert.match(home, /href="\/collections"/);
  assert.match(home, /href="\/contribute"/);
  assert.match(home, /href=\{repositoryUrl\}/);
  assert.doesNotMatch(home, /\b295\b|\b129\b|\b12 items\b/);
});

test("home copy stays honest and follows the design tells", async () => {
  const [home, css] = await Promise.all([
    read("components/home/home-sections.tsx"),
    read("components/home/home-sections.module.css"),
  ]);
  const copy = home.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gmu, "");

  assert.doesNotMatch(
    copy,
    /improves? AI output|gives? AI taste|testimonial|trusted by|users love|\d+\+? (?:users|downloads|stars)|rating/i,
  );
  // One eyebrow, in the hero only; no arrows on ordinary links.
  assert.doesNotMatch(copy, /Eyebrow|→/);
  assert.equal(copy.match(/↗/g)?.length ?? 0, 1, "only the GitHub link");
  assert.doesNotMatch(
    css,
    /backdrop-filter|border-radius: 1[2-9]px|animation:/,
  );
  assert.match(css, /@media \(max-width: 1024px\)/);
  assert.match(css, /@media \(max-width: 767px\)/);
  assert.match(css, /prefers-reduced-motion/);
});
