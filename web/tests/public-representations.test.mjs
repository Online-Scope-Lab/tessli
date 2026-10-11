import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import {
  PUBLIC_COLLECTION_REPRESENTATION_CONTRACT,
  PUBLIC_SOURCE_REPRESENTATION_CONTRACT,
  createPublicCollectionRepresentation,
  createPublicOptionsHeaders,
  createPublicRepresentationHeaders,
  createPublicSourceRepresentation,
  serializePublicCollectionMarkdown,
  serializePublicJson,
  serializePublicSourceMarkdown,
} from "../lib/public-representations.mjs";

const browserAccess = {
  kind: "browser",
  preferred: true,
  auth: "none",
  agentAction: "Open the source in a browser.",
  url: "https://example.com",
};

const profiled = {
  contractVersion: 2,
  id: "source-one",
  slug: "source-one",
  name: "Source One",
  url: "https://example.com",
  domain: "example.com",
  summary: "Compare interface hierarchy and component patterns.",
  category: "website-inspiration",
  sourceType: "inspiration-directory",
  sourceTypeBasis: "category-classification",
  accessModel: { access: "free" },
  bestFor: ["hierarchy", "component evaluation"],
  capabilities: ["inspiration", "components"],
  contentObjects: ["components", "websites"],
  platforms: ["web"],
  frameworks: [],
  integrationMethods: ["web-ui"],
  accessRoutes: [browserAccess],
  limitations: ["No source code", "No source code"],
  status: "active",
  archivedReason: null,
  replacedBy: null,
  intelligence: {
    profileVersion: 1,
    status: "verified",
    verifiedAt: "2026-07-01",
    summary: "Intelligence summary that must not become a raw packet dump.",
    designTools: ["figma"],
    deliveryFormats: ["web"],
    agentInterfaces: [{ type: "mcp", transport: "stdio" }],
    discovery: { textSearch: true, facets: ["type"] },
    governance: {
      defaultPersistence: "transient",
      assetRedistribution: "restricted",
      sourceAttribution: "required",
      userCredentialRequired: false,
      termsReviewRequired: true,
      notes: ["Raw governance notes must not be published."],
    },
    evidence: [
      {
        claim: "Recorded claim",
        sourceUrl: "https://example.com/docs",
        sourceType: "official-docs",
        verifiedAt: "2026-07-01",
        confidence: "certain",
      },
    ],
  },
};

const listed = {
  ...profiled,
  id: "source-two",
  slug: "source-two",
  name: "Source Two",
  url: "https://two.example",
  domain: "two.example",
  summary: "A catalogue-listed source with only identity metadata.",
  bestFor: [],
  capabilities: [],
  contentObjects: [],
  platforms: [],
  integrationMethods: [],
  accessRoutes: [],
  limitations: [],
  intelligence: null,
};

const archived = {
  ...listed,
  id: "source-six",
  slug: "source-six",
  name: "Source Six",
  status: "archived",
  archivedReason: "The site now redirects to Source One.",
  replacedBy: "source-one",
};

function collectKeys(value, keys = new Set()) {
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, keys);
    return keys;
  }
  if (!value || typeof value !== "object") return keys;
  for (const [key, child] of Object.entries(value)) {
    keys.add(key);
    collectKeys(child, keys);
  }
  return keys;
}

test("source v3 is deterministic and preserves compact canonical guidance", () => {
  const similarSources = [
    {
      profile: {
        ...listed,
        id: "source-three",
        slug: "source-three",
        name: "Source Three",
        url: "https://three.example",
      },
      differentiator: "Recorded task fit: Marketing pages.",
    },
    {
      profile: {
        ...listed,
        id: "source-four",
        slug: "source-four",
        name: "Source Four",
        url: "https://four.example",
      },
      differentiator: "Recorded capability: Design systems.",
    },
    {
      profile: {
        ...listed,
        id: "source-five",
        slug: "source-five",
        name: "Source Five",
        url: "https://five.example",
      },
      differentiator: "Recorded material: Source code.",
    },
  ];
  const first = createPublicSourceRepresentation(profiled, similarSources);
  const second = createPublicSourceRepresentation(profiled, similarSources);

  assert.equal(first.contract, PUBLIC_SOURCE_REPRESENTATION_CONTRACT);
  assert.equal(serializePublicJson(first), serializePublicJson(second));
  assert.equal(
    serializePublicSourceMarkdown(first),
    serializePublicSourceMarkdown(second),
  );
  assert.deepEqual(first.source, {
    id: profiled.id,
    slug: profiled.slug,
    name: profiled.name,
    purpose: profiled.summary,
    providerUrl: profiled.url,
    category: profiled.category,
    sourceType: profiled.sourceType,
    status: "active",
    useWhen: profiled.bestFor,
    whatToExplore: ["inspiration", "components", "websites"],
    accessRoutes: profiled.accessRoutes,
    importantLimitations: ["No source code"],
    alternatives: [
      {
        slug: "source-three",
        name: "Source Three",
        canonicalPath: "/resources/source-three",
        providerUrl: "https://three.example",
        differentiator: "Recorded task fit: Marketing pages.",
      },
      {
        slug: "source-four",
        name: "Source Four",
        canonicalPath: "/resources/source-four",
        providerUrl: "https://four.example",
        differentiator: "Recorded capability: Design systems.",
      },
    ],
  });
  assert.equal(first.source.alternatives.length, 2);
  // Coverage levels, verification dates, evidence and governance are not
  // part of the public representation.
  assert.equal(Object.hasOwn(first, "diagnostics"), false);

  const markdown = serializePublicSourceMarkdown(first);
  for (const heading of [
    "## Use it when",
    "## What to explore",
    "## How to access",
    "## Important limitations",
    "## Consider instead",
  ]) {
    assert.match(markdown, new RegExp(heading, "u"));
  }
  assert.match(markdown, /^Status: active$/mu);
  assert.doesNotMatch(markdown, /Archived/u);
  assert.equal(markdown.endsWith("\n"), true);
  assert.doesNotMatch(markdown, /[ \t]+$/gmu);
});

