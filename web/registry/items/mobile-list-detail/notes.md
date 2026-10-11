---
id: mobile-list-detail
kind: page
category: mobile
title: Mobile list to detail
summary: A list of records that becomes one view at a time on phones, with large rows and a back button, and two panes side by side from 768px.
use_when:
  - People scan a list of records (notes, messages, orders, tickets) and open one at a time to read or act on it.
  - The same screen has to work on phones and on wide screens without a separate mobile app.
  - Each record has a short title and one or two lines that tell rows apart.
avoid_when:
  - People compare many records across columns; use a data table instead.
  - Records are edited side by side or several at once; a list and one detail view will slow them down.
  - The list has fewer than three records; show them all on one page.
rules:
  - R-01 # recompose for small screens
  - R-03 # break where the content breaks
  - A-01 # 44px touch targets
  - A-06 # keyboard complete, nothing hover-only
  - A-05 # announce changes in place
  - K-01 # native elements first
  - H-02 # headings follow the outline
  - ST-04 # errors explain and offer a way out
ai_default: >-
  The desktop layout shrunk to fit: a narrow sidebar list squeezed beside an
  unreadable detail column at 390px, or both stacked so the detail sits below
  a long list, with small rows, the selected item marked only by a tinted
  background, and no way back except the browser.
why_this_is_better:
  - On phones the list and the detail are separate views; opening a row replaces the list instead of pushing the content below the fold.
  - Rows are full-width buttons at least 44px tall, with the title, a date and two lines of content, so people can tell records apart before they open one.
  - The detail view has a visible back button that names where it goes ("All notes") and returns focus to the row that was opened.
  - From 768px both panes fit, so the list stays in view beside the open record and the back button disappears.
  - The selected row is marked with a bar, a fill, bolder text and aria-current, not by colour alone.
  - Empty and failed loads replace the list with a message that says what happened and one way forward.
failures:
  - Keeping the selection only in component state in a real app. Use your router so links, refresh and the browser Back button work; this item stays state-driven so it installs anywhere.
  - Stacking the detail below the list on phones, so opening a row does nothing visible.
  - Dropping the back button because "the browser has one", or labelling it only with an arrow icon.
  - Moving focus into the detail on wide screens, which loses people's place in the list while they compare records.
  - Shrinking row padding to fit more rows on a phone until the targets fall under 44px.
states: [default, detail, empty, error]
responsive:
  desktop: From 768px, a bordered two-pane layout under one header with the list name and count; the list (up to 22rem) sits beside the open record, which shows the first record until another is chosen.
  mobile: Below 768px, one view at a time, edge to edge. The list shows full-width rows; opening one shows the record with a back button at the top, and the list header is kept only for screen readers.
a11y:
  - The list name is the section's heading and labels the list; the open record is an article labelled by its own heading, one level deeper.
  - Rows are native buttons, at least 44px tall, with a visible focus ring; the open row has aria-current and a visible bar.
  - On phones, opening a row moves focus to the record's heading and Back returns it to that row, so focus never lands on a hidden view.
  - On wide screens focus stays in the list and a polite live region announces which record is shown.
  - The error message starts with a text label, so it does not rely on colour.
status: community
reviewed_by: []
reviewed_at: null
contributors: []
provenance: original
license: MIT
---

The common mobile failure is a desktop master/detail layout squeezed onto a phone: a sidebar too narrow to read beside a detail too narrow to use, or the detail stacked under the whole list so tapping a row seems to do nothing. This item recomposes instead. Below 768px there is one view at a time: a list of large rows, then the record with a back button. From 768px both fit, so they sit side by side.

Focus follows the view. On a phone, opening a row moves focus to the record's heading, and **Back** returns it to the row that was opened, which stays marked so people can see where they were. On wide screens the list never disappears, so focus stays there and the change is announced politely instead.

The item keeps its selection in component state so it works in any project. In a real app, put the open record in the URL with your router so refresh, sharing and the browser's Back button behave as people expect, and keep the layout, focus and back-button rules. The two-pane breakpoint matches Tailwind's `md`; change the class names and the `WIDE_QUERY` constant together if yours differs.
