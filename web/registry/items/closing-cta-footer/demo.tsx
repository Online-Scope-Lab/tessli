// Fictional product: Northwind Notes. The .example addresses, links and terms
// are invented for the demo; they describe no real product.
import {
  ClosingCtaFooter,
  type ClosingCta,
  type FooterLink,
  type FooterLinkGroup,
} from "./closing-cta-footer";

const brand = {
  name: "Northwind Notes",
  href: "#home",
  description: "Shared notebooks for teams that write things down.",
};

const groups: FooterLinkGroup[] = [
  {
    title: "Product",
    links: [
      { label: "Pricing", href: "#pricing" },
      { label: "Changelog", href: "#changelog" },
      { label: "Desktop and mobile apps", href: "#apps" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Guides", href: "#guides" },
      { label: "Export your notes", href: "#export" },
      {
        label: "Service status",
        href: "https://status.northwind-notes.example",
        external: true,
      },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#about" },
      { label: "Security", href: "#security" },
    ],
  },
];

const legal: FooterLink[] = [
  { label: "Privacy", href: "#privacy" },
  { label: "Terms", href: "#terms" },
];

const contact = (
  <p>
    Questions before you switch? Email{" "}
    <a
      href="mailto:hello@northwind-notes.example"
      className="font-medium break-words text-foreground underline underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      hello@northwind-notes.example
    </a>
    ; a person replies within one working day.
  </p>
);

const copyright = (
  <p>© 2026 Northwind Notes. A fictional product for this demo.</p>
);

const cta: ClosingCta = {
  title: "Move your team’s notes into one place this week",
  description:
    "Import from Markdown or plain folders, invite the people who write, and keep readers free. Your notebooks stay exportable on every plan.",
  action: { label: "Create a free workspace", href: "#sign-up" },
  secondaryAction: { label: "Compare plans", href: "#pricing" },
  note: <p>Free for one person. No card needed.</p>,
};

export function ClosingCtaFooterExample({
  withCta = true,
}: {
  withCta?: boolean;
}) {
  return (
    <ClosingCtaFooter
      cta={withCta ? cta : undefined}
      brand={brand}
      groups={groups}
      contact={contact}
      legal={legal}
      copyright={copyright}
    />
  );
}

export default function ClosingCtaFooterDemo() {
  return <ClosingCtaFooterExample />;
}
