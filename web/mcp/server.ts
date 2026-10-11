import { pathToFileURL } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod/v4";
import {
  TESSLI_MCP_SERVER_NAME,
  TESSLI_MCP_SERVER_VERSION,
  TESSLI_MCP_TOOL_NAMES,
  getTessliMcpToolMetadata,
} from "../lib/mcp-tool-catalogue.ts";
import {
  NATIVE_MCP_LIMITS,
  NativeMcpInputError,
  findNativeSources,
  getNativeItem,
  getNativeRules,
  getNativeSource,
  searchNativeItems,
} from "../lib/mcp-native-tools.ts";

export { TESSLI_MCP_TOOL_NAMES };

const searchItemsTool = getTessliMcpToolMetadata("search_items");
const itemTool = getTessliMcpToolMetadata("get_item");
const rulesTool = getTessliMcpToolMetadata("get_rules");
const findSourcesTool = getTessliMcpToolMetadata("find_sources");
const sourceTool = getTessliMcpToolMetadata("get_source");

const readOnlyAnnotations = Object.freeze({
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
});

const briefSchema = z
  .string()
  .trim()
  .min(1)
  .max(400)
  .describe(
    "What you are building, in a few words: the screen, section or component and its job.",
  );

const itemSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9][a-z0-9-]*$/u, "Use a lower-case item slug, such as faq.")
  .describe("Exact Tessli library item slug, such as pricing-tiers.");

const sourceIdentifierSchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .describe("Exact Tessli source slug or stable ID, such as land-book.");

const optionalTaskTextSchema = z.string().trim().min(1).max(160).optional();

const taskInputSchema = {
  task: z
    .string()
    .trim()
    .min(1)
    .max(240)
    .describe("The design or frontend task to research."),
  surface: optionalTaskTextSchema.describe(
    "Optional target surface, such as a landing page or settings form.",
  ),
  framework: optionalTaskTextSchema.describe(
    "Optional framework or platform constraint.",
  ),
  needs: z
    .array(z.string().trim().min(1).max(120))
    .max(8)
    .optional()
    .describe("Optional recorded capabilities or materials the task needs."),
  exclusions: z
    .array(z.string().trim().min(1).max(120))
    .max(8)
    .optional()
    .describe("Optional recorded metadata to exclude from the shortlist."),
};

const structuredOutputSchema = {
  result: z.record(z.string(), z.unknown()),
};

function toSuccessResult(result: object) {
  const structuredResult = { ...result };
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(structuredResult, null, 2),
      },
    ],
    structuredContent: { result: structuredResult },
  };
}

function toErrorResult(error: unknown) {
  const isInputError = error instanceof NativeMcpInputError;
  const message = isInputError
    ? error.message
    : "The Tessli tool failed safely.";

  if (!isInputError) {
    console.error(
      "[tessli-mcp] Native tool failure:",
      error instanceof Error ? error.message : "unknown error",
    );
  }

  const structuredResult = {
    error: message,
    retryable: false,
  };

  return {
    isError: true,
    content: [{ type: "text" as const, text: message }],
    structuredContent: { result: structuredResult },
  };
}

function respond(run: () => object) {
  try {
    return toSuccessResult(run());
  } catch (error) {
    return toErrorResult(error);
  }
}

export function createTessliMcpServer(): McpServer {
  const server = new McpServer(
    {
      name: TESSLI_MCP_SERVER_NAME,
      version: TESSLI_MCP_SERVER_VERSION,
    },
    {
      instructions:
        "Tessli is an open-source UI library that explains itself, plus a curated directory of external design sources. Before building UI, call get_rules for the compact rule index; use search_items and get_item to find and read an item (code, notes, install command); use find_sources and get_source for external references. Install items with the shadcn CLI, adapt them to the project's semantic tokens, and check the result against the rules at 1440, 768 and 390 px. This server is local, read-only and repository-backed: no network, no credentials, no writes.",
    },
  );

  server.registerTool(
    searchItemsTool.name,
    {
      title: searchItemsTool.title,
      description: searchItemsTool.description,
      inputSchema: {
        brief: briefSchema,
        limit: z
          .number()
          .int()
          .min(1)
          .max(NATIVE_MCP_LIMITS.maxItems)
          .default(NATIVE_MCP_LIMITS.items)
          .describe("How many items to return."),
      },
      outputSchema: structuredOutputSchema,
      annotations: readOnlyAnnotations,
    },
    async ({ brief, limit }) => respond(() => searchNativeItems(brief, limit)),
  );

  server.registerTool(
    itemTool.name,
    {
      title: itemTool.title,
      description: itemTool.description,
      inputSchema: { slug: itemSlugSchema },
      outputSchema: structuredOutputSchema,
      annotations: readOnlyAnnotations,
    },
    async ({ slug }) => respond(() => getNativeItem(slug)),
  );

  server.registerTool(
    rulesTool.name,
    {
      title: rulesTool.title,
      description: rulesTool.description,
      inputSchema: {
        topic: z
          .string()
          .trim()
          .max(400)
          .optional()
          .describe(
            "Optional: rule ids (H-01 ST-03), a category (states, accessibility) or a brief. Leave empty for the full index.",
          ),
      },
      outputSchema: structuredOutputSchema,
      annotations: readOnlyAnnotations,
    },
    async ({ topic }) => respond(() => getNativeRules(topic)),
  );

  server.registerTool(
    findSourcesTool.name,
    {
      title: findSourcesTool.title,
      description: findSourcesTool.description,
      inputSchema: taskInputSchema,
      outputSchema: structuredOutputSchema,
      annotations: readOnlyAnnotations,
    },
    async (input) => respond(() => findNativeSources(input)),
  );

  server.registerTool(
    sourceTool.name,
    {
      title: sourceTool.title,
      description: sourceTool.description,
      inputSchema: { slug: sourceIdentifierSchema },
      outputSchema: structuredOutputSchema,
      annotations: readOnlyAnnotations,
    },
    async ({ slug }) => respond(() => getNativeSource(slug)),
  );

  return server;
}

export async function runTessliMcpServer(): Promise<void> {
  const server = createTessliMcpServer();
  const transport = new StdioServerTransport();

  const shutdown = async () => {
    await server.close();
    process.exit(0);
  };

  process.once("SIGINT", () => {
    void shutdown();
  });
  process.once("SIGTERM", () => {
    void shutdown();
  });

  await server.connect(transport);
  console.error("Tessli MCP running on stdio.");
}

const isDirectExecution =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  void runTessliMcpServer().catch((error: unknown) => {
    console.error(
      "Tessli MCP failed to start:",
      error instanceof Error ? error.message : "unknown error",
    );
    process.exit(1);
  });
}
