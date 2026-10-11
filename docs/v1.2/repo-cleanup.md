# Tessli v1.2: repo cleanup plan

Status: **Approved by the owner, 2026-10-11.** C0 is done: tag `v1.1-archive`, release "v1.1 archive" and branch `archive/v1.1` at `9214e06`.
Baseline: `main` @ `9214e06`, 2026-10-10

## Goal

Strip the repo down to what v1.2 needs, so a new contributor can understand it in 15 minutes. Remove nothing that can't be recovered from the archive tag. Keep `main` green after every step.

## Where it starts

| | Now |
|---|---|
| Tracked files | 555 |
| Tracked bytes | 12.9 MB |
| Markdown | 153 files, 19,271 lines |
| Slice-evidence docs | 70 |
| Root rulebook | `AGENTS.md`, 24 sections, 504 lines |
| Tests | 61 `*.test.mjs` + 13 browser scripts |
| Scripts | 24 in `web/scripts` (4,145 lines are the media/screenshot pipeline) |
| CI | 2 overlapping workflows |
| Community files | **none**: no LICENSE, CONTRIBUTING, Code of Conduct, issue or PR templates |

Weight: five ChatGPT reference PNGs in `docs/archive/ref-images/` make up 7.95 MB, which is 62% of all tracked bytes.

No secrets were found. The only `.env` file is `web/.env.example`, with empty placeholders. A public Supabase project ref appears in `docs/reports/*` and one slice doc; it isn't a secret, and it leaves the tree with those files.

## Where it should end (approximate)

| | After |
|---|---|
| Markdown | ~15 files |
| Tracked bytes | ~2.5 MB |
| Tests | ~38 |
| Scripts | ~6 |
| CI | `ci.yml` + `links.yml` |
| Community files | LICENSE, TRADEMARKS, CONTRIBUTING, CODE_OF_CONDUCT, issue forms, PR template, CODEOWNERS |

## Rules for the cleanup

- **Archive first.** Nothing is deleted before the archive tag (C0) is pushed.
- **One PR per step**, in this order. Each one ends with `format:check`, `typecheck`, `lint`, `test`, `catalogue:check` and `build` all green.
- **Pages that stay keep their behaviour.** The exceptions: C4 removes Save and Board controls, and C6 changes visuals, so it needs before/after screenshots at 1440, 1024, 768, 390 and 320.
- **No history rewriting.** The repo is public and may have forks. Removing files from the tree doesn't shrink clone size, and that's acceptable. Only consider `git filter-repo` later, with an explicit decision.
- **A test that only checks a removed feature is deleted with that feature. A test that also checks something kept is edited, not deleted.**

---

## C0: Archive tag (no PR)

- Tag `v1.1-archive` on `9214e06` and push the tag.
- Create a GitHub release, "v1.1 archive", that says: "Complete V1–V3 history: slices, proofs, evaluation, media pipeline, auth and Boards. Superseded by v1.2."
- Every later step links to this tag as the place to recover removed work.

## C1: Process docs out, governance in (`docs/v1.2-governance`)

**Remove:**
- **Root files:** `ANTIGRAVITY-HANDOFF.md`, `CODEX-SUPABASE-HANDOFF.md`, `PRD.md`, `build-slices.md`, `UI-INTELLIGENCE-ROADMAP.md`.
- **Doc folders:** `docs/slices/` (70 files), `docs/archive/` (7.7 MB), `docs/library-v1/`, `docs/plans/`, `docs/contracts/`.
- **`docs/research/`:** first move the font-choice notes into `design.md`, then remove the folder.
- **Individual docs:**
  - `docs/product-direction.md`, `product-plan-v2.md`, `product-realignment-v3.md`, `product-scope.md`, `remaining-phase-plan.md`
  - `docs/architecture-and-auth.md`, `brand-lock-checklist.md`, `domain-model.md`, `local-development-log.md`, `page-contracts.md`
  - `docs/research-pack-contract.md`, `resource-media-workflow.md`, `source-verification-contract.md`
- **Tests and CI:**
  - Delete `web/tests/release-hardening.test.mjs`. It reads build-slices, the product plan and 22 slice files.
  - Delete `.github/workflows/phase-1-release-gate.yml`, which duplicates `web-ci.yml`.
  - Edit `web/tests/universal-local-save.test.mjs` so it no longer reads `docs/slices/3.1…`. It's deleted entirely in C4 if Saved goes.
  - Edit the `web-ci.yml` path filters so they don't point at removed docs.

