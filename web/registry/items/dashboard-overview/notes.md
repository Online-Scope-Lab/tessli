---
id: dashboard-overview
kind: page
category: dashboards
title: Dashboard overview
summary: Opens on the one question the dashboard exists to answer, gives the answer in a sentence, backs it with two or three compared metrics and a trend, and lists what needs attention.
use_when:
  - People open the dashboard with one recurring question, such as whether work is on time, money is on budget or a service is healthy.
  - The figures have a meaningful baseline (last period, a target) and there are specific items someone can act on.
avoid_when:
  - People come to explore many unrelated metrics; give them a report builder or a data table with filters instead.
  - The data is real-time operations monitoring where seconds matter; use a status board with alerts.
  - There is no baseline or target to compare against yet; show the raw list until there is one.
rules:
  - H-01 # one primary action per surface
  - W-01 # headings make a specific point
  - W-03 # no invented proof
  - W-04 # answer first
  - T-03 # tabular figures for compared numbers
  - C-02 # never colour alone
  - ST-01 # every data region has its states
  - R-01 # recompose for small screens
ai_default: >-
  A "Dashboard" heading over four identical KPI cards (total users, revenue,
  sessions, conversion) each with a big number and a green or red "+12.5%"
  badge with an arrow, a large area chart with a gradient fill and no stated
  baseline, a "Recent activity" feed, and no loading, empty or error state.
why_this_is_better:
  - The heading is the question people open the page to answer, and the first sentence answers it, so most visits end after one line.
  - Three metrics instead of four interchangeable cards, each with its baseline and target written out ("Up 8 points from 74% last week", "Target 80% or more"), so a change can be judged without guessing what it is compared with.
  - Changes are written in words that say which way is better ("0.5 days faster"), not a coloured percentage with an arrow, so meaning survives greyscale and screen readers.
  - The trend is a table with a bar in each row and the value written beside it, so the chart is its own text alternative and needs no chart library.
  - A short list of the items that need action, longest wait first, with one primary action that clears it, turns the answer into something to do.
  - Loading keeps metric labels and row positions in place; empty and error each say why and offer one way forward.
failures:
  - Adding a fourth and fifth metric until the answer is buried in a KPI grid again.
  - Showing a change without its baseline ("+8") or colouring it green when lower would be better.
  - Writing a heading like "Overview" that answers nothing, or an answer sentence that no longer matches the figures.
  - Turning the attention list into an activity feed of everything that happened.
  - Shipping the demo figures, or a target nobody agreed, as if they were real.
states: [default, loading, empty, error]
responsive:
  desktop: The question, answer and period run across the top at reading width; the metrics form one bordered strip of aligned columns; below, the attention list takes the wider column beside the trend chart.
  mobile: One column in priority order (question and answer first), then metrics stacked with dividers, the attention list with full-width 44px rows and a full-width action, then the trend as compact horizontal bars that fit 320px.
a11y:
  - The question is the page heading (h1 by default, h2 under a page title); every region is a section labelled by its own heading.
  - Metrics are a description list; changes and targets are text, never colour or an arrow alone.
  - The chart is a table with row headers for each period and the value as text; bars, the dashed target line and its legend swatch are hidden from assistive technology, and the target is stated in text.
  - Loading is announced through a status region and marked aria-busy; empty and error messages appear in a polite live region, and the error names its cause in text as well as colour.
  - Each item that needs attention is one link at least 44px tall with a visible focus ring.
status: community
reviewed_by: []
reviewed_at: null
contributors: []
provenance: original
license: MIT
---

Most dashboards answer a question nobody asked: four totals, a chart and a feed. People open a dashboard because they want to know one thing, such as whether reviews are happening on time. This item makes that question the heading and puts the answer in the first sentence.

Every metric carries its comparison in words, with the baseline and the target, so readers can tell whether a change is good without decoding colours. The trend is a plain table with a bar in each row: it reads as a chart, works at 320px and is already its own text alternative. The attention list turns the answer into work, with one primary action.

When you adapt it, keep it to two or three metrics, write the answer from the real figures, and replace every demo number before shipping. Design the loading, empty and error states with the real copy; they are part of the item, not extras.
