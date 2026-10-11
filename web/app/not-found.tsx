import { RoutePlaceholder } from "@/components/route-placeholder/route-placeholder";
import { SiteChrome } from "@/components/site-chrome/site-chrome";
import { getBrowsableSourceCounts } from "@/lib/source-profiles";

export const metadata = {
  title: "Page not found",
};

export default function NotFoundPage() {
  // The root not-found page sits outside app/(site), so it adds the chrome.
  return (
    <SiteChrome>
      <RoutePlaceholder
        title="This Tessli route does not exist."
        summary="The address may be incomplete, outdated, or no longer part of the public catalogue."
        details={[
          `Return to Explore to search all ${getBrowsableSourceCounts().sources} reviewed resources.`,
          "Use Browse or Collections to continue through the current catalogue.",
          "Report an outdated Tessli link through the public repository.",
        ]}
      />
    </SiteChrome>
  );
}
