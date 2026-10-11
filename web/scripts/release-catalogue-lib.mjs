import { readFile } from "node:fs/promises";
import { isIP } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildCatalogue,
  CATALOGUE_PATH,
  REPORT_PATH,
  sourceProvenanceSha256,
} from "./catalogue-lib.mjs";

export { CATALOGUE_PATH, REPORT_PATH };

export const COLLECTION_SOURCE_PATH = "lib_data/tessli-launch-collections.json";
export const COLLECTION_SCHEMA_PATH = "schemas/collections.schema.json";
export const MEDIA_SOURCE_PATH = "lib_data/resource-media.json";
export const MEDIA_SCHEMA_PATH = "schemas/resource-media.schema.json";

function repoRootFromModule() {
  const currentFile = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(currentFile), "../..");
}

function issue(code, message, details = {}) {
  return { code, message, ...details };
}

function serialize(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function objectShapeIssues(value, requiredKeys, allowedKeys, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [issue("invalid-shape", `${label} must be an object.`)];
  }

  const missingKeys = requiredKeys.filter((key) => !Object.hasOwn(value, key));
  const unexpectedKeys = Object.keys(value).filter(
    (key) => !allowedKeys.includes(key),
  );
  const issues = [];

  if (missingKeys.length > 0) {
    issues.push(
      issue("missing-keys", `${label} is missing required keys.`, {
        keys: missingKeys,
      }),
    );
  }
  if (unexpectedKeys.length > 0) {
    issues.push(
      issue("unexpected-keys", `${label} has unexpected keys.`, {
        keys: unexpectedKeys,
      }),
    );
  }

  return issues;
}

function validIsoDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.valueOf()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

function validBoundedString(value, schema) {
  return (
    typeof value === "string" &&
    value.trim().length >= (schema.minLength ?? 0) &&
    value.length <= (schema.maxLength ?? Number.POSITIVE_INFINITY)
  );
}

function validHttpsUrl(value) {
  if (typeof value !== "string" || value.length > 2_048) {
    return false;
  }

  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      hostname.includes(".") &&
      hostname !== "localhost" &&
      !hostname.endsWith(".localhost") &&
      !hostname.endsWith(".local") &&
      isIP(hostname) === 0
    );
  } catch {
    return false;
  }
}

function mediaFields(entry) {
  const fields = {};
  if (entry.preview) {
    fields.previewImageUrl = entry.preview.url;
  }
  if (entry.favicon) {
    fields.faviconUrl = entry.favicon.url;
  }
  return fields;
}

