import type { ComponentPropsWithoutRef } from "react";

import styles from "./eyebrow.module.css";

type EyebrowProps = Readonly<ComponentPropsWithoutRef<"p">>;

/**
 * Uppercase label above a heading. Tessli allows one eyebrow per page, in the
 * home hero only (docs/v1.2/plan.md §4); do not add it above section headings.
 */
export function Eyebrow({ className, ...rest }: EyebrowProps) {
  return (
    <p
      {...rest}
      className={[styles.eyebrow, className].filter(Boolean).join(" ")}
    />
  );
}
