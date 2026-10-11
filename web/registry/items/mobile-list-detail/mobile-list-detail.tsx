"use client";

import * as React from "react";

import { cn } from "@/registry/shadcn/lib/utils";
import { Button } from "@/registry/shadcn/ui/button";

export type MobileListDetailItem = {
  /** Stable id; used to keep the selection and to return focus to the row. */
  id: string;
  /** What the record is called. Shown in the row and as the detail heading. */
  title: string;
  /** One short, scannable fact beside the title in the row: "6 Oct". */
  meta?: string;
  /** One or two lines from the content, so people can tell rows apart. */
  summary?: string;
  /** Facts shown at the top of the detail view, as label and value pairs. */
  details?: { label: string; value: React.ReactNode }[];
  /** The full content of the detail view. */
  body: React.ReactNode;
};

type Message = {
  /** Says what happened, in the user's words. */
  title: React.ReactNode;
  description?: React.ReactNode;
  /** One way forward: a link or button. */
  action?: React.ReactNode;
};

export type MobileListDetailProps = Omit<
  React.ComponentProps<"section">,
  "title"
> & {
  /** The list's name: the notebook, folder or inbox people are in. */
  title: React.ReactNode;
  /** Optional one line under the title. Keep it short; phones show it too. */
  description?: React.ReactNode;
  items: MobileListDetailItem[];
  /** Used for the count beside the title: "5 notes". */
  itemNoun?: { one: string; other: string };
  /** Visible text of the back button on phones. Name where it goes. */
  backLabel?: string;
  /** The record shown first. On wide screens the first item is shown if unset. */
  initialSelectedId?: string;
  /** Which view a phone shows first. Defaults to the list. */
  initialView?: "list" | "detail";
  /** 1 when this is the page's main heading; the detail heading is one deeper. */
  headingLevel?: 1 | 2;
  /** Shown instead of the list when there are no items. */
  empty?: Message;
  /** Shown instead of the list when the items could not load. */
  error?: Message & { label?: string };
};

// Matches Tailwind's `md` breakpoint (48rem), where the layout becomes two
// panes. Change both together if your project uses another breakpoint.
const WIDE_QUERY = "(min-width: 48rem)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(WIDE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function useIsWide() {
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(WIDE_QUERY).matches,
    () => false,
  );
}

