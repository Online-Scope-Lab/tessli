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

// Plan §5 footer: About · Rules · Contribute · Privacy · Terms · Content
// policy, plus the primary destinations for the end of long pages.
// Collections and the curation notes sit with Sources.
export const footerGroups: readonly FooterGroup[] = [
  {
    id: "footer-browse",
    label: "Browse",
    links: [
      { label: "Library", href: "/library" },
      { label: "Sources", href: "/resources" },
      { label: "Collections", href: "/collections" },
      { label: "For AI", href: "/for-ai" },
    ],
  },
  {
    id: "footer-project",
    label: "Project",
    links: [
      { label: "About", href: "/about" },
      { label: "Rules", href: "/rules" },
      { label: "Contribute", href: "/contribute" },
      { label: "How sources are chosen", href: "/curation" },
      { label: "GitHub repository", href: repositoryUrl, external: true },
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
