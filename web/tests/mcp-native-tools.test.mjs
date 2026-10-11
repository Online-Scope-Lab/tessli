import assert from "node:assert/strict";
import test from "node:test";

import library from "../data/library.json" with { type: "json" };
import rulesData from "../data/rules.json" with { type: "json" };
import {
  NATIVE_MCP_LIMITS,
  NativeMcpInputError,
  findNativeSources,
  getNativeItem,
  getNativeRules,
  getNativeSource,
  searchNativeItems,
  toSearchTerms,
} from "../lib/mcp-native-tools.ts";
import {
  createPublicLibraryItemRepresentation,
  createPublicSourceRepresentation,
} from "../lib/public-representations.mjs";
import { getSimilarSourceProfiles } from "../lib/similar-sources.ts";
import { getSourceProfile } from "../lib/source-profiles.ts";
import { retrieveTaskSources } from "../lib/task-retrieval.ts";
import { TESSLI_MCP_NODE_REQUIREMENT } from "../lib/mcp-tool-catalogue.ts";
import packageJson from "../package.json" with { type: "json" };

test("search terms drop stop words and plural endings deterministically", () => {
  assert.deepEqual(toSearchTerms("Build the Pricing tables for our UI"), [
    "pricing",
    "table",
  ]);
  assert.deepEqual(toSearchTerms("  "), []);
  assert.deepEqual(toSearchTerms("access"), ["access"]);
});

test("search_items ranks items by keyword matches over their notes", () => {
  const cases = [
    ["pricing section for two plans", "pricing-tiers"],
    ["settings page with delete account", "settings-account"],
    ["sign in form validation", "auth-forms"],
    ["data table with loading and empty states", "data-table"],
    ["landing page hero", "product-hero"],
    ["FAQ", "faq"],
    ["testimonials and logos", "social-proof-honest"],
    ["footer call to action", "closing-cta-footer"],
  ];
  for (const [brief, slug] of cases) {
    const result = searchNativeItems(brief);
    assert.equal(result.items[0]?.slug, slug, brief);
    assert.deepEqual(searchNativeItems(brief), result, `${brief} is stable`);
  }

  const result = searchNativeItems("pricing section for two plans");
  const [top] = result.items;
  assert.deepEqual(Object.keys(top), [
    "slug",
    "title",
    "kind",
    "category",
    "summary",
    "status",
    "rules",
    "install",
    "matched",
  ]);
  const notes = library.items.find(
    (item) => item.slug === "pricing-tiers",
  ).notes;
  assert.equal(top.title, notes.title);
  assert.equal(top.status, notes.status);
  assert.deepEqual(top.rules, notes.rules);
  assert.equal(
    top.install,
    "npx shadcn@latest add online-scope-lab/tessli/pricing-tiers",
  );
  assert.ok(top.matched.includes("pricing (title)"));
  assert.match(result.boundary, /deterministic keyword matching/);
  assert.ok(result.items.length <= NATIVE_MCP_LIMITS.items);
});

test("search_items bounds its limit and explains an empty result", () => {
  assert.equal(
    searchNativeItems("section", NATIVE_MCP_LIMITS.maxItems).items.length,
    library.items.filter((item) => item.notes.kind === "section").length,
  );
  assert.equal(searchNativeItems("section", 1).items.length, 1);
  assert.throws(() => searchNativeItems("faq", 0), NativeMcpInputError);
  assert.throws(
    () => searchNativeItems("faq", NATIVE_MCP_LIMITS.maxItems + 1),
    NativeMcpInputError,
  );

  const empty = searchNativeItems("xyzzy");
  assert.deepEqual(empty.items, []);
  assert.equal(empty.matchCount, 0);
  assert.match(empty.hint, /\/library/);
  assert.ok(empty.categories.includes("pricing"));
});

