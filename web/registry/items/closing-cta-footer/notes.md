---
id: closing-cta-footer
kind: section
category: cta
title: Closing CTA and footer
summary: One final action tied to the page's job, then a compact footer with a few grouped links, a real contact route and the legal links.
use_when:
  - A marketing, pricing or product page ends and the reader should have one clear next step.
  - The site needs a footer that helps people find a few things (pricing, help, contact, legal), not a sitemap.
avoid_when:
  - The page's job is not to convert (documentation, help, legal); leave out the CTA and keep the footer only.
  - The site has dozens of destinations people browse from the footer; give it a proper sitemap page and link to it.
  - The last action on the page is already the same as the hero's with nothing new to say; restate why to act, or drop the CTA.
rules:
  - H-01 # one primary action per surface
  - W-01 # headings make the product's point
  - W-02 # action labels name the outcome
  - W-05 # arrows only on links that leave the site
  - S-02 # one shared left edge
  - K-02 # links navigate, buttons act
  - R-01 # restack by priority on phones
  - A-01 # 44px touch targets
ai_default: >-
  A centred "Ready to get started?" band on a gradient with two equal filled
  buttons ("Get started" and "Book a demo") repeating the hero word for word,
  followed by a five-column link-farm footer of every page, a newsletter field,
  a row of social-media icons and an arrow after every link.
why_this_is_better:
  - The closing heading restates the page's point as a reason to act now, and the single primary action says what happens next ("Create a free workspace").
  - The alternative is a quiet text link ("Compare plans"), so the page ends on one obvious step instead of a choice between two equal buttons.
  - A short note under the action removes the last doubt (price, card, commitment) and only says what is true.
  - The footer groups a handful of links people actually look for, names a real contact route with who answers and how fast, and keeps legal links in their own row.
  - Only the link that leaves the site carries ↗, with a screen-reader note; nothing else gets an arrow, and there are no icon-only social links.
failures:
  - Repeating the hero's headline and buttons word for word, so the closing section adds nothing.
  - Adding a second filled button, or styling the secondary link as a button of equal weight.
  - Turning the footer into a sitemap with five or more columns, or adding social icons with no visible labels.
  - Writing a reassurance note ("Cancel anytime", "No card needed") that the product's terms do not support.
  - Pointing the contact line at an inbox nobody reads, or promising a reply time nobody keeps.
states: [default, footer-only]
responsive:
  desktop: The closing heading, text and actions share one left edge with text capped at a readable measure; the footer puts the name, description and contact in one column beside two to four link groups, with copyright and legal links in a row below.
  mobile: The primary action becomes full width with the text link below it on the same left edge; the footer stacks name and contact first, link groups in two columns, then copyright and legal links.
a11y:
  - The closing section is labelled by its h2; the footer is a footer element with two navigation landmarks, "Footer" and "Legal".
  - Each link group is a list labelled by its visible group name (aria-labelledby), so screen readers announce "Product, list, 3 items".
  - Every footer link, the brand link and the text link are at least 44px tall with a visible focus ring; the mailto link in the contact sentence is an inline link.
  - The external link's ↗ is aria-hidden and replaced by "(another site)" for screen readers; nothing relies on colour or hover alone.
status: community
reviewed_by: []
reviewed_at: null
contributors: []
provenance: original
license: MIT
---

The end of a page is where the reader decides. A closing section earns its place when it restates the page's point as a reason to act now and offers **one** action named by what happens next. Anything else is a quieter text link, not a second filled button.

The footer is for finding things, not for showing how big the site is. Keep it to a few groups of links people really look for (pricing, help, export, security), a contact route that says who answers and how fast, and the legal links. The product name is text; no logo, newsletter field or social icons are needed.

Pass `cta` only on pages whose job is to convert. On help, documentation and legal pages, leave it out and the footer stands alone, as the `footer-only` state shows. Mark links that leave the site with `external`, and only those get an arrow.
