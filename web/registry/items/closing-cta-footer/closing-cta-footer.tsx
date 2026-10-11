import * as React from "react";

import { cn } from "@/registry/shadcn/lib/utils";
import { buttonVariants } from "@/registry/shadcn/ui/button";

export type FooterLink = {
  label: string;
  href: string;
  /**
   * The link leaves your site. It gets a ↗ and a screen-reader note; links
   * that stay on the site never get an arrow.
   */
  external?: boolean;
};

export type FooterLinkGroup = {
  /** A short, plain group name: "Product", "Help", "Company". */
  title: string;
  /** Three to five links people actually look for at the end of a page. */
  links: FooterLink[];
};

export type ClosingCta = {
  /**
   * The page's point, restated as a reason to act now. Not "Ready to get
   * started?".
   */
  title: React.ReactNode;
  description?: React.ReactNode;
  /** The one primary action, named by what happens next. */
  action: { label: string; href: string };
  /** An optional quieter alternative, rendered as a text link, not a button. */
  secondaryAction?: { label: string; href: string };
  /** What removes the last doubt: price, card, commitment. Only if true. */
  note?: React.ReactNode;
};

export type ClosingCtaFooterProps = React.ComponentProps<"div"> & {
  /** Leave out on pages whose job is not to convert (docs, legal, help). */
  cta?: ClosingCta;
  /** The product name as text, linking home. No logo is required. */
  brand: { name: string; href: string; description?: React.ReactNode };
  /** Two to four groups. More than that is a sitemap, not a footer. */
  groups: FooterLinkGroup[];
  /** A real contact route: who answers and how. */
  contact?: React.ReactNode;
  /** Privacy, terms and any other legally required links. */
  legal?: FooterLink[];
  /** Copyright or company line, e.g. "© 2026 Example Ltd." */
  copyright?: React.ReactNode;
};

const linkClass =
  "inline-flex min-h-11 min-w-11 items-center rounded-sm text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none";

function FooterAnchor({ link }: { link: FooterLink }) {
  return (
    <a href={link.href} className={linkClass}>
      {/* One inline run, so a wrapped label keeps ↗ beside its last word. */}
      <span>
        {link.label}
        {link.external ? (
          <>
            <span aria-hidden="true">&nbsp;↗</span>
            <span className="sr-only"> (another site)</span>
          </>
        ) : null}
      </span>
    </a>
  );
}

export function ClosingCtaFooter({
  cta,
  brand,
  groups,
  contact,
  legal,
  copyright,
  className,
  ...props
}: ClosingCtaFooterProps) {
  const id = React.useId();
  const ctaHeadingId = `${id}-cta`;

  return (
    <div
      data-slot="closing-cta-footer"
      className={cn("bg-background text-foreground", className)}
      {...props}
    >
      {cta ? (
        <section aria-labelledby={ctaHeadingId}>
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
            <div className="max-w-2xl">
              <h2
                id={ctaHeadingId}
                className="text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl"
              >
                {cta.title}
              </h2>
              {cta.description ? (
                <p className="mt-4 text-base leading-relaxed text-pretty text-muted-foreground">
                  {cta.description}
                </p>
              ) : null}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                <a
                  href={cta.action.href}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-11 w-full sm:w-auto",
                  )}
                >
                  {cta.action.label}
                </a>
                {cta.secondaryAction ? (
                  <a
                    href={cta.secondaryAction.href}
                    className="inline-flex min-h-11 items-center self-center rounded-sm text-sm font-medium text-foreground underline underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none sm:self-auto"
                  >
                    {cta.secondaryAction.label}
                  </a>
                ) : null}
              </div>
              {cta.note ? (
                <div className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {cta.note}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <footer className="border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-4 pt-10 pb-6 sm:px-6 lg:px-8 lg:pt-12">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-12">
            <div className="max-w-sm">
              <a
                href={brand.href}
                className="inline-flex min-h-11 items-center rounded-sm text-base font-semibold tracking-tight focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                {brand.name}
              </a>
              {brand.description ? (
                <p className="mt-1 text-sm leading-relaxed text-pretty text-muted-foreground">
                  {brand.description}
                </p>
              ) : null}
              {contact ? (
                <div className="mt-4 text-sm leading-relaxed text-pretty text-muted-foreground">
                  {contact}
                </div>
              ) : null}
            </div>

            <nav aria-label="Footer">
              <div
                className={cn(
                  "grid grid-cols-2 gap-x-6 gap-y-8",
                  groups.length === 3 && "sm:grid-cols-3",
                  groups.length >= 4 && "md:grid-cols-4",
                )}
              >
                {groups.map((group, index) => {
                  const groupId = `${id}-group-${index}`;
                  return (
                    <div key={group.title}>
                      {/* A list label, not a heading: "Product" says nothing
                          about the page, and the nav landmark already lets
                          people jump here. */}
                      <p
                        id={groupId}
                        className="text-sm font-medium text-foreground"
                      >
                        {group.title}
                      </p>
                      <ul aria-labelledby={groupId} className="mt-2">
                        {group.links.map((link) => (
                          <li key={link.href}>
                            <FooterAnchor link={link} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </nav>
          </div>

          {legal?.length || copyright ? (
            <div className="mt-10 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              {copyright ? (
                <div className="text-sm text-muted-foreground">{copyright}</div>
              ) : null}
              {legal?.length ? (
                <nav aria-label="Legal">
                  <ul className="flex flex-wrap gap-x-6">
                    {legal.map((link) => (
                      <li key={link.href}>
                        <FooterAnchor link={link} />
                      </li>
                    ))}
                  </ul>
                </nav>
              ) : null}
            </div>
          ) : null}
        </div>
      </footer>
    </div>
  );
}
