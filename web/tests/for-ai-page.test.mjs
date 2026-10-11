import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  TESSLI_MCP_SERVER_NAME,
  TESSLI_MCP_SERVER_VERSION,
  TESSLI_MCP_TOOL_CATALOGUE,
  TESSLI_MCP_TOOL_NAMES,
} from "../lib/mcp-tool-catalogue.ts";

const currentFile = fileURLToPath(import.meta.url);
const webRoot = path.resolve(path.dirname(currentFile), "..");

async function read(relativePath) {
  return readFile(path.join(webRoot, relativePath), "utf8");
}

test("shared MCP catalogue preserves the exact five-tool public contract", () => {
  assert.equal(TESSLI_MCP_SERVER_NAME, "tessli");
  assert.equal(TESSLI_MCP_SERVER_VERSION, "0.3.0");
  assert.deepEqual(TESSLI_MCP_TOOL_NAMES, [
    "search_items",
    "get_item",
    "get_rules",
    "find_sources",
    "get_source",
  ]);
  assert.equal(TESSLI_MCP_TOOL_CATALOGUE.length, 5);
  assert.equal(new Set(TESSLI_MCP_TOOL_NAMES).size, 5);

  for (const tool of TESSLI_MCP_TOOL_CATALOGUE) {
    assert.ok(tool.title.length > 0);
    assert.ok(tool.description.length > 0);
    assert.ok(tool.inputs.length > 0);
    assert.ok(tool.returns.length > 0);
    assert.ok(tool.limit.length > 0);
    assert.doesNotMatch(
      `${tool.description} ${tool.returns}`,
      /\btaste\b|improves? AI/iu,
    );
  }
});

