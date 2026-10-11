import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site-footer/site-footer";
import "@/components/site-header/site-header-global.css";
import { SiteHeader } from "@/components/site-header/site-header";
import { ViewportOverflowProbe } from "@/components/viewport-overflow-probe/viewport-overflow-probe";

import { displayFont, interfaceFont } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Tessli — Curated design resources",
    template: "%s — Tessli",
  },
  description:
    "A manually curated index of useful web and product design resources for designers and developers.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${interfaceFont.variable} ${displayFont.variable}`}
      data-grain="on"
      data-scroll-behavior="smooth"
    >
      <body>
        <ViewportOverflowProbe />
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <SiteHeader />
        <div data-site-content>
          {children}
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
