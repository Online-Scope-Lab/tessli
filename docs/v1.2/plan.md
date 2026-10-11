# Tessli v1.2 — Product and build plan

Status: **Approved by the owner, 2026-10-11** (decisions in §14 resolved: direction approved; MIT with brand excluded; Saved and Boards removed; registry location settled by the Phase 2 spike; prune via `catalogue-triage-final.csv`; the keep-all-295 rule replaced by archive-with-reason)
Date: 2026-10-10
Replaces on approval: `docs/product-direction.md`, `docs/product-realignment-v3.md`, `PRD.md`, `build-slices.md`, `UI-INTELLIGENCE-ROADMAP.md`
Companions: [`repo-cleanup.md`](repo-cleanup.md) · [`catalogue-audit.md`](catalogue-audit.md) · [`research-notes.md`](research-notes.md) · [`catalogue-triage-draft.csv`](catalogue-triage-draft.csv) · [`suggested-additions-draft.csv`](suggested-additions-draft.csv) · [`suggest-source-issue-form-draft.yml`](suggest-source-issue-form-draft.yml)

---

## 1. Why v1.2 exists

Tessli v1–v3 built a careful website around 295 links, plus a large process layer: 70 slice-evidence docs, a 24-section rulebook, contracts for verification, media and auth. The process worked and the site is well made. But the core question never got answered: does Tessli make AI-built UI better?

Facts from the repository on 2026-10-10:

- 295 sources, 40 with real profiles, 0 human-verified.
- No component, section, page or taste rule exists anywhere in the repo.
- No human-scored evaluation has been completed. The one human review (OSS homepage) is still waiting for a reviewer. The `ui-plan` pilot was reviewed by an AI, ran on one narrow repair task, and was decided by a 7px overflow, not by design quality.
- There is no `LICENSE`, `CONTRIBUTING.md` or issue template, so the project can't take community contributions yet.

A directory of links can't give a model taste. A model gets better at UI from three things:

1. **Concrete rules** for hierarchy, spacing, density, type, states and copy, and the defaults to avoid.
2. **Good examples in the form it consumes:** real, installable code.
3. **A check loop:** render, look at it at real widths, review it against the rules, fix it.

v1.2 rebuilds Tessli around those three things and keeps the parts worth keeping: the brand, the hero, the curated directory and the machine-readable plumbing.

## 2. The product in one paragraph

**Tessli is an open-source UI library that explains itself.** Every component, section and page ships with working code, a live preview, and its reasoning: when to use it, when not to, the rules it follows, the generic AI default it replaces, and its states, responsive behaviour and accessibility. People browse it, copy it and learn from it. Coding agents install it with the standard shadcn CLI and read the same reasoning as structured data. A curated, community-maintained directory of the best external design sources sits beside the library. Everything is contributed and reviewed on GitHub.

Short positioning line for the site and README: **"UI with the reasoning attached."**

### What Tessli must not claim (yet)

Until the Taste Bench in §9 has a published result:

- don't say Tessli "gives AI taste" or "improves AI output";
- do say the library is reviewed, explained, open and installable.

The claim gets earned with evidence, or it gets dropped.

## 3. Why this can work, and what is crowded

Researched 2026-10-10. Sources and dates are in [`research-notes.md`](research-notes.md); re-verify before any public claim.

**Crowded. Don't compete here:**

- Plain component and block libraries. The shadcn registry directory alone lists more than 430 namespaces.
- Animated marketing sections (Magic UI, Aceternity and others).
- "Install via MCP" on its own. The shadcn MCP server is already generic.
- Generic "avoid AI slop" skills. Anthropic's `frontend-design` skill, Impeccable and Vercel's web-design guidelines already exist.

**Open gaps that Tessli can own:**