test("MCP server consumes shared names and descriptions without expanding scope", async () => {
  const server = await read("mcp/server.ts");

  assert.match(server, /from "\.\.\/lib\/mcp-tool-catalogue\.ts"/);
  for (const name of TESSLI_MCP_TOOL_NAMES) {
    assert.match(server, new RegExp(`getTessliMcpToolMetadata\\("${name}"\\)`));
  }
  assert.equal(server.match(/server\.registerTool\(/g)?.length, 5);
  assert.match(server, /name: TESSLI_MCP_SERVER_NAME/);
  assert.match(server, /version: TESSLI_MCP_SERVER_VERSION/);
  assert.match(server, /title: searchItemsTool\.title/);
  assert.match(server, /description: sourceTool\.description/);
  assert.doesNotMatch(
    server,
    /search_resources|get_resource_profile|compare_resources|verify_resource|find_alternatives|get_collection|create_research_brief/,
  );
  assert.doesNotMatch(server, /Http|SSE|OAuth|\.listen\s*\(/);
});

test("For AI page covers install, the rules file, MCP, plain files and its non-claims", async () => {
  const page = await read("app/(site)/for-ai/page.tsx");

  assert.match(page, /title: "For AI"/);
  assert.match(page, /data-for-ai-page/);
  assert.match(page, /id="main-content"/);
  for (const marker of [
    "data-for-ai-install",
    "data-for-ai-rules-file",
    "data-for-ai-workflow",
    "data-for-ai-local-mcp",
    "data-for-ai-tools",
    "data-for-ai-agent-gets",
    "data-for-ai-representations",
    "data-for-ai-not-claimed",
  ]) {
    assert.match(page, new RegExp(marker), marker);
  }
  assert.match(page, /data-for-ai-remote-status="unavailable"/);
  for (const heading of [
    "Code and reasoning, in the formats agents read.",
    "Install with the shadcn CLI.",
    "TESSLI.md keeps every rule in reach.",
    "How an agent uses Tessli.",
    "Local MCP server.",
    "What an agent gets.",
    "Plain files at stable URLs.",
    "What Tessli does not claim.",
  ]) {
    assert.ok(page.includes(heading), heading);
  }

  // Commands, counts and tool names come from the data and the catalogue.
  assert.match(page, /installCommand\(exampleItem\.slug\)/);
  assert.match(page, /rulesInstallCommand\(\)/);
  assert.match(page, /getRulesIndex\(\)/);
  assert.match(page, /TESSLI_MCP_TOOL_CATALOGUE\.map/);
  assert.match(page, /RULES_INDEX_PATH/);
  assert.doesNotMatch(page, /\b\d+ (?:items|rules|sources)\b/);
  // The client runs the server file directly: `npm run` writes a banner to
  // standard output, which would corrupt the stdio stream.
  const packageJson = JSON.parse(await read("package.json"));
  assert.equal(packageJson.scripts.mcp, "node mcp/server.ts");
  assert.match(page, /npm run mcp/);
  assert.match(page, /"command": "node"/);
  assert.match(
    page,
    /"args": \["\/absolute\/path\/to\/tessli\/web\/mcp\/server\.ts"\]/,
  );
  assert.match(page, /skills\/tessli\/SKILL\.md/);
  assert.match(page, /href="\/llms\.txt"/);
  assert.match(page, /item\.json/);
  assert.match(page, /item\.md/);
  assert.match(page, /profile\.json/);
  assert.match(page, /profile\.md/);
  assert.match(page, /href="#local-mcp"/);
  assert.match(page, /id="local-mcp"/);
  assert.match(page, /There is no hosted or remote Tessli MCP/);
  assert.match(page, /read-only/);

  // One eyebrow site-wide (home hero); numbers only for the real sequence.
  assert.doesNotMatch(page, /styles\.eyebrow|styles\.cardNumber|padStart/);
  assert.match(page, /\{index \+ 1\}/);
  assert.doesNotMatch(page, /→/);
  assert.match(
    page,
    /Open the Tessli repository <span aria-hidden="true">↗<\/span>/,
  );
  assert.doesNotMatch(page, /\bBoards?\b|href="\/(?:boards|saved)"/);
  assert.doesNotMatch(
    page,
    /getSourceContractSummary|SOURCE_FRESHNESS_WINDOWS/,
  );
  assert.doesNotMatch(page, /\b(?:coverage|evidence|verification)\b/i);
  // Never a taste or improvement claim; the non-claim says it in plain words.
  assert.doesNotMatch(page, /\btaste\b/i);
  assert.match(page, /That it makes AI-generated UI better\./);
});

test("For AI route is discoverable only after its page exists", async () => {
  const [navigation, footer, sitemap] = await Promise.all([
    read("components/site-header/navigation.ts"),
    read("components/site-footer/footer-navigation.ts"),
    read("app/sitemap.ts"),
  ]);

  assert.match(
    navigation,
    /label: "For AI"[\s\S]*?href: "\/for-ai"[\s\S]*?available: true/,
  );
  assert.match(footer, /label: "For AI", href: "\/for-ai"/);
  assert.match(sitemap, /"\/for-ai"/);
});

test("For AI visual contract is route-scoped, responsive, and overflow safe", async () => {
  const css = await read("app/(site)/for-ai/for-ai.module.css");

  assert.match(css, /\.hero \{/);
  assert.match(css, /\.codeBlock \{[\s\S]*?overflow-x: auto/);
  assert.match(css, /@media \(max-width: 1023px\)/);
  assert.match(css, /@media \(max-width: 767px\)/);
  assert.match(css, /@media \(max-width: 480px\)/);
  assert.match(css, /@media \(forced-colors: active\)/);
  // Actions use the shared Button; its transitions follow the global reduced-motion rule.
  assert.doesNotMatch(css, /\.primaryAction|\.secondaryAction|\.eyebrow/);
  assert.match(css, /\.heroActions > \* \{\s*width: 100%;/);
  // Display type uses the brand tokens, not a hard-coded family or tracking.
  assert.match(css, /font-family: var\(--font-display\)/);
  assert.doesNotMatch(css, /--font-newsreader|letter-spacing: -0\.03/);
  assert.doesNotMatch(
    css,
    /backdrop-filter|filter: blur|border-radius: 1[2-9]px|animation:|!important/,
  );
});
