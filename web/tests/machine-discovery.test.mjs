import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const webRoot = path.resolve(path.dirname(currentFile), "..");

async function read(relativePath) {
  return readFile(path.join(webRoot, relativePath), "utf8");
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function quotedPath(pathname) {
  return new RegExp(`["']${escapeRegex(pathname)}["']`);
}

test("robots metadata advertises the sitemap and blocks unpublished routes", async () => {
  const robots = await read("app/robots.ts");

  assert.match(robots, /MetadataRoute\.Robots/);
  assert.match(robots, /disallow:\s*\[/);
  assert.match(robots, /sitemap/i);
  assert.match(robots, /sitemap\.xml/);

  for (const pathname of ["/lab/", "/preview/"]) {
    assert.match(robots, quotedPath(pathname), `robots disallows ${pathname}`);
  }

  // /submit and /suggest are redirects to /contribute now, so robots no
  // longer needs to hide them.
  for (const pathname of ["/saved", "/boards", "/submit", "/suggest"]) {
    assert.doesNotMatch(
      robots,
      quotedPath(pathname),
      `robots no longer lists removed ${pathname}`,
    );
  }
});

test("llms discovery route is static, deterministic, and bounded to public truth", async () => {
  const route = await read("app/llms.txt/route.ts");

  assert.match(route, /export const dynamic = ["']force-static["']/);
  assert.match(route, /export const revalidate = false/);
  assert.match(route, /text\/plain(?:;\s*charset=utf-8)?/i);
  assert.match(route, /export (?:async )?function GET/);
  assert.match(route, /export (?:async )?function HEAD/);
  assert.match(route, /export (?:async )?function OPTIONS/);
  assert.doesNotMatch(
    route,
    /Date\.now\(|new Date\(|fetch\(|XMLHttpRequest|localStorage|cookies\(/u,
  );

  for (const fragment of [
    "/library",
    "/library/<slug>/item.json",
    "/library/<slug>/item.md",
    "/rules/<ID>",
    "/resources",
    "/resources/<slug>/profile.json",
    "/resources/<slug>/profile.md",
    "/collections",
    "/resources/landingfolio/profile.json",
    "/resources/landingfolio/profile.md",
    "/collections/saas-landing-pages/collection.json",
    "/collections/saas-landing-pages/collection.md",
    "/for-ai#local-mcp",
    "skills/tessli/SKILL.md",
  ]) {
    assert.match(route, new RegExp(escapeRegex(fragment)));
  }

  // Install commands, paths and counts come from the data, never literals.
  for (const source of [
    /installCommand\("<slug>"\)/,
    /rulesInstallCommand\(\)/,
    /RULES_INDEX_PATH/,
    /getLibraryItems\(\)/,
    /getRules\(\)/,
    /getBrowsableSourceCounts\(\)/,
    /getPublishedCollections\(\)/,
    /TESSLI_MCP_TOOL_NAMES/,
  ]) {
    assert.match(route, source);
  }
  assert.doesNotMatch(route, /\b\d+ (?:library )?(?:items|rules|sources)\b/);

  assert.match(route, /local, read-only stdio process/i);
  assert.match(route, /no hosted(?: or remote)? MCP endpoint/i);
  assert.match(route, /(?:no|not)\b[\s\S]{0,80}\bbulk\b/i);
  assert.match(route, /No accounts:[\s\S]{0,80}no sign-in/i);
  assert.doesNotMatch(route, /\bBoards?\b|\bSaved\b|\/saved|\/boards/u);
  assert.match(route, /(?:no|not)\b[\s\S]{0,80}\bcredential/i);
  assert.match(route, /(?:no|not)\b[\s\S]{0,80}\bcrawl/i);
  assert.match(route, /(?:no|not)\b[\s\S]{0,80}\buniversal\b/i);
  assert.match(route, /(?:no|not)\b[\s\S]{0,80}\btaste\b/i);
  assert.match(route, /does not claim[\s\S]{0,80}improve AI output/i);
  // The only "taste" and "improve" mentions are inside the does-not-claim line.
  assert.equal(route.match(/\btaste\b/giu)?.length, 1);
  assert.equal(route.match(/\bimprove/giu)?.length, 1);
});

test("sitemap lists only public discovery routes and machine representations", async () => {
  const sitemap = await read("app/sitemap.ts");

  for (const pathname of [
    "/library",
    "/resources",
    "/collections",
    "/for-ai",
    "/contribute",
    "/llms.txt",
  ]) {
    assert.match(sitemap, quotedPath(pathname), `sitemap includes ${pathname}`);
  }

  assert.match(sitemap, /getLibraryItems\(\)\.flatMap/);
  assert.match(sitemap, /\$\{origin\}\/library\/\$\{item\.slug\}/);
  assert.match(sitemap, /item\.json/);
  assert.match(sitemap, /item\.md/);

  assert.match(sitemap, /getPublishedCollections\(\)\.flatMap/);
  assert.match(sitemap, /\$\{origin\}\/collections\/\$\{collection\.slug\}/);
  assert.match(sitemap, /collection\.json/);
  assert.match(sitemap, /collection\.md/);
  assert.match(sitemap, /getBrowsableSourceProfiles\(\)\.flatMap/);
  assert.match(sitemap, /\$\{origin\}\/resources\/\$\{profile\.slug\}/);
  assert.match(sitemap, /profile\.json/);
  assert.match(sitemap, /profile\.md/);

  for (const pathname of [
    "/auth",
    "/submit",
    "/suggest",
    "/saved",
    "/boards",
    "/lab",
    "/preview",
  ]) {
    assert.doesNotMatch(
      sitemap,
      quotedPath(pathname),
      `sitemap excludes ${pathname}`,
    );
  }
});
