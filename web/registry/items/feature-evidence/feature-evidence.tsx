import * as React from "react";

import { cn } from "@/registry/shadcn/lib/utils";

export type FeatureFact = {
  /** What is limited or guaranteed: "History kept on Team". */
  label: string;
  /** The exact value, written out: "1 year", not a tick. */
  value: React.ReactNode;
};

export type EvidenceFeature = {
  id: string;
  /** A claim the artefact can prove, not an adjective ("Every edit is kept"). */
  title: React.ReactNode;
  /** Two or three sentences: what it does and the one condition that matters. */
  description: React.ReactNode;
  /**
   * The proof: a small UI fragment, a before/after or an exact limit. Use
   * EvidencePanel, BeforeAfter or ExactLimits below, or your own markup.
   * Never an icon standing in for the feature.
   */
  evidence: React.ReactNode;
  /** One sentence saying what the artefact shows. Rendered as its caption. */
  evidenceCaption: React.ReactNode;
  /** Exact limits or guarantees, in the order a buyer would check them. */
  facts?: FeatureFact[];
  /** Where to read more. The label names the destination. */
  link?: { label: string; href: string };
};

export type FeatureEvidenceProps = Omit<
  React.ComponentProps<"section">,
  "title"
> & {
  /** The point of the section, not "Features". */
  title: React.ReactNode;
  description?: React.ReactNode;
  /** The feature that matters most. It gets the most room and a bigger heading. */
  lead: EvidenceFeature;
  /** One or two features that matter less than the lead, each with its own proof. */
  supporting?: EvidenceFeature[];
  /** Smaller features that need a sentence, not a showcase. Shown as a list. */
  more?: {
    title: React.ReactNode;
    items: { term: string; detail: React.ReactNode }[];
  };
  /** Anything a reader must know about the claims, such as plan limits. */
  footnote?: React.ReactNode;
};

