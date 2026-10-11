# Tessli Design System

Status: **active visual contract**
Last updated: 2026-10-11

This document is the concise source of truth for Tessli's visual identity. Component behaviour, data rules and quality checks live in the documents indexed in [`docs/README.md`](docs/README.md).

## 1. Product character

Tessli is an open-source UI library that explains itself, with a curated directory of design sources beside it, for designers, developers, product builders, and coding agents.

It should feel:

- editorial, not like a generic SaaS dashboard;
- warm, not clinically white;
- curated, task-led, and never crowded;
- useful before decorative;
- confident without feeling elitist;
- calm enough for research, but memorable enough to become a brand.

## 2. Canonical visual references

Desktop direction:

- `docs/ref-img/explore-desktop.webp`
- `docs/ref-img/collections-desktop.webp`
- `docs/ref-img/full-reference-desktop.webp`

Approved hero artwork:

- canonical source: `docs/ref-img/tessli-hero-geometry.webp`
- production derivative: `web/public/brand/tessli-hero-geometry.webp`

Logo and sharing images (`web/public/brand/`):

- `tessli-wordmark.svg` and `tessli-wordmark-light.svg`: the wordmark as outlines (Newsreader 700, tracking `-0.045em`), charcoal for light backgrounds and canvas for dark ones.
- `tessli-mark.svg`, `tessli-mark-dark.svg` and `tessli-mark-512.png`: the square T-and-dot mark, the same drawing as the favicon `web/app/icon.svg`.
- `tessli-social-preview.png` (1280×640): the GitHub social preview. `web/app/opengraph-image.png` is the same card without the repository address, used for link previews of the site.

The references define the **composition, atmosphere, hierarchy, and component language**. They are not literal specifications for fictional data, tiny generated text, or impossible measurements.

## 3. Non-negotiable design principles

1. **Task-led discovery first.** Task search is the fastest route to value and must remain prominent; taxonomy is a refinement, not the primary answer.
2. **Editorial hierarchy.** Display serif is reserved for brand and page-level storytelling; product UI stays sans-serif.
3. **Warm restraint.** Off-white surfaces, charcoal text, fine borders, and sparse orange accents.
4. **One primary action per surface.** Resource card opens the Source Guide; Visit remains a separate control.
5. **Progressive complexity.** Basic browsing is simple; advanced filters appear only when requested.
6. **Truthful interface.** No invented users, ratings, trends, curators, or activity claims.
7. **Accessible calm.** Grain, shadows, and motion must never weaken contrast or legibility.
8. **Responsive by recomposition.** Mobile is not a shrunken desktop layout.

## 4. Typography decision

### Display and wordmark: Newsreader Variable

Use for:

- Tessli wordmark;
- hero headline;
- page titles;
- occasional editorial collection headings.

Why:

- It was designed for content-rich on-screen reading and works as a variable family.
- It feels editorial and warm without copying the now-common Instrument Serif + Inter template look.
- Its optical sizing gives us a display voice while retaining readable forms.

Rules:

```css
--font-display:
  var(--font-newsreader), "Iowan Old Style", "Palatino Linotype", Georgia, serif;
```

`next/font` sets `--font-newsreader` and `--font-instrument-sans` on `<html>`, so `--font-display` and `--font-ui` resolve everywhere.

Shipped values (tracking tokens live in `web/app/globals.css`):

- Wordmark: weight `700`, automatic optical size, tracking `-0.045em`.
- Hero: weight `650`, automatic optical size, tracking `-0.015em` (`--tracking-display`), line-height `0.92`.
- Page and section title: weight `600–620`, tracking `-0.025em` (`--tracking-title`), line-height `0.96–0.98`.
- Some existing page modules use tighter title tracking (down to `-0.05em` on the source page title); new work uses the two tokens.
- Do not use Newsreader for controls, metadata, tables, tags, or long UI paragraphs.

### Interface: Instrument Sans Variable

