# Tessli

**UI with the reasoning attached.**

Tessli is an open-source UI library that explains itself. Every component, section and page ships with working code, a live preview and its reasoning: when to use it, when not to, the rules it follows, the generic default it replaces, and its states, responsive behaviour and accessibility. People browse it, copy it and learn from it; coding agents install it with the standard shadcn CLI and read the same reasoning as structured data. Beside the library sits a curated, community-maintained directory of external design sources. Everything is contributed and reviewed on GitHub.

## Status: v1.2 in progress

Be clear about what exists today:

- **Live now:**
  - the **Library** at `/library`: three community items (an empty state, an FAQ section and a pricing section), each with a live preview in three themes (Tessli, Neutral, Dark) at three widths, its taste notes, code, and `item.json`/`item.md` for agents. None is reviewed by a maintainer yet.
  - the curated **Sources** directory (browse, source pages, collections), public Markdown/JSON for each source, and a local read-only MCP server ([`docs/tessli-native-mcp.md`](docs/tessli-native-mcp.md)).
- **Being built:** the rest of the starter set, the public rule set, MCP tools for items, and the Contribute page.
- **Not built:** accounts, a database, analytics or payments. GitHub issues and pull requests are the backend.

The plan and its phases are in [`docs/v1.2/plan.md`](docs/v1.2/plan.md).

## Quick start

You need Node.js 22 or later and npm. The app lives in `web/`.

```bash
cd web
npm ci
npm run dev
```

Open <http://localhost:3000>.

Before a pull request, run one command from `web/`:

```bash
npm run check
```

It runs the hero artwork hash check, `format:check`, `typecheck`, `lint`, `test`, `catalogue:check`, `registry:check` and `build`: everything CI runs except the shadcn registry validation and the browser and item preview tests. `npm run format` fixes formatting.

Install a library item into a project set up with [shadcn/ui](https://ui.shadcn.com) (works once the registry is on `main`):

```bash
npx shadcn@latest add online-scope-lab/tessli/pricing-tiers
```

The shadcn CLI reads the generated root [`registry.json`](registry.json). Items live in `web/registry/items/<slug>/` (the item, a demo, optional states and `notes.md` taste notes validated by [`schemas/library-item.schema.json`](schemas/library-item.schema.json)); `npm run registry:build` regenerates `registry.json`, `web/public/r/*.json` and `web/data/library.json`, and `npm run registry:check` verifies them. `npm run test:items` (after a build) renders every item in every state and theme at five widths with Playwright and axe-core.

Each source is one file, `sources/<slug>.yml`. The catalogue is generated deterministically from those files (plus the curated order, media and collections in `lib_data/`) into `web/data/`; `npm run catalogue:generate` rebuilds it and `npm run catalogue:check` verifies it. Normal build and test make no network calls.

## Contributing

Suggest a source, submit a design, report a problem or send a fix. See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the paths, local setup, the item checklist, DCO sign-off and the AI-assistance disclosure. Coding agents also read [`AGENTS.md`](AGENTS.md). Everyone follows the [Code of Conduct](CODE_OF_CONDUCT.md).

## Licence

Code and taste notes are released under the [MIT licence](LICENSE). The Tessli name, wordmark and hero artwork are **not** covered by it; see [`TRADEMARKS.md`](TRADEMARKS.md).

## More

- [`design.md`](design.md): the visual system (type, colour, grain, spacing, motion).
- [`docs/README.md`](docs/README.md): index of the remaining docs.
- [`docs/decisions.md`](docs/decisions.md): dated decisions.
- [`docs/v1.2/plan.md`](docs/v1.2/plan.md): the product and build plan.

Earlier planning, slice evidence, proofs and experiments are preserved at the `v1.1-archive` tag.
