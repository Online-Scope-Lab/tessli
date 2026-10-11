# Tessli MCP

The Tessli MCP server is a local, read-only stdio process. It answers questions about the library, the rules and the source directory from the same committed JSON the website renders (`web/data/library.json`, `web/data/rules.json`, `web/data/catalogue.json`). It is the only supported MCP transport (plan §6.6).

It makes no network request, reads no credentials or project files, and writes nothing.

## Requirements

- Node.js 22.18 or later (the server is TypeScript run by Node's built-in type stripping, which is on by default from 22.18);
- a local checkout of `Online-Scope-Lab/tessli`;
- locked dependencies installed under `web/` (`cd web && npm ci`).

## Run

```bash
cd web
npm run mcp     # runs: node mcp/server.ts
```

The server waits for an MCP client on standard input and writes protocol messages to standard output. Operational messages go to standard error only.

## Client configuration

Point the client at the server file with an absolute path:

```json
{
  "mcpServers": {
    "tessli": {
      "command": "node",
      "args": ["/absolute/path/to/tessli/web/mcp/server.ts"]
    }
  }
}
```

Don't configure `npm run mcp` as the client command: `npm run` prints its `> tessli-web@… mcp` banner to standard output, which corrupts the protocol stream. Some clients use a top-level `servers` key or need `"type": "stdio"`; keep the same command and path.

## Tools

Exactly five tools, all annotated read-only, non-destructive, idempotent and closed-world. Names and descriptions live in `web/lib/mcp-tool-catalogue.ts`; the logic in `web/lib/mcp-native-tools.ts`. Inputs are validated with zod; unknown slugs and ids return a clear error that names the tool to use instead.

### `search_items(brief, limit?)`

Ranks library items for a brief and returns compact summaries: `slug`, `title`, `kind`, `category`, `summary`, `status`, `rules` (ids), `install` and `matched` (which term matched which field). `limit` is 1–12, default 5.

Ranking is deterministic keyword matching, with no embeddings and no network. The brief is lower-cased and split into words; stop words go, and a trailing plural `s` is dropped. Each term counts once, in the heaviest field where a word starts with it: title and slug 10, category 8, kind 6, summary 5, use-when 4, the common default and failures 3, why-it-is-better and applied rule titles 2, prose and states 1. Items scoring under a third of the best score are dropped, and ties sort by slug. When nothing matches, the result says so and lists the categories in use.

### `get_item(slug)`

Returns the same document as `/library/<slug>/item.json` (contract `tessli.public-library-item.v1`): the code file, the full notes (`meta.tessli` in `registry.json`), the applied rules with their statements, the explanation, the shadcn install command and the preview path. A code file longer than 40,000 characters is cut and points to `item.json`; no item is that long today.

### `get_rules(topic?)`

- No topic: the compact index (`rules/TESSLI.md`), its path and the rules install command.
- Rule ids in the topic (`H-01 ST-03`, any case): exactly those rules, with unknown ids listed separately.
- Anything else: rules ranked by the same keyword matching over title, category, statement, check, the default the rule guards against, and why it matters.

Each rule comes back with `id`, `category`, `title`, `statement`, `check`, `status`, `path` and the slugs of the items that apply it. At most 12 rules per call.

### `find_sources(task, surface?, framework?, needs?, exclusions?)`

The website's task retrieval (`web/lib/task-retrieval.ts`), unchanged: non-archived sources only, at most eight, in a deterministic order, each with recorded fit reasons, caveats, access routes and up to two alternatives.

### `get_source(slug)`

Returns the same document as `/resources/<slug>/profile.json` (contract `tessli.public-source.v3`), by slug or stable ID. An archived source still resolves, with `status: archived`, its reason and its replacement, and no access route.

## Hosted MCP stays off

`web/app/api/mcp/route.ts` wraps the same server for Streamable HTTP, but it answers 404 unless `TESSLI_REMOTE_MCP_ENABLED=true`, and it stays off in v1.2. Before it can be turned on (plan §6.6):

- the preflight in `web/lib/mcp-http.ts` rejects requests without an `Origin` header, which is what CLI agents send;
- its rate limit is per instance, in memory;
- authentication is undecided.

## Boundaries

- No HTTP listener in the stdio server, no environment credential, no network request, no write tool.
- No arbitrary path or URL input; no project source or user file is read.
- Every list is capped: 12 items, 12 rules, 8 sources, 2 alternatives.
- Source profiles are curator guidance recorded in the repository, not live checks of a provider. Use them to choose where to look, not as permission to copy a provider's layouts, copy, assets or restricted code.
- Tessli does not claim that using the server or the library improves AI-generated UI; that waits for the published evaluation (plan §9).

Tool calls are not logged or kept by Tessli. The MCP client may have its own logging.

## Development checks

```bash
cd web
node --test tests/mcp-native-tools.test.mjs tests/mcp-stdio.test.mjs tests/mcp-http-preflight.test.mjs
npm run check
```

`tests/mcp-stdio.test.mjs` starts the server over stdio and calls every tool.
