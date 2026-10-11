import * as React from "react";

import { cn } from "@/registry/shadcn/lib/utils";

type HeadingLevel = 2 | 3 | 4;

export type EmptyStateProps = Omit<React.ComponentProps<"section">, "title"> & {
  /** Says what is empty, in the user's words: "No notes in Field research yet". */
  title: React.ReactNode;
  /** One or two sentences: why it is empty and what will appear here. */
  description?: React.ReactNode;
  /**
   * `neutral` for first use and no results; `error` when something failed.
   * Error adds a text label, so the state never relies on colour alone.
   */
  variant?: "neutral" | "error";
  /** Text shown before the title in the error variant. */
  errorLabel?: string;
  /** Match the surrounding outline; the empty state replaces a region's content. */
  headingLevel?: HeadingLevel;
  /** Actions: one primary, at most one secondary. */
  actions?: React.ReactNode;
};

export function EmptyState({
  title,
  description,
  variant = "neutral",
  errorLabel = "Error",
  headingLevel = 2,
  actions,
  children,
  className,
  ...props
}: EmptyStateProps) {
  const headingId = React.useId();
  const Heading = `h${headingLevel}` as const;
  const isError = variant === "error";

  return (
    <section
      aria-labelledby={headingId}
      data-slot="empty-state"
      data-variant={variant}
      className={cn(
        "rounded-lg border bg-card px-5 py-6 text-card-foreground sm:px-8 sm:py-8",
        isError ? "border-destructive/50" : "border-dashed border-border",
        className,
      )}
      {...props}
    >
      <div className="max-w-prose">
        <Heading
          id={headingId}
          className="text-lg leading-snug font-semibold tracking-tight text-balance"
        >
          {isError ? (
            <span className="mb-1 block text-sm font-semibold text-destructive">
              {errorLabel}
            </span>
          ) : null}
          {title}
        </Heading>
        {description ? (
          <div className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">
            {description}
          </div>
        ) : null}
        {children ? <div className="mt-4 text-sm">{children}</div> : null}
      </div>
      {actions ? (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          {actions}
        </div>
      ) : null}
    </section>
  );
}
