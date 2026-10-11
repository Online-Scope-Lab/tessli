// Fictional product: Northwind Notes. No real brand, data or metrics.
import { Button } from "@/registry/shadcn/ui/button";

import { DataTableExample } from "./demo";

function Loading() {
  return <DataTableExample status="loading" />;
}

function Empty() {
  return <DataTableExample rows={[]} />;
}

function NoResults() {
  return <DataTableExample defaultQuery="quartely" defaultFilter="Final" />;
}

function LoadError() {
  return (
    <DataTableExample
      status="error"
      errorLabel="Connection error"
      error={{
        title: "Your notes didn’t load",
        description:
          "Northwind Notes couldn’t reach its server. Nothing was changed or deleted: your notes are still saved, and edits made offline sync when you reconnect.",
        action: (
          <Button
            size="lg"
            variant="outline"
            className="h-11 w-full px-5 sm:w-auto"
          >
            Try again
          </Button>
        ),
      }}
    />
  );
}

/** Extra states, keyed by the names in notes.md `states` (after the first). */
export const states = {
  loading: Loading,
  empty: Empty,
  "no-results": NoResults,
  error: LoadError,
};
