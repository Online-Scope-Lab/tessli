# AGENTS.md

Rules for coding agents and contributors working in this repository. Short on purpose; the PR description and the diff are the record of what changed and why.

## Before you start

- Read [`README.md`](README.md), [`design.md`](design.md) and the [item checklist](CONTRIBUTING.md#item-checklist) in `CONTRIBUTING.md`.
- The direction is [`docs/v1.2/plan.md`](docs/v1.2/plan.md): library first, Sources second, GitHub issues and PRs as the backend.
- Removed process docs, proofs and experiments can be recovered from the `v1.1-archive` tag: `git show v1.1-archive:<path>`.

## How to work

- One focused PR per change, branched from the latest `main`. Never rewrite `main` history.
- Run `npm run check` from `web/` before opening a PR. It runs the hero hash check, `format:check`, `typecheck`, `lint`, `test`, `catalogue:check` and `build`; CI (`.github/workflows/ci.yml`) runs the same steps plus the browser tests.
- For visible changes, attach screenshots at 1440, 1024, 768, 390 and 320 px, with no horizontal overflow.
- Never skip, disable or weaken a test to get green. A test that only checks removed behaviour is deleted with it; a test that also checks something kept is edited.
- Record a non-obvious decision as one dated line in [`docs/decisions.md`](docs/decisions.md).

## Truth

- No fake data: no invented ratings, user counts, logos, testimonials, activity or verification claims.
- Don't say Tessli "improves AI output" or "gives AI taste" until published, human-scored bench results support it.
- Never drop a source row silently. Archive it with a reason so its ID and history survive.

## Library items

- Semantic theme tokens only (`--background`, `--foreground`, `--primary`, `--muted`, `--border`, `--radius`…); no hard-coded brand colours.
- Every item must work in the Tessli, Neutral and Dark themes.
- Items you build have status `community`. Only a human maintainer signs an item `reviewed`.
- Original work only. Adapted open-source work names its source and licence. No ports of paid kits.

## Brand

- Keep the brand: Newsreader for display, Instrument Sans for interface, the tokens and grain in `design.md`, and the hero artwork.
- `web/public/brand/tessli-hero-geometry.webp` is hash-checked in CI. Never modify it.
- The Tessli name, wordmark and hero artwork are excluded from the MIT licence; see [`TRADEMARKS.md`](TRADEMARKS.md).

## Out of scope

- No auth, database, analytics, payments or screenshot/media pipelines.
- No new dependency without a one-line reason in the PR description.
- No hosted remote MCP until its security decision is made.
