import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ViewportOverflowProbe } from "@/components/viewport-overflow-probe/viewport-overflow-probe";

import { displayFont, interfaceFont } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Tessli — UI with the reasoning attached",
    template: "%s — Tessli",
  },
  description:
    "An open-source UI library that explains itself, and a curated directory of design sources.",
};

// The site chrome (skip link, header, footer) lives in app/(site)/layout.tsx so
// library previews under /preview render bare.
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
        {children}
      </body>
    </html>
  );
}
