import Link from "next/link";

import { CopyCommand } from "@/components/library/copy-command";
import { PreviewThumbnail } from "@/components/library/preview-thumbnail";
import { Tag } from "@/components/ui/tag";
import {
  getLibraryItem,
  getLibraryItems,
  installCommand,
  libraryKindLabel,
  previewPath,
  type LibraryItem,
} from "@/lib/library";
import { repositoryUrl } from "@/lib/repository";
import {
  getRule,
  RULES_INDEX_PATH,
  rulesInstallCommand,
  type Rule,
} from "@/lib/rules";
import { getBrowsableSourceCounts } from "@/lib/source-profiles";

import styles from "./home-sections.module.css";

/** One item of each kind, shown as live previews. */
export const FEATURED_ITEM_SLUGS = [
  "product-hero",
  "dashboard-overview",
  "empty-state",
] as const;

/** The item whose real notes illustrate "Anatomy of an item". */
export const ANATOMY_ITEM_SLUG = "pricing-tiers";

function requireItem(slug: string): LibraryItem {
  const item = getLibraryItem(slug);
  if (!item) throw new Error(`Missing home library item: ${slug}.`);
  return item;
}

function inlineCode(text: string) {
  return text
    .split(/(`[^`]+`)/g)
    .map((part, index) =>
      part.startsWith("`") && part.endsWith("`") && part.length > 2 ? (
        <code key={index}>{part.slice(1, -1)}</code>
      ) : (
        part
      ),
    );
}

export function HomeSections() {
  const items = getLibraryItems();
  const reviewed = items.filter(
    (item) => item.notes.status === "reviewed",
  ).length;
  const featured = FEATURED_ITEM_SLUGS.map(requireItem);
  const anatomy = requireItem(ANATOMY_ITEM_SLUG);
  const anatomyRules = anatomy.notes.rules
    .map((id) => getRule(id))
    .filter((rule): rule is Rule => rule !== undefined);
  const sources = getBrowsableSourceCounts();

  return (
    <div className={styles.page} data-home-sections>
      <section
        aria-labelledby="home-library-title"
        className={styles.librarySection}
        data-home-library
      >
        <div className="tessli-container">
          <header className={styles.splitHeading}>
            <h2 id="home-library-title">UI with the reasoning attached.</h2>
            <div>
              <p>
                Tessli is an open-source UI library that explains itself. Every
                component, section and page ships with working code, a live
                preview and its reasoning: when to use it, when not to, the
                rules it follows and the generic default it replaces.
              </p>
              <p className={styles.note}>
                {items.length} items so far,{" "}
                {reviewed === 0
                  ? "none reviewed by a maintainer yet"
                  : `${reviewed} reviewed by a maintainer`}
                . <Link href="/library">Browse the library</Link>
              </p>
            </div>
          </header>

          <ul className={styles.featuredGrid}>
            {featured.map((item) => (
              <li key={item.slug}>
                <article
                  className={styles.featuredCard}
                  data-home-featured-item={item.slug}
                >
                  <PreviewThumbnail
                    src={previewPath(item.slug)}
                    title={`${item.notes.title} preview`}
                  />
                  <div className={styles.featuredBody}>
                    <Tag>{libraryKindLabel(item.notes.kind)}</Tag>
                    <h3>
                      <Link
                        className={styles.cardLink}
                        href={`/library/${item.slug}`}
                      >
                        {item.notes.title}
                      </Link>
                    </h3>
                    <p>{inlineCode(item.notes.why_this_is_better[0])}</p>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        aria-labelledby="home-anatomy-title"
        className={styles.anatomySection}
        data-home-anatomy={anatomy.slug}
      >
        <div className="tessli-container">
          <header className={styles.splitHeading}>
            <h2 id="home-anatomy-title">Anatomy of an item.</h2>
            <div>
              <p>
                Every item carries the same notes, for people and for agents.
                These are the real notes for{" "}
                <Link href={`/library/${anatomy.slug}`}>
                  {anatomy.notes.title}
                </Link>
                , shortened; the item page has all of them.
              </p>
            </div>
          </header>

          <div className={styles.anatomy}>
            <div className={styles.anatomyCell}>
              <h3>Use when</h3>
              <ul>
                {anatomy.notes.use_when.slice(0, 2).map((entry) => (
                  <li key={entry}>{inlineCode(entry)}</li>
                ))}
              </ul>
            </div>
            <div className={styles.anatomyCell}>
              <h3>Avoid when</h3>
              <ul>
                {anatomy.notes.avoid_when.slice(0, 2).map((entry) => (
                  <li key={entry}>{inlineCode(entry)}</li>
                ))}
              </ul>
            </div>
            <div className={styles.anatomyCell} data-home-anatomy-default>
              <h3>Common AI default</h3>
              <p>{anatomy.notes.ai_default}</p>
            </div>
            <div className={styles.anatomyCell}>
              <h3>What this item does instead</h3>
              <ul>
                {anatomy.notes.why_this_is_better.slice(0, 3).map((entry) => (
                  <li key={entry}>{inlineCode(entry)}</li>
                ))}
              </ul>
            </div>
            <div
              className={`${styles.anatomyCell} ${styles.anatomyRules}`}
              data-home-anatomy-rules
            >
              <h3>Rules it follows</h3>
              <ul>
                {anatomyRules.map((rule) => (
                  <li key={rule.id}>
                    <Link href={`/rules/${rule.id}`}>
                      <span className={styles.ruleId}>{rule.id}</span>
                      {rule.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="home-ai-title"
        className={styles.aiSection}
        data-home-for-ai
      >
        <div className={`tessli-container ${styles.aiLayout}`}>
          <div className={styles.aiCopy}>
            <h2 id="home-ai-title">The same notes, for coding agents.</h2>
            <p>
              Agents install items with the shadcn CLI and keep every rule in
              one small file, TESSLI.md. A local, read-only MCP server and plain
              JSON and Markdown versions of every page cover the rest.
            </p>
            <ul className={styles.textLinks}>
              <li>
                <Link href="/for-ai">Set up Tessli for AI</Link>
              </li>
              <li>
                <a href={RULES_INDEX_PATH}>Read TESSLI.md</a>
              </li>
            </ul>
          </div>
          <div className={styles.commands}>
            <div>
              <h3>The rules file</h3>
              <CopyCommand
                command={rulesInstallCommand()}
                label="Copy the rules install command"
              />
            </div>
            <div>
              <h3>One item</h3>
              <CopyCommand
                command={installCommand(anatomy.slug)}
                label="Copy the item install command"
              />
            </div>
          </div>
        </div>
      </section>

      <div className={styles.closingBand}>
        <div className={`tessli-container ${styles.closingLayout}`}>
          <section
            aria-labelledby="home-sources-title"
            className={styles.closingPanel}
            data-home-sources
          >
            <h2 id="home-sources-title">Where else to look.</h2>
            <p>
              Beside the library, a curated directory of {sources.sources}{" "}
              design and frontend sources in {sources.categories} categories:
              what each one is good for, how to access it and where it falls
              short.
            </p>
            <ul className={styles.textLinks}>
              <li>
                <Link href="/resources">Browse sources</Link>
              </li>
              <li>
                <Link href="/collections">Read the collections</Link>
              </li>
            </ul>
          </section>
          <section
            aria-labelledby="home-contribute-title"
            className={styles.closingPanel}
            data-home-contribute
          >
            <h2 id="home-contribute-title">Built in the open.</h2>
            <p>
              Suggest a source, submit a design or contribute an item. Every
              path ends in a GitHub issue or pull request, reviewed in public.
            </p>
            <ul className={styles.textLinks}>
              <li>
                <Link href="/contribute">Ways to contribute</Link>
              </li>
              <li>
                <a
                  href={repositoryUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  GitHub repository
                  <span aria-hidden="true" className={styles.externalMark}>
                    ↗
                  </span>
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
