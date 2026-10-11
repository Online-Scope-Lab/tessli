# Contributing to Tessli

Thanks for helping. Tessli has no accounts and no forms of its own: every contribution is a GitHub issue or a pull request, and GitHub's own sign-in and moderation do the rest. The same four paths are on the site at [`/contribute`](https://tessli.vercel.app/contribute).

Please read the [Code of Conduct](CODE_OF_CONDUCT.md) first. By contributing you agree that your work is released under the [MIT licence](LICENSE). The Tessli name, wordmark and hero artwork are not part of that licence; see [TRADEMARKS.md](TRADEMARKS.md).

## Ways to contribute

| You have                                  | Do this                                                                                                                                                                                                                  | It lands as                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| A good design or frontend source          | Open a [**Suggest a source**](https://github.com/Online-Scope-Lab/tessli/issues/new?template=suggest-source.yml) issue, or [add it yourself](#add-a-source)                                                              | Issue labelled `source:suggestion`; a maintainer or contributor turns it into a one-file PR            |
| A design (screenshot or Figma link)       | Open a [**Submit a design**](https://github.com/Online-Scope-Lab/tessli/issues/new?template=submit-design.yml) issue                                                                                                     | Issue labelled `design:needs-implementation`, which a developer can [build](#build-a-submitted-design) |
| Code for a library item                   | Open a pull request: [Contribute an item](#contribute-an-item)                                                                                                                                                           | PR checked by CI, then reviewed by maintainers                                                         |
| A UI rule, or a fix to one                | Open a pull request: [Propose a rule](#propose-a-rule)                                                                                                                                                                   | PR checked by CI, then reviewed by maintainers                                                         |
| A broken link, wrong information or a bug | Open a [**Report a source problem**](https://github.com/Online-Scope-Lab/tessli/issues/new?template=report-source.yml) or [**Bug report**](https://github.com/Online-Scope-Lab/tessli/issues/new?template=bug.yml) issue | Issue                                                                                                  |
| Time to help but no idea yet              | Pick a [good first issue](https://github.com/Online-Scope-Lab/tessli/contribute) and say in a comment that you're on it                                                                                                  | A pull request that closes the issue                                                                   |

## Your first pull request

You need Git, Node.js 22.18 or later and npm.

1. Fork the repository on GitHub, then clone your fork and install:

   ```bash
   git clone https://github.com/<you>/tessli.git
   cd tessli/web
   npm ci
   ```

2. Branch from the latest `main`: `git switch -c <short-topic>`. Keep one focused change per pull request.
3. Make the change. Run `npm run dev` to see the site at <http://localhost:3000>.
4. From `web/`, run the checks:

   ```bash
   npm run check
   ```

   It runs the hero artwork hash check, `format:check`, `typecheck`, `lint`, `test`, `catalogue:check`, `registry:check` and `build`. `npm run format` fixes formatting. CI runs the same, plus the shadcn registry validation and the browser and [item preview](#check-one-item) tests.

5. Commit with a sign-off (`git commit -s`, see [Sign-off (DCO)](#sign-off-dco)), push to your fork and open a pull request against `main`. Fill in the pull request template, including the [AI-assistance](#ai-assistance) line.

CI runs on your pull request with a read-only token and no secrets, so it works the same from a fork. GitHub may hold the first run of a first-time contributor until a maintainer approves it. If a check fails, its log names the file and the fix; run the same command locally.

## Suggest a source

Open a [**Suggest a source**](https://github.com/Online-Scope-Lab/tessli/issues/new?template=suggest-source.yml) issue. Soon after, it gets one automatic comment from [`.github/workflows/suggest-source.yml`](.github/workflows/suggest-source.yml): the normalised URL, any source already in Tessli with the same URL or domain (archived ones included, with their status), problems with required fields, the 40–200 character summary, category or access, and the link's HTTP status. Editing the issue updates the same comment. The check never accepts, labels or closes a suggestion; a maintainer still opens the source and decides. If it is accepted, a maintainer or any contributor adds it as one file, below.

### Add a source

Adding a source is one new file, `sources/<slug>.yml`, so source PRs never conflict. Copy an existing file, such as [`sources/land-book.yml`](sources/land-book.yml), and change every field:

```yaml
id: resource-example-patterns # "resource-" + the slug; never change it later
slug: example-patterns # must equal the file name
name: Example Patterns
url: https://example.com
category: design-systems
kind: reference # gallery | library | design-system | tool | asset | reference
access: free # free | open-source | freemium | paid | free-trial
summary: Side-by-side examples of common interface patterns, each linked to its source.
status: active
added_at: 2026-10-11
added_via: community
last_checked: 2026-10-11 # the day you opened and checked it
submission_issue: 123 # the "Suggest a source" issue, if there is one
```

- `category` is one of `website-inspiration`, `product-ui-ux`, `landing-marketing`, `ui-libraries`, `design-systems`, `motion-3d`, `typography`, `color-accessibility`, `icons`, `visual-assets` or `design-tools-ai` (the automatic comment on a suggestion names the one its form chose).
- `kind` says what someone does there: `gallery` (browse curated examples), `library` (install code), `design-system` (study an organisation's documented system), `tool` (use an app to make or check something), `asset` (download fonts, icons or images) or `reference` (read guidance).
- `summary` says specifically what you'll find there, in 40–200 characters, without marketing adjectives.
- `best_for` (at most 3), `limitations` (at most 2), `frameworks` and `license` are optional. [`schemas/source.schema.json`](schemas/source.schema.json) has the full field list and [`docs/data-and-media-contract.md`](docs/data-and-media-contract.md) explains it.

Then, from `web/`:

```bash
npm run catalogue:generate   # validates every source file and rebuilds web/data/
npm run catalogue:check      # what CI runs: fails on an invalid file or on drift
```

Commit `web/data/catalogue.json` and `web/data/catalogue-validation.json` with your file. Every error names the file, the field and what to write instead.

To remove a source, don't delete its file: set `status: archived` with an `archived_reason` (and `replaced_by: <slug>` if another source replaces it).

## Submit a design

Open a [**Submit a design**](https://github.com/Online-Scope-Lab/tessli/issues/new?template=submit-design.yml) issue with a screenshot or a Figma link anyone can view, the problem it solves and what the common default gets wrong. Share only work you made or have the right to share. A maintainer reviews every submission; submitting does not mean it will be built.

### Build a submitted design

Open issues labelled `design:needs-implementation` are designs waiting for a developer.

1. Comment on the issue that you're building it, so two people don't.
2. Follow [Contribute an item](#contribute-an-item). In `notes.md`, put both GitHub handles under `contributors`: the designer's (the issue author) and yours. The item page credits both.
3. Write `Closes #<issue number>` in the pull request description, and link screenshots of your build next to the design.

The design is a starting point, not a pixel spec: the item still uses semantic tokens, works in all three themes and at five widths, and follows its rules. Say in the PR where you changed the design and why.

## Contribute an item

An item is one folder, `web/registry/items/<slug>/`, opened as a PR. The first items were built by the maintainers to set the bar; read one (for example [`web/registry/items/pricing-tiers/`](web/registry/items/pricing-tiers/)) before you start.

1. Copy [`web/registry/_template/`](web/registry/_template/) to `web/registry/items/<slug>/`, where `<slug>` is a lowercase, hyphenated name that will never change. From the repository root:

   ```bash
   cp -r web/registry/_template web/registry/items/<slug>
   ```

2. Rename `example-item.tsx` to `<slug>.tsx` and update the `./example-item` imports in `demo.tsx` and `states.tsx`. Build the item in `<slug>.tsx`: one file that imports only React, shadcn/ui primitives as `@/registry/shadcn/ui/<name>` (for example `@/registry/shadcn/ui/button`) and `cn` from `@/registry/shadcn/lib/utils`. The shadcn CLI rewrites those to the installing project's `@/components/ui/<name>` and `@/lib/utils`. A primitive that isn't in [`web/registry/shadcn/ui/`](web/registry/shadcn/ui/) yet is vendored from shadcn/ui in the same PR.
3. Write `demo.tsx` (it renders the first state in `notes.md`) with realistic, clearly fictional content. If the item has more states (empty, error, loading…), export them from `states.tsx` as `export const states = { "state-name": Component }`; otherwise delete `states.tsx`.
4. Fill in every field of `notes.md` honestly, then replace the prose with a few short paragraphs of reasoning. Under `rules`, list the 3–8 [rules](rules/TESSLI.md) the item really follows (read the item against each rule's check). [`schemas/library-item.schema.json`](schemas/library-item.schema.json) is the full field list. Leave `status: community`, `reviewed_by: []` and `reviewed_at: null`: see [Community and reviewed](#community-and-reviewed).
5. From `web/`, build the registry:

   ```bash
   npm run registry:build
   ```

   It validates the item and regenerates `registry.json`, `web/public/r/<slug>.json`, `web/public/r/registry.json`, `web/data/library.json`, `web/data/rules.json`, `rules/TESSLI.md` and `web/registry/__index__.tsx`. Commit all of them with the item. If it reports problems, each line names the file and what to change: a missing field, a value that isn't allowed, text still copied from the template, a rule id that doesn't exist, or states that don't match `states.tsx`.

6. [Check it](#check-one-item) in the browser, then run `npm run check`.

The [item checklist](#item-checklist) below is the bar every item is reviewed against.

### Check one item

With `npm run dev` running, open:

- `http://localhost:3000/preview/<slug>`: the bare item in the Tessli theme. Add `?theme=neutral` or `?theme=dark` for the other themes and `&state=<name>` for another state, for example `/preview/<slug>?theme=dark&state=empty`. Check it at 1440, 1024, 768, 390 and 320 px (your browser's responsive mode).
- `http://localhost:3000/library/<slug>`: the item page with its notes, rules and code.

Then run the automated checks CI runs: every state and theme at five widths, failing on horizontal overflow, console errors and axe-core WCAG 2.2 AA violations. Stop `npm run dev` first (the tests reuse whatever is on port 3000), and install the test browser once with `npx playwright install chromium`:

```bash
npm run build
npm run test:items -- -g "<slug> ·"           # only your item
npm run test:items -- -g "<slug> · empty · dark"   # one state in one theme
```

Screenshots land in `web/artifacts/items/` (not committed); attach the ones that show your item's states to the PR. From the repository root, `npx shadcn@4.21.4 registry validate ./registry.json` runs the shadcn validation CI runs.

### Item checklist

A library item is accepted as `community` only when all of these are true:

- **Semantic tokens only.** No hard-coded brand colours, fonts or spacing values.
- **Works in all three themes:** Tessli, Neutral and Dark.
- **Works at 1440, 1024, 768, 390 and 320 px** with no horizontal overflow.
- **States are covered** where they apply: loading, empty, error and success.
- **Accessible:** semantic HTML and landmarks, full keyboard use, a visible `:focus-visible` state, adequate touch targets, reduced-motion support, no information shown only on hover or only by colour, and WCAG 2.2 AA contrast.
- **`notes.md` is filled in:** use when, avoid when, the 3–8 rules it applies, the common AI default it replaces, failures, states, responsive behaviour, accessibility notes, contributors, provenance and licence.
- **`status: community`.** Don't set `reviewed_by` or `reviewed_at` yourself.
- **Realistic but clearly fictional demo content.**

### Community and reviewed

Every item and rule has one of two honest levels, shown on its page:

- **Community** (`status: community`; a rule starts as `status: draft`): merged, CI-checked and meeting the checklist. Everything a contributor opens starts here.
- **Reviewed** (`status: reviewed`): a maintainer checked it against the rules, in all three themes and at all widths, and signed it with their GitHub handle in `reviewed_by` and the date in `reviewed_at`. Only maintainers sign, in their own commit; a pull request that marks its own work reviewed is sent back.

There are no stars, ratings or download counts.

## Propose a rule

A rule is one file, `rules/<ID>.md`, with YAML frontmatter validated by [`schemas/rule.schema.json`](schemas/rule.schema.json). Rules are about structure and behaviour (hierarchy, spacing, density, states, copy, responsive, motion, accessibility), never a palette or brand, so they hold in any theme. Copy an existing rule such as [`rules/H-01.md`](rules/H-01.md).

- **Id:** the category prefix, a hyphen and the next free two-digit number: `H` hierarchy, `T` typography, `S` spacing and density, `C` colour, `K` components, `W` copy, `ST` states, `R` responsive, `M` motion, `A` accessibility (for example `ST-06`). The id equals the file name, is never renamed and is never reused.
- **Fields:** `title`; `statement` (one imperative line, at most 95 characters); `why` (one to three sentences); `check` (how to verify it, concrete and observable, ideally at 1440, 768 and 390 px; at most 95 characters); `anti_pattern` (the generic default it guards against); `sources` (real, checkable origins such as a `design.md` section, `docs/quality-gates.md`, a WCAG 2.2 success criterion or a [review dimension](docs/quality-gates.md#review-dimensions); no unsourced studies or statistics). A short prose body is optional.
- **Status:** leave `status: draft`, `reviewed_by: []` and `reviewed_at: null` (see [Community and reviewed](#community-and-reviewed)).
- **Specific, not a platitude:** if two reviewers could disagree on whether a screen passes the check, sharpen the check.

From `web/`, `npm run registry:build` validates the rule and regenerates [`rules/TESSLI.md`](rules/TESSLI.md) (the compact index agents install, kept under 8 KB) and `web/data/rules.json`; commit both. Rule pages list the items that apply them automatically, from the items' `notes.md`.

## Report a problem

- A listed source is broken, has moved, is wrong or should be archived: [**Report a source problem**](https://github.com/Online-Scope-Lab/tessli/issues/new?template=report-source.yml). Sources are never deleted silently; one that should go is archived with a reason.
- Anything else on the site or in the repository: [**Bug report**](https://github.com/Online-Scope-Lab/tessli/issues/new?template=bug.yml). Include the page, the width and the steps.

To fix it yourself, open a pull request that says `Closes #<issue number>`.

## Contribution rules

These are enforced in review.

- **Original work only.** No ports or "recreations" of paid kits such as Tailwind Plus or shadcnblocks; their licences forbid it.
- **Adapted open-source work must name its source and licence**, both in `notes.md` (`provenance: adapted`, `source_url`, `source_license`) and in the PR description.
- **No invented metrics, logos or testimonials.** No fake ratings, user counts, customer logos, quotes or verification claims, in demo content or anywhere else. Fictional content must look clearly fictional.
- **AI assistance is allowed but must be disclosed** (see below).
- **No new dependency without a one-line reason** in the PR description.
- **Sources are never deleted silently.** A source that should go is archived with a reason, so its ID, history and old links survive.

## AI assistance

Using an AI tool is fine. Say so in the pull request template's "AI assistance" section (or the design form's field): what it did, and that you reviewed and edited the result. A human must have actually checked the work: run it, read it against the rules and look at it in all three themes. Unreviewed AI-generated work is rejected, because human judgment is the point of Tessli.

## Sign-off (DCO)

Tessli uses the [Developer Certificate of Origin](https://developercertificate.org/) instead of a CLA. Sign off every commit:

```bash
git commit -s -m "feat: add two-tier pricing section"
```

This adds a `Signed-off-by: Your Name <you@example.com>` line, which certifies that you wrote the change or have the right to submit it under the project's licence. To sign off commits you already made on your branch, run `git rebase --signoff main` and force-push your branch (never `main`). Maintainers check sign-offs in review; there is no automated DCO check yet.

## Questions

Open an issue. For conduct concerns, follow the private reporting route in the [Code of Conduct](CODE_OF_CONDUCT.md#enforcement).
