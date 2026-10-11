# Tessli UI rules

Tessli is an open-source UI library that ships its reasoning. These 39 rules cover structure and behaviour (hierarchy, spacing, states, copy, responsive, accessibility), not a visual style: keep your project's own theme.
Status: every rule is a draft until a maintainer signs it; 0 of 39 reviewed. Reasons and sources for each: https://tessli.vercel.app/rules
Use: read this before building UI. Then render at 1440, 768 and 390 px (and 320 px for overflow) and verify each rule's check.
Format: `ID rule | how to check`. Generated from rules/*.md; edit those, not this file.

## Hierarchy

- H-01 Give each section, card or dialog at most one primary-styled action. | Count primary-styled actions per section and dialog at 1440 and 390: one at most.
- H-02 One h1 per page; nest h2–h4 in order. Level follows structure, size follows style. | Run axe heading-order or list the outline: one h1, no skipped levels.
- H-03 Use at most one uppercase eyebrow per page, and only if it adds information. | Count uppercase, letter-spaced labels over headings: one per page at most.
- H-04 Use numbered markers (01, 02, Step 1) only for steps people follow in order. | For each numbered marker: does order matter to the user? If not, drop the numbers.

## Typography

- T-01 Cap running text at a readable measure (about 65ch), never the full container width. | At 1440, every body paragraph has a max-width of 80ch or less.
- T-02 Take font sizes from the type scale; use at most four sizes in one section. | List computed font sizes per section at 1440 and 390: all on the scale, four at most.
- T-03 Set prices, counts and numeric columns in tabular figures. | Inspect prices, counts and numeric columns: font-variant-numeric is tabular-nums.

## Spacing and density

- S-01 Keep space inside a group smaller than space between groups, at every width. | Measure gaps at 1440 and 390: label to content < item to item < section to section.
- S-02 Align a section's heading, text and actions on one left edge; centre only short blocks. | At 1440, heading, text and actions share a left edge; centred text runs 3 lines at most.
- S-03 Make data surfaces compact and reading surfaces roomy; don't use one density everywhere. | At 1440×900, data rows are 48px tall or less; reading text has line-height 1.5 or more.

## Colour

- C-01 Colour with semantic tokens (background, primary, muted, border…), never raw values. | No hex, rgb(), hsl() or palette classes in the component; it works in light and dark.
- C-02 Pair every colour-coded meaning (error, selected, status) with text or shape. | View it in greyscale: every state is still identifiable from text or shape.
- C-03 Spend the primary colour on the primary action and real status, not decoration. | At 1440 and 390, every element in the primary colour is the primary action or a status.
- C-04 Show importance with position, size, weight and borders, not gradients, glows or glass. | Search the styles for gradients, blur and backdrop-filter: none carries meaning.

## Components

- K-01 Use the native element (button, a, details, input, select, dialog) before a custom widget. | No clickable div or span (onClick, role="button"); Tab reaches every control.
- K-02 Use a link to go to a URL and a button to act on the page; the style never decides. | Everything that navigates has an href and works with middle click; buttons only act.
- K-03 Give compared options the same rows in the same order, aligned, values written out. | At 768 and up, each attribute lines up across options; values are text, not ticks.
- K-04 Shape each block by its content; don't force unlike content into identical icon cards. | Every grid of 3+ same-shaped cards holds true peers; otherwise use a list or table.

## Copy

- W-01 Write headings that make the product's point, not labels like "Features" or "FAQ". | Swap in another product's name: if the heading still works, rewrite it.
- W-02 Label actions with what happens next, not "Get started", "Submit" or "Learn more". | Read each button and link out of context: it says what it does or where it goes.
- W-03 Show no ratings, counts, logos, quotes or metrics you can't source. | Trace every number, logo and quote to a real source, or label it fictional demo content.
- W-04 Lead answers, errors and notices with the answer or consequence, then the detail. | Read only the first sentence of each answer or message: it gives the answer or outcome.
- W-05 Put an arrow on a link only when it leaves the site (↗), never on every link. | Every link or button with an arrow glyph or icon goes to another site or app.

## States

- ST-01 Design empty, loading and error states for every region that loads or lists data. | Force no data, a slow network and a failed request: each shows a designed state.
- ST-02 Give first use, no results and failure their own message and action. | First use, no matches and a failed load each show their own copy and action.
- ST-03 Reserve space so loading, toggles and validation don't shift surrounding content. | Switch every state at 1440 and 390: nothing else moves (CLS under 0.1).
- ST-04 Say what failed, what is still safe, and one way forward (retry, edit or contact). | Trigger each error: the text names the failure, the impact and an action.
- ST-05 Before a destructive action, name what is lost and if it can be undone; confirm it. | Each delete or reset confirms with the object and consequence named; Cancel gets focus.

## Responsive

- R-01 On phones, restack content by priority and adapt components; don't shrink the desktop. | At 390: priority order holds, nothing is cramped side by side, text is no smaller.
- R-02 Fit every surface into 320 CSS px with no sideways scroll; only tables and code may scroll. | At 320 px, the document is no wider than the viewport and no text is clipped.
- R-03 Change layout where the content stops fitting, not at device names. | Resize from 1440 to 320: no width crushes columns or orphans one card on a row.

## Motion

- M-01 Animate only changes people cause (open, close, switch); no decorative motion. | Without interaction nothing moves, on load or scroll; transitions take 240ms or less.
- M-02 Under prefers-reduced-motion, remove non-essential transforms and transitions. | Emulate prefers-reduced-motion: reduce; only essential motion remains.

## Accessibility

- A-01 Make every interactive target at least 44×44 CSS px; inline text links excepted. | At 390, every button, link and control's hit area is 44×44px or more, inline links aside.
- A-02 Show a visible :focus-visible indicator on every interactive element. | Tab through at 1440 and 390: each stop shows an uncovered indicator at 3:1 contrast.
- A-03 Meet 4.5:1 for text and 3:1 for large text and control edges, in every theme. | Run axe with the WCAG 2.2 AA tags in each theme: no contrast violations.
- A-04 Give every control a visible label, groups a legend, and errors a link to their field. | Clicking a label focuses its control; groups have a legend; errors use aria-describedby.
- A-05 Announce results, saves and errors that appear in place through a polite live region. | With a screen reader, filter, save and fail: each change is announced once, focus unmoved.
- A-06 Make everything work by keyboard, close overlays on Escape, and hide nothing behind hover. | Keyboard alone reaches and operates everything; Escape closes overlays and focus returns.
