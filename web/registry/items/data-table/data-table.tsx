"use client";

import * as React from "react";

import { cn } from "@/registry/shadcn/lib/utils";
import { Button } from "@/registry/shadcn/ui/button";

type HeadingLevel = 2 | 3 | 4;
type CellValue = string | number | null;
type SortDirection = "ascending" | "descending";

export type DataTableColumn = {
  /** Key into each row's `values`. */
  key: string;
  /** Header text. Short nouns: "Status", "Words", "Updated". */
  label: string;
  /**
   * `text` sorts alphabetically; `number` right-aligns in tabular figures;
   * `date` takes an ISO date ("2026-09-14") and formats it for `locale`.
   */
  type?: "text" | "number" | "date";
  /** Adds a sort button to the header. */
  sortable?: boolean;
};

export type DataTableRow = {
  /** Stable id: used as the React key. */
  id: string;
  /** Where the row's first cell links to. Omit for rows with no detail page. */
  href?: string;
  values: Record<string, CellValue>;
};

export type DataTableMessage = {
  /** Says what happened, in the user's words: "No notes in Field research yet". */
  title: React.ReactNode;
  /** Why, what is safe, and what will appear here. */
  description?: React.ReactNode;
  /** One next step. In the error state, the retry. */
  action?: React.ReactNode;
};

export type DataTableProps = Omit<React.ComponentProps<"section">, "title"> & {
  /** Names the data, not the widget: "Notes in Field research". */
  title: React.ReactNode;
  description?: React.ReactNode;
  headingLevel?: HeadingLevel;
  /** The page's one primary action for this data, e.g. "New note". */
  actions?: React.ReactNode;
  /** The first column is the row header; it links to `row.href` and stays in view when the table scrolls sideways. */
  columns: DataTableColumn[];
  rows: DataTableRow[];
  /** What a row is, for the result count: { one: "note", other: "notes" }. */
  noun: { one: string; other: string };
  /** `loading` keeps the layout with placeholder rows; `error` replaces the rows with `error`. */
  status?: "ready" | "loading" | "error";
  /** Column keys the search box matches, and how to describe them. */
  search: { keys: string[]; label: string; scope: string };
  /**
   * One column to filter by. `options` sets their order (for example the
   * order a status moves through); without it, the column's distinct values
   * are listed alphabetically.
   */
  filter?: { key: string; label: string; allLabel: string; options?: string[] };
  defaultSort?: { key: string; direction: SortDirection };
  defaultQuery?: string;
  defaultFilter?: string;
  /** First use: there are no rows at all. */
  empty: DataTableMessage;
  /** Loading failed. Say what failed and what is still safe; offer a retry. */
  error?: DataTableMessage;
  /** Shown before the error title so the state never relies on colour. */
  errorLabel?: string;
  locale?: string;
  /** Placeholder rows while loading. Match a typical page so nothing jumps. */
  loadingRows?: number;
};

function formatCell(
  value: CellValue,
  type: DataTableColumn["type"],
  locale: string,
) {
  if (value === null || value === "") return "—";
  if (type === "number" && typeof value === "number") {
    return new Intl.NumberFormat(locale).format(value);
  }
  if (type === "date" && typeof value === "string") {
    const date = new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);
  }
  return String(value);
}

function compareValues(a: CellValue, b: CellValue, locale: string) {
  // Empty values sort last in both directions; the caller flips the rest.
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), locale, { numeric: true });
}

function SortIcon({ direction }: { direction?: SortDirection }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className={cn(
        "size-3.5 shrink-0",
        direction ? "text-foreground" : "text-muted-foreground",
      )}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {direction !== "descending" ? <path d="M5 6.5 8 3.5l3 3" /> : null}
      {direction !== "ascending" ? <path d="m5 9.5 3 3 3-3" /> : null}
    </svg>
  );
}

