import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const webRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const routes = ["about", "curation", "privacy", "terms", "content-policy"];
const read = (file) => readFile(path.join(webRoot, file), "utf8");

test("public content routes replace preview shells with factual Phase 1 pages", async () => {
  const pages = await Promise.all(
    routes.map((route) => read(`app/(site)/${route}/page.tsx`)),
  );
  for (const page of pages) {
    assert.match(page, /<PublicContentPage/);
    assert.doesNotMatch(page, /RoutePlaceholder|preview notice|before launch/i);
    assert.doesNotMatch(page, /fetch\(|<form|Sign in|account dashboard/i);
  }
  // About derives its counts from the catalogue instead of hard-coding them.
  assert.match(
    pages[0],
    /\$\{counts\.sources\} repository-managed resources across \$\{counts\.categories\} practical categories/,
  );
  assert.match(pages[0], /getBrowsableSourceCounts\(\)/);
  assert.doesNotMatch(pages[0], /\b295\b/);
  assert.match(pages[1], /pricing, licensing, availability/i);
  assert.match(pages[2], /do not write to your browser's local storage/i);
  assert.doesNotMatch(pages[2], /\bSaved\b|save a resource/i);
  assert.match(pages[3], /not an endorsement, warranty, licence grant/i);
  assert.match(pages[4], /Remote SVG markup is never injected/i);
});

test("public content frame is semantic and responsive", async () => {
  const [component, styles] = await Promise.all([
    read("components/public-content/public-content-page.tsx"),
    read("components/public-content/public-content-page.module.css"),
  ]);
  assert.match(component, /id="main-content"/);
  assert.match(component, /<article className=\{styles\.article\}>/);
  assert.match(component, /aria-label="Related Tessli pages"/);
  assert.match(styles, /grid-template-columns: repeat\(12/);
  assert.match(styles, /@media \(max-width: 1024px\)/);
  assert.match(styles, /@media \(max-width: 767px\)/);
  assert.match(styles, /@media \(max-width: 480px\)/);
  assert.match(styles, /font-size: clamp\(2\.8rem, 14vw, 4\.2rem\)/);
  assert.doesNotMatch(styles, /backdrop-filter|border-radius: 1[2-9]px/);
});
