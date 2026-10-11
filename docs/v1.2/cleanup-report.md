# Tessli v1.2: cleanup report (Stage A)

Date: 2026-10-11
Plan: [`repo-cleanup.md`](repo-cleanup.md) · Archive: tag `v1.1-archive` and branch `archive/v1.1` at `9214e06` (C0, done before this stage)

Stage A is complete. Every step merged with green CI, and the Stage A gate passed on `main` @ `9016d73`.

## PRs merged

Each step was one PR, squash-merged, in order, after an adversarial review by a fresh reviewer agent and green CI.

| Step | PR | What it did |
|---|---|---|
| A0 | [#130](https://github.com/Online-Scope-Lab/tessli/pull/130) | Landed the approved v1.2 plan in `docs/v1.2/` |
| A1 / C1 | [#131](https://github.com/Online-Scope-Lab/tessli/pull/131) | Removed the process docs; added LICENSE (MIT), TRADEMARKS, CONTRIBUTING, CODE_OF_CONDUCT, issue forms, PR template, CODEOWNERS, one-page AGENTS.md, new README, `docs/decisions.md` |
| A2 / C2 | [#132](https://github.com/Online-Scope-Lab/tessli/pull/132) | Removed the OSS proof, lab fixtures, `evaluation/`, `.agents/`, `brand-preview/`, root favicon |
| A3 / C3 | [#133](https://github.com/Online-Scope-Lab/tessli/pull/133) | Removed auth and Supabase (routes, clients, proxy, migrations, two dependencies) |
| A4 / C4 | [#134](https://github.com/Online-Scope-Lab/tessli/pull/134) | Removed Boards and Saved, with their Save controls, toast and navigation entries |
| A5 / C5 | [#135](https://github.com/Online-Scope-Lab/tessli/pull/135) | Removed the media pipeline, verification machinery, live-preview pilot and profile generator |
| A6 / C6 | [#136](https://github.com/Online-Scope-Lab/tessli/pull/136) | Removed dead code; fixed undefined and duplicated tokens; exposed the Tailwind `@theme`; added `web/components/ui` primitives; removed the AI tells; added `app/icon.svg` |
| A7 / C7 | [#137](https://github.com/Online-Scope-Lab/tessli/pull/137) | One `ci.yml` with a browser smoke test, weekly `links.yml`, `npm run check` |

Screenshots for the visible steps (C4, C5, and before/after for C6) are on the `pr-assets` branch, which is never merged into `main`.

## Before and after

Before is `main` @ `497f392` (the v1.2 plan just landed). After is `main` @ `9016d73`.

| | Before | After |
|---|---|---|
| Tracked files | 564 | 224 |
| Tracked bytes | 13.1 MB | 1.97 MB |
| Markdown files | 158 | 20 (13 outside `docs/v1.2/`) |
| Markdown lines | 20,266 | 2,675 |
| Unit test files (`*.test.mjs`) | 61 | 37 |
| Unit test cases | 268 | 160 |
| Browser test scripts | 13 | 9 |
| Scripts in `web/scripts` | 24 | 7 |
| npm scripts | 25 | 15 |
| CI workflows | 2 overlapping, path-filtered | `ci.yml` (every PR and push to `main`) + `links.yml` (weekly) |
| Runtime + dev dependencies | 7 + 10 | 5 + 10 |
| Community files | none | LICENSE, TRADEMARKS, CONTRIBUTING, CODE_OF_CONDUCT, 4 issue forms + config, PR template, CODEOWNERS |

The test-case count fell with the removed features. No test was skipped or disabled. Tests that also covered kept behaviour were edited rather than deleted, and several now assert that removed routes and controls stay gone.

## Stage A gate

| Gate | Result |
|---|---|
| `main` green on every check | CI run [38108585272](https://github.com/Online-Scope-Lab/tessli/actions/runs/38108585272) on `9016d73`: success. Local `npm run check` passed (hero hash, format, typecheck, lint, 160/160 tests, catalogue, build) |
| Remaining routes render at 390 and 1440 with no console errors and no overflow | 16 routes × 2 widths = 32/32 clean: `/`, `/resources`, two source pages, `/collections`, two collections, `/for-ai`, `/about`, `/privacy`, `/terms`, `/content-policy`, `/curation`, `/submit`, `/suggest` and `/lab`. Every page also had exactly one `h1` and a `main`. Third-party preview images blocked by the sandbox egress proxy were excluded; they are not first-party errors |
| Browser tests | 9/9 pass, including the new smoke test (13 pages × 7 widths, plus HTTP contracts) |
| Nothing on the removal map remains | 61 paths and 7 globs from the removal map: none tracked. No `@supabase/*` dependency, no `media:*`, `verification:*` or `profiles:generate` scripts |

## Kept on purpose

| Kept | Why |
|---|---|
| `web/components/explore-hero/` and `web/public/brand/tessli-hero-geometry.webp` | Plan §4: the hero and its artwork stay. The hash check now runs in `npm run check` and CI |
| `docs/ref-img/`, `docs/asset-manifest.md` | Approved brand references and their provenance |
| `docs/quality-gates.md`, `docs/component-contracts.md`, `docs/data-and-media-contract.md`, `docs/tessli-native-mcp.md` | Kept in shortened form, as the cleanup plan says |
| `lib_data/resource-media.json` and its schema | Frozen approved previews (plan §7.4); the cards still use them. No new media pipeline |
| `web/data/intelligence-profiles/` and the two profile checks | The 40 profiles supply best-for and limitations text (plan §7.3). Only the generator was removed |
| `lib_data/design-resource-library-295.{csv,md}` | The current catalogue source. B1 migrates it to `sources/<slug>.yml` |
| `web/app/lab/page.tsx` | Becomes the internal design-system specimen. It now shows the new primitives |
| `/curation`, `/submit`, `/suggest` | Working pages. `/contribute` replaces `/submit` and `/suggest` in Stage B |
| `web/mcp/`, `web/lib/mcp-*`, `public-representations.*`, `task-retrieval.ts` | Reused for the B3 MCP tools (plan §6.6). Hosted remote MCP stays off |
| Coverage fields in the machine representations and MCP output | They claim nothing (0 Verified). Their removal belongs to B1's data-model change |

## Branches and PRs from earlier attempts

- **Open PRs before Stage A:** only [#99](https://github.com/Online-Scope-Lab/tessli/pull/99), a draft from 2026-08-05 called "begin first evidence-backed Verified batch". It is closed as superseded, with a comment, because v1.2 removes the Verified machinery. No other Codex v1.2 PRs or branches existed.
- **Old branches** (about 40 `agent/*`, `codex/*`, `docs/*`, `feat/*`, `proof/*` and `validate/*` from v1–v3): left untouched. Their content is in `main`'s history or in `v1.1-archive`.
- **Merged Stage A branches can't be deleted from the automation environment**, because the egress proxy rejects ref deletions (HTTP 403), as it does tag pushes. A maintainer can delete them, or turn on "Automatically delete head branches":
  `docs/tessli-v1.2-plan`, `docs/v1.2-governance`, `chore/remove-proofs-and-experiments`, `chore/remove-auth`, `chore/remove-boards-and-saved`, `chore/remove-media-pipeline`, `fix/design-system-foundation`, `chore/ci-consolidation`.

## Follow-ups for a human

- Create the issue labels the forms use: `source:suggestion`, `source:problem`, `design:needs-implementation` and `bug`. GitHub does not create labels from issue forms.
- Add a dedicated Code of Conduct contact address. For now, reports go through the maintainers' GitHub profiles.
- Shut down the hosted Supabase project, which holds the user tables and the pilot image bucket. The repo no longer uses it.
- Delete the merged branches listed above.
