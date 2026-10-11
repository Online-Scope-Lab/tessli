import { PricingTiersExample } from "./demo";

function Annual() {
  return <PricingTiersExample defaultPeriod="annual" />;
}

/** Extra states, keyed by the names in notes.md `states` (after the first). */
export const states = {
  annual: Annual,
};
