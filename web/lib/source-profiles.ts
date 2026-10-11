import catalogue from "../data/catalogue.json" with { type: "json" };
import {
  getCanonicalAccessRoutes,
  type AccessRoute,
} from "../data/access-route-pilot.ts";
import {
  getAllIntelligenceProfiles,
  getIntelligenceProfile,
  type ResourceIntelligenceProfile,
} from "./intelligence.ts";

export const SOURCE_PROFILE_CONTRACT_VERSION = 2 as const;

export const SOURCE_TYPES = Object.freeze([
  "inspiration-directory",
  "product-reference-library",
  "marketing-reference-library",
  "implementation-library",
  "design-system",
  "creative-technology-resource",
  "typography-resource",
  "color-accessibility-resource",
  "icon-library",
  "visual-asset-library",
  "design-ai-tool",
] as const);

export type SourceType = (typeof SOURCE_TYPES)[number];
export type SourceStatus = "active" | "needs-review" | "archived";

/** One generated catalogue.json resource (see schemas/catalogue.schema.json). */
export type CatalogueResource = Readonly<{
  id: string;
  slug: string;
  name: string;
  url: string;
  domain: string;
  description: string;
  category: string;
  access: string;
  status: string;
  frameworks?: readonly string[];
  bestFor?: readonly string[];
  limitations?: readonly string[];
  replacedBy?: string;
  archivedReason?: string;
}>;

export interface SourceAccessModel {
  access: string;
}

export interface SourceProfile {
  contractVersion: typeof SOURCE_PROFILE_CONTRACT_VERSION;
  id: string;
  slug: string;
  name: string;
  url: string;
  domain: string;
  summary: string;
  category: string;
  sourceType: SourceType;
  sourceTypeBasis: "category-classification";
  accessModel: SourceAccessModel;
  bestFor: ResourceIntelligenceProfile["workflowFit"];
  capabilities: ResourceIntelligenceProfile["capabilities"];
  contentObjects: ResourceIntelligenceProfile["contentObjects"];
  platforms: ResourceIntelligenceProfile["platforms"];
  frameworks: ResourceIntelligenceProfile["frameworks"];
  integrationMethods: ResourceIntelligenceProfile["integrationMethods"];
  accessRoutes: readonly AccessRoute[];
  limitations: ResourceIntelligenceProfile["limitations"];
  status: SourceStatus;
  archivedReason: string | null;
  replacedBy: string | null;
  intelligence: ResourceIntelligenceProfile | null;
}

export const SOURCE_TYPE_BY_CATEGORY: Readonly<Record<string, SourceType>> =
  Object.freeze({
    "website-inspiration": "inspiration-directory",
    "product-ui-ux": "product-reference-library",
    "landing-marketing": "marketing-reference-library",
    "ui-libraries": "implementation-library",
    "design-systems": "design-system",
    "motion-3d": "creative-technology-resource",
    typography: "typography-resource",
    "color-accessibility": "color-accessibility-resource",
    icons: "icon-library",
    "visual-assets": "visual-asset-library",
    "design-tools-ai": "design-ai-tool",
  });

function sourceStatus(status: string): SourceStatus {
  if (status === "active" || status === "needs-review" || status === "archived")
    return status;
  throw new Error(`Unknown source status: ${status}.`);
}

function intelligenceForResource(
  resource: CatalogueResource,
): ResourceIntelligenceProfile | null {
  return (
    getIntelligenceProfile(resource.id) ?? getIntelligenceProfile(resource.slug)
  );
}

