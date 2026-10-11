import catalogue from "../data/catalogue.json" with { type: "json" };
import type {
  ResourceCardAccess,
  ResourceCardData,
} from "@/components/resource-card/resource-card";

export type CollectionCoverStyle =
  "editorial" | "typography" | "motion" | "systems";

export type CollectionResource = Readonly<{
  resource: ResourceCardData;
  categoryLabel: string;
  role: string;
  stageId: string;
}>;

export type PlaybookStage = Readonly<{
  id: string;
  title: string;
  inspect: string;
  decision: string;
  resources: readonly CollectionResource[];
}>;

export type PublishedCollection = Readonly<{
  id: string;
  slug: string;
  title: string;
  description: string;
  outcome: string;
  audience: string;
  resourceIds: readonly string[];
  stages: readonly PlaybookStage[];
  coverStyle: CollectionCoverStyle;
  lastReviewedAt: string;
  status: "published";
  resources: readonly CollectionResource[];
}>;

type CatalogueResource = (typeof catalogue.resources)[number];
type CatalogueCollection = (typeof catalogue.collections)[number];
type CatalogueCategory = (typeof catalogue.categories)[number];

/** The catalogue fields the collection pages read. */
export type CollectionCatalogue = Readonly<{
  resources: readonly CatalogueResource[];
  categories: readonly Pick<CatalogueCategory, "id" | "label">[];
  collections: readonly CatalogueCollection[];
}>;

function toResourceCardData(resource: CatalogueResource): ResourceCardData {
  return {
    id: resource.id,
    slug: resource.slug,
    name: resource.name,
    url: resource.url,
    domain: resource.domain,
    description: resource.description,
    category: resource.category,
    access: resource.access as ResourceCardAccess,
    status: resource.status as ResourceCardData["status"],
    faviconUrl: resource.faviconUrl,
    previewImageUrl: resource.previewImageUrl,
  };
}

/**
 * Resolves the published collections against a catalogue. Archived sources
 * keep their collection membership in the data but are never listed; a stage
 * left with no listed source is not shown. Pure, so fixtures can exercise it.
 */
export function resolvePublishedCollections(
  data: CollectionCatalogue,
): readonly PublishedCollection[] {
  const resourceById = new Map(
    data.resources.map((resource) => [resource.id, resource]),
  );
  const categoryLabelById = new Map(
    data.categories.map((category) => [category.id, category.label]),
  );

  function resolveResource(
    collectionSlug: string,
    stageId: string,
    item: CatalogueCollection["stages"][number]["items"][number],
  ): CollectionResource {
    const source = resourceById.get(item.resourceId);
    if (!source) {
      throw new Error(
        `Playbook ${collectionSlug} references missing resource ${item.resourceId}.`,
      );
    }

    return {
      resource: toResourceCardData(source),
      categoryLabel: categoryLabelById.get(source.category) ?? source.category,
      role: item.role,
      stageId,
    };
  }

  function resolveCollection(
    collection: CatalogueCollection,
  ): PublishedCollection {
    const stages = collection.stages
      .map((stage) => ({
        id: stage.id,
        title: stage.title,
        inspect: stage.inspect,
        decision: stage.decision,
        resources: stage.items
          .map((item) => resolveResource(collection.slug, stage.id, item))
          .filter(({ resource }) => resource.status !== "archived"),
      }))
      .filter((stage) => stage.resources.length > 0);
    const resources = stages.flatMap((stage) => stage.resources);

    return {
      id: collection.id,
      slug: collection.slug,
      title: collection.title,
      description: collection.description,
      outcome: collection.outcome,
      audience: collection.audience,
      resourceIds: resources.map(({ resource }) => resource.id),
      stages,
      coverStyle: collection.coverStyle as CollectionCoverStyle,
      lastReviewedAt: collection.lastReviewedAt,
      status: collection.status as "published",
      resources,
    };
  }

  return data.collections
    .filter((collection) => collection.status === "published")
    .map(resolveCollection);
}

const publishedCollections = resolvePublishedCollections(catalogue);

export function getPublishedCollections(): readonly PublishedCollection[] {
  return publishedCollections;
}

export function getPublishedCollection(
  slug: string,
): PublishedCollection | null {
  return (
    publishedCollections.find((collection) => collection.slug === slug) ?? null
  );
}

export function formatCollectionReviewDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}
