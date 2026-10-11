# Tessli v1.2: progress report

Date: 2026-10-11
Scope: Stage A (cleanup) and Stage B (development) of [`plan.md`](plan.md), run by an orchestrating agent while the owner was away.
Method: one PR per step, each branched from the latest `main`. From #131 on, each PR passed an adversarial review by a fresh reviewer agent, had its findings fixed, had real check output pasted in, went green in CI and was squash-merged (#130 only added the plan under `docs/v1.2/`, which CI did not run on). Visible changes have screenshots at 1440/1024/768/390/320 on the `pr-assets` branch, which is never merged.

## Stage A: cleanup (complete)

The full report is in [`cleanup-report.md`](cleanup-report.md). Stage A merged PRs #130–#138. It covered the approved plan, the process-docs removal and governance files, the removal of proofs, auth, Boards/Saved, the media pipeline and dead code, the design-system repair, and one CI workflow.

|                | Before  | After   |
| -------------- | ------- | ------- |
| Tracked files  | 564     | 224     |
| Tracked bytes  | 13.1 MB | 1.97 MB |
| Markdown files | 158     | 20      |

The Stage A gate passed on `main` @ `9016d73`:

- CI is green and `npm run check` passes.
- All 16 remaining routes rendered at 390 and 1440 with no overflow and no console errors (32/32).
- All 9 browser tests pass.
- Nothing on the removal map is still tracked.

## Stage B: development