1. **Structured judgment per item, at section and page level.** When to use, when not, rules, failure modes, states, responsive behaviour, accessibility. One library (coss.com/ui) does a version of this, but only for its own primitives. Nobody does it for sections and pages, which is where AI-generated UI looks most generic.
2. **"Common AI default vs. this" contrasts.** Each item shows what a model usually produces for the same job and the specific rules that make the Tessli version better. That's how taste gets taught to people and to models, and nobody publishes it systematically.
3. **A public, reproducible evaluation.** No public controlled study shows that a component library plus rules improves the design quality of AI-built UI. Existing agent evals measure API correctness, not visual quality. Tessli can publish one either way.
4. **A cross-library guide.** The existing source directory already explains what other libraries are good for. It becomes the "where else to look" layer.

**Distribution:** use the ecosystem rather than inventing one.

- shadcn registry format.
- GitHub-registry install: `npx shadcn add online-scope-lab/tessli/<item>`, supported since June 2026.
- A listing in the shadcn registry directory as `@tessli`.
- A compact rules file agents can keep in context, a small MCP server, and `llms.txt`.

## 4. Brand: keep it, sharpen it

The brand is the strongest asset in the repo, and it stays:

- **Type:** Newsreader (display) and Instrument Sans (UI).
- **Colour:** the warm canvas, charcoal text and restrained orange.
- **Texture:** the grain.
- **The home hero**, including its composition and the arch-and-stairs artwork (`web/public/brand/tessli-hero-geometry.webp`).

One honest warning shapes the library design. Anthropic's public `frontend-design` skill (updated 2026-10-09) names "a warm cream background with a high-contrast serif display and a terracotta or warm-clay accent" as the most common AI-generated look. It also flags tracked-out uppercase eyebrows above every heading, 01/02/03 markers on things that aren't sequences, and "→" appended to every link. Tessli's site uses several of these: the cream-and-serif palette, an uppercase eyebrow over most headings, and arrows on cards and links.

The brand stays. A deliberate brand choice isn't a default, and the hero artwork is distinctive. But two rules follow:

1. **The site sharpens its tells.**
   - One eyebrow, in the hero only.
   - Numbered markers only for real sequences.
   - Arrows only where they mean "goes somewhere else".
   - Fix the token bugs that already make some headings fall back from Newsreader (see the cleanup plan, C6).
2. **The library must not encode the Tessli house style as "taste".**
   - Items use semantic theme tokens only (`--background`, `--foreground`, `--primary`, `--muted`, `--border`, `--radius`…) and take on the installing project's theme.
   - Previews switch between **three themes**: *Tessli* (warm, editorial), *Neutral* (cool, product-UI) and *Dark*.
   - If an item only looks good in the Tessli theme, it fails review. The taste being taught is structure (hierarchy, spacing, density, states, copy, restraint), not a palette.

## 5. Information architecture

```text
Primary nav:   Library | Sources | For AI            [Contribute] [GitHub]
Footer:        About · Rules · Contribute · Privacy · Terms · Content policy
```

| Route | Purpose |
|---|---|
| `/` | Hero (kept) with search across library and sources. Then: featured items as live previews (real Tessli UI as imagery), "anatomy of an item", a For AI install strip, a Sources teaser and a Contribute strip. |
| `/library` | Grid of items. Filter by kind (component / section / page) and category (hero, features, pricing, social proof, FAQ, CTA, settings, tables, dashboards, forms, auth, empty states, navigation, mobile). |
| `/library/[slug]` | Preview with theme switch (Tessli / Neutral / Dark) and width switch (1440 / 768 / 390), install command, code, **Use when / Avoid when**, **Rules**, **Common AI default vs. this**, states, accessibility notes, credits, review status. |
| `/preview/[slug]` | Bare, isolated render of one item. Used by the preview iframe, CI screenshots and agents. `noindex`. |
| `/rules` and `/rules/[id]` | The public rule set, for humans to read. Each rule links to the items that apply it. |
| `/resources` and `/resources/[slug]` | The pruned source directory. The nav says "Sources"; the URL stays `/resources` so existing links and machine paths keep working. |
| `/collections` | Kept as curated source guides, linked from Sources. Not in the primary nav. |
| `/for-ai` | shadcn install, rules file, MCP setup, `llms.txt`, what agents get, and what Tessli does not claim. |
| `/contribute` | Replaces `/submit` and `/suggest`. Three paths, all ending on GitHub (see §8). |
| `/about`, legal pages | Kept, with copy rewritten. |

