import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { test } from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const webRoot = path.resolve(path.dirname(currentFile), "..");
const repositoryRoot = path.resolve(webRoot, "..");

async function read(relativePath) {
  return readFile(path.join(webRoot, relativePath), "utf8");
}

test("package scripts and runtime constraints are present", async () => {
  const packageJson = JSON.parse(await read("package.json"));

  assert.equal(packageJson.private, true);
  assert.equal(packageJson.engines.node, ">=22.0.0");
  assert.equal(packageJson.dependencies.next, "16.2.12");

  for (const script of [
    "dev",
    "build",
    "start",
    "typecheck",
    "lint",
    "test",
    "format:check",
    "registry:build",
    "registry:check",
    "test:items",
  ]) {
    assert.equal(typeof packageJson.scripts[script], "string");
  }
  assert.match(packageJson.scripts.check, /npm run registry:check/);
});

test("App Router root layout owns html and body", async () => {
  const layout = await read("app/layout.tsx");

  assert.match(layout, /<html\s+lang="en"/);
  // next/font variables sit on <html> so :root tokens such as --font-display resolve.
  assert.match(
    layout,
    /<html[^>]*className=\{`\$\{interfaceFont\.variable\} \$\{displayFont\.variable\}`\}/,
  );
  assert.match(layout, /<body>/);
  assert.match(layout, /\{children\}/);
  assert.match(layout, /import "\.\/globals\.css"/);
});

test("Tailwind CSS v4 PostCSS pipeline is configured", async () => {
  const postcssConfig = await read("postcss.config.mjs");
  const globalCss = await read("app/globals.css");

  assert.match(postcssConfig, /@tailwindcss\/postcss/);
  assert.match(globalCss, /@import "tailwindcss";/);
});

test("repository root deploys the Next.js workspace without a static fallback", async () => {
  const legacyIndexPath = path.join(repositoryRoot, "index.html");
  const vercelConfig = JSON.parse(
    await readFile(path.join(repositoryRoot, "vercel.json"), "utf8"),
  );

  await assert.rejects(access(legacyIndexPath, constants.F_OK), {
    code: "ENOENT",
  });
  assert.deepEqual(vercelConfig.builds, [
    {
      src: "web/package.json",
      use: "@vercel/next",
    },
  ]);
});
