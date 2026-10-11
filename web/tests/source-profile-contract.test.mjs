import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import catalogue from "../data/catalogue.json" with { type: "json" };
import {
  ACCESS_ROUTE_KINDS,
  ACCESS_ROUTE_PILOT_SOURCE_IDS,
} from "../data/access-route-pilot.ts";
import { getAllIntelligenceProfiles } from "../lib/intelligence.ts";
import { resolvePublishedCollections } from "../lib/collections.ts";
import {
  createNativeCollection,
  getNativeSource,
} from "../lib/mcp-native-tools.ts";
import { createPublicSourceRepresentation } from "../lib/public-representations.mjs";
import {
  SOURCE_PROFILE_CONTRACT_VERSION,
  SOURCE_TYPE_BY_CATEGORY,
  createSourceProfileIndex,
  getAllSourceProfiles,
  getArchiveNotice,
  getBrowsableSourceCounts,
  getBrowsableSourceProfiles,
  getSourceContractSummary,
  getSourceProfile,
} from "../lib/source-profiles.ts";
import { validateSourceProfileContract } from "../scripts/check-source-profile-contract.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(
  __dirname,
  "../../schemas/source-profile.schema.json",
);

const batch13Identifiers = [
  "google-fonts",
  "radix-ui",
  "headless-ui",
  "react-aria",
  "gsap",
  "lottiefiles",
  "rive",
  "spline",
  "react-three-fiber",
  "lucide",
];

const batch14Identifiers = [
  "fonts-in-use",
  "font-squirrel",
  "free-faces",
  "open-foundry",
  "fontpair",
  "velvetyne",
  "adobe-fonts",
  "theatre-js",
  "anime-js",
  "autoanimate",
];

const expandedBatchIdentifiers = [...batch13Identifiers, ...batch14Identifiers];

const requiredSourceFields = [
  "id",
  "slug",
  "name",
  "url",
  "domain",
  "summary",
  "category",
  "sourceType",
  "accessModel",
  "bestFor",
  "capabilities",
  "contentObjects",
  "platforms",
  "frameworks",
  "integrationMethods",
  "accessRoutes",
  "limitations",
  "status",
  "archivedReason",
  "replacedBy",
];

const removedFields = ["profileLevel", "verifiedAt", "evidence", "coverage"];

test("source profile schema defines the complete canonical v2 contract", () => {
  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
  assert.equal(
    schema.$id,
    "https://tessli.dev/schemas/source-profile.schema.json",
  );
  assert.equal(
    schema.properties.contractVersion.const,
    SOURCE_PROFILE_CONTRACT_VERSION,
  );
  for (const field of requiredSourceFields) {
    assert.ok(
      schema.required.includes(field),
      `Missing required field ${field}`,
    );
    assert.ok(schema.properties[field], `Missing property schema ${field}`);
  }
  assert.equal(SOURCE_PROFILE_CONTRACT_VERSION, 2);
  assert.deepEqual(schema.properties.status.enum, [
    "active",
    "needs-review",
    "archived",
  ]);
  for (const field of removedFields) {
    assert.equal(schema.properties[field], undefined, field);
    assert.equal(schema.required.includes(field), false, field);
  }
});

test("every catalogue resource has one deterministic source profile", () => {
  const profiles = getAllSourceProfiles();
  const total = catalogue.resources.length;
  assert.equal(profiles.length, total);
  assert.equal(new Set(profiles.map((profile) => profile.id)).size, total);
  assert.equal(new Set(profiles.map((profile) => profile.slug)).size, total);

  for (const resource of catalogue.resources) {
    const profile = getSourceProfile(resource.id);
    assert.ok(profile);
    assert.equal(profile.slug, resource.slug);
    assert.equal(getSourceProfile(resource.slug)?.id, resource.id);
    assert.equal(profile.name, resource.name);
    assert.equal(profile.url, resource.url);
    assert.equal(profile.domain, resource.domain);
    assert.equal(profile.summary, resource.description);
    assert.equal(profile.category, resource.category);
    assert.deepEqual(profile.accessModel, { access: resource.access });
    assert.equal(profile.status, resource.status);
    for (const field of removedFields) {
      assert.equal(Object.hasOwn(profile, field), false, field);
    }
  }
});

