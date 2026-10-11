# Contributing to Tessli

Thanks for helping. Tessli has no accounts or in-site forms: every contribution is a GitHub issue or a pull request, and GitHub's own login and moderation do the rest.

Please read the [Code of Conduct](CODE_OF_CONDUCT.md) first. By contributing you agree that your work is released under the [MIT licence](LICENSE). The Tessli name, wordmark and hero artwork are not part of that licence; see [TRADEMARKS.md](TRADEMARKS.md).

## Ways to contribute

| You have                                  | Do this                                                                                                                                                                                                                  | It lands as                                                                                 |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| A good design or frontend source          | Open a [**Suggest a source**](https://github.com/Online-Scope-Lab/tessli/issues/new?template=suggest-source.yml) issue                                                                                                   | Issue labelled `source:suggestion`; a maintainer or contributor turns it into a one-file PR |
| A design (screenshot or Figma link)       | Open a [**Submit a design**](https://github.com/Online-Scope-Lab/tessli/issues/new?template=submit-design.yml) issue                                                                                                     | Issue labelled `design:needs-implementation`, which developers can pick up                  |
| Code for a library item                   | Open a pull request (see [Contribute an item](#contribute-an-item))                                                                                                                                                      | PR checked by CI, then reviewed by maintainers                                              |
| A UI rule, or a fix to one                | Open a pull request (see [Propose a rule](#propose-a-rule))                                                                                                                                                              | PR checked by CI, then reviewed by maintainers                                              |
| A broken link, wrong information or a bug | Open a [**Report a source problem**](https://github.com/Online-Scope-Lab/tessli/issues/new?template=report-source.yml) or [**Bug report**](https://github.com/Online-Scope-Lab/tessli/issues/new?template=bug.yml) issue | Issue                                                                                       |

Designers and developers who build an item from a submitted design are both credited on the item.

A **Suggest a source** issue gets one automatic comment (`.github/workflows/suggest-source.yml`): the normalised URL, any source already in Tessli with the same URL or domain (archived ones included, with their status), problems with required fields, the 40–200 character summary, category or access, and the link's HTTP status. It updates the same comment when you edit the issue. It never accepts, labels or closes a suggestion; a maintainer still opens the source and decides.

### Contribute an item

An item is one folder, `web/registry/items/<slug>/`, opened as a PR. The first items were built by the maintainers to set the bar; read one (for example `web/registry/items/pricing-tiers/`) before you start.

1. Copy `web/registry/_template/` to `web/registry/items/<slug>/`, where `<slug>` is a lowercase, hyphenated name that will never change.
2. Rename `example-item.tsx` to `<slug>.tsx` and build the item there. It is one file that imports only React, shadcn/ui primitives as `@/registry/shadcn/ui/<name>` (for example `@/registry/shadcn/ui/button`) and `cn` from `@/registry/shadcn/lib/utils`. The shadcn CLI rewrites those to the installing project's `@/components/ui/<name>` and `@/lib/utils`. A primitive that isn't in `web/registry/shadcn/ui/` yet is vendored from shadcn/ui in the same PR.
3. Write `demo.tsx` (the first state in `notes.md`) with realistic, clearly fictional content. If the item has more states (empty, error, loading…), export them from `states.tsx` as `export const states = { "state-name": Component }`; otherwise delete `states.tsx`.
4. Fill in every field of `notes.md` honestly, then a few short paragraphs of reasoning. Under `rules`, list the 3–8 [rules](rules/TESSLI.md) the item really follows (read the item against each rule's check); the build fails on an id that doesn't exist. [`schemas/library-item.schema.json`](schemas/library-item.schema.json) is the full field list. Leave `status: community`, `reviewed_by: []` and `reviewed_at: null`: only a maintainer marks an item reviewed.
5. From `web/`, run `npm run registry:build` (it validates the item and regenerates `registry.json`, `web/public/r/<slug>.json`, `web/data/library.json` and `web/registry/__index__.tsx`), then `npm run check`.
6. Look at it: `npm run dev`, then open `/preview/<slug>?theme=tessli|neutral|dark` (add `&state=<name>` for other states) at 1440, 1024, 768, 390 and 320 px, and `/library/<slug>`. After `npm run build`, `npm run test:items` runs the same automated checks as CI (overflow, console errors and axe-core WCAG 2.2 AA) and saves screenshots to `web/artifacts/items/`.

The [item checklist](#item-checklist) below is the bar every item is reviewed against.

### Propose a rule

A rule is one file, `rules/<ID>.md`, with YAML frontmatter validated by [`schemas/rule.schema.json`](schemas/rule.schema.json). Rules are about structure and behaviour (hierarchy, spacing, density, states, copy, responsive, motion, accessibility), never a palette or brand, so they hold in any theme.

- **Id:** the category prefix, a hyphen and the next free two-digit number: `H` hierarchy, `T` typography, `S` spacing and density, `C` colour, `K` components, `W` copy, `ST` states, `R` responsive, `M` motion, `A` accessibility (for example `ST-06`). The id equals the file name, is never renamed and is never reused.
- **Fields:** `title`; `statement` (one imperative line, at most 95 characters); `why` (one to three sentences); `check` (how to verify it, concrete and observable, ideally at 1440, 768 and 390 px; at most 95 characters); `anti_pattern` (the generic default it guards against); `sources` (real, checkable origins such as a `design.md` section, `docs/quality-gates.md`, a WCAG 2.2 success criterion or a [review dimension](docs/quality-gates.md#review-dimensions); no unsourced studies or statistics). A short prose body is optional.
- **Status:** leave `status: draft`, `reviewed_by: []` and `reviewed_at: null`. Only a maintainer signs a rule `reviewed`, with their GitHub handle and a date.
- **Specific, not a platitude:** if two reviewers could disagree on whether a screen passes the check, sharpen the check.

From `web/`, `npm run registry:build` validates the rule and regenerates [`rules/TESSLI.md`](rules/TESSLI.md) (the compact index agents install, kept under 8 KB) and `web/data/rules.json`; commit both. Rule pages list the items that apply them automatically, from the items' `notes.md`.

### Add a source

Adding a source is one new file, `sources/<slug>.yml`, so source PRs never conflict. Copy an existing file and change every field:

```yaml
id: resource-example-patterns # "resource-" + the slug; never change it later
slug: example-patterns # must equal the file name
name: Example Patterns
url: https://example.com
category: design-systems
kind: reference # gallery | library | design-system | tool | asset | reference
access: free # free | open-source | freemium | paid | free-trial
summary: What you'll find there, specifically, in one sentence of 40-200 characters.
status: active
added_at: 2026-10-11
added_via: community
last_checked: 2026-10-11 # the day you opened and checked it
submission_issue: 123 # the "Suggest a source" issue, if there is one
```

The `summary` says specifically what you'll find there in 40–200 characters. `best_for` (at most 3), `limitations` (at most 2), `frameworks` and `license` are optional. [`schemas/source.schema.json`](schemas/source.schema.json) has the full field list and [`docs/data-and-media-contract.md`](docs/data-and-media-contract.md) explains it. Then run `npm run catalogue:generate` in `web/` and commit the updated `web/data/catalogue.json` and `web/data/catalogue-validation.json` with your file; `npm run catalogue:check` fails if they drift.

To remove a source, don't delete its file: set `status: archived` with an `archived_reason` (and `replaced_by: <slug>` if another source replaces it).

## Local setup

You need Node.js 22.18 or later and npm.

```bash
git clone https://github.com/Online-Scope-Lab/tessli.git
cd tessli/web
npm ci
npm run dev
```

Before opening a PR, run the checks from `web/`:

```bash
npm run check
```

It runs the hero artwork hash check, `format:check`, `typecheck`, `lint`, `test`, `catalogue:check`, `registry:check` and `build`: everything CI runs except the shadcn registry validation and the browser and item preview tests. (`npm run format` fixes formatting.)

Branch from the latest `main`, keep one focused change per PR, and fill in the pull request template.

## Item checklist

A library item is accepted as `community` only when all of these are true:

- **Semantic tokens only.** No hard-coded brand colours, fonts or spacing values.
- **Works in all three themes:** Tessli, Neutral and Dark.
- **Works at 1440, 1024, 768, 390 and 320 px** with no horizontal overflow.
- **States are covered** where they apply: loading, empty, error and success.
- **Accessible:** semantic HTML and landmarks, full keyboard use, a visible `:focus-visible` state, adequate touch targets, reduced-motion support, no information shown only on hover or only by colour, and WCAG 2.2 AA contrast.
- **`notes.md` is filled in:** use when, avoid when, the 3–8 rules it applies, the common AI default it replaces, failures, states, responsive behaviour, accessibility notes, contributors, provenance and licence.
- **`status: community`.** Only a maintainer can mark an item `reviewed`, by signing it with their GitHub handle and a date. Don't set `reviewed_by` or `reviewed_at` yourself.
- **Realistic but clearly fictional demo content.**

## Contribution rules

These are enforced in review.

- **Original work only.** No ports or "recreations" of paid kits such as Tailwind Plus or shadcnblocks; their licences forbid it.
- **Adapted open-source work must name its source and licence**, both in `notes.md` and in the PR description.
- **No invented metrics, logos or testimonials.** No fake ratings, user counts, customer logos, quotes or verification claims, in demo content or anywhere else. Fictional content must look clearly fictional.
- **AI assistance is allowed but must be disclosed** in the PR, and a human must have actually reviewed the result. Unreviewed AI-generated work is rejected, because human judgment is the point of Tessli.
- **No new dependency without a one-line reason** in the PR description.
- **Sources are never deleted silently.** A source that should go is archived with a reason, so its ID, history and old links survive.

## Sign-off (DCO)

Tessli uses the [Developer Certificate of Origin](https://developercertificate.org/) instead of a CLA. Sign off every commit:

```bash
git commit -s -m "feat: add two-tier pricing section"
```

This adds a `Signed-off-by: Your Name <you@example.com>` line, which certifies that you wrote the change or have the right to submit it under the project's licence. To sign off commits you already made on your branch, run `git rebase --signoff main` and force-push your branch (never `main`).

## Questions

Open an issue. For conduct concerns, follow the private reporting route in the [Code of Conduct](CODE_OF_CONDUCT.md#enforcement).
