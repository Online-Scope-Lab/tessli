// Builds the library registry from web/registry/items.
//   npm run registry:build   writes registry.json (repo root), web/public/r/*.json,
//                            web/data/library.json, web/data/rules.json,
//                            rules/TESSLI.md and web/registry/__index__.tsx
//   npm run registry:check   fails if any of them differs from a fresh build
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  buildRegistry,
  FIX_GUIDE,
  REPO_ROOT,
  RegistryError,
  staleGeneratedFiles,
} from "./registry-lib.mjs";

const check = process.argv.includes("--check");

let result;
try {
  result = await buildRegistry();
} catch (error) {
  if (error instanceof RegistryError) {
    console.error(
      `Library registry is invalid (${error.problems.length} problem${error.problems.length === 1 ? "" : "s"}):`,
    );
    for (const problem of error.problems) console.error(`- ${problem}`);
    console.error("");
    for (const line of FIX_GUIDE) console.error(line);
    process.exit(1);
  }
  throw error;
}

const { files, items, rules } = result;
const stale = await staleGeneratedFiles(files);

if (check) {
  const drift = [];
  for (const [file, contents] of files) {
    let current = null;
    try {
      current = await readFile(path.join(REPO_ROOT, file), "utf8");
    } catch {
      // missing counts as drift
    }
    if (current !== contents) drift.push(file);
  }
  drift.push(...stale.map((file) => `${file} (no longer generated)`));
  if (drift.length) {
    console.error(
      "Library registry drift: these generated files do not match a fresh build. Run `npm run registry:build` in web/ and commit every file it changes:",
    );
    for (const file of drift) console.error(`- ${file}`);
    process.exit(1);
  }
  console.log(
    `Library registry is up to date (${items.length} items, ${rules.length} rules, ${files.size} generated files).`,
  );
} else {
  for (const [file, contents] of files) {
    const target = path.join(REPO_ROOT, file);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, contents);
  }
  for (const file of stale) await rm(path.join(REPO_ROOT, file));
  console.log(
    `Wrote ${files.size} library registry files for ${items.length} items and ${rules.length} rules.`,
  );
}