test("AccessRoute is canonical for exactly ten recorded pilot sources and honest for every other source", () => {
  assert.equal(ACCESS_ROUTE_PILOT_SOURCE_IDS.length, 10);
  assert.equal(new Set(ACCESS_ROUTE_PILOT_SOURCE_IDS).size, 10);

  const pilotProfiles = getAllSourceProfiles().filter((profile) =>
    ACCESS_ROUTE_PILOT_SOURCE_IDS.includes(profile.id),
  );
  const fallbackProfiles = getAllSourceProfiles().filter(
    (profile) => !ACCESS_ROUTE_PILOT_SOURCE_IDS.includes(profile.id),
  );
  assert.equal(pilotProfiles.length, 10);
  assert.equal(
    fallbackProfiles.length,
    getAllSourceProfiles().length - pilotProfiles.length,
  );

  const pilotKinds = new Set(
    pilotProfiles.flatMap((profile) =>
      profile.accessRoutes.map((route) => route.kind),
    ),
  );
  for (const kind of [
    "browser",
    "documentation",
    "package-registry",
    "source-code",
    "api",
    "mcp",
    "cli",
  ]) {
    assert.ok(pilotKinds.has(kind), `Missing ${kind} pilot route.`);
  }

  for (const profile of getAllSourceProfiles()) {
    assert.equal(
      profile.accessRoutes.filter((route) => route.preferred).length,
      1,
      `${profile.id} must declare exactly one preferred route`,
    );
    for (const route of profile.accessRoutes) {
      assert.ok(ACCESS_ROUTE_KINDS.includes(route.kind));
      assert.ok(["none", "user", "unknown"].includes(route.auth));
      assert.ok(route.agentAction.length > 0);
    }
  }

  for (const profile of fallbackProfiles) {
    assert.deepEqual(profile.accessRoutes, [
      {
        kind: "browser",
        url: profile.url,
        preferred: true,
        auth: "unknown",
        agentAction:
          "Open the canonical provider URL; sign-in and other access requirements are not recorded.",
      },
    ]);
  }
});

test("contract summary and public counts are derived from the data", () => {
  const nonArchived = catalogue.resources.filter(
    (resource) => resource.status !== "archived",
  );
  assert.deepEqual(getSourceContractSummary(), {
    contractVersion: 2,
    resourceCount: catalogue.resources.length,
    browsableCount: nonArchived.length,
    intelligenceProfileCount: getAllIntelligenceProfiles().length,
  });
  assert.deepEqual(getBrowsableSourceCounts(), {
    sources: nonArchived.length,
    categories: new Set(nonArchived.map((resource) => resource.category)).size,
  });
});

test("sources with an intelligence profile expose its normalized guidance", () => {
  const relume = getSourceProfile("relume");
  assert.ok(relume?.intelligence);
  assert.deepEqual(relume.bestFor, relume.intelligence.workflowFit);
  assert.deepEqual(relume.capabilities, relume.intelligence.capabilities);
  assert.deepEqual(relume.contentObjects, relume.intelligence.contentObjects);
  assert.deepEqual(relume.platforms, relume.intelligence.platforms);
  assert.deepEqual(relume.frameworks, relume.intelligence.frameworks);
  assert.deepEqual(
    relume.integrationMethods,
    relume.intelligence.integrationMethods,
  );
  assert.deepEqual(relume.limitations, relume.intelligence.limitations);

  for (const identifier of expandedBatchIdentifiers) {
    const profile = getSourceProfile(identifier);
    assert.ok(profile?.intelligence, `${identifier} must have intelligence`);
    assert.ok(profile.bestFor.length > 0);
    assert.ok(profile.capabilities.length > 0);
    assert.ok(profile.contentObjects.length > 0);
    assert.ok(profile.limitations.length > 0);
  }
});

