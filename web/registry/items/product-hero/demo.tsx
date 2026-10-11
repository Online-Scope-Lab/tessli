// Fictional product: Northwind Notes. The people, notebooks and notes are
// invented for the demo; nothing here describes a real product or customer.
import { ProductHero, ProductWindow } from "./product-hero";

type Notebook = { name: string; count: number; current?: boolean };
type Note = {
  title: string;
  excerpt: string;
  meta: string;
  current?: boolean;
};

const notebooks: Notebook[] = [
  { name: "Field research", count: 12, current: true },
  { name: "Product decisions", count: 8 },
  { name: "Meeting notes", count: 31 },
  { name: "Onboarding", count: 5 },
];

const notes: Note[] = [
  {
    title: "Interview: warehouse shift leads",
    excerpt: "Paper checklists still win on the floor because they survive…",
    meta: "Ana · Edited today",
    current: true,
  },
  {
    title: "Synthesis: returns process",
    excerpt: "Three handoffs where items go missing between bays…",
    meta: "Kofi · Yesterday",
  },
  {
    title: "Interview: regional buyers",
    excerpt: "Buyers plan in spreadsheets they share by email…",
    meta: "Ana · Monday",
  },
  {
    title: "Open questions for the pilot",
    excerpt: "Who owns the scanner budget once the trial ends?",
    meta: "Lena · 3 Oct",
  },
  {
    title: "Field visit checklist",
    excerpt: "Consent forms, spare batteries, the floor plan…",
    meta: "Kofi · 28 Sep",
  },
];

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <circle cx="7" cy="7" r="4.5" />
      <path d="m10.5 10.5 3 3" />
    </svg>
  );
}

/**
 * The notebook view of the fictional product, composed from tokens. It
 * recomposes with the frame's width: the list alone on phones, the list and
 * the open note from 36rem, and the notebooks column from 56rem.
 */
function NotebookView() {
  return (
    <div className="grid text-left @xl:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] @4xl:grid-cols-[11rem_minmax(0,17rem)_minmax(0,1fr)]">
      <div className="hidden border-r border-border p-3 @4xl:block">
        <p className="px-2 pt-1 pb-2 text-xs font-medium text-muted-foreground">
          Notebooks
        </p>
        <ul className="grid gap-0.5">
          {notebooks.map((notebook) => (
            <li
              key={notebook.name}
              className={
                notebook.current
                  ? "flex items-center justify-between gap-2 rounded-md border-l-2 border-foreground bg-muted px-2 py-1.5 text-sm font-medium"
                  : "flex items-center justify-between gap-2 rounded-md border-l-2 border-transparent px-2 py-1.5 text-sm text-muted-foreground"
              }
            >
              <span className="truncate">{notebook.name}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {notebook.count}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="min-w-0 @xl:border-r @xl:border-border">
        <div className="border-b border-border px-4 pt-4 pb-3">
          <div className="flex items-baseline justify-between gap-3">
            <p className="truncate text-sm font-semibold">Field research</p>
            <p className="shrink-0 text-xs text-muted-foreground tabular-nums">
              12 notes
            </p>
          </div>
          <div className="mt-3 flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground">
            <SearchIcon />
            <span className="truncate">Search titles, text and authors</span>
          </div>
        </div>
        <ul className="divide-y divide-border">
          {notes.map((note) => (
            <li
              key={note.title}
              className={
                note.current
                  ? "border-l-2 border-foreground bg-muted px-4 py-3"
                  : "border-l-2 border-transparent px-4 py-3"
              }
            >
              <p className="truncate text-sm font-medium">{note.title}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {note.excerpt}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{note.meta}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="hidden min-w-0 p-6 @xl:block">
        <div className="flex items-center justify-between gap-4">
          <p className="truncate text-xs text-muted-foreground">
            Field research
          </p>
          <span className="inline-flex h-8 shrink-0 items-center rounded-md border border-border px-3 text-xs font-medium">
            Export as Markdown
          </span>
        </div>
        <p className="mt-4 text-lg leading-snug font-semibold tracking-tight">
          Interview: warehouse shift leads
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Edited today by Ana · Linked from 2 notes
        </p>
        <div className="mt-4 max-w-prose space-y-3 text-sm leading-relaxed">
          <p>
            Paper checklists still win on the floor because they survive a
            dropped scanner and nobody has to log in to read them.
          </p>
          <p>
            Both leads asked for the same thing: see what the previous shift
            left unfinished before the first truck arrives.
          </p>
        </div>
        <div className="mt-6 border-t border-border pt-4">
          <p className="text-xs font-medium text-muted-foreground">
            Linked from
          </p>
          <ul className="mt-2 grid gap-1.5 text-sm">
            <li className="truncate underline decoration-muted-foreground underline-offset-4">
              Synthesis: returns process
            </li>
            <li className="truncate underline decoration-muted-foreground underline-offset-4">
              Open questions for the pilot
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function ProductHeroDemo() {
  return (
    <ProductHero
      // The preview page already has its own h1. On a landing page, leave
      // headingLevel at its default (1): the hero holds the page title.
      headingLevel={2}
      title="Team notes that stay findable after the meeting"
      description="Northwind Notes keeps every notebook searchable by title, text and author, shows which notes link to each other, and exports everything as Markdown whenever you want to leave."
      primaryAction={{ label: "Start a free notebook", href: "#start" }}
      secondaryAction={{ label: "See how search works", href: "#search" }}
      note="Free for one person. No card needed."
      product={
        <ProductWindow
          label="Northwind Notes · Field research"
          caption="The Field research notebook in Northwind Notes, a fictional product made up for this demo."
        >
          <NotebookView />
        </ProductWindow>
      }
    />
  );
}
