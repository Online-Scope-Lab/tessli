// Fictional product: Northwind Notes. No real brand, person or data.
import { buttonVariants } from "@/registry/shadcn/ui/button";
import { cn } from "@/registry/shadcn/lib/utils";

import { MobileListDetailExample } from "./demo";

/** A note opened: phones show the detail view with its back button. */
function Detail() {
  return (
    <MobileListDetailExample
      initialSelectedId="harbour-road-checklist"
      initialView="detail"
    />
  );
}

/** First use: the notebook has no notes yet. */
function Empty() {
  return <MobileListDetailExample items={[]} />;
}

/** The list failed to load: say what failed, what is safe, and how to retry. */
function LoadError() {
  return (
    <MobileListDetailExample
      error={{
        label: "Error",
        title: "Field research didn’t load",
        description: (
          <p>
            Northwind Notes couldn’t reach the server. Nothing was changed, and
            notes you edited offline are still on this device.
          </p>
        ),
        action: (
          <a
            href=""
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-11 w-full px-5 sm:w-auto",
            )}
          >
            Try loading again
          </a>
        ),
      }}
    />
  );
}

export const states = {
  detail: Detail,
  empty: Empty,
  error: LoadError,
};
