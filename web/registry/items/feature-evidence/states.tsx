import { FeatureEvidenceExample } from "./demo";

function TwoFeatures() {
  return <FeatureEvidenceExample variant="two-features" />;
}

/** Extra states, keyed by the names in notes.md `states` (after the first). */
export const states = {
  "two-features": TwoFeatures,
};
