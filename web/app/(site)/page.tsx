import { ExploreHero } from "@/components/explore-hero/explore-hero";
import { HomeSections } from "@/components/home/home-sections";

export const metadata = {
  title: "Tessli — UI with the reasoning attached",
  description:
    "An open-source UI library that explains itself: components, sections and pages with working code, live previews and their reasoning, plus a curated directory of design sources.",
};

export default function HomePage() {
  return (
    <main id="main-content">
      <ExploreHero />
      <HomeSections />
    </main>
  );
}
