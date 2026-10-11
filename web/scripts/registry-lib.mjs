// Library registry builder. Reads web/registry/items/<slug>/ and produces, in
// memory, every generated file: the root registry.json that `shadcn add
// online-scope-lab/tessli/<slug>` reads, one shadcn item JSON per item under
// web/public/r/, the site's web/data/library.json and the preview index
// web/registry/__index__.tsx. Deterministic and offline: same inputs, same
// bytes. build-registry.mjs writes the files; `--check` compares them.
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";
import * as prettier from "prettier";
import { parse as parseYaml } from "yaml";

export const WEB_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
export const REPO_ROOT = path.resolve(WEB_ROOT, "..");

export const ITEMS_DIR = "web/registry/items";
export const SHADCN_UI_DIR = "web/registry/shadcn/ui";
export const SCHEMA_PATH = "schemas/library-item.schema.json";
export const REGISTRY_PATH = "registry.json";
export const PUBLIC_ITEMS_DIR = "web/public/r";
export const LIBRARY_DATA_PATH = "web/data/library.json";
export const PREVIEW_INDEX_PATH = "web/registry/__index__.tsx";

export const REGISTRY_NAME = "tessli";
export const SITE_ORIGIN = "https://tessli.vercel.app";
export const GITHUB_REGISTRY = "online-scope-lab/tessli";

/** Item kind → shadcn registry item type. */
export const KIND_TO_TYPE = {
  component: "registry:component",
  section: "registry:block",
  page: "registry:block",
};

export const CATEGORY_LABELS = {
  hero: "Hero",
  features: "Features",
  pricing: "Pricing",
  "social-proof": "Social proof",
  faq: "FAQ",
  cta: "Call to action",
  settings: "Settings",
  tables: "Tables",
  dashboards: "Dashboards",
  forms: "Forms",
  auth: "Sign-in and sign-up",
  "empty-states": "Empty states",
  navigation: "Navigation",
  mobile: "Mobile",
};

const SLUG_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u;
const REQUIRED_FILES = ["demo.tsx", "notes.md"];
const OPTIONAL_FILES = ["states.tsx", "default.png"];
const SHADCN_UI_IMPORT = /^@\/registry\/shadcn\/ui\/([a-z0-9-]+)$/u;
const SHADCN_UTILS_IMPORT = "@/registry/shadcn/lib/utils";
const BUILTIN_PACKAGES = new Set(["react", "react-dom"]);

export class RegistryError extends Error {
  constructor(problems) {
    super(problems.join("\n"));
    this.problems = problems;
  }
}

function validIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function validHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function compileItemSchema(schema) {
  const ajv = new Ajv2020({
    allErrors: true,
    formats: { date: validIsoDate, uri: validHttpUrl },
  });
  return ajv.compile(schema);
}

/** Trims every string (folded YAML scalars end in a newline). */
function trimStrings(value) {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(trimStrings);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, trimStrings(entry)]),
    );
  }
  return value;
}

/** Splits notes.md into its YAML frontmatter and Markdown body. */
export function parseNotes(text, label) {
  const normalized = text.replace(/\r\n?/gu, "\n");
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/u.exec(normalized);
  if (!match) {
    throw new RegistryError([
      `${label}: must start with YAML frontmatter between two "---" lines.`,
    ]);
  }
  let frontmatter;
  try {
    frontmatter = parseYaml(match[1]);
  } catch (error) {
    throw new RegistryError([
      `${label}: frontmatter is not valid YAML (${error.message}).`,
    ]);
  }
  return { frontmatter: trimStrings(frontmatter), body: match[2].trim() };
}

function schemaProblems(validate, label) {
  return (validate.errors ?? []).map(
    (error) =>
      `${label}${error.instancePath || ""} ${error.message}${
        error.keyword === "additionalProperties"
          ? `: ${error.params.additionalProperty}`
          : ""
      }`,
  );
}

/** Module specifiers of static imports and re-exports. */
export function importSpecifiers(source) {
  const specifiers = new Set();
  const pattern =
    /^\s*(?:import|export)\s+(?:type\s+)?(?:[\w*{}\s,$]+?\s+from\s+)?["']([^"']+)["']/gmu;
  for (const match of source.matchAll(pattern)) specifiers.add(match[1]);
  return [...specifiers];
}

function packageName(specifier) {
  const parts = specifier.split("/");
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}

async function exists(file) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

