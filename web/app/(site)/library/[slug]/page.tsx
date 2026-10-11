import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { CopyCommand } from "@/components/library/copy-command";
import styles from "@/components/library/library.module.css";
import { PreviewWorkbench } from "@/components/library/preview-workbench";
import { RuleList } from "@/components/rules/rule-list";
import ruleStyles from "@/components/rules/rules.module.css";
import { Tag } from "@/components/ui/tag";
import {
  getLibraryItem,
  getLibraryItems,
  installCommand,
  libraryCategoryLabel,
  libraryKindLabel,
  reviewStatusText,
} from "@/lib/library";
import { getRule, type Rule } from "@/lib/rules";

export const dynamicParams = false;

type ItemPageProps = Readonly<{ params: Promise<{ slug: string }> }>;

export function generateStaticParams() {
  return getLibraryItems().map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: ItemPageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = getLibraryItem(slug);
  if (!item) return {};
  return {
    title: item.notes.title,
    description: item.notes.summary,
    alternates: {
      types: {
        "application/json": `/library/${slug}/item.json`,
        "text/markdown": `/library/${slug}/item.md`,
      },
    },
  };
}

/** Inline Markdown used in notes: `code` and **bold** only. */
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

function List({ items }: Readonly<{ items: readonly string[] }>) {
  return (
    <ul className={styles.list}>
      {items.map((entry) => (
        <li key={entry}>{inlineMarkdown(entry)}</li>
      ))}
    </ul>
  );
}

function Section({
  id,
  title,
  children,
}: Readonly<{ id: string; title: string; children: ReactNode }>) {
  return (
    <section className={styles.section} aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      {children}
    </section>
  );
}

export default async function LibraryItemPage({ params }: ItemPageProps) {
  const { slug } = await params;
  const item = getLibraryItem(slug);
  if (!item) notFound();
  const { notes } = item;
  const command = installCommand(slug);
  const paragraphs = item.body.split(/\n{2,}/).map((p) => p.trim());
  const primitives = item.registryDependencies;
  // build-registry guarantees every listed rule exists.
  const rules = notes.rules
    .map((id) => getRule(id))
    .filter((rule): rule is Rule => rule !== undefined);

  return (
    <main className={styles.page} id="main-content" data-library-item-page>
      <div className="tessli-container">
        <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
          <Link href="/library">Library</Link> / {notes.title}
        </nav>

        <header className={styles.itemHeader}>
          <h1>{notes.title}</h1>
          <p className={styles.lede}>{notes.summary}</p>
          <ul className={styles.meta} aria-label="Item details">
            <li>
              <Tag>{libraryKindLabel(notes.kind)}</Tag>
            </li>
            <li>
              <Tag>{libraryCategoryLabel(notes.category)}</Tag>
            </li>
            <li>
              <Tag tone={notes.status === "reviewed" ? "signal" : "neutral"}>
                {notes.status === "reviewed" ? "Reviewed" : "Community"}
              </Tag>
            </li>
          </ul>
          <p className={styles.status} data-review-status>
            {reviewStatusText(notes)}
          </p>
        </header>

        <Section id="preview-title" title="Preview">
          <PreviewWorkbench
            slug={slug}
            title={notes.title}
            states={notes.states}
          />
        </Section>

        <Section id="install-title" title="Install">
          <CopyCommand command={command} />
          <p className={styles.note}>
            Run it in a project set up with shadcn/ui. It adds{" "}
            <code>{slug}.tsx</code> to your components folder
            {primitives.length
              ? `, plus the shadcn/ui ${primitives.join(", ")} component${primitives.length > 1 ? "s" : ""} if you don’t have ${primitives.length > 1 ? "them" : "it"}`
              : ""}
            , and the item takes on your project’s theme.
          </p>
        </Section>

        <Section id="fit-title" title="When to use it">
          <div className={styles.columns}>
            <div>
              <h3>Use when</h3>
              <List items={notes.use_when} />
            </div>
            <div>
              <h3>Avoid when</h3>
              <List items={notes.avoid_when} />
            </div>
          </div>
        </Section>

        <Section id="default-title" title="Common AI default vs. this">
          <div className={styles.contrast}>
            <div>
              <h3>The common default</h3>
              <p>{notes.ai_default}</p>
            </div>
            <div>
              <h3>What this item does instead</h3>
              <List items={notes.why_this_is_better} />
            </div>
          </div>
        </Section>

        <Section id="reasoning-title" title="Why it is built this way">
          <div className={styles.prose}>
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{inlineMarkdown(paragraph)}</p>
            ))}
          </div>
        </Section>

        <Section id="rules-title" title="Rules">
          <RuleList rules={rules} />
          <p className={`${styles.note} ${ruleStyles.inlineLinks}`}>
            Each rule page says why the rule matters and how to check it. Rules
            are drafts until a maintainer signs them;{" "}
            <Link href="/rules">see all rules</Link>.
          </p>
        </Section>

        <Section id="failures-title" title="How it breaks">
          <p className={styles.note}>
            Common mistakes when adapting this item.
          </p>
          <List items={notes.failures} />
        </Section>

        <Section
          id="behaviour-title"
          title="States, responsive behaviour and accessibility"
        >
          <dl className={styles.facts}>
            <dt>States</dt>
            <dd>
              {notes.states.map((state) => state.replace(/-/g, " ")).join(", ")}
            </dd>
            <dt>Desktop</dt>
            <dd>{notes.responsive.desktop}</dd>
            <dt>Mobile</dt>
            <dd>{notes.responsive.mobile}</dd>
          </dl>
          <h3 className={styles.subheading}>Accessibility</h3>
          <List items={notes.a11y} />
        </Section>

        <Section id="code-title" title="Code">
          <p className={styles.path}>
            <code>{item.sourcePath}</code>
          </p>
          <pre
            className={styles.code}
            tabIndex={0}
            aria-label="Item source code"
          >
            <code>{item.source}</code>
          </pre>
        </Section>

        <Section id="credits-title" title="Credits and licence">
          <dl className={styles.facts}>
            <dt>Contributors</dt>
            <dd>
              {notes.contributors.length
                ? notes.contributors.map((handle) => `@${handle}`).join(", ")
                : "None credited yet."}
            </dd>
            <dt>Provenance</dt>
            <dd>
              {notes.provenance === "adapted" && notes.source_url ? (
                <>
                  Adapted from{" "}
                  <a href={notes.source_url} rel="noopener noreferrer">
                    {notes.source_url}
                  </a>{" "}
                  ({notes.source_license})
                </>
              ) : (
                "Original work"
              )}
            </dd>
            <dt>Licence</dt>
            <dd>{notes.license}</dd>
            <dt>Review</dt>
            <dd>{reviewStatusText(notes)}</dd>
          </dl>
        </Section>

        <Section id="agents-title" title="For agents">
          <p className={styles.note}>
            The same taste notes and code as structured data.
          </p>
          <ul className={styles.representations}>
            <li>
              <a href={`/library/${slug}/item.json`}>item.json</a>
            </li>
            <li>
              <a href={`/library/${slug}/item.md`}>item.md</a>
            </li>
            <li>
              <a href={`/preview/${slug}`}>Bare preview</a>
            </li>
          </ul>
        </Section>
      </div>
    </main>
  );
}