Use for:

- navigation;
- body copy;
- buttons and fields;
- resource metadata;
- filters, tags, forms, tables, and account UI.

Why:

- It is a variable sans with adjustable width and twelve stylistic sets.
- It has more personality than a default system/Inter implementation without becoming distracting.
- Its 400–700 range is sufficient for Tessli's UI.

Rules:

```css
--font-ui: var(--font-instrument-sans), "Avenir Next", system-ui, sans-serif;
```

- Body: `400`.
- Navigation and controls: `500–550`.
- Labels and card titles: `600`.
- Strong counts only: `650–700`.
- Default width axis: `98`; compact tables may use `95`.
- Stylistic alternates must be opt-in and component-specific, never applied globally.

### Loading

Use variable fonts through `next/font` so they are self-hosted at build time, avoid browser requests to Google, and reduce layout shift. Do not commit unlicensed font files. Both chosen families are released under SIL OFL 1.1.

### Why these fonts

Chosen in July 2026 after comparing five open (SIL OFL) candidates. The full research notes are preserved at the `v1.1-archive` tag.

- **Newsreader** (selected, display): designed for content-rich on-screen use, variable, editorial warmth, and works at both display and reading sizes.
- **Instrument Sans** (selected, interface): variable width and weight, subtle personality, twelve stylistic sets, and holds up in dense product UI.
- **Instrument Serif** (rejected): close to the early visual direction, but paired with Inter it had become an obvious template/AI-site look, and its single display weight gives little hierarchy control.
- **Fraunces** (reserved): distinctive variable axes, but its expressive forms can make the directory feel playful or retro and are easy to over-style. It is the only alternate to test if Newsreader stops working for the wordmark or hero; don't restart an open-ended font search.
- **Figtree** (fallback): friendly and usable, but more geometric and generic than the editorial direction. Fallback only if Instrument Sans fails in-browser testing.

Any font change must pass an in-browser specimen first: the wordmark, hero headline, navigation, card title and description, category labels, numerals and dates, form copy and long source names.

## 5. Type scale

```css
--text-display-xl: clamp(3.25rem, 6.6vw, 6.1rem);
--text-display-lg: clamp(2.75rem, 5vw, 4.75rem);
--text-title: clamp(2.35rem, 4vw, 3.75rem);
--text-h2: clamp(1.75rem, 2.5vw, 2.5rem);
--text-h3: 1.25rem;
--text-body-lg: 1.0625rem;
--text-body-md: 1rem;
--text-body-sm: 0.875rem;
--text-label: 0.75rem;
--text-micro: 0.6875rem;
```

`--text-body` is the body text **colour** (§6); the body **size** is `--text-body-md`. Before 2026-10-11 both shared the name `--text-body`, so the size overrode the colour and body copy rendered in `--text-strong`.

Paragraph measure: `58–68ch`.  
Hero supporting copy: `44–56ch`.

## 6. Colour tokens

The palette is sampled from the approved direction and adjusted for accessibility.

```css
:root {
  --canvas: #fcf8f3;
  --surface: #fffefc;
  --surface-muted: #f5f0ea;
  --surface-strong: #ebe4dc;

  --text-strong: #151412;
  --text-body: #4f4a44;
  --text-muted: #78716a;
  --text-faint: #958d84;

  --line-subtle: #e5dfd7;
  --line: #d8d1c8;
  --line-strong: #bdb5ab;

  --accent: #f05217;
  --accent-hover: #df450f;
  --accent-soft: #fff0e7;
  --accent-text: #b9380e;

  --focus: #1d4ed8;
  --success: #237a4b;
  --warning: #9a5d00;
  --danger: #b63129;

  --charcoal-art: #252422;
  --stone-art: #d9cfbf;
}
```

Semantic aliases (shadcn names) map onto these tokens. Library items use only the aliases, so they take on the installing project's theme:

