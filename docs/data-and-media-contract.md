# Tessli data and media contract

The catalogue models behind the Sources directory, and the frozen media fallback. The media pipeline (discovery, coverage, candidate review, screenshot capture) and the verification workflow are out of scope in v1.2: their documentation is removed, their code goes in cleanup step C5, and both stay recoverable from the `v1.1-archive` tag.

## 1. Catalogue model

Version one catalogue record:

```ts
type Resource = {
  id: string;
  slug: string;
  name: string;
  url: string;
  domain: string;
  description: string;
  category: CategoryId;
  access: "free" | "freemium" | "paid" | "open-source" | "free-trial";
  subscriptionRequired: "no" | "optional" | "yes" | "after-trial";
  usefulFor: string[];
  tags: string[];
  faviconUrl?: string;
  previewImageUrl?: string;
  previewSource?: "manual" | "open-graph" | "twitter" | "favicon" | "generated";
  lastVerifiedAt?: string;
  status: "active" | "needs-review" | "unavailable";
};
```

The CSV at `lib_data/design-resource-library-295.csv` is migrated into deterministic typed JSON under `web/data/` (`npm run catalogue:generate`; `npm run catalogue:check` fails on drift). The migration records source SHA-256 provenance and reports invalid URLs, missing descriptions, exact duplicate URLs, duplicate domains, slug collisions, or unknown source labels. IDs and slugs are stable. A source row is never dropped silently: a source that should go is archived with a reason, so its ID, history and old links survive.

`Resource.url` remains the canonical provider destination. Recorded access routes belong to the richer source-profile data, not this catalogue record, and never claim provider access that has not been recorded.

Approved media is a separate, frozen, repository-managed sidecar at `lib_data/resource-media.json`, validated by `schemas/resource-media.schema.json`. It is keyed by stable resource ID and deterministically merged into the generated catalogue. Its approval count and SHA-256 are included in `web/data/catalogue-validation.json`.

`free-trial` is preserved as its own access value because the source contains one explicitly researched free-trial resource. It must not be silently converted to freemium or paid.

## 2. Category model

```ts
type Category = {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
  order: number;
};
```

The current eleven broad categories remain the release taxonomy. Short labels are used in compact UI while full labels remain available in filters and detail views.

## 3. Collection model

```ts
type Collection = {
  id: string;
  slug: string;
  title: string;
  description: string;
  resourceIds: string[];
  coverStyle: "editorial" | "typography" | "motion" | "systems";
  curator?: {
    name: string;
    profileUrl?: string;
  };
  lastReviewedAt?: string;
  status: "draft" | "published" | "archived";
};
```

Do not invent curators. Repository-maintained collections may use “Curated by Tessli”.

## 4. Search model

Browse search is deterministic over repository-managed data, with no network enrichment. The index covers name, domain, description, category, access, useful-for tags and tags, precomputed as one normalized string per entry. UI input is debounced and filters live in URL state.

Task retrieval (used by the local MCP) is a separate deterministic contract: structured task input returns at most eight explained sources with fit reasons, caveats, alternatives and recorded access routes. It uses no embeddings, LLM ranking, provider calls or public endpoint.

## 5. Media fallback chain (frozen)

No new media is discovered, captured or approved in v1.2. Source cards and pages use what is already approved, in this order:

1. **preview**: the approved preview image (manual or Open Graph) from `lib_data/resource-media.json`, or the catalogue `previewImageUrl`;
2. **favicon**: the site favicon in a designed tile;
3. **lettermark**: a generated letter mark.

The layout stays complete when every external image fails. A generated lettermark is not evidence that media research happened.

## 6. Rendering external images

- Store URLs and metadata, never binary copies of third-party images.
- Every media URL is HTTPS, public-hosted, credential-free and a declared raster type (JPEG, PNG, WebP, AVIF).
- Fixed aspect-ratio media boxes; native `<img>` with `loading="lazy"` below the fold, `decoding="async"` and `referrerPolicy="no-referrer"`.
- Failure advances to the next step of the fallback chain.
- Never inject remote SVG markup into the DOM.
- No wildcard `next/image` optimiser or open proxy: the catalogue spans many unrelated domains.
- The build never fetches external media.

Tessli does not scrape, mirror or redistribute destination content beyond the approved metadata above. Paid or private content is never copied because a source is listed.

## 7. Hero and reference assets

The hero artwork and the reference images under `docs/ref-img/` are listed, with dimensions and hashes, in [`asset-manifest.md`](asset-manifest.md). They are excluded from the MIT licence; see [`TRADEMARKS.md`](../TRADEMARKS.md).