test("get_item returns the item.json document: code, full notes and install", () => {
  const rules = rulesData.rules.map(({ id, statement }) => ({
    id,
    statement,
  }));
  for (const item of library.items) {
    const result = getNativeItem(item.slug);
    assert.deepEqual(
      result,
      createPublicLibraryItemRepresentation(item, library.installPrefix, rules),
      item.slug,
    );
    assert.deepEqual(result.item.notes, item.notes);
    assert.equal(result.item.source.code, item.source);
    assert.equal(
      result.item.install,
      `npx shadcn@latest add online-scope-lab/tessli/${item.slug}`,
    );
    assert.ok(result.item.rules.every((rule) => rule.statement));
    // Bounded: no item is cut today, and every document stays compact.
    assert.ok(item.source.length <= NATIVE_MCP_LIMITS.itemFileCharacters);
    assert.ok(JSON.stringify(result).length < 64 * 1024, item.slug);
  }

  assert.deepEqual(getNativeItem("  faq "), getNativeItem("faq"));
  assert.throws(
    () => getNativeItem("not-a-tessli-item"),
    (error) =>
      error instanceof NativeMcpInputError &&
      /Unknown Tessli library item: not-a-tessli-item/.test(error.message),
  );
});

test("get_rules returns the compact index, exact ids or matching rules", () => {
  const index = getNativeRules();
  assert.equal(index.mode, "index");
  assert.equal(index.index, rulesData.index);
  assert.equal(index.ruleCount, rulesData.rules.length);
  assert.equal(index.path, "/rules/TESSLI.md");
  assert.equal(
    index.install,
    "npx shadcn@latest add online-scope-lab/tessli/rules",
  );
  assert.ok(Buffer.byteLength(index.index) < 8192);
  assert.deepEqual(getNativeRules("   "), index);

  const byId = getNativeRules("h-01, ST-03 and Z-99");
  assert.equal(byId.mode, "ids");
  assert.deepEqual(
    byId.rules.map((rule) => rule.id),
    ["H-01", "ST-03"],
  );
  assert.deepEqual(byId.unknownIds, ["Z-99"]);
  const h01 = rulesData.rules.find((rule) => rule.id === "H-01");
  assert.deepEqual(byId.rules[0], {
    id: "H-01",
    category: h01.category,
    title: h01.title,
    statement: h01.statement,
    check: h01.check,
    status: h01.status,
    path: "/rules/H-01",
    items: h01.items.map((item) => item.slug),
  });
  assert.throws(() => getNativeRules("Z-99"), NativeMcpInputError);
  assert.throws(() => getNativeRules("z-99 or Q-12"), NativeMcpInputError);

  // id-shaped text in a brief (Tailwind classes) is not a rule request.
  for (const tailwindBrief of [
    "card with h-12 header and p-10 padding",
    "a-11 thing",
    "empty state with h-12 icon and p-10 padding",
  ]) {
    const result = getNativeRules(tailwindBrief);
    assert.equal(result.mode, "search", tailwindBrief);
    assert.equal(result.unknownIds, undefined, tailwindBrief);
  }
  assert.equal(
    getNativeRules("empty state with h-12 icon and p-10 padding").rules[0].id,
    "ST-02",
  );
  const mixed = getNativeRules("follow H-01 for a card with an h-12 header");
  assert.equal(mixed.mode, "ids");
  assert.deepEqual(
    mixed.rules.map((rule) => rule.id),
    ["H-01"],
  );
  assert.equal(mixed.unknownIds, undefined);

  const category = getNativeRules("accessibility");
  assert.equal(category.mode, "search");
  assert.deepEqual(
    category.rules.map((rule) => rule.id),
    rulesData.rules
      .filter((rule) => rule.category === "accessibility")
      .map((rule) => rule.id),
  );

  const brief = getNativeRules("empty state");
  assert.equal(brief.rules[0].id, "ST-02");
  assert.ok(brief.rules.every((rule) => rule.check && rule.statement));
  assert.ok(brief.rules.length <= NATIVE_MCP_LIMITS.rules);
  assert.deepEqual(getNativeRules("empty state"), brief);

  const none = getNativeRules("xyzzy");
  assert.deepEqual(none.rules, []);
  assert.match(none.hint, /no topic/);
  assert.match(index.boundary, /draft until a maintainer signs it/);
});

