import * as React from "react";

import { cn } from "@/registry/shadcn/lib/utils";
import { buttonVariants } from "@/registry/shadcn/ui/button";

export type ProductHeroAction = {
  /** What happens next: "Start a free notebook", not "Get started". */
  label: string;
  href: string;
};

type HeadingLevel = 1 | 2;

export type ProductHeroProps = Omit<
  React.ComponentProps<"section">,
  "title"
> & {
  /**
   * What the product does, in plain words. If another product's name could
   * replace yours and the headline still works, rewrite it.
   */
  title: React.ReactNode;
  /** One or two sentences: who it is for and the two or three things it does. */
  description?: React.ReactNode;
  /** The only primary-styled action in the hero. */
  primaryAction: ProductHeroAction;
  /** An optional quieter route (a tour, the docs). Never a second primary. */
  secondaryAction?: ProductHeroAction;
  /** Terms people check before they click (price, trial, card). Only if true. */
  note?: React.ReactNode;
  /** The product itself: a ProductWindow composed from your real UI. */
  product: React.ReactNode;
  /** 1 on a landing page, where the hero holds the page title; 2 otherwise. */
  headingLevel?: HeadingLevel;
};

export function ProductHero({
  title,
  description,
  primaryAction,
  secondaryAction,
  note,
  product,
  headingLevel = 1,
  className,
  ...props
}: ProductHeroProps) {
  const headingId = React.useId();
  const Heading = `h${headingLevel}` as const;

  return (
    <section
      aria-labelledby={headingId}
      data-slot="product-hero"
      className={cn("bg-background text-foreground", className)}
      {...props}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="max-w-3xl">
          <Heading
            id={headingId}
            className="text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl"
          >
            {title}
          </Heading>
          {description ? (
            <p className="mt-5 max-w-prose text-lg leading-relaxed text-pretty text-muted-foreground">
              {description}
            </p>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href={primaryAction.href}
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-11 w-full px-6 sm:w-auto",
              )}
            >
              {primaryAction.label}
            </a>
            {secondaryAction ? (
              <a
                href={secondaryAction.href}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "lg" }),
                  "h-11 w-full px-4 underline decoration-muted-foreground underline-offset-4 hover:decoration-current sm:w-auto",
                )}
              >
                {secondaryAction.label}
              </a>
            ) : null}
          </div>
          {note ? (
            <p className="mt-4 text-sm text-muted-foreground">{note}</p>
          ) : null}
        </div>

        <div className="mt-12 sm:mt-16">{product}</div>
      </div>
    </section>
  );
}

export type ProductWindowProps = Omit<
  React.ComponentProps<"figure">,
  "children"
> & {
  /** The title bar text: the product, workspace or view name. */
  label: React.ReactNode;
  /**
   * Visible caption and the text alternative for the whole frame. Say what
   * the frame shows; if the product or its content is fictional, say so.
   */
  caption: React.ReactNode;
  /**
   * A static composition of your product's UI, built from your own
   * components and tokens rather than a screenshot. It is a picture: it is
   * hidden from assistive technology and inert, so put no real controls in
   * it. The content area is a size container, so children can recompose
   * with @sm: … @3xl: variants as the frame narrows.
   */
  children: React.ReactNode;
};

export function ProductWindow({
  label,
  caption,
  children,
  className,
  ...props
}: ProductWindowProps) {
  return (
    <figure
      data-slot="product-window"
      className={cn("m-0 min-w-0", className)}
      {...props}
    >
      <div
        aria-hidden="true"
        inert
        className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground select-none"
      >
        <div className="flex h-10 items-center border-b border-border bg-muted px-4">
          <span className="min-w-0 truncate text-xs text-muted-foreground">
            {label}
          </span>
        </div>
        <div className="@container">{children}</div>
      </div>
      <figcaption className="mt-3 max-w-prose text-sm text-pretty text-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  );
}