| Alias                                    | Tessli token                                            |
| ---------------------------------------- | ------------------------------------------------------- |
| `--background` / `--foreground`          | `--canvas` / `--text-strong`                            |
| `--card` / `--card-foreground`           | `--surface` / `--text-strong`                           |
| `--popover` / `--popover-foreground`     | `--surface` / `--text-strong`                           |
| `--secondary` / `--secondary-foreground` | `--surface-muted` / `--text-strong`                     |
| `--primary` / `--primary-foreground`     | `--accent` / `--text-strong`                            |
| `--muted` / `--muted-foreground`         | `--surface-muted` / `--text-muted`                      |
| `--accent` / `--accent-foreground`       | `--accent` (the orange signal itself) / `--text-strong` |
| `--destructive`                          | `--danger`                                              |
| `--border`                               | `--line`                                                |
| `--input`                                | `--line-strong`                                         |
| `--ring`                                 | `--focus`                                               |
| `--radius`                               | `--radius-control-md`                                   |

Library previews (`/preview/<slug>`) do not use these site aliases. `web/registry/themes.css` defines three complete shadcn variable sets, scoped to `[data-theme="tessli" | "neutral" | "dark"]`: **Tessli** (the canvas, charcoal and orange above, with `--accent` as the soft `#ebe4dc` hover surface shadcn expects and `--muted-foreground` darkened to `#6f6862` for AA on muted surfaces), **Neutral** (cool grey product UI on white, system font) and **Dark** (neutral dark, system font). `tests/library-themes.test.mjs` checks their WCAG 2.2 AA contrast.

Usage rules:

- `--accent` is decorative or paired with dark text.
- Use `--accent-text` for small orange text on light backgrounds.
- Primary orange buttons should use charcoal text, not white.
- Orange should occupy less than roughly 8% of a normal page viewport.
- Never use pure white as the page canvas or pure black for large surfaces.
- Normal text must meet at least 4.5:1 contrast; large text at least 3:1.

## 7. Grain and atmosphere

The soothing feeling comes from the combination of warm colour, soft contrast, space, and restrained grain.

Page treatment:

- one seamless monochrome noise texture;
- fixed to the viewport;
- opacity `0.018–0.028`;
- `mix-blend-mode: multiply`;
- pointer-events disabled;
- never applied inside text, form fields, thumbnails, or modal surfaces;
- disabled in high-contrast/forced-colours modes.

Hero artwork contains its own texture and must not receive a second heavy grain layer.

## 8. Spacing and layout

Base spacing unit: `4px`.

```css
--space-1: 0.25rem;
--space-2: 0.5rem;
--space-3: 0.75rem;
--space-4: 1rem;
--space-5: 1.25rem;
--space-6: 1.5rem;
--space-8: 2rem;
--space-10: 2.5rem;
--space-12: 3rem;
--space-16: 4rem;
--space-20: 5rem;
--space-24: 6rem;
```

There is no `--space-7` or `--space-9`; use the neighbouring steps.

Containers:

- maximum page width: `1280px`;
- desktop gutters: `32–48px`;
- tablet gutters: `24px`;
- mobile gutters: `16–20px`;
- 12-column desktop grid;
- 8-column tablet grid;
- 4-column mobile grid.

## 9. Borders, radius, and elevation

```css
--radius-control-sm: 4px;
--radius-control-md: 7px;
--radius-control-lg: 10px;
--radius-pill: 999px;

--shadow-xs: 0 1px 2px rgb(21 20 18 / 0.04);
--shadow-sm: 0 5px 18px rgb(21 20 18 / 0.06);
--shadow-md: 0 14px 36px rgb(21 20 18 / 0.09);
```

- Cards and panels are square (`0`); controls use `--radius-control-sm`/`-md`; menus and sheets may use `--radius-control-lg`. There is no larger radius.
- Borders do more visual work than shadows.
- Search bars, dropdowns, sheets, and modals may elevate.
- Resource cards remain mostly flat and become clearer through hover/focus background changes.
- Avoid the repeated “rounded card with shadow” look.

