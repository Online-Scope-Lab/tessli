import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import libraryStyles from "@/components/library/library.module.css";
import styles from "@/components/rules/rules.module.css";
import { Tag } from "@/components/ui/tag";
import { repositoryUrl } from "@/lib/repository";
import {
  getRule,
  getRules,
  ruleCategoryLabel,
  ruleStatusText,
} from "@/lib/rules";

export const dynamicParams = false;

type RulePageProps = Readonly<{ params: Promise<{ id: string }> }>;

export function generateStaticParams() {
  return getRules().map((rule) => ({ id: rule.id }));
}

export async function generateMetadata({
  params,
}: RulePageProps): Promise<Metadata> {
  const { id } = await params;
  const rule = getRule(id);
  if (!rule) return {};
  return { title: `${rule.id} ${rule.title}`, description: rule.statement };
}

/** Inline Markdown used in rule prose: `code` and **bold** only. */
function inlineMarkdown(text: string): ReactNode[] {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function Section({
  id,
  title,
  children,
}: Readonly<{ id: string; title: string; children: ReactNode }>) {
  return (
    <section className={libraryStyles.section} aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      {children}
    </section>
  );
}

export default async function RulePage({ params }: RulePageProps) {
  const { id } = await params;
  const rule = getRule(id);
  if (!rule) notFound();

  const rules = getRules();
  const index = rules.findIndex((entry) => entry.id === rule.id);
  const previous = index > 0 ? rules[index - 1] : undefined;
  const next = index < rules.length - 1 ? rules[index + 1] : undefined;
  const paragraphs = rule.body
    ? rule.body.split(/\n{2,}/).map((paragraph) => paragraph.trim())
    : [];

  return (
    <main className={libraryStyles.page} id="main-content" data-rule-page>
      <div className="tessli-container">
        <nav aria-label="Breadcrumb" className={libraryStyles.breadcrumb}>
          <Link href="/rules">Rules</Link> /{" "}
          <Link href={`/rules#${rule.category}`}>
            {ruleCategoryLabel(rule.category)}
          </Link>{" "}
          / {rule.id}
        </nav>

        <header className={styles.ruleHeader}>
          <ul className={libraryStyles.meta} aria-label="Rule details">
            <li>
              <Tag>{rule.id}</Tag>
            </li>
            <li>
              <Tag>{ruleCategoryLabel(rule.category)}</Tag>
            </li>
            <li>
              <Tag tone={rule.status === "reviewed" ? "signal" : "neutral"}>
                {rule.status === "reviewed" ? "Reviewed" : "Draft"}
              </Tag>
            </li>
          </ul>
          <h1>{rule.title}</h1>
          <p className={styles.statement} data-rule-statement>
            {rule.statement}
          </p>
          <p className={libraryStyles.status} data-rule-status>
            {ruleStatusText(rule)}
          </p>
        </header>

        <Section id="why-title" title="Why it matters">
          <div className={libraryStyles.prose}>
            <p>{rule.why}</p>
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{inlineMarkdown(paragraph)}</p>
            ))}
          </div>
        </Section>

        <Section id="check-title" title="How to check it">
          <p className={styles.check} data-rule-check>
            {rule.check}
          </p>
        </Section>

        <Section id="default-title" title="The default it guards against">
          <div className={libraryStyles.prose}>
            <p>{rule.anti_pattern}</p>
          </div>
        </Section>

        <Section id="items-title" title="Library items that apply it">
          {rule.items.length ? (
            <ul className={styles.itemLinks} data-rule-items>
              {rule.items.map((item) => (
                <li key={item.slug}>
                  <Link href={`/library/${item.slug}`}>{item.title}</Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className={libraryStyles.note} data-rule-items>
              No library item applies this rule yet. Items list the rules they
              follow in their taste notes, and this page picks them up
              automatically.
            </p>
          )}
        </Section>

        <Section id="sources-title" title="Where it comes from">
          <ul className={libraryStyles.list}>
            {rule.sources.map((source) => (
              <li key={source}>{source}</li>
            ))}
          </ul>
          <p className={`${libraryStyles.note} ${styles.inlineLinks}`}>
            Repository paths refer to the{" "}
            <a href={repositoryUrl} rel="noopener noreferrer" target="_blank">
              Tessli repository <span aria-hidden="true">↗</span>
            </a>
            ; WCAG references are to WCAG 2.2.
          </p>
        </Section>

        <nav className={styles.pager} aria-label="More rules">
          {previous ? (
            <Link href={`/rules/${previous.id}`}>
              <span>Previous rule</span>
              {previous.id} {previous.title}
            </Link>
          ) : null}
          {next ? (
            <Link className={styles.pagerNext} href={`/rules/${next.id}`}>
              <span>Next rule</span>
              {next.id} {next.title}
            </Link>
          ) : null}
        </nav>
      </div>
    </main>
  );
}
