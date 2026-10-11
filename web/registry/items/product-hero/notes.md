---
id: product-hero
kind: section
category: hero
title: Product hero with real UI
summary: A landing-page hero that says what the product does, offers one primary action and shows the product itself, composed from interface components.
use_when:
  - The top of a landing page for a product people use on screen, where seeing the interface answers "what is it?" faster than copy.
  - You can compose a representative view of the product from your own components and tokens, with content that looks like real use.
avoid_when:
  - The product has no interface worth showing (an API, a service); show a short code sample or the outcome instead.
  - The view you would show is not built yet; describe what exists and leave the frame out rather than mocking up features.
  - A page deeper in the site (docs, pricing); use a plain heading and description there, not a hero.
rules:
  - H-01 # one primary action per surface
  - W-01 # headings make a specific point
  - W-02 # action labels name the outcome
  - W-03 # no invented proof
  - C-03 # the accent is scarce
  - C-04 # no effects as emphasis
  - S-02 # one shared edge
  - R-01 # recompose for small screens
ai_default: >-
  A centred headline such as "Supercharge your workflow" over a purple-to-blue
  gradient blob, a vague subline, two equal buttons ("Get started" and "Learn
  more"), a row of grey customer logos and "Trusted by 10,000+ teams", and a
  tilted, glowing screenshot or an abstract 3D shape where the product should
  be.
why_this_is_better:
  - The headline says what the product does for whom, so a visitor knows within one line whether to keep reading.
  - One primary button names what happens next; the secondary route is a quiet underlined link, so the two never compete.
  - The product is shown as it is used, with a notebook open and believable notes, instead of a gradient or a decorative shape standing in for it.
  - The frame is built from the same semantic tokens as the page, so it follows the theme (light or dark) and stays sharp at every width, unlike a screenshot.
  - The frame recomposes as it narrows (the list alone on phones, then the open note, then the notebooks column) instead of shrinking a desktop picture until its text is unreadable.
  - The terms people check before clicking ("Free for one person. No card needed.") sit under the action, and there are no logos, counts or quotes the page cannot source.
failures:
  - Mocking up features the product does not have, or content that no user would write, so the frame promises more than the product does.
  - Adding a second primary button, or styling the secondary link as a full outline button so the choice becomes equal.
  - Swapping the frame for a screenshot that turns into unreadable text on phones and ignores the theme.
  - Putting real, focusable controls inside the frame; it is a picture, hidden from assistive technology.
  - Filling the space under the actions with invented logos or "Trusted by" counts.
  - Centring a long headline and description, which makes the text ragged and hard to scan.
states: [default]
responsive:
  desktop: Headline, description and actions on one left edge, capped at a readable width, with the product frame full width below; from 56rem of frame width it shows the notebooks column, the notes list and the open note.
  mobile: The text block comes first and the actions stack full width with the primary on top; the frame below drops to the notes list alone, at full text size, and adds the open note from 36rem.
a11y:
  - The section is labelled by its heading; headingLevel is 1 on a landing page (the hero holds the page title) and 2 where the page already has an h1, as in this preview.
  - Both actions are links to their destinations, at least 44px tall with a visible focus ring; the secondary is underlined, so it reads as a link without relying on colour.
  - The product frame is a figure whose visible caption is its text alternative; the composed interface inside it is aria-hidden and inert, so it adds no tab stops and no duplicate reading.
  - Selection in the frame is shown with a left bar and weight as well as a background tint, so it survives greyscale.
  - Nothing animates.
status: community
reviewed_by: []
reviewed_at: null
contributors: []
provenance: original
license: MIT
---

The default hero spends its space on atmosphere: a gradient, a slogan that fits any product and two buttons that ask for the same decision. Visitors leave it knowing nothing about the product. This item spends the space on the product: a headline that says what it does, one action, and the interface itself.

The frame is not a screenshot. `ProductWindow` takes a static composition built from your own components and tokens, so it follows the page theme, stays crisp at any width, and can **recompose** as it narrows: its content area is a size container, so the demo shows the notes list alone on a phone and adds the open note and the notebooks column as room allows.

Keep the frame honest. Show a view that exists, with content a real user would write, and write a caption that says what it shows. Leave out what you cannot source: no logos, user counts or quotes. One primary action, one quiet alternative, and the terms people check before they click.
