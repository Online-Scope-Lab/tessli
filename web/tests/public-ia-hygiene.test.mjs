import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const webRoot = path.resolve(path.dirname(currentFile), "..");

async function read(relativePath) {
  return readFile(path.join(webRoot, relativePath), "utf8");
}

const headerRoutes = ["/library", "/resources", "/for-ai", "/contribute"];

const footerRoutes = [
  "/library",
  "/resources",
  "/collections",
  "/for-ai",
  "/about",
  "/rules",
  "/contribute",
  "/curation",
  "/privacy",
  "/terms",
  "/content-policy",
];

test("public header and footer promote only implemented routes", async () => {
  const [navigation, header, footerNavigation, footer] = await Promise.all([
    read("components/site-header/navigation.ts"),
    read("components/site-header/site-header.tsx"),
    read("components/site-footer/footer-navigation.ts"),
    read("components/site-footer/site-footer.tsx"),
  ]);

  for (const route of new Set(["/", ...headerRoutes, ...footerRoutes])) {
    await access(path.join(webRoot, `app/(site)${route}/page.tsx`));
  }

  for (const route of headerRoutes) {
    assert.match(navigation, new RegExp(`href: "${route}"`));
  }

  for (const route of footerRoutes) {
    assert.match(footerNavigation, new RegExp(`href: "${route}"`));
  }

  assert.match(header, /href="\/"/);
  assert.match(footer, /href="\/"/);
  // GitHub links read the canonical repository constant.
  assert.match(navigation, /href: repositoryUrl/);
  assert.match(footerNavigation, /href: repositoryUrl/);

  assert.doesNotMatch(
    `${navigation}\n${header}\n${footer}`,
    /href: "\/(?:auth|submit|suggest|saved|boards)"/u,
  );
  assert.doesNotMatch(footerNavigation, /href: "\/(?:saved|boards)"/u);
});

test("the internal lab is non-indexable", async () => {
  const lab = await read("app/(site)/lab/page.tsx");

  assert.match(lab, /index: false/);
  assert.match(lab, /follow: false/);
});

test("/submit and /suggest are replaced by permanent redirects to /contribute", async () => {
  for (const removed of ["app/(site)/submit", "app/(site)/suggest"]) {
    await assert.rejects(access(path.join(webRoot, removed)), {
      code: "ENOENT",
    });
  }
  await access(path.join(webRoot, "app/(site)/contribute/page.tsx"));

  const { default: nextConfig } = await import("../next.config.ts");
  const redirects = await nextConfig.redirects();
  assert.deepEqual(redirects, [
    { source: "/submit", destination: "/contribute", permanent: true },
    { source: "/suggest", destination: "/contribute", permanent: true },
  ]);
});

test("the account route, auth shell and session proxy are removed", async () => {
  for (const removed of [
    "app/auth",
    "components/auth-shell",
    "proxy.ts",
    "middleware.ts",
  ]) {
    await assert.rejects(access(path.join(webRoot, removed)), {
      code: "ENOENT",
    });
  }
});

test("Saved and Boards routes, components and stores are removed", async () => {
  for (const removed of [
    "app/saved",
    "app/boards",
    "components/saved-resources",
    "components/project-boards",
    "components/board-intake",
    "components/toast-notification",
    "lib/board-agent-handoff.mjs",
    "lib/board-research-pack.mjs",
  ]) {
    await assert.rejects(access(path.join(webRoot, removed)), {
      code: "ENOENT",
    });
  }
});

test("sitemap limits discovery to public routes and canonical documents", async () => {
  const sitemap = await read("app/sitemap.ts");

  for (const route of [
    "",
    "/resources",
    "/collections",
    "/for-ai",
    "/contribute",
    "/about",
    "/curation",
    "/privacy",
    "/terms",
    "/content-policy",
  ]) {
    assert.match(sitemap, new RegExp(`"${route}"`));
  }

  assert.match(sitemap, /getPublishedCollections\(\)/);
  assert.match(sitemap, /getBrowsableSourceProfiles\(\)/);
  assert.match(sitemap, /collection\.(?:json|md)/);
  assert.match(sitemap, /profile\.(?:json|md)/);
  assert.doesNotMatch(sitemap, /"\/(?:saved|boards|auth|submit|suggest|lab)/u);
});
