#!/usr/bin/env node
// Build a local mirror of the stock shadcn base registry for sandboxes where
// ui.shadcn.com cannot be reached.
//
// The Taste Bench builder runs `npx shadcn@4.21.4 add <component>` in both
// conditions; the CLI fetches the base registry from ui.shadcn.com unless
// REGISTRY_URL points elsewhere. This script rebuilds the parts the bench uses
// from the shadcn-ui/ui sources at the CLI's own release tag, so both
// conditions can be served the same, frozen copy:
//
//   r/index.json                     apps/v4/public/r/index.json (verbatim)
//   r/styles/index.json              apps/v4/public/r/styles/index.json (verbatim)
//   r/colors/neutral.json            apps/v4/public/r/colors/neutral.json (verbatim)
//   r/styles/new-york-v4/<name>.json one registry item per entry of the new-york-v4
//                                    ui, lib and hooks _registry.ts, with file contents
//
// It is a reconstruction, not a byte copy of ui.shadcn.com (whose new-york-v4
// items are generated at deploy time and are not in the repository). Two
// deliberate differences, the same for every build: components import `cn`
// from the project's `@/lib/utils` (the starter's alias) instead of the `cn`
// package, and the `utils` item serves the clsx + tailwind-merge helper the
// starter already has. Items whose source files are absent at the tag (the
// deprecated `toast`) are skipped and listed.
//
// The sources are fetched with git (a shallow, blobless, sparse clone of the
// tag into a temporary directory, removed afterwards) and the tag must resolve
// to the pinned commit. No network access is needed once the mirror exists, and
// nothing is added to any package.json.
//
//   node bench/scripts/build_shadcn_mirror.mjs --out /tmp/shadcn-mirror > /tmp/shadcn-mirror.sha256
//   python3 -m http.server 4200 --bind 127.0.0.1 --directory /tmp/shadcn-mirror
//   REGISTRY_URL=http://127.0.0.1:4200/r npx shadcn@4.21.4 add button
//
// stdout is a SHA-256 manifest of every file in the mirror (`sha256sum -c`
// format, paths relative to --out, sorted); stderr ends with the mirror hash,
// the SHA-256 of that manifest, which is what the operator freezes. The output
// is deterministic: the same tag gives the same bytes and the same hash.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import vm from "node:vm";

export const SHADCN_REPO = "https://github.com/shadcn-ui/ui";
export const SHADCN_TAG = "shadcn@4.21.4";
// What SHADCN_TAG pointed at when the bench was set up (`git ls-remote`, peeled).
// A moved tag is refused rather than silently mirrored.
export const SHADCN_COMMIT = "3464245c4513b7998b1d11fa9c67b71cc1534dc7";
export const STYLE = "new-york-v4";

const REGISTRY_DIR = `apps/v4/registry/${STYLE}`;
const PUBLIC_DIR = "apps/v4/public/r";
const REGISTRY_SOURCES = [
  { file: "ui/_registry.ts", exportName: "ui" },
  { file: "lib/_registry.ts", exportName: "lib" },
  { file: "hooks/_registry.ts", exportName: "hooks" },
];
const VERBATIM = [
  { from: `${PUBLIC_DIR}/index.json`, to: "r/index.json" },
  { from: `${PUBLIC_DIR}/styles/index.json`, to: "r/styles/index.json" },
  { from: `${PUBLIC_DIR}/colors/neutral.json`, to: "r/colors/neutral.json" },
];
const ITEM_SCHEMA = "https://ui.shadcn.com/schema/registry-item.json";
// Key order of a built registry item (shadcn's registry-item schema).
const ITEM_KEYS = [
  "name",
  "type",
  "title",
  "author",
  "description",
  "dependencies",
  "devDependencies",
  "registryDependencies",
  "files",
  "tailwind",
  "cssVars",
  "css",
  "envVars",
  "meta",
  "docs",
  "categories",
];
export const UTILS_CONTENT = `import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`;

/** Point `cn` imports at the project's utils alias, as the starter's components.json expects. */
export function rewriteImports(content) {
  return content.replace(/(\bfrom\s+)(["'])cn\2/g, "$1$2@/lib/utils$2");
}

/**
 * Read the item array from one of shadcn's `_registry.ts` files. They are a
 * single typed object literal: `import { type Registry } from "shadcn/schema"`
 * then `export const <name>: Registry["items"] = [ ... ]`. The type import and
 * annotation are removed and the literal is evaluated in an empty context
 * (pinned-commit sources only); anything else in the file is refused.
 */
export function parseRegistrySource(source, exportName) {
  const header = new RegExp(
    `^export const ${exportName}: Registry\\["items"\\] = `,
    "m",
  );
  const match = header.exec(source);
  if (!match)
    throw new Error(
      `no \`export const ${exportName}: Registry["items"]\` found`,
    );
  const before = source.slice(0, match.index).trim();
  if (
    before !== "" &&
    before !== 'import { type Registry } from "shadcn/schema"'
  ) {
    throw new Error(
      `unexpected code before the ${exportName} registry: ${before.slice(0, 80)}`,
    );
  }
  const literal = source.slice(match.index + match[0].length).trim();
  const items = vm.runInNewContext(
    `(${literal.replace(/;$/, "")})`,
    Object.create(null),
    { timeout: 1000 },
  );
  if (!Array.isArray(items))
    throw new Error(`${exportName} registry is not an array`);
  // Round-trip through JSON so the result holds plain objects from this realm.
  return JSON.parse(JSON.stringify(items));
}

/**
 * Build one registry item with its file contents, in the schema's key order,
 * or return null when a source file is absent. `readSource(relativePath)`
 * returns a file under the style's registry directory, or null.
 */
export function buildItem(item, readSource) {
  const files = [];
  for (const file of item.files ?? []) {
    let content;
    if (file.path === "lib/utils.ts") {
      content = UTILS_CONTENT;
    } else {
      const source = readSource(file.path);
      if (source === null) return null;
      content = rewriteImports(source);
    }
    files.push({
      path: `registry/${STYLE}/${file.path}`,
      content,
      type: file.type,
    });
  }
  const built = { $schema: ITEM_SCHEMA };
  for (const key of ITEM_KEYS) {
    if (key === "files") built.files = files;
    else if (key === "dependencies" && item.name === "utils")
      built.dependencies = ["clsx", "tailwind-merge"];
    else if (item[key] !== undefined) built[key] = item[key];
  }
  return built;
}

/** `sha256sum`-format lines for every file under `dir`, sorted by path. */
export function manifestLines(dir) {
  const files = [];
  const walk = (relative) => {
    for (const entry of readdirSync(path.join(dir, relative), {
      withFileTypes: true,
    })) {
      const child = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(child);
      else files.push(child);
    }
  };
  walk("");
  // Code-unit order, independent of locale and of the file system's listing order.
  files.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return files.map(
    (file) =>
      `${createHash("sha256")
        .update(readFileSync(path.join(dir, file)))
        .digest("hex")}  ${file}`,
  );
}

function git(args, cwd) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  }).trim();
}

