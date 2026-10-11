import library from "../data/library.json" with { type: "json" };

/** Taste notes: the validated frontmatter of an item's notes.md (plan §6.2). */
export type LibraryItemNotes = Readonly<{
  id: string;
  kind: LibraryItemKind;
  category: string;
  title: string;
  summary: string;
  use_when: readonly string[];
  avoid_when: readonly string[];
  rules: readonly string[];
  ai_default: string;
  why_this_is_better: readonly string[];
  failures: readonly string[];
  states: readonly string[];
  responsive: Readonly<{ desktop: string; mobile: string }>;
  a11y: readonly string[];
  status: "community" | "reviewed";
  reviewed_by: readonly string[];
  reviewed_at: string | null;
  contributors: readonly string[];
  provenance: "original" | "adapted";
  source_url?: string;
  source_license?: string;
  license: string;
}>;

export type LibraryItemKind = "component" | "section" | "page";

export type LibraryItem = Readonly<{
  slug: string;
  type: string;
  notes: LibraryItemNotes;
  /** The prose after the frontmatter, as Markdown paragraphs. */
  body: string;
  registryDependencies: readonly string[];
  dependencies: readonly string[];
  sourcePath: string;
  source: string;
}>;

export type LibraryCategory = Readonly<{ id: string; label: string }>;

export const LIBRARY_KINDS: readonly LibraryItemKind[] = [
  "component",
  "section",
  "page",
];

export const PREVIEW_THEMES = ["tessli", "neutral", "dark"] as const;
export type PreviewTheme = (typeof PREVIEW_THEMES)[number];

export const PREVIEW_THEME_LABELS: Readonly<Record<PreviewTheme, string>> = {
  tessli: "Tessli",
  neutral: "Neutral",
  dark: "Dark",
};

export const PREVIEW_WIDTHS = [1440, 768, 390] as const;

const items = library.items as unknown as readonly LibraryItem[];
const categories = library.categories as readonly LibraryCategory[];
const categoryLabels = new Map(categories.map((c) => [c.id, c.label]));

export function getLibraryItems(): readonly LibraryItem[] {
  return items;
}

export function getLibraryItem(slug: string): LibraryItem | undefined {
  return items.find((item) => item.slug === slug);
}

export function getLibraryCategories(): readonly LibraryCategory[] {
  return categories;
}

/** Categories that hold at least one item, in taxonomy order. */
export function getUsedLibraryCategories(): readonly LibraryCategory[] {
  const used = new Set(items.map((item) => item.notes.category));
  return categories.filter((category) => used.has(category.id));
}

export function libraryCategoryLabel(id: string): string {
  return categoryLabels.get(id) ?? id;
}

export function libraryKindLabel(kind: LibraryItemKind): string {
  return kind[0].toUpperCase() + kind.slice(1);
}

export function installCommand(slug: string): string {
  return `${library.installPrefix}${slug}`;
}

export function isPreviewTheme(value: unknown): value is PreviewTheme {
  return (
    typeof value === "string" &&
    (PREVIEW_THEMES as readonly string[]).includes(value)
  );
}

export function previewPath(
  slug: string,
  options: { theme?: PreviewTheme; state?: string } = {},
): string {
  const params = new URLSearchParams();
  if (options.theme && options.theme !== "tessli") {
    params.set("theme", options.theme);
  }
  if (options.state) params.set("state", options.state);
  const query = params.toString();
  return `/preview/${slug}${query ? `?${query}` : ""}`;
}

/** Honest review status for display. */
export function reviewStatusText(notes: LibraryItemNotes): string {
  if (notes.status === "reviewed" && notes.reviewed_at) {
    return `Reviewed by ${notes.reviewed_by
      .map((handle) => `@${handle}`)
      .join(", ")} on ${notes.reviewed_at}`;
  }
  return "Community — not yet reviewed by a maintainer";
}
