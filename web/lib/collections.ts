import catalogue from "@/data/catalogue.json";
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

const resourceById = new Map(
  catalogue.resources.map((resource) => [resource.id, resource]),
);
const categoryLabelById = new Map(
  catalogue.categories.map((category) => [category.id, category.label]),
);

function toResourceCardData(
  resource: (typeof catalogue.resources)[number],
): ResourceCardData {
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

function resolveResource(
  collectionSlug: string,
  stageId: string,
  item: (typeof catalogue.collections)[number]["stages"][number]["items"][number],
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
  collection: (typeof catalogue.collections)[number],
): PublishedCollection {
  const stages = collection.stages.map((stage) => ({
    id: stage.id,
    title: stage.title,
    inspect: stage.inspect,
    decision: stage.decision,
    resources: stage.items.map((item) =>
      resolveResource(collection.slug, stage.id, item),
    ),
  }));
  const resources = stages.flatMap((stage) => stage.resources);

  return {
    id: collection.id,
    slug: collection.slug,
    title: collection.title,
    description: collection.description,
    outcome: collection.outcome,
    audience: collection.audience,
    resourceIds: collection.resourceIds,
    stages,
    coverStyle: collection.coverStyle as CollectionCoverStyle,
    lastReviewedAt: collection.lastReviewedAt,
    status: collection.status as "published",
    resources,
  };
}

const publishedCollections = catalogue.collections
  .filter((collection) => collection.status === "published")
  .map(resolveCollection);

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
