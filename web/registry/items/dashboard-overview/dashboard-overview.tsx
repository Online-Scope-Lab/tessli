import * as React from "react";

import { cn } from "@/registry/shadcn/lib/utils";

export type DashboardStatus = "ready" | "loading" | "empty" | "error";

export type DashboardMetric = {
  id: string;
  /** What is measured, in plain words: "Reviewed within 2 days". */
  label: string;
  /** The current value, formatted: "82%", "14 notes", "1.4 days". */
  value: React.ReactNode;
  /**
   * The change against a named baseline, in words that say which way is
   * better: "Up 8 points from 74% last week", "0.5 days faster than last
   * week". Never a bare "+8%" in green.
   */
  comparison?: React.ReactNode;
  /** A target, definition or caveat: "Target: 80% or more". */
  context?: React.ReactNode;
};

export type AttentionItem = {
  id: string;
  /** The thing that needs attention, named as people know it. */
  title: React.ReactNode;
  /** Where to deal with it. Each row is one link. */
  href: string;
  /** Where it lives and who it belongs to: "Field research · Priya N." */
  detail?: React.ReactNode;
  /** A short status written as text, e.g. "Unassigned". */
  flag?: string;
  /** How long, how much or how late, formatted: "9 days". */
  measure: React.ReactNode;
};

export type DashboardAttention = {
  /** Says what the list holds: "Waiting more than a week". */
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Longest-waiting or highest-impact first. Show five at most. */
  items: AttentionItem[];
  /** Read before each row's measure by screen readers, e.g. "Waiting". */
  measureLabel?: string;
  /** Shown when items is empty: say that nothing needs attention, and why. */
  emptyText?: React.ReactNode;
  /** The one action that clears the list. The page's only primary button. */
  action?: React.ReactNode;
  /** The full list, when there are more items than shown. */
  moreLink?: { label: string; href: string };
};

export type TrendPoint = {
  /** The period: "14 Sep", "This week". */
  label: string;
  value: number;
  /** The value as written in text; defaults to value + unit. */
  display?: string;
  /** Marks the period the metrics describe. Shown in bold text, not colour. */
  current?: boolean;
};

export type DashboardTrend = {
  /** Make the point: "Above target for three weeks running". */
  title: React.ReactNode;
  /** One sentence that states what the chart shows, for everyone. */
  description?: React.ReactNode;
  /** Column heading for the periods. */
  periodHeading?: string;
  /** Column heading for the values: "Reviewed within 2 days". */
  valueHeading: string;
  /** Oldest first. Eight to twelve periods read well. */
  points: TrendPoint[];
  /** The value at the full bar width. Defaults to 100. */
  max?: number;
  unit?: string;
  /** Drawn as a dashed line and named in text below the chart. */
  target?: { value: number; label: React.ReactNode };
};

export type DashboardMessage = {
  /** Shown before the title for errors, in text: "Couldn’t load figures". */
  label?: string;
  title: React.ReactNode;
  /** Empty: why and what next. Error: what failed and what is still safe. */
  description?: React.ReactNode;
  /** One primary action, at most one secondary. */
  actions?: React.ReactNode;
};

export type DashboardOverviewProps = Omit<
  React.ComponentProps<"div">,
  "title"
> & {
  /** Product or area, shown small above the question. */
  context?: React.ReactNode;
  /** The one question this dashboard answers. Rendered as the page heading. */
  question: React.ReactNode;
  /** The answer in one or two sentences, answer first. */
  answer?: React.ReactNode;
  /** The period, the comparison baseline and when the data was updated. */
  period?: React.ReactNode;
  status?: DashboardStatus;
  /** Two or three metrics. Labels stay visible while values load. */
  metrics: DashboardMetric[];
  attention: DashboardAttention;
  trend: DashboardTrend;
  /** Replaces the figures when status is "empty" or "error". */
  message?: DashboardMessage;
  /** Read out while loading. */
  loadingLabel?: string;
  /** Screen-reader heading for the metrics strip. */
  metricsHeading?: string;
  /** 1 when the dashboard is the page; 2 when it sits under a page title. */
  headingLevel?: 1 | 2;
  /** Data sources, definitions or a demo-data notice. */
  footnote?: React.ReactNode;
};

