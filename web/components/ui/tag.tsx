import type { ComponentPropsWithoutRef } from "react";

import styles from "./tag.module.css";

export type TagTone = "neutral" | "signal";

type TagProps = Readonly<
  ComponentPropsWithoutRef<"span"> & {
    tone?: TagTone;
  }
>;

/** Non-interactive metadata label. */
export function Tag({ tone = "neutral", className, ...rest }: TagProps) {
  return (
    <span
      {...rest}
      className={[styles.tag, styles[tone], className]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
