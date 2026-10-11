import { repositoryUrl } from "@/lib/repository";

export type FooterLink = Readonly<{
  label: string;
  href: string;
  external?: boolean;
}>;

export type FooterGroup = Readonly<{
  id: string;
  label: string;
  links: readonly FooterLink[];
}>;

export const footerGroups: readonly FooterGroup[] = [
  {
    id: "footer-research",
    label: "Research",
    links: [
      { label: "Browse sources", href: "/resources" },
      { label: "Collections", href: "/collections" },
      { label: "For AI", href: "/for-ai" },
    ],
  },
  {
    id: "footer-contribute",
    label: "Contribute",
    links: [
      { label: "GitHub repository", href: repositoryUrl, external: true },
    ],
  },
  {
    id: "footer-about",
    label: "About",
    links: [
      { label: "About Tessli", href: "/about" },
      { label: "Curation process", href: "/curation" },
    ],
  },
  {
    id: "footer-legal",
    label: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Content policy", href: "/content-policy" },
    ],
  },
] as const;

export const internalFooterRoutes = footerGroups.flatMap((group) =>
  group.links.filter((link) => !link.external).map((link) => link.href),
);
