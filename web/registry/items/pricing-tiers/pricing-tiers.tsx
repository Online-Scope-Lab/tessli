"use client";

import * as React from "react";

import { cn } from "@/registry/shadcn/lib/utils";
import { buttonVariants } from "@/registry/shadcn/ui/button";

export type BillingPeriod = "monthly" | "annual";

export type PricingLimit = {
  id: string;
  /** What buyers compare: "Members", "Version history". */
  label: string;
};

export type PricingPlan = {
  id: string;
  name: string;
  /** Who the plan is for, in one short sentence. */
  description: string;
  /** Price per seat per month for each billing period. 0 renders "Free". */
  price: Record<BillingPeriod, number>;
  /** The value for each limit id, written out ("Up to 50", not a tick). */
  limits: Record<string, string>;
  cta: { label: string; href: string };
  /** At most one plan. It gets the only primary button and a text label. */
  recommended?: boolean;
};

export type PricingTiersProps = Omit<
  React.ComponentProps<"section">,
  "title"
> & {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Two or three plans. Use a comparison table or calculator beyond that. */
  plans: PricingPlan[];
  /** The three to five limits the plans actually differ on, in order. */
  limits: PricingLimit[];
  currency?: string;
  locale?: string;
  /** Unit after the price, e.g. "per member / month". */
  unit?: string;
  recommendedLabel?: string;
  defaultPeriod?: BillingPeriod;
  /** Taxes, trial terms or anything a buyer must know before paying. */
  footnote?: React.ReactNode;
};

function formatPrice(value: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function PricingTiers({
  title,
  description,
  plans,
  limits,
  currency = "USD",
  locale = "en-US",
  unit = "per member / month",
  recommendedLabel = "Recommended",
  defaultPeriod = "monthly",
  footnote,
  className,
  ...props
}: PricingTiersProps) {
  const [period, setPeriod] = React.useState<BillingPeriod>(defaultPeriod);
  const id = React.useId();
  const headingId = `${id}-heading`;

  // The annual saving is derived from the prices, never typed in by hand.
  const savings = plans
    .filter((plan) => plan.price.monthly > 0)
    .map((plan) => 1 - plan.price.annual / plan.price.monthly);
  const bestSaving = savings.length ? Math.max(...savings) : 0;
  const savingLabel =
    bestSaving > 0 ? `save up to ${Math.round(bestSaving * 100)}%` : null;

  return (
    <section
      aria-labelledby={headingId}
      data-slot="pricing-tiers"
      className={cn("bg-background text-foreground", className)}
      {...props}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
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

          <fieldset className="shrink-0">
            <legend className="mb-2 text-sm font-medium">Billing period</legend>
            <div className="inline-flex rounded-md border border-border bg-muted p-1">
              {(["monthly", "annual"] as const).map((option) => (
                <label
                  key={option}
                  className="relative flex min-h-11 cursor-pointer items-center rounded-sm px-4 text-sm font-medium text-muted-foreground has-[:checked]:bg-background has-[:checked]:text-foreground has-[:checked]:shadow-xs has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50"
                >
                  <input
                    type="radio"
                    name={`${id}-period`}
                    value={option}
                    checked={period === option}
                    onChange={() => setPeriod(option)}
                    className="sr-only"
                  />
                  {option === "monthly" ? "Monthly" : "Annual"}
                  {option === "annual" && savingLabel ? (
                    <span className="ml-1.5 font-normal">({savingLabel})</span>
                  ) : null}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <ul
          className={cn(
            "mt-10 grid gap-6",
            // Three plans need 1024px to stay readable side by side.
            plans.length === 2 ? "md:grid-cols-2" : "lg:grid-cols-3",
          )}
        >
          {plans.map((plan) => {
            const price = plan.price[period];
            return (
              <li
                key={plan.id}
                className={cn(
                  // Side by side, each plan is a subgrid over the same seven
                  // rows, so names, prices, actions and limits line up.
                  "flex flex-col rounded-lg border bg-card p-6 text-card-foreground",
                  plans.length === 2
                    ? "md:row-span-7 md:grid md:grid-rows-subgrid md:gap-y-0"
                    : "lg:row-span-7 lg:grid lg:grid-rows-subgrid lg:gap-y-0",
                  plan.recommended
                    ? "border-2 border-primary"
                    : "border-border",
                )}
              >
                <p
                  className={cn(
                    "min-h-5 text-sm font-medium",
                    !plan.recommended &&
                      (plans.length === 2
                        ? "hidden md:block"
                        : "hidden lg:block"),
                  )}
                >
                  {plan.recommended ? recommendedLabel : null}
                </p>
                <h3 className="mt-1 text-xl font-semibold tracking-tight">
                  {plan.name}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {plan.description}
                </p>

                <p className="mt-6 flex flex-wrap items-baseline gap-x-2">
                  <span className="text-4xl font-semibold tracking-tight tabular-nums">
                    {price === 0
                      ? "Free"
                      : formatPrice(price, currency, locale)}
                  </span>
                  {price === 0 ? null : (
                    <span className="text-sm text-muted-foreground">
                      {unit}
                    </span>
                  )}
                </p>
                <p className="mt-1 min-h-5 text-sm text-muted-foreground">
                  {price === 0
                    ? "No card needed"
                    : period === "annual"
                      ? `Billed yearly at ${formatPrice(price * 12, currency, locale)} per member`
                      : "Billed monthly"}
                </p>

                <a
                  href={plan.cta.href}
                  className={cn(
                    buttonVariants({
                      variant: plan.recommended ? "default" : "outline",
                      size: "lg",
                    }),
                    "mt-6 h-11 w-full",
                  )}
                >
                  {plan.cta.label}
                </a>

                <dl className="mt-6 border-t border-border text-sm">
                  {limits.map((limit) => (
                    <div
                      key={limit.id}
                      className="flex items-baseline justify-between gap-4 border-b border-border py-3 last:border-b-0"
                    >
                      <dt className="text-muted-foreground">{limit.label}</dt>
                      <dd className="text-right font-medium">
                        {plan.limits[limit.id] ?? "—"}
                      </dd>
                    </div>
                  ))}
                </dl>
              </li>
            );
          })}
        </ul>

        {footnote ? (
          <div className="mt-8 max-w-prose text-sm leading-relaxed text-muted-foreground">
            {footnote}
          </div>
        ) : null}
      </div>
    </section>
  );
}
