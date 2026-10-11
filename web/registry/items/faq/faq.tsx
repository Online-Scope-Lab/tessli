import * as React from "react";

import { cn } from "@/registry/shadcn/lib/utils";

export type FaqItem = {
  /** The question as a buyer would ask it, not a marketing prompt. */
  question: string;
  /** A direct answer first, then the detail. Keep it to a few sentences. */
  answer: React.ReactNode;
};

export type FaqProps = Omit<React.ComponentProps<"section">, "title"> & {
  title: React.ReactNode;
  /** One sentence on what these questions cover. */
  description?: React.ReactNode;
  items: FaqItem[];
  /** Where to go when the answer is not here: a real contact route. */
  contact?: React.ReactNode;
  /** Open the first answer on load. Off by default. */
  openFirst?: boolean;
};

export function Faq({
  title,
  description,
  items,
  contact,
  openFirst = false,
  className,
  ...props
}: FaqProps) {
  const headingId = React.useId();

  return (
    <section
      aria-labelledby={headingId}
      data-slot="faq"
      className={cn("bg-background text-foreground", className)}
      {...props}
    >
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16 lg:px-8 lg:py-24">
        <div className="lg:sticky lg:top-8 lg:self-start">
          <h2
            id={headingId}
            className="text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl"
          >
            {title}
          </h2>
          {description ? (
            <p className="mt-4 max-w-prose text-base leading-relaxed text-pretty text-muted-foreground">
              {description}
            </p>
          ) : null}
          {contact ? (
            <div className="mt-6 max-w-prose text-sm leading-relaxed text-muted-foreground">
              {contact}
            </div>
          ) : null}
        </div>

        <div className="border-t border-border">
          {items.map((item, index) => (
            <details
              key={item.question}
              open={openFirst && index === 0}
              className="group border-b border-border"
            >
              <summary className="flex min-h-11 cursor-pointer list-none items-start justify-between gap-4 rounded-sm py-4 text-left text-base leading-snug font-medium focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
                <span>{item.question}</span>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <path d="M8 3v10M3 8h10" />
                </svg>
              </summary>
              <div className="max-w-prose pr-8 pb-5 text-sm leading-relaxed text-pretty text-muted-foreground">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