async function analyseItemImports(source, label, webDependencies) {
  const problems = [];
  const registryDependencies = new Set();
  const dependencies = new Set();
  for (const specifier of importSpecifiers(source)) {
    const ui = SHADCN_UI_IMPORT.exec(specifier);
    if (ui) {
      const file = path.join(REPO_ROOT, SHADCN_UI_DIR, `${ui[1]}.tsx`);
      if (!(await exists(file))) {
        problems.push(
          `${label}: imports ${specifier}, but ${SHADCN_UI_DIR}/${ui[1]}.tsx is not vendored.`,
        );
      }
      registryDependencies.add(ui[1]);
      continue;
    }
    if (specifier === SHADCN_UTILS_IMPORT) continue;
    if (specifier.startsWith(".") || specifier.startsWith("@/")) {
      problems.push(
        `${label}: imports ${specifier}. An item is one file; it may import only shadcn primitives ("@/registry/shadcn/ui/<name>"), "${SHADCN_UTILS_IMPORT}" and npm packages.`,
      );
      continue;
    }
    const name = packageName(specifier);
    if (BUILTIN_PACKAGES.has(name)) continue;
    if (!webDependencies.has(name)) {
      problems.push(
        `${label}: imports the package ${name}, which is not a dependency of web/package.json.`,
      );
    }
    dependencies.add(name);
  }
  return {
    problems,
    registryDependencies: [...registryDependencies].sort(),
    dependencies: [...dependencies].sort(),
  };
}

function statesExportKeys(source) {
  const block = /export\s+const\s+states\s*=\s*\{([\s\S]*?)\n\}/u.exec(source);
  if (!block) return null;
  return [
    ...block[1].matchAll(/^\s*(?:"([^"]+)"|([A-Za-z_$][\w$]*))\s*:/gmu),
  ].map((match) => match[1] ?? match[2]);
}

async function loadItem(slug, validate, webDependencies) {
  const dir = path.join(REPO_ROOT, ITEMS_DIR, slug);
  const label = `${ITEMS_DIR}/${slug}`;
  const problems = [];

  if (!SLUG_PATTERN.test(slug)) {
    return { problems: [`${label}: folder name must be a lowercase slug.`] };
  }

  const files = (await readdir(dir)).sort();
  const itemFile = `${slug}.tsx`;
  const allowed = new Set([itemFile, ...REQUIRED_FILES, ...OPTIONAL_FILES]);
  for (const required of [itemFile, ...REQUIRED_FILES]) {
    if (!files.includes(required))
      problems.push(`${label}: missing ${required}.`);
  }
  for (const file of files) {
    if (!allowed.has(file)) {
      problems.push(
        `${label}: unexpected file ${file}. An item folder holds ${itemFile}, demo.tsx, notes.md and optionally states.tsx and default.png.`,
      );
    }
  }
  if (problems.length) return { problems };

  let notes;
  try {
    notes = parseNotes(
      await readFile(path.join(dir, "notes.md"), "utf8"),
      `${label}/notes.md`,
    );
  } catch (error) {
    if (error instanceof RegistryError) return { problems: error.problems };
    throw error;
  }
  const { frontmatter, body } = notes;
  if (!validate(frontmatter)) {
    problems.push(...schemaProblems(validate, `${label}/notes.md`));
    return { problems };
  }
  if (frontmatter.id !== slug) {
    problems.push(
      `${label}/notes.md: id "${frontmatter.id}" must equal the folder name "${slug}".`,
    );
  }
  if (!body) {
    problems.push(
      `${label}/notes.md: add a short prose explanation after the frontmatter.`,
    );
  }

  const extraStates = frontmatter.states.slice(1);
  const hasStatesFile = files.includes("states.tsx");
  if (extraStates.length && !hasStatesFile) {
    problems.push(
      `${label}: notes.md lists states ${extraStates.join(", ")}, so states.tsx must export them.`,
    );
  }
  if (hasStatesFile) {
    const keys = statesExportKeys(
      await readFile(path.join(dir, "states.tsx"), "utf8"),
    );
    if (!keys) {
      problems.push(
        `${label}/states.tsx: must export \`const states = { … }\` keyed by state name.`,
      );
    } else {
      const expected = [...extraStates].sort().join(", ");
      const actual = [...keys].sort().join(", ");
      if (expected !== actual) {
        problems.push(
          `${label}/states.tsx: exports states [${actual}], but notes.md lists [${expected}] after the first state.`,
        );
      }
    }
  }

  const source = await readFile(path.join(dir, itemFile), "utf8");
  const analysis = await analyseItemImports(
    source,
    `${label}/${itemFile}`,
    webDependencies,
  );
  problems.push(...analysis.problems);

  return {
    problems,
    item: {
      slug,
      notes: frontmatter,
      body,
      source,
      hasStates: hasStatesFile,
      registryDependencies: analysis.registryDependencies,
      dependencies: analysis.dependencies,
    },
  };
}

function registryItem(item) {
  const { slug, notes } = item;
  return {
    name: slug,
    type: KIND_TO_TYPE[notes.kind],
    title: notes.title,
    description: notes.summary,
    registryDependencies: item.registryDependencies,
    dependencies: item.dependencies,
    files: [
      {
        path: `${ITEMS_DIR}/${slug}/${slug}.tsx`,
        type: "registry:component",
      },
    ],
    categories: [notes.category],
    docs: `Taste notes, states and rules: ${SITE_ORIGIN}/library/${slug}`,
    meta: { tessli: notes },
  };
}

function pascalCase(slug) {
  return slug
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("");
}

