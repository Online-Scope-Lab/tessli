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

const headerRoutes = ["/resources", "/collections", "/for-ai"];

const footerRoutes = [
  "/resources",
  "/collections",
  "/for-ai",
  "/about",
  "/curation",
  "/privacy",
  "/terms",
  "/content-policy",
];

test("public header and footer promote only implemented routes", async () => {
  const [navigation, header, footerNavigation, footer, filters] =
    await Promise.all([
      read("components/site-header/navigation.ts"),
      read("components/site-header/site-header.tsx"),
      read("components/site-footer/footer-navigation.ts"),
      read("components/site-footer/site-footer.tsx"),
      read("components/browse/browse-filters.tsx"),
    ]);

  for (const route of new Set(["/", ...headerRoutes, ...footerRoutes])) {
    await access(path.join(webRoot, `app${route}/page.tsx`));
  }

  for (const route of headerRoutes) {
    assert.match(navigation, new RegExp(`href: "${route}"`));
  }

  for (const route of footerRoutes) {
    assert.match(footerNavigation, new RegExp(`href: "${route}"`));
  }

  assert.match(header, /href="\/"/);
  assert.match(footer, /href="\/"/);
  assert.match(navigation, /href: "\/resources#browse-search"/);
  assert.match(filters, /id="browse-search"/);

  assert.doesNotMatch(
    `${navigation}\n${header}\n${footer}`,
    /href: "\/(?:auth|submit|suggest|saved|boards)"/u,
  );
  assert.doesNotMatch(footerNavigation, /href: "\/(?:saved|boards)"/u);
});

test("unfinished and internal-lab routes are non-indexable", async () => {
  const [submit, suggest, lab] = await Promise.all([
    read("app/submit/page.tsx"),
    read("app/suggest/page.tsx"),
    read("app/lab/page.tsx"),
  ]);

  for (const route of [submit, suggest, lab]) {
    assert.match(route, /index: false/);
    assert.match(route, /follow: false/);
  }
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
