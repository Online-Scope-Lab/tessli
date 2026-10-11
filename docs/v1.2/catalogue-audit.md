# Catalogue audit: input for v1.2 pruning

Date: 2026-10-10
Status: **AI first pass.** The decisions to apply are in [`catalogue-triage-final.csv`](catalogue-triage-final.csv) (approved 2026-10-11).
Data: [`catalogue-triage-draft.csv`](catalogue-triage-draft.csv) (all 295 rows), [`suggested-additions-draft.csv`](suggested-additions-draft.csv) (71 candidates)

## 1. Current shape

- **Source file:** `lib_data/design-resource-library-295.csv`, 6 columns, all filled: Category, Website, URL, Access, Subscription required?, Website is for. It's generated into `web/data/catalogue.json`.
- **Categories (11):**

  | Category | Sources |
  |---|---|
  | ui-libraries | 45 |
  | website-inspiration | 40 |
  | icons | 30 |
  | product-ui-ux | 25 |
  | landing-marketing | 25 |
  | design-systems | 25 |
  | visual-assets | 25 |
  | motion-3d | 20 |
  | typography | 20 |
  | color-accessibility | 20 |
  | design-tools-ai | 20 |

- **Access:** free 130, open-source 81, freemium 75, paid 8, free-trial 1.
- **Coverage:**
  - Previews: 131 (44%).
  - Favicons: 112 (38%).
  - Intelligence profiles: 40. Of those, 20 have their own file and 20 come from batches 1.3/1.4.
  - Human-verified: 0.
- **Fields that carry no information:**
  - `status` is "active" for all 295, because the generator hard-codes it.
  - `subscriptionRequired` copies `access` one-to-one.
  - `usefulFor` and `tags` are empty everywhere.
  - `previewSource` only ever has one value.

## 2. Structural blockers to fix before pruning

1. **The rules forbid it.** `AGENTS.md` §16 and `docs/product-direction.md` §9 require keeping all 295 rows. Replace that with "never silently drop; archive with a reason".
2. **The generator hard-codes the counts.** `web/scripts/catalogue-lib.mjs` expects exactly 295 rows (around line 635), fixed per-category counts (lines 28–119) and fixed access counts, and the schema requires exactly 11 categories. "295" also appears in `web/app/about/page.tsx`, `web/app/not-found.tsx` and `web/app/lab/page.tsx`.
3. **IDs are a hash of the URL** (the first 12 hex characters of a sha256, in `catalogue-lib.mjs`). Fixing a URL changes the ID. Freeze the IDs explicitly first.
4. **Collections:** four collection members are CUT (SaaS Examples, SaaS Websites, Float UI, Open Color) and 16 are MAYBE.

## 3. Quality findings

- **Redirected to another brand or product:** UI Sources, Design Vault and Scrnshts → ScreensDesign; Screenlane and UI Movement → Page Flows (already listed); inspo.page → Details.so; Origin UI → coss.
- **Domain now hosts something unrelated:** SaaS Examples (divbyzero.com).
- **HTTP 404:** Web Interactions Gallery, React Aria (the URL needs fixing; the product is alive), Audi UI.
- **HTTP 503:** Mailchimp Pattern Library.
- **Unreachable:** Nordic Design Gallery, Commerce Cream, GoodCart.
- **Duplicate:** UX Bites, folded into Built for Mars.
- **Overlap clusters:** these need a "keep the best one or two" decision.
  - Four awards galleries.
  - Six SaaS landing galleries.
  - Six email galleries.
  - Eight animated-React libraries.
  - Minimal Gallery, Siiimple and Dead Simple Sites.
  - Dark Mode Design and Dark Design.
  - Feather and Lucide (Lucide is the maintained fork).
- **Off-scope (24):**
  - Ad and marketing libraries: Marketing Examples, Ads of the World, Adfolio, Foreplay, Pushkeen.
  - App builders and IDEs: Lovable, Bolt, Replit, Plasmic, Builder.io, Anima, Locofy, TeleportHQ, Dora.
  - Stock marketplaces: Mixkit, Envato Elements, Creative Market.
  - Directories of directories: DesignIndex, TOOOLS.design, Design Systems Repo.
  - Others: p5.js, Collect UI.
- **Likely unmaintained (low confidence, so check each):** Hover.css, AOS, Eva Icons, Feather, Fontjoy, Evergreen, Base Web, Grommet, Iconshock, Pttrns, Motionity, Khroma, useAnimations.
- **Weak descriptions:** the median is 6 words; 121 have 5 words or fewer; 47 pairs are near-identical.

## 4. Link health

A live check wasn't possible from the planning environment, whose egress proxy refused most catalogue hosts. These figures come from the repo's own dated fetch evidence (`lib_data/resource-media-coverage.json`, 2026-08-02/03):

| Result | Count |
|---|---|
| Reached | 222 |
| Cross-domain redirect | 7 |
| 404 | 3 |
| 503 | 1 |
| Unreachable | 3 |
| Bot wall (403, not a failure) | 12 |
| Rate-limited (429) | 3 |
| Blocked by policy | 15 |
| Never checked | 27 (design-tools rows) |

The first scheduled `lychee` run in v1.2 gives the real baseline.

## 5. Triage rubric

Each source gets five scores from 0 to 3:

| Score | Measures |
|---|---|
| **B** | Browse usefulness (counted twice) |
| **U** | Uniqueness against peers in the catalogue |
| **A** | Alive and maintained |
| **F** | Free depth |
| **Q** | Curation and example quality |

Total = 2B + U + A + F + Q, out of 18.

- **CUT:** a duplicate (U = 0), dead or redirected (A = 0), off-scope (B ≤ 1), or a total of 11 or less.
- **KEEP:** a total of 15 or more, with B ≥ 2 and A ≥ 2.
- **MAYBE:** everything else. A human decides within the peer group.

**Result:**

| KEEP | MAYBE | CUT |
|---|---|---|
| 106 | 94 | 95 |

Confidence in the scores is high for 173 rows, medium for 81 and low for 41.

| Category | KEEP | MAYBE | CUT |
|---|---|---|---|
| website-inspiration | 9 | 18 | 13 |
| product-ui-ux | 8 | 3 | 14 |
| landing-marketing | 5 | 11 | 9 |
| ui-libraries | 22 | 18 | 5 |
| design-systems | 15 | 6 | 4 |
| motion-3d | 10 | 5 | 5 |
| typography | 9 | 5 | 6 |
| color-accessibility | 8 | 8 | 4 |
| icons | 13 | 7 | 10 |
| visual-assets | 3 | 8 | 14 |
| design-tools-ai | 4 | 5 | 11 |

**Strongest KEEPs:** Godly, SiteInspire, Mobbin, Built for Mars, Really Good Emails, shadcn/ui, Material Design 3, Apple HIG, GOV.UK Design System, Motion, GSAP, Three.js, Fontshare, Fonts In Use, Realtime Colors, Lucide, Phosphor, Iconify, unDraw, Figma Community.

**Fix the URL rather than cutting:**
- Origin UI → coss.
- React Aria: the current URL returns 404.
- v0: the URL needs updating.
- Polaris: confirm the URL.

## 6. How to review

1. Sort the CSV by `category`, then `overlap_group`.
2. Decide each MAYBE inside its peer group. Read the `reason` and `repo_fetch_evidence` columns.
3. Open every KEEP whose confidence is `low` or `med` before accepting it.
4. Accept additions only after opening the site yourself.
5. Record decisions in one PR that archives (not deletes) the cut rows, fixes their collections and regenerates the catalogue.
