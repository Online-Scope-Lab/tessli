# Owner actions before Codex can continue

These two items block parts of the v1.2 plan. Only the owner can complete them.

## 1. Mark the source triage (blocks Phase 1)

File: [`catalogue-triage-draft.csv`](catalogue-triage-draft.csv)

- Add a column `owner_decision` with one of: `keep`, `archive`, `fix-url`, `merge`.
- Decide the `MAYBE` rows within their `overlap_group`. Open each `low`/`med` confidence row before deciding.
- When done, rename the file to `catalogue-triage-final.csv` and commit it.

Until the final file exists, Codex prepares the Phase 1 triage PR as a draft and does not apply it.

## 2. Confirm the hero artwork's origin (blocks C1 licence)

Asset: `web/public/brand/tessli-hero-geometry.webp` (source: `docs/ref-img/tessli-hero-geometry.webp`)

Record below: who made it, with which tool, and who holds the rights.

- Origin: _TBD_
- Rights holder: _TBD_

Until this is filled in, Codex merges the rest of C1 but leaves out `LICENSE` and `TRADEMARKS.md`.
