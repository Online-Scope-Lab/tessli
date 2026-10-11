import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const webRoot = path.resolve(path.dirname(currentFile), "..");

async function read(relativePath) {
  return readFile(path.join(webRoot, relativePath), "utf8");
}

test("Collection detail is an ordered research checklist that starts at stage 1", async () => {
  const [page, resourceList] = await Promise.all([
    read("app/(site)/collections/[slug]/page.tsx"),
    read("components/collection-resources/collection-resource-list.tsx"),
  ]);

  assert.match(page, /notFound\(\)/);
  assert.match(page, /Goal/);
  assert.match(page, /Audience/);
  assert.match(page, /Expected decision/);
  assert.match(page, /playbook\.stages\.map/);
  assert.match(page, /Stage \{index \+ 1\}/);
  assert.match(page, /inspectPrompt=\{stage\.inspect\}/);
  assert.match(page, /decisionPrompt=\{stage\.decision\}/);
  assert.match(page, /href="#research-sequence"/);
  assert.doesNotMatch(page, /href="\/(?:boards|saved)"|\bBoards?\b/);
  assert.match(page, /Machine access/);
  assert.match(page, /collection\.json/);
  assert.match(page, /collection\.md/);
  assert.doesNotMatch(
    page,
    /Last reviewed|Repository maintained|correction process|evidence|audit/i,
  );
  assert.doesNotMatch(page, /data-collection-resource-count|<dt>Sources/);

  assert.match(resourceList, /Role — Why included/);
  assert.match(resourceList, /Inspect/);
  assert.match(resourceList, /Decision prompt/);
  assert.doesNotMatch(
    resourceList,
    /fetch\(|create(?:Browser|Server)?Client\(|board|save-store|onSavedChange/i,
  );
});

test("Collection-detail checklist recomposes and keeps focusable actions usable", async () => {
  const [pageCss, resourceCss] = await Promise.all([
    read("app/(site)/collections/[slug]/collection-detail.module.css"),
    read("components/collection-resources/collection-resource-list.module.css"),
  ]);

  assert.match(pageCss, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(pageCss, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(pageCss, /grid-template-columns: 1fr/);
  assert.match(pageCss, /@media \(max-width: 480px\)/);
  assert.match(pageCss, /\.breadcrumb a:focus-visible/);
  // Actions use the shared Button primitive (focus and 44px target live there).
  assert.doesNotMatch(pageCss, /\.primaryAction|\.secondaryAction/);
  assert.match(pageCss, /\.actions > \* \{\s*width: 100%;/);
  const buttonCss = await read("components/ui/button.module.css");
  assert.match(buttonCss, /min-height: 44px/);
  assert.match(resourceCss, /overflow-wrap: anywhere/);
});
