import { PublicContentPage } from "@/components/public-content/public-content-page";
import { getLibraryItems } from "@/lib/library";
import { getBrowsableSourceCounts } from "@/lib/source-profiles";
export const metadata = { title: "About" };
export default function AboutPage() {
  const counts = getBrowsableSourceCounts();
  const items = getLibraryItems();
  const reviewed = items.filter(
    (item) => item.notes.status === "reviewed",
  ).length;
  return (
    <PublicContentPage
      label="About Tessli"
      title="A UI library that explains itself."
      summary="Tessli is an open-source library of components, sections and pages. Each one ships with working code, a live preview and its reasoning: when to use it, when not to, the rules it follows and the generic default it replaces. Beside the library sits a curated directory of design sources."
      relatedLinks={[
        { href: "/library", label: "Library" },
        { href: "/contribute", label: "Contribute" },
        { href: "/curation", label: "How sources are chosen" },
        { href: "/content-policy", label: "Content policy" },
      ]}
      sections={[
        {
          id: "library",
          title: "The library comes first.",
          paragraphs: [
            "People browse library items, copy them and learn from their notes. Coding agents install the same items with the shadcn CLI and read the same notes as structured data, together with a compact rules file.",
            "Items use semantic theme tokens, so they take on the installing project's theme. Every preview is checked in three themes, Tessli, Neutral and Dark, because what an item teaches is structure: hierarchy, spacing, density, states and copy, not the Tessli palette.",
            `The library is new: ${items.length} items so far, ${reviewed === 0 ? "none of them reviewed by a maintainer yet" : `${reviewed} reviewed by a maintainer`}. Every item and rule shows its review status, and only a maintainer can mark one reviewed.`,
          ],
        },
        {
          id: "sources",
          title: "Sources are where else to look.",
          paragraphs: [
            `The Sources directory lists ${counts.sources} repository-managed resources across ${counts.categories} practical categories: what each one is good for, how to access it and where it falls short. It is meant to stay small enough that every entry can be defended.`,
            "A listing links to its original destination with limited descriptive context. It is not an endorsement, a quality guarantee or permission to copy another product's interface. Check the original source before using any asset, code or design reference in production.",
          ],
        },
        {
          id: "claims",
          title: "What Tessli does not claim.",
          paragraphs: [
            "Tessli does not claim that it makes AI-built interfaces better. That claim needs a published, blinded comparison scored by people, and none has been run yet. Until then, Tessli says only that its library is explained, open and installable.",
          ],
        },
        {
          id: "open-work",
          title: "Built in the open on GitHub.",
          paragraphs: [
            "There are no accounts, no database and no forms on this site. Every contribution, whether a source, a design, a library item or a problem report, is a GitHub issue or pull request and is reviewed in public.",
            "The code and taste notes are released under the MIT licence. The Tessli name, wordmark and hero artwork are not part of that licence; their rights are held by Online Scope.",
          ],
          items: [
            "Browse the library, the rules and the sources without an account.",
            "Contribute through the paths on the Contribute page.",
          ],
        },
      ]}
    />
  );
}
