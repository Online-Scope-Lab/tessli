import type { ReactNode } from "react";

import { SiteChrome } from "@/components/site-chrome/site-chrome";

export default function SiteLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <SiteChrome>{children}</SiteChrome>;
}
