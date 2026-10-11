import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";
import { parse as parseYaml } from "yaml";

import { formatSchemaErrors } from "./schema-messages.mjs";

/** One YAML file per source: sources/<slug>.yml. */
export const SOURCES_DIR = "sources";
export const SOURCE_SCHEMA_PATH = "schemas/source.schema.json";
/** Curated order of source IDs; sources not listed follow, by category and name. */
export const SOURCE_ORDER_PATH = "lib_data/source-order.json";
export const SCHEMA_PATH = "schemas/catalogue.schema.json";
export const CATALOGUE_PATH = "web/data/catalogue.json";
export const REPORT_PATH = "web/data/catalogue-validation.json";

const SOURCE_FILE_PATTERN = /^([a-z0-9]+(?:-[a-z0-9]+)*)\.yml$/u;

/** Where a contributor reads how to fix a catalogue error. */
export const CATALOGUE_FIX_GUIDE = [
  "Fix each problem above, then run `npm run catalogue:generate` (in web/) and commit web/data/catalogue.json and web/data/catalogue-validation.json with your source file.",
  `The full field list is ${SOURCE_SCHEMA_PATH}; step by step: CONTRIBUTING.md, "Add a source".`,
];

/** Advice for rules the source schema can only express with if/then/else. */
const SOURCE_HINTS = {
  archived_reason:
    "An archived source needs `archived_reason`: one sentence on why it was archived.",
  "#/allOf/0/else/not":
    "`archived_reason` and `replaced_by` are only for `status: archived`; remove them from an active source.",
  id: 'A new source\'s id is "resource-" followed by its slug, and it never changes.',
  slug: "The slug is the file name without .yml: lowercase words joined by hyphens.",
  last_checked:
    "Write the date you opened and checked the source (YYYY-MM-DD), or null.",
};

export const CATEGORY_DEFINITIONS = [
  {
    id: "website-inspiration",
    label: "Website inspiration and design directories",
    shortLabel: "Inspiration",
    description:
      "Curated galleries and directories for studying websites, sections, and visual direction.",
    icon: "sparkles",
  },
  {
    id: "product-ui-ux",
    label: "Product UI, UX flows, and mobile-app inspiration",
    shortLabel: "Product UI",
    description:
      "Real product screens, flows, interaction details, and mobile-interface references.",
    icon: "devices",
  },
  {
    id: "landing-marketing",
    label: "Landing pages, SaaS, ecommerce, email, and marketing inspiration",
    shortLabel: "Landing & marketing",
    description:
      "Landing pages, ecommerce, lifecycle email, advertising, and marketing examples.",
    icon: "layout",
  },
  {
    id: "ui-libraries",
    label: "UI component and frontend libraries",
    shortLabel: "UI libraries",
    description:
      "Frontend components, primitives, templates, and implementation-oriented UI libraries.",
    icon: "blocks",
  },
  {
    id: "design-systems",
    label: "Design systems and pattern libraries",
    shortLabel: "Design systems",
    description:
      "Public design systems, pattern libraries, guidelines, and reusable product conventions.",
    icon: "system",
  },
  {
    id: "motion-3d",
    label: "Motion, animation, WebGL, and 3D",
    shortLabel: "Motion & 3D",
    description:
      "Animation, motion-design, WebGL, 3D, interaction, and creative-coding resources.",
    icon: "motion",
  },
  {
    id: "typography",
    label: "Typography, fonts, and type tools",
    shortLabel: "Typography",
    description:
      "Type inspiration, font discovery, pairing, specimen, and typography-production tools.",
    icon: "type",
  },
  {
    id: "color-accessibility",
    label: "Color, gradients, and accessibility",
    shortLabel: "Color & accessibility",
    description:
      "Color systems, palettes, gradients, contrast, and accessibility-supporting tools.",
    icon: "contrast",
  },
  {
    id: "icons",
    label: "Icon libraries and icon tools",
    shortLabel: "Icons",
    description:
      "Icon libraries, search tools, generators, and production-ready symbol systems.",
    icon: "icons",
  },
  {
    id: "visual-assets",
    label: "Illustrations, mockups, assets, and stock",
    shortLabel: "Visual assets",
    description:
      "Illustrations, mockups, photography, stock media, and reusable visual assets.",
    icon: "image",
  },
  {
    id: "design-tools-ai",
    label: "Design tools, AI UI tools, and visual builders",
    shortLabel: "Design & AI tools",
    description:
      "Design applications, AI-assisted UI tools, prototyping systems, and visual builders.",
    icon: "wand",
  },
].map((category, order) => ({ ...category, order }));

