// Library registry builder. Reads web/registry/items/<slug>/ and rules/<ID>.md
// and produces, in memory, every generated file: the root registry.json that
// `shadcn add online-scope-lab/tessli/<name>` reads, one shadcn item JSON per
// item (plus the `rules` item) under web/public/r/, the site's
// web/data/library.json and web/data/rules.json, the agent index
// rules/TESSLI.md and the preview index web/registry/__index__.tsx.
// Deterministic and offline: same inputs, same bytes. build-registry.mjs writes
// the files; `--check` compares them.
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";
import * as prettier from "prettier";
import { parse as parseYaml } from "yaml";

import { formatSchemaErrors } from "./schema-messages.mjs";
import {
  itemRuleProblems,
  loadRules,
  RULE_SCHEMA_PATH,
  RULES_DATA_PATH,
  rulesData,
  rulesRegistryItem,
  TESSLI_INDEX_MAX_BYTES,
  TESSLI_INDEX_PATH,
  tessliIndex,
} from "./rules-lib.mjs";

export const WEB_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
export const REPO_ROOT = path.resolve(WEB_ROOT, "..");

export const ITEMS_DIR = "web/registry/items";
export const TEMPLATE_DIR = "web/registry/_template";
export const TEMPLATE_ITEM_FILE = "example-item.tsx";
export const SHADCN_UI_DIR = "web/registry/shadcn/ui";
export const SCHEMA_PATH = "schemas/library-item.schema.json";
export const REGISTRY_PATH = "registry.json";
export const PUBLIC_ITEMS_DIR = "web/public/r";
/**
 * The flat registry index served next to the item files, so a hosted
 * `<origin>/r/{name}.json` registry (the shadcn directory format) resolves
 * `registry` too. Same content as the root registry.json.
 */
export const PUBLIC_REGISTRY_INDEX = `${PUBLIC_ITEMS_DIR}/registry.json`;
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

/** Where a contributor reads how to fix a problem the build reports. */
export const FIX_GUIDE = [
  "Fix each problem above, then run `npm run registry:build` again (in web/).",
  `The full field list is ${SCHEMA_PATH}; a filled-in example is web/registry/items/pricing-tiers/.`,
  'Step by step: CONTRIBUTING.md, "Contribute an item".',
];

/** Advice for rules the item schema can only express with if/then/else. */
const ITEM_HINTS = {
  status:
    "Contributors leave `status: community`, `reviewed_by: []` and `reviewed_at: null`; only a maintainer signs an item reviewed, with their handle and the date.",
  reviewed_by:
    "Contributors leave `status: community`, `reviewed_by: []` and `reviewed_at: null`; only a maintainer signs an item reviewed, with their handle and the date.",
  reviewed_at:
    "Contributors leave `status: community`, `reviewed_by: []` and `reviewed_at: null`; only a maintainer signs an item reviewed, with their handle and the date.",
  source_url:
    "Adapted work names where it came from (`source_url`) and its licence (`source_license`).",
  source_license:
    "Adapted work names where it came from (`source_url`) and its licence (`source_license`).",
  "#/allOf/1/else/not":
    "`source_url` and `source_license` are only for `provenance: adapted`; remove them for original work.",
  rules: "List 3–8 existing rule ids such as H-01 (see rules/TESSLI.md).",
  contributors: "GitHub handles without the @.",
};

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
    verbose: true,
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

