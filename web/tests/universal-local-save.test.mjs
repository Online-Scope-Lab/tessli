import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const currentFile = fileURLToPath(import.meta.url);
const webRoot = path.resolve(path.dirname(currentFile), "..");

async function read(relativePath) {
  return readFile(path.join(webRoot, relativePath), "utf8");
}

test("collection detail uses the shared persistent resource-save surface", async () => {
  const page = await read("app/collections/[slug]/page.tsx");
  const list = await read(
    "components/collection-resources/collection-resource-list.tsx",
  );

  assert.match(page, /CollectionResourceList/);
  assert.doesNotMatch(page, /<ResourceCard/);
  assert.match(list, /readSavedResourceIds/);
  assert.match(list, /writeSavedResourceIds/);
  assert.match(list, /saved=\{savedIds\.includes\(resource\.id\)\}/);
  assert.match(list, /onSavedChange=\{handleSavedChange\}/);
  assert.match(list, /aria-live="polite"/);
});

test("save writes publish a same-document synchronization event", async () => {
  const store = await read("components/saved-resources/save-store.ts");

  assert.match(
    store,
    /savedResourceChangedEvent = "tessli:saved-resources-changed"/,
  );
  assert.match(
    store,
    /window\.dispatchEvent\(new Event\(savedResourceChangedEvent\)\)/,
  );
  assert.match(store, /storage\.setItem\(/);
  assert.match(store, /notifySavedResourceChange\(\)/);
  assert.match(store, /tessli-saved-resource-ids-v2/);
  assert.match(store, /mosaicary-saved-resources-v1/);
});

test("universal Save remains local-only and does not expand into Boards or cloud", async () => {
  const list = await read(
    "components/collection-resources/collection-resource-list.tsx",
  );
  assert.doesNotMatch(list, /fetch\(|supabase|board|account/i);
});
