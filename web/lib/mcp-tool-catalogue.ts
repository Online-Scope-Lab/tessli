export const TESSLI_MCP_SERVER_NAME = "tessli" as const;
export const TESSLI_MCP_SERVER_VERSION = "0.3.0" as const;
export const TESSLI_MCP_NODE_REQUIREMENT = "Node.js 22 or newer" as const;

/**
 * The five read-only tools of the local Tessli MCP server (plan §6.6). The
 * server registers exactly these, in this order; the For AI page lists them
 * from here.
 */
export const TESSLI_MCP_TOOL_CATALOGUE = [
  {
    name: "search_items",
    title: "Search Tessli library items",
    description:
      "Rank Tessli library items (components, sections and pages) for a brief by deterministic keyword matching over each item's notes. Returns compact summaries: slug, title, kind, category, summary, review status, applied rule ids and the install command.",
    inputs: "A brief, such as “pricing section for two plans”.",
    returns:
      "Matching items, best first, each with its rule ids and install command.",
    limit: "Up to 12 items (5 by default)",
  },
  {
    name: "get_item",
    title: "Get a Tessli library item",
    description:
      "Return one library item by slug: its code file, its full notes (use when, avoid when, rules, the common default it replaces, failures, states, responsive behaviour, accessibility, credits and review status) and its shadcn install command. Same document as /library/<slug>/item.json.",
    inputs: "One item slug, such as pricing-tiers.",
    returns: "The item's code, notes, rule statements and install command.",
    limit: "1 item",
  },
  {
    name: "get_rules",
    title: "Get Tessli UI rules",
    description:
      "Return Tessli's UI rules. With no topic: the compact index (rules/TESSLI.md). With rule ids (H-01 ST-03): those rules. With a topic or brief: matching rules. Each rule has its id, statement and how to check it.",
    inputs: "Optional: rule ids, a category (states) or a brief.",
    returns: "The full index, or rules with id, statement and check.",
    limit: "Index, or up to 12 rules",
  },
  {
    name: "find_sources",
    title: "Find external design sources",
    description:
      "Rank non-archived sources from Tessli's curated directory for a design or frontend task, using the website's task retrieval. Each result has recorded fit reasons, caveats, access routes and alternatives; no provider is contacted.",
    inputs: "A task, with optional surface, framework, needs and exclusions.",
    returns: "Up to eight sources with the reasons each one fits.",
    limit: "Up to 8 sources",
  },
  {
    name: "get_source",
    title: "Get a source profile",
    description:
      "Return one source's public profile by slug or stable ID: what it is for, what to explore, access routes, limitations and alternatives. Archived sources resolve with their reason and replacement. Same document as /resources/<slug>/profile.json.",
    inputs: "One source slug or stable ID, such as land-book.",
    returns: "The public source profile, status included.",
    limit: "1 source; up to 2 alternatives",
  },
] as const;

export type TessliMcpToolMetadata = (typeof TESSLI_MCP_TOOL_CATALOGUE)[number];
export type TessliMcpToolName = TessliMcpToolMetadata["name"];

export const TESSLI_MCP_TOOL_NAMES = Object.freeze(
  TESSLI_MCP_TOOL_CATALOGUE.map((tool) => tool.name),
) as readonly TessliMcpToolName[];

export function getTessliMcpToolMetadata(
  name: TessliMcpToolName,
): TessliMcpToolMetadata {
  const metadata = TESSLI_MCP_TOOL_CATALOGUE.find(
    (candidate) => candidate.name === name,
  );

  if (!metadata) {
    throw new Error(`Missing Tessli MCP tool metadata for ${name}.`);
  }

  return metadata;
}
