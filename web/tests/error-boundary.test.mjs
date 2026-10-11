import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const webRoot = path.resolve(path.dirname(currentFile), "..");

test("site error boundary provides a safe recovery path", async () => {
  const errorBoundary = await readFile(
    path.join(webRoot, "app", "(site)", "error.tsx"),
    "utf8",
  );

  assert.match(errorBoundary, /^"use client";/u);
  assert.match(errorBoundary, /reset: \(\) => void/u);
  assert.match(errorBoundary, /onClick=\{reset\}/u);
  assert.match(errorBoundary, /Try again/u);
  assert.match(errorBoundary, /href="\/"/u);
  assert.match(errorBoundary, /id="main-content"/u);
  assert.doesNotMatch(errorBoundary, /error\.message|error\.stack/u);
});