function previewIndexSource(items) {
  const lines = [
    "// Generated by `npm run registry:build` from web/registry/items. Do not edit.",
    'import type { ComponentType } from "react";',
    "",
  ];
  for (const item of items) {
    const name = pascalCase(item.slug);
    lines.push(`import ${name}Demo from "./items/${item.slug}/demo";`);
    if (item.hasStates) {
      lines.push(
        `import { states as ${name}States } from "./items/${item.slug}/states";`,
      );
    }
  }
  lines.push(
    "",
    "/** Every item's preview states; the first renders demo.tsx. */",
    "export const previews: Record<",
    "  string,",
    "  Readonly<Record<string, ComponentType>>",
    "> = {",
  );
  for (const item of items) {
    const name = pascalCase(item.slug);
    const [first, ...rest] = item.notes.states;
    lines.push(`  ${JSON.stringify(item.slug)}: {`);
    lines.push(`    ${JSON.stringify(first)}: ${name}Demo,`);
    for (const state of rest) {
      lines.push(
        `    ${JSON.stringify(state)}: ${name}States[${JSON.stringify(state)}],`,
      );
    }
    lines.push("  },");
  }
  lines.push("};", "");
  return lines.join("\n");
}

async function formatted(text, filepath) {
  const options = (await prettier.resolveConfig(filepath)) ?? {};
  return prettier.format(text, { ...options, filepath });
}

/**
 * Builds every generated file in memory.
 * @returns {Promise<{files: Map<string, string>, items: object[]}>} repo-relative path → contents
 */
export async function buildRegistry() {
  const schema = JSON.parse(
    await readFile(path.join(REPO_ROOT, SCHEMA_PATH), "utf8"),
  );
  const validate = compileItemSchema(schema);
  const webPackage = JSON.parse(
    await readFile(path.join(WEB_ROOT, "package.json"), "utf8"),
  );
  const webDependencies = new Set(Object.keys(webPackage.dependencies ?? {}));

  const entries = await readdir(path.join(REPO_ROOT, ITEMS_DIR), {
    withFileTypes: true,
  });
  const slugs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const strays = entries.filter((entry) => !entry.isDirectory());

  const problems = strays.map(
    (entry) =>
      `${ITEMS_DIR}: unexpected file ${entry.name}; items are folders.`,
  );
  const items = [];
  for (const slug of slugs) {
    const result = await loadItem(slug, validate, webDependencies);
    problems.push(...result.problems);
    if (result.item) items.push(result.item);
  }
  if (problems.length) throw new RegistryError(problems);

  const registryItems = items.map(registryItem);
  const files = new Map();

  files.set(
    REGISTRY_PATH,
    `${JSON.stringify(
      {
        $schema: "https://ui.shadcn.com/schema/registry.json",
        name: REGISTRY_NAME,
        homepage: `${SITE_ORIGIN}/library`,
        items: registryItems,
      },
      null,
      2,
    )}\n`,
  );

  for (const [index, item] of items.entries()) {
    const registryEntry = registryItems[index];
    const publicItem = {
      $schema: "https://ui.shadcn.com/schema/registry-item.json",
      ...registryEntry,
      files: registryEntry.files.map((file) => ({
        ...file,
        content: item.source,
      })),
    };
    const target = `${PUBLIC_ITEMS_DIR}/${item.slug}.json`;
    files.set(
      target,
      await formatted(JSON.stringify(publicItem), path.join(REPO_ROOT, target)),
    );
  }

  const library = {
    version: 1,
    generatedBy: "web/scripts/build-registry.mjs",
    installPrefix: `npx shadcn@latest add ${GITHUB_REGISTRY}/`,
    categories: Object.entries(CATEGORY_LABELS).map(([id, label]) => ({
      id,
      label,
    })),
    items: items.map((item, index) => ({
      slug: item.slug,
      type: registryItems[index].type,
      notes: item.notes,
      body: item.body,
      registryDependencies: item.registryDependencies,
      dependencies: item.dependencies,
      sourcePath: `${ITEMS_DIR}/${item.slug}/${item.slug}.tsx`,
      source: item.source,
    })),
  };
  files.set(
    LIBRARY_DATA_PATH,
    await formatted(
      JSON.stringify(library),
      path.join(REPO_ROOT, LIBRARY_DATA_PATH),
    ),
  );

  files.set(
    PREVIEW_INDEX_PATH,
    await formatted(
      previewIndexSource(items),
      path.join(REPO_ROOT, PREVIEW_INDEX_PATH),
    ),
  );

  return { files, items };
}

/** Generated files on disk that the current build would not write (removed items). */
export async function staleGeneratedFiles(files) {
  const dir = path.join(REPO_ROOT, PUBLIC_ITEMS_DIR);
  let names = [];
  try {
    names = await readdir(dir);
  } catch {
    return [];
  }
  return names
    .map((name) => `${PUBLIC_ITEMS_DIR}/${name}`)
    .filter((file) => !files.has(file))
    .sort();
}