test("sources without an intelligence profile expose only their source file's fields", () => {
  const byId = new Map(
    catalogue.resources.map((resource) => [resource.id, resource]),
  );
  const sparse = getAllSourceProfiles().filter(
    (profile) => profile.intelligence === null,
  );
  assert.equal(
    sparse.length,
    getAllSourceProfiles().length - getAllIntelligenceProfiles().length,
  );
  for (const profile of sparse) {
    const resource = byId.get(profile.id);
    assert.deepEqual(profile.bestFor, resource.bestFor ?? []);
    assert.deepEqual(profile.limitations, resource.limitations ?? []);
    assert.deepEqual(profile.frameworks, resource.frameworks ?? []);
    assert.deepEqual(profile.capabilities, []);
    assert.deepEqual(profile.contentObjects, []);
    assert.deepEqual(profile.platforms, []);
    assert.deepEqual(profile.integrationMethods, []);
  }
});

const fixtureResource = {
  domain: "fixture.example",
  description: "A fixture source used only by tests.",
  category: "typography",
  access: "free",
};
const fixtures = [
  {
    ...fixtureResource,
    id: "resource-fixture-active",
    slug: "fixture-active",
    name: "Fixture Active",
    url: "https://active.fixture.example",
    status: "active",
  },
  {
    ...fixtureResource,
    id: "resource-fixture-review",
    slug: "fixture-review",
    name: "Fixture Review",
    url: "https://review.fixture.example",
    category: "icons",
    status: "needs-review",
  },
  {
    ...fixtureResource,
    id: "resource-fixture-archived",
    slug: "fixture-archived",
    name: "Fixture Archived",
    url: "https://archived.fixture.example",
    status: "archived",
    archivedReason: "The site now redirects to Fixture Active.",
    replacedBy: "fixture-active",
  },
  {
    ...fixtureResource,
    id: "resource-fixture-gone",
    slug: "fixture-gone",
    name: "Fixture Gone",
    url: "https://gone.fixture.example",
    status: "archived",
    archivedReason: "The site no longer exists.",
  },
];

test("archived sources are kept by ID and slug but never browsable", () => {
  const index = createSourceProfileIndex(fixtures);

  assert.deepEqual(
    index.all.map((profile) => profile.slug),
    ["fixture-active", "fixture-review", "fixture-archived", "fixture-gone"],
  );
  assert.deepEqual(
    index.browsable.map((profile) => profile.slug),
    ["fixture-active", "fixture-review"],
  );
  const archived = index.get("resource-fixture-archived");
  assert.equal(index.get("fixture-archived"), archived);
  assert.equal(archived.status, "archived");
  assert.equal(
    archived.archivedReason,
    "The site now redirects to Fixture Active.",
  );
  assert.equal(archived.replacedBy, "fixture-active");
  assert.equal(index.get("fixture-active").archivedReason, null);
  assert.equal(index.get("fixture-active").replacedBy, null);

  // The real catalogue applies the same rule.
  assert.ok(
    getBrowsableSourceProfiles().every(
      (profile) => profile.status !== "archived",
    ),
  );
});

