// Fictional product: Northwind Notes. No real brand, person, data or metrics.
import { buttonVariants } from "@/registry/shadcn/ui/button";
import { cn } from "@/registry/shadcn/lib/utils";

import {
  MobileListDetail,
  type MobileListDetailItem,
  type MobileListDetailProps,
} from "./mobile-list-detail";

export const notes: MobileListDetailItem[] = [
  {
    id: "night-shift-interviews",
    title: "Interviews with night-shift leads",
    meta: "6 Oct",
    summary:
      "Handover happens on paper because the tablet app logs people out after ten minutes idle.",
    details: [
      { label: "Edited", value: "6 October, 22:40" },
      { label: "Notebook", value: "Field research" },
      { label: "Shared with", value: "Research team" },
    ],
    body: (
      <>
        <p>
          Four shift leads, interviewed in the break room between 01:00 and
          03:00. Every one of them hands over on paper, then types it up the
          next morning.
        </p>
        <p>
          The reason was the same each time: the tablet app logs people out
          after ten minutes idle, and signing back in with gloves on takes
          longer than writing the note by hand.
        </p>
        <ul>
          <li>Handover notes are short: who, which bay, what is blocked.</li>
          <li>Photos matter more than text for damaged stock.</li>
          <li>Nobody reads handover notes older than one shift.</li>
        </ul>
      </>
    ),
  },
  {
    id: "harbour-road-checklist",
    title: "Site visit checklist: Harbour Road depot",
    meta: "4 Oct",
    summary:
      "Confirm loading-bay access, where the Wi-Fi drops, and who can sign us in after 18:00.",
    details: [
      { label: "Edited", value: "4 October, 09:15" },
      { label: "Notebook", value: "Field research" },
      { label: "Shared with", value: "Research team" },
    ],
    body: (
      <>
        <p>
          Bring this list on the visit and tick items off in the note, so the
          next visit starts from what we already know.
        </p>
        <ul>
          <li>Loading-bay access: which door, and do we need a hi-vis vest?</li>
          <li>Where the Wi-Fi drops between the office and bay 6.</li>
          <li>Who can sign visitors in after 18:00.</li>
          <li>Whether we may photograph the handover board.</li>
        </ul>
      </>
    ),
  },
  {
    id: "pilot-open-questions",
    title: "Open questions before the pilot",
    meta: "2 Oct",
    summary:
      "Do we pilot on one shift or all three, and who owns the paper fallback if the app is down?",
    details: [
      { label: "Edited", value: "2 October, 16:05" },
      { label: "Notebook", value: "Field research" },
      { label: "Shared with", value: "Only you" },
    ],
    body: (
      <>
        <p>
          Three questions we cannot answer from the interviews alone. Each needs
          a decision from the depot manager before the pilot starts.
        </p>
        <ul>
          <li>Pilot on the night shift only, or on all three shifts?</li>
          <li>Who owns the paper fallback when the app is down?</li>
          <li>Do photos stay on the tablet, or sync to the shared notebook?</li>
        </ul>
      </>
    ),
  },
  {
    id: "weekly-sync-2-oct",
    title: "Weekly sync, 2 October",
    meta: "2 Oct",
    summary:
      "Agreed to share interview notes within a day, and to keep raw recordings off the shared drive.",
    details: [
      { label: "Edited", value: "2 October, 10:50" },
      { label: "Notebook", value: "Field research" },
      { label: "Shared with", value: "Research team" },
    ],
    body: (
      <>
        <p>Two decisions and one follow-up from this week’s sync.</p>
        <ul>
          <li>Interview notes are shared within one working day.</li>
          <li>Raw recordings stay off the shared drive.</li>
          <li>Follow-up: ask the depot manager about photo consent.</li>
        </ul>
      </>
    ),
  },
  {
    id: "survey-draft",
    title: "Survey draft, second pass",
    meta: "29 Sep",
    summary:
      "Cut from 22 questions to 9. Removed everything we can observe on the visit instead of asking.",
    details: [
      { label: "Edited", value: "29 September, 11:30" },
      { label: "Notebook", value: "Field research" },
      { label: "Shared with", value: "Research team" },
    ],
    body: (
      <>
        <p>
          The first draft asked 22 questions. This pass keeps 9 and removes
          anything we can see for ourselves on the site visit.
        </p>
        <p>
          Still to decide: whether the survey goes out before or after the
          visit. Before risks leading the interviews; after risks a lower
          response rate.
        </p>
      </>
    ),
  },
];

export function MobileListDetailExample(props: Partial<MobileListDetailProps>) {
  return (
    <MobileListDetail
      // The preview page already has its own h1. In an app, leave
      // headingLevel at its default (1): this is the page title.
      headingLevel={2}
      title="Field research"
      description="Notes from the Harbour Road depot study."
      items={notes}
      itemNoun={{ one: "note", other: "notes" }}
      backLabel="All notes"
      empty={{
        title: "No notes in Field research yet",
        description:
          "Notes you write or move into this notebook appear here, newest first.",
        action: (
          <a
            href="#new-note"
            className={cn(
              buttonVariants({ variant: "default" }),
              "h-11 w-full px-5 sm:w-auto",
            )}
          >
            Write the first note
          </a>
        ),
      }}
      {...props}
    />
  );
}

export default function MobileListDetailDemo() {
  return <MobileListDetailExample />;
}
