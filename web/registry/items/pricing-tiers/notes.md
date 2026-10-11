---
id: pricing-tiers
kind: section
category: pricing
title: Pricing tiers compared on the limits that matter
summary: Two or three plans compared on the few limits buyers actually weigh, with one recommended plan and an honest billing-period switch.
use_when:
  - The product has two or three self-serve plans that differ on a few clear limits.
  - Monthly and annual billing are both offered and the difference should be visible before checkout.
avoid_when:
  - There are more than three plans, or pricing is usage-based; use a calculator or a full comparison table.
  - Every plan needs a sales conversation; show what is included and one contact route instead.
  - The plans differ on dozens of features; link to a full comparison table below a short summary.
rules: []
ai_default: >-
  Three identical rounded cards, the middle one raised with a gradient border
  and a "Most popular" pill, a dozen ticked features per card that mostly
  repeat, the same "Get started" button on every card, and an annual toggle
  whose saving is a hard-coded percentage.
why_this_is_better:
  - Plans are compared on three named limits, written out as values ("Up to 50", "1 year") in the same order on every plan, so the difference is readable at a glance.
  - Only the recommended plan gets the primary button; it is marked with a text label as well as a border, so the recommendation does not depend on colour.
  - The annual saving is computed from the prices, and the billed-yearly total is shown, so the switch never promises a discount the numbers do not support.
  - Each call to action says what happens next ("Start 14-day trial", "Choose Business") instead of repeating "Get started".
  - A footnote states taxes and trial terms near the price, not on another page.
failures:
  - Adding a fourth plan to the same grid, which breaks the comparison on tablets and phones.
  - Listing features every plan has, which buries the limits that differ.
  - Marking more than one plan as recommended, or giving every plan a primary button.
  - Typing a saving percentage by hand that no longer matches the prices.
states: [default, annual]
responsive:
  desktop: Plans side by side (three plans from 1024px, two from 768px), each a subgrid over the same rows so names, prices, actions and limits line up; the billing switch sits beside the heading.
  mobile: Plans stack in order with the recommended plan unchanged in position; each keeps its own labelled list of limits, so nothing depends on column alignment.
a11y:
  - The billing period is a fieldset with a visible legend and two native radio buttons, operable with arrow keys and labelled with the saving in text.
  - Plan names are h3 headings inside a list; prices and limits are text, and the recommended plan is named in text, not only by its border.
  - Calls to action are links at least 44px tall with a visible focus ring.
status: community
reviewed_by: []
reviewed_at: null
contributors: []
provenance: original
license: MIT
---

Pricing pages go wrong when every plan looks the same and lists everything. Buyers compare a few limits, so this item makes those limits the structure: the same three rows on every plan, values written out, in the same order.

Only one plan is recommended, and only that plan gets the primary button. The billing switch is a pair of native radio buttons; the saving it shows is calculated from the prices you pass in, so it cannot drift out of date.

Pass two or three plans. Beyond that, the grid stops working on smaller screens and a comparison table or calculator serves people better.
