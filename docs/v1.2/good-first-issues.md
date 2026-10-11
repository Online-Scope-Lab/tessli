# Good first issues (drafts)

Eight issues to open when Tessli invites contributors (plan §11, Phase 4). Each one is real open work at the commit that adds this file, scoped so a newcomer can finish it in one pull request. A maintainer creates them on GitHub; this file is only the draft.

- **Labels.** `good first issue`, `help wanted`, `documentation` and `enhancement` are GitHub's defaults. `source:problem`, `source:suggestion` and `design:needs-implementation` are the issue forms' labels; create them in the repository settings before using them (see [`docs/decisions.md`](../decisions.md)).
- **Bodies** are written for GitHub, so every repository link in them is absolute. `web/tests/contribution-links.test.mjs` checks that each one still resolves.
- **When one is done**, delete its draft here or mark it opened with the issue number.

---

## 1. Confirm the four sources waiting for review

**Labels:** `good first issue`, `help wanted`, `source:problem`

~~~~markdown
Four sources are listed with `status: needs-review` because their URL changed and nobody has opened the new one yet. The session that applied the triage could not reach any of these hosts, so it recorded each one as unverified ([decision log](https://github.com/Online-Scope-Lab/tessli/blob/main/docs/decisions.md)).

| Source | File | URL to check | What changed |
| --- | --- | --- | --- |
| coss UI | [`sources/origin-ui.yml`](https://github.com/Online-Scope-Lab/tessli/blob/main/sources/origin-ui.yml) | https://coss.com/ui | Origin UI was renamed coss UI |
| React Aria | [`sources/react-aria.yml`](https://github.com/Online-Scope-Lab/tessli/blob/main/sources/react-aria.yml) | https://react-aria.adobe.com | The old docs URL returned 404 |
| v0 | [`sources/v0.yml`](https://github.com/Online-Scope-Lab/tessli/blob/main/sources/v0.yml) | https://v0.app | v0.dev moved to v0.app |
| Shopify Polaris | [`sources/shopify-polaris.yml`](https://github.com/Online-Scope-Lab/tessli/blob/main/sources/shopify-polaris.yml) | https://polaris.shopify.com | Polaris moved toward web components in 2025; confirm the canonical URL |

**What to do, per source:** open the URL in a browser.

- It is the right, working page: set `status: active` and `last_checked:` to today's date (`YYYY-MM-DD`). Fix `name` or `summary` if they no longer describe what you see.
- It moved: change `url` to the page someone should land on (no tracking parameters), then as above. Never change `id` or `slug`.
- It is gone or no longer a design reference: set `status: archived` with a one-sentence `archived_reason`.

Say in the PR what you saw at each URL and on which date.

**Files:** the four `sources/*.yml` files above, plus `web/data/catalogue.json` and `web/data/catalogue-validation.json` regenerated.

**Acceptance checks**

- [ ] None of the four files says `status: needs-review`; each has a `last_checked` date.
- [ ] `id` and `slug` are unchanged in all four.
- [ ] `npm run catalogue:check` and `npm test` pass (from `web/`).

**How to verify:** in `web/`, run `npm run catalogue:generate`, then `npm run catalogue:check`. Run `npm run dev` and open `/resources/origin-ui`, `/resources/react-aria`, `/resources/v0` and `/resources/shopify-polaris`: each shows the URL you checked. Step by step: [Add a source](https://github.com/Online-Scope-Lab/tessli/blob/main/CONTRIBUTING.md#add-a-source).
~~~~

---

## 2. Rewrite the eight short summaries in Icons

**Labels:** `good first issue`, `documentation`

~~~~markdown
A source's `summary` should say specifically what someone will find there, in 40–200 characters ([Add a source](https://github.com/Online-Scope-Lab/tessli/blob/main/CONTRIBUTING.md#add-a-source)). Rows migrated from the old catalogue kept their original text, and in the Icons category eight are under 40 characters and say little more than "icon library".

| Source | File | Current summary (characters) |
| --- | --- | --- |
| Material Symbols | [`sources/material-symbols.yml`](https://github.com/Online-Scope-Lab/tessli/blob/main/sources/material-symbols.yml) | Google's variable icon family (29) |
| Tabler Icons | [`sources/tabler-icons.yml`](https://github.com/Online-Scope-Lab/tessli/blob/main/sources/tabler-icons.yml) | Large pixel-perfect SVG icon library (36) |
| Phosphor Icons | [`sources/phosphor-icons.yml`](https://github.com/Online-Scope-Lab/tessli/blob/main/sources/phosphor-icons.yml) | Flexible multi-weight icon family (33) |
| Iconoir | [`sources/iconoir.yml`](https://github.com/Online-Scope-Lab/tessli/blob/main/sources/iconoir.yml) | Large open-source SVG icon library (34) |
| Remix Icon | [`sources/remix-icon.yml`](https://github.com/Online-Scope-Lab/tessli/blob/main/sources/remix-icon.yml) | Neutral-style system icon set (29) |
| MingCute | [`sources/mingcute.yml`](https://github.com/Online-Scope-Lab/tessli/blob/main/sources/mingcute.yml) | Simple and polished open-source icons (37) |
| Noun Project | [`sources/noun-project.yml`](https://github.com/Online-Scope-Lab/tessli/blob/main/sources/noun-project.yml) | Large community-created icon library (36) |
| Lordicon | [`sources/lordicon.yml`](https://github.com/Online-Scope-Lab/tessli/blob/main/sources/lordicon.yml) | Animated and static icon library (32) |

Open each site and write what a designer or developer actually gets: the style, the formats (SVG, icon font, React package, Figma), the licence model or anything that sets it apart from the other icon sets listed. No marketing adjectives ("beautiful", "pixel-perfect"). A number (how many icons, how many weights) only if the source's own site states it on the day you check; then set `last_checked` to that date.

**Files:** the eight `sources/*.yml` files above, plus the regenerated `web/data/catalogue.json` and `web/data/catalogue-validation.json`.

**Acceptance checks**

- [ ] Every non-archived Icons source has a summary of 40–200 characters.
- [ ] No summary contains a number or claim that isn't on the source's own site.
- [ ] Only `summary` (and `last_checked` where you checked a fact) changed; `id` and `slug` are untouched.
- [ ] `npm run catalogue:check` passes.

**How to verify:** after `npm run catalogue:generate` in `web/`, this prints any Icons summary still outside 40–200 characters (it should print nothing):

```bash
node -e 'const c=require("./data/catalogue.json");for(const r of c.resources)if(r.category==="icons"&&r.status!=="archived"&&(r.description.length<40||r.description.length>200))console.log(r.slug,r.description.length)'
```

Then open `/resources?category=icons` with `npm run dev` and read the cards.
~~~~

---

## 3. Give each Motion and 3D source its real `kind`

**Labels:** `good first issue`, `help wanted`

~~~~markdown
`kind` was filled in per category during the migration, not per source: every Motion and 3D source is `kind: library` ([decision log](https://github.com/Online-Scope-Lab/tessli/blob/main/docs/decisions.md)). Several of them are apps you design in, not code you install. `kind` is in `web/data/catalogue.json` and agents read it; the site doesn't show it yet, so getting it right now keeps a future filter honest.

The kinds ([Add a source](https://github.com/Online-Scope-Lab/tessli/blob/main/CONTRIBUTING.md#add-a-source)): `gallery` (browse curated examples), `library` (install code), `design-system`, `tool` (use an app to make or check something), `asset` (download fonts, icons or images), `reference` (read guidance).

The 11 listed Motion and 3D sources: [`motion`](https://github.com/Online-Scope-Lab/tessli/blob/main/sources/motion.yml), [`gsap`](https://github.com/Online-Scope-Lab/tessli/blob/main/sources/gsap.yml), [`lottiefiles`](https://github.com/Online-Scope-Lab/tessli/blob/main/sources/lottiefiles.yml), [`rive`](https://github.com/Online-Scope-Lab/tessli/blob/main/sources/rive.yml), [`spline`](https://github.com/Online-Scope-Lab/tessli/blob/main/sources/spline.yml), [`three-js`](https://github.com/Online-Scope-Lab/tessli/blob/main/sources/three-js.yml), [`react-three-fiber`](https://github.com/Online-Scope-Lab/tessli/blob/main/sources/react-three-fiber.yml), [`anime-js`](https://github.com/Online-Scope-Lab/tessli/blob/main/sources/anime-js.yml), [`lenis`](https://github.com/Online-Scope-Lab/tessli/blob/main/sources/lenis.yml), [`pixijs`](https://github.com/Online-Scope-Lab/tessli/blob/main/sources/pixijs.yml) and [`unicorn-studio`](https://github.com/Online-Scope-Lab/tessli/blob/main/sources/unicorn-studio.yml).

Open each one and decide what someone mainly does there. A product that is both an editor and a runtime gets the kind of its main use; say which in the PR. Leave the 9 archived Motion and 3D sources alone.

**Files:** the `sources/*.yml` files whose `kind` changes, plus the regenerated `web/data/catalogue.json` and `web/data/catalogue-validation.json`.

**Acceptance checks**

- [ ] The PR description has a table: slug, kind, one-line reason, for all 11.
- [ ] Only `kind` changed in each file.
- [ ] `npm run catalogue:check` and `npm test` pass.

**How to verify:** `npm run catalogue:generate`, then `git diff --stat` shows only the files you meant plus the two generated ones.
~~~~

---

## 4. Propose how to split "Color, gradients, and accessibility"

**Labels:** `good first issue`, `enhancement`

~~~~markdown
The plan splits the shared colour-and-accessibility category into **Colour** and **Accessibility** ([plan §7.3](https://github.com/Online-Scope-Lab/tessli/blob/main/docs/v1.2/plan.md#73-new-data-shape)). Before anyone changes code, we need an agreed mapping. This issue is the proposal only: no pull request yet.

The category holds 20 source files (`category: color-accessibility`): 11 listed and 9 archived.

- Listed: `coolors`, `color-hunt`, `adobe-color`, `happy-hues`, `realtime-colors`, `leonardo`, `inclusivecolors`, `who-can-use`, `webaim-contrast-checker`, `wave`, `polypane`.
- Archived: `huemint`, `khroma`, `grabient`, `colorbox`, `open-color`, `atmos`, `stark`, `axe-devtools`, `accessibility-insights`.

**Please comment with:**

1. A table of all 20: slug, proposed category (Colour or Accessibility), one-line reason. Contrast tools such as `leonardo` or `who-can-use` sit on the line; say which way and why. Archived rows get a category too, so their pages stay consistent.
2. The new ids, labels, short labels and one-sentence descriptions, in the style of `CATEGORY_DEFINITIONS` in [`web/scripts/catalogue-lib.mjs`](https://github.com/Online-Scope-Lab/tessli/blob/main/web/scripts/catalogue-lib.mjs).
3. Anything that would end up nearly empty (for example, Accessibility with only two or three listed sources) and what you would do about it.

For whoever implements it later, a split touches: `CATEGORY_DEFINITIONS`; the 20 source files; the Category dropdown in [`.github/ISSUE_TEMPLATE/suggest-source.yml`](https://github.com/Online-Scope-Lab/tessli/blob/main/.github/ISSUE_TEMPLATE/suggest-source.yml) (a test requires it to match the categories); the category-to-profile mapping in [`web/lib/source-profiles.ts`](https://github.com/Online-Scope-Lab/tessli/blob/main/web/lib/source-profiles.ts) and [`schemas/source-profile.schema.json`](https://github.com/Online-Scope-Lab/tessli/blob/main/schemas/source-profile.schema.json); and the "Accessible colour tools" collection in [`lib_data/tessli-launch-collections.json`](https://github.com/Online-Scope-Lab/tessli/blob/main/lib_data/tessli-launch-collections.json), which [`web/tests/collections-data.test.mjs`](https://github.com/Online-Scope-Lab/tessli/blob/main/web/tests/collections-data.test.mjs) ties to this category.

**Acceptance checks**

- [ ] A comment on this issue covers all 20 sources, the new category definitions and any thin category.
- [ ] A maintainer has agreed the mapping, and a follow-up implementation issue is opened from it.

**How to verify:** count the rows in your table (20), and compare them with `grep -l "category: color-accessibility" sources/*.yml`.
~~~~

---

## 5. Share one Chrome DevTools helper across the browser tests

**Labels:** `good first issue`, `help wanted`

~~~~markdown
The nine browser tests in `web/tests/*-browser.mjs` (about 3,000 lines) each carry their own copy of the same Chrome DevTools Protocol plumbing: `delay`, `findPageTarget`, the WebSocket setup and `send`, `evaluate`, `evaluateSettled`, `waitFor` and `markDocumentStale`, and most of them `navigate`, `setViewport` or `screenshot`. A fix to one copy doesn't reach the others.

Move the shared helpers into one module, for example `web/tests/lib/cdp.mjs`, and import it from all nine files:

[`smoke-browser.mjs`](https://github.com/Online-Scope-Lab/tessli/blob/main/web/tests/smoke-browser.mjs), [`explore-search-browser.mjs`](https://github.com/Online-Scope-Lab/tessli/blob/main/web/tests/explore-search-browser.mjs), [`home-browser.mjs`](https://github.com/Online-Scope-Lab/tessli/blob/main/web/tests/home-browser.mjs), [`resource-card-browser.mjs`](https://github.com/Online-Scope-Lab/tessli/blob/main/web/tests/resource-card-browser.mjs), [`card-surface-parity-browser.mjs`](https://github.com/Online-Scope-Lab/tessli/blob/main/web/tests/card-surface-parity-browser.mjs), [`collections-browser.mjs`](https://github.com/Online-Scope-Lab/tessli/blob/main/web/tests/collections-browser.mjs), [`browse-pages-browser.mjs`](https://github.com/Online-Scope-Lab/tessli/blob/main/web/tests/browse-pages-browser.mjs), [`global-navigation-browser.mjs`](https://github.com/Online-Scope-Lab/tessli/blob/main/web/tests/global-navigation-browser.mjs) and [`for-ai-browser.mjs`](https://github.com/Online-Scope-Lab/tessli/blob/main/web/tests/for-ai-browser.mjs).

Watch for the differences between copies: `waitFor` timeouts range from 5 to 15 seconds, `resource-card-browser.mjs` lists page targets its own way, and `smoke-browser.mjs` records console errors as it goes. Keep each test's behaviour; make the differences parameters. Keep the module's file name out of the `*-browser.mjs` pattern, because CI requires every file matching it to be run as a test ([`.github/workflows/ci.yml`](https://github.com/Online-Scope-Lab/tessli/blob/main/.github/workflows/ci.yml)). No new dependency.

**Acceptance checks**

- [ ] No `*-browser.mjs` file defines its own `delay`, `findPageTarget`, `send`, `evaluate`, `evaluateSettled`, `waitFor` or `markDocumentStale`.
- [ ] No assertion was removed or loosened; the diff of each test file is only helper code going away and imports coming in.
- [ ] All nine browser tests pass in CI, and `npm run lint` and `npm run format:check` pass.

**How to verify:** in `web/`, `npm run build`, then `npm run start` in one terminal, start Chrome with `--headless=new --remote-debugging-port=9222 --remote-allow-origins=*` in another, and run each `node tests/<name>-browser.mjs` as the "Browser smoke and focused browser tests" step in `ci.yml` does.
~~~~

---

## 6. Add a one-action state to the product hero

**Labels:** `good first issue`, `enhancement`

~~~~markdown
The [product hero](https://github.com/Online-Scope-Lab/tessli/tree/main/web/registry/items/product-hero) takes an optional `secondaryAction` ("an optional quieter route", its props say) and an optional `note`. But it has only one preview state, `default`, which always shows both, so the layout people get when they leave them out is never rendered, screenshotted or checked by CI.

Add a `primary-only` state: the same demo with no `secondaryAction` and no `note`.

1. In [`demo.tsx`](https://github.com/Online-Scope-Lab/tessli/blob/main/web/registry/items/product-hero/demo.tsx), export the demo composition as a component that takes the optional parts as props, the way [`pricing-tiers/demo.tsx`](https://github.com/Online-Scope-Lab/tessli/blob/main/web/registry/items/pricing-tiers/demo.tsx) exports `PricingTiersExample`. The default export renders it unchanged.
2. Add `states.tsx` exporting `export const states = { "primary-only": PrimaryOnly }` (see [`pricing-tiers/states.tsx`](https://github.com/Online-Scope-Lab/tessli/blob/main/web/registry/items/pricing-tiers/states.tsx)).
3. In [`notes.md`](https://github.com/Online-Scope-Lab/tessli/blob/main/web/registry/items/product-hero/notes.md), set `states: [default, primary-only]` and add yourself to `contributors`.
4. Run `npm run registry:build` in `web/` and commit what it regenerates.

If the single button looks wrong (for example, stretched or leaving a gap at some width), fix [`product-hero.tsx`](https://github.com/Online-Scope-Lab/tessli/blob/main/web/registry/items/product-hero/product-hero.tsx) in the same PR and say what you changed.

**Acceptance checks**

- [ ] `/preview/product-hero?state=primary-only` renders in all three themes.
- [ ] `npm run test:items -- -g "product-hero ·"` runs 6 tests (2 states × 3 themes) and all pass.
- [ ] The `default` state looks exactly as before.
- [ ] `npm run check` passes; screenshots of the new state at 1440 and 390 are in the PR.

**How to verify:** `npm run dev`, then open `/preview/product-hero?state=primary-only`, `…&theme=neutral` and `…&theme=dark` at 1440, 768, 390 and 320 px; then stop the dev server and run `npm run build` and the `test:items` command above. Step by step: [Check one item](https://github.com/Online-Scope-Lab/tessli/blob/main/CONTRIBUTING.md#check-one-item).
~~~~

---

## 7. Build a submitted design into a library item

**Labels:** `help wanted`, `documentation`

~~~~markdown
Designers share designs through the [**Submit a design**](https://github.com/Online-Scope-Lab/tessli/issues/new?template=submit-design.yml) form. Each one arrives as an issue labelled `design:needs-implementation`, and a developer turns it into a library item. This issue explains that path; pick any open [`design:needs-implementation`](https://github.com/Online-Scope-Lab/tessli/issues?q=is%3Aissue+is%3Aopen+label%3Adesign%3Aneeds-implementation) issue to start.

1. **Claim it.** Comment on the design issue that you're building it.
2. **Read the design issue** for the problem it solves, what the common default gets wrong, and any states and responsive notes. Ask the designer there if something is unclear.
3. **Build the item** with [Contribute an item](https://github.com/Online-Scope-Lab/tessli/blob/main/CONTRIBUTING.md#contribute-an-item): copy the template, use shadcn/ui primitives and semantic tokens, and add the states the design implies.
4. **Credit both people.** In `notes.md`, `contributors` lists the designer's GitHub handle (the issue's author) and yours. The item page shows both.
5. **Open the PR** with `Closes #<design issue>`, screenshots next to the design, and a note on where you departed from it and why (themes, widths, a rule it would have broken).

The design is a starting point: the item must still meet the [item checklist](https://github.com/Online-Scope-Lab/tessli/blob/main/CONTRIBUTING.md#item-checklist) in all three themes and at all five widths.

**Acceptance checks** (for each design built)

- [ ] The PR closes the design issue and credits the designer in `contributors`.
- [ ] `npm run check` and `npm run test:items -- -g "<slug> ·"` pass.
- [ ] A maintainer has compared the build with the design.

**How to verify:** open `/library/<slug>` with `npm run dev`; the contributors line shows both handles.
~~~~

---

## 8. New library item: site header with mobile navigation

**Labels:** `help wanted`, `enhancement`

~~~~markdown
The library has items in 12 of its 14 categories. `navigation` and `forms` have none ([`schemas/library-item.schema.json`](https://github.com/Online-Scope-Lab/tessli/blob/main/schemas/library-item.schema.json)). A site header is one of the most common pieces of UI and one that generated code often gets wrong, so it's a good first `navigation` item. It is bigger than the other issues here; ask questions in this issue before you start.

**The item:** `site-header`, `kind: section`, `category: navigation`. A product's top bar: name or logo slot, three to six links, at most one primary-styled action, and a mobile menu.

**The default it replaces** (for `ai_default`, in your own words): every link and two equal buttons crammed into one row that overflows on tablets; a hamburger that opens a full-screen overlay without trapping or restoring focus or closing on Escape; dropdowns that open only on hover; and the current page shown only by colour.

**Rules it should apply** (check each one against your build before listing it): [H-01](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/H-01.md) one primary action, [K-01](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/K-01.md) native elements first, [K-02](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/K-02.md) links go, buttons act, [R-01](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/R-01.md) recompose on phones, [R-02](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/R-02.md) fit 320 px, [A-01](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/A-01.md) 44 px targets, [A-06](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/A-06.md) keyboard-complete and Escape closes, [C-02](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/C-02.md) the current page is not marked by colour alone.

**States:** `default` (desktop links visible) and `menu-open` (the mobile menu open, so CI checks it at every width). Use realistic but clearly fictional content (most items use the made-up "Northwind Notes").

Only [`button`](https://github.com/Online-Scope-Lab/tessli/blob/main/web/registry/shadcn/ui/button.tsx) is vendored today. A native `<details>` or `<dialog>` may be all the mobile menu needs; if you vendor another shadcn/ui primitive, add it to `web/registry/shadcn/ui/` in the same PR.

**Files:** a new `web/registry/items/site-header/` folder copied from [`web/registry/_template/`](https://github.com/Online-Scope-Lab/tessli/tree/main/web/registry/_template), plus everything `npm run registry:build` regenerates.

**Acceptance checks**

- [ ] `npm run check` passes, and `npm run test:items -- -g "site-header ·"` passes for both states in all three themes at 1440, 1024, 768, 390 and 320 px.
- [ ] With the keyboard alone: the menu opens, every link is reachable, Escape closes it and focus returns to the menu button.
- [ ] `notes.md` is filled in honestly, with `status: community`.
- [ ] Screenshots of both states at 1440 and 390 in the PR.

**How to verify:** [Check one item](https://github.com/Online-Scope-Lab/tessli/blob/main/CONTRIBUTING.md#check-one-item), then tab through `/preview/site-header?state=menu-open` at 390 px.
~~~~
