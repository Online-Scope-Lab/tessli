import { PublicContentPage } from "@/components/public-content/public-content-page";
export const metadata = { title: "Content policy" };
export default function ContentPolicyPage() {
  return (
    <PublicContentPage
      label="Content policy"
      title="Tessli indexes references without claiming ownership of them."
      summary="The public catalogue links to original destinations and keeps only the limited metadata needed to make those links useful. It is not a proxy, mirror, or archive of third-party design work."
      relatedLinks={[
        { href: "/curation", label: "Curation process" },
        { href: "/terms", label: "Terms" },
        { href: "/privacy", label: "Privacy" },
      ]}
      sections={[
        {
          id: "scope",
          title: "What the catalogue may contain.",
          paragraphs: [
            "A listing may include a name, destination URL, domain, short description, category, access label, task tags, and limited preview metadata. These fields identify and describe an original source, not reproduce it.",
            "Tessli does not intentionally scrape, proxy, host, or redistribute destination content. Remote SVG markup is never injected into the interface.",
          ],
        },
        {
          id: "previews",
          title: "Preview media is optional and secondary.",
          paragraphs: [
            "Where media is available, the card fallback order is an approved manual preview, an Open Graph image, a favicon, then a generated letter mark. The card remains useful without external imagery.",
            "A preview, logo, trademark, or destination name remains the property of its owner. A public URL is not a licence to reuse that material beyond a limited reference context.",
          ],
        },
        {
          id: "corrections",
          title: "Corrections and removals receive a source-backed review.",
          paragraphs: [
            "Reports may concern a broken link, changed access or pricing, an inaccurate description, a wrong category, a trademark concern, or a request to remove a listing or preview.",
            "During Phase 1, the public repository is the published review path. Tessli will correct, remove, or retain metadata based on available source evidence; it will not invent replacement facts to preserve a listing.",
          ],
        },
        {
          id: "boundary",
          title: "References should support original work.",
          paragraphs: [
            "Use Tessli to study patterns, locate tools, and find original sources. Do not use it to justify copying a destination's protected design, content, code, assets, or trademarked material.",
          ],
        },
      ]}
    />
  );
}
