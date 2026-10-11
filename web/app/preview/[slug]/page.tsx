import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  getLibraryItem,
  getLibraryItems,
  isPreviewTheme,
  type PreviewTheme,
} from "@/lib/library";
import { previews } from "@/registry/__index__";
import "@/registry/themes.css";

// A bare, isolated render of one library item: no site header or footer, the
// item's theme on the wrapper. Used by the library iframes, CI screenshots and
// agents. Not indexed (robots.ts also disallows /preview/).
export const dynamicParams = false;

type PreviewProps = Readonly<{
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export function generateStaticParams() {
  return getLibraryItems().map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: PreviewProps): Promise<Metadata> {
  const { slug } = await params;
  const item = getLibraryItem(slug);
  return {
    title: item ? `${item.notes.title} (preview)` : "Preview",
    robots: { index: false, follow: false },
  };
}

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PreviewPage({
  params,
  searchParams,
}: PreviewProps) {
  const { slug } = await params;
  const item = getLibraryItem(slug);
  const states = previews[slug];
  if (!item || !states) notFound();

  const query = await searchParams;
  const requestedTheme = single(query.theme);
  if (requestedTheme !== undefined && !isPreviewTheme(requestedTheme)) {
    notFound();
  }
  const theme: PreviewTheme = requestedTheme ?? "tessli";
  const state = single(query.state) ?? item.notes.states[0];
  const Preview = Object.hasOwn(states, state) ? states[state] : undefined;
  if (!Preview) notFound();

  return (
    <div
      data-theme={theme}
      data-preview={slug}
      data-preview-state={state}
      className="text-foreground"
    >
      <main>
        <h1 className="sr-only">
          {item.notes.title}, {state} state, {theme} theme
        </h1>
        <Preview />
      </main>
    </div>
  );
}