function fetchSources(tempDir) {
  const checkout = path.join(tempDir, "ui");
  git([
    "clone",
    "--quiet",
    "--depth",
    "1",
    "--branch",
    SHADCN_TAG,
    "--filter=blob:none",
    "--no-checkout",
    SHADCN_REPO,
    checkout,
  ]);
  const commit = git(["rev-parse", "HEAD"], checkout);
  if (commit !== SHADCN_COMMIT) {
    throw new Error(
      `${SHADCN_TAG} resolves to ${commit}, not the pinned ${SHADCN_COMMIT}; refusing to mirror it`,
    );
  }
  const patterns = [
    `/${REGISTRY_DIR}/ui/`,
    `/${REGISTRY_DIR}/lib/`,
    `/${REGISTRY_DIR}/hooks/`,
    ...VERBATIM.map(({ from }) => `/${from}`),
  ];
  git(
    ["-c", "gc.auto=0", "sparse-checkout", "set", "--no-cone", ...patterns],
    checkout,
  );
  git(["-c", "gc.auto=0", "checkout", "--quiet"], checkout);
  return checkout;
}

function usage(message) {
  process.stderr.write(
    `${message}\nUsage: node bench/scripts/build_shadcn_mirror.mjs --out <new-directory>\n`,
  );
  process.exit(2);
}

function main() {
  const index = process.argv.indexOf("--out");
  const outArg = index === -1 ? undefined : process.argv[index + 1];
  if (!outArg) usage("--out is required");
  const out = path.resolve(outArg);
  const repoRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "..",
  );
  if (out === repoRoot || out.startsWith(repoRoot + path.sep))
    usage(
      `--out ${out} is inside the repository; the mirror is never committed`,
    );
  if (existsSync(out) && readdirSync(out).length > 0)
    usage(`--out ${out} already exists and is not empty`);

  const tempDir = mkdtempSync(path.join(os.tmpdir(), "shadcn-src-"));
  try {
    const checkout = fetchSources(tempDir);
    const registryDir = path.join(checkout, REGISTRY_DIR);
    const readSource = (relative) => {
      const file = path.join(registryDir, relative);
      return existsSync(file) ? readFileSync(file, "utf8") : null;
    };
    const items = REGISTRY_SOURCES.flatMap(({ file, exportName }) =>
      parseRegistrySource(
        readFileSync(path.join(registryDir, file), "utf8"),
        exportName,
      ),
    );

    const styleDir = path.join(out, "r", "styles", STYLE);
    mkdirSync(styleDir, { recursive: true });
    mkdirSync(path.join(out, "r", "colors"), { recursive: true });
    const written = [];
    const skipped = [];
    for (const item of items) {
      const built = buildItem(item, readSource);
      if (built === null) {
        skipped.push(item.name);
        continue;
      }
      writeFileSync(
        path.join(styleDir, `${item.name}.json`),
        JSON.stringify(built, null, 2) + "\n",
      );
      written.push(item.name);
    }
    for (const { from, to } of VERBATIM) {
      writeFileSync(
        path.join(out, to),
        readFileSync(path.join(checkout, from)),
      );
    }

    const lines = manifestLines(out);
    const manifest = lines.join("\n") + "\n";
    process.stdout.write(manifest);
    process.stderr.write(
      [
        `shadcn ${SHADCN_TAG} (${SHADCN_COMMIT}), style ${STYLE}`,
        `items written (${written.length}): ${written.join(" ")}`,
        `items skipped, sources absent at the tag (${skipped.length}): ${skipped.join(" ") || "none"}`,
        `files: ${lines.length}`,
        `mirror sha256 (SHA-256 of the manifest on stdout): ${createHash("sha256").update(manifest).digest("hex")}`,
        `serve: python3 -m http.server 4200 --bind 127.0.0.1 --directory ${out}`,
        `use:   REGISTRY_URL=http://127.0.0.1:4200/r`,
        "",
      ].join("\n"),
    );
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`build_shadcn_mirror: ${error.message}\n`);
    process.exit(1);
  }
}
