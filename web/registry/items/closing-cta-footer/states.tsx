import { ClosingCtaFooterExample } from "./demo";

/** The same footer on a page whose job is not to convert (help, legal). */
function FooterOnly() {
  return <ClosingCtaFooterExample withCta={false} />;
}

/** Extra states, keyed by the names in notes.md `states` (after the first). */
export const states = {
  "footer-only": FooterOnly,
};
