# Tessli Design System

Status: **active visual contract**
Last updated: 2026-07-29

This document is the concise source of truth for Tessli's visual identity. Component behaviour, data rules and quality checks live in the documents indexed in [`docs/README.md`](docs/README.md).

## 1. Product character

Tessli is a human-curated, AI-native design-source router for designers, developers, product builders, and coding agents.

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
- `docs/ref-img/saved-desktop.webp`
- `docs/ref-img/full-reference-desktop.webp`

Approved hero artwork:

- canonical source: `docs/ref-img/tessli-hero-geometry.webp`
- production derivative: `web/public/brand/tessli-hero-geometry.webp`

The references define the **composition, atmosphere, hierarchy, and component language**. They are not literal specifications for fictional data, tiny generated text, or impossible measurements.

## 3. Non-negotiable design principles

1. **Task-led discovery first.** Task search is the fastest route to value and must remain prominent; taxonomy is a refinement, not the primary answer.
2. **Editorial hierarchy.** Display serif is reserved for brand and page-level storytelling; product UI stays sans-serif.
3. **Warm restraint.** Off-white surfaces, charcoal text, fine borders, and sparse orange accents.
4. **One primary action per surface.** Resource card opens the destination; save remains a separate control.
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
--font-display: "Newsreader", "Iowan Old Style", "Palatino Linotype", serif;
```

- Wordmark: weight `700`, optical size `72`, tracking `-0.045em`.
- Hero: weight `650`, optical size `72`, tracking `-0.055em`, line-height `0.92`.
- Page title: weight `600`, optical size `60`, tracking `-0.04em`, line-height `0.96`.
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
--font-ui: "Instrument Sans", "Avenir Next", system-ui, sans-serif;
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
--text-body: 1rem;
--text-body-sm: 0.875rem;
--text-label: 0.75rem;
--text-micro: 0.6875rem;
```

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
--radius-xs: 4px;
--radius-sm: 7px;
--radius-md: 10px;
--radius-lg: 14px;
--radius-xl: 20px;
--radius-pill: 999px;

--shadow-xs: 0 1px 2px rgb(21 20 18 / 0.04);
--shadow-sm: 0 5px 18px rgb(21 20 18 / 0.06);
--shadow-md: 0 14px 36px rgb(21 20 18 / 0.09);
```

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

The V3 homepage does not use a statistics or coverage row. Its hierarchy is task question, task search, task starters, the find → decide → handoff explanation, selected Collections, and a concise For AI path.

Do not use the catalogue count, coverage levels, verification status, user counts, activity, popularity, or community claims as hero evidence. Real Tessli product UI is the preferred marketing imagery when a later approved page contract calls for imagery. The legacy geometric hero artwork is not prescribed for the V3 homepage.

## 12. Breakpoints

Reference breakpoints:

```css
--bp-sm: 480px;
--bp-md: 768px;
--bp-lg: 1024px;
--bp-xl: 1280px;
--bp-2xl: 1440px;
```

Breakpoints are behaviour triggers, not device labels. Each page's exact transitions live in its CSS module; check them at the widths in [`docs/quality-gates.md`](docs/quality-gates.md).

## 13. Anti-patterns

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
