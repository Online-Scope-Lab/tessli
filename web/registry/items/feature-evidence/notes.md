---
id: feature-evidence
kind: section
category: features
title: Feature section, evidence-led
summary: Shows each feature with the artefact that proves it (a UI fragment, a before/after, an exact limit), giving the most important feature the most room.
use_when:
  - A marketing or product page has to explain two to four features that a buyer will check before switching.
  - Each feature can be shown with something concrete from the product, such as a screen fragment, an output or a stated limit.
  - The features differ in importance and the page should say which one matters most.
avoid_when:
  - You cannot yet show the feature working; ship a short description list and add evidence once it exists.
  - There are more than about six features of equal weight; use a compact list or a comparison table.
  - The section is a step-by-step setup flow; use a numbered sequence instead.
rules:
  - K-04 # no identical card grids
  - W-01 # headings make a specific point
  - W-03 # no invented proof
  - C-03 # the accent is scarce
  - H-02 # headings follow the outline
  - T-01 # readable line length
  - T-03 # tabular figures for compared numbers
  - R-01 # recompose for small screens
ai_default: >-
  A centred "Features" heading over three identical rounded cards, each with
  a primary-coloured icon in a tinted circle, a two-word title such as
  "Lightning fast" or "Secure by default" and one line of filler, often with
  a "Learn more →" link on every card.
why_this_is_better:
  - Each feature is shown with an artefact a reader can check (a version history, the exported file, a number with a unit) instead of an icon and an adjective.
  - Emphasis follows importance; the lead feature gets the widest column and a bigger heading, supporting features sit below it, and small features become a plain list.
  - Headings state the claim ("Every edit is kept, and any version can be restored"), so they still make sense out of context and would not fit another product.
  - Limits are written as exact values in tabular figures, in a row layout, not implied by "Unlimited" or a tick.
  - The section uses no accent colour at all; hierarchy comes from size, width, borders and order, so it holds in any theme.
  - Demo content is labelled fictional in a footnote, so placeholder proof cannot ship as if it were real.
failures:
  - Swapping the artefacts back for icons, which turns the section into the default it replaces.
  - Using a mock-up, number or screenshot that the product cannot actually produce, or leaving the demo limits in place.
  - Giving every feature the lead treatment, so nothing reads as most important.
  - Putting live, clickable controls inside an artefact, so people try to use a picture of the product.
  - Removing the captions, which leaves screen-reader users and skimmers without the point of each artefact.
states: [default, two-features]
responsive:
  desktop: From 1024px the lead feature puts its text beside a wider artefact; two supporting features sit in two columns from 768px, and the remaining features form a three- or two-column list chosen so none is left alone on a row. The before/after goes side by side only when its own container is at least 36rem wide.
  mobile: One column in priority order, lead first; each feature's heading and text come before its artefact, limits stay large, and the before/after stacks so both panels keep a readable width.
a11y:
  - The section is labelled by its h2; every feature title is an h3, including the "also" list heading.
  - Each artefact is a figure with a figcaption that states what it shows; artefacts hold no focusable controls.
  - Added and removed lines in the diff are announced as "Added" and "Removed" and shown with + and − marks and strike-through, not by colour; the version being viewed is labelled "Viewing" in text.
  - Checklist marks in the before/after are decorative; their state is given in hidden text ("Done", "To do").
  - The only links are real links at least 44px tall with a visible focus ring.
status: community
reviewed_by: []
reviewed_at: null
contributors: []
provenance: original
license: MIT
---

Most feature sections ask the reader to take adjectives on trust: three cards, three icons, "fast", "secure", "simple". This item replaces each adjective with the thing that would prove it: a small static fragment of the product, a before and after, or an exact limit with its unit. If you cannot show it, that is useful to know before you claim it.

Features are not equally important, so the layout is not a grid of peers. One **lead** feature gets the most room and a bigger heading. One or two **supporting** features follow, each with its own kind of proof. Small features that need only a sentence go in a plain list at the end.

The file exports three helpers for the artefacts: `EvidencePanel` frames a fragment of UI, `BeforeAfter` shows an input and its result (it uses a Tailwind v4 container query to decide when to sit side by side), and `ExactLimits` sets numbers large in tabular figures. Keep artefacts static and caption every one. Replace the demo's fictional people, notes and limits with your product's real ones, and keep the footnote only while they are still demo content.
