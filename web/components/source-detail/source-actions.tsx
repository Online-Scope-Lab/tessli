import type { ResourceCardData } from "@/components/resource-card/resource-card";
import { buttonClassName } from "@/components/ui/button";

import styles from "./source-actions.module.css";

type SourceActionsProps = Readonly<{
  resource: ResourceCardData;
}>;

export function SourceActions({ resource }: SourceActionsProps) {
  return (
    <div className={styles.wrapper}>
      {resource.status === "archived" ? (
        // An archived source is not promoted: its old address stays visible as
        // plain text with a quiet link, never as the primary Visit action.
        <p className={styles.archived}>
          Original address:{" "}
          <a href={resource.url} rel="noopener noreferrer" target="_blank">
            {resource.domain} ↗
          </a>
        </p>
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
