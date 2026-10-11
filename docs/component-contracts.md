# Tessli Component Contracts

Status: **v1.2 site components** (the Sources directory). Library items follow the [item checklist](../CONTRIBUTING.md#item-checklist), not this file.

These contracts describe working public interfaces only. Components being removed by the v1.2 cleanup ([`v1.2/repo-cleanup.md`](v1.2/repo-cleanup.md)) are marked; their full v1.1 contracts are recoverable from the `v1.1-archive` tag.

## 1. Global header

### Anatomy

- Tessli wordmark;
- working primary navigation (plan §5): Library (`/library`), Sources (`/resources`), For AI (`/for-ai`);
- utilities on the right: Contribute (`/contribute`) and GitHub (the canonical repository URL from `web/lib/repository.ts`, opening in a new tab with `↗`);
- mobile menu.

### Behaviour

- desktop height approximately `64px`;
- active route uses a restrained orange underline, not a filled pill;
- show only working routes/utilities;
- Sources (`/resources`) is the canonical source browser; Sources is also the active item on `/collections`, which are curated source guides;
- no Sign in, account, in-site submit form, or Lab control;
- mobile navigation opens a full-height accessible sheet;
- Escape closes sheets/menus and focus returns to their triggers.

## 2. Wordmark

- text-based Newsreader wordmark for version one;
- links to `/`;
- no icon beside the wordmark;
- desktop approximately `34–38px`; mobile approximately `30–32px`;
- remains readable in dark/forced-colour contexts;
- the browser-tab icon is `web/app/icon.svg`: a serif "T" with the orange signal dot on the warm canvas (not the hero artwork).

## 3. Search field

### Anatomy

- visible label or equivalent accessible name;
- search icon, input, clear action when populated;
- optional platform-neutral keyboard hint;
- result status through an `aria-live` region.

### States and behaviour

- empty, focused, typing, loading, results, no-results, error, disabled;
- `/` or `Ctrl / ⌘ K` may focus global search;
- Escape clears first, then removes focus;
- local catalogue filtering may debounce `80–120ms` without a network call;
- a task search on Home submits to `/resources?q=...`.

## 4. Home sections

Below the frozen hero, in this order (`web/components/home/home-sections.tsx`):

- featured library items: one component, one section and one page as live, lazy, inert `/preview/<slug>` thumbnails at a fixed 16:10 ratio, each with its title and the item's own first "why this is better" note;
- anatomy of an item: one real item's own notes (use when, avoid when, common AI default, what it does instead, the rules it follows), shortened, with a link to the full item;
- a For AI strip with the real rules-file and item install commands;
- a Sources teaser with counts derived from the catalogue, linking to `/resources` and `/collections`;
- a Contribute strip linking to `/contribute` and the repository.

No invented stats, logos or testimonials; no eyebrow outside the hero; no arrows on ordinary links.

## 5. Browse refinement controls

Controls may include category, source type, access, and platform/framework only where canonical data supports them. Active filters have a clear summary and one clear-all action. URL state is shareable.

Desktop can use concise inline controls or a sidebar. Tablet/mobile use an accessible filter sheet. Coverage level, evidence count, human-review state, and verification/audit mechanics are not primary refinement controls.

## 6. Resource card and compact row

### Anatomy

- fixed-ratio approved preview or complete fallback;
- source identity/title linking to the internal Source Guide;
- one-line purpose;
- two or three high-value task cues;
- explicit external `Visit source` action;
- optional compact `Inspect` affordance when title/card treatment alone is not sufficient.

### Interaction

- title, identity, or whole-card profile link navigates to `/resources/[slug]`, never directly to the provider;
- Visit has a clear label and safe external-link behaviour;
- Visit sits above the profile-link hit area in stacking order;
- modifier-click and text selection continue to work;
- hover and `:focus-within` communicate the same hierarchy.

### States

- default, hover, keyboard focus;
- preview loading, preview failed, missing preview;
- missing description/task cues;
- long title;
- archived source (never in Browse; a card for one replaces Visit with a plain "Archived" label).

Coverage levels, evidence, freshness and governance are not shown on cards in v1.2. Cards or compact rows are the standard Browse forms; a table requires a documented research benefit and must recompose on mobile rather than horizontally scroll.

## 7. Source Guide sections

Source Guide composition follows this fixed reading hierarchy:

1. identity/purpose and preview;
2. Visit;
3. Use it when and What to explore;
4. How to access and useful compatibility;
5. Important limitations;
6. differentiated alternatives and containing Collections;
7. quiet source details (domain, type, access model and status).

The component family must degrade honestly for thinly described sources and omit unsupported optional fields. Coverage levels, evidence records, governance and verification mechanics are not shown on the Source Guide in v1.2.

An archived source keeps its Source Guide for old links, marked `noindex`. It shows an "Archived: <reason>" notice under the purpose, links the replacing source when one is recorded, shows the provider address as a quiet text link instead of the Visit button, and recommends no access route.

## 8. Collection card and stage item

### Collection card

- goal;
- audience;
- stage count;
- expected decision;
- factual cover/fallback when available;
- no fake curator, contributor, usage, or trend data.

### Stage item

- stage name and intended outcome;
- source role;
- what to inspect;
- decision prompt;
- Visit the source.

## 9. Preview fallback

- fixed aspect ratio prevents layout shift;
- the frozen fallback chain preview → favicon → lettermark ([`data-and-media-contract.md`](data-and-media-contract.md)) remains canonical;
- below-fold media loads lazily;
- preview failure still leaves identity, purpose, and actions usable;
- live framed previews are not a component: the live-preview iframe pilot was removed in v1.2.

## 10. Account and form components — removed in C3

Auth, account menus and in-site forms are not part of v1.2. Contributions go through GitHub issue forms and pull requests (see [`CONTRIBUTING.md`](../CONTRIBUTING.md)).

## 11. Footer

- concise Tessli statement;
- three groups: Browse (Library, Sources, Collections, For AI), Project (About, Rules, Contribute, How sources are chosen, GitHub) and Legal (Privacy, Terms, Content policy);
- responsive groups that stack simply on mobile;
- no newsletter until operational;
- no Auth or Lab destination.

## 12. Announcements

Dynamic result, search and filter-recovery status changes are announced to assistive technology through live regions. Errors are never explained only in a transient message. There is no toast component; it was removed with Saved and Boards in C4.

## 13. Shared primitives

`web/components/ui/` holds `Button` (primary, secondary, quiet; renders an internal link, or a new-tab external link with `rel="noopener noreferrer"`, when given `href`), `Field` (label, input or textarea, hint and error wired with `aria-describedby` and `aria-invalid`), `Tag` (neutral, signal) and `Eyebrow` (home hero only). Page modules use these instead of redefining action, field or tag styles. Their tokens and rules are in [`design.md`](../design.md) §13–14.
