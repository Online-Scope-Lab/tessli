import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const SOURCE_PATH = "lib_data/design-resource-library-295.csv";
export const SCHEMA_PATH = "schemas/catalogue.schema.json";
export const CATALOGUE_PATH = "web/data/catalogue.json";
export const REPORT_PATH = "web/data/catalogue-validation.json";

export const SOURCE_HEADERS = [
  "ID",
  "Category",
  "Website",
  "URL",
  "Access",
  "Subscription required?",
  "Website is for",
];

export const CATEGORY_DEFINITIONS = [
  {
    sourceLabel: "Website inspiration and design directories",
    id: "website-inspiration",
    shortLabel: "Inspiration",
    description:
      "Curated galleries and directories for studying websites, sections, and visual direction.",
    icon: "sparkles",
    expectedCount: 40,
  },
  {
    sourceLabel: "Product UI, UX flows, and mobile-app inspiration",
    id: "product-ui-ux",
    shortLabel: "Product UI",
    description:
      "Real product screens, flows, interaction details, and mobile-interface references.",
    icon: "devices",
    expectedCount: 25,
  },
  {
    sourceLabel:
      "Landing pages, SaaS, ecommerce, email, and marketing inspiration",
    id: "landing-marketing",
    shortLabel: "Landing & marketing",
    description:
      "Landing pages, ecommerce, lifecycle email, advertising, and marketing examples.",
    icon: "layout",
    expectedCount: 25,
  },
  {
    sourceLabel: "UI component and frontend libraries",
    id: "ui-libraries",
    shortLabel: "UI libraries",
    description:
      "Frontend components, primitives, templates, and implementation-oriented UI libraries.",
    icon: "blocks",
    expectedCount: 45,
  },
  {
    sourceLabel: "Design systems and pattern libraries",
    id: "design-systems",
    shortLabel: "Design systems",
    description:
      "Public design systems, pattern libraries, guidelines, and reusable product conventions.",
    icon: "system",
    expectedCount: 25,
  },
  {
    sourceLabel: "Motion, animation, WebGL, and 3D",
    id: "motion-3d",
    shortLabel: "Motion & 3D",
    description:
      "Animation, motion-design, WebGL, 3D, interaction, and creative-coding resources.",
    icon: "motion",
    expectedCount: 20,
  },
  {
    sourceLabel: "Typography, fonts, and type tools",
    id: "typography",
    shortLabel: "Typography",
    description:
      "Type inspiration, font discovery, pairing, specimen, and typography-production tools.",
    icon: "type",
    expectedCount: 20,
  },
  {
    sourceLabel: "Color, gradients, and accessibility",
    id: "color-accessibility",
    shortLabel: "Color & accessibility",
    description:
      "Color systems, palettes, gradients, contrast, and accessibility-supporting tools.",
    icon: "contrast",
    expectedCount: 20,
  },
  {
    sourceLabel: "Icon libraries and icon tools",
    id: "icons",
    shortLabel: "Icons",
    description:
      "Icon libraries, search tools, generators, and production-ready symbol systems.",
    icon: "icons",
    expectedCount: 30,
  },
  {
    sourceLabel: "Illustrations, mockups, assets, and stock",
    id: "visual-assets",
    shortLabel: "Visual assets",
    description:
      "Illustrations, mockups, photography, stock media, and reusable visual assets.",
    icon: "image",
    expectedCount: 25,
  },
  {
    sourceLabel: "Design tools, AI UI tools, and visual builders",
    id: "design-tools-ai",
    shortLabel: "Design & AI tools",
    description:
      "Design applications, AI-assisted UI tools, prototyping systems, and visual builders.",
    icon: "wand",
    expectedCount: 20,
  },
].map((category, order) => ({ ...category, order }));

export const ACCESS_MAP = new Map([
  ["Free", "free"],
  ["Freemium", "freemium"],
  ["Paid", "paid"],
  ["Open source", "open-source"],
  ["Free trial", "free-trial"],
]);

export const SUBSCRIPTION_MAP = new Map([
  ["No", "no"],
  ["Optional", "optional"],
  ["Yes", "yes"],
  ["After trial", "after-trial"],
]);

