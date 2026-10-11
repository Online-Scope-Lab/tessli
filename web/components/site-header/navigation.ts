// Relative with the extension so node:test can import this module directly.
import { repositoryUrl } from "../../lib/repository.ts";

export type NavigationItem = Readonly<{
  label: string;
  href: string;
  available: boolean;
  match?: "exact" | "prefix" | "none";
  /** Other route prefixes that also mark this item active (e.g. Collections under Sources). */
  alsoActiveFor?: readonly string[];
  /** Opens outside Tessli (a new tab, marked with ↗). */
  external?: boolean;
}>;

// Plan §5: Library | Sources | For AI. The nav says "Sources"; the URL stays
// /resources so existing links and machine paths keep working. Collections
// are curated source guides, so they count as part of Sources.
export const primaryNavigationItems: readonly NavigationItem[] = [
  { label: "Library", href: "/library", available: true, match: "prefix" },
  {
    label: "Sources",
    href: "/resources",
    available: true,
    match: "prefix",
    alsoActiveFor: ["/collections"],
  },
  { label: "For AI", href: "/for-ai", available: true, match: "exact" },
] as const;

export const utilityNavigationItems: readonly NavigationItem[] = [
  {
    label: "Contribute",
    href: "/contribute",
    available: true,
    match: "exact",
  },
  {
    label: "GitHub",
    href: repositoryUrl,
    available: true,
    match: "none",
    external: true,
  },
] as const;

export const availablePrimaryNavigationItems = primaryNavigationItems.filter(
  (item) => item.available,
);

export const availableUtilityNavigationItems = utilityNavigationItems.filter(
  (item) => item.available,
);

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isNavigationItemActive(
  item: NavigationItem,
  pathname: string,
): boolean {
  if (item.match === "none" || item.external) return false;
  if (item.match === "exact") return pathname === item.href;
  return [item.href, ...(item.alsoActiveFor ?? [])].some((prefix) =>
    matchesPrefix(pathname, prefix),
  );
}
