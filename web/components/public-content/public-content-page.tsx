import Link from "next/link";

import styles from "./public-content-page.module.css";

type ContentSection = Readonly<{
  id: string;
  title: string;
  paragraphs: readonly string[];
  items?: readonly string[];
}>;

type RelatedLink = Readonly<{ href: string; label: string }>;

type PublicContentPageProps = Readonly<{
  /** Plain page name shown above the title (sentence case, not an eyebrow). */
  label: string;
  title: string;
  summary: string;
  sections: readonly ContentSection[];
  relatedLinks: readonly RelatedLink[];
}>;

export function PublicContentPage({
  label,
  title,
  summary,
  sections,
  relatedLinks,
}: PublicContentPageProps) {
  return (
    <main className={styles.page} id="main-content">
      <div className={`tessli-container ${styles.layout}`}>
        <header className={styles.intro}>
          <p className={styles.pageLabel}>{label}</p>
          <h1>{title}</h1>
          <p>{summary}</p>
        </header>
        <article className={styles.article}>
          {sections.map((section) => (
            <section aria-labelledby={section.id} key={section.id}>
              <h2 id={section.id}>{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.items ? (
                <ul>
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </article>
        <aside aria-label="Related Tessli pages" className={styles.aside}>
          <p className={styles.asideLabel}>Keep reading</p>
          <nav>
            {relatedLinks.map((link) => (
              <Link href={link.href} key={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>
      </div>
    </main>
  );
}
