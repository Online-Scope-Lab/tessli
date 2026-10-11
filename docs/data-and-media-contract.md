# Tessli data and media contract

The catalogue models behind the Sources directory, and the frozen media fallback. The media pipeline (discovery, coverage, candidate review, screenshot capture) and the verification workflow are out of scope in v1.2: their documentation, code, data and schemas are removed, and both stay recoverable from the `v1.1-archive` tag.

## 1. Source files and the catalogue

Every source is one YAML file, `sources/<slug>.yml`, validated by [`schemas/source.schema.json`](../schemas/source.schema.json):

```yaml
# sources/godly.yml, as committed
id: resource-169e5a48b03e # frozen; never derived from the URL, never changed
slug: godly # must equal the file name
name: Godly
url: https://godly.website
category: website-inspiration # one of the category ids below
kind: gallery # gallery | library | design-system | tool | asset | reference
access: free # free | open-source | freemium | paid | free-trial
summary: Modern and highly polished website inspiration
status: active # active | needs-review | archived
added_at: 2026-07-22
added_via: curator # curator | community
last_checked: null # date a human last checked it, or null
best_for: # optional, at most 3
  - creative-direction
  - motion-research
  - high-end-landing-pages
limitations: # optional, at most 2
  - No source code provided
  - Focuses on bespoke/agency implementations
# Other optional fields (Godly has none of these; values are placeholders):
# frameworks: [react]
# license: MIT
# submission_issue: 123 # the suggest-a-source issue it came from
# Archive-only fields (the schema rejects them unless status is archived):
# archived_reason: Redirects to Other # required when status is archived
# replaced_by: other-slug # the source that replaces it, when one does
```

New summaries say specifically what you'll find there in 40–200 characters; the migrated rows keep their original text verbatim until a curator rewrites them. The domain is not stored: it is derived from `url` at build time.

`npm run catalogue:generate` reads `sources/*.yml`, the curated order in `lib_data/source-order.json`, the frozen media sidecar and the collections, and writes `web/data/catalogue.json` and `web/data/catalogue-validation.json` deterministically and offline. `npm run catalogue:check` (a CI step) fails when a file breaks the schema, a slug does not match its file name, an ID or normalized URL repeats, a category or `replaced_by` target is unknown, or the committed output drifts. There is no expected number of sources, categories or access values: the generator validates structure, uniqueness and references, never counts. Sources listed in `lib_data/source-order.json` keep that curated order; any others follow by category, then name.

A source is never deleted, and never dropped silently: a source that should go gets `status: archived` and an `archived_reason` (plus `replaced_by` when another source replaces it), so its ID, history and old links survive. Archived sources stay in `catalogue.json` with their status. Every public listing (Browse, home search, collections, sitemap, `llms.txt`, MCP search and counts) shows only non-archived sources; an archived source's own page still renders, marked `noindex`, with an "Archived" notice and a link to its replacement.

Generated catalogue record:

```ts
type Resource = {
  id: string;
  slug: string;
  name: string;
  url: string;
  domain: string; // derived from url
  description: string; // the source file's summary
  category: CategoryId;
  kind:
    "gallery" | "library" | "design-system" | "tool" | "asset" | "reference";
  access: "free" | "freemium" | "paid" | "open-source" | "free-trial";
  status: "active" | "needs-review" | "archived";
  addedAt: string;
  addedVia: "curator" | "community";
  lastChecked: string | null;
  frameworks?: string[];
  license?: string;
  bestFor?: string[];
  limitations?: string[];
  replacedBy?: string;
  archivedReason?: string;
  submissionIssue?: number;
  faviconUrl?: string;
  previewImageUrl?: string;
};
```

`Resource.url` remains the canonical provider destination. Recorded access routes belong to the richer source-profile data, not this catalogue record, and never claim provider access that has not been recorded.

The 40 intelligence profiles (`web/data/intelligence-profiles/` and `web/data/intelligence-profile-batches/`, keyed by slug and checked by `npm run profiles:check`) stay committed JSON. The site and the MCP read only their guidance: best-for, capabilities, content, platforms, frameworks, integrations and limitations. Their evidence, verification dates and governance stay on disk for provenance but are not published: no coverage level (Listed, Profiled, Verified), evidence list or governance record appears on a page, in `profile.json`/`profile.md` or in MCP output.

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

The category ids are defined in `web/scripts/catalogue-lib.mjs`. The current broad categories remain the release taxonomy until a curator assigns every source to the revised v1.2 categories (the suggest-source issue form already lists them). Short labels are used in compact UI while full labels remain available in filters and detail views.

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

Browse search is deterministic over repository-managed data, with no network enrichment. The index covers name, domain, description, category, source type, best-for, capabilities, content, platforms and frameworks, as one normalized string per entry. UI input is debounced and filters live in URL state.

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