test("archived source v3 keeps its page data with the reason and replacement", () => {
  const document = createPublicSourceRepresentation(archived);

  assert.equal(document.source.status, "archived");
  assert.equal(
    document.source.archivedReason,
    "The site now redirects to Source One.",
  );
  assert.deepEqual(document.source.replacedBy, {
    slug: "source-one",
    canonicalPath: "/resources/source-one",
  });
  const markdown = serializePublicSourceMarkdown(document);
  assert.match(
    markdown,
    /\*\*Archived:\*\* The site now redirects to Source One\./u,
  );
  assert.match(markdown, /^Replaced by: \/resources\/source-one$/mu);
  assert.match(markdown, /^Status: archived$/mu);

  // Recorded access routes are a recommendation, so an archived guide drops
  // them, as its page does.
  const archivedProfiled = createPublicSourceRepresentation({
    ...profiled,
    status: "archived",
    archivedReason: "Off-scope.",
    replacedBy: null,
  });
  assert.equal(profiled.accessRoutes.length > 0, true);
  assert.deepEqual(archivedProfiled.source.accessRoutes, []);
  assert.match(
    serializePublicSourceMarkdown(archivedProfiled),
    /## How to access\n\nArchived: Tessli no longer recommends an access route\./u,
  );

  const withoutReplacement = createPublicSourceRepresentation({
    ...archived,
    replacedBy: null,
  });
  assert.equal(Object.hasOwn(withoutReplacement.source, "replacedBy"), false);

  // Active and needs-review sources never carry archive fields.
  const active = createPublicSourceRepresentation({
    ...listed,
    status: "needs-review",
  });
  assert.equal(active.source.status, "needs-review");
  assert.equal(Object.hasOwn(active.source, "archivedReason"), false);
});

test("sparse source v3 fallback stays sparse and does not invent guidance", () => {
  const document = createPublicSourceRepresentation(listed);

  assert.deepEqual(document.source.useWhen, []);
  assert.deepEqual(document.source.whatToExplore, []);
  assert.deepEqual(document.source.accessRoutes, []);
  assert.deepEqual(document.source.importantLimitations, []);
  assert.deepEqual(document.source.alternatives, []);
  assert.equal(Object.hasOwn(document, "diagnostics"), false);
  assert.match(
    serializePublicSourceMarkdown(document),
    /## How to access\n\nNone recorded/u,
  );
});

