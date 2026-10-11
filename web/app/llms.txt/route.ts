import { getPublishedCollections } from "@/lib/collections";
import {
  getLibraryItems,
  installCommand,
  type LibraryItem,
} from "@/lib/library";
import { TESSLI_MCP_TOOL_NAMES } from "@/lib/mcp-tool-catalogue";
import { repositoryUrl } from "@/lib/repository";
import {
  getRules,
  getRulesByCategory,
  RULES_INDEX_PATH,
  rulesInstallCommand,
} from "@/lib/rules";
import { getBrowsableSourceCounts } from "@/lib/source-profiles";

export const dynamic = "force-static";
export const revalidate = false;

const CACHE_CONTROL =
  "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800";

function itemLine(item: LibraryItem) {
  const status =
    item.notes.status === "reviewed" ? "reviewed" : "community, not reviewed";
  return `- [${item.notes.title}](/library/${item.slug}): ${item.notes.summary} (${item.notes.kind}; ${status})`;
}

/**
 * The llms.txt document. Every count and list is derived from the committed
 * data the site renders, so it never drifts from /library, /rules or
 * /resources.
 */
function llmsDocument() {
  const items = getLibraryItems();
  const reviewedItems = items.filter(
    (item) => item.notes.status === "reviewed",
  ).length;
  const rules = getRules();
  const reviewedRules = rules.filter(
    (rule) => rule.status === "reviewed",
  ).length;
  const ruleAreas = getRulesByCategory().length;
  const sources = getBrowsableSourceCounts();
  const collections = getPublishedCollections().length;
  const tools = TESSLI_MCP_TOOL_NAMES.join(", ");

  return `# Tessli

> UI with the reasoning attached. Tessli is an open-source UI library that explains itself, with a curated directory of external design sources beside it.

Each library item is working code (React, Tailwind CSS and shadcn/ui primitives, semantic theme tokens only) plus its reasoning: when to use it, when not to, the rules it follows, the common AI default it replaces, its states, responsive behaviour and accessibility. Items install with the standard shadcn CLI and take on the installing project's theme.

Today: ${items.length} library items (${reviewedItems} reviewed by a maintainer), ${rules.length} rules in ${ruleAreas} areas (${reviewedRules} reviewed; the rest are drafts), ${sources.sources} active sources in ${sources.categories} categories, and ${collections} collections.

## Install

In a project set up with shadcn/ui:

- One item: \`${installCommand("<slug>")}\`
- The rules index, as TESSLI.md at the project root: \`${rulesInstallCommand()}\`

Items use semantic tokens (--background, --foreground, --primary, --muted, --border, --radius), so they follow the project's theme instead of Tessli's.

## Library

- /library: every item, filterable by kind and category.
- /library/<slug>: live preview in three themes and three widths, code, notes and review status.
- /library/<slug>/item.json and /library/<slug>/item.md: the item's code, full notes, applied rules with their statements, and install command.
- /preview/<slug>: a bare render of one item, for screenshots and checks.

Items:

${items.map(itemLine).join("\n")}

## Rules

- ${RULES_INDEX_PATH}: the compact index, one line per rule with how to check it, small enough to keep in context.
- /rules and /rules/<ID>: each rule with why it matters, how to check it, the default it guards against, and the items that apply it.

## Sources

- /resources: the curated directory of external design sources.
- /resources/<slug>/profile.json and /resources/<slug>/profile.md: a compact profile with purpose, what to explore, access routes, limitations and alternatives. An archived source says so and names its replacement.
- /collections and /collections/<slug>/collection.json or collection.md: guided research paths through the sources.

Examples:

- /resources/landingfolio/profile.json
- /resources/landingfolio/profile.md
- /collections/saas-landing-pages/collection.json
- /collections/saas-landing-pages/collection.md

## Local MCP

Tessli's MCP server is a local, read-only stdio process that an MCP client starts from a checkout of the repository (\`npm run mcp\` in web/). Its tools are ${tools}. It reads the same committed data as this site. There is no hosted or remote MCP endpoint. Setup: /for-ai#local-mcp.

## Agent Skill

skills/tessli/SKILL.md in the repository (${repositoryUrl}) tells an agent how to use Tessli: read the rules, search the items, install one, adapt it to the project's tokens, then check it against the rules at 1440, 768 and 390 px.

## What Tessli does not claim

- Tessli does not claim that its items or rules improve AI output or give AI taste. That claim waits for a published, blinded evaluation scored by people.
- Community items are not reviewed by a maintainer, and every rule is a draft until a maintainer signs it.
- Source profiles are curator guidance recorded in the repository, not live checks of a provider and not universal rankings. Recheck access, pricing, licensing and terms with the provider.

## Boundaries

- No accounts: Tessli has no sign-in and keeps no user workspace.
- Tessli has no bulk catalogue API or bulk public-data endpoint.
- No provider crawl, proxy or credential handling: Tessli does not bypass provider access controls.
`;
}

function discoveryHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": CACHE_CONTROL,
    "Content-Type": "text/plain; charset=utf-8",
    "Cross-Origin-Resource-Policy": "cross-origin",
    Link: `</llms.txt>; rel="canonical"; type="text/plain"`,
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "index, follow",
  };
}

function optionsHeaders() {
  return {
    Allow: "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Max-Age": "86400",
    "Cross-Origin-Resource-Policy": "cross-origin",
    "X-Content-Type-Options": "nosniff",
  };
}

function response(head = false) {
  return new Response(head ? null : llmsDocument(), {
    status: 200,
    headers: discoveryHeaders(),
  });
}

export function GET() {
  return response();
}

export function HEAD() {
  return response(true);
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: optionsHeaders(),
  });
}
