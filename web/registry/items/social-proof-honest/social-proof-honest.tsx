import * as React from "react";

import { cn } from "@/registry/shadcn/lib/utils";

export type ProofLink = {
  /** Where the link goes, in words: "Read the case study", "Read the original post". */
  label: string;
  href: string;
  /** True when the link leaves your site. Adds ↗ and "(another site)" for screen readers. */
  external?: boolean;
};

export type ProofQuote = {
  id: string;
  /** The person's exact words, unedited, without quotation marks. */
  quote: string;
  /** The real, full name of the person quoted. No initials or "Happy customer". */
  name: string;
  /** Their role and organisation, as they agreed to be named. */
  role?: string;
  /** Where the quote was first published, so readers can check it in context. */
  source: ProofLink;
  /** ISO date (YYYY-MM-DD) the quote was published. Shown so readers can judge how current it is. */
  publishedAt?: string;
  /**
   * Marks example content. Renders a visible label on the quote so a
   * placeholder can never ship looking like a real customer.
   */
  placeholder?: boolean;
};

export type ProofFallbackLink = ProofLink & {
  /** What a reader can check there, in one sentence. */
  description: string;
};

export type SocialProofHonestProps = Omit<
  React.ComponentProps<"section">,
  "title"
> & {
  title: React.ReactNode;
  description?: React.ReactNode;
  /**
   * One to three real quotes, each published with the person's permission.
   * The first is shown largest. Pass an empty array until you have one.
   */
  quotes: ProofQuote[];
  /**
   * Shown instead of quotes when there are none: public records a reader can
   * check (changelog, source code, status history). With no quotes and no
   * fallback the section renders nothing.
   */
  fallback?: ProofFallbackLink[];
  /** How the quotes were gathered and used (permission, edits, sources). */
  note?: React.ReactNode;
  /** Text on quotes marked `placeholder`. */
  placeholderLabel?: string;
  /** Screen-reader text added to external links. */
  externalLabel?: string;
  locale?: string;
};

const linkClass =
  "inline-flex min-h-11 items-center rounded-sm font-medium text-foreground underline underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none";

function ProofAnchor({
  link,
  externalLabel,
}: {
  link: ProofLink;
  externalLabel: string;
}) {
  return (
    <a href={link.href} className={linkClass}>
      {/* One inline run, so a wrapped label keeps ↗ beside its last word. */}
      <span>
        {link.label}
        {link.external ? (
          <>
            <span aria-hidden="true">&nbsp;↗</span>
            <span className="sr-only"> ({externalLabel})</span>
          </>
        ) : null}
      </span>
    </a>
  );
}

function formatDate(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

function QuoteFigure({
  quote,
  featured,
  placeholderLabel,
  externalLabel,
  locale,
}: {
  quote: ProofQuote;
  featured: boolean;
  placeholderLabel: string;
  externalLabel: string;
  locale: string;
}) {
  return (
    <figure className="border-t border-border pt-6">
      {quote.placeholder ? (
        <p className="mb-4 inline-flex rounded-sm border border-dashed border-input px-2 py-1 text-sm font-medium text-foreground">
          {placeholderLabel}
        </p>
      ) : null}
      <blockquote
        cite={quote.source.href}
        className={cn(
          "text-pretty text-foreground",
          featured
            ? "max-w-[40ch] text-xl leading-snug font-medium sm:text-2xl"
            : "max-w-prose text-base leading-relaxed",
        )}
      >
        <p>“{quote.quote}”</p>
      </blockquote>
      <figcaption className="mt-5 text-sm leading-relaxed">
        <span className="block font-medium text-foreground">{quote.name}</span>
        {quote.role ? (
          <span className="block text-muted-foreground">{quote.role}</span>
        ) : null}
        <span className="mt-1 flex flex-wrap items-center gap-x-3 text-muted-foreground">
          <ProofAnchor link={quote.source} externalLabel={externalLabel} />
          {quote.publishedAt ? (
            <time dateTime={quote.publishedAt}>
              Published {formatDate(quote.publishedAt, locale)}
            </time>
          ) : null}
        </span>
      </figcaption>
    </figure>
  );
}

export function SocialProofHonest({
  title,
  description,
  quotes,
  fallback,
  note,
  placeholderLabel = "Example — replace with a real, permissioned quote",
  externalLabel = "another site",
  locale = "en-GB",
  className,
  ...props
}: SocialProofHonestProps) {
  const headingId = React.useId();
  const [featured, ...rest] = quotes;
  const hasFallback = !featured && fallback && fallback.length > 0;

  // No proof and nothing honest to show instead: render nothing rather than
  // an empty frame that invites placeholder logos.
  if (!featured && !hasFallback) return null;

  const figureProps = { placeholderLabel, externalLabel, locale };

  return (
    <section
      aria-labelledby={headingId}
      data-slot="social-proof-honest"
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

        {featured ? (
          <div
            className={cn(
              "mt-10 grid gap-10",
              rest.length > 0 &&
                "lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-16",
            )}
          >
            <QuoteFigure quote={featured} featured {...figureProps} />
            {rest.length > 0 ? (
              <ul className="grid content-start gap-8">
                {rest.map((quote) => (
                  <li key={quote.id}>
                    <QuoteFigure
                      quote={quote}
                      featured={false}
                      {...figureProps}
                    />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {hasFallback ? (
          <ul className="mt-10 max-w-4xl border-t border-border">
            {fallback.map((link) => (
              <li
                key={link.href}
                className="grid gap-x-8 gap-y-1 border-b border-border py-4 md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] md:items-center"
              >
                <span className="text-base">
                  <ProofAnchor link={link} externalLabel={externalLabel} />
                </span>
                <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
                  {link.description}
                </p>
              </li>
            ))}
          </ul>
        ) : null}

        {note ? (
          <div className="mt-10 max-w-prose text-sm leading-relaxed text-muted-foreground">
            {note}
          </div>
        ) : null}
      </div>
    </section>
  );
}
