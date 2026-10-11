import { PublicContentPage } from "@/components/public-content/public-content-page";
export const metadata = { title: "Privacy" };
export default function PrivacyPage() {
  return (
    <PublicContentPage
      eyebrow="Privacy"
      title="Browse without creating an account."
      summary="This statement describes Tessli's current Phase 1 public application. It is limited to functionality that exists today and will be revised before any account, analytics, or form system is introduced."
      relatedLinks={[
        { href: "/terms", label: "Terms" },
        { href: "/content-policy", label: "Content policy" },
        { href: "/about", label: "About Tessli" },
      ]}
      sections={[
        {
          id: "current-data",
          title: "What Tessli currently stores.",
          paragraphs: [
            "Tessli does not require an account, profile, email address, or password to browse the public catalogue. The current application does not provide a public form submission flow, analytics control, or cloud user-data workspace.",
            "Tessli's pages do not write to your browser's local storage and do not keep a list of the sources you open.",
          ],
        },
        {
          id: "third-parties",
          title: "External destinations have their own practices.",
          paragraphs: [
            "Opening a resource takes you to an independent third-party site. Review that destination's privacy information before using it.",
            "Tessli may display limited external preview metadata where it is available. Resource cards use a no-referrer image policy for arbitrary external images and remain complete if those images fail.",
          ],
        },
      ]}
    />
  );
}