**Removed in v1.2** (preserved in the archive tag):

- `/saved` and `/boards`;
- `/auth`;
- `/lab/resource-cards`;
- `/proofs/*`;
- the live-preview iframe pilot on source pages.

`/lab` becomes the internal design-system specimen for the site.

"Collect items into a kit, get one install command and one combined rules file" is a good later feature. It's recorded for v1.3, not built now.

## 6. The library

### 6.1 What an item is

```text
web/registry/items/<slug>/
  <slug>.tsx      the item (React + Tailwind v4, semantic tokens only)
  demo.tsx        the preview composition with realistic, clearly fictional content
  states.tsx      optional: loading / empty / error / success variants
  notes.md        taste notes: YAML frontmatter plus a short prose explanation
  default.png     optional: screenshot of the "common AI default" for the contrast
```

- Items build on **shadcn/ui primitives** (`registryDependencies: ["button", "input", …]`) instead of a new Tessli primitive set. Tessli competes on composition and judgment, not on yet another button.
- **To verify in the Phase 2 spike:**
  - placing the registry under `web/` versus the repo root;
  - GitHub-registry file paths;
  - whether a fresh Next.js and shadcn project can install an item with one command.

### 6.2 Taste-note schema (`notes.md` frontmatter)

```yaml
id: pricing-two-tier             # stable, never renamed
kind: section                    # component | section | page
category: pricing
title: Two-tier pricing with honest comparison
summary: One sentence on the job this item does.
use_when:
  - Product has 2–3 plans that differ on a few clear limits.
avoid_when:
  - More than 4 plans or usage-based pricing. Use a calculator pattern instead.
rules:                           # ids from /rules; each item applies 3–8 rules
  - H-02   # one primary action per surface
  - D-04   # comparison rows over feature-tick soup
ai_default: >
  Three identical rounded cards, middle one "Most popular" with a gradient
  border, 12 ticked features each, same CTA label on every card.
why_this_is_better:
  - Plans differ by the 3 limits buyers actually compare.
  - Only the recommended plan gets the primary button.
failures:                        # how people break this item when adapting it
  - Adding a fourth tier into the same grid.
states: [default]
responsive:
  desktop: Two columns, comparison rows aligned across plans.
  mobile: Stacked plans; comparison collapses into per-plan lists.
a11y:
  - Plan names are headings; prices are not conveyed by colour alone.
status: community                # community | reviewed
reviewed_by: []                  # GitHub handles, set only by maintainers
reviewed_at: null
contributors: [github-handle]
provenance: original             # original | adapted (with source URL + licence)
license: MIT
```

At build time the frontmatter is validated with a JSON Schema and written into the shadcn item's `meta.tessli`. Website, registry, MCP and rules file all read this one source.

### 6.3 Review levels

Two honest levels and nothing more:

- **Community:** merged, CI-checked, meets the contribution checklist.
- **Reviewed:** a maintainer checked it against the rules, all three themes and all widths, and signed it with their handle and a date.

There are no stars, ratings, download counts or "popular" badges.

### 6.4 Starter set (built by maintainers before inviting contributors)

A community library lives or dies by its first examples, because they set the bar. Launch with 12 reviewed items, all in areas where AI defaults are weakest. Together they cover the Taste Bench briefs in §9.