| Step        | PR                                                                                                                                 | One line                                                                                                                                                                                                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1a         | [#139](https://github.com/Online-Scope-Lab/tessli/pull/139)                                                                        | Froze source IDs; one `sources/<slug>.yml` per source (295); removed the hard-coded 295 and per-category counts; added `archived` status; removed the Verified/coverage machinery from public surfaces                                                                      |
| B1b         | [#140](https://github.com/Online-Scope-Lab/tessli/pull/140)                                                                        | Applied `catalogue-triage-final.csv` exactly: 125 active, 4 needs-review (fix-url rows the sandbox could not verify), 166 archived with reasons, 0 deleted. Fixed collections; added the suggest-source validation Action                                                   |
| B2          | [#141](https://github.com/Online-Scope-Lab/tessli/pull/141)                                                                        | Library foundation: item schema, `_template`, `/preview/[slug]`, Tessli/Neutral/Dark themes, root `registry.json`, `/library` pages, Playwright and axe item CI; 3 items. A GitHub-registry install of all three items into a fresh Next.js + shadcn app built successfully |
| B3a         | [#142](https://github.com/Online-Scope-Lab/tessli/pull/142)                                                                        | 39 draft rules, a generated 7.4 KB `rules/TESSLI.md` (installable as `online-scope-lab/tessli/rules`), and `/rules` and `/rules/[id]`                                                                                                                                       |
| B3b         | [#143](https://github.com/Online-Scope-Lab/tessli/pull/143)                                                                        | The remaining 9 starter items. The library now has all 12 (§6.4), all `community`                                                                                                                                                                                           |
| B3c         | [#144](https://github.com/Online-Scope-Lab/tessli/pull/144)                                                                        | MCP tools `search_items`, `get_item`, `get_rules`, `find_sources` and `get_source`; rewritten `llms.txt` and `/for-ai`; `skills/tessli/SKILL.md`                                                                                                                            |
| B3d         | [#145](https://github.com/Online-Scope-Lab/tessli/pull/145)                                                                        | Home rewritten below the kept ExploreHero; nav is Library \| Sources \| For AI; `/contribute`; `/submit` and `/suggest` redirect with 308                                                                                                                                   |
| B4          | [#146](https://github.com/Online-Scope-Lab/tessli/pull/146)                                                                        | Contribution flow audited end to end; error messages contributors can act on; fork-safe workflows; CONTRIBUTING rewritten; shadcn directory listing text (no PR opened on shadcn-ui/ui); 8 first-contributor issue drafts                                                   |
| B4 (GitHub) | issues [#147](https://github.com/Online-Scope-Lab/tessli/issues/147)–[#154](https://github.com/Online-Scope-Lab/tessli/issues/154) | 8 seeded first-contributor issues (6 labelled good first issue, 2 help wanted). Test issue [#155](https://github.com/Online-Scope-Lab/tessli/issues/155) confirmed the suggest-source Action works on GitHub, then was closed                                               |
| B5a         | [#156](https://github.com/Online-Scope-Lab/tessli/pull/156)                                                                        | Taste Bench: protocol (published before any run), 6 briefs, starter app, condition prompts, harness (recovered from `v1.1-archive`), blinded-packet tooling, 70 tests (77, plus 7 Node tests, after B5b prep)                                                               |
| B5b prep    | [#157](https://github.com/Online-Scope-Lab/tessli/pull/157)                                                                        | Operator prep for the AI-build run: a script that mirrors the shadcn base registry, plus run notes                                                                                                                                                                          |

### Notable decisions

`docs/decisions.md` lists the decisions, about 107 dated lines. The ones with the most effect:

- **Registry:** item sources live in `web/registry/items/`. A generated root `registry.json` points into them. Items import `@/registry/shadcn/ui/*`, which the shadcn CLI rewrites on install.
- **Site structure:** site pages moved into the `app/(site)` route group so `/preview` renders without site chrome. `/preview/*` alone allows same-origin framing.
- **Sources:**
  - The 11 current categories stay. The 13-category taxonomy needs a curator to place each source.
  - Migrated summaries are kept verbatim.
  - `kind` is a provisional per-category default.
  - `added_at` comes from git history; `last_checked` is null.
- **Unverified URLs:** the 4 fix-url rows are `needs-review`, not `active`, because their new URLs could not be checked from the sandbox.
- **Review status:** rules are `draft` and items are `community`. Only a maintainer can sign `reviewed`.
- **MCP:** the local server runs with `node web/mcp/server.ts`, because the `npm run` banner corrupts stdio. Hosted MCP stays off.
- **Hero:** the home hero is untouched, copy included. Library-first positioning starts in the section below it.
- **DCO:** sign-off is documented but not enforced in CI.
- **New dependencies:** each has a one-line reason.
  - `yaml` parses the source files.
  - `clsx`, `tailwind-merge` and `class-variance-authority` are shadcn's `cn` and `button`.
  - `@playwright/test` and `@axe-core/playwright` run the item CI.
- **CI hardening:** browser tests mark the old document stale before navigating, and CI waits for the Chrome DevTools endpoint before running them. This fixed two intermittent failures (PR #138).

## What is left, and why

- **Taste Bench AI builds (B5b): not run.**
  - The environment's permission policy refused to launch headless builder agents.
  - Running the builds as in-session subagents would give the builders the repository's own design guidance, which breaks the baseline condition. So nothing was run, rather than running a compromised study.
  - The protocol, harness and operator prep are ready for a human operator. No human or AI scores exist.
- **`/bench` results page:** waits for human scores, as the protocol says.
- **Revised 13-category taxonomy:** needs a curator to place each source. Issue #150 starts the Colour/Accessibility split.
- **Kit feature** (one install for a set of items): planned for v1.3.
- **Owner decision on hero copy:** library-first copy would mean editing ExploreHero, which was kept untouched as instructed.

## Needs a human

- **Confirm two decisions made on your behalf** ([`owner-actions.md`](owner-actions.md)): the source triage (125 keep, 4 fix-url, 2 merge, 164 archive, with MAYBE rows kept only at score ≥ 14) and the hero artwork's rights holder (Online Scope, assumed). Override any row or correct the line.
- **Sign off taste.** Review the 12 starter items in all three themes at five widths, and the 39 draft rules. Only a maintainer can set `status: reviewed` with `reviewed_by` and `reviewed_at`. The plan suggests a second designer you trust.
- **Taste Bench:**
  - Run the 36 AI builds by following `bench/README.md`, then recruit at least 3 independent human reviewers to score the 18 blinded pairs.
  - No scores were produced or simulated.
- **Source checks:**
  - Open the 4 `needs-review` sources (coss UI, React Aria, v0, Shopify Polaris) and set them `active` or fix them.
  - Godly: the live suggest-source check found `godly.website` now redirects to `recent.design` (issue #155). Decide keep, fix-url or archive.
  - Curator work the migration deferred: a per-source `kind` (the current value is a category default; issue #149 starts Motion/3D), `last_checked` (null for every source), and trimming `best_for`/`limitations` where a profile's list is over the cap.
- **Repository settings:**
  - Create the labels `source:suggestion`, `source:problem` and `design:needs-implementation`, then add `source:problem` to #147.
  - Decide whether to enforce DCO sign-off; if so, install the DCO GitHub App and decide how to handle unsigned commits from first-time contributors.
  - Optionally turn on "Automatically delete head branches".
- **Delete merged branches.** The automation proxy rejects ref deletion:
  - Stage A: `docs/tessli-v1.2-plan`, `docs/v1.2-governance`, `chore/remove-proofs-and-experiments`, `chore/remove-auth`, `chore/remove-boards-and-saved`, `chore/remove-media-pipeline`, `fix/design-system-foundation`, `chore/ci-consolidation`, `docs/cleanup-report`.
  - Stage B: `feat/sources-yml`, `feat/sources-triage`, `feat/library-foundation`, `feat/rules`, `feat/starter-items`, `feat/agent-interfaces`, `feat/home-nav-contribute`, `feat/open-to-contributors`, `feat/taste-bench`, `feat/bench-operator-prep`, `docs/progress-report` (this report's own branch).
  - Keep `pr-assets` (screenshots linked from PRs), `archive/v1.1` and tag `v1.1-archive`.
  - About 42 pre-v1.2 branches (`agent/*`, `codex/*`, `proof/*`, `validate/*`, older `docs/*` and `feat/*`) were left untouched; their content is in `main`'s history or `v1.1-archive`.
- **Infrastructure:**
  - Shut down the hosted Supabase project (user tables and the pilot image bucket). The repo no longer uses it.
  - Confirm the canonical domain (`tessli.vercel.app` is assumed) serves `/r/*.json` before opening the shadcn directory PR (`docs/v1.2/shadcn-directory-listing.md`).
  - Add a dedicated Code of Conduct contact address.