function FeatureText({
  feature,
  emphasis,
}: {
  feature: EvidenceFeature;
  emphasis: "lead" | "supporting";
}) {
  const isLead = emphasis === "lead";
  return (
    <div className="min-w-0">
      <h3
        className={cn(
          "font-semibold tracking-tight text-balance",
          isLead ? "text-xl leading-snug" : "text-base leading-snug",
        )}
      >
        {feature.title}
      </h3>
      <div
        className={cn(
          "mt-3 max-w-prose leading-relaxed text-pretty text-muted-foreground",
          isLead ? "text-base" : "text-sm",
        )}
      >
        {feature.description}
      </div>
      {feature.facts?.length ? (
        <dl className="mt-6 max-w-prose border-t border-border text-sm">
          {feature.facts.map((fact) => (
            <div
              key={fact.label}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border py-3"
            >
              <dt className="text-muted-foreground">{fact.label}</dt>
              <dd className="font-medium tabular-nums">{fact.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {feature.link ? (
        <a
          href={feature.link.href}
          className="mt-4 inline-flex min-h-11 items-center rounded-sm text-sm font-medium text-foreground underline underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {feature.link.label}
        </a>
      ) : null}
    </div>
  );
}

function FeatureFigure({ feature }: { feature: EvidenceFeature }) {
  return (
    <figure className="min-w-0">
      {feature.evidence}
      <figcaption className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {feature.evidenceCaption}
      </figcaption>
    </figure>
  );
}

/** Text beside its proof on wide screens; text first, then proof, on phones. */
function FeatureRow({
  feature,
  emphasis,
}: {
  feature: EvidenceFeature;
  emphasis: "lead" | "supporting";
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
      <FeatureText feature={feature} emphasis={emphasis} />
      <FeatureFigure feature={feature} />
    </div>
  );
}

export function FeatureEvidence({
  title,
  description,
  lead,
  supporting = [],
  more,
  footnote,
  className,
  ...props
}: FeatureEvidenceProps) {
  const headingId = React.useId();

  return (
    <section
      aria-labelledby={headingId}
      data-slot="feature-evidence"
      className={cn("bg-background text-foreground", className)}
      {...props}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
        <div className="max-w-2xl">
          <h2
            id={headingId}
            className="text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl"
          >
            {title}
          </h2>
          {description ? (
            <p className="mt-4 text-base leading-relaxed text-pretty text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>

        <div className="mt-10 border-t border-border pt-10 lg:mt-14">
          <FeatureRow feature={lead} emphasis="lead" />
        </div>

        {supporting.length === 1 ? (
          <div className="mt-12 border-t border-border pt-10">
            <FeatureRow feature={supporting[0]} emphasis="supporting" />
          </div>
        ) : supporting.length > 1 ? (
          <div className="mt-12 grid gap-12 border-t border-border pt-10 md:grid-cols-2 md:gap-8 lg:gap-12">
            {supporting.map((feature) => (
              <div key={feature.id} className="flex min-w-0 flex-col gap-6">
                <FeatureText feature={feature} emphasis="supporting" />
                <FeatureFigure feature={feature} />
              </div>
            ))}
          </div>
        ) : null}

        {more?.items.length ? (
          <div className="mt-12 border-t border-border pt-10">
            <h3 className="text-base leading-snug font-semibold tracking-tight">
              {more.title}
            </h3>
            <dl
              className={cn(
                "mt-4 grid gap-x-8 gap-y-5",
                // Three per row only when the count divides evenly, so no
                // item is left alone on the last row.
                more.items.length % 3 === 0
                  ? "md:grid-cols-3"
                  : "md:grid-cols-2",
              )}
            >
              {more.items.map((item) => (
                <div key={item.term} className="min-w-0">
                  <dt className="text-sm font-medium">{item.term}</dt>
                  <dd className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">
                    {item.detail}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}

        {footnote ? (
          <div className="mt-10 max-w-prose text-sm leading-relaxed text-muted-foreground">
            {footnote}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export type EvidencePanelProps = Omit<React.ComponentProps<"div">, "title"> & {
  /** The object shown, as the app would name it: "Site visit, north wing". */
  title?: React.ReactNode;
  /** Where in the app this is: "Version history". */
  meta?: React.ReactNode;
};

/** A bordered frame for a small, static fragment of the product's UI. */
export function EvidencePanel({
  title,
  meta,
  children,
  className,
  ...props
}: EvidencePanelProps) {
  return (
    <div
      data-slot="evidence-panel"
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-card text-sm text-card-foreground",
        className,
      )}
      {...props}
    >
      {title || meta ? (
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border px-4 py-3">
          {title ? <p className="font-medium">{title}</p> : null}
          {meta ? <p className="text-muted-foreground">{meta}</p> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

export type BeforeAfterProps = React.ComponentProps<"div"> & {
  /** Each side is named in text ("In the app", "In the exported file"). */
  before: { label: React.ReactNode; content: React.ReactNode };
  after: { label: React.ReactNode; content: React.ReactNode };
};

/**
 * Two panels, side by side when their container is at least 36rem wide and
 * stacked otherwise, so it fits a narrow column as well as a wide one.
 */
export function BeforeAfter({
  before,
  after,
  className,
  ...props
}: BeforeAfterProps) {
  return (
    <div
      data-slot="before-after"
      className={cn("@container", className)}
      {...props}
    >
      <div className="grid gap-3 @xl:grid-cols-2">
        {[before, after].map((side, index) => (
          <EvidencePanel key={index} title={side.label}>
            <div className="min-w-0 px-4 py-3">{side.content}</div>
          </EvidencePanel>
        ))}
      </div>
    </div>
  );
}

export type ExactLimitsProps = React.ComponentProps<"ul"> & {
  /** Each limit as a number, its unit and what it applies to. */
  limits: { value: string; unit: string; label: React.ReactNode }[];
};

/** Exact limits set large, so the number is the evidence. */
export function ExactLimits({ limits, className, ...props }: ExactLimitsProps) {
  return (
    <ul
      data-slot="exact-limits"
      className={cn(
        "divide-y divide-border rounded-lg border border-border bg-card text-card-foreground",
        className,
      )}
      {...props}
    >
      {limits.map((limit) => (
        <li key={`${limit.value}-${limit.unit}`} className="px-5 py-4">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
              {limit.value}
            </span>
            <span className="text-base font-medium">{limit.unit}</span>
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {limit.label}
          </p>
        </li>
      ))}
    </ul>
  );
}
