import library from "@/data/library.json";
import { getLibraryItem, getLibraryItems } from "@/lib/library";
import { getRules } from "@/lib/rules";
import {
  createPublicLibraryItemRepresentation,
  createPublicOptionsHeaders,
  createPublicRepresentationHeaders,
  serializePublicJson,
  serializePublicLibraryItemMarkdown,
} from "@/lib/public-representations.mjs";

export const dynamic = "force-static";
export const dynamicParams = false;
export const revalidate = false;

const representations = ["item.json", "item.md"] as const;

type RouteProps = Readonly<{
  params: Promise<{ slug: string; representation: string }>;
}>;

export function generateStaticParams() {
  return getLibraryItems().flatMap((item) =>
    representations.map((representation) => ({
      slug: item.slug,
      representation,
    })),
  );
}

function notFoundResponse(representation: string) {
  const json = representation.endsWith(".json");
  return new Response(
    json
      ? `${JSON.stringify({ error: "Library item representation not found." }, null, 2)}\n`
      : "# Library item representation not found\n",
    {
      status: 404,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": json
          ? "application/json; charset=utf-8"
          : "text/markdown; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex",
      },
    },
  );
}

async function buildResponse({ params }: RouteProps, head = false) {
  const { slug, representation } = await params;
  if (
    !representations.includes(
      representation as (typeof representations)[number],
    )
  ) {
    return notFoundResponse(representation);
  }
  const item = getLibraryItem(slug);
  if (!item) return notFoundResponse(representation);
  const document = createPublicLibraryItemRepresentation(
    item,
    library.installPrefix,
    getRules(),
  );
  const format = representation.endsWith(".json") ? "json" : "markdown";
  const body =
    format === "json"
      ? serializePublicJson(document)
      : serializePublicLibraryItemMarkdown(document);
  return new Response(head ? null : body, {
    status: 200,
    headers: createPublicRepresentationHeaders({
      format,
      filename: `tessli-${item.slug}-item.${format === "json" ? "json" : "md"}`,
      canonicalPath: document.canonicalPath,
      jsonPath: document.representations.json,
      markdownPath: document.representations.markdown,
    }),
  });
}

export async function GET(_request: Request, context: RouteProps) {
  return buildResponse(context);
}

export async function HEAD(_request: Request, context: RouteProps) {
  return buildResponse(context, true);
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: createPublicOptionsHeaders(),
  });
}
