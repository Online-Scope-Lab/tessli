// Unit tests for the pure helpers in bench/scripts/build_shadcn_mirror.mjs.
// No network: fetching the sources is exercised by running the script itself.
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import {
  STYLE,
  UTILS_CONTENT,
  buildItem,
  manifestLines,
  parseRegistrySource,
  rewriteImports,
} from "../scripts/build_shadcn_mirror.mjs";

test("rewriteImports points cn imports at the project's utils alias", () => {
  assert.equal(
    rewriteImports('import { cn } from "cn"\n'),
    'import { cn } from "@/lib/utils"\n',
  );
  assert.equal(
    rewriteImports("import { cn } from 'cn'"),
    "import { cn } from '@/lib/utils'",
  );
  assert.equal(
    rewriteImports('export { cn } from "cn"'),
    'export { cn } from "@/lib/utils"',
  );
});

test("rewriteImports leaves every other import alone", () => {
  const source = [
    'import { cva } from "class-variance-authority"',
    'import { Button } from "@/registry/new-york-v4/ui/button"',
    'import { clsx } from "cnfast"',
    'import x from "cn/lite"',
    'const label = "from \\"cn\\" is text"',
  ].join("\n");
  assert.equal(rewriteImports(source), source);
});

test("parseRegistrySource reads a typed registry literal, template strings included", () => {
  const source = `import { type Registry } from "shadcn/schema"

export const ui: Registry["items"] = [
  {
    name: "tooltip",
    type: "registry:ui",
    dependencies: ["radix-ui"],
    docs: \`Wrap your app:

\\\`\\\`\\\`tsx
import { TooltipProvider } from "@/components/ui/tooltip"
\\\`\\\`\\\`
\`,
    files: [{ path: "ui/tooltip.tsx", type: "registry:ui" }],
  },
]
`;
  const items = parseRegistrySource(source, "ui");
  assert.equal(items.length, 1);
  assert.equal(items[0].name, "tooltip");
  assert.match(
    items[0].docs,
    /^Wrap your app:\n\n```tsx\nimport \{ TooltipProvider \}/,
  );
});

test("parseRegistrySource refuses anything but the expected shape", () => {
  assert.throws(
    () => parseRegistrySource('export const ui = [{ name: "x" }]', "ui"),
    /no `export const ui/,
  );
  assert.throws(
    () =>
      parseRegistrySource(
        'import fs from "node:fs"\nexport const ui: Registry["items"] = []',
        "ui",
      ),
    /unexpected code/,
  );
  assert.throws(
    () =>
      parseRegistrySource('export const lib: Registry["items"] = {}', "lib"),
    /not an array/,
  );
});

test("buildItem inlines file contents in the schema's key order", () => {
  const sources = {
    "ui/badge.tsx": 'import { cn } from "cn"\nexport function Badge() {}\n',
  };
  const built = buildItem(
    {
      docs: "note",
      files: [{ path: "ui/badge.tsx", type: "registry:ui" }],
      dependencies: ["radix-ui"],
      type: "registry:ui",
      name: "badge",
    },
    (relative) => sources[relative] ?? null,
  );
  assert.deepEqual(Object.keys(built), [
    "$schema",
    "name",
    "type",
    "dependencies",
    "files",
    "docs",
  ]);
  assert.deepEqual(built.files, [
    {
      path: `registry/${STYLE}/ui/badge.tsx`,
      content: 'import { cn } from "@/lib/utils"\nexport function Badge() {}\n',
      type: "registry:ui",
    },
  ]);
});

test("buildItem serves the starter's utils helper and skips items with missing sources", () => {
  const utils = buildItem(
    {
      name: "utils",
      type: "registry:lib",
      dependencies: ["cn"],
      files: [{ path: "lib/utils.ts", type: "registry:lib" }],
    },
    () => null,
  );
  assert.deepEqual(utils.dependencies, ["clsx", "tailwind-merge"]);
  assert.equal(utils.files[0].content, UTILS_CONTENT);
  const toast = buildItem(
    {
      name: "toast",
      type: "registry:ui",
      files: [{ path: "ui/toast.tsx", type: "registry:ui" }],
    },
    () => null,
  );
  assert.equal(toast, null);
});

test("manifestLines hashes every file in code-unit path order", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "mirror-test-"));
  try {
    mkdirSync(path.join(dir, "r", "styles"), { recursive: true });
    writeFileSync(path.join(dir, "r", "styles", "index.json"), "[]\n");
    writeFileSync(path.join(dir, "r", "index.json"), "abc");
    writeFileSync(path.join(dir, "r", "Z.json"), "");
    assert.deepEqual(manifestLines(dir), [
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855  r/Z.json",
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad  r/index.json",
      "37517e5f3dc66819f61f5a7bb8ace1921282415f10551d2defa5c3eb0985b570  r/styles/index.json",
    ]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
