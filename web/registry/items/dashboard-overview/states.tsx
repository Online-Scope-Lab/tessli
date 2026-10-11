// Fictional product: Northwind Notes. No real brand, data or metrics.
import { Button, buttonVariants } from "@/registry/shadcn/ui/button";
import { cn } from "@/registry/shadcn/lib/utils";

import { actionClass, DashboardOverviewExample } from "./demo";

function Loading() {
  return <DashboardOverviewExample status="loading" />;
}

function Empty() {
  return (
    <DashboardOverviewExample
      status="empty"
      answer={
        <p>
          Not yet: nobody in the Research team has shared a note for review.
        </p>
      }
      period="Figures cover the last 8 weeks and update every hour."
      message={{
        title: "Review times start with the first shared note",
        description:
          "Once someone asks for a review from a note’s Share menu, this page shows how quickly notes are reviewed and which ones are waiting.",
        actions: (
          <>
            <a
              href="#share-a-note"
              className={cn(buttonVariants({ size: "lg" }), actionClass)}
            >
              Share a note for review
            </a>
            <a
              href="#how-reviews-work"
              className={cn(
                buttonVariants({ size: "lg", variant: "ghost" }),
                actionClass,
              )}
            >
              How reviews work
            </a>
          </>
        ),
      }}
    />
  );
}

function LoadError() {
  return (
    <DashboardOverviewExample
      status="error"
      answer={undefined}
      period="Week of 5 October. Figures last loaded 11 Oct, 08:10."
      message={{
        label: "Couldn’t load figures",
        title: "Review figures didn’t load",
        description:
          "Northwind Notes couldn’t reach its reporting service. Your notes and reviews are not affected; only this summary is missing. The review queue still works.",
        actions: (
          <>
            <Button size="lg" className={actionClass}>
              Try again
            </Button>
            <a
              href="#review-queue"
              className={cn(
                buttonVariants({ size: "lg", variant: "ghost" }),
                actionClass,
              )}
            >
              Open the review queue
            </a>
          </>
        ),
      }}
    />
  );
}

/** Extra states, keyed by the names in notes.md `states` (after the first). */
export const states = {
  loading: Loading,
  empty: Empty,
  error: LoadError,
};
