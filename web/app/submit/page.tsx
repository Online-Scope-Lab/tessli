import type { Metadata } from "next";

import { RoutePlaceholder } from "@/components/route-placeholder/route-placeholder";

export const metadata: Metadata = {
  title: "Submit a resource",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SubmitPage() {
  return (
    <RoutePlaceholder
      title="Resource submissions will open with moderation safeguards."
      summary="Tessli will accept useful additions only after server validation, duplicate detection, rate limits, moderation ownership, and contribution status are implemented."
      details={[
        "No public form is collecting personal data in this preview.",
        "Accepted catalogue changes will remain reviewable and attributable.",
        "Submissions will open only after validation, abuse protection, and moderation are working.",
      ]}
    />
  );
}
