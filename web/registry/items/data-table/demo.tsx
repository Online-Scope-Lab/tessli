// Fictional product: Northwind Notes. Notes, notebooks, word counts and dates
// are invented for the demo and describe no real product or people.
import * as React from "react";

import { Button } from "@/registry/shadcn/ui/button";

import {
  DataTable,
  type DataTableColumn,
  type DataTableProps,
  type DataTableRow,
} from "./data-table";

export const columns: DataTableColumn[] = [
  { key: "title", label: "Note", sortable: true },
  { key: "notebook", label: "Notebook", sortable: true },
  { key: "status", label: "Status", sortable: true },
  { key: "words", label: "Words", type: "number", sortable: true },
  { key: "updated", label: "Updated", type: "date", sortable: true },
];

function note(
  id: string,
  title: string,
  notebook: string,
  status: string,
  words: number,
  updated: string,
): DataTableRow {
  return {
    id,
    href: `#note-${id}`,
    values: { title, notebook, status, words, updated },
  };
}

export const rows: DataTableRow[] = [
  note(
    "n01",
    "Interview: night-shift nurses",
    "Field research",
    "Final",
    2480,
    "2026-09-30",
  ),
  note(
    "n02",
    "Onboarding survey, open answers",
    "Field research",
    "In review",
    5120,
    "2026-09-28",
  ),
  note(
    "n03",
    "Q3 planning decisions",
    "Team meetings",
    "Final",
    940,
    "2026-09-26",
  ),
  note(
    "n04",
    "Offline sync: conflict cases",
    "Product specs",
    "Draft",
    1310,
    "2026-09-25",
  ),
  note(
    "n05",
    "Interview: warehouse leads",
    "Field research",
    "Draft",
    1875,
    "2026-09-23",
  ),
  note(
    "n06",
    "Weekly sync, 22 September",
    "Team meetings",
    "Final",
    410,
    "2026-09-22",
  ),
  note(
    "n07",
    "Export to Markdown: edge cases",
    "Product specs",
    "In review",
    2045,
    "2026-09-19",
  ),
  note(
    "n08",
    "Usability test, tablet layout",
    "Field research",
    "In review",
    3360,
    "2026-09-17",
  ),
  note("n09", "Pricing page copy ideas", "Drafts", "Draft", 620, "2026-09-15"),
  note(
    "n10",
    "Weekly sync, 15 September",
    "Team meetings",
    "Final",
    385,
    "2026-09-15",
  ),
  note(
    "n11",
    "Search ranking notes",
    "Product specs",
    "Draft",
    1590,
    "2026-09-11",
  ),
  note(
    "n12",
    "Diary study, week one summary",
    "Field research",
    "Final",
    2710,
    "2026-09-08",
  ),
];

const fullWidthOnPhones = "h-11 w-full px-5 sm:w-auto";

export function DataTableExample(
  props: Partial<
    Pick<
      DataTableProps,
      | "rows"
      | "status"
      | "defaultQuery"
      | "defaultFilter"
      | "error"
      | "errorLabel"
    >
  >,
) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <DataTable
        title="All notes"
        description="Every note you can edit, across your notebooks. Open a note to read or change it."
        actions={
          <Button size="lg" className={fullWidthOnPhones}>
            New note
          </Button>
        }
        columns={columns}
        rows={rows}
        noun={{ one: "note", other: "notes" }}
        search={{
          keys: ["title", "notebook"],
          label: "Search notes",
          scope: "note titles and notebook names",
        }}
        filter={{
          key: "status",
          label: "Status",
          allLabel: "Any status",
          options: ["Draft", "In review", "Final"],
        }}
        defaultSort={{ key: "updated", direction: "descending" }}
        empty={{
          title: "No notes yet",
          description:
            "Notes you write or import appear here with their notebook, status and last edit. Markdown and plain-text files keep their headings and links.",
          action: (
            <Button size="lg" variant="outline" className={fullWidthOnPhones}>
              Import Markdown files
            </Button>
          ),
        }}
        {...props}
      />
    </div>
  );
}

export default function DataTableDemo() {
  return <DataTableExample />;
}