export const EXPECTED_ACCESS_COUNTS = {
  free: 130,
  freemium: 75,
  paid: 8,
  "open-source": 81,
  "free-trial": 1,
};

function repoRootFromModule() {
  const currentFile = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(currentFile), "../..");
}

export function parseCsv(input) {
  const text = input.replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"') {
      if (field.length > 0) {
        throw new Error(`Unexpected quote at character ${index}.`);
      }
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && text[index + 1] === "\n") {
        index += 1;
      }
      row.push(field);
      field = "";
      if (row.some((value) => value.length > 0)) {
        rows.push(row);
      }
      row = [];
    } else {
      field += character;
    }
  }

  if (quoted) {
    throw new Error("CSV ended inside a quoted field.");
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((value) => value.length > 0)) {
      rows.push(row);
    }
  }

  return rows;
}

export function slugify(value) {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return slug || "resource";
}

function normalizedUrlKey(value) {
  const url = new URL(value);
  url.hash = "";
  url.hostname = url.hostname.toLowerCase();
  if (url.pathname === "/") {
    url.pathname = "";
  }
  return url.toString().replace(/\/$/, "");
}

function domainFromUrl(value) {
  return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
}

// Resource IDs are frozen: each row stores its ID explicitly and the ID is
// never recomputed from the URL, so fixing a URL cannot change an ID.
const RESOURCE_ID_PATTERN = /^resource-[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function sourceProvenanceSha256(source) {
  const normalized = source.toString("utf8").replace(/\r\n?/g, "\n");
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}

function issue(code, message, details = {}) {
  return { code, message, ...details };
}

function compareHeaders(actual) {
  return (
    actual.length === SOURCE_HEADERS.length &&
    actual.every((header, index) => header === SOURCE_HEADERS[index])
  );
}

function objectShapeErrors(value, requiredKeys, allowedKeys, label) {
  const missingKeys = requiredKeys.filter((key) => !Object.hasOwn(value, key));
  const unexpectedKeys = Object.keys(value).filter(
    (key) => !allowedKeys.includes(key),
  );
  const errors = [];

  if (missingKeys.length > 0) {
    errors.push(
      `${label} is missing required keys: ${missingKeys.join(", ")}.`,
    );
  }
  if (unexpectedKeys.length > 0) {
    errors.push(`${label} has unexpected keys: ${unexpectedKeys.join(", ")}.`);
  }

  return errors;
}

export function validateCatalogueAgainstSchema(catalogue, schema) {
  const errors = [];
  const identifierPattern = new RegExp(schema.$defs.identifier.pattern);
  const resourceSchema = schema.$defs.resource;
  const categorySchema = schema.$defs.category;
  const accessValues = new Set(resourceSchema.properties.access.enum);
  const subscriptionValues = new Set(
    resourceSchema.properties.subscriptionRequired.enum,
  );
  const statusValues = new Set(resourceSchema.properties.status.enum);

  if (catalogue.version !== schema.properties.version.const) {
    errors.push("Catalogue version does not match the schema constant.");
  }

  errors.push(
    ...objectShapeErrors(
      catalogue,
      schema.required,
      Object.keys(schema.properties),
      "Catalogue",
    ),
  );

  if (catalogue.source.path !== SOURCE_PATH) {
    errors.push("Catalogue source path is not the approved CSV path.");
  }
  if (!/^[a-f0-9]{64}$/.test(catalogue.source.sha256)) {
    errors.push("Catalogue source SHA-256 is invalid.");
  }
  if (catalogue.source.rowCount !== catalogue.resources.length) {
    errors.push(
      "Catalogue source row count does not equal the resource count.",
    );
  }

  const expectedCategoryCount = schema.properties.categories.minItems;
  if (
    catalogue.categories.length !== expectedCategoryCount ||
    catalogue.categories.length !== schema.properties.categories.maxItems
  ) {
    errors.push(
      `Catalogue must contain exactly ${expectedCategoryCount} categories.`,
    );
  }

  const categoryIds = new Set();
  for (const category of catalogue.categories) {
    errors.push(
      ...objectShapeErrors(
        category,
        categorySchema.required,
        Object.keys(categorySchema.properties),
        `Category ${category.id ?? "<unknown>"}`,
      ),
    );
    if (!identifierPattern.test(category.id)) {
      errors.push(`Category identifier is invalid: ${category.id}`);
    }
    if (categoryIds.has(category.id)) {
      errors.push(`Duplicate category identifier: ${category.id}`);
    }
    categoryIds.add(category.id);
    for (const field of ["label", "shortLabel", "description", "icon"]) {
      if (
        typeof category[field] !== "string" ||
        category[field].trim() === ""
      ) {
        errors.push(`Category ${category.id} has an invalid ${field}.`);
      }
    }
    if (!Number.isInteger(category.order) || category.order < 0) {
      errors.push(`Category ${category.id} has an invalid order.`);
    }
  }

  const ids = new Set();
  const slugs = new Set();
  for (const resource of catalogue.resources) {
    errors.push(
      ...objectShapeErrors(
        resource,
        resourceSchema.required,
        Object.keys(resourceSchema.properties),
        `Resource ${resource.id ?? "<unknown>"}`,
      ),
    );
    if (!identifierPattern.test(resource.id)) {
      errors.push(`Resource identifier is invalid: ${resource.id}`);
    }
    if (!identifierPattern.test(resource.slug)) {
      errors.push(`Resource slug is invalid: ${resource.slug}`);
    }
    if (ids.has(resource.id)) {
      errors.push(`Duplicate resource identifier: ${resource.id}`);
    }
    if (slugs.has(resource.slug)) {
      errors.push(`Duplicate resource slug: ${resource.slug}`);
    }
    ids.add(resource.id);
    slugs.add(resource.slug);

    if (typeof resource.name !== "string" || resource.name.trim() === "") {
      errors.push(`Resource ${resource.id} has an invalid name.`);
    }
    if (
      typeof resource.description !== "string" ||
      resource.description.trim() === ""
    ) {
      errors.push(`Resource ${resource.id} has an invalid description.`);
    }
    try {
      const url = new URL(resource.url);
      if (!new Set(["http:", "https:"]).has(url.protocol)) {
        errors.push(`Resource ${resource.id} uses a non-HTTP URL.`);
      }
    } catch {
      errors.push(`Resource ${resource.id} has an invalid URL.`);
    }
    if (!/^[A-Za-z0-9.-]+$/.test(resource.domain)) {
      errors.push(`Resource ${resource.id} has an invalid domain.`);
    }
    if (!categoryIds.has(resource.category)) {
      errors.push(`Resource ${resource.id} references an unknown category.`);
    }
    if (!accessValues.has(resource.access)) {
      errors.push(`Resource ${resource.id} has an invalid access value.`);
    }
    if (!subscriptionValues.has(resource.subscriptionRequired)) {
      errors.push(`Resource ${resource.id} has an invalid subscription value.`);
    }
    if (!statusValues.has(resource.status)) {
      errors.push(`Resource ${resource.id} has an invalid status.`);
    }
    for (const field of ["usefulFor", "tags"]) {
      if (!Array.isArray(resource[field])) {
        errors.push(`Resource ${resource.id} has a non-array ${field}.`);
      }
    }
  }

  if (
    !Array.isArray(catalogue.collections) ||
    catalogue.collections.length !== 0
  ) {
    errors.push("Slice 4.1 catalogue collections must be an empty array.");
  }

  return errors;
}

function serialize(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export async function buildCatalogue(options = {}) {
  const root = options.root ?? repoRootFromModule();
  const sourcePath = path.join(root, SOURCE_PATH);
  const schemaPath = path.join(root, SCHEMA_PATH);
  const [sourceBuffer, schemaText] = await Promise.all([
    readFile(sourcePath),
    readFile(schemaPath, "utf8"),
  ]);
  const sourceSha256 = sourceProvenanceSha256(sourceBuffer);
  const rows = parseCsv(sourceBuffer.toString("utf8"));
  const headers = rows.shift() ?? [];
  const errors = [];
  const warnings = [];

  if (!compareHeaders(headers)) {
    errors.push(
      issue(
        "invalid-headers",
        "CSV headers do not match the approved source contract.",
        {
          actual: headers,
          expected: SOURCE_HEADERS,
        },
      ),
    );
  }

  const categoryBySourceLabel = new Map(
    CATEGORY_DEFINITIONS.map((category) => [category.sourceLabel, category]),
  );
  const usedSlugs = new Map();
  const usedIds = new Map();
  const urlOccurrences = new Map();
  const domainOccurrences = new Map();
  const categoryCounts = new Map(
    CATEGORY_DEFINITIONS.map((category) => [category.id, 0]),
  );
  const accessCounts = Object.fromEntries(
    Object.keys(EXPECTED_ACCESS_COUNTS).map((access) => [access, 0]),
  );
  const subscriptionCounts = {
    no: 0,
    optional: 0,
    yes: 0,
    "after-trial": 0,
  };
  const resources = [];
  const slugCollisions = [];

  rows.forEach((columns, rowIndex) => {
    const sourceRow = rowIndex + 2;
    if (columns.length !== SOURCE_HEADERS.length) {
      errors.push(
        issue(
          "invalid-column-count",
          `Row ${sourceRow} has ${columns.length} columns.`,
          {
            row: sourceRow,
            expected: SOURCE_HEADERS.length,
          },
        ),
      );
      return;
    }

    const [
      storedId,
      categoryLabel,
      name,
      rawUrl,
      accessLabel,
      subscriptionLabel,
      description,
    ] = columns.map((value) => value.trim());
    const category = categoryBySourceLabel.get(categoryLabel);
    const access = ACCESS_MAP.get(accessLabel);
    const subscriptionRequired = SUBSCRIPTION_MAP.get(subscriptionLabel);

    if (!category) {
      errors.push(
        issue(
          "unknown-category",
          `Row ${sourceRow} uses an unknown category.`,
          {
            row: sourceRow,
            value: categoryLabel,
          },
        ),
      );
    }
    if (!access) {
      errors.push(
        issue(
          "unknown-access",
          `Row ${sourceRow} uses an unknown access label.`,
          {
            row: sourceRow,
            value: accessLabel,
          },
        ),
      );
    }
    if (!subscriptionRequired) {
      errors.push(
        issue(
          "unknown-subscription",
          `Row ${sourceRow} uses an unknown subscription label.`,
          { row: sourceRow, value: subscriptionLabel },
        ),
      );
    }
    if (!RESOURCE_ID_PATTERN.test(storedId)) {
      errors.push(
        issue("invalid-id", `Row ${sourceRow} has no valid stored ID.`, {
          row: sourceRow,
          value: storedId,
        }),
      );
    } else if (usedIds.has(storedId)) {
      errors.push(
        issue("duplicate-id", `Row ${sourceRow} reuses a stored ID.`, {
          row: sourceRow,
          value: storedId,
          firstRow: usedIds.get(storedId),
        }),
      );
    } else {
      usedIds.set(storedId, sourceRow);
    }
    if (!name) {
      errors.push(
        issue("missing-name", `Row ${sourceRow} has no website name.`, {
          row: sourceRow,
        }),
      );
    }
    if (!description) {
      errors.push(
        issue("missing-description", `Row ${sourceRow} has no description.`, {
          row: sourceRow,
          name,
        }),
      );
    }

    let domain = "";
    let urlKey = "";
    try {
      const parsed = new URL(rawUrl);
      if (!new Set(["http:", "https:"]).has(parsed.protocol)) {
        throw new Error("Only HTTP and HTTPS URLs are allowed.");
      }
      domain = domainFromUrl(rawUrl);
      urlKey = normalizedUrlKey(rawUrl);
    } catch (error) {
      errors.push(
        issue("invalid-url", `Row ${sourceRow} has an invalid URL.`, {
          row: sourceRow,
          name,
          url: rawUrl,
          reason: error instanceof Error ? error.message : "Unknown URL error",
        }),
      );
    }

    if (
      usedIds.get(storedId) !== sourceRow ||
      !category ||
      !access ||
      !subscriptionRequired ||
      !name ||
      !description ||
      !domain
    ) {
      return;
    }

    const baseSlug = slugify(name);
    const previousSlugCount = usedSlugs.get(baseSlug) ?? 0;
    const slugCount = previousSlugCount + 1;
    usedSlugs.set(baseSlug, slugCount);
    const slug = slugCount === 1 ? baseSlug : `${baseSlug}-${slugCount}`;
    if (slugCount > 1) {
      slugCollisions.push({
        baseSlug,
        resolvedSlug: slug,
        row: sourceRow,
        name,
      });
    }

    const resource = {
      id: storedId,
      slug,
      name,
      url: rawUrl,
      domain,
      description,
      category: category.id,
      access,
      subscriptionRequired,
      usefulFor: [],
      tags: [],
      status: "active",
    };
    resources.push(resource);
    categoryCounts.set(category.id, (categoryCounts.get(category.id) ?? 0) + 1);
    accessCounts[access] = (accessCounts[access] ?? 0) + 1;
    subscriptionCounts[subscriptionRequired] += 1;

    const urlEntries = urlOccurrences.get(urlKey) ?? [];
    urlEntries.push({ row: sourceRow, name });
    urlOccurrences.set(urlKey, urlEntries);

    const domainEntries = domainOccurrences.get(domain) ?? [];
    domainEntries.push({ row: sourceRow, name, url: rawUrl });
    domainOccurrences.set(domain, domainEntries);
  });

  if (rows.length !== 295) {
    errors.push(
      issue(
        "source-row-count",
        `Expected 295 source rows but found ${rows.length}.`,
        {
          expected: 295,
          actual: rows.length,
        },
      ),
    );
  }
  if (resources.length !== rows.length) {
    errors.push(
      issue(
        "generated-row-count",
        "Not every source row produced a resource.",
        {
          sourceRows: rows.length,
          resources: resources.length,
        },
      ),
    );
  }

  for (const category of CATEGORY_DEFINITIONS) {
    const actual = categoryCounts.get(category.id) ?? 0;
    if (actual !== category.expectedCount) {
      errors.push(
        issue(
          "category-count",
          `Category ${category.id} has an unexpected row count.`,
          {
            category: category.id,
            expected: category.expectedCount,
            actual,
          },
        ),
      );
    }
  }

  for (const [access, expected] of Object.entries(EXPECTED_ACCESS_COUNTS)) {
    const actual = accessCounts[access] ?? 0;
    if (actual !== expected) {
      errors.push(
        issue(
          "access-count",
          `Access model ${access} has an unexpected row count.`,
          {
            access,
            expected,
            actual,
          },
        ),
      );
    }
  }

  const duplicateUrls = [...urlOccurrences.entries()]
    .filter(([, entries]) => entries.length > 1)
    .map(([url, entries]) => ({ url, entries }));
  for (const duplicate of duplicateUrls) {
    errors.push(
      issue(
        "duplicate-url",
        "Multiple rows resolve to the same normalized URL.",
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
        "Multiple curated resources share a domain and require human review, not automatic removal.",
        duplicate,
      ),
    );
  }
  for (const collision of slugCollisions) {
    warnings.push(
      issue(
        "slug-collision",
        "A duplicate base slug received a deterministic suffix.",
        collision,
      ),
    );
  }

  const categories = CATEGORY_DEFINITIONS.map((category) => ({
    id: category.id,
    label: category.sourceLabel,
    shortLabel: category.shortLabel,
    description: category.description,
    icon: category.icon,
    order: category.order,
  }));

  const catalogue = {
    version: 1,
    source: {
      path: SOURCE_PATH,
      sha256: sourceSha256,
      rowCount: rows.length,
    },
    resources,
    categories,
    collections: [],
  };

  const schema = JSON.parse(schemaText);
  for (const message of validateCatalogueAgainstSchema(catalogue, schema)) {
    errors.push(issue("schema-contract", message));
  }

  const report = {
    version: 1,
    source: catalogue.source,
    summary: {
      resources: resources.length,
      categories: categories.length,
      access: accessCounts,
      subscriptionRequired: subscriptionCounts,
    },
    categoryCounts: CATEGORY_DEFINITIONS.map((category) => ({
      category: category.id,
      label: category.sourceLabel,
      expected: category.expectedCount,
      actual: categoryCounts.get(category.id) ?? 0,
    })),
    duplicates: {
      urls: duplicateUrls,
      domains: duplicateDomains,
    },
    slugCollisions,
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
