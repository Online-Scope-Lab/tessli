import { PublicContentPage } from "@/components/public-content/public-content-page";
export const metadata = { title: "Terms" };
export default function TermsPage() {
  return (
    <PublicContentPage
      label="Terms"
      title="Use Tessli as a research index, not a substitute for source terms."
      summary="Tessli links to independent resources and provides limited catalogue metadata to help visitors research them. Use of a resource remains subject to the terms, licences, pricing, and availability stated by its original source."
      relatedLinks={[
        { href: "/privacy", label: "Privacy" },
        { href: "/content-policy", label: "Content policy" },
        { href: "/curation", label: "Curation process" },
      ]}
      sections={[
        {
          id: "index",
          title: "Listings are for discovery and research.",
          paragraphs: [
            "A Tessli listing is not an endorsement, warranty, licence grant, or promise that a destination remains available. Catalogue descriptions are a starting point for research, not a replacement for checking the original source.",
            "Tessli may update, correct, remove, or reclassify a listing when source information changes or a review identifies an issue.",
          ],
        },
        {
          id: "third-party",
          title: "Third-party rights and terms remain with their owners.",
          paragraphs: [
            "Names, trademarks, images, code, assets, and content at a resource destination belong to their respective owners. A public index does not grant permission to reuse them.",
            "Before using a resource in a product or client project, you are responsible for reviewing its current licence, terms, access model, security posture, and suitability for your use.",
          ],
        },
        {
          id: "responsible-use",
          title: "Use references responsibly.",
          paragraphs: [
            "Tessli is designed to support original work and informed research. Do not treat a reference as permission to copy another product's interface, protected content, or branded material.",
          ],
        },
      ]}
    />
  );
}
