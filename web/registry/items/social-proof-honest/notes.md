---
id: social-proof-honest
kind: section
category: social-proof
title: Honest social proof
summary: Shows only proof a reader can check, real quotes with a name and a link to the source, and public records instead when there is none yet.
use_when:
  - You have one to three quotes that named people agreed, in writing, to have published with their name and role.
  - Each quote already exists somewhere a reader can follow, such as a case study, the person's own post or a recorded talk.
  - The product is new and has no quotes yet, but has public records (changelog, source code, status history) a reader can check.
avoid_when:
  - You have no permissioned quotes and no public record to point at; leave the section out rather than fill it.
  - You want to show usage numbers or customer logos; publish those only with a cited source and written permission, in their own section.
  - The quotes are long stories; link to full case studies from a short list instead.
rules:
  - W-03 # no invented proof
  - W-02 # action labels name the outcome
  - W-05 # arrows only for leaving
  - K-04 # no identical card grids
  - S-02 # one shared edge
  - T-01 # readable line length
  - C-04 # no effects as emphasis
  - A-01 # 44px touch targets
ai_default: >-
  A "Trusted by" strip of grey placeholder logos, three counters such as
  "10,000+ teams" and "4.9/5 rating", and a grid of identical testimonial
  cards with five stars, a stock avatar, a first name and a vague line of
  praise, none of it traceable to a real person or source.
why_this_is_better:
  - Every quote needs a full name and a link to where it was first published, so the claim can be checked, and readers can see the person said it in context.
  - Example quotes carry a visible "Example — replace with a real, permissioned quote" label, so a placeholder cannot ship looking like a real customer.
  - With no quotes, the section shows public records a reader can check (changelog, source code, status history) instead of inventing proof; with nothing at all, it renders nothing.
  - No logos, star ratings or counters, which are the parts most often invented and least often sourced.
  - The first quote leads and the rest follow in a quieter column, instead of identical cards that make every quote equally vague.
  - Links say where they go ("Read the case study"), and only links that leave the site get ↗.
failures:
  - Shipping the demo with the placeholder flag removed, so example quotes read as real customers.
  - Editing a quote to make it punchier, or trimming the parts that qualify it; publish the person's exact words.
  - Linking the source to a page that does not contain the quote, or to the home page.
  - Adding a logo strip or usage counters next to the quotes without a source and permission for each.
  - Keeping a quote after the person has left the organisation or asked for it to be removed.
states: [default, single, no-proof-yet]
responsive:
  desktop: From 1024px the first quote sits in a wider left column at a larger size and the others stack in a narrower right column, all sharing the heading's left edge; quote text keeps a readable measure.
  mobile: One column in reading order, heading first, then the lead quote and the others below it; the fallback links stack above their descriptions and stay at least 44px tall.
a11y:
  - The section is labelled by its h2; each quote is a figure with a blockquote, its cite attribute set to the source, and a figcaption naming the person.
  - The example label is visible text above the quote, so placeholder status is not shown by the dashed border alone.
  - External links add "(another site)" for screen readers; the ↗ glyph is hidden from them.
  - Source and fallback links are at least 44px tall with a visible focus ring, and nothing moves or appears on hover only.
status: community
reviewed_by: []
reviewed_at: null
contributors: []
provenance: original
license: MIT
---

Social proof is the section where generated UI most often makes things up: logos of companies that never used the product, round-number counters and five-star cards with first names. Each one is false the moment it ships, and placeholders like these are routinely left in.

This item only has room for proof a reader can check. A quote needs the person's full name, their role and a link to where they said it. Example quotes in the demo are marked with a visible label, and the component keeps that label for any quote passed with `placeholder`, so a forgotten example still says what it is.

When there is nothing to quote yet, pass an empty list and a `fallback` of public records: a changelog, the source code, a status history. They show what the team ships without claiming who uses it. If you have neither, the component renders nothing, which is better than an empty frame waiting for invented logos.

Keep permission records outside the UI. Before publishing a quote, get written consent for the exact words, the name and the role, and remove the quote when that consent is withdrawn.