const skeleton = "block rounded-sm bg-muted";
const linkClass =
  "inline-flex min-h-11 items-center rounded-sm text-sm font-medium underline underline-offset-4 outline-none hover:decoration-2 focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function DashboardOverview({
  context,
  question,
  answer,
  period,
  status = "ready",
  metrics,
  attention,
  trend,
  message,
  loadingLabel = "Loading figures",
  metricsHeading = "Key figures",
  headingLevel = 1,
  footnote,
  className,
  ...props
}: DashboardOverviewProps) {
  const id = React.useId();
  const Title = `h${headingLevel}` as const;
  const Section = `h${headingLevel + 1}` as "h2" | "h3";
  const loading = status === "loading";
  const hasFigures = status === "ready" || loading;
  const ids = {
    title: `${id}-title`,
    metrics: `${id}-metrics`,
    attention: `${id}-attention`,
    trend: `${id}-trend`,
    trendDescription: `${id}-trend-description`,
    message: `${id}-message`,
  };

  return (
    <div
      data-slot="dashboard-overview"
      data-status={status}
      className={cn("bg-background text-foreground", className)}
      {...props}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <header className="max-w-3xl">
          {context ? (
            <p className="text-sm text-muted-foreground">{context}</p>
          ) : null}
          <Title
            id={ids.title}
            className="mt-1 text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-3xl"
          >
            {question}
          </Title>
          {loading ? (
            <span aria-hidden="true" className="mt-3 block space-y-1.5">
              <span className={cn(skeleton, "h-6 w-full max-w-xl sm:h-7")} />
              <span className={cn(skeleton, "h-6 w-2/3 max-w-sm sm:h-7")} />
            </span>
          ) : answer ? (
            <div className="mt-3 text-base leading-relaxed text-pretty sm:text-lg">
              {answer}
            </div>
          ) : null}
          {period ? (
            <p className="mt-3 text-sm text-muted-foreground">{period}</p>
          ) : null}
        </header>

        <p role="status" className="sr-only">
          {loading ? loadingLabel : ""}
        </p>

        <div aria-live="polite">
          {!hasFigures && message ? (
            <section
              aria-labelledby={ids.message}
              data-variant={status}
              className={cn(
                "mt-8 max-w-3xl rounded-lg border bg-card px-5 py-6 text-card-foreground sm:px-8 sm:py-8",
                status === "error"
                  ? "border-destructive/50"
                  : "border-dashed border-border",
              )}
            >
              <Section
                id={ids.message}
                className="text-lg leading-snug font-semibold tracking-tight text-balance"
              >
                {message.label ? (
                  <span
                    className={cn(
                      "mb-1 block text-sm font-semibold",
                      status === "error"
                        ? "text-destructive"
                        : "text-muted-foreground",
                    )}
                  >
                    {message.label}
                  </span>
                ) : null}
                {message.title}
              </Section>
              {message.description ? (
                <div className="mt-2 max-w-prose text-sm leading-relaxed text-pretty text-muted-foreground">
                  {message.description}
                </div>
              ) : null}
              {message.actions ? (
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  {message.actions}
                </div>
              ) : null}
            </section>
          ) : null}
        </div>

        {hasFigures ? (
          <div aria-busy={loading || undefined}>
            <section aria-labelledby={ids.metrics} className="mt-8">
              <Section id={ids.metrics} className="sr-only">
                {metricsHeading}
              </Section>
              <dl
                className={cn(
                  "grid border-y border-border",
                  metrics.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3",
                )}
              >
                {metrics.map((metric) => (
                  <div
                    key={metric.id}
                    className="flex flex-col gap-1 border-b border-border py-5 last:border-b-0 sm:row-span-4 sm:grid sm:grid-rows-subgrid sm:gap-y-1 sm:border-b-0 sm:border-l sm:px-6 sm:first:border-l-0 sm:first:pl-0"
                  >
                    <dt className="text-sm text-muted-foreground">
                      {metric.label}
                    </dt>
                    <dd className="text-2xl leading-8 font-semibold tracking-tight tabular-nums sm:text-3xl sm:leading-9">
                      {loading ? (
                        <span
                          aria-hidden="true"
                          className={cn(skeleton, "h-8 w-24 sm:h-9")}
                        />
                      ) : (
                        metric.value
                      )}
                    </dd>
                    {metric.comparison ? (
                      <dd className="text-sm leading-5">
                        {loading ? (
                          <span
                            aria-hidden="true"
                            className={cn(skeleton, "h-5 w-44 max-w-full")}
                          />
                        ) : (
                          metric.comparison
                        )}
                      </dd>
                    ) : null}
                    {metric.context ? (
                      <dd className="text-sm leading-5 text-muted-foreground">
                        {metric.context}
                      </dd>
                    ) : null}
                  </div>
                ))}
              </dl>
            </section>

            <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-12">
              <section aria-labelledby={ids.attention}>
                <Section
                  id={ids.attention}
                  className="text-lg leading-snug font-semibold tracking-tight text-balance"
                >
                  {attention.title}
                </Section>
                {attention.description ? (
                  <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">
                    {attention.description}
                  </p>
                ) : null}

                {loading ? (
                  <ul
                    aria-hidden="true"
                    className="mt-4 border-t border-border"
                  >
                    {[0, 1, 2].map((row) => (
                      <li
                        key={row}
                        className="flex items-start justify-between gap-4 border-b border-border py-3"
                      >
                        <span className="w-full space-y-1.5">
                          <span className={cn(skeleton, "h-5 w-3/4")} />
                          <span className={cn(skeleton, "h-5 w-1/2")} />
                        </span>
                        <span className={cn(skeleton, "h-5 w-14 shrink-0")} />
                      </li>
                    ))}
                  </ul>
                ) : attention.items.length ? (
                  <ul className="mt-4 border-t border-border">
                    {attention.items.map((item) => (
                      <li key={item.id} className="border-b border-border">
                        <a
                          href={item.href}
                          className="group/row -mx-2 flex min-h-11 items-start justify-between gap-4 rounded-sm px-2 py-3 outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                          <span className="min-w-0">
                            <span className="block font-medium break-words underline-offset-4 group-hover/row:underline">
                              {item.title}
                            </span>
                            {item.detail || item.flag ? (
                              <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                                {item.detail ? (
                                  <span>{item.detail}</span>
                                ) : null}
                                {item.flag ? (
                                  <span className="rounded-sm border border-border px-1.5 text-xs leading-5 font-medium text-foreground">
                                    {item.flag}
                                  </span>
                                ) : null}
                              </span>
                            ) : null}
                          </span>
                          <span className="shrink-0 text-right text-sm leading-6 tabular-nums">
                            {attention.measureLabel ? (
                              <span className="sr-only">
                                {attention.measureLabel}{" "}
                              </span>
                            ) : null}
                            {item.measure}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 border-y border-border py-4 text-sm leading-relaxed text-muted-foreground">
                    {attention.emptyText ?? "Nothing needs attention."}
                  </p>
                )}

                {!loading && (attention.action || attention.moreLink) ? (
                  <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
                    {attention.action}
                    {attention.moreLink ? (
                      <a href={attention.moreLink.href} className={linkClass}>
                        {attention.moreLink.label}
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </section>

              <TrendChart
                trend={trend}
                loading={loading}
                headingId={ids.trend}
                descriptionId={ids.trendDescription}
                Heading={Section}
              />
            </div>
          </div>
        ) : null}

        {footnote ? (
          <div className="mt-10 max-w-prose border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground">
            {footnote}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * A horizontal bar chart that is also its own text alternative: a table with
 * one row per period, the value written out beside each bar.
 */
function TrendChart({
  trend,
  loading,
  headingId,
  descriptionId,
  Heading,
}: {
  trend: DashboardTrend;
  loading: boolean;
  headingId: string;
  descriptionId: string;
  Heading: "h2" | "h3";
}) {
  const {
    title,
    description,
    periodHeading = "Week",
    valueHeading,
    points,
    unit = "%",
    target,
  } = trend;
  const max = trend.max ?? 100;
  const percent = (value: number) =>
    `${Math.min(100, Math.max(0, (value / max) * 100))}%`;

  return (
    <section aria-labelledby={headingId}>
      <Heading
        id={headingId}
        className="text-lg leading-snug font-semibold tracking-tight text-balance"
      >
        {title}
      </Heading>
      {loading ? (
        <span aria-hidden="true" className={cn(skeleton, "mt-2 h-5 w-3/4")} />
      ) : description ? (
        <p
          id={descriptionId}
          className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground"
        >
          {description}
        </p>
      ) : null}

      <table
        aria-labelledby={headingId}
        aria-describedby={!loading && description ? descriptionId : undefined}
        className="mt-4 w-full border-collapse text-sm"
      >
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th scope="col" className="py-2 pr-3 font-medium">
              {periodHeading}
            </th>
            <th scope="col" className="py-2 text-right font-medium">
              {valueHeading}
            </th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.label}>
              <th
                scope="row"
                className={cn(
                  "w-px py-1.5 pr-3 text-left whitespace-nowrap",
                  point.current ? "font-semibold" : "font-normal",
                )}
              >
                {point.label}
              </th>
              <td className="py-1.5">
                <span className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="relative block h-4 min-w-0 flex-1 rounded-sm bg-muted"
                  >
                    {loading ? null : (
                      <span
                        className={cn(
                          "absolute inset-y-0 left-0 block rounded-sm",
                          point.current
                            ? "bg-foreground"
                            : "bg-muted-foreground",
                        )}
                        style={{ width: percent(point.value) }}
                      />
                    )}
                    {target ? (
                      <span
                        className="absolute -inset-y-1.5 block border-l-2 border-dashed border-foreground"
                        style={{ left: percent(target.value) }}
                      />
                    ) : null}
                  </span>
                  <span
                    className={cn(
                      "w-12 shrink-0 text-right tabular-nums",
                      point.current && "font-semibold",
                    )}
                  >
                    {loading ? (
                      <span
                        aria-hidden="true"
                        className={cn(skeleton, "ml-auto h-5 w-9")}
                      />
                    ) : (
                      (point.display ?? `${point.value}${unit}`)
                    )}
                  </span>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {target ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <svg
            aria-hidden="true"
            viewBox="0 0 4 20"
            className="h-5 w-1 shrink-0 text-foreground"
          >
            <line
              x1="2"
              y1="0"
              x2="2"
              y2="20"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="4 3"
            />
          </svg>
          <span>{target.label}</span>
        </p>
      ) : null}
    </section>
  );
}