export function validateMediaSource(source, schema, resources) {
  const errors = [];
  errors.push(
    ...objectShapeIssues(
      source,
      schema.required,
      Object.keys(schema.properties),
      "Media source",
    ),
  );

  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return errors;
  }
  if (source.version !== schema.properties.version.const) {
    errors.push(issue("media-version", "Media source version is invalid."));
  }
  if (!Array.isArray(source.resources)) {
    errors.push(
      issue("media-array", "Media source resources must be an array."),
    );
    return errors;
  }

  const availableResourceIds = new Set(
    resources.map((resource) => resource.id),
  );
  const resourceIds = new Set();
  const resourceSchema = schema.$defs.resourceMedia;
  const previewSchema = schema.$defs.preview;
  const faviconSchema = schema.$defs.favicon;
  const rasterTypes = new Set(schema.$defs.rasterImage.enum);
  const previewSources = new Set(previewSchema.properties.source.enum);

  for (const [index, entry] of source.resources.entries()) {
    const label = `Media entry ${entry?.resourceId ?? index + 1}`;
    errors.push(
      ...objectShapeIssues(
        entry,
        resourceSchema.required,
        Object.keys(resourceSchema.properties),
        label,
      ),
    );
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      continue;
    }
    if (!availableResourceIds.has(entry.resourceId)) {
      errors.push(
        issue(
          "unknown-media-resource",
          `${label} references an unknown resource.`,
          {
            resourceId: entry.resourceId,
          },
        ),
      );
    }
    if (resourceIds.has(entry.resourceId)) {
      errors.push(
        issue(
          "duplicate-media-resource",
          `${label} duplicates a resource ID.`,
          {
            resourceId: entry.resourceId,
          },
        ),
      );
    }
    resourceIds.add(entry.resourceId);
    if (entry.status !== "approved") {
      errors.push(issue("media-status", `${label} is not approved.`));
    }
    if (!entry.preview && !entry.favicon) {
      errors.push(
        issue("missing-media", `${label} has no preview or favicon.`),
      );
    }

    if (entry.preview) {
      errors.push(
        ...objectShapeIssues(
          entry.preview,
          previewSchema.required,
          Object.keys(previewSchema.properties),
          `${label} preview`,
        ),
      );
      if (!validHttpsUrl(entry.preview.url)) {
        errors.push(
          issue("invalid-preview-url", `${label} preview URL is unsafe.`),
        );
      }
      if (!validHttpsUrl(entry.preview.sourcePageUrl)) {
        errors.push(
          issue(
            "invalid-preview-provenance",
            `${label} preview source page is unsafe.`,
          ),
        );
      }
      if (!previewSources.has(entry.preview.source)) {
        errors.push(
          issue(
            "invalid-preview-source",
            `${label} preview source is invalid.`,
          ),
        );
      }
      if (entry.preview.sourceProperty !== undefined) {
        const allowedProperties = new Set(
          previewSchema.properties.sourceProperty.enum,
        );
        if (!allowedProperties.has(entry.preview.sourceProperty)) {
          errors.push(
            issue(
              "invalid-preview-source-property",
              `${label} preview source property is invalid.`,
            ),
          );
        } else if (entry.preview.source === "manual") {
          errors.push(
            issue(
              "manual-preview-source-property",
              `${label} manual preview cannot claim metadata provenance.`,
            ),
          );
        } else if (
          (entry.preview.source === "open-graph" &&
            !entry.preview.sourceProperty.startsWith("og:")) ||
          (entry.preview.source === "twitter" &&
            !entry.preview.sourceProperty.startsWith("twitter:"))
        ) {
          errors.push(
            issue(
              "preview-source-property-mismatch",
              `${label} preview source and property do not match.`,
            ),
          );
        }
      }
      if (!validIsoDate(entry.preview.checkedAt)) {
        errors.push(
          issue("invalid-preview-date", `${label} preview date is invalid.`),
        );
      }
      if (!rasterTypes.has(entry.preview.contentType)) {
        errors.push(
          issue(
            "invalid-preview-type",
            `${label} preview is not raster media.`,
          ),
        );
      }
    }

    if (entry.favicon) {
      errors.push(
        ...objectShapeIssues(
          entry.favicon,
          faviconSchema.required,
          Object.keys(faviconSchema.properties),
          `${label} favicon`,
        ),
      );
      if (!validHttpsUrl(entry.favicon.url)) {
        errors.push(
          issue("invalid-favicon-url", `${label} favicon URL is unsafe.`),
        );
      }
      if (!validIsoDate(entry.favicon.checkedAt)) {
        errors.push(
          issue("invalid-favicon-date", `${label} favicon date is invalid.`),
        );
      }
      if (!rasterTypes.has(entry.favicon.contentType)) {
        errors.push(
          issue(
            "invalid-favicon-type",
            `${label} favicon is not raster media.`,
          ),
        );
      }
    }
  }

  return errors;
}

export function prepareMediaComposition(
  source,
  schema,
  resources,
  initialErrors = [],
) {
  const errors = [...initialErrors];
  if (source) {
    errors.push(...validateMediaSource(source, schema, resources));
  }
  const approvedResources =
    errors.length === 0 && Array.isArray(source?.resources)
      ? source.resources
      : [];
  const byResourceId = new Map(
    approvedResources.map((entry) => [entry.resourceId, mediaFields(entry)]),
  );

  return { errors, approvedResources, byResourceId };
}

