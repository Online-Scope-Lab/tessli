import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const webRoot = path.resolve(path.dirname(currentFile), "..");

async function read(relativePath) {
  return readFile(path.join(webRoot, relativePath), "utf8");
}

test("Explore search exposes semantic and accessible controls", async () => {
  const search = await read("components/explore-search/explore-search.tsx");

  assert.match(search, /^"use client";/);
  assert.match(search, /role="search"/);
  assert.match(search, /aria-label="Search Tessli resources"/);
  assert.match(search, /<label[\s\S]*?Search resources/);
  assert.match(search, /type="search"/);
  assert.match(search, /data-explore-search-input/);
  assert.match(search, /aria-describedby=\{statusId\}/);
  assert.match(search, /aria-label="Clear search query"/);
  assert.match(search, /aria-live="polite"/);
  assert.match(search, /aria-atomic="true"/);
  assert.match(search, /enterKeyHint="search"/);
});

test("search supports controlled URL state and live result counts", async () => {
  const [search, hero] = await Promise.all([
    read("components/explore-search/explore-search.tsx"),
    read("components/explore-hero/explore-hero.tsx"),
  ]);

  assert.match(search, /value\?: string/);
  assert.match(search, /onValueChange\?: \(query: string\) => void/);
  assert.match(search, /resultCount\?: number/);
  assert.match(search, /const query = value \?\? uncontrolledQuery/);
  assert.match(search, /onValueChange\?\.\(nextQuery\)/);
  assert.match(search, /element instanceof HTMLDialogElement/);
  assert.match(search, /action="\/resources"/);
  assert.match(search, /name="q"/);
  assert.match(hero, /resultCount=\{resultCount\}/);
});

test("keyboard interaction supports focus, clear-first Escape, and blur", async () => {
  const search = await read("components/explore-search/explore-search.tsx");

  assert.match(search, /event\.key\.toLowerCase\(\) === "k"/);
  assert.match(search, /event\.key === "\/"/);
  assert.match(
    search,
    /event\.preventDefault\(\);\s*inputRef\.current\?\.focus\(\)/,
  );
  assert.match(search, /if \(query\) \{\s*updateQuery\(""\)/);
  assert.match(search, /inputRef\.current\?\.blur\(\)/);
  assert.match(search, /modalIsOpen \|\|\s*targetIsEditable/);
});

test("visible shortcut is platform-neutral while keyboard support remains cross-platform", async () => {
  const search = await read("components/explore-search/explore-search.tsx");

  assert.match(search, /event\.metaKey \|\| event\.ctrlKey/);
  assert.match(search, /<kbd>Ctrl \/ ⌘ K<\/kbd>/);
  assert.doesNotMatch(search, /<kbd>⌘<\/kbd>/);
});

test("query state is debounced and ready for validated catalogue integration", async () => {
  const search = await read("components/explore-search/explore-search.tsx");

  assert.match(search, /onQueryChange\?: \(query: string\) => void/);
  assert.match(search, /resultCount\?: number/);
  assert.match(search, /window\.setTimeout\([\s\S]*?100/);
  assert.match(search, /onQueryChange\(normalizedQuery\)/);
  assert.match(search, /Search query entered\./);
  assert.match(search, /resources match/);
  assert.doesNotMatch(
    search,
    /fetch\(|XMLHttpRequest|localStorage|URLSearchParams|sources\/[a-z0-9-]+\.yml/,
  );
});

test("search styling keeps a visible focus treatment and touch targets", async () => {
  const css = await read("components/explore-search/explore-search.module.css");

  assert.match(css, /min-height: 56px/);
  assert.match(css, /\.form:focus-within/);
  assert.match(css, /var\(--focus\)/);
  assert.match(css, /width: 44px/);
  assert.match(css, /height: 44px/);
  assert.match(css, /border-radius: var\(--radius-control-md\)/);
  assert.doesNotMatch(css, /border-radius: 999px|var\(--radius-pill\)/);
});

test("hero facts contain only the approved truthful values", async () => {
  const facts = await read("components/explore-facts/explore-facts.tsx");

  for (const value of ["295", "11", "No account", "Open"]) {
    assert.match(facts, new RegExp(`value: "${value}"`));
  }

  for (const label of [
    "Curated resources",
    "Practical categories",
    "Needed to browse",
    "Community-built project",
  ]) {
    assert.match(facts, new RegExp(`label: "${label}"`));
  }

  assert.match(facts, /aria-label="Tessli catalogue facts"/);
  assert.doesNotMatch(facts, /users|weekly|rating|trending|popular/i);
});

test("facts use a four-column desktop row and a two-by-two responsive grid", async () => {
  const css = await read("components/explore-facts/explore-facts.module.css");

  assert.match(css, /grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 1120px\)/);
  assert.match(css, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.fact:nth-child\(n \+ 3\)/);
  assert.doesNotMatch(css, /overflow-x: scroll|overflow-x: auto/);
});