## 10. Motion

Motion is functional and restrained.

- micro transition: `120–160ms`;
- menu/sheet transition: `180–240ms`;
- easing: `cubic-bezier(.2,.8,.2,1)`;
- no continuous floating hero animation in version one;
- no cursor-follow effects;
- no scroll-jacking;
- honour `prefers-reduced-motion` by removing non-essential transforms and transitions.

## 11. Homepage evidence and imagery

The home hero stays, with its composition and the arch-and-stairs artwork (`web/public/brand/tessli-hero-geometry.webp`, hash-checked in CI). See `docs/v1.2/plan.md` §4. Below the hero, the homepage shows featured library items as live previews, the anatomy of one item from its real notes, a For AI install strip, a Sources teaser and a Contribute strip (plan §5; [`docs/component-contracts.md`](docs/component-contracts.md) §4).

Do not use coverage levels, verification status, user counts, activity, popularity, or community claims as evidence. Real Tessli product UI is the preferred imagery for anything new.

## 12. Breakpoints

Reference breakpoints:

```css
--bp-sm: 480px;
--bp-md: 768px;
--bp-lg: 1024px;
--bp-xl: 1280px;
--bp-2xl: 1440px;
```

Breakpoints are behaviour triggers, not device labels. CSS modules use these `max-width` queries:

- `480px`: small phones;
- `767px`: below tablet (`--bp-md`);
- `1023px`: below `--bp-lg`, when 1024px itself keeps the desktop composition;
- `1024px`: tablet and below, when 1024px takes the tablet composition.

Two older triggers remain where moving them would change real layouts: `1100px` for the three-column Browse and Collection grids, and the hero's own `720px`, `389px` and `1120px` (facts row), which stay with the frozen hero. Each page's transitions live in its CSS module; check them at the widths in [`docs/quality-gates.md`](docs/quality-gates.md).

## 13. Tailwind and primitives

- `web/app/globals.css` is the single token source. `@theme static` and `@theme inline` expose colour, type, spacing, radius, shadow and motion tokens as Tailwind utilities (for example `bg-canvas`, `text-ink-body`, `text-body-md`, `rounded-control-md`, `shadow-sm`, `ease-standard`, `bg-primary`).
- `web/components/ui/` holds the shared primitives: `Button` (`primary`, `secondary`, `quiet`; renders a link when given `href`), `Field` (label, input or textarea, hint, error), `Tag` (`neutral`, `signal`) and `Eyebrow`. Use them instead of redefining action, field or tag styles in a page module.
- `/lab` is the internal, `noindex` specimen of the tokens and primitives.
- Element defaults (`body`, links, form fonts, `:focus-visible`) sit in `@layer base`, below Tailwind utilities, so library items restyle them with utilities as they would in a shadcn project. Site CSS modules use classes and still win.
- Library items use shadcn/ui primitives, not the site primitives: the copies the site renders live in `web/registry/shadcn/`, separate from `web/components/ui/`.

## 14. Tells to avoid

From `docs/v1.2/plan.md` §4:

- One uppercase eyebrow per site, in the home hero only. Elsewhere a heading stands alone; if a label carries real information (a page name, a category), show it as plain sentence-case text or a `Tag`.
- Numbered markers (01/02/03, Stage 1) only for real sequences, such as the For AI workflow and Collection stages.
- Arrows only where a link goes somewhere else: `↗` for external links. No `→` on ordinary links or cards.

## 15. Anti-patterns

Do not introduce:

- blue/purple AI gradients;
- glassmorphism;
- excessive pills;
- oversized blur glows;
- stock 3D blobs unrelated to Tessli's geometric language;
- serif text inside dense controls;
- fake social proof;
- multiple competing primary buttons;
- animation for decoration alone;
- shadcn defaults left visually unchanged.