export const ACCESS_VALUES = [
  "free",
  "freemium",
  "paid",
  "open-source",
  "free-trial",
];

export const STATUS_VALUES = ["active", "needs-review", "archived"];

function repoRootFromModule() {
  const currentFile = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(currentFile), "../..");
}

function validIsoDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.valueOf()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

function validHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Compiles a draft 2020-12 schema with the date and URI checks Tessli uses. */
export function compileSchema(schema) {
  const ajv = new Ajv2020({
    allErrors: true,
    verbose: true,
    formats: { date: validIsoDate, uri: validHttpUrl, "date-time": true },
  });
  return ajv.compile(schema);
}

function schemaMessages(validate, label, schema, schemaPath, hints = {}) {
  return formatSchemaErrors(validate.errors, {
    label,
    schema,
    schemaPath,
    hints,
  });
}

export function domainFromUrl(value) {
  return new URL(value).hostname.toLowerCase().replace(/^www\./u, "");
}

function normalizedUrlKey(value) {
  const url = new URL(value);
  url.hash = "";
  url.hostname = url.hostname.toLowerCase();
  if (url.pathname === "/") {
    url.pathname = "";
  }
  return url.toString().replace(/\/$/u, "");
}

function normalizeText(source) {
  return source.toString("utf8").replace(/\r\n?/gu, "\n");
}

export function sourceProvenanceSha256(source) {
  return createHash("sha256")
    .update(normalizeText(source), "utf8")
    .digest("hex");
}

