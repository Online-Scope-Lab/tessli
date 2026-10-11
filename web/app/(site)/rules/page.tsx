import Link from "next/link";

import { CopyCommand } from "@/components/library/copy-command";
import libraryStyles from "@/components/library/library.module.css";
import { RuleList } from "@/components/rules/rule-list";
import styles from "@/components/rules/rules.module.css";
import {
  getRules,
  getRulesByCategory,
  RULES_INDEX_PATH,
  rulesInstallCommand,
} from "@/lib/rules";

export const metadata = {
  title: "Rules",
  description:
    "Tessli's UI rules for hierarchy, spacing, states, copy, responsive behaviour and accessibility: each with why it matters, how to check it and the default it guards against.",
  alternates: { types: { "text/markdown": RULES_INDEX_PATH } },
};

export default function RulesPage() {
  const rules = getRules();
  const groups = getRulesByCategory();
  const reviewed = rules.filter((rule) => rule.status === "reviewed").length;

  return (
    <main className={libraryStyles.page} id="main-content" data-rules-page>
      <div className="tessli-container">
        <header className={libraryStyles.hero}>
          <h1>Rules for structure, not style.</h1>
          <p className={`${libraryStyles.lede} ${styles.inlineLinks}`}>
            {rules.length} rules across {groups.length} areas, from hierarchy
            and spacing to states, copy and accessibility. Each one says why it
            matters, how to check it and the generic default it guards against.
            Every <Link href="/library">library item</Link> lists the rules it
            applies.
          </p>
          <p className={libraryStyles.note} data-rules-status>
            Every rule is a draft until a maintainer reviews and signs it.{" "}
            {reviewed === 0
              ? "None is reviewed yet."
              : `${reviewed} of ${rules.length} are reviewed.`}{" "}
            None of them is about colour palette or brand: they are meant to
            hold in any theme.
          </p>
        </header>

        <section className={styles.agents} aria-labelledby="rules-agents-title">
          <h2 id="rules-agents-title">Give the rules to your coding agent</h2>
          <p>
            <a href={RULES_INDEX_PATH}>TESSLI.md</a> is a compact index of every
            rule and its check, small enough for an agent to keep in context.
            This command adds it to the root of a project set up with shadcn/ui:
          </p>
          <CopyCommand command={rulesInstallCommand()} />
        </section>

        <nav className={styles.categoryNav} aria-label="Rule categories">
          <ul>
            {groups.map(({ category, rules: inCategory }) => (
              <li key={category.id}>
                <a href={`#${category.id}`}>
                  {category.label}
                  <span className={styles.categoryCount}>
                    {inCategory.length}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {groups.map(({ category, rules: inCategory }) => (
          <section
            key={category.id}
            id={category.id}
            className={styles.categorySection}
            aria-labelledby={`${category.id}-title`}
          >
            <h2 id={`${category.id}-title`}>{category.label}</h2>
            <RuleList rules={inCategory} showItemCount />
          </section>
        ))}
      </div>
    </main>
  );
}
