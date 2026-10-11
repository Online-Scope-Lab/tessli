import type { ResourceCardData } from "@/components/resource-card/resource-card";

import styles from "./source-actions.module.css";

type SourceActionsProps = Readonly<{
  resource: ResourceCardData;
}>;

export function SourceActions({ resource }: SourceActionsProps) {
  return (
    <div className={styles.wrapper}>
      {resource.status === "unavailable" ? (
        <span className={styles.unavailable}>
          Provider currently unavailable
        </span>
      ) : (
        <a href={resource.url} rel="noopener noreferrer" target="_blank">
          Visit source ↗
        </a>
      )}
    </div>
  );
}