export function validateCollectionSource(source, schema, resources) {
  const errors = [];
  const sourceShape = objectShapeIssues(
    source,
    schema.required,
    Object.keys(schema.properties),
    "Collection source",
  );
  errors.push(...sourceShape);

  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return errors;
  }

  if (source.version !== schema.properties.version.const) {
    errors.push(
      issue(
        "collection-version",
        "Collection source version does not match the schema constant.",
      ),
    );
  }

  if (!Array.isArray(source.collections)) {
    errors.push(
      issue(
        "collection-array",
        "Collection source collections must be an array.",
      ),
    );
    return errors;
  }

  const collectionArraySchema = schema.properties.collections;
  if (
    source.collections.length < collectionArraySchema.minItems ||
    source.collections.length > collectionArraySchema.maxItems
  ) {
    errors.push(
      issue(
        "collection-count",
        `Collection source must contain exactly ${collectionArraySchema.minItems} collections.`,
        {
          expected: collectionArraySchema.minItems,
          actual: source.collections.length,
        },
      ),
    );
  }

  const identifierPattern = new RegExp(schema.$defs.identifier.pattern);
  const collectionSchema = schema.$defs.collection;
  const resourceIdSchema = collectionSchema.properties.resourceIds;
  const stageArraySchema = collectionSchema.properties.stages;
  const stageSchema = schema.$defs.stage;
  const stageItemSchema = schema.$defs.stageItem;
  const coverStyles = new Set(collectionSchema.properties.coverStyle.enum);
  const publishedStatus = collectionSchema.properties.status.const;
  const availableResourceIds = new Set(
    resources.map((resource) => resource.id),
  );
  const collectionIds = new Set();
  const collectionSlugs = new Set();

  for (const [index, collection] of source.collections.entries()) {
    const label = `Collection ${collection?.id ?? index + 1}`;
    errors.push(
      ...objectShapeIssues(
        collection,
        collectionSchema.required,
        Object.keys(collectionSchema.properties),
        label,
      ),
    );

    if (
      !collection ||
      typeof collection !== "object" ||
      Array.isArray(collection)
    ) {
      continue;
    }

    if (!identifierPattern.test(collection.id ?? "")) {
      errors.push(
        issue("collection-id", `${label} has an invalid identifier.`, {
          value: collection.id,
        }),
      );
    } else if (collectionIds.has(collection.id)) {
      errors.push(
        issue(
          "duplicate-collection-id",
          `Duplicate collection ID: ${collection.id}.`,
        ),
      );
    }
    collectionIds.add(collection.id);

    if (!identifierPattern.test(collection.slug ?? "")) {
      errors.push(
        issue("collection-slug", `${label} has an invalid slug.`, {
          value: collection.slug,
        }),
      );
    } else if (collectionSlugs.has(collection.slug)) {
      errors.push(
        issue(
          "duplicate-collection-slug",
          `Duplicate collection slug: ${collection.slug}.`,
        ),
      );
    }
    collectionSlugs.add(collection.slug);

    for (const field of ["title", "description", "outcome", "audience"]) {
      if (
        !validBoundedString(
          collection[field],
          collectionSchema.properties[field],
        )
      ) {
        errors.push(
          issue(`collection-${field}`, `${label} has an invalid ${field}.`),
        );
      }
    }

    if (!Array.isArray(collection.resourceIds)) {
      errors.push(
        issue(
          "collection-resource-array",
          `${label} resourceIds must be an array.`,
        ),
      );
    } else {
      if (
        collection.resourceIds.length < resourceIdSchema.minItems ||
        collection.resourceIds.length > resourceIdSchema.maxItems
      ) {
        errors.push(
          issue(
            "collection-resource-count",
            `${label} must contain between ${resourceIdSchema.minItems} and ${resourceIdSchema.maxItems} resources.`,
            { actual: collection.resourceIds.length },
          ),
        );
      }

      const memberIds = new Set();
      for (const resourceId of collection.resourceIds) {
        if (!identifierPattern.test(resourceId)) {
          errors.push(
            issue(
              "collection-resource-id",
              `${label} contains an invalid resource ID.`,
              { resourceId },
            ),
          );
        }
        if (memberIds.has(resourceId)) {
          errors.push(
            issue(
              "duplicate-collection-member",
              `${label} contains a duplicate resource ID.`,
              { resourceId },
            ),
          );
        }
        if (!availableResourceIds.has(resourceId)) {
          errors.push(
            issue(
              "unknown-collection-resource",
              `${label} references a resource that is not in the catalogue.`,
              { resourceId },
            ),
          );
        }
        memberIds.add(resourceId);
      }
    }

    if (!Array.isArray(collection.stages)) {
      errors.push(
        issue("playbook-stage-array", `${label} stages must be an array.`),
      );
    } else {
      if (
        collection.stages.length < stageArraySchema.minItems ||
        collection.stages.length > stageArraySchema.maxItems
      ) {
        errors.push(
          issue(
            "playbook-stage-count",
            `${label} must contain between ${stageArraySchema.minItems} and ${stageArraySchema.maxItems} stages.`,
            { actual: collection.stages.length },
          ),
        );
      }

      const stageIds = new Set();
      const stagedResourceIds = [];
      const stagedResourceSet = new Set();

      for (const [stageIndex, stage] of collection.stages.entries()) {
        const stageLabel = `${label} stage ${stage?.id ?? stageIndex + 1}`;
        errors.push(
          ...objectShapeIssues(
            stage,
            stageSchema.required,
            Object.keys(stageSchema.properties),
            stageLabel,
          ),
        );

        if (!stage || typeof stage !== "object" || Array.isArray(stage)) {
          continue;
        }

        if (!identifierPattern.test(stage.id ?? "")) {
          errors.push(
            issue("playbook-stage-id", `${stageLabel} has an invalid ID.`),
          );
        } else if (stageIds.has(stage.id)) {
          errors.push(
            issue(
              "duplicate-playbook-stage-id",
              `${label} contains duplicate stage ID ${stage.id}.`,
            ),
          );
        }
        stageIds.add(stage.id);

        for (const field of ["title", "inspect", "decision"]) {
          if (
            !validBoundedString(stage[field], stageSchema.properties[field])
          ) {
            errors.push(
              issue(
                `playbook-stage-${field}`,
                `${stageLabel} has an invalid ${field}.`,
              ),
            );
          }
        }

        if (!Array.isArray(stage.items)) {
          errors.push(
            issue(
              "playbook-stage-items",
              `${stageLabel} items must be an array.`,
            ),
          );
          continue;
        }

        const itemArraySchema = stageSchema.properties.items;
        if (
          stage.items.length < itemArraySchema.minItems ||
          stage.items.length > itemArraySchema.maxItems
        ) {
          errors.push(
            issue(
              "playbook-stage-item-count",
              `${stageLabel} has an invalid item count.`,
              { actual: stage.items.length },
            ),
          );
        }

        for (const [itemIndex, item] of stage.items.entries()) {
          const itemLabel = `${stageLabel} item ${itemIndex + 1}`;
          errors.push(
            ...objectShapeIssues(
              item,
              stageItemSchema.required,
              Object.keys(stageItemSchema.properties),
              itemLabel,
            ),
          );
          if (!item || typeof item !== "object" || Array.isArray(item)) {
            continue;
          }

          if (!identifierPattern.test(item.resourceId ?? "")) {
            errors.push(
              issue(
                "playbook-stage-resource-id",
                `${itemLabel} has an invalid resource ID.`,
              ),
            );
          }
          if (!validBoundedString(item.role, stageItemSchema.properties.role)) {
            errors.push(
              issue("playbook-stage-role", `${itemLabel} has an invalid role.`),
            );
          }
          if (!collection.resourceIds?.includes(item.resourceId)) {
            errors.push(
              issue(
                "playbook-stage-nonmember",
                `${itemLabel} references a resource outside the Playbook membership.`,
                { resourceId: item.resourceId },
              ),
            );
          }
          if (stagedResourceSet.has(item.resourceId)) {
            errors.push(
              issue(
                "duplicate-playbook-stage-resource",
                `${label} assigns ${item.resourceId} to more than one stage.`,
                { resourceId: item.resourceId },
              ),
            );
          }
          stagedResourceSet.add(item.resourceId);
          stagedResourceIds.push(item.resourceId);
        }
      }

      if (
        Array.isArray(collection.resourceIds) &&
        (stagedResourceIds.length !== collection.resourceIds.length ||
          stagedResourceIds.some(
            (resourceId, index) => resourceId !== collection.resourceIds[index],
          ))
      ) {
        errors.push(
          issue(
            "playbook-stage-order",
            `${label} stage items must reproduce resourceIds exactly once and in editorial order.`,
          ),
        );
      }
    }

    if (!coverStyles.has(collection.coverStyle)) {
      errors.push(
        issue(
          "collection-cover-style",
          `${label} has an invalid cover style.`,
          { value: collection.coverStyle },
        ),
      );
    }
    if (!validIsoDate(collection.lastReviewedAt)) {
      errors.push(
        issue(
          "collection-review-date",
          `${label} has an invalid last-reviewed date.`,
          { value: collection.lastReviewedAt },
        ),
      );
    }
    if (collection.status !== publishedStatus) {
      errors.push(
        issue(
          "collection-status",
          `${label} must use the published launch status.`,
          { value: collection.status },
        ),
      );
    }
  }

  return errors;
}

