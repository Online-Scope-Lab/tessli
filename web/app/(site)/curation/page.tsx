import { PublicContentPage } from "@/components/public-content/public-content-page";
export const metadata = { title: "How sources are chosen" };
export default function CurationPage() {
  return (
    <PublicContentPage
      label="How sources are chosen"
      title="Curation favours usefulness, clarity, and maintainable truth."
      summary="A source needs more than a memorable URL or a polished screenshot. Tessli checks whether it can be described accurately, placed in a useful category, and linked to without misrepresenting it."
      relatedLinks={[
        { href: "/about", label: "About Tessli" },
        { href: "/resources", label: "Browse sources" },
        { href: "/contribute", label: "Contribute" },
        { href: "/content-policy", label: "Content policy" },
      ]}
      sections={[
        {
          id: "criteria",
          title: "What earns a place in the directory.",
          paragraphs: [
            "Tessli lists design references, tools, libraries, assets and learning sources that are useful to designers and frontend builders. A listing needs a working destination, a clear use case, and enough checked information to describe it without exaggeration. The directory stays small on purpose: a source is listed when a curator would defend it next to its peers.",
          ],
          items: [
            "A practical reason to use or study the source.",
            "A concise description visitors can understand before opening it.",
            "A category and access label that fit the available source information.",
          ],
        },
        {
          id: "metadata",
          title: "Metadata describes, not ranks.",
          paragraphs: [
            "Names, descriptions, categories, access labels and best-for and limitation notes help visitors decide whether to open a source; they are not ratings, popularity scores, or promises of quality.",
            "Free, freemium, paid, open-source, and free-trial labels describe the recorded access model. Pricing, licensing, availability, and product scope can change, so the original destination remains the source to verify.",
          ],
        },
        {
          id: "corrections",
          title: "Suggestions and corrections go through GitHub.",
          paragraphs: [
            "Anyone can suggest a source, or report a broken link, changed access, a wrong category, a misleading description, a trademark concern or a removal request, with a GitHub issue form. A maintainer opens the source and decides; nothing is accepted automatically, and a correction never invents a replacement fact.",
            "Sources are never deleted silently. A source that should go is archived with a recorded reason, and its page stays up with that reason and any replacement, so old links keep working.",
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
