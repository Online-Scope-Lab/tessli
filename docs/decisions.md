# Decisions

One dated line per non-obvious decision, newest at the bottom. Format: `- YYYY-MM-DD — <choice>. <why>.` The PR that made the change holds the detail.

- 2026-10-11 — Adopted the v1.2 plan ([`v1.2/plan.md`](v1.2/plan.md)) and its cleanup plan ([`v1.2/repo-cleanup.md`](v1.2/repo-cleanup.md)): library first, Sources second, GitHub issues and PRs as the backend, no accounts or database. A directory of links alone can't answer whether Tessli improves AI-built UI; explained, installable items and a measured bench can.
- 2026-10-11 — Code and taste notes are MIT-licensed; the Tessli name, wordmark and hero artwork are excluded and covered by `TRADEMARKS.md`, with Online Scope as rights holder. The hero artwork's origin is not recorded, so it is excluded from the licence regardless of how that is later resolved.
- 2026-10-11 — Saved and Boards are removed from v1.2. They need accounts or sync to be useful beyond one browser, and v1.2 builds no accounts.
- 2026-10-11 — The "keep all 295 rows" rule is replaced by "never drop a source row silently; archive it with a reason". Pruning to a defended list needs removals, but IDs, history and old links must survive.
- 2026-10-11 — The source list follows [`v1.2/catalogue-triage-final.csv`](v1.2/catalogue-triage-final.csv). It is the owner-approved triage of the audit.
- 2026-10-11 — The registry location is settled by the stage-B spike, preferring `web/registry/`. It is the simplest fit with the Next.js app; CODEOWNERS already lists it.
- 2026-10-11 — Code of Conduct reports go privately to the maintainers via the contact on their GitHub profiles (@itsdeepaks, @deepak-onlinescope); a dedicated contact address is an owner follow-up. No address is published until one exists.
- 2026-10-11 — CODEOWNERS defaults to `@itsdeepaks @deepak-onlinescope`. Both are the owner's accounts with write access.
- 2026-10-11 — Stale draft PR #99 is closed as superseded by v1.2. Its work predates the new direction.
- 2026-10-11 — Merged branches are listed for a human to delete rather than deleted by automation. The automation environment's proxy rejects remote ref deletion.
- 2026-10-11 — Process docs (PRD, build slices, slice evidence, contracts, handoffs, research, archive) are removed from the tree. The PR and diff are now the record; everything removed is recoverable from the `v1.1-archive` tag and the `archive/v1.1` branch.
- 2026-10-11 — The issue forms apply the labels `source:suggestion`, `source:problem`, `design:needs-implementation` and `bug`; a human must create any that are missing in the repository settings. GitHub does not create labels from issue forms, so until then issues arrive unlabelled and the triage in `CONTRIBUTING.md` will not work.
- 2026-10-11 — C6 port candidates from brand-preview (removed in C2; read it with `git show v1.1-archive:brand-preview/styles-components.css`). Worth carrying into the C6 primitives:
  - Shared-border grids: the container draws the top and left border, each cell the right and bottom, so swatch, type and card grids never double their borders.
  - One uppercase micro-label style (about 0.72rem, weight 700, 0.06–0.11em tracking, muted or accent text) shared by section kickers, fieldset legends and field labels.
  - Tabs marked by a 2px accent underline on `[aria-selected="true"]::after`, and a segmented control whose `[aria-pressed="true"]` option inverts to strong text on surface.
  - Selected tags tinted with `color-mix()` of the accent into the line colour and `--accent-soft`; success notices tinted the same way from `--success`.
  - A `kbd` style with a heavier bottom border, and primary/secondary/quiet button variants (raise the specimen's 42px height to the 44px touch target).
- 2026-10-11 — `resource-card-browser` now checks hover lift, border trace, selectable text and overflow on `/resources` cards instead of the removed `/lab/resource-cards` fixtures; the fixture-only checks (broken-preview fallbacks, fixture count) went with the fixtures. The card behaviour is kept, so its browser coverage is kept on the real Browse surface.