test("an archived source page shows its reason and a non-archived replacement", () => {
  const index = createSourceProfileIndex(fixtures);

  assert.deepEqual(getArchiveNotice(index.get("fixture-archived"), index.get), {
    reason: "The site now redirects to Fixture Active.",
    replacement: { slug: "fixture-active", name: "Fixture Active" },
  });
  assert.deepEqual(getArchiveNotice(index.get("fixture-gone"), index.get), {
    reason: "The site no longer exists.",
    replacement: null,
  });
  assert.equal(getArchiveNotice(index.get("fixture-active"), index.get), null);
  assert.equal(getArchiveNotice(index.get("fixture-review"), index.get), null);

  const page = fs.readFileSync(
    path.join(__dirname, "../app/resources/[slug]/page.tsx"),
    "utf8",
  );
  const actions = fs.readFileSync(
    path.join(__dirname, "../components/source-detail/source-actions.tsx"),
    "utf8",
  );
  // Archived pages still render (every source gets a static page), are
  // noindex, state the reason, link the replacement, and never promote Visit.
  assert.match(page, /getAllSourceProfiles\(\)\.map/);
  assert.match(
    page,
    /isArchivedSource\(profile\)\s*\?\s*\{ robots: \{ index: false, follow: true \} \}/,
  );
  assert.match(page, /<strong>Archived:<\/strong> \{archiveNotice\.reason\}/);
  assert.match(
    page,
    /href=\{`\/resources\/\$\{archiveNotice\.replacement\.slug\}`\}/,
  );
  const archivedBranch = actions.slice(
    actions.indexOf('resource.status === "archived"'),
    actions.indexOf(") : ("),
  );
  assert.match(archivedBranch, /Original address/);
  const guide = fs.readFileSync(
    path.join(__dirname, "../components/source-detail/intelligence-detail.tsx"),
    "utf8",
  );
  assert.match(
    guide,
    /profile\.status === "archived" \?[\s\S]*?no longer recommends an access\s+route/,
  );
  assert.doesNotMatch(archivedBranch, /buttonClassName|Visit source/);
});

test("source type is a deterministic category classification, not provider fact", () => {
  assert.deepEqual(
    Object.keys(SOURCE_TYPE_BY_CATEGORY).sort(),
    catalogue.categories.map((category) => category.id).sort(),
  );
  for (const profile of getAllSourceProfiles()) {
    assert.equal(profile.sourceType, SOURCE_TYPE_BY_CATEGORY[profile.category]);
    assert.equal(profile.sourceTypeBasis, "category-classification");
  }
});

test("website-ready source profiles and MCP preserve the same source identity", () => {
  for (const identifier of ["relume", ...expandedBatchIdentifiers]) {
    const sourceProfile = getSourceProfile(identifier);
    const nativeSource = getNativeSource(identifier).source;
    assert.ok(sourceProfile);
    assert.equal(nativeSource.id, sourceProfile.id);
    assert.equal(nativeSource.slug, sourceProfile.slug);
    assert.equal(nativeSource.status, sourceProfile.status);
    assert.deepEqual(
      nativeSource.whatItHelpsWith,
      sourceProfile.bestFor.slice(0, 4),
    );
  }
});

test("website profiles, public representations, and local MCP share exact AccessRoute values", () => {
  for (const identifier of ["landingfolio", "google-fonts", "designindex"]) {
    const sourceProfile = getSourceProfile(identifier);
    assert.ok(sourceProfile);
    const publicRepresentation =
      createPublicSourceRepresentation(sourceProfile);
    const nativeSource = getNativeSource(identifier).source;

    assert.deepEqual(
      publicRepresentation.source.accessRoutes,
      sourceProfile.accessRoutes,
    );
    assert.deepEqual(nativeSource.accessRoutes, sourceProfile.accessRoutes);
  }
});

test("source profile validator accepts the complete deterministic baseline", () => {
  const report = validateSourceProfileContract();
  assert.equal(report.valid, true, JSON.stringify(report.errors, null, 2));
  assert.equal(report.resourceCount, catalogue.resources.length);
  assert.equal(
    report.intelligenceProfileCount,
    getAllIntelligenceProfiles().length,
  );
  assert.equal(Object.hasOwn(report, "coverageCounts"), false);
});

