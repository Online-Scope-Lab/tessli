import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import catalogue from "../data/catalogue.json" with { type: "json" };
import {
  ACCESS_ROUTE_PILOT_SOURCE_IDS,
  ACCESS_ROUTE_KINDS,
} from "../data/access-route-pilot.ts";
import { getAllIntelligenceProfiles } from "../lib/intelligence.ts";
import {
  SOURCE_PROFILE_CONTRACT_VERSION,
  SOURCE_TYPES,
  getAllSourceProfiles,
  getBrowsableSourceProfiles,
  getSourceContractSummary,
  getSourceProfile,
} from "../lib/source-profiles.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(
  __dirname,
  "../../schemas/source-profile.schema.json",
);
const SOURCE_PROFILE_SCHEMA_ID =
  "https://tessli.dev/schemas/source-profile.schema.json";

function issue(code, message, details = {}) {
  return { code, message, ...details };
}

function sameValue(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function validateSourceProfileContract() {
  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
  const profiles = [...getAllSourceProfiles()];
  const summary = getSourceContractSummary();
  const errors = [];

  if (schema.$id !== SOURCE_PROFILE_SCHEMA_ID) {
    errors.push(
      issue("schema-id", "Source profile schema ID is not canonical."),
    );
  }
  if (
    schema.properties?.contractVersion?.const !==
    SOURCE_PROFILE_CONTRACT_VERSION
  ) {
    errors.push(
      issue(
        "schema-version",
        "Source profile schema version does not match the runtime contract.",
      ),
    );
  }
  if (profiles.length !== catalogue.resources.length) {
    errors.push(
      issue(
        "resource-count",
        "Source profile count does not match the canonical catalogue.",
        { expected: catalogue.resources.length, actual: profiles.length },
      ),
    );
  }

  const ids = new Set();
  const slugs = new Set();
  const allowedSourceTypes = new Set(SOURCE_TYPES);
  const accessRouteKinds = new Set(ACCESS_ROUTE_KINDS);
  const catalogueById = new Map(
    catalogue.resources.map((resource) => [resource.id, resource]),
  );

  for (const profile of profiles) {
    const catalogueResource = catalogueById.get(profile.id);
    if (!catalogueResource) {
      errors.push(
        issue(
          "unknown-resource",
          `Unknown source profile resource: ${profile.id}.`,
        ),
      );
      continue;
    }

    if (ids.has(profile.id)) {
      errors.push(
        issue("duplicate-id", `Duplicate source profile ID: ${profile.id}.`),
      );
    }
    if (slugs.has(profile.slug)) {
      errors.push(
        issue(
          "duplicate-slug",
          `Duplicate source profile slug: ${profile.slug}.`,
        ),
      );
    }
    ids.add(profile.id);
    slugs.add(profile.slug);

    for (const key of ["slug", "name", "url", "domain", "category"]) {
      if (profile[key] !== catalogueResource[key]) {
        errors.push(
          issue(
            "catalogue-drift",
            `${profile.id} does not preserve catalogue field ${key}.`,
          ),
        );
      }
    }

    if (profile.summary !== catalogueResource.description) {
      errors.push(
        issue(
          "summary-drift",
          `${profile.id} does not preserve its catalogue description as summary.`,
        ),
      );
    }
    if (profile.accessModel.access !== catalogueResource.access) {
      errors.push(
        issue(
          "access-model",
          `${profile.id} does not preserve its catalogue access model.`,
        ),
      );
    }
    if (
      profile.status !== catalogueResource.status ||
      profile.archivedReason !== (catalogueResource.archivedReason ?? null) ||
      profile.replacedBy !== (catalogueResource.replacedBy ?? null)
    ) {
      errors.push(
        issue(
          "source-status",
          `${profile.id} does not preserve its catalogue status, archive reason or replacement.`,
        ),
      );
    }

    if (!allowedSourceTypes.has(profile.sourceType)) {
      errors.push(
        issue(
          "source-type",
          `${profile.id} has unsupported source type ${profile.sourceType}.`,
        ),
      );
    }
    if (profile.sourceTypeBasis !== "category-classification") {
      errors.push(
        issue(
          "source-type-basis",
          `${profile.id} has an unsupported source type basis.`,
        ),
      );
    }
    if (
      !Array.isArray(profile.accessRoutes) ||
      profile.accessRoutes.length === 0
    ) {
      errors.push(issue("access-routes", `${profile.id} has no access route.`));
    } else {
      const preferredRoutes = profile.accessRoutes.filter(
        (route) => route.preferred,
      );
      if (preferredRoutes.length !== 1) {
        errors.push(
          issue(
            "access-route-preferred",
            `${profile.id} must have exactly one preferred access route.`,
          ),
        );
      }
      for (const route of profile.accessRoutes) {
        if (
          !accessRouteKinds.has(route.kind) ||
          !["none", "user", "unknown"].includes(route.auth) ||
          !route.agentAction.trim()
        ) {
          errors.push(
            issue(
              "access-route-shape",
              `${profile.id} has an invalid access route.`,
            ),
          );
        }
      }
    }
    if (profile.intelligence) {
      const intelligence = profile.intelligence;
      if (
        intelligence.resourceId !== profile.id &&
        intelligence.resourceId !== profile.slug
      ) {
        errors.push(
          issue(
            "intelligence-link",
            `${profile.id} is linked to unrelated intelligence ID ${intelligence.resourceId}.`,
          ),
        );
      }

      const normalizedFields = [
        ["bestFor", intelligence.workflowFit],
        ["capabilities", intelligence.capabilities],
        ["contentObjects", intelligence.contentObjects],
        ["platforms", intelligence.platforms],
        ["frameworks", intelligence.frameworks],
        ["integrationMethods", intelligence.integrationMethods],
        ["limitations", intelligence.limitations],
      ];
      for (const [field, expected] of normalizedFields) {
        if (!sameValue(profile[field], expected)) {
          errors.push(
            issue(
              "intelligence-normalization",
              `${profile.id} does not preserve intelligence field ${field}.`,
            ),
          );
        }
      }
    } else {
      // Without an intelligence profile, only the source file's own optional
      // fields may appear; nothing else is invented.
      const fromSourceFile = [
        ["bestFor", catalogueResource.bestFor ?? []],
        ["frameworks", catalogueResource.frameworks ?? []],
        ["limitations", catalogueResource.limitations ?? []],
        ["capabilities", []],
        ["contentObjects", []],
        ["platforms", []],
        ["integrationMethods", []],
      ];
      for (const [field, expected] of fromSourceFile) {
        if (!sameValue(profile[field], expected)) {
          errors.push(
            issue(
              "invented-intelligence",
              `${profile.id} invents ${field} without an intelligence profile.`,
            ),
          );
        }
      }
    }

    if (getSourceProfile(profile.id)?.slug !== profile.slug) {
      errors.push(
        issue("id-lookup", `${profile.id} does not resolve by stable ID.`),
      );
    }
    if (getSourceProfile(profile.slug)?.id !== profile.id) {
      errors.push(
        issue("slug-lookup", `${profile.id} does not resolve by slug.`),
      );
    }
  }

  const archivedCount = profiles.filter(
    (profile) => profile.status === "archived",
  ).length;
  const browsable = getBrowsableSourceProfiles();
  if (
    browsable.length !== profiles.length - archivedCount ||
    browsable.some((profile) => profile.status === "archived")
  ) {
    errors.push(
      issue(
        "browsable-sources",
        "Browsable sources must be exactly the non-archived sources.",
      ),
    );
  }
  for (const intelligence of getAllIntelligenceProfiles()) {
    const profile = getSourceProfile(intelligence.resourceId);
    if (profile?.intelligence !== intelligence) {
      errors.push(
        issue(
          "intelligence-unlinked",
          `Intelligence profile ${intelligence.resourceId} is not linked to exactly one source.`,
        ),
      );
    }
  }
  if (ACCESS_ROUTE_PILOT_SOURCE_IDS.length !== 10) {
    errors.push(
      issue(
        "access-route-pilot-size",
        "AccessRoute pilot must contain exactly ten sources.",
      ),
    );
  }
  return {
    valid: errors.length === 0,
    contractVersion: SOURCE_PROFILE_CONTRACT_VERSION,
    resourceCount: profiles.length,
    browsableCount: summary.browsableCount,
    intelligenceProfileCount: summary.intelligenceProfileCount,
    errors,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const report = validateSourceProfileContract();
  console.log(
    `Source profile contract: ${report.resourceCount} sources ` +
      `(${report.browsableCount} not archived); ` +
      `${report.intelligenceProfileCount} with an intelligence profile.`,
  );

  if (!report.valid) {
    for (const error of report.errors) {
      console.error(` - [${error.code}] ${error.message}`);
    }
    process.exit(1);
  }
}