**Add or rewrite:**
- **README.md:** what Tessli is (v1.2 plan §2), quick start, how to contribute, links.
- **AGENTS.md, one page:**
  - read README, `design.md` and the item checklist;
  - one focused PR per change;
  - `npm run check`;
  - screenshots for visible changes;
  - no fake data;
  - archive rather than drop source rows;
  - semantic tokens in library items;
  - no new dependencies without a reason in the PR.
- **CONTRIBUTING.md:** the three contribution paths (plan §8), local setup, the item checklist, DCO sign-off, the AI-assistance disclosure, and the ban on porting paid kits.
- **Licence and conduct files:**
  - `LICENSE` (MIT) and `TRADEMARKS.md`, which excludes the name, wordmark and hero artwork. **This waits on owner decision #2** (hero artwork provenance).
  - `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1).
- **Issue forms** in `.github/ISSUE_TEMPLATE/`:
  - `suggest-source.yml` (from `docs/v1.2/suggest-source-issue-form-draft.yml`)
  - `submit-design.yml`
  - `report-source.yml`
  - `bug.yml`
  - `config.yml` with blank issues disabled
- **`.github/PULL_REQUEST_TEMPLATE.md`:** about 10 lines. What changed, screenshots if the change is visible, checks run, AI disclosure.
- **`.github/CODEOWNERS`:** the owner for `web/registry/`, `rules/` and `sources/`.
- **Docs:**
  - `docs/decisions.md`, with entry 1: "Adopted v1.2 plan".
  - `docs/README.md`, rewritten as a short index.

**Keep:** `design.md` (fix the display-tracking drift; see C6), `docs/ref-img/`, `docs/asset-manifest.md`, `docs/quality-gates.md` (shortened into a checklist), `docs/tessli-native-mcp.md`, `docs/data-and-media-contract.md` (catalogue part only), `docs/component-contracts.md` (trim it), `docs/v1.2/`.

## C2: Proofs, experiments and legacy specimens (`chore/remove-proofs-and-experiments`)

**OSS homepage proof**
- **Remove:**
  - `web/app/proofs/`
  - `web/components/oss-human-review/`
  - `web/lib/oss-human-review.{mjs,d.mts}`
  - `docs/proofs/`
  - `web/scripts/generate-oss-proof-research-setup.mjs`, `web/scripts/measure-oss-proof-handoff.mjs`
  - The "Measure OSS proof handoff" CI step
- **Delete tests:** `oss-homepage-candidate.test`, `oss-human-review-contract.test`, `oss-proof-research-setup.test`, `oss-homepage-browser`, `oss-human-review-browser`.
- **Edit tests:** `public-ia-hygiene.test`, `machine-discovery.test` (robots `/proofs/`), `release-gate-browser`.

**Lab fixtures**
- **Remove:** `web/app/lab/resource-cards/`, `web/public/lab/`.
- **Keep `web/app/lab/page.tsx`:** it's the only named button set and the token specimen, and it becomes the internal design-system page in C6.
- **Edit tests:** `resource-card.test` (two lab-fixture tests) and `design-foundation.test`, if they assert on fixture sections.

**Evaluation experiment**
- **Remove:** `evaluation/`, `.agents/skills/ui-plan/`, and the `evaluation/*` lines in `.gitignore`.
- **Recover from the tag in plan Phase 5:** `validate_pair.py`, `record_run.py`, `randomize_blind_labels.py`, the `contract-review`, `repair-log` and `run-telemetry` schemas, `verify-task06.mjs` (to generalise), and the briefs for tasks 01–05.

**Legacy specimen**
- **Remove:** `brand-preview/`. Its hero webp is byte-identical to `web/public/brand/`. First skim `styles-components.css` for anything worth porting into the C6 primitives.
- **Remove the root `favicon.svg`:** it's an orphan, a yellow "T" on black from the old static site. C6 adds `web/app/icon.svg`.

## C3: Auth and Supabase (`chore/remove-auth`)

- **Remove:**
  - `web/app/auth/`, `web/components/auth-shell/`, `web/lib/supabase/`, `web/proxy.ts`
  - `supabase/` (4 migrations)
  - the Supabase variables in `web/.env.example`
- **Dependencies:** drop `@supabase/ssr` and `@supabase/supabase-js`, and regenerate the lockfile with `npm uninstall`, not by hand.
- **Delete tests:** `auth-session-transport.test`, `auth-shell.test`, `supabase-client-contract.test`.
- **Edit tests:** `public-ia-hygiene.test`, `machine-discovery.test` (`/auth`), `global-navigation-browser`, `release-gate-browser`, and the auth-shell audit in `saved-resources-browser`.
- **Update `robots.ts` and `sitemap.ts`.**

## C4: Boards and Saved (`chore/remove-boards-and-saved`)

**Default: remove both.** If the owner keeps Saved (decision #3), remove only Boards and decouple Saved from `board-intake`.

**Remove:**
- `web/app/boards/`, `web/app/saved/`
- `web/components/project-boards/`, `board-intake/`, `saved-resources/`
- `web/lib/board-agent-handoff.*`, `board-research-pack.*`

**Decouple first:**
- `components/source-detail/source-actions` imports `board-intake`; keep only the Visit action.
- `browse` results and `collection-resources` import `save-store`; remove their Save buttons.
- `components/toast-notification` loses its only user. Keep it as a primitive for later, or remove it.

**Navigation and copy:**
- The header and footer navigation drop Saved and Boards. Primary navigation becomes Browse, Collections, For AI until v1.2 Phase 3 renames it.
- Remove the `href="/boards"` CTAs in collections.
- Remove the Board boundary section on `/for-ai`.
- Update `robots.ts`, `sitemap.ts` and `llms.txt`.

**Delete tests:** `project-boards.test`, `board-agent-handoff.test`, `board-research-pack.test`, `saved-to-board-v3.test`, `saved-resources-page.test`, `saved-resources-store.test`, `universal-local-save.test`, `saved-resources-browser`.

**Edit tests:**
- `site-header.test` and `footer-route-integrity.test` (navigation)
- `collections-pages.test` and `collection-detail-research-checklist.test` (`/boards` links)
- `for-ai-page.test` (board boundary)
- `machine-discovery.test`, `public-ia-hygiene.test`
- `collections-browser`, `global-navigation-browser`, `for-ai-browser`

## C5: Media pipeline, verification and live preview (`chore/remove-media-pipeline`)

**Media pipeline**
- **Remove scripts:**
  - `capture-resource-preview-{pilot,interaction-pilot,overlay-verification,overlay-edge-cases}.mjs`
  - `discover-resource-media.mjs`, `generate-resource-media-{coverage,review}.mjs`
  - `check-resource-media-{candidates,coverage}.mjs`, `resource-media-{coverage,discovery,review}-lib.mjs`
  - `select-resource-media-batch.mjs`, `inspect-dev.mjs`
- **Remove the matching npm scripts:** all of `media:*`.
- **Remove data and reports:**
  - `lib_data/resource-media-candidates.json`, `lib_data/resource-media-coverage.json`
  - `schemas/resource-media-candidates.schema.json`, `schemas/resource-media-coverage.schema.json`
  - `docs/reports/`
- **Fix `npm test`:** take the two media checkers out of the `test` script.
- **Keep (frozen):** `lib_data/resource-media.json` and `schemas/resource-media.schema.json`. `release-catalogue-lib.mjs` merges them into the catalogue and the cards still use them.

**Verification**
- **Remove:** `web/scripts/resource-verification.mjs`, `web/lib/resource-verification.ts`, `schemas/resource-verification-record.schema.json`, and the `verification:*` npm scripts.

**Live-preview pilot**
- **Remove:** `components/source-detail/live-preview*`.
- **Edit:** `source-detail-foundation.test`, which asserts `<LivePreview`.

**Profiles**
- **Remove:** `web/scripts/generate-intelligence-profiles.mjs`. It holds the same profile data a second time, as 1,041 lines of hard-coded values.
- **Keep:** the committed JSON profiles and `check-intelligence-profiles.mjs`.

**Tests**
- **Delete:** `resource-media-candidates.test`, `resource-media-coverage.test`, `resource-preview-pilot.test`, `resource-preview-interaction-pilot.test`, `resource-preview-overlay-verification.test`, `resource-preview-overlay-edge-cases.test`, `live-preview-pilot.test`, `live-preview-pilot-browser`, `resource-verification.test`.
- **Edit:** `source-profile-contract.test` if the coverage wording changes.

## C6: Dead code and design-system repair (`fix/design-system-foundation`)

This is the only visible cleanup PR. It needs before/after screenshots.

### Remove dead code

| Path | Why it's dead |
|---|---|
| `web/components/explore-discovery/`, `explore-results/`, `full-reference/` | 3,500 lines that no route renders |
| `web/lib/research-packet.ts` | Imported only by its test |
| `.foundation-*` CSS in `globals.css` | 0 uses |

**Tests:**
- **Delete:** `discovery-controls.test`, `explore-results.test`, `research-packet.test`.
- **Rename** `full-reference.test` → `browse-pages.test`; 5 of its 6 tests actually test `/resources`.

### Fix undefined tokens (real bugs on pages that stay)

| Token | Refs | Effect today |
|---|---|---|
| `--font-display` | 6 (browse, source detail, intelligence detail) | Those headings don't render in Newsreader |
| `--color-border`, `--color-text`, `--color-text-muted` | ~15 in `browse.module.css`, no fallback | Browse borders and colours silently drop |
| `--space-7`, `--space-9` | 15 | Gaps compute to 0 |
| `--charcoal-art` | 1 (`for-ai.module.css`) | Undefined |

Either define each token in `globals.css` or replace it with an existing one.

### Align and expose tokens

- Align the radius names between `design.md` (xs–xl) and `globals.css` (control-sm–lg).
- Bring `design.md`'s display tracking in line with the shipped values.
- Expose the full token set through the Tailwind v4 `@theme`: colour, type, space, radius, shadow, motion. Today it exposes six tokens and none are used.

### Extract a small primitives layer

Add `web/components/ui/`: `Button` (primary, secondary, quiet), `Field`, `Tag`, `Eyebrow`.

- **Why:** `.primaryAction` / `.secondaryAction` is redefined in 6 modules with drifting values, and there are 158 button-, link- and tag-like rules across 21 modules.
- **How:** migrate the kept pages onto the primitives. Don't redesign them.

### Remove the AI-design tells (plan §4)

- One eyebrow, in the hero only.
- No "→" on ordinary links.
- 01/02/03 markers only for real sequences (the For AI workflow qualifies).

### Small fixes

- Collapse the 27 different `max-width` breakpoints onto the documented ones where it's safe.
- Add `web/app/icon.svg` with the Tessli mark.

**Keep untouched:** `explore-hero` and the hero artwork. The CI hash check on `tessli-hero-geometry.webp` stays.

## C7: One CI workflow and a link check (`chore/ci-consolidation`)

**`ci.yml`:** runs on PRs and on pushes to `main`. Steps:
1. `npm ci`
2. Hero hash check
3. `format:check`, `typecheck`, `lint`
4. `test`
5. `catalogue:check`
6. `build`
7. A browser smoke test of `/`, `/resources`, one source page, `/collections`, `/for-ai` and `/about` at 1440 and 390: no overflow, no console errors, landmarks present.
8. Upload screenshots as an artifact.

Replace the 700-line `release-gate-browser.mjs` with this smoke test.

**`links.yml`:** a weekly `lychee` run over catalogue URLs (`--cache`, `fail: false`) that opens or updates one "Broken source links" issue.

**Add `npm run check`:** an alias that runs everything in `ci.yml` except the browser step, so contributors run one command.

---

## After cleanup: the v1.2 build work

These are plan phases, not cleanup:

- **Phase 1:**
  - Freeze source IDs.
  - Remove the hard-coded 295 and per-category counts from `catalogue-lib.mjs` and the schema.
  - Add `archived` status.
  - Migrate to `sources/<slug>.yml`.
  - Apply the owner-reviewed triage.
- **Phases 2–3:**
  - Add `web/registry/`, `rules/`, and `/library`, `/preview`, `/rules` and `/contribute`.
  - Add MCP item tools and rewrite `llms.txt` and `/for-ai`.
- **Phase 5:** recover the evaluation scripts from `v1.1-archive` into a lean `bench/`.

## Removal map (quick reference)

| Area | Paths | Step |
|---|---|---|
| Process docs | root handoffs, PRD, build-slices, roadmap; `docs/slices`, `archive`, `plans`, `library-v1`, `contracts`, `research`, 14 V2/V3 docs | C1 |
| Proofs and experiments | `web/app/proofs`, `oss-human-review*`, `docs/proofs`, `evaluation/`, `.agents/`, `brand-preview/`, `app/lab/resource-cards`, `public/lab`, root `favicon.svg` | C2 |
| Auth | `app/auth`, `auth-shell`, `lib/supabase`, `proxy.ts`, `supabase/`, two `@supabase/*` dependencies | C3 |
| Boards and Saved | `app/boards`, `app/saved`, `project-boards`, `board-intake`, `saved-resources`, `lib/board-*` | C4 |
| Media and verification | 14 media scripts, `media:*` and `verification:*` scripts, the candidates and coverage data and schemas, `docs/reports`, the verification lib, script and schema, live preview, the profile generator | C5 |
| Dead code | `explore-discovery`, `explore-results`, `full-reference`, `research-packet.ts`, `.foundation-*` CSS | C6 |
| CI | `phase-1-release-gate.yml` (C1); `web-ci.yml` → `ci.yml` and `links.yml` (C7) | C1, C7 |