const fixtureCollection = {
  id: "collection-fixture",
  slug: "fixture-path",
  title: "Fixture path",
  description: "A fixture collection used only by tests.",
  outcome: "A fixture outcome.",
  audience: "Tests",
  resourceIds: [
    "resource-fixture-active",
    "resource-fixture-archived",
    "resource-fixture-review",
    "resource-fixture-gone",
  ],
  stages: [
    {
      id: "look",
      title: "Look",
      inspect: "Inspect fixtures.",
      decision: "Decide on fixtures.",
      items: [
        { resourceId: "resource-fixture-active", role: "Active role" },
        { resourceId: "resource-fixture-archived", role: "Archived role" },
      ],
    },
    {
      id: "gone",
      title: "Gone",
      inspect: "Only archived sources.",
      decision: "Never shown.",
      items: [{ resourceId: "resource-fixture-gone", role: "Gone role" }],
    },
    {
      id: "review",
      title: "Review",
      inspect: "Inspect the review fixture.",
      decision: "Decide on it.",
      items: [{ resourceId: "resource-fixture-review", role: "Review role" }],
    },
  ],
  coverStyle: "editorial",
  lastReviewedAt: "2026-10-11",
  status: "published",
};

test("collection pages drop archived members and hide emptied stages", () => {
  const [collection] = resolvePublishedCollections({
    resources: fixtures,
    categories: [
      { id: "typography", label: "Typography" },
      { id: "icons", label: "Icons" },
    ],
    collections: [
      fixtureCollection,
      { ...fixtureCollection, slug: "fixture-draft", status: "draft" },
    ],
  });

  assert.equal(collection.slug, "fixture-path");
  assert.deepEqual(
    collection.stages.map((stage) => [
      stage.id,
      stage.resources.map(({ resource }) => resource.slug),
    ]),
    [
      ["look", ["fixture-active"]],
      ["review", ["fixture-review"]],
    ],
  );
  assert.deepEqual(collection.resourceIds, [
    "resource-fixture-active",
    "resource-fixture-review",
  ]);
  assert.equal(collection.resources.length, 2);
});

test("the MCP collection tool drops archived members from sources, stages and counts", () => {
  const index = createSourceProfileIndex(fixtures);
  const output = createNativeCollection(fixtureCollection, index.get);

  assert.equal(output.resourceCount, 2);
  assert.equal(output.returnedSourceCount, 2);
  assert.deepEqual(
    output.sources.map((source) => [source.order, source.slug, source.status]),
    [
      [1, "fixture-active", "active"],
      [2, "fixture-review", "needs-review"],
    ],
  );
  assert.deepEqual(
    output.stages.map((stage) => [
      stage.id,
      stage.sources.map((source) => source.sourceSlug),
    ]),
    [
      ["look", ["fixture-active"]],
      ["gone", []],
      ["review", ["fixture-review"]],
    ],
  );
});

test("every public listing, search and count reads only non-archived sources", () => {
  const read = (relativePath) =>
    fs.readFileSync(path.join(__dirname, "..", relativePath), "utf8");
  for (const file of [
    "app/resources/page.tsx",
    "app/sitemap.ts",
    "lib/task-retrieval.ts",
    "lib/similar-sources.ts",
  ]) {
    const source = read(file);
    assert.match(source, /getBrowsableSourceProfiles\(\)/, file);
    assert.doesNotMatch(source, /getAllSourceProfiles/, file);
  }
  for (const file of [
    "components/explore-facts/explore-facts.tsx",
    "app/about/page.tsx",
    "app/not-found.tsx",
    "app/lab/page.tsx",
  ]) {
    assert.match(read(file), /getBrowsableSourceCounts\(\)/, file);
  }
  // Collections and the MCP collection tool are exercised with fixtures
  // above; the real data goes through the same functions.
  assert.match(
    read("lib/collections.ts"),
    /resolvePublishedCollections\(catalogue\)/,
  );
  assert.match(
    read("lib/mcp-native-tools.ts"),
    /return createNativeCollection\(resolveCollection\(identifier\)\)/,
  );
});
