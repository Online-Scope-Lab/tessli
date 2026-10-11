---
id: data-table
kind: component
category: tables
title: Data table with filters and states
summary: A compact, sortable table with labelled search and one filter, and designed loading, empty, no-results and error states that keep the layout still.
use_when:
  - People scan, compare and open records that share the same few attributes, such as notes, invoices, members or orders.
  - The full list fits in the browser (up to a few hundred rows), so search, filter and sort can run on the client.
  - One or two columns carry the comparison (status, a count, a date) and deserve sorting.
avoid_when:
  - Records have little in common or are read rather than compared; use a list of cards or a feed instead.
  - There are thousands of rows; move search, sort and pagination to the server and keep these states.
  - People need to edit cells in place, select many rows or reorder columns; use a grid component built for that.
  - There are only two or three records; a short list reads better than a table.
rules:
  - ST-01 # every data region has its states
  - ST-02 # empty states differ by cause
  - ST-03 # state changes don't move the page
  - ST-04 # errors explain and offer a way out
  - S-03 # density fits the task
  - T-03 # tabular figures for compared numbers
  - A-05 # announce changes in place
  - R-02 # reflow at 320; only the table scrolls
ai_default: >-
  A bare table with roomy rows and every column in the same grey, a search
  box with only a placeholder, unsortable headers or click-to-sort with no
  aria-sort, a centred spinner (or nothing) while loading, one "No data"
  message for an empty account, a search with no matches and a failed
  request alike, and a table that either overflows the phone screen or is
  shrunk to tiny text.
why_this_is_better:
  - Five states are designed, not one. Loading keeps the header and placeholder rows so nothing jumps; first use offers the next step; no results repeats the query and clears filters in one action; an error says what failed and offers a retry.
  - Sorting is a native button inside each header, and the sorted header carries aria-sort, so the order is announced as well as shown by the chevron.
  - The search and the filter have visible labels, and the result count ("Showing 3 of 12 notes") sits in a polite live region, so screen-reader users hear the effect of each change without losing focus.
  - Rows stay at 44px with compact padding, numbers are right-aligned in tabular figures, and the first column is a real row header that links to the record, so the table is quick to scan and compare.
  - On narrow screens the table scrolls inside its own frame with the first column pinned and a text hint, so the page never scrolls sideways and every row stays identifiable.
  - Placeholder rows do not pulse or shimmer; nothing moves unless someone acts.
failures:
  - Dropping the loading rows for a spinner, which collapses the frame and makes the page jump when data arrives.
  - Reusing the first-use message for no results, so people with a typo are told they have no data.
  - Repeating the header's primary action inside the empty state, so two buttons compete for the same job.
  - Adding more columns until the pinned column and one other are all a phone can show; move secondary detail to the record page instead.
  - Turning rows into clickable divs instead of linking the row header, which breaks keyboard use, middle click and screen-reader row navigation.
  - Colouring statuses without the status text, which fails in greyscale and for screen readers.
states: [default, loading, empty, no-results, error]
responsive:
  desktop: Title, description and the one primary action share a row above a labelled search box and filter; the table fills the width with compact 44px rows, text columns left and numbers right.
  mobile: Header, action, search and filter stack full width in that order; the table scrolls sideways inside its bordered frame with the first column pinned and a line saying it scrolls, while the page itself never scrolls sideways.
a11y:
  - The section and the table are labelled by the visible heading; the first cell of each row is a th with scope="row" and the column headers have scope="col".
  - Sortable headers are native buttons; the sorted column's th has aria-sort, and the chevron icon is decorative.
  - Search and filter have visible labels and sit in a form with role="search"; Enter does not reload the page.
  - The result count is a polite live region that also reports loading, no data and a failed load; the error state adds a text label above its title, so it never relies on colour.
  - When the table overflows, its scroll container becomes a labelled, focusable region so keyboard users can scroll it; focus rings are visible on every control.
  - Clearing filters from the no-results state moves focus to the search box, because the button that was pressed disappears.
  - Placeholder rows are hidden from assistive technology and the table is marked aria-busy while loading.
status: community
reviewed_by: []
reviewed_at: null
contributors: []
provenance: original
license: MIT
---

Most tables are designed for the moment the data is already there. This one is designed for the moments around it: while it loads, before anything exists, when a search finds nothing and when the request fails. Each of those gets its own copy and its own next step, and all of them keep the header and the frame in place so the page does not jump.

The table itself stays plain and compact. The first column is the row header and links to the record, numbers are right-aligned in tabular figures, and secondary text is muted so the names carry the eye. Sorting uses native buttons with `aria-sort`; search and the one filter have visible labels, and the result count is announced as it changes.

Pass columns and rows as plain data. On phones the table scrolls inside its own frame with the first column pinned, which keeps rows identifiable; if a phone can show only that column and one more, move the extra columns to the record page rather than squeezing them in. For large data sets keep the states and move search, sort and pagination to the server.