test("Collection v2 preserves ordered staged inspection and decision guidance", () => {
  const collection = {
    id: "collection-one",
    slug: "collection-one",
    title: "Landing-page direction",
    description: "A focused research path for a product landing page.",
    outcome: "Choose a direction to prototype.",
    audience: "Product teams.",
    status: "published",
    lastReviewedAt: "2026-08-01",
    resourceIds: ["source-two", "source-one"],
    stages: [
      {
        id: "baseline",
        title: "Establish a baseline",
        inspect: "Inspect hierarchy before visual treatment.",
        decision: "Choose the hierarchy to preserve.",
        resources: [
          { resource: { id: "source-two" }, role: "Establish the baseline." },
        ],
      },
      {
        id: "differentiate",
        title: "Find a differentiated direction",
        inspect: "Inspect component patterns and visual restraint.",
        decision: "Choose the direction to prototype.",
        resources: [
          { resource: { id: "source-one" }, role: "Test the richer option." },
        ],
      },
    ],
  };
  const document = createPublicCollectionRepresentation(collection, [
    profiled,
    listed,
  ]);

  assert.equal(document.contract, PUBLIC_COLLECTION_REPRESENTATION_CONTRACT);
  assert.deepEqual(document.collection, {
    id: collection.id,
    slug: collection.slug,
    title: collection.title,
    description: collection.description,
    outcome: collection.outcome,
    audience: collection.audience,
    stageCount: 2,
    resourceCount: 2,
    stages: [
      {
        order: 1,
        id: "baseline",
        title: "Establish a baseline",
        resources: [
          {
            order: 1,
            role: "Establish the baseline.",
            inspectPrompt: "Inspect hierarchy before visual treatment.",
            decisionPrompt: "Choose the hierarchy to preserve.",
            sourceGuide: {
              id: "source-two",
              slug: "source-two",
              name: "Source Two",
              canonicalPath: "/resources/source-two",
              jsonPath: "/resources/source-two/profile.json",
              markdownPath: "/resources/source-two/profile.md",
              providerUrl: "https://two.example",
            },
          },
        ],
      },
      {
        order: 2,
        id: "differentiate",
        title: "Find a differentiated direction",
        resources: [
          {
            order: 1,
            role: "Test the richer option.",
            inspectPrompt: "Inspect component patterns and visual restraint.",
            decisionPrompt: "Choose the direction to prototype.",
            sourceGuide: {
              id: "source-one",
              slug: "source-one",
              name: "Source One",
              canonicalPath: "/resources/source-one",
              jsonPath: "/resources/source-one/profile.json",
              markdownPath: "/resources/source-one/profile.md",
              providerUrl: "https://example.com",
              accessAction: browserAccess,
            },
          },
        ],
      },
    ],
  });
  const markdown = serializePublicCollectionMarkdown(document);
  assert.match(markdown, /# Tessli Collection — Landing-page direction/u);
  assert.match(markdown, /## Use this research path/u);
  assert.match(markdown, /## Staged decisions/u);
  assert.match(markdown, /\*\*Inspect:\*\* Inspect hierarchy/u);
  assert.match(markdown, /\*\*Decide:\*\* Choose the direction/u);
  assert.ok(
    markdown.indexOf("1. Establish a baseline") <
      markdown.indexOf("2. Find a differentiated direction"),
  );
  assert.doesNotMatch(markdown, /[ \t]+$/gmu);
});

test("public output omits coverage, evidence, governance, intelligence, and private data", () => {
  const source = createPublicSourceRepresentation(profiled, [
    {
      profile: { ...listed, id: "source-three", slug: "source-three" },
      differentiator: "Recorded task fit: Marketing pages.",
    },
  ]);
  const collection = createPublicCollectionRepresentation(
    {
      id: "collection-one",
      slug: "collection-one",
      title: "One stage",
      description: "One stage only for this formatter test.",
      outcome: "Make one decision.",
      audience: "Builders.",
      stages: [
        {
          id: "inspect",
          title: "Inspect",
          inspect: "Inspect the source.",
          decision: "Make a decision.",
          resources: [{ resource: { id: "source-one" }, role: "Review it." }],
        },
      ],
    },
    [profiled],
  );
  const keys = collectKeys({ source, collection });

  for (const forbiddenKey of [
    "contractVersion",
    "profileLevel",
    "coverage",
    "diagnostics",
    "governance",
    "recordedVerifiedAt",
    "evidenceCount",
    "verifiedAt",
    "evidence",
    "intelligence",
    "agentInterfaces",
    "discovery",
    "notes",
    "boardId",
    "boardIds",
    "savedIds",
    "localStorage",
    "cookie",
    "cookies",
    "account",
    "credential",
    "credentials",
  ]) {
    assert.equal(keys.has(forbiddenKey), false, forbiddenKey);
  }
  assert.doesNotMatch(
    serializePublicJson(source),
    /Raw governance notes|Intelligence summary|Recorded claim/u,
  );
  assert.equal(collection.playbook, undefined);
  assert.equal(collection.resources, undefined);
});

test("public headers remain readable, cacheable, indexable, and safe", () => {
  const headers = createPublicRepresentationHeaders({
    format: "json",
    filename: "tessli-source.json",
    canonicalPath: "/resources/source-one",
    jsonPath: "/resources/source-one/profile.json",
    markdownPath: "/resources/source-one/profile.md",
  });
  assert.equal(headers["Content-Type"], "application/json; charset=utf-8");
  assert.equal(headers["Access-Control-Allow-Origin"], "*");
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.equal(headers["X-Robots-Tag"], "index, follow");
  assert.equal(
    createPublicRepresentationHeaders({
      format: "markdown",
      filename: "tessli-source.md",
      canonicalPath: "/resources/source-six",
      jsonPath: "/resources/source-six/profile.json",
      markdownPath: "/resources/source-six/profile.md",
      index: false,
    })["X-Robots-Tag"],
    "noindex, follow",
  );
  assert.match(headers["Cache-Control"], /s-maxage=86400/u);
  assert.match(headers.Link, /rel="canonical"/u);
  assert.deepEqual(createPublicOptionsHeaders(), {
    Allow: "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Max-Age": "86400",
    "Cross-Origin-Resource-Policy": "cross-origin",
    "X-Content-Type-Options": "nosniff",
  });
});

test("formatter has no clock, network, storage, cookie, or environment dependency", async () => {
  const source = await readFile(
    new URL("../lib/public-representations.mjs", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(
    source,
    /Date\.now\(|new Date\(|fetch\(|XMLHttpRequest|localStorage|cookies\(|process\.env/u,
  );
});
