import {
  ResourceCard,
  type ResourceCardData,
} from "@/components/resource-card/resource-card";
import type { SourceProfile } from "@/lib/source-profiles";

import styles from "./browse.module.css";

type BrowseResult = Readonly<{
  profile: SourceProfile;
  categoryLabel: string;
  card: ResourceCardData;
}>;

type BrowseResultsProps = Readonly<{
  resources: readonly BrowseResult[];
}>;

export function BrowseResults({ resources }: BrowseResultsProps) {
  return (
    <div className={styles.cardGrid} data-browse-view="cards">
      {resources.map(({ profile, categoryLabel, card }) => (
        <ResourceCard
          categoryLabel={categoryLabel}
          key={profile.id}
          profileHref={`/resources/${profile.slug}`}
          resource={{ ...card, description: profile.summary }}
        />
      ))}
    </div>
  );
}
