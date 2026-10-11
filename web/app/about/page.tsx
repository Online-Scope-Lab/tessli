import { PublicContentPage } from "@/components/public-content/public-content-page";
export const metadata = { title: "About" };
export default function AboutPage() {
  return (
    <PublicContentPage
      label="About Tessli"
      title="A calmer route to useful design resources."
      summary="Tessli is a manually curated index for designers, frontend developers, product builders, and small teams that need useful references without another noisy feed."
      relatedLinks={[
        { href: "/curation", label: "How curation works" },
        { href: "/resources", label: "Browse Full Reference" },
        { href: "/content-policy", label: "Content policy" },
      ]}
      sections={[
        {
          id: "mission",
          title: "Useful references should be easier to find and judge.",
          paragraphs: [
            "Tessli brings together design resources that can help with a real task: researching an interface, choosing a type tool, finding an accessible component library, or studying a useful pattern.",
            "The public catalogue begins with 295 repository-managed resources across 11 practical categories. It is intended to be searchable and reviewable rather than endlessly expanded.",
          ],
        },
        {
          id: "boundaries",
          title: "Tessli is an index, not a mirror or a permission slip.",
          paragraphs: [
            "A listing links to its original destination and gives limited descriptive context. Tessli does not reproduce a destination site, sell access to it, or claim ownership of its name, content, or visual work.",
            "A listing is not an endorsement, a quality guarantee, or permission to copy another product's interface. Check the original source before using any asset, code, or design reference in production.",
          ],
        },
        {
          id: "open-work",
          title: "The catalogue is maintained in the open.",
          paragraphs: [
            "Phase 1 catalogue changes live in Tessli's public repository so additions and corrections can be reviewed with their source context. Browsing does not require an account.",
          ],
          items: [
            "Explore and search the public catalogue without an account.",
            "Suggest additions and corrections through the published contribution paths.",
          ],
        },
      ]}
    />
  );
}
