import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { TESSLI_MCP_TOOL_NAMES } from "../mcp/server.ts";

const webRoot = fileURLToPath(new URL("../", import.meta.url));
const serverPath = fileURLToPath(new URL("../mcp/server.ts", import.meta.url));

test("stdio MCP exposes exactly the five read-only tools and answers each", async () => {
  const client = new Client(
    { name: "tessli-mcp-test-client", version: "1.0.0" },
    { capabilities: {} },
  );
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverPath],
    cwd: webRoot,
    stderr: "pipe",
  });

  try {
    await client.connect(transport);
    assert.equal(client.getServerVersion()?.name, "tessli");
    const listed = await client.listTools();

    assert.deepEqual(TESSLI_MCP_TOOL_NAMES, [
      "search_items",
      "get_item",
      "get_rules",
      "find_sources",
      "get_source",
    ]);
    assert.deepEqual(
      listed.tools.map((tool) => tool.name),
      [...TESSLI_MCP_TOOL_NAMES],
    );
    assert.ok(
      listed.tools.every(
        (tool) =>
          tool.annotations?.readOnlyHint === true &&
          tool.annotations?.destructiveHint === false &&
          tool.annotations?.openWorldHint === false,
      ),
    );

    const call = async (name, args) => {
      const result = await client.callTool({ name, arguments: args });
      assert.notEqual(result.isError, true, `${name} succeeded`);
      assert.ok(result.structuredContent, `${name} has structured content`);
      assert.deepEqual(
        JSON.parse(result.content[0].text),
        result.structuredContent.result,
        `${name} text and structured content agree`,
      );
      return result.structuredContent.result;
    };

    const search = await call("search_items", {
      brief: "pricing section for two plans",
    });
    assert.equal(search.items[0].slug, "pricing-tiers");
    assert.ok(search.items.length <= 5);
    const limited = await call("search_items", { brief: "section", limit: 2 });
    assert.equal(limited.items.length, 2);

    const item = await call("get_item", { slug: "pricing-tiers" });
    assert.equal(item.contract, "tessli.public-library-item.v1");
    assert.equal(
      item.item.install,
      "npx shadcn@latest add online-scope-lab/tessli/pricing-tiers",
    );
    assert.match(item.item.source.code, /export function/);
    assert.ok(item.item.notes.use_when.length > 0);
    assert.ok(item.item.notes.ai_default.length > 0);

    const index = await call("get_rules", {});
    assert.equal(index.mode, "index");
    assert.match(index.index, /^# Tessli UI rules/);
    const rules = await call("get_rules", { topic: "H-01 ST-03" });
    assert.deepEqual(
      rules.rules.map((rule) => [rule.id, Boolean(rule.check)]),
      [
        ["H-01", true],
        ["ST-03", true],
      ],
    );

    const sources = await call("find_sources", {
      task: "Build a React animation",
      surface: "page transitions",
      framework: "react",
      needs: ["page transitions"],
    });
    assert.ok(sources.sources.length <= 8);
    assert.ok(sources.sources.some((source) => source.slug === "motion"));

    const source = await call("get_source", { slug: "screenlane" });
    assert.equal(source.source.status, "archived");
    assert.equal(source.source.replacedBy.slug, "page-flows");

    for (const [name, args, message] of [
      [
        "get_item",
        { slug: "not-a-tessli-item" },
        /Unknown Tessli library item/,
      ],
      [
        "get_source",
        { slug: "not-a-tessli-resource" },
        /Unknown Tessli source/,
      ],
      ["get_rules", { topic: "Z-99" }, /Unknown Tessli rule id/],
      ["get_item", { slug: "../etc/passwd" }, /slug/i],
      ["search_items", { brief: "x".repeat(401) }, /brief|400/i],
      ["search_items", { brief: "faq", limit: 13 }, /limit|12/i],
    ]) {
      const result = await client.callTool({ name, arguments: args });
      assert.equal(result.isError, true, `${name} ${JSON.stringify(args)}`);
      assert.match(result.content[0].text, message);
    }
  } finally {
    await client.close();
  }
});

test("MCP source preserves the local read-only security boundary", async () => {
  const [serverSource, toolSource] = await Promise.all([
    readFile(serverPath, "utf8"),
    readFile(new URL("../lib/mcp-native-tools.ts", import.meta.url), "utf8"),
  ]);
  const combined = `${serverSource}\n${toolSource}`;

  assert.match(serverSource, /StdioServerTransport/);
  assert.doesNotMatch(combined, /\bfetch\s*\(/);
  assert.doesNotMatch(combined, /from\s+["']node:https?["']/);
  assert.doesNotMatch(combined, /\.listen\s*\(/);
  assert.doesNotMatch(combined, /process\.env/);
  assert.doesNotMatch(combined, /console\.log/);
  assert.doesNotMatch(combined, /\bwriteFile\b/);
  assert.doesNotMatch(combined, /\breadFile\b/);
  assert.doesNotMatch(combined, /localStorage|sessionStorage|indexedDB/i);
  assert.doesNotMatch(combined, /provider token|service[- ]role/i);
  assert.doesNotMatch(
    combined,
    /verify_resource|search_resources|compare_resources|find_alternatives|get_collection|create_research_brief/,
  );
});
