import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site-footer/site-footer";
import "@/components/site-header/site-header-global.css";
import { SiteHeader } from "@/components/site-header/site-header";

/**
 * The site's skip link, global header and footer. Every site page gets it from
 * app/(site)/layout.tsx; the root not-found page renders it directly. Library
 * previews (/preview) render without it.
 */
export function SiteChrome({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <SiteHeader />
      <div data-site-content>
        {children}
        <SiteFooter />
      </div>
    </>
  );
}
