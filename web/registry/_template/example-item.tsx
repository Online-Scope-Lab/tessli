// TEMPLATE. Copy this folder to web/registry/items/<your-slug>/, rename
// this file to <your-slug>.tsx and update the ./example-item imports in
// demo.tsx and states.tsx. See CONTRIBUTING.md, "Contribute an item".
//
// Rules for the item file:
// - One file. Import only React, npm packages listed in web/package.json,
//   shadcn/ui primitives as "@/registry/shadcn/ui/<name>" and `cn` from
//   "@/registry/shadcn/lib/utils". `shadcn add` rewrites those two paths to the
//   installing project's own components and utils.
// - Semantic tokens only: bg-background, text-foreground, bg-card,
//   text-muted-foreground, bg-primary, text-primary-foreground, border-border,
//   ring-ring, rounded-md/lg (from --radius). No hex colours, no fonts.
// - Accept content as props; keep demo content in demo.tsx.
// - Use only the Button API every shadcn style shares: Button, buttonVariants,
//   variant and size (no asChild or render props).
import * as React from "react";

import { cn } from "@/registry/shadcn/lib/utils";

export type ExampleItemProps = Omit<
  React.ComponentProps<"section">,
  "title"
> & {
  /** Document each prop: what it is for and what good content looks like. */
  title: React.ReactNode;
  description?: React.ReactNode;
};

export function ExampleItem({
  title,
  description,
  className,
  ...props
}: ExampleItemProps) {
  const headingId = React.useId();
  return (
    <section
      aria-labelledby={headingId}
      className={cn("bg-background text-foreground", className)}
      {...props}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 id={headingId} className="text-3xl font-semibold tracking-tight">
          {title}
        </h2>
        {description ? (
          <p className="mt-4 max-w-prose text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
    </section>
  );
}
