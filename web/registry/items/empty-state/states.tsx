// Fictional product: Northwind Notes. No real brand, data or metrics.
import { Button } from "@/registry/shadcn/ui/button";

import { NotebookFrame } from "./demo";
import { EmptyState } from "./empty-state";

const actionClass = "h-11 w-full px-5 sm:w-auto";
const query = "quartely review";

function NoResults() {
  return (
    <NotebookFrame query={query}>
      <EmptyState
        headingLevel={3}
        title={
          <>
            No notes match <q>{query}</q>
          </>
        }
        description="Search covers note titles and text in Field research only. Check the spelling, or search every notebook."
        actions={
          <>
            <Button size="lg" className={actionClass}>
              Search all notebooks
            </Button>
            <Button size="lg" variant="ghost" className={actionClass}>
              Clear search
            </Button>
          </>
        }
      />
    </NotebookFrame>
  );
}

function LoadError() {
  return (
    <NotebookFrame>
      <EmptyState
        headingLevel={3}
        variant="error"
        errorLabel="Couldn’t load notes"
        title="Field research didn’t load"
        description="Northwind Notes couldn’t reach its server. Nothing was deleted: your notes are still saved, and edits you make offline sync when you reconnect."
        actions={
          <>
            <Button size="lg" className={actionClass}>
              Try again
            </Button>
            <Button size="lg" variant="ghost" className={actionClass}>
              Work offline
            </Button>
          </>
        }
      />
    </NotebookFrame>
  );
}

/** Extra states, keyed by the names in notes.md `states` (after the first). */
export const states = {
  "no-results": NoResults,
  error: LoadError,
};
