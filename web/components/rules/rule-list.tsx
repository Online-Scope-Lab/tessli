import Link from "next/link";

import type { Rule } from "@/lib/rules";

import styles from "./rules.module.css";

/**
 * Rules as rows: the id, then the statement as a link to the rule's page.
 * Used on /rules and in the Rules section of /library/[slug].
 */
export function RuleList({
  rules,
  showItemCount = false,
}: Readonly<{ rules: readonly Rule[]; showItemCount?: boolean }>) {
  return (
    <ul className={styles.ruleList}>
      {rules.map((rule) => (
        <li key={rule.id} className={styles.ruleRow} data-rule={rule.id}>
          <span className={styles.ruleId}>{rule.id}</span>
          <div className={styles.ruleText}>
            <Link className={styles.ruleLink} href={`/rules/${rule.id}`}>
              {rule.statement}
            </Link>
            {showItemCount ? (
              <span className={styles.ruleMeta}>
                {rule.items.length === 0
                  ? "No library item applies it yet"
                  : `Applied by ${rule.items.length} library item${rule.items.length > 1 ? "s" : ""}`}
              </span>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
