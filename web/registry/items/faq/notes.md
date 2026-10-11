---
id: faq
kind: section
category: faq
title: FAQ that answers real objections
summary: Answers the questions buyers ask before committing, with direct answers and a real contact route, using native disclosure widgets.
use_when:
  - A marketing or pricing page has four to eight recurring questions about data, billing, cancellation or access.
  - The answers are short and stable enough to live on the page.
avoid_when:
  - The questions need long, step-by-step answers; link to documentation instead.
  - You have fewer than three real questions; answer them in the page copy.
  - The content is support troubleshooting that changes often; keep it in a help centre.
rules: []
ai_default: >-
  A centred "Frequently Asked Questions" heading over a JavaScript accordion
  of filler questions such as "What is [product]?" and "Why choose us?",
  answered with marketing copy, only one item open at a time, and no way to
  reach a person.
why_this_is_better:
  - Questions are real objections (export, cancellation, billing, sharing, offline) in the words a buyer would use.
  - Each answer starts with the direct answer ("Yes.", "Only the people you invite.") before the detail.
  - Native details and summary elements need no JavaScript, work with the keyboard and screen readers out of the box, and let people open several answers at once.
  - A heading that says what the questions are about, plus a real contact route for anything not covered.
  - On wide screens the heading column stays in view beside the questions instead of a centred single column.
failures:
  - Padding the list with questions nobody asks to make the section look complete.
  - Hiding prices, limits or cancellation terms in an FAQ instead of stating them where people decide.
  - Replacing the native disclosure with a custom accordion that loses keyboard and find-in-page support.
  - Linking the contact line to a form that does not exist yet.
states: [default]
responsive:
  desktop: Two columns from 1024px; the heading, description and contact route stay in view beside the questions.
  mobile: One column; the heading block comes first, then full-width questions with 44px touch targets.
a11y:
  - The section is labelled by its h2; questions are summary elements inside details, so their expanded state is announced natively.
  - The plus icon is decorative (aria-hidden) and rotates into a cross; the open state never relies on the icon alone.
  - Each summary is at least 44px tall and shows a focus ring.
  - The rotation honours reduced motion.
status: community
reviewed_by: []
reviewed_at: null
contributors: []
provenance: original
license: MIT
---

An FAQ earns its place when it removes a reason not to buy. That means real objections: can I leave with my data, what happens if I stop paying, who can see my work. Filler questions about what the product is belong in the hero, not here.

The section uses native `details` and `summary` elements. They are keyboard- and screen-reader-accessible without any script, and people can open more than one answer to compare them. Keep answers to a few sentences and lead with the direct answer.

The contact line is part of the item, not decoration: if the answer is not on the page, say who answers and how fast, and only if that is true.