function buildSourceProfile(resource: CatalogueResource): SourceProfile {
  const intelligence = intelligenceForResource(resource);
  const sourceType = SOURCE_TYPE_BY_CATEGORY[resource.category];

  if (!sourceType) {
    throw new Error(`No source type classification for ${resource.category}.`);
  }

  return {
    contractVersion: SOURCE_PROFILE_CONTRACT_VERSION,
    id: resource.id,
    slug: resource.slug,
    name: resource.name,
    url: resource.url,
    domain: resource.domain,
    summary: resource.description,
    category: resource.category,
    sourceType,
    sourceTypeBasis: "category-classification",
    accessModel: {
      access: resource.access,
    },
    bestFor: intelligence?.workflowFit ?? [...(resource.bestFor ?? [])],
    capabilities: intelligence?.capabilities ?? [],
    contentObjects: intelligence?.contentObjects ?? [],
    platforms: intelligence?.platforms ?? [],
    frameworks: intelligence?.frameworks ?? [...(resource.frameworks ?? [])],
    integrationMethods: intelligence?.integrationMethods ?? [],
    accessRoutes: getCanonicalAccessRoutes(resource),
    limitations: intelligence?.limitations ?? [...(resource.limitations ?? [])],
    status: sourceStatus(resource.status),
    archivedReason: resource.archivedReason ?? null,
    replacedBy: resource.replacedBy ?? null,
    intelligence,
  };
}

export function isArchivedSource(profile: Pick<SourceProfile, "status">) {
  return profile.status === "archived";
}

/**
 * Builds the profile index. Archived sources keep a profile (their pages
 * still render), but only non-archived sources are browsable: every public
 * listing, count, search and alternative reads getBrowsableSourceProfiles().
 */
export function createSourceProfileIndex(
  resources: readonly CatalogueResource[],
) {
  const all = resources.map(buildSourceProfile);
  const browsable = all.filter((profile) => !isArchivedSource(profile));
  const byIdentifier = new Map<string, SourceProfile>();
  for (const profile of all) {
    byIdentifier.set(profile.id, profile);
    byIdentifier.set(profile.slug, profile);
  }
  return {
    all,
    browsable,
    get: (identifier: string) => byIdentifier.get(identifier.trim()) ?? null,
  };
}

const sourceProfileIndex = createSourceProfileIndex(
  catalogue.resources as readonly CatalogueResource[],
);

/** Every source, archived ones included. Use only for per-source pages. */
export function getAllSourceProfiles(): readonly SourceProfile[] {
  return sourceProfileIndex.all;
}

/** Non-archived sources: the only ones any listing, search or count shows. */
export function getBrowsableSourceProfiles(): readonly SourceProfile[] {
  return sourceProfileIndex.browsable;
}

/**
 * Counts shown on public pages, always derived from the data: non-archived
 * sources, and the categories that hold at least one of them.
 */
export function getBrowsableSourceCounts() {
  const browsable = sourceProfileIndex.browsable;
  return {
    sources: browsable.length,
    categories: new Set(browsable.map((profile) => profile.category)).size,
  };
}

/** Resolves a stable ID or slug, archived sources included. */
export function getSourceProfile(identifier: string): SourceProfile | null {
  return sourceProfileIndex.get(identifier);
}

export interface ArchiveNotice {
  reason: string;
  replacement: Readonly<{ slug: string; name: string }> | null;
}

/**
 * What an archived source's page says instead of promoting it: the recorded
 * reason and, when set, the non-archived source that replaces it. Returns
 * null for every source that is not archived.
 */
export function getArchiveNotice(
  profile: SourceProfile,
  resolve: (identifier: string) => SourceProfile | null = getSourceProfile,
): ArchiveNotice | null {
  if (!isArchivedSource(profile)) return null;
  const replacement = profile.replacedBy ? resolve(profile.replacedBy) : null;
  return {
    reason: profile.archivedReason ?? "No reason is recorded.",
    replacement:
      replacement && !isArchivedSource(replacement)
        ? { slug: replacement.slug, name: replacement.name }
        : null,
  };
}

export function getSourceContractSummary() {
  return {
    contractVersion: SOURCE_PROFILE_CONTRACT_VERSION,
    resourceCount: sourceProfileIndex.all.length,
    browsableCount: sourceProfileIndex.browsable.length,
    intelligenceProfileCount: getAllIntelligenceProfiles().length,
  };
}
