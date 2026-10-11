# Tessli Component Contracts

Status: **v1.2 site components** (the Sources directory). Library items follow the [item checklist](../CONTRIBUTING.md#item-checklist), not this file.

These contracts describe working public interfaces only. Components being removed by the v1.2 cleanup ([`v1.2/repo-cleanup.md`](v1.2/repo-cleanup.md)) are marked; their full v1.1 contracts are recoverable from the `v1.1-archive` tag.

## 1. Global header

### Anatomy

- Tessli wordmark;
- working primary navigation: Browse, Collections, For AI;
- utilities: Search (Saved and Boards are removed in C4);
- mobile menu and search shortcut.

### Behaviour

- desktop height approximately `64px`;
- active route uses a restrained orange underline, not a filled pill;
- show only working routes/utilities;
- Browse is the canonical source browser;
- no Sign in, account, in-site submit form, Lab, proof, or review control;
- mobile navigation opens a full-height accessible sheet;
- Escape closes sheets/menus and focus returns to their triggers.

## 2. Wordmark

- text-based Newsreader wordmark for version one;
- links to `/`;
- no icon beside the wordmark;
- desktop approximately `34–38px`; mobile approximately `30–32px`;
- remains readable in dark/forced-colour contexts.

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

## 4. Task starter

Used on Home only.

- concise task label and optional one-line context;
- links to a meaningful `/resources` query;
- three to six items maximum;
- visible focus and minimum touch target;
- never becomes a category rail, result set, or decorative pill cloud.

## 5. Browse refinement controls

Controls may include category, source type, access, and platform/framework only where canonical data supports them. Active filters have a clear summary and one clear-all action. URL state is shareable.

Desktop can use concise inline controls or a sidebar. Tablet/mobile use an accessible filter sheet. Coverage level, evidence count, human-review state, and verification/audit mechanics are not primary refinement controls.

## 6. Resource card and compact row

### Anatomy

- fixed-ratio approved preview or complete fallback;
- source identity/title linking to the internal Source Guide;
- one-line purpose;
- two or three high-value task cues;
- independent Save control (removed in C4);
- explicit external `Visit source` action;
- optional compact `Inspect` affordance when title/card treatment alone is not sufficient.

### Interaction

- title, identity, or whole-card profile link navigates to `/resources/[slug]`, never directly to the provider;
- Visit has a clear label and safe external-link behaviour;
- Visit (and Save until C4) sits above the profile-link hit area in stacking order;
- modifier-click and text selection continue to work;
- hover and `:focus-within` communicate the same hierarchy.

### States

- default, hover, keyboard focus;
- preview loading, preview failed, missing preview;
- missing description/task cues;
- long title;
- unavailable/broken provider.

Coverage level, evidence, freshness, and governance can be available in a quiet secondary treatment but are not card focal points. Cards or compact rows are the standard Browse forms; a table requires a documented research benefit and must recompose on mobile rather than horizontally scroll.

## 7. Source Guide sections

Source Guide composition follows this fixed reading hierarchy:

1. identity/purpose and preview;
2. Visit (Save and Add to Board are removed in C4);
3. Use it when and What to explore;
4. How to access and useful compatibility;
5. Important limitations;
6. differentiated alternatives and containing Collections;
7. quiet source details/references.

The component family must degrade honestly for thinly described sources and omit unsupported optional fields. It must not promote raw schema, evidence counts, review state, or verification mechanics above the source guidance.

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
- Visit the source (Save and Add to Board are removed in C4).

## 9. Saved shortlist — removed in C4

## 10. Board workspace — removed in C4

## 11. Preview fallback

- fixed aspect ratio prevents layout shift;
- the frozen fallback chain preview → favicon → lettermark ([`data-and-media-contract.md`](data-and-media-contract.md)) remains canonical;
- below-fold media loads lazily;
- preview failure still leaves identity, purpose, and actions usable;
- live framed previews are not a default component (the live-preview pilot is removed in C5).

## 12. Account and form components — removed in C3

Auth, account menus and in-site forms are not part of v1.2. Contributions go through GitHub issue forms and pull requests (see [`CONTRIBUTING.md`](../CONTRIBUTING.md)).

## 13. Footer

- concise Tessli statement;
- footer-only links: About, Curation, Privacy, Terms, Content policy;
- responsive groups that stack simply on mobile;
- no newsletter until operational;
- no Auth, Lab, proof, or review destination.

## 14. Announcements

Dynamic result, search and filter-recovery status changes are announced to assistive technology through live regions. Errors are never explained only in a transient message. The `ToastNotification` component loses its last user (Save and Boards) in C4, which removes it or keeps it as an unused primitive.
