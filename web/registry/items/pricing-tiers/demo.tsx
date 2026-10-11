// Fictional product: Northwind Notes. Prices are invented for the demo and
// labelled as such; they describe no real product.
import {
  PricingTiers,
  type BillingPeriod,
  type PricingLimit,
  type PricingPlan,
} from "./pricing-tiers";

const limits: PricingLimit[] = [
  { id: "members", label: "Members" },
  { id: "history", label: "Version history" },
  { id: "notebooks", label: "Shared notebooks" },
];

const plans: PricingPlan[] = [
  {
    id: "personal",
    name: "Personal",
    description: "For one person keeping their own notes.",
    price: { monthly: 0, annual: 0 },
    limits: { members: "1", history: "7 days", notebooks: "3" },
    cta: { label: "Start for free", href: "#personal" },
  },
  {
    id: "team",
    name: "Team",
    description: "For teams that write and review notes together.",
    price: { monthly: 9, annual: 7.5 },
    limits: { members: "Up to 50", history: "1 year", notebooks: "Unlimited" },
    cta: { label: "Start 14-day trial", href: "#team" },
    recommended: true,
  },
  {
    id: "business",
    name: "Business",
    description: "For organisations that need SSO and audit logs.",
    price: { monthly: 15, annual: 12.5 },
    limits: {
      members: "Unlimited",
      history: "Unlimited",
      notebooks: "Unlimited",
    },
    cta: { label: "Choose Business", href: "#business" },
  },
];

export function PricingTiersExample({
  defaultPeriod,
}: {
  defaultPeriod?: BillingPeriod;
}) {
  return (
    <PricingTiers
      title="Pay for the people who write, not the people who read"
      description="Readers are free on every plan. Plans differ on three things: members, version history and shared notebooks."
      plans={plans}
      limits={limits}
      recommendedLabel="Recommended for most teams"
      defaultPeriod={defaultPeriod}
      footnote={
        <p>
          Demo prices for a fictional product. Prices exclude tax. The Team
          trial needs no card and ends without charge unless you choose a plan.
        </p>
      }
    />
  );
}

export default function PricingTiersDemo() {
  return <PricingTiersExample />;
}
