import { getRulesIndex } from "@/lib/rules";

export const dynamic = "force-static";
export const revalidate = false;

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control":
    "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
  "Content-Disposition": 'inline; filename="TESSLI.md"',
  "Content-Type": "text/markdown; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
};

/** The generated rules/TESSLI.md, for people and agents without the shadcn CLI. */
export function GET() {
  return new Response(getRulesIndex(), { status: 200, headers });
}

export function HEAD() {
  return new Response(null, { status: 200, headers });
}
