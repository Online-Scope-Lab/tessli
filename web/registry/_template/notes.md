---
# TEMPLATE. Every field below is required unless marked optional. The schema
# is schemas/library-item.schema.json. `npm run registry:build` (in web/)
# validates it and fails on any example text left unchanged from this file.
id: example-item # equals the folder name; never renamed
kind: section # component | section | page
category: features # hero | features | pricing | social-proof | faq | cta | settings | tables | dashboards | forms | auth | empty-states | navigation | mobile
title: A short name that says what the item is
summary: One sentence (20-200 characters) on the job this item does.
use_when:
  - The situation this item is right for.
avoid_when:
  - When to use something else, and what to use instead.
rules: # 3-8 ids from rules/ (see /rules) that this item really follows
  - H-01 # one primary action per surface
  - W-02 # action labels name the outcome
  - A-01 # 44px touch targets
ai_default: >-
  The generic version a model usually produces for the same job, described
  concretely enough that a reader recognises it.
why_this_is_better:
  - A specific difference from that default, and why it matters.
failures:
  - How people break this item when they adapt it.
states: [default, empty] # the first renders demo.tsx; the rest are keys of states.tsx
responsive:
  desktop: How it is laid out on wide screens.
  mobile: How it recomposes on phones (not a shrunken desktop).
a11y:
  - Headings, labels, keyboard use, focus, and anything not conveyed by colour alone.
status: community # only a maintainer sets reviewed
reviewed_by: [] # set by maintainers only
reviewed_at: null # set by maintainers only
contributors: [your-github-handle]
provenance: original # original | adapted
# source_url: https://example.com/original # required when provenance is adapted
# source_license: MIT # required when provenance is adapted
license: MIT
---

A few short paragraphs in plain language: the problem this item solves, the
choices that make it better than the default, and what to keep when adapting
it. **Bold** and `code` render on the item page.