| # | Item | Kind | The common default it replaces |
|---|---|---|---|
| 1 | Product hero with real UI | section | Gradient blob, vague headline, two equal CTAs |
| 2 | Feature section, evidence-led | section | Three identical icon cards |
| 3 | Pricing, two or three tiers | section | Identical cards with a gradient "popular" badge |
| 4 | Honest social proof | section | Invented logos, metrics and testimonials |
| 5 | FAQ | section | Accordion with filler questions |
| 6 | Closing CTA and footer | section | Link-farm footer, repeated CTA |
| 7 | Settings: account and danger zone | page | Delete button with no confirmation or consequences |
| 8 | Data table with filters and states | component | Table with no empty, loading or error states |
| 9 | Dashboard overview | page | Generic four-KPI grid plus a chart |
| 10 | Empty state | component | Illustration and "Nothing here yet" |
| 11 | Sign-in and sign-up with validation | page | Errors only on submit, colour-only feedback |
| 12 | Mobile list to detail | page | Shrunken desktop layout |

### 6.5 Rules

- **About 30–40 rules at launch**, each with an id, a one-line statement, why it matters, how to check it, and linked items. Categories: hierarchy, typography, spacing and density, colour, components, copy, states, responsive, motion, accessibility.
- **Seeded from existing work:**
  - the anti-pattern lists in `design.md` §13 and `AGENTS.md` §13;
  - `docs/quality-gates.md` (touch targets, live regions, the 320px gate);
  - the 12 review dimensions;
  - the pattern-card format in `docs/research/design-context-engine-strategy-report.md` §7.3.
- **`rules/TESSLI.md`** is a compressed index of every rule, kept under about 8 KB so an agent can hold it in context. It's published as a shadcn `registry:file` item, so `npx shadcn add online-scope-lab/tessli/rules` drops it into a project. Vercel published an eval (2026-01-27) where a compact docs index in `AGENTS.md` beat an on-demand skill. That's API correctness, not taste, so the Taste Bench is what decides whether this helps.

### 6.6 Agent interfaces

Same data, three doors:

1. **shadcn registry:** a `registry.json` generated at the repo root, with `meta.tessli` taste notes on every item. Listed in the shadcn directory as `@tessli`.
2. **Tessli MCP (local stdio)**, at most 5 read-only tools:
   - `search_items(brief)`
   - `get_item(slug)`: code and notes
   - `get_rules(topic | brief)`
   - `find_sources(task)`
   - `get_source(slug)`

   Reuse the existing server, tool catalogue and representation helpers.
3. **Static files:**
   - `llms.txt` (rewritten);
   - `/library/[slug]/item.{json,md}` and the existing `/resources/[slug]/profile.{json,md}`;
   - `rules/TESSLI.md`;
   - an Agent Skill (`skills/tessli/SKILL.md`): read the rules, search the items, install, then verify at 1440/768/390 and check the rules.

**Hosted remote MCP stays off in v1.2.** The current preflight (`web/lib/mcp-http.ts`) rejects requests that have no `Origin` header, which is what CLI agents send, and its rate limit is per instance. Fix both, and decide on authentication, before turning it on.

## 7. Sources (the directory)

### 7.1 What the audit found (2026-10-10)

The full audit is in [`catalogue-audit.md`](catalogue-audit.md). The essentials:

- **Duplicates and redirects.** At least seven sources now redirect to another brand: UI Sources, Design Vault and Scrnshts go to ScreensDesign; Screenlane and UI Movement go to Page Flows; inspo.page goes to Details.so; Origin UI is now coss. UX Bites duplicates Built for Mars, and the "SaaS Examples" domain is now a personal site.
- **Broken links.** Three returned 404 in the repo's own August fetch (Web Interactions Gallery, React Aria, Audi UI) and three were unreachable.
- **Off-scope entries.** 24 aren't design references at all: app builders (Lovable, Bolt, Replit…), ad libraries, stock marketplaces, and directories of other directories (DesignIndex, TOOOLS.design).
- **Weak descriptions.** The median is 6 words, and 47 pairs are near-identical.
- **Data problems.**
  - `status` is hard-coded to "active" for every row.
  - `subscriptionRequired` just copies `access`.
  - `usefulFor` and `tags` are empty everywhere.
  - "Colour" and "accessibility" share one category.

