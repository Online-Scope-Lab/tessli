import { PublicContentPage } from "@/components/public-content/public-content-page";
export const metadata = { title: "Curation process" };
export default function CurationPage() {
  return (
    <PublicContentPage
      label="How resources are selected"
      title="Curation favours usefulness, clarity, and maintainable truth."
      summary="A resource needs more than a memorable URL or polished screenshot. Tessli reviews whether it can be described accurately, placed in a useful category, and linked to without misrepresenting its source."
      relatedLinks={[
        { href: "/about", label: "About Tessli" },
        { href: "/resources", label: "Browse sources" },
        { href: "/content-policy", label: "Content policy" },
      ]}
      sections={[
        {
          id: "criteria",
          title: "What earns a place in the catalogue.",
          paragraphs: [
            "Tessli considers design references, tools, libraries, assets, and learning sources that are useful to designers and frontend builders. A listing needs a working destination, a clear use case, and enough source-backed information to describe it without exaggeration.",
          ],
          items: [
            "A practical reason to use or study the resource.",
            "A concise description visitors can understand before opening it.",
            "A category and access label that fit the available source information.",
          ],
        },
        {
          id: "metadata",
          title: "Metadata describes, not ranks.",
          paragraphs: [
            "Names, domains, descriptions, categories, access labels, and task tags help visitors decide whether to open a source; they are not ratings, popularity scores, or promises of quality.",
            "Free, freemium, paid, open-source, and free-trial labels describe the recorded access model. Pricing, licensing, availability, and product scope can change, so the original destination remains the source to verify.",
          ],
        },
        {
          id: "corrections",
          title: "Corrections matter as much as additions.",
          paragraphs: [
            "Tessli welcomes reports of broken links, changed access, wrong categories, misleading descriptions, trademark concerns, and removal requests. Phase 1 review is repository-managed: a correction preserves source context and never invents a replacement fact.",
          ],
        },
        {
          id: "media",
          title: "Previews remain secondary to the original source.",
          paragraphs: [
            "Cards may use an approved preview, an Open Graph image, a favicon, or a generated letter mark. Tessli does not inject remote SVG markup or use destination images as permission to redistribute a site's work.",
          ],
        },
      ]}
    />
  );
}