export function DataTable({
  title,
  description,
  headingLevel = 2,
  actions,
  columns,
  rows,
  noun,
  status = "ready",
  search,
  filter,
  defaultSort,
  defaultQuery = "",
  defaultFilter = "",
  empty,
  error,
  errorLabel = "Error",
  locale = "en-US",
  loadingRows = 6,
  className,
  ...props
}: DataTableProps) {
  const id = React.useId();
  const headingId = `${id}-heading`;
  const searchId = `${id}-search`;
  const filterId = `${id}-filter`;
  const Heading = `h${headingLevel}` as const;
  const MessageHeading = `h${Math.min(headingLevel + 1, 6)}` as "h3";

  const [query, setQuery] = React.useState(defaultQuery);
  const [filterValue, setFilterValue] = React.useState(defaultFilter);
  const [sort, setSort] = React.useState(defaultSort);
  const searchRef = React.useRef<HTMLInputElement>(null);

  // Show a scroll hint and make the region focusable only when the table is
  // wider than its container.
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = React.useState(false);
  React.useEffect(() => {
    const element = scrollRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const measure = () =>
      setOverflowing(element.scrollWidth > element.clientWidth + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const filterOptions = React.useMemo(() => {
    if (!filter) return [];
    if (filter.options) return filter.options;
    const seen = new Set<string>();
    for (const row of rows) {
      const value = row.values[filter.key];
      if (value !== null && value !== "") seen.add(String(value));
    }
    return [...seen].sort((a, b) => a.localeCompare(b, locale));
  }, [filter, rows, locale]);

  const visibleRows = React.useMemo(() => {
    const needle = query.trim().toLocaleLowerCase(locale);
    const matching = rows.filter((row) => {
      if (
        filter &&
        filterValue &&
        String(row.values[filter.key]) !== filterValue
      ) {
        return false;
      }
      if (!needle) return true;
      return search.keys.some((key) =>
        String(row.values[key] ?? "")
          .toLocaleLowerCase(locale)
          .includes(needle),
      );
    });
    if (!sort) return matching;
    const flip = sort.direction === "ascending" ? 1 : -1;
    return [...matching].sort((a, b) => {
      const left = a.values[sort.key] ?? null;
      const right = b.values[sort.key] ?? null;
      if (left === null || right === null) {
        return left === right ? 0 : left === null ? 1 : -1;
      }
      return compareValues(left, right, locale) * flip;
    });
  }, [rows, query, filter, filterValue, search.keys, sort, locale]);

  const isLoading = status === "loading";
  const isError = status === "error";
  const isEmpty = status === "ready" && rows.length === 0;
  const isFiltered = query.trim() !== "" || filterValue !== "";
  const noResults =
    status === "ready" && rows.length > 0 && visibleRows.length === 0;
  const controlsDisabled = isLoading || isError || isEmpty;

  const countText = isLoading
    ? `Loading ${noun.other}…`
    : isError
      ? `${noun.other.charAt(0).toUpperCase()}${noun.other.slice(1)} didn’t load`
      : isEmpty
        ? `No ${noun.other} yet`
        : isFiltered
          ? `Showing ${visibleRows.length} of ${rows.length} ${rows.length === 1 ? noun.one : noun.other}`
          : `${rows.length} ${rows.length === 1 ? noun.one : noun.other}`;

  function clearFilters() {
    setQuery("");
    setFilterValue("");
    // The button that was focused disappears; put focus somewhere useful.
    searchRef.current?.focus();
  }

  function toggleSort(key: string) {
    setSort((current) =>
      current?.key === key && current.direction === "ascending"
        ? { key, direction: "descending" }
        : { key, direction: "ascending" },
    );
  }

  const filterDescription =
    filter && filterValue ? `${filter.label}: ${filterValue}` : "";

  const message: (DataTableMessage & { kind: string }) | null = isError
    ? {
        kind: "error",
        title: error?.title ?? countText,
        description: error?.description,
        action: error?.action,
      }
    : isEmpty
      ? { kind: "empty", ...empty }
      : noResults
        ? {
            kind: "no-results",
            title: query.trim() ? (
              <>
                No {noun.other} match <q>{query.trim()}</q>
              </>
            ) : (
              `No ${noun.other} match these filters`
            ),
            description: `Search covers ${search.scope}${
              filterDescription ? `, filtered to ${filterDescription}` : ""
            }. Check the spelling or clear the filters to see all ${rows.length} ${noun.other}.`,
            action: (
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-11 w-full px-5 sm:w-auto"
                onClick={clearFilters}
              >
                Clear search and filters
              </Button>
            ),
          }
        : null;

  const cellBase = "border-b border-border px-3 text-left align-middle";
  const stickyCell =
    "sticky left-0 z-10 group-data-[overflowing=true]/table:border-r";

  return (
    <section
      aria-labelledby={headingId}
      data-slot="data-table"
      data-status={status}
      className={cn("text-foreground", className)}
      {...props}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-prose">
          <Heading
            id={headingId}
            className="text-2xl leading-tight font-semibold tracking-tight text-balance"
          >
            {title}
          </Heading>
          {description ? (
            <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            {actions}
          </div>
        ) : null}
      </div>

      <form
        role="search"
        aria-label={`Filter ${noun.other}`}
        onSubmit={(event) => event.preventDefault()}
        className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,20rem)_minmax(0,12rem)] sm:items-end"
      >
        <div className="grid gap-1.5">
          <label htmlFor={searchId} className="text-sm font-medium">
            {search.label}
          </label>
          <input
            ref={searchRef}
            id={searchId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            disabled={controlsDisabled}
            autoComplete="off"
            className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        {filter ? (
          <div className="grid gap-1.5">
            <label htmlFor={filterId} className="text-sm font-medium">
              {filter.label}
            </label>
            <select
              id={filterId}
              value={filterValue}
              onChange={(event) => setFilterValue(event.target.value)}
              disabled={controlsDisabled}
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">{filter.allLabel}</option>
              {filterOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </form>

      <p
        role="status"
        aria-live="polite"
        className="mt-4 min-h-5 text-sm text-muted-foreground tabular-nums"
      >
        {countText}
      </p>

      <div
        data-overflowing={overflowing}
        className="group/table mt-2 overflow-hidden rounded-lg border border-border bg-card text-card-foreground"
      >
        <div
          ref={scrollRef}
          role={overflowing ? "region" : undefined}
          aria-label={
            overflowing ? `Table of ${noun.other}, scrolls sideways` : undefined
          }
          tabIndex={overflowing ? 0 : undefined}
          className="overflow-x-auto focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-inset"
        >
          <table
            aria-labelledby={headingId}
            aria-busy={isLoading || undefined}
            className="w-full min-w-[40rem] border-separate border-spacing-0 text-sm"
          >
            <thead>
              <tr>
                {columns.map((column, index) => {
                  const numeric = column.type === "number";
                  const direction =
                    sort?.key === column.key ? sort.direction : undefined;
                  return (
                    <th
                      key={column.key}
                      scope="col"
                      aria-sort={direction}
                      className={cn(
                        cellBase,
                        "h-11 bg-muted py-0 font-medium whitespace-nowrap text-muted-foreground",
                        numeric && "text-right",
                        index === 0 && stickyCell,
                      )}
                    >
                      {column.sortable ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(column.key)}
                          disabled={controlsDisabled}
                          className={cn(
                            "-mx-2 inline-flex min-h-11 items-center gap-1.5 rounded-sm px-2 font-medium outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-default disabled:hover:text-muted-foreground",
                            numeric && "flex-row-reverse",
                            direction && "text-foreground",
                          )}
                        >
                          {column.label}
                          <SortIcon direction={direction} />
                        </button>
                      ) : (
                        column.label
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: loadingRows }, (_, rowIndex) => (
                    <tr key={rowIndex} aria-hidden="true">
                      {columns.map((column, index) => (
                        <td
                          key={column.key}
                          className={cn(
                            cellBase,
                            "h-11 bg-card",
                            index === 0 && stickyCell,
                            rowIndex === loadingRows - 1 && "border-b-0",
                          )}
                        >
                          <span
                            className={cn(
                              "block h-3 rounded-sm bg-accent",
                              column.type === "number" && "ml-auto",
                              index === 0
                                ? ["w-4/5", "w-3/5", "w-2/3"][rowIndex % 3]
                                : "w-16",
                            )}
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                : message
                  ? null
                  : visibleRows.map((row, rowIndex) => (
                      <tr key={row.id}>
                        {columns.map((column, index) => {
                          const value = formatCell(
                            row.values[column.key] ?? null,
                            column.type,
                            locale,
                          );
                          const last = rowIndex === visibleRows.length - 1;
                          const classes = cn(
                            cellBase,
                            "h-11 bg-card py-1.5",
                            column.type === "number" &&
                              "text-right tabular-nums",
                            column.type === "date" &&
                              "whitespace-nowrap tabular-nums",
                            last && "border-b-0",
                          );
                          if (index === 0) {
                            return (
                              <th
                                key={column.key}
                                scope="row"
                                className={cn(
                                  classes,
                                  stickyCell,
                                  "min-w-40 py-0 font-medium sm:min-w-56",
                                )}
                              >
                                {row.href ? (
                                  <a
                                    href={row.href}
                                    className="-mx-1 inline-flex min-h-11 items-center rounded-sm px-1 underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                  >
                                    {value}
                                  </a>
                                ) : (
                                  value
                                )}
                              </th>
                            );
                          }
                          return (
                            <td
                              key={column.key}
                              className={cn(
                                classes,
                                "whitespace-nowrap",
                                column.type === undefined ||
                                  column.type === "text"
                                  ? "text-muted-foreground"
                                  : null,
                              )}
                            >
                              {value}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
            </tbody>
          </table>
        </div>

        {message ? (
          <div data-message={message.kind} className="px-4 py-8 sm:px-6">
            <div className="max-w-prose">
              <MessageHeading className="text-base leading-snug font-semibold text-balance">
                {message.kind === "error" ? (
                  <span className="mb-1 block text-sm font-semibold text-destructive">
                    {errorLabel}
                  </span>
                ) : null}
                {message.title}
              </MessageHeading>
              {message.description ? (
                <div className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">
                  {message.description}
                </div>
              ) : null}
            </div>
            {message.action ? (
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                {message.action}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <p
        aria-hidden="true"
        className={cn(
          "mt-2 text-sm text-muted-foreground",
          overflowing && !message ? "block" : "hidden",
        )}
      >
        Scroll the table sideways to see every column.
      </p>
    </section>
  );
}