**First-pass triage**

Scoring: browse usefulness (counted double), uniqueness, alive, free depth and quality.

| | KEEP | MAYBE | CUT |
|---|---|---|---|
| All 295 | 106 | 94 | 95 |

- [`catalogue-triage-draft.csv`](catalogue-triage-draft.csv) has a score, reason and confidence for every row. Confidence is high for 173 rows, medium for 81 and low for 41.
- **It's an AI first pass, not a decision.** The owner decides, peer group by peer group, starting with the MAYBEs.
- [`suggested-additions-draft.csv`](suggested-additions-draft.csv) lists 71 candidate platforms with a confidence rating. Examples: Component Gallery, Radix Colors, the ARIA Authoring Practices Guide, Utopia, Laws of UX and Ark UI. Add only what a maintainer has opened and checked.

### 7.2 Rules for pruning

- **Archive instead of deleting.** A cut source keeps its row, ID and history, with `status: archived` and `archived_reason`. The public site shows only active sources. This keeps provenance and avoids breaking old links: an archived source page says it was archived and points to the replacement.
- **Freeze IDs first.** Today the ID is a hash of the URL (`web/scripts/catalogue-lib.mjs`), so fixing a URL (Origin UI → coss, React Aria, v0) silently changes the ID and breaks collections and profiles. Store IDs explicitly before changing anything else.
- **Remove the hard-coded counts.** The generator expects exactly 295 rows, fixed per-category counts and 11 categories. "295" also appears in the About, 404 and Lab pages.
- **Collections:** four members are CUT and 16 are MAYBE. Fix collections in the same PR that archives their members.
- **Target:** about 100–150 active sources, each one something a curator would defend.

### 7.3 New data shape

