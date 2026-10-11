import Link from "next/link";

import { PreviewThumbnail } from "@/components/library/preview-thumbnail";
import styles from "@/components/library/library.module.css";
import { Tag } from "@/components/ui/tag";
import {
  getLibraryItems,
  getUsedLibraryCategories,
  LIBRARY_KINDS,
  libraryCategoryLabel,
  libraryKindLabel,
  previewPath,
  type LibraryItemKind,
} from "@/lib/library";

export const metadata = {
  title: "Library",
  description:
    "UI components and sections with the reasoning attached: live previews in three themes, taste notes, states and accessibility notes, installable with the shadcn CLI.",
};

type LibrarySearchParams = Record<string, string | string[] | undefined>;

type Filters = Readonly<{ kind?: LibraryItemKind; category?: string }>;

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function libraryHref(filters: Filters) {
  const params = new URLSearchParams();
  if (filters.kind) params.set("kind", filters.kind);
  if (filters.category) params.set("category", filters.category);
  const query = params.toString();
  return `/library${query ? `?${query}` : ""}`;
}

function FilterLink({
  href,
  current,
  children,
}: Readonly<{ href: string; current: boolean; children: string }>) {
  return (
    <li>
      <Link
        className={styles.filterLink}
        href={href}
        aria-current={current ? "page" : undefined}
        scroll={false}
      >
        {children}
      </Link>
    </li>
  );
}

export default async function LibraryPage({
  searchParams,
}: Readonly<{ searchParams: Promise<LibrarySearchParams> }>) {
  const query = await searchParams;
  const items = getLibraryItems();
  const kinds = LIBRARY_KINDS.filter((kind) =>
    items.some((item) => item.notes.kind === kind),
  );
  const categories = getUsedLibraryCategories();

  // Unknown filter values are ignored rather than showing an empty page.
  const requestedKind = single(query.kind);
  const requestedCategory = single(query.category);
  const filters: Filters = {
    kind: kinds.find((kind) => kind === requestedKind),
    category: categories.find((category) => category.id === requestedCategory)
      ?.id,
  };
  const shown = items.filter(
    (item) =>
      (!filters.kind || item.notes.kind === filters.kind) &&
      (!filters.category || item.notes.category === filters.category),
  );
  const reviewed = items.filter(
    (item) => item.notes.status === "reviewed",
  ).length;

  return (
    <main className={styles.page} id="main-content" data-library-page>
      <div className="tessli-container">
        <header className={styles.hero}>
          <h1>UI with the reasoning attached.</h1>
          <p className={styles.lede}>
            Components and sections that ship with working code, a live preview
            in three themes and their taste notes: when to use them, when not
            to, the generic default they replace, and their states, responsive
            behaviour and accessibility. Install any item with the shadcn CLI.
          </p>
          <p className={styles.note}>
            The library is new: {items.length} items so far,{" "}
            {reviewed === 0
              ? "none reviewed by a maintainer yet"
              : `${reviewed} reviewed by a maintainer`}
            . Every item is checked automatically for accessibility, overflow
            and console errors in all three themes and at five widths.
          </p>
        </header>

        <nav className={styles.filters} aria-label="Filter library items">
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel} id="library-kind-label">
              Kind
            </span>
            <ul
              className={styles.filterOptions}
              aria-labelledby="library-kind-label"
            >
              <FilterLink
                href={libraryHref({ ...filters, kind: undefined })}
                current={!filters.kind}
              >
                All kinds
              </FilterLink>
              {kinds.map((kind) => (
                <FilterLink
                  key={kind}
                  href={libraryHref({ ...filters, kind })}
                  current={filters.kind === kind}
                >
                  {libraryKindLabel(kind)}
                </FilterLink>
              ))}
            </ul>
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel} id="library-category-label">
              Category
            </span>
            <ul
              className={styles.filterOptions}
              aria-labelledby="library-category-label"
            >
              <FilterLink
                href={libraryHref({ ...filters, category: undefined })}
                current={!filters.category}
              >
                All categories
              </FilterLink>
              {categories.map((category) => (
                <FilterLink
                  key={category.id}
                  href={libraryHref({ ...filters, category: category.id })}
                  current={filters.category === category.id}
                >
                  {category.label}
                </FilterLink>
              ))}
            </ul>
          </div>
        </nav>

        <p className={styles.resultLine} data-library-results>
          {shown.length === items.length
            ? `Showing all ${items.length} items.`
            : `Showing ${shown.length} of ${items.length} items.`}
        </p>

        {shown.length > 0 ? (
          <ul className={styles.grid} data-library-grid>
            {shown.map((item) => (
              <li key={item.slug}>
                <article className={styles.card} data-library-item={item.slug}>
                  <PreviewThumbnail
                    src={previewPath(item.slug)}
                    title={`${item.notes.title} preview`}
                  />
                  <div className={styles.cardBody}>
                    <h2>
                      <Link
                        className={styles.cardLink}
                        href={`/library/${item.slug}`}
                      >
                        {item.notes.title}
                      </Link>
                    </h2>
                    <p>{item.notes.summary}</p>
                    <ul className={styles.meta} aria-label="Item details">
                      <li>
                        <Tag>{libraryKindLabel(item.notes.kind)}</Tag>
                      </li>
                      <li>
                        <Tag>{libraryCategoryLabel(item.notes.category)}</Tag>
                      </li>
                      <li>
                        <Tag
                          tone={
                            item.notes.status === "reviewed"
                              ? "signal"
                              : "neutral"
                          }
                        >
                          {item.notes.status === "reviewed"
                            ? "Reviewed"
                            : "Community"}
                        </Tag>
                      </li>
                    </ul>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>
            No items match these filters yet.{" "}
            <Link href="/library">Show all items</Link>
          </p>
        )}
      </div>
    </main>
  );
}
