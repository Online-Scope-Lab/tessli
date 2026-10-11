---
id: empty-state
kind: component
category: empty-states
title: Empty state that says why and what next
summary: Replaces a list, table or feed that has nothing to show, and tells people why it is empty and the one thing to do next.
use_when:
  - A region that normally holds content is empty on first use, after a search or filter, or because loading failed.
  - There is one clear next action, such as creating, importing, clearing a filter or retrying.
avoid_when:
  - The whole screen is empty because the user has no access; show a permission message with who to ask instead.
  - Content is still loading; show a skeleton or progress state, not an empty state.
  - The empty region is minor (a sidebar list, a small widget); a single muted sentence is enough.
rules:
  - H-02 # headings follow the outline
  - S-02 # one shared edge
  - C-02 # never colour alone
  - W-02 # action labels name the outcome
  - ST-01 # every data region has its states (empty and error here; loading is out of scope)
  - ST-02 # empty states differ by cause
  - ST-04 # errors explain and offer a way out
  - A-01 # 44px touch targets
ai_default: >-
  A large centred illustration or icon, the headline "Nothing here yet", a
  vague line such as "Get started by creating your first item", and the same
  generic message for first use, no search results and failed loads.
why_this_is_better:
  - The title names what is empty in the user's words ("No notes in Field research yet"), so it reads correctly out of context and to screen readers.
  - First use, no results and error are different states with different copy and actions, because they have different causes.
  - No results echoes the query and says what the search covered, so people can tell a typo from missing content.
  - The error state says what failed and what is safe ("Nothing was deleted") before offering a retry, and is labelled in text, not only by colour.
  - It sits where the content would be, left-aligned with the page, instead of a centred illustration that pushes the action below the fold.
  - One primary action, at most one secondary, both at least 44px tall.
failures:
  - Adding an illustration that is larger than the message and pushes the action off small screens.
  - Repeating a primary action that the toolbar above already offers, so two buttons compete for the same job.
  - Using one generic "No data" message for every cause.
  - Turning the error state into a red banner with no explanation of what is safe or what to do.
states: [first-use, no-results, error]
responsive:
  desktop: Bordered region aligned with the surrounding content; actions sit side by side under the text, which keeps a readable measure.
  mobile: Same order; padding tightens and actions become full-width buttons stacked in priority order.
a11y:
  - A real heading (level set by headingLevel to match the page outline) names the region through aria-labelledby.
  - The error variant adds a text label above the title, so the state is not conveyed by colour alone.
  - Actions are native buttons or links at least 44px tall with a visible focus ring.
  - If the state appears after an action (a search, a failed save), announce it from your own live region; the component does not announce on its own.
status: community
reviewed_by: []
reviewed_at: null
contributors: []
provenance: original
license: MIT
---

An empty state is the first screen many people see, and the screen they see when something goes wrong. The common default treats all of those moments the same: an illustration and "Nothing here yet". This item treats them as three different situations.

**First use** explains what will appear and offers the action that fills it. **No results** repeats the query and the search scope, then offers a wider search or a reset. **Error** says what failed and what is safe, then offers a retry. Loading is out of scope: pair this item with a skeleton or progress state to cover all of ST-01.

The component is deliberately plain: a heading, a sentence or two, and actions. Put it where the content would have been, at the same alignment, so the page does not jump when content arrives.
