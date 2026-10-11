import type { Metadata } from "next";

import { RoutePlaceholder } from "@/components/route-placeholder/route-placeholder";

export const metadata: Metadata = {
  title: "Suggest an improvement",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SuggestPage() {
  return (
    <RoutePlaceholder
      title="Corrections and improvements will use a reviewed workflow."
      summary="Suggestions may cover outdated descriptions, access labels, broken destinations, missing metadata, or clearer categorisation. Nothing will publish directly without review."
      details={[
        "The current preview does not send or store suggestion form data.",
        "Repository history will preserve accepted catalogue corrections.",
        "The suggestion workflow will open only after validation and moderation are working.",
      ]}
    />
  );
}
