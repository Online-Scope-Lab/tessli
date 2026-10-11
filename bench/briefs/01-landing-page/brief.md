# Landing page for a UI review tool

Paneline is a fictional product; any resemblance to a real product is unintended. Use only the facts below. Do not add customers, logos, quotes, ratings, user counts or other numbers that are not given here.

## The product

Paneline helps software teams review user-interface changes before they merge. When someone opens a pull request on GitHub, Paneline renders the changed pages at fixed screen widths, shows the before and after side by side, and lets a reviewer approve or reject each visual change. The pull request cannot merge until every change is approved.

Facts you may use:

- Works with GitHub pull requests. GitLab support is planned, with no date.
- Renders pages at the widths a team chooses (for example 1440, 768 and 390 px).
- Highlights the pixels that changed and groups changes by page.
- Screenshots are stored in the team's own S3-compatible bucket; Paneline keeps only the approval record (who approved what, and when).
- A self-hosted runner is available for teams that cannot send their pages to a third-party service.
- Paneline is in an open beta. There is no pricing yet; beta teams use it free.
- The next step for a visitor is to join the beta waitlist with a work email address. The team replies within two working days.

## Who the page is for

A technical product lead deciding whether Paneline fits their team's review workflow. They are sceptical of marketing claims, read quickly, and want to know how it works, where their data goes and what to do next.

## What the page must do

- Make the product's promise clear within the first screen.
- Show a believable workflow: from pull request, to rendered changes, to approval.
- Explain the privacy and data-storage posture plainly.
- Offer one clear next action: join the beta waitlist (a work email field and a submit button).
- Include site navigation (product, privacy, documentation, GitHub) that collapses into a menu on small screens.

## States

- `default`: the page as a first-time visitor sees it.
- `mobile-menu-open`: the navigation menu opened on a small screen.
- `waitlist-error`: the waitlist form after submitting an address that is not a valid email; the error explains what to fix.
- `waitlist-success`: the waitlist form after a successful submission, confirming what happens next.

## Out of scope

Pricing, sign-in, blog, documentation pages and any page other than this one. The navigation links may point to `#` anchors.