export function MobileListDetail({
  title,
  description,
  items,
  itemNoun = { one: "item", other: "items" },
  backLabel = "Back to list",
  initialSelectedId,
  initialView = "list",
  headingLevel = 1,
  empty,
  error,
  className,
  ...props
}: MobileListDetailProps) {
  const id = React.useId();
  const headingId = `${id}-heading`;
  const detailHeadingId = `${id}-detail`;
  const Heading = `h${headingLevel}` as const;
  const DetailHeading = `h${headingLevel + 1}` as "h2" | "h3";

  const isWide = useIsWide();
  const [selectedId, setSelectedId] = React.useState<string | null>(
    initialSelectedId ?? null,
  );
  const [view, setView] = React.useState<"list" | "detail">(
    initialSelectedId ? initialView : "list",
  );
  const [announcement, setAnnouncement] = React.useState("");

  const rowRefs = React.useRef(new Map<string, HTMLButtonElement>());
  const detailHeadingRef = React.useRef<HTMLHeadingElement>(null);
  const pendingFocus = React.useRef<"detail" | "list" | null>(null);

  // Wide screens always show a record; phones show one only once it is opened.
  const shown =
    items.find((item) => item.id === selectedId) ?? items[0] ?? null;
  const currentId = isWide ? (shown?.id ?? null) : selectedId;
  const status = error ? "error" : items.length === 0 ? "empty" : "ready";
  const showDetail = status === "ready" && view === "detail";

  // Move focus after the view has changed, so it never lands on a hidden pane.
  React.useEffect(() => {
    const target = pendingFocus.current;
    pendingFocus.current = null;
    if (target === "detail") detailHeadingRef.current?.focus();
    if (target === "list" && selectedId) {
      rowRefs.current.get(selectedId)?.focus();
    }
  }, [view, selectedId]);

  function open(item: MobileListDetailItem) {
    setSelectedId(item.id);
    setView("detail");
    if (isWide) {
      // The list stays in view, so keep focus on the row and announce the change.
      setAnnouncement(`Showing ${item.title}`);
    } else {
      pendingFocus.current = "detail";
    }
  }

  function back() {
    pendingFocus.current = "list";
    setView("list");
  }

  const message =
    status === "error" ? error : status === "empty" ? empty : null;

  return (
    <section
      aria-labelledby={headingId}
      data-slot="mobile-list-detail"
      data-view={showDetail ? "detail" : "list"}
      className={cn("bg-background text-foreground", className)}
      {...props}
    >
      <div className="mx-auto w-full max-w-6xl md:px-6 md:py-10 lg:px-8 lg:py-12">
        <div className="md:overflow-hidden md:bg-card md:text-card-foreground md:rounded-lg md:border md:border-border">
          <header
            className={cn(
              "flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border px-4 py-4 md:px-6",
              // On a phone's detail view the back button names the list, so
              // the header is only kept for screen readers' heading outline.
              showDetail && "max-md:sr-only",
            )}
          >
            <div className="min-w-0">
              <Heading
                id={headingId}
                className="text-xl leading-tight font-semibold tracking-tight text-balance sm:text-2xl"
              >
                {title}
              </Heading>
              {description ? (
                <p className="mt-1 max-w-prose text-sm leading-relaxed text-pretty text-muted-foreground">
                  {description}
                </p>
              ) : null}
            </div>
            {status === "ready" ? (
              <p className="text-sm text-muted-foreground tabular-nums">
                {items.length}{" "}
                {items.length === 1 ? itemNoun.one : itemNoun.other}
              </p>
            ) : null}
          </header>

          {message ? (
            <div
              className={cn(
                "px-4 py-10 md:px-6 md:py-16",
                status === "error" && "border-l-4 border-destructive",
              )}
            >
              <div className="max-w-prose">
                <DetailHeading className="text-lg leading-snug font-semibold tracking-tight text-balance">
                  {status === "error" ? (
                    <span className="mb-1 block text-sm font-semibold text-destructive">
                      {error?.label ?? "Error"}
                    </span>
                  ) : null}
                  {message.title}
                </DetailHeading>
                {message.description ? (
                  <div className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">
                    {message.description}
                  </div>
                ) : null}
                {message.action ? (
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                    {message.action}
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="md:grid md:grid-cols-[minmax(15rem,20rem)_minmax(0,1fr)] lg:grid-cols-[22rem_minmax(0,1fr)]">
              <ul
                aria-labelledby={headingId}
                className={cn(
                  "divide-y divide-border border-b border-border md:border-r md:border-b-0",
                  showDetail && "max-md:hidden",
                )}
              >
                {items.map((item) => {
                  const current = item.id === currentId;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        ref={(node) => {
                          if (node) rowRefs.current.set(item.id, node);
                          else rowRefs.current.delete(item.id);
                        }}
                        aria-current={current ? "true" : undefined}
                        onClick={() => open(item)}
                        className={cn(
                          "relative flex min-h-11 w-full flex-col items-start gap-1 px-4 py-3.5 text-left outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset md:px-5",
                          // Selection is a bar and a fill, not colour alone.
                          "before:absolute before:inset-y-0 before:left-0 before:w-1",
                          current && "bg-muted before:bg-foreground",
                        )}
                      >
                        <span className="flex w-full items-baseline justify-between gap-3">
                          <span
                            className={cn(
                              "min-w-0 text-base leading-snug break-words",
                              current ? "font-semibold" : "font-medium",
                            )}
                          >
                            {item.title}
                          </span>
                          {item.meta ? (
                            <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                              {item.meta}
                            </span>
                          ) : null}
                        </span>
                        {item.summary ? (
                          <span className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                            {item.summary}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>

              {shown ? (
                <article
                  aria-labelledby={detailHeadingId}
                  className={cn(
                    "min-w-0 px-4 pt-2 pb-10 md:px-8 md:py-8 lg:px-10",
                    !showDetail && "max-md:hidden",
                  )}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={back}
                    className="-ml-3 h-11 px-3 md:hidden"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M10 3 5 8l5 5" />
                    </svg>
                    {backLabel}
                  </Button>

                  <DetailHeading
                    id={detailHeadingId}
                    ref={detailHeadingRef}
                    tabIndex={-1}
                    className="mt-4 text-xl leading-tight font-semibold tracking-tight text-balance outline-none sm:text-2xl md:mt-0"
                  >
                    {shown.title}
                  </DetailHeading>

                  {shown.details?.length ? (
                    <dl className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-1 text-sm">
                      {shown.details.map((detail) => (
                        <React.Fragment key={detail.label}>
                          <dt className="text-muted-foreground">
                            {detail.label}
                          </dt>
                          <dd className="min-w-0 break-words">
                            {detail.value}
                          </dd>
                        </React.Fragment>
                      ))}
                    </dl>
                  ) : null}

                  <div className="mt-6 max-w-prose space-y-4 border-t border-border pt-6 text-base leading-relaxed text-pretty [&_li]:ml-5 [&_ul]:list-disc [&_ul]:space-y-1">
                    {shown.body}
                  </div>
                </article>
              ) : null}
            </div>
          )}
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </section>
  );
}
