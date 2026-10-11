import type { MetadataRoute } from "next";

import { getPublishedCollections } from "@/lib/collections";
import { getLibraryItems } from "@/lib/library";
import { getRules, RULES_INDEX_PATH } from "@/lib/rules";
import { getBrowsableSourceProfiles } from "@/lib/source-profiles";

function siteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProduction) return `https://${vercelProduction.replace(/\/$/, "")}`;

  return "http://localhost:3000";
}

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteOrigin();
  const staticRoutes = [
    "",
    "/library",
    "/rules",
    RULES_INDEX_PATH,
    "/resources",
    "/collections",
    "/for-ai",
    "/contribute",
    "/llms.txt",
    "/about",
    "/curation",
    "/privacy",
    "/terms",
    "/content-policy",
  ];

  // /preview is a bare render for iframes and agents; it is not listed.
  return [
    ...staticRoutes.map((route) => ({ url: `${origin}${route}` })),
    ...getLibraryItems().flatMap((item) => [
      { url: `${origin}/library/${item.slug}` },
      { url: `${origin}/library/${item.slug}/item.json` },
      { url: `${origin}/library/${item.slug}/item.md` },
    ]),
    ...getRules().map((rule) => ({ url: `${origin}/rules/${rule.id}` })),
    ...getPublishedCollections().flatMap((collection) => [
      { url: `${origin}/collections/${collection.slug}` },
      { url: `${origin}/collections/${collection.slug}/collection.json` },
      { url: `${origin}/collections/${collection.slug}/collection.md` },
    ]),
    ...getBrowsableSourceProfiles().flatMap((profile) => [
      { url: `${origin}/resources/${profile.slug}` },
      { url: `${origin}/resources/${profile.slug}/profile.json` },
      { url: `${origin}/resources/${profile.slug}/profile.md` },
    ]),
  ];
}