- **One file per source:** `sources/<slug>.yml`, so a community PR touches exactly one small file and PRs don't conflict. The generator still builds `web/data/catalogue.json` deterministically and offline.
- **Required fields:**
  - `id` (frozen), `slug`, `name`, `url`;
  - `category`, `kind`, `access` (free / open-source / freemium / paid);
  - `summary` (40–200 characters, saying specifically what you'll find);
  - `status` (active / needs-review / archived);
  - `added_at`, `added_via` (curator / community), `last_checked`.
- **Optional fields:**
  - `frameworks`, `license`;
  - `best_for` (at most 3), `limitations` (at most 2);
  - `replaced_by`, `archived_reason`, `submission_issue`.
- **Drop:** `subscriptionRequired`, `usefulFor`, `tags`, `previewSource`, and the stored `domain` (work it out at build time). Drop the Verified / evidence / governance machinery from the public UI. The 40 existing profiles keep their best-for and limitations text; the rest stays in the archive tag.
- **Revised categories:**
  - Website inspiration;
  - Sections and UI patterns (new);
  - Product UI and flows;
  - Landing, ecommerce and email;
  - UI components;
  - Design systems;
  - Motion and 3D;
  - Typography;
  - Colour (split out);
  - Accessibility (split out);
  - Icons;
  - Illustrations and assets;
  - Design and build tools.

### 7.4 Previews and link health

- **Previews:** freeze the 165 approved media records already in the repo; there's no new screenshot pipeline. When a source has no approved preview, show a favicon or a letter mark. Never screenshot or mirror third-party sites for the directory.
- **Link health:** a weekly `lychee` GitHub Action opens one issue that lists broken links and sets `status: needs-review`. It never archives or deletes on its own. (The planning session couldn't run a live link check because its network proxy blocked most hosts. The first lychee run is the real baseline.)
- **The suggest-a-source form** is drafted in [`suggest-source-issue-form-draft.yml`](suggest-source-issue-form-draft.yml).
  - Required: name, URL, category, kind and access; what you'll find there; why it belongs, naming 1–3 peers already in Tessli; and an affiliation disclosure.
  - Three required checks: not a duplicate, opens without login, no tracking parameters.
  - A small Action normalises the URL, checks for duplicates and fetches the link once. It reads the issue body through an environment variable, never by putting it into a shell command. It posts one summary comment and never auto-accepts.

## 8. Contribution model (GitHub is the backend)

No accounts, database or in-site forms in v1.2. Every path ends in a GitHub issue or PR, and GitHub's own login and moderation do the rest.

| Who | Path | Lands as |
|---|---|---|
| Anyone with a good link | `/contribute` → **Suggest a source** → pre-filled GitHub issue form (URL, name, category, access, one-line description, why it's useful, affiliation disclosure, "I'm a human submitter") | Issue labelled `source:suggestion`; a maintainer or contributor turns it into a one-file PR |
| A designer | **Submit a design** → issue form (screenshot or Figma link, the problem it solves, what the common default gets wrong, rights confirmation) | Issue labelled `design:needs-implementation`, which becomes a good first issue for developers |
| A developer | **Contribute an item** → `CONTRIBUTING.md` → copy `web/registry/_template/` → PR | PR checked by CI, then reviewed by maintainers |
| Anyone | **Report a broken link or a problem** → issue form | Issue |

The designer path turns into developer work: designers submit, developers implement, and both are credited on the item page.

### PR checks for items (CI)

- Schema validation of `notes.md`, then typecheck, lint and build.
- Registry build and `shadcn registry validate`.
- Playwright renders `/preview/<slug>` at 1440, 1024, 768, 390 and 320 in all three themes.
  - No horizontal overflow and no console errors.
  - Screenshots are uploaded as a PR artifact for the reviewer.
- axe-core with WCAG 2.2 AA tags.

### Contribution rules (short, enforced in review)

- **Original work only.** No ports or "recreations" of paid kits: Tailwind Plus and shadcnblocks licences forbid it.
- **Adapted open-source work** must name its source and licence.
- **AI assistance is allowed but must be disclosed**, and a human must have actually reviewed the result. Unreviewed AI-generated items are rejected, because the human judgment is the product.
- **No invented metrics, logos or testimonials** in demo content. Fictional content must look clearly fictional.
- **Semantic tokens only.** No hard-coded brand colours.
- **Sign off each commit with the DCO** (`git commit -s`) rather than signing a CLA.

### Licensing (decide in Phase 0)

- Code and taste notes: **MIT**.
- The Tessli name, wordmark and hero artwork are **excluded** from MIT and covered in a short `TRADEMARKS.md`.
- **Confirm where the hero artwork came from and who holds its rights before publishing the licence.** The asset manifest calls it a "user-authorized" reference but doesn't state its origin.

## 9. Taste Bench: earning the claim

The only honest way to say "Tessli improves AI-built UI" is to measure it.

- **Design:**
  - 6 build briefs, adapted from `evaluation/task-01…05` plus one new brief;
  - 2 conditions: **baseline** vs. **Tessli** (rules file plus registry access);
  - 3 runs per condition per brief: **36 builds, 18 blinded pairs**.
- **Freeze** model, tools and prompts per run (reuse `validate_pair.py`, `record_run.py` and `randomize_blind_labels.py` from the archive).
- **Review:** at least **3 independent human reviewers** score each pair blind on the 12 review dimensions, with a written note for each score. Report agreement between reviewers.
- **Publish the protocol before running**, and the results, whatever they show, at `/bench`.
- **Decision rule:** if Tessli doesn't clearly win, change the rules and items and run again, or drop the "taste" claim and stay a well-made explained library. Either result is useful, and either is more than any competitor publishes.
- **Content rule:** the starter items cover the same kinds of screens as the briefs but are never copies of the briefs.

## 10. Process (replaces the slice bureaucracy)

- **AGENTS.md:** one page. Read it, one focused PR per change, run `npm run check`, include screenshots for visible changes, no fake data, follow `design.md`, use the item checklist for library work.
- **No slice-evidence documents.** The PR description and the diff are the record.
- **One CI workflow** (`ci.yml`) plus one scheduled `links.yml`.
- **Decisions** live in a short `docs/decisions.md`, one dated paragraph per decision.
- **The owner is the final reviewer** for the starter set and the rules. Agents can draft; the owner approves taste.

## 11. Phases

Durations are rough and assume the current pace: one owner plus coding agents.

| Phase | Goal | Done when |
|---|---|---|
| **0. Decide and clean** (week 1) | Approve this plan; carry out `repo-cleanup.md` C0–C7 | Archive tag pushed; LICENSE, CONTRIBUTING, Code of Conduct, issue forms and PR template merged; one-page AGENTS.md; one green CI workflow; token bugs fixed |
| **1. Sources pruned** (weeks 1–2, in parallel) | Freeze IDs; remove hard-coded counts; owner reviews the triage; archive cut rows; migrate to `sources/*.yml`; weekly link check | About 100–150 sources, each defended; suggest-a-source form live |
| **2. Library foundation** (weeks 2–3) | Item schema, template, `/preview` route, three themes, registry build, `/library` pages, item CI | 3 items working end to end, including install into a fresh Next.js + shadcn app with one command |
| **3. Starter set and rules** (weeks 3–6) | 12 reviewed items, 30–40 rules, `TESSLI.md`, MCP tools, rewritten For AI page and home page (hero kept) | Owner signs off every starter item in all 3 themes and at 5 widths |
| **4. Open to contributors** (weeks 6–7) | `/contribute` live; good first issues seeded (design submissions to implement, third themes, states); listed in the shadcn directory; announced | First external PR merged |
| **5. Taste Bench** (weeks 6–9, in parallel with 4) | Run the study, publish it | Results page live; the claim updated to match the evidence |

## 12. What v1.2 deliberately does not build

- Accounts, auth, Supabase, cloud saves, Boards, payments, teams.
- Screenshots or mirrors of third-party sites, or any new media pipeline.
- A Tessli primitive component set (shadcn/ui already covers it).
- Mass AI-generated items or pattern pages.
- Hosted remote MCP, until the Origin, rate-limit and auth fixes land.
- Ratings, popularity, download counts or any vanity number.
- In-site submission forms with a backend. GitHub issues and PRs are enough until volume proves otherwise.

## 13. How we'll know it's working

No vanity metrics. Check these 60 days after Phase 4:

- 12 or more **Reviewed** items, plus whatever community items pass CI.
- At least 5 **external contributors** with merged PRs (items, sources or design submissions implemented).
- Fewer than 2% broken source links on the weekly check.
- A published Taste Bench result, positive or not.
- The owner can show a fresh project where an agent with Tessli produced a better screen, with blinded human scores to back it.

## 14. Decisions needed from the owner

1. Approve this direction (library first, sources second, GitHub as backend).
2. Licence: MIT for code and notes, with brand assets excluded. Confirm the hero artwork's origin.
3. Remove Saved and Boards in v1.2 (recommended) or keep Saved.
4. Registry location: `web/registry/` (recommended, simplest with Next.js) or repo root, settled in the Phase 2 spike.
5. Who reviews the starter set with you: at least one other designer you trust.
6. Prune target for sources (recommended about 100–150, archived rather than deleted) and who signs off the final list.
7. Lift the "preserve all 295 rows" rule in `AGENTS.md` §16 and `docs/product-direction.md` §9, replacing it with "never silently drop a row; archive with a reason". This plan depends on it.
