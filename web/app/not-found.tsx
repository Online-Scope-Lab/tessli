import { RoutePlaceholder } from "@/components/route-placeholder/route-placeholder";

export const metadata = {
  title: "Page not found",
};

export default function NotFoundPage() {
  return (
    <RoutePlaceholder
      title="This Tessli route does not exist."
      summary="The address may be incomplete, outdated, or no longer part of the public catalogue."
      details={[
        "Return to Explore to search all 295 reviewed resources.",
        "Use Browse or Collections to continue through the current catalogue.",
        "Report an outdated Tessli link through the public repository.",
      ]}
    />
  );
}
