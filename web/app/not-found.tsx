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
        summary="The address may be incomplete, outdated, or no longer part of the site."
        details={[
          "Use Library, Sources or For AI in the header to continue.",
          `Search the ${getBrowsableSourceCounts().sources} listed sources from the home page or Sources.`,
          "Report an outdated Tessli link through the public repository.",
        ]}
      />
    </SiteChrome>
  );
}