const retrievalInput = {
  task: "Build a React animation",
  surface: "page transitions",
  framework: "react",
  needs: ["page transitions"],
};

test("find_sources delegates to the deterministic task retrieval", () => {
  const first = findNativeSources(retrievalInput);
  const second = findNativeSources({
    ...retrievalInput,
    needs: ["page-transitions", "page transitions"],
  });

  assert.deepEqual(first, retrieveTaskSources(retrievalInput));
  assert.deepEqual(first, second);
  assert.equal(first.input.task, "build a react animation");
  assert.ok(first.sources.length <= 8);
  assert.ok(first.sources.every((source) => source.status !== "archived"));

  const motion = first.sources.find((source) => source.slug === "motion");
  assert.ok(motion);
  assert.ok(motion.fitReasons.length > 0);
  assert.ok(motion.caveats.length > 0);
  assert.ok(motion.accessRoutes.length > 0);
  assert.ok(motion.alternatives.length > 0);

  assert.throws(
    () => findNativeSources({ task: "  ?! " }),
    NativeMcpInputError,
  );
});

test("get_source returns the public source profile, archived ones included", () => {
  const bySlug = getNativeSource("motion");
  const profile = getSourceProfile("motion");
  assert.deepEqual(bySlug, getNativeSource(profile.id));
  assert.deepEqual(
    bySlug,
    createPublicSourceRepresentation(
      profile,
      getSimilarSourceProfiles(profile, 2),
    ),
  );
  assert.equal(bySlug.contract, "tessli.public-source.v3");
  assert.equal(bySlug.source.status, "active");
  assert.ok(bySlug.source.useWhen.length > 0);
  assert.ok(bySlug.source.accessRoutes.some((route) => route.preferred));
  assert.ok(bySlug.source.alternatives.length <= 2);
  assert.ok(
    bySlug.source.alternatives.every(
      (alternative) => alternative.differentiator,
    ),
  );
  for (const removed of ["profileLevel", "coverageNote", "evidence"]) {
    assert.equal(Object.hasOwn(bySlug.source, removed), false, removed);
  }

  // Archived: still resolvable as a record, with its reason and replacement,
  // never with an access route or an archived alternative.
  const archived = getNativeSource("autoanimate");
  assert.equal(archived.source.status, "archived");
  assert.match(archived.source.archivedReason, /\S/u);
  assert.deepEqual(archived.source.accessRoutes, []);
  const redirected = getNativeSource("screenlane");
  assert.equal(redirected.source.status, "archived");
  assert.deepEqual(redirected.source.replacedBy, {
    slug: "page-flows",
    canonicalPath: "/resources/page-flows",
  });
  assert.ok(
    archived.source.alternatives.every(
      (alternative) => getSourceProfile(alternative.slug).status !== "archived",
    ),
  );

  assert.throws(
    () => getNativeSource("not-a-tessli-resource"),
    (error) =>
      error instanceof NativeMcpInputError &&
      /Unknown Tessli source: not-a-tessli-resource/.test(error.message),
  );
});

test("the Node.js requirement is one value across the server, docs and package", async () => {
  const { readFile } = await import("node:fs/promises");
  assert.equal(TESSLI_MCP_NODE_REQUIREMENT, "Node.js 22.18 or later");
  assert.equal(packageJson.engines.node, ">=22.18.0");
  for (const path of [
    "../../docs/tessli-native-mcp.md",
    "../../docs/decisions.md",
    "../../README.md",
    "../../CONTRIBUTING.md",
  ]) {
    const text = await readFile(new URL(path, import.meta.url), "utf8");
    assert.ok(text.includes(TESSLI_MCP_NODE_REQUIREMENT), path);
    assert.doesNotMatch(text, /Node\.js 22 or (?:later|newer)/, path);
  }
  const page = await readFile(
    new URL("../app/(site)/for-ai/page.tsx", import.meta.url),
    "utf8",
  );
  assert.match(page, /\{TESSLI_MCP_NODE_REQUIREMENT\}/);
});
