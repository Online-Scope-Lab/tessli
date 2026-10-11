import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { test } from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const webRoot = path.resolve(path.dirname(currentFile), "..");

async function read(relativePath) {
  return readFile(path.join(webRoot, relativePath), "utf8");
}

test("approved variable fonts are loaded through next/font", async () => {
  const fonts = await read("app/fonts.ts");
  const layout = await read("app/layout.tsx");

  assert.match(fonts, /Instrument_Sans/);
  assert.match(fonts, /Newsreader/);
  assert.match(fonts, /--font-newsreader/);
  assert.match(fonts, /--font-instrument-sans/);
  assert.match(layout, /interfaceFont\.variable/);
  assert.match(layout, /displayFont\.variable/);
});

test("visual tokens match the approved Tessli contract", async () => {
  const css = await read("app/globals.css");

  for (const token of [
    "--canvas: #fcf8f3",
    "--surface: #fffefc",
    "--text-strong: #151412",
    "--accent: #f05217",
    "--line: #d8d1c8",
  ]) {
    assert.match(css, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  assert.match(css, /--tracking-display: -0\.015em/);
  assert.match(css, /--tracking-title: -0\.025em/);
  assert.match(
    css,
    /\.tessli-display \{[^}]*letter-spacing: var\(--tracking-display\)/,
  );
  assert.match(
    css,
    /\.tessli-section-title \{[^}]*letter-spacing: var\(--tracking-title\)/,
  );
  assert.match(css, /\.tessli-panel[\s\S]*border-radius: 0/);
  assert.match(css, /--radius-control-md: 7px/);
});

test("grain and responsive grid safeguards are present", async () => {
  const css = await read("app/globals.css");

  assert.match(css, /html\[data-grain="on"\] body/);
  assert.match(css, /background-attachment: fixed/);
  assert.match(css, /@media \(forced-colors: active\)/);
  assert.match(css, /grid-template-columns: repeat\(12/);
  assert.match(css, /grid-template-columns: repeat\(8/);
  assert.match(
    css,
    /@media \(max-width: 767px\)[\s\S]*grid-template-columns: repeat\(4/,
  );
});

test("foundation lab contains all required specimen sections", async () => {
  const page = await read("app/lab/page.tsx");

  for (const marker of [
    "Typography with character",
    "Soothing colour comes from restraint",
    "A grid that recomposes",
    "Sharp content surfaces",
  ]) {
    assert.match(page, new RegExp(marker));
  }
});

async function listSourceFiles(relativeDirectory) {
  const entries = await readdir(path.join(webRoot, relativeDirectory), {
    recursive: true,
    withFileTypes: true,
  });
  return entries
    .filter(
      (entry) => entry.isFile() && /\.(css|tsx?|mts|mjs)$/.test(entry.name),
    )
    .map((entry) =>
      path.relative(webRoot, path.join(entry.parentPath, entry.name)),
    );
}

function definedCustomProperties(css) {
  return [...css.matchAll(/^\s*(--[\w-]+)\s*:/gm)].map((match) => match[1]);
}

// Tailwind v4 emits `@theme inline` variables only when a utility uses them,
// so a CSS module that reads one gets an undefined value at runtime. Strip
// those blocks before collecting the variables modules may read.
function withoutInlineThemeBlocks(css) {
  let output = "";
  let index = 0;
  const pattern = /@theme\s+inline\s*\{/g;
  let match;
  while ((match = pattern.exec(css))) {
    output += css.slice(index, match.index);
    let depth = 1;
    let cursor = match.index + match[0].length;
    while (depth > 0 && cursor < css.length) {
      if (css[cursor] === "{") depth += 1;
      if (css[cursor] === "}") depth -= 1;
      cursor += 1;
    }
    assert.equal(depth, 0, "unterminated @theme inline block");
    index = cursor;
    pattern.lastIndex = cursor;
  }
  return output + css.slice(index);
}

test("every CSS variable used by the app is defined exactly once", async () => {
  const globals = await read("app/globals.css");
  const fonts = await read("app/fonts.ts");
  const definitions = definedCustomProperties(globals);
  const duplicates = definitions.filter(
    (name, index) => definitions.indexOf(name) !== index,
  );
  assert.deepEqual(duplicates, [], "tokens defined more than once");

  const defined = new Set(
    definedCustomProperties(withoutInlineThemeBlocks(globals)),
  );
  assert.ok(!defined.has("--color-border"), "@theme inline must be excluded");
  assert.ok(defined.has("--border"));
  // next/font injects these through the className on <html>.
  for (const match of fonts.matchAll(/variable: "(--[\w-]+)"/g)) {
    defined.add(match[1]);
  }
  assert.ok(defined.has("--font-newsreader"));
  assert.ok(defined.has("--font-instrument-sans"));

  const files = [
    ...(await listSourceFiles("app")),
    ...(await listSourceFiles("components")),
  ];
  const sources = await Promise.all(
    files.map(async (file) => [file, await read(file)]),
  );
  // Component-scoped variables set through an inline style object.
  for (const [, source] of sources) {
    for (const match of source.matchAll(/["'](--[\w-]+)["']\s*:/g)) {
      defined.add(match[1]);
    }
  }

  const undefinedUses = [];
  for (const [file, source] of sources) {
    for (const match of source.matchAll(/var\((--[\w-]+)/g)) {
      if (!defined.has(match[1])) undefinedUses.push(`${file}: ${match[1]}`);
    }
  }
  assert.deepEqual(undefinedUses, [], "undefined CSS variables");
});

test("tokens are exposed to Tailwind and to semantic library aliases", async () => {
  const css = await read("app/globals.css");

  assert.match(css, /@theme static \{/);
  assert.match(css, /@theme inline \{/);
  for (const token of [
    "--font-display:",
    "--font-ui:",
    "--charcoal-art: #252422",
    "--color-canvas: var(--canvas)",
    "--color-ink-body: var(--text-body)",
    "--spacing-4: var(--space-4)",
    "--text-body-md: 1rem",
    "--radius-control-md: 7px",
    "--shadow-sm:",
    "--ease-standard:",
    "--default-transition-duration: var(--motion-fast)",
  ]) {
    assert.ok(css.includes(token), `missing ${token}`);
  }

  for (const alias of [
    "background",
    "foreground",
    "card",
    "card-foreground",
    "primary",
    "primary-foreground",
    "muted",
    "muted-foreground",
    "accent",
    "accent-foreground",
    "destructive",
    "border",
    "ring",
    "radius",
  ]) {
    assert.match(css, new RegExp(`^\\s*--${alias}: `, "m"), alias);
  }
  assert.doesNotMatch(css, /\.foundation-/);
});

test("the site keeps its tells sharp: one eyebrow, external-only arrows", async () => {
  const files = [
    ...(await listSourceFiles("app")),
    ...(await listSourceFiles("components")),
  ].filter((file) => /\.tsx?$/.test(file));
  const sources = await Promise.all(
    files.map(async (file) => [file, await read(file)]),
  );

  const eyebrowUsers = sources
    .filter(([, source]) =>
      /className=\{styles\.eyebrow\}|<Eyebrow\b/.test(source),
    )
    .map(([file]) => file)
    .sort();
  // The home hero, plus its specimen on the internal /lab page.
  assert.deepEqual(eyebrowUsers, [
    "app/lab/page.tsx",
    "components/explore-hero/explore-hero.tsx",
  ]);

  const arrowUsers = sources
    // "→" text or the right-arrow icon path used on internal cards.
    .filter(([, source]) => source.includes("→") || source.includes("M5 12h14"))
    .map(([file]) => file);
  assert.deepEqual(arrowUsers, [], "→ on ordinary links");
});

test("repository links use the canonical constant and the app has a Tessli icon", async () => {
  const repository = await read("lib/repository.ts");
  assert.match(
    repository,
    /export const repositoryUrl = "https:\/\/github\.com\/Online-Scope-Lab\/tessli";/,
  );

  const files = [
    ...(await listSourceFiles("app")),
    ...(await listSourceFiles("components")),
    ...(await listSourceFiles("lib")),
  ].filter((file) => file !== path.join("lib", "repository.ts"));
  for (const file of files) {
    const source = await read(file);
    assert.doesNotMatch(source, /github\.com\/[\w-]+\/tessli/i, file);
  }

  const icon = await read("app/icon.svg");
  assert.match(icon, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  for (const colour of ["#fcf8f3", "#151412", "#f05217"]) {
    assert.ok(icon.includes(colour), colour);
  }
  assert.doesNotMatch(icon, /<image|href=|<script/i);
});
