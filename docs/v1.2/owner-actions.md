# Owner actions before Codex can continue

These two items block parts of the v1.2 plan. Only the owner can complete them.

## 1. Mark the source triage (blocks Phase 1)

File: [`catalogue-triage-draft.csv`](catalogue-triage-draft.csv)

- Add a column `owner_decision` with one of: `keep`, `archive`, `fix-url`, `merge`.
- Decide the `MAYBE` rows within their `overlap_group`. Open each `low`/`med` confidence row before deciding.
- When done, rename the file to `catalogue-triage-final.csv` and commit it.

**Done 2026-10-11** (made by Claude on the owner's request): `catalogue-triage-final.csv` — 125 keep, 4 fix-url, 2 merge, 164 archive. Rules: KEEP→keep, CUT→archive, MAYBE kept only if score ≥ 14. Owner may override any row.

Before this, Codex prepares the Phase 1 triage PR as a draft and does not apply it.

## 2. Confirm the hero artwork's origin (blocks C1 licence)

Asset: `web/public/brand/tessli-hero-geometry.webp` (source: `docs/ref-img/tessli-hero-geometry.webp`)

Record below: who made it, with which tool, and who holds the rights.

- Origin: not recorded anywhere in the repo or its available history (first appears in commit f36c9d7). Assumed to be provided by the owner.
- Rights holder: Online Scope (assumed). Owner to correct this line if wrong.
- Decision (2026-10-11, made by Claude on the owner's request): the artwork is excluded from the MIT licence and covered by `TRADEMARKS.md`. This holds whatever its origin turns out to be, so C1 may proceed.

Until this is filled in, Codex merges the rest of C1 but leaves out `LICENSE` and `TRADEMARKS.md`.
