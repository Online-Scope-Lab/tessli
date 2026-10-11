export type NavigationItem = Readonly<{
  label: string;
  href: string;
  available: boolean;
  match?: "exact" | "prefix" | "none";
}>;

export const primaryNavigationItems: readonly NavigationItem[] = [
  { label: "Browse", href: "/resources", available: true, match: "prefix" },
  {
    label: "Collections",
    href: "/collections",
    available: true,
    match: "prefix",
  },
  { label: "For AI", href: "/for-ai", available: true, match: "exact" },
] as const;

export const utilityNavigationItems: readonly NavigationItem[] = [
  {
    label: "Search",
    href: "/resources#browse-search",
    available: true,
    match: "none",
  },
] as const;

export const availablePrimaryNavigationItems = primaryNavigationItems.filter(
  (item) => item.available,
);

export const availableUtilityNavigationItems = utilityNavigationItems.filter(
  (item) => item.available,
);