/** One hash over every source file name and its normalized text, in name order. */
export function sourceSetSha256(files) {
  const hash = createHash("sha256");
  for (const file of [...files].sort((left, right) =>
    compareText(left.name, right.name),
  )) {
    hash.update(`${file.name}\0${normalizeText(file.text)}\0`, "utf8");
  }
  return hash.digest("hex");
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function issue(code, message, details = {}) {
  return { code, message, ...details };
}

function serialize(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

/** Validates a generated catalogue against schemas/catalogue.schema.json. */
export function validateCatalogueAgainstSchema(catalogue, schema) {
  const validate = compileSchema(schema);
  return validate(catalogue)
    ? []
    : schemaMessages(validate, "Catalogue", schema, SCHEMA_PATH);
}

/** Maps one validated source file to its catalogue.json record. */
function toResource(source) {
  return {
    id: source.id,
    slug: source.slug,
    name: source.name,
    url: source.url,
    domain: domainFromUrl(source.url),
    description: source.summary,
    category: source.category,
    kind: source.kind,
    access: source.access,
    status: source.status,
    addedAt: source.added_at,
    addedVia: source.added_via,
    lastChecked: source.last_checked,
    ...(source.frameworks ? { frameworks: [...source.frameworks] } : {}),
    ...(source.license ? { license: source.license } : {}),
    ...(source.best_for ? { bestFor: [...source.best_for] } : {}),
    ...(source.limitations ? { limitations: [...source.limitations] } : {}),
    ...(source.replaced_by ? { replacedBy: source.replaced_by } : {}),
    ...(source.archived_reason
      ? { archivedReason: source.archived_reason }
      : {}),
    ...(source.submission_issue
      ? { submissionIssue: source.submission_issue }
      : {}),
  };
}

/**
 * Builds the catalogue from already-read source files. Pure and offline, so
 * tests can pass fixture files. Nothing is dropped silently: every file that
 * cannot become a resource is reported as a blocking error.
 *
 * @param {{ name: string, text: string }[]} files
 */
export function composeCatalogue(
  files,
  { sourceSchema, catalogueSchema, order = { version: 1, ids: [] } },
) {
  const errors = [];
  const warnings = [];
  const validateSource = compileSchema(sourceSchema);
  const categoryIds = new Set(CATEGORY_DEFINITIONS.map(({ id }) => id));
  const sources = [];
  const ids = new Map();

  for (const file of [...files].sort((left, right) =>
    compareText(left.name, right.name),
  )) {
    const label = `${SOURCES_DIR}/${file.name}`;
    const fileMatch = SOURCE_FILE_PATTERN.exec(file.name);
    if (!fileMatch) {
      errors.push(
        issue(
          "source-file-name",
          `${label}: a source file is named <slug>.yml with a lowercase, hyphenated slug (for example sources/example-patterns.yml); rename it.`,
          { file: label },
        ),
      );
      continue;
    }

    let data;
    try {
      data = parseYaml(normalizeText(file.text), { prettyErrors: true });
    } catch (error) {
      errors.push(
        issue(
          "source-yaml",
          `${label}: not valid YAML (${
            error instanceof Error
              ? error.message.split("\n")[0]
              : "unknown YAML error"
          }). Check indentation and quote values that contain ": " or start with a special character.`,
          {
            file: label,
            reason:
              error instanceof Error ? error.message : "Unknown YAML error",
          },
        ),
      );
      continue;
    }

    if (!validateSource(data)) {
      for (const message of schemaMessages(
        validateSource,
        label,
        sourceSchema,
        SOURCE_SCHEMA_PATH,
        SOURCE_HINTS,
      )) {
        errors.push(issue("source-schema", message, { file: label }));
      }
      continue;
    }

    let fileValid = true;
    if (data.slug !== fileMatch[1]) {
      errors.push(
        issue(
          "source-slug",
          `${label}: slug "${data.slug}" must equal the file name "${fileMatch[1]}"; rename the file or fix the slug.`,
          {
            file: label,
            slug: data.slug,
          },
        ),
      );
      fileValid = false;
    }
    if (!categoryIds.has(data.category)) {
      errors.push(
        issue(
          "unknown-category",
          `${label}: category "${data.category}" is not a Tessli category; use one of: ${[
            ...categoryIds,
          ].join(", ")}.`,
          {
            file: label,
            value: data.category,
          },
        ),
      );
      fileValid = false;
    }
    if (ids.has(data.id)) {
      errors.push(
        issue(
          "duplicate-id",
          `${label}: id "${data.id}" is already used by ${ids.get(data.id)}. A new source's id is "resource-" followed by its slug.`,
          {
            file: label,
            id: data.id,
            firstFile: ids.get(data.id),
          },
        ),
      );
      fileValid = false;
    } else {
      ids.set(data.id, label);
    }
    if (fileValid) sources.push({ file: label, data });
  }

  const bySlug = new Map(sources.map((source) => [source.data.slug, source]));
  const urlOccurrences = new Map();
  const domainOccurrences = new Map();

  for (const { file, data } of sources) {
    if (data.replaced_by !== undefined) {
      const target = bySlug.get(data.replaced_by);
      if (!target || data.replaced_by === data.slug) {
        errors.push(
          issue(
            "unknown-replacement",
            `${file}: replaced_by "${data.replaced_by}" must be the slug of another source in ${SOURCES_DIR}/.`,
            { file, value: data.replaced_by },
          ),
        );
      } else if (target.data.status === "archived") {
        errors.push(
          issue(
            "archived-replacement",
            `${file}: replaced_by "${data.replaced_by}" is archived itself; point it at the active source that replaces both.`,
            { file, value: data.replaced_by },
          ),
        );
      }
    }

    const urlKey = normalizedUrlKey(data.url);
    urlOccurrences.set(urlKey, [
      ...(urlOccurrences.get(urlKey) ?? []),
      { file, name: data.name },
    ]);
    if (data.status !== "archived") {
      const domain = domainFromUrl(data.url);
      domainOccurrences.set(domain, [
        ...(domainOccurrences.get(domain) ?? []),
        { file, name: data.name, url: data.url },
      ]);
    }
  }

  const duplicateUrls = [...urlOccurrences.entries()]
    .filter(([, entries]) => entries.length > 1)
    .map(([url, entries]) => ({ url, entries }));
  for (const duplicate of duplicateUrls) {
    errors.push(
      issue(
        "duplicate-url",
        `Multiple sources resolve to the same normalized URL ${duplicate.url}: ${duplicate.entries
          .map((entry) => entry.file)
          .join(
            ", ",
          )}. Keep one; if the other is a real source, archive it with archived_reason and replaced_by.`,
        duplicate,
      ),
    );
  }
  const duplicateDomains = [...domainOccurrences.entries()]
    .filter(([, entries]) => entries.length > 1)
    .map(([domain, entries]) => ({ domain, count: entries.length, entries }));
  for (const duplicate of duplicateDomains) {
    warnings.push(
      issue(
        "duplicate-domain",
        "Multiple non-archived sources share a domain and require human review, not automatic removal.",
        duplicate,
      ),
    );
  }

  const orderIds = Array.isArray(order?.ids) ? order.ids : [];
  if (order?.version !== 1 || !Array.isArray(order?.ids)) {
    errors.push(
      issue(
        "source-order",
        `${SOURCE_ORDER_PATH} must be { "version": 1, "ids": [...] }.`,
      ),
    );
  }
  const rank = new Map();
  for (const id of orderIds) {
    if (rank.has(id)) {
      errors.push(
        issue("source-order-duplicate", `${SOURCE_ORDER_PATH} repeats ${id}.`),
      );
    } else if (!ids.has(id)) {
      errors.push(
        issue(
          "source-order-unknown",
          `${SOURCE_ORDER_PATH} lists ${id}, which has no source file.`,
        ),
      );
    }
    if (!rank.has(id)) rank.set(id, rank.size);
  }

  const categoryOrder = new Map(
    CATEGORY_DEFINITIONS.map(({ id, order: position }) => [id, position]),
  );
  const resources = sources
    .map(({ data }) => data)
    .sort(
      (left, right) =>
        (rank.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
          (rank.get(right.id) ?? Number.MAX_SAFE_INTEGER) ||
        categoryOrder.get(left.category) - categoryOrder.get(right.category) ||
        compareText(left.name.toLowerCase(), right.name.toLowerCase()) ||
        compareText(left.id, right.id),
    )
    .map(toResource);

  const categories = CATEGORY_DEFINITIONS.map((category) => ({
    id: category.id,
    label: category.label,
    shortLabel: category.shortLabel,
    description: category.description,
    icon: category.icon,
    order: category.order,
  }));

  const catalogue = {
    version: 2,
    source: {
      path: SOURCES_DIR,
      sha256: sourceSetSha256(files),
      fileCount: files.length,
    },
    resources,
    categories,
    collections: [],
  };

  if (catalogueSchema) {
    for (const message of validateCatalogueAgainstSchema(
      catalogue,
      catalogueSchema,
    )) {
      errors.push(issue("schema-contract", message));
    }
  }

  const countBy = (values, key) =>
    Object.fromEntries(
      values.map((value) => [
        value,
        resources.filter((resource) => resource[key] === value).length,
      ]),
    );
  const nonArchived = resources.filter(
    (resource) => resource.status !== "archived",
  );

  const report = {
    version: 2,
    source: catalogue.source,
    summary: {
      resources: resources.length,
      status: countBy(STATUS_VALUES, "status"),
      categories: categories.length,
      access: countBy(ACCESS_VALUES, "access"),
    },
    categoryCounts: categories.map((category) => ({
      category: category.id,
      label: category.label,
      total: resources.filter((resource) => resource.category === category.id)
        .length,
      nonArchived: nonArchived.filter(
        (resource) => resource.category === category.id,
      ).length,
    })),
    duplicates: {
      urls: duplicateUrls,
      domains: duplicateDomains,
    },
    issues: {
      errors,
      warnings,
    },
  };

  return {
    catalogue,
    report,
    catalogueText: serialize(catalogue),
    reportText: serialize(report),
  };
}

/** Reads every entry of sources/ (each must be a <slug>.yml file). */
export async function readSourceFiles(root) {
  const directory = path.join(root, SOURCES_DIR);
  const entries = await readdir(directory, { withFileTypes: true });
  return Promise.all(
    entries
      .map((entry) => entry.name)
      .sort(compareText)
      .map(async (name) => ({
        name,
        text: await readFile(path.join(directory, name), "utf8"),
      })),
  );
}

export async function buildCatalogue(options = {}) {
  const root = options.root ?? repoRootFromModule();
  const [files, sourceSchemaText, catalogueSchemaText, orderText] =
    await Promise.all([
      readSourceFiles(root),
      readFile(path.join(root, SOURCE_SCHEMA_PATH), "utf8"),
      readFile(path.join(root, SCHEMA_PATH), "utf8"),
      readFile(path.join(root, SOURCE_ORDER_PATH), "utf8"),
    ]);

  return composeCatalogue(files, {
    sourceSchema: JSON.parse(sourceSchemaText),
    catalogueSchema: JSON.parse(catalogueSchemaText),
    order: JSON.parse(orderText),
  });
}