function schemaProblems(validate, label, schema) {
  return formatSchemaErrors(validate.errors, {
    label,
    schema,
    schemaPath: SCHEMA_PATH,
    hints: ITEM_HINTS,
    rootName: "the frontmatter",
  });
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

async function analyseItemImports(source, label, webDependencies, repoRoot) {
  const problems = [];
  const registryDependencies = new Set();
  const dependencies = new Set();
  for (const specifier of importSpecifiers(source)) {
    const ui = SHADCN_UI_IMPORT.exec(specifier);
    if (ui) {
      const file = path.join(repoRoot, SHADCN_UI_DIR, `${ui[1]}.tsx`);
      if (!(await exists(file))) {
        problems.push(
          `${label}: imports ${specifier}, but ${SHADCN_UI_DIR}/${ui[1]}.tsx is not vendored. Copy the primitive from shadcn/ui (https://ui.shadcn.com/docs/components/${ui[1]}) into ${SHADCN_UI_DIR}/ in the same PR, or use one that is already there.`,
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
        `${label}: imports the package ${name}, which is not a dependency of web/package.json. Use what web/package.json already has, or add ${name} there with a one-line reason in the PR description.`,
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

/**
 * Values copied unchanged from web/registry/_template/notes.md. A field that
 * still holds one was not filled in.
 */
function templatePlaceholders(frontmatter, body, template, label) {
  if (!template) return [];
  const problems = [];
  const fields = [
    "title",
    "summary",
    "use_when",
    "avoid_when",
    "ai_default",
    "why_this_is_better",
    "failures",
    "a11y",
  ];
  const same = (value, templateValue) =>
    JSON.stringify(value) === JSON.stringify(templateValue);
  for (const field of fields) {
    const value = frontmatter[field];
    const templateValue = template.frontmatter[field];
    const copied = Array.isArray(value)
      ? value.some((entry) => templateValue?.includes(entry))
      : same(value, templateValue);
    if (copied) {
      problems.push(
        `${label}/notes.md: \`${field}\` still has the template's example text; describe this item.`,
      );
    }
  }
  for (const side of ["desktop", "mobile"]) {
    if (
      frontmatter.responsive?.[side] === template.frontmatter.responsive?.[side]
    ) {
      problems.push(
        `${label}/notes.md: \`responsive.${side}\` still has the template's example text; describe this item.`,
      );
    }
  }
  for (const handle of template.frontmatter.contributors ?? []) {
    if (frontmatter.contributors.includes(handle)) {
      problems.push(
        `${label}/notes.md: \`contributors\` still lists the placeholder "${handle}"; put your GitHub handle (and the designer's, if you built a submitted design).`,
      );
    }
  }
  if (body === template.body) {
    problems.push(
      `${label}/notes.md: the prose after the frontmatter is still the template's; explain this item in a few short paragraphs.`,
    );
  }
  return problems;
}

async function loadItem(slug, validate, webDependencies, context) {
  const { repoRoot, template, schema } = context;
  const dir = path.join(repoRoot, ITEMS_DIR, slug);
  const label = `${ITEMS_DIR}/${slug}`;
  const problems = [];

  if (!SLUG_PATTERN.test(slug)) {
    return {
      problems: [
        `${label}: the folder name must be a lowercase, hyphenated slug such as "pricing-tiers"; rename the folder.`,
      ],
    };
  }

  const files = (await readdir(dir)).sort();
  const itemFile = `${slug}.tsx`;
  const allowed = new Set([itemFile, ...REQUIRED_FILES, ...OPTIONAL_FILES]);
  const keptTemplateFile =
    !files.includes(itemFile) && files.includes(TEMPLATE_ITEM_FILE);
  for (const required of [itemFile, ...REQUIRED_FILES]) {
    if (files.includes(required)) continue;
    if (required === itemFile && keptTemplateFile) {
      problems.push(
        `${label}: missing ${itemFile}. Rename ${TEMPLATE_ITEM_FILE} to ${itemFile} and update the "./example-item" imports in demo.tsx and states.tsx.`,
      );
    } else {
      problems.push(
        `${label}: missing ${required}. Copy it from ${TEMPLATE_DIR}/.`,
      );
    }
  }
  for (const file of files) {
    if (
      !allowed.has(file) &&
      !(keptTemplateFile && file === TEMPLATE_ITEM_FILE)
    ) {
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
    problems.push(...schemaProblems(validate, `${label}/notes.md`, schema));
    return { problems };
  }
  if (frontmatter.id !== slug) {
    problems.push(
      `${label}/notes.md: id "${frontmatter.id}" must equal the folder name "${slug}"; set \`id: ${slug}\`.`,
    );
  }
  problems.push(...templatePlaceholders(frontmatter, body, template, label));
  if (!body) {
    problems.push(
      `${label}/notes.md: add a short prose explanation after the frontmatter.`,
    );
  }

  const extraStates = frontmatter.states.slice(1);
  const hasStatesFile = files.includes("states.tsx");
  if (extraStates.length && !hasStatesFile) {
    problems.push(
      `${label}: notes.md lists states ${extraStates.join(", ")}, so states.tsx must export them (\`export const states = { "${extraStates[0]}": Component }\`; see ${TEMPLATE_DIR}/states.tsx). With one state, list only that state.`,
    );
  }
  if (hasStatesFile) {
    const keys = statesExportKeys(
      await readFile(path.join(dir, "states.tsx"), "utf8"),
    );
    if (!keys) {
      problems.push(
        `${label}/states.tsx: must export \`const states = { … }\` keyed by state name (see ${TEMPLATE_DIR}/states.tsx), or be deleted if the item has one state.`,
      );
    } else {
      const expected = [...extraStates].sort().join(", ");
      const actual = [...keys].sort().join(", ");
      if (expected !== actual) {
        problems.push(
          `${label}/states.tsx: exports states [${actual}], but notes.md lists [${expected}] after the first state. Make the \`states\` keys in states.tsx and the names after the first in notes.md \`states\` match.`,
        );
      }
    }
  }

  const source = await readFile(path.join(dir, itemFile), "utf8");
  const analysis = await analyseItemImports(
    source,
    `${label}/${itemFile}`,
    webDependencies,
    repoRoot,
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

async function readTemplate(repoRoot) {
  try {
    return parseNotes(
      await readFile(path.join(repoRoot, TEMPLATE_DIR, "notes.md"), "utf8"),
      `${TEMPLATE_DIR}/notes.md`,
    );
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

/**
 * Builds every generated file in memory.
 * @param {{repoRoot?: string}} [options] repoRoot defaults to this checkout;
 *   tests pass a temporary copy to exercise contributor mistakes.
 * @returns {Promise<{files: Map<string, string>, items: object[], rules: object[]}>} repo-relative path → contents
 */
export async function buildRegistry({ repoRoot = REPO_ROOT } = {}) {
  const schema = JSON.parse(
    await readFile(path.join(repoRoot, SCHEMA_PATH), "utf8"),
  );
  const validate = compileItemSchema(schema);
  const ruleSchema = JSON.parse(
    await readFile(path.join(repoRoot, RULE_SCHEMA_PATH), "utf8"),
  );
  const ruleLoad = await loadRules(
    repoRoot,
    compileItemSchema(ruleSchema),
    parseNotes,
    ruleSchema,
  );
  const webPackage = JSON.parse(
    await readFile(path.join(repoRoot, "web/package.json"), "utf8"),
  );
  const webDependencies = new Set(Object.keys(webPackage.dependencies ?? {}));
  const context = { repoRoot, schema, template: await readTemplate(repoRoot) };

  const entries = await readdir(path.join(repoRoot, ITEMS_DIR), {
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
    const result = await loadItem(slug, validate, webDependencies, context);
    problems.push(...result.problems);
    if (result.item) items.push(result.item);
  }
  const { rules } = ruleLoad;
  const rulesName = rulesRegistryItem(rules, SITE_ORIGIN).name;
  for (const reserved of [rulesName, "registry"]) {
    if (slugs.includes(reserved)) {
      problems.push(
        `${ITEMS_DIR}/${reserved}: "${reserved}" is a reserved registry name; choose another slug.`,
      );
    }
  }
  problems.push(
    ...ruleLoad.problems,
    ...itemRuleProblems(items, rules, ITEMS_DIR),
  );
  const index = tessliIndex(rules, SITE_ORIGIN);
  const indexBytes = Buffer.byteLength(index);
  if (indexBytes >= TESSLI_INDEX_MAX_BYTES) {
    problems.push(
      `${TESSLI_INDEX_PATH}: ${indexBytes} bytes; it must stay under ${TESSLI_INDEX_MAX_BYTES}. Shorten rule statements or checks.`,
    );
  }
  if (problems.length) throw new RegistryError(problems);

  const registryItems = items.map(registryItem);
  const rulesItem = rulesRegistryItem(rules, SITE_ORIGIN);
  const files = new Map();

  const registryIndex = {
    $schema: "https://ui.shadcn.com/schema/registry.json",
    name: REGISTRY_NAME,
    homepage: `${SITE_ORIGIN}/library`,
    items: [...registryItems, rulesItem],
  };
  files.set(REGISTRY_PATH, `${JSON.stringify(registryIndex, null, 2)}\n`);
  files.set(
    PUBLIC_REGISTRY_INDEX,
    await formatted(
      JSON.stringify(registryIndex),
      path.join(repoRoot, PUBLIC_REGISTRY_INDEX),
    ),
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
      await formatted(JSON.stringify(publicItem), path.join(repoRoot, target)),
    );
  }

  const rulesTarget = `${PUBLIC_ITEMS_DIR}/${rulesItem.name}.json`;
  files.set(
    rulesTarget,
    await formatted(
      JSON.stringify({
        $schema: "https://ui.shadcn.com/schema/registry-item.json",
        ...rulesItem,
        files: rulesItem.files.map((file) => ({ ...file, content: index })),
      }),
      path.join(repoRoot, rulesTarget),
    ),
  );
  files.set(TESSLI_INDEX_PATH, index);
  files.set(
    RULES_DATA_PATH,
    await formatted(
      JSON.stringify(rulesData(rules, items, index)),
      path.join(repoRoot, RULES_DATA_PATH),
    ),
  );

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
      path.join(repoRoot, LIBRARY_DATA_PATH),
    ),
  );

  files.set(
    PREVIEW_INDEX_PATH,
    await formatted(
      previewIndexSource(items),
      path.join(repoRoot, PREVIEW_INDEX_PATH),
    ),
  );

  return { files, items, rules };
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
