import type { ResourceCardData } from "@/components/resource-card/resource-card";
import { buttonClassName } from "@/components/ui/button";

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
        <a
          className={buttonClassName("secondary")}
          href={resource.url}
          rel="noopener noreferrer"
          target="_blank"
        >
          Visit source ↗
        </a>
      )}
    </div>
  );
}