export function prepareCollectionComposition(
  source,
  schema,
  resources,
  initialErrors = [],
) {
  const errors = [...initialErrors];
  if (source) {
    errors.push(...validateCollectionSource(source, schema, resources));
  }

  const sourceCollections = Array.isArray(source?.collections)
    ? source.collections
    : [];

  return {
    errors,
    sourceCollections,
    collections: errors.length === 0 ? sourceCollections : [],
  };
}

export async function buildReleaseCatalogue(options = {}) {
  const root = options.root ?? repoRootFromModule();
  const base = await buildCatalogue({ root });
  const collectionSourcePath = path.join(root, COLLECTION_SOURCE_PATH);
  const collectionSchemaPath = path.join(root, COLLECTION_SCHEMA_PATH);
  const mediaSourcePath = path.join(root, MEDIA_SOURCE_PATH);
  const mediaSchemaPath = path.join(root, MEDIA_SCHEMA_PATH);
  const [
    collectionSourceBuffer,
    collectionSchemaText,
    mediaSourceBuffer,
    mediaSchemaText,
  ] = await Promise.all([
    readFile(collectionSourcePath),
    readFile(collectionSchemaPath, "utf8"),
    readFile(mediaSourcePath),
    readFile(mediaSchemaPath, "utf8"),
  ]);
  const collectionSourceSha256 = sourceProvenanceSha256(collectionSourceBuffer);
  const collectionSchema = JSON.parse(collectionSchemaText);
  const mediaSourceSha256 = sourceProvenanceSha256(mediaSourceBuffer);
  const mediaSchema = JSON.parse(mediaSchemaText);
  const parseErrors = [];
  const mediaParseErrors = [];
  let collectionSource = null;
  let mediaSource = null;

  try {
    collectionSource = JSON.parse(collectionSourceBuffer.toString("utf8"));
  } catch (error) {
    parseErrors.push(
      issue("collection-json", "Collection source is not valid JSON.", {
        reason: error instanceof Error ? error.message : "Unknown JSON error",
      }),
    );
  }

  try {
    mediaSource = JSON.parse(mediaSourceBuffer.toString("utf8"));
  } catch (error) {
    mediaParseErrors.push(
      issue("media-json", "Media source is not valid JSON.", {
        reason: error instanceof Error ? error.message : "Unknown JSON error",
      }),
    );
  }

  const mediaComposition = prepareMediaComposition(
    mediaSource,
    mediaSchema,
    base.catalogue.resources,
    mediaParseErrors,
  );
  const resources = base.catalogue.resources.map((resource) => ({
    ...resource,
    ...mediaComposition.byResourceId.get(resource.id),
  }));

  const composition = prepareCollectionComposition(
    collectionSource,
    collectionSchema,
    resources,
    parseErrors,
  );
  const catalogue = {
    ...base.catalogue,
    resources,
    collections: composition.collections,
  };
  const collectionItems = composition.collections.reduce(
    (sum, collection) => sum + collection.resourceIds.length,
    0,
  );
  const report = {
    ...base.report,
    collectionSource: {
      path: COLLECTION_SOURCE_PATH,
      sha256: collectionSourceSha256,
      collectionCount: composition.sourceCollections.length,
    },
    mediaSource: {
      path: MEDIA_SOURCE_PATH,
      sha256: mediaSourceSha256,
      approvedCount: mediaComposition.approvedResources.length,
    },
    summary: {
      ...base.report.summary,
      collections: composition.collections.length,
      collectionItems,
      approvedMedia: mediaComposition.approvedResources.length,
    },
    collections: composition.collections.map((collection) => ({
      id: collection.id,
      slug: collection.slug,
      resourceCount: collection.resourceIds.length,
      status: collection.status,
      lastReviewedAt: collection.lastReviewedAt,
    })),
    issues: {
      errors: [
        ...base.report.issues.errors,
        ...mediaComposition.errors,
        ...composition.errors,
      ],
      warnings: base.report.issues.warnings,
    },
  };

  return {
    catalogue,
    report,
    catalogueText: serialize(catalogue),
    reportText: serialize(report),
  };
}
