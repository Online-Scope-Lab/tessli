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

test("result derivation uses deterministic token, category, access, and name contracts", async () => {
  const state = await read(
    "components/explore-results/explore-results-state.ts",
  );

  assert.match(state, /export const explorePageSize = 48/);
  assert.match(state, /toLocaleLowerCase\("en"\)/);
  assert.match(state, /normalized\.split\(" "\)/);
  assert.match(state, /resource\.name/);
  assert.match(state, /resource\.domain/);
  assert.match(state, /resource\.description/);
  assert.match(state, /\.\.\.resource\.usefulFor/);
  assert.match(state, /\.\.\.resource\.tags/);
  assert.match(state, /resource\.category !== state\.category/);
  assert.match(state, /state\.access\.includes\(resource\.access\)/);
  assert.match(
    state,
    /tokens\.every\(\(token\) => haystack\.includes\(token\)\)/,
  );
  assert.match(state, /state\.sort === "name-desc" \? -1 : 1/);
  assert.match(state, /left\.curatedIndex - right\.curatedIndex/);
  assert.match(state, /status: "error"/);
  assert.doesNotMatch(state, /relevance|popular|trending|rating|fetch\(/i);
});

test("Explore results render semantic ready, empty, error, and load-more states", async () => {
  const results = await read("components/explore-results/explore-results.tsx");

  assert.match(results, /^"use client";/);
  assert.match(results, /data-explore-results="error"/);
  assert.match(results, /data-explore-results="empty"/);
  assert.match(results, /data-explore-results="ready"/);
  assert.match(results, /data-result-count=\{resultCount\}/);
  assert.match(
    results,
    /data-visible-result-count=\{visibleResources\.length\}/,
  );
  assert.match(results, /<ul className=\{styles\.grid\} data-resource-grid>/);
  assert.match(results, /<ResourceCard/);
  assert.doesNotMatch(results, /onSavedChange|savedResourceIds/);
  assert.match(results, /data-reset-discovery/);
  assert.match(results, /data-load-more-resources/);
  assert.match(
    results,
    /Showing \{visibleResources\.length\} of \{resultCount\}/,
  );
  assert.match(results, /All matching resources are visible/);
  assert.doesNotMatch(results, /localStorage|sessionStorage|fetch\(/);
});

test("Explore grid follows the approved three, two, one responsive contract", async () => {
  const css = await read(
    "components/explore-results/explore-results.module.css",
  );

  assert.match(css, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css, /gap: 1px/);
  assert.match(css, /border: 1px solid var\(--line\)/);
  assert.match(css, /background: var\(--line\)/);
  assert.match(css, /\.grid > li:focus-within/);
  assert.match(css, /@media \(max-width: 1023px\)/);
  assert.match(css, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 767px\)/);
  assert.match(css, /grid-template-columns: 1fr/);
  assert.match(css, /min-height: 44px/);
  assert.match(css, /@media \(forced-colors: active\)/);
  assert.doesNotMatch(css, /grid-template-columns: repeat\(4|backdrop-filter/);
});
