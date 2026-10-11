# Quality gates

A checklist for any visible change. A page isn't done because it looks close in one desktop screenshot. Visual rules live in [`design.md`](../design.md); library items also meet the [item checklist](../CONTRIBUTING.md#item-checklist).

## Widths

- [ ] Checked at 1440×900, 1024×768, 768×1024 and 390×844.
- [ ] 320px gate: no horizontal overflow wherever the surface can compress that far.
- [ ] Mobile is recomposed, not a shrunken desktop layout.
- [ ] Screenshots of each width are attached to the PR.

## Visual and type

- [ ] Newsreader only in display roles; Instrument Sans for all UI. Fonts load; no faux bold or italic.
- [ ] Headline wrapping, container alignment and section rhythm as intended.
- [ ] Orange stays restrained; borders carry hierarchy; grain stays subtle.
- [ ] Hero artwork keeps its scale, crop and empty alt text.
- [ ] Tabular numbers for counts; readable line lengths; no major layout shift from font fallback.
- [ ] No untouched generic component defaults.

## Accessibility

- [ ] Contrast: normal text at least 4.5:1, large text at least 3:1 (WCAG 2.2 AA).
- [ ] Complete keyboard navigation with a visible `:focus-visible` indicator.
- [ ] Touch targets about 44×44px.
- [ ] Every field has a label; errors are connected to their controls.
- [ ] Live regions announce search, filter and result changes.
- [ ] `prefers-reduced-motion` respected: non-essential transforms and transitions removed.
- [ ] Forced-colours mode stays usable.
- [ ] Semantic landmarks and heading order; no invalid nested interactive markup; no hover-only information.

## Interaction

- [ ] Links and cards work with click, keyboard, modifier click and middle click.
- [ ] Menus and sheets close on Escape and return focus to their trigger; mobile sheets manage focus.
- [ ] URL filters survive a refresh.
- [ ] Loading controls don't resize.
- [ ] Empty, error and loading states exist.

## Truthfulness

- [ ] Counts are calculated from current data, never hard-coded.
- [ ] No fake users, ratings, curators, trends, reviews, logos, testimonials or activity.
- [ ] Prices and access models are labelled as subject to change; dates are shown only when tracked.
- [ ] Broken or unavailable sources degrade clearly.
- [ ] Public discovery (`robots.txt`, `llms.txt`, sitemap) advertises only routes that work.

## Media and performance

- [ ] Source media keeps fixed aspect ratios and stays useful when every image fails (see [`data-and-media-contract.md`](data-and-media-contract.md)).
- [ ] Below-the-fold images load lazily; no remote SVG injection.
- [ ] LCP under 2.5s on a reasonable mobile test; CLS under 0.1; no render-blocking third-party font request.

## Security

- [ ] No unsanitised user HTML; external links are safe (`rel="noopener noreferrer"` where they open a new tab).
- [ ] No secrets in the tree; normal build and test make no network calls.

## Review dimensions

Human review of a screen, and the [Taste Bench](../bench/PROTOCOL.md) in [`v1.2/plan.md`](v1.2/plan.md) §9, use these twelve dimensions (first set out in `AGENTS.md` §12 of v1.1, readable with `git show v1.1-archive:AGENTS.md`). Rules in [`rules/`](../rules/) cite them as "Review dimension: …".

task fit · hierarchy · mobile usability · discoverability · density · coherence · consistency · component reuse · accessibility · restraint · regression risk · ship readiness

The [rules](../rules/TESSLI.md) turn several of these into concrete checks. Review against the rules an item lists, at 1440, 768 and 390 px.
