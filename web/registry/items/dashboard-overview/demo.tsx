// Fictional product: Northwind Notes. Every figure, name and note below is
// invented demo data and describes no real product, team or person.
import { Button } from "@/registry/shadcn/ui/button";

import {
  DashboardOverview,
  type DashboardAttention,
  type DashboardMetric,
  type DashboardOverviewProps,
  type DashboardTrend,
} from "./dashboard-overview";

export const actionClass = "h-11 w-full px-5 sm:w-auto";

const metrics: DashboardMetric[] = [
  {
    id: "reviewed-in-time",
    label: "Reviewed within 2 days",
    value: "82%",
    comparison: "Up 8 points from 74% last week",
    context: "Target: 80% or more",
  },
  {
    id: "waiting",
    label: "Waiting for review",
    value: "14 notes",
    comparison: "5 fewer than last week (19)",
    context: "6 have waited more than a week",
  },
  {
    id: "time-to-review",
    label: "Median time to first review",
    value: "1.4 days",
    comparison: "0.5 days faster than last week (1.9)",
    context: "Counted from when a note is shared",
  },
];

const attention: DashboardAttention = {
  title: "Waiting more than a week",
  description: "Longest wait first. Three of these have no reviewer yet.",
  measureLabel: "Waiting",
  items: [
    {
      id: "warehouse-pilot",
      title: "Interview notes: warehouse pilot, round 2",
      href: "#note-warehouse-pilot",
      detail: "Field research · Priya N.",
      flag: "Unassigned",
      measure: "12 days",
    },
    {
      id: "onboarding-survey",
      title: "Onboarding survey summary",
      href: "#note-onboarding-survey",
      detail: "Customer research · Sam O.",
      measure: "10 days",
    },
    {
      id: "pricing-copy",
      title: "Pricing page copy, second draft",
      href: "#note-pricing-copy",
      detail: "Marketing drafts · Lee W.",
      flag: "Unassigned",
      measure: "9 days",
    },
    {
      id: "audit-follow-ups",
      title: "Accessibility audit follow-ups",
      href: "#note-audit-follow-ups",
      detail: "Design system · Ana R.",
      flag: "Unassigned",
      measure: "8 days",
    },
  ],
  action: (
    <Button size="lg" className={actionClass}>
      Assign reviewers to 3 notes
    </Button>
  ),
  moreLink: {
    label: "See all 6 notes waiting more than a week",
    href: "#review-queue",
  },
};

const trend: DashboardTrend = {
  title: "Back above target after one slow week",
  description:
    "Share of notes reviewed within 2 days of being shared, for the last 8 weeks. Two weeks met the target, including this one.",
  periodHeading: "Week of",
  valueHeading: "Reviewed within 2 days",
  points: [
    { label: "17 Aug", value: 68 },
    { label: "24 Aug", value: 71 },
    { label: "31 Aug", value: 66 },
    { label: "7 Sep", value: 73 },
    { label: "14 Sep", value: 77 },
    { label: "21 Sep", value: 81 },
    { label: "28 Sep", value: 74 },
    { label: "This week", value: 82, current: true },
  ],
  target: { value: 80, label: "Dashed line: target of 80%" },
};

export function DashboardOverviewExample(
  props: Partial<DashboardOverviewProps>,
) {
  return (
    <DashboardOverview
      // The preview supplies the page's h1, so the dashboard starts at h2.
      headingLevel={2}
      context="Northwind Notes · Research team"
      question="Are notes getting reviewed in time?"
      answer={
        <p>
          Mostly. 82% of notes shared this week were reviewed within 2 days,
          back above the 80% target, but 6 notes have now waited more than a
          week.
        </p>
      }
      period="Week of 5 October, compared with the week before. Updated 11 Oct, 09:40."
      metrics={metrics}
      attention={attention}
      trend={trend}
      loadingLabel="Loading review figures"
      footnote={
        <p>
          Demo data for Northwind Notes, a fictional product. A note counts as
          reviewed when someone other than its author leaves a review.
        </p>
      }
      {...props}
    />
  );
}

export default function DashboardOverviewDemo() {
  return <DashboardOverviewExample />;
}
