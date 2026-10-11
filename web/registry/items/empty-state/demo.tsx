// Fictional product: Northwind Notes. No real brand, data or metrics.
import * as React from "react";

import { Button } from "@/registry/shadcn/ui/button";

import { EmptyState } from "./empty-state";

const actionClass = "h-11 w-full px-5 sm:w-auto";

/** The notebook frame the empty state sits in, so the preview shows context. */
export function NotebookFrame({
  query,
  children,
}: {
  query?: string;
  children: React.ReactNode;
}) {
  const searchId = React.useId();
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Northwind Notes</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            Field research
          </h2>
        </div>
        <div className="w-full sm:w-64">
          <label htmlFor={searchId} className="sr-only">
            Search this notebook
          </label>
          <input
            id={searchId}
            type="search"
            defaultValue={query}
            placeholder="Search this notebook"
            className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          />
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}

export default function EmptyStateDemo() {
  return (
    <NotebookFrame>
      <EmptyState
        headingLevel={3}
        title="No notes in Field research yet"
        description="Notes you write or import into this notebook appear here, newest first. Markdown and plain-text files keep their headings and links."
        actions={
          <>
            <Button size="lg" className={actionClass}>
              Write a note
            </Button>
            <Button size="lg" variant="outline" className={actionClass}>
              Import files
            </Button>
          </>
        }
      />
    </NotebookFrame>
  );
}
