import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { test } from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const webRoot = path.resolve(path.dirname(currentFile), "..");

async function read(relativePath) {
  return readFile(path.join(webRoot, relativePath), "utf8");
}

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

const implementedRoutes = new Set([
  "/resources",
  "/collections",
  "/for-ai",
  "/about",
  "/curation",
  "/privacy",
  "/terms",
  "/content-policy",
]);
const routeShells = footerRoutes.filter(
  (route) => !implementedRoutes.has(route),
);

test("every internal footer destination has an App Router page", async () => {
  for (const route of footerRoutes) {
    await access(path.join(webRoot, `app/(site)${route}/page.tsx`));
  }
});

test("footer contains truthful research groups and safe external links", async () => {
  const [navigation, footer, styles] = await Promise.all([
    read("components/site-footer/footer-navigation.ts"),
    read("components/site-footer/site-footer.tsx"),
    read("components/site-footer/site-footer.module.css"),
  ]);

  for (const group of ["Research", "Contribute", "About", "Legal"]) {
    assert.match(navigation, new RegExp(`label: "${group}"`));
  }

  for (const route of footerRoutes) {
    assert.match(navigation, new RegExp(`href: "${route}"`));
  }

  assert.match(navigation, /label: "Browse sources", href: "\/resources"/);
  assert.match(navigation, /label: "For AI", href: "\/for-ai"/);
  assert.doesNotMatch(
    navigation,
    /href: "\/(?:submit|suggest|saved|boards)"|Saved sources|Project boards/,
  );
  assert.doesNotMatch(
    navigation,
    /Explore resources|Full reference|footer-explore/,
  );
  assert.match(footer, /target="_blank"/);
  assert.match(footer, /rel="noopener noreferrer"/);
  assert.match(footer, /public repository does not itself grant reuse rights/i);
  assert.match(
    styles,
    /@media \(max-width: 767px\)[\s\S]*?\.footnote[\s\S]*?font-size: var\(--text-body-sm\)/,
  );
  assert.doesNotMatch(
    `${navigation}\n${footer}`,
    /newsletter|instagram|twitter|cookie settings|changelog|open[- ]source/i,
  );
});

test("route shells are honest, visitor-facing, and never collect data", async () => {
  for (const route of routeShells) {
    const page = await read(`app/(site)${route}/page.tsx`);
    assert.match(page, /<RoutePlaceholder/);
    assert.doesNotMatch(page, /<form|fetch\(|action=/);
    assert.doesNotMatch(page, /\bSlices?\s+\d/i);
  }

  const placeholder = await read(
    "components/route-placeholder/route-placeholder.tsx",
  );
  assert.match(placeholder, /id="main-content"/);
  assert.match(placeholder, /<h1>/);
  assert.match(placeholder, /Return to Explore/);
  assert.match(placeholder, /View the repository/);
  assert.match(
    placeholder,
    /<Button href=\{repositoryUrl\} variant="secondary">/,
  );
  // External Button links open safely.
  const button = await read("components/ui/button.tsx");
  assert.match(button, /rel="noopener noreferrer"/);
});

test("header exposes only working primary and utility routes", async () => {
  const navigation = await read("components/site-header/navigation.ts");

  assert.match(navigation, /label: "Browse"[\s\S]*?available: true/);
  assert.match(navigation, /label: "Collections"[\s\S]*?available: true/);
  assert.match(navigation, /label: "For AI"[\s\S]*?available: true/);
  assert.match(navigation, /label: "Search"[\s\S]*?available: true/);
  assert.doesNotMatch(
    navigation,
    /label: "Explore"|label: "Resources"|label: "About"|label: "Saved"|label: "Boards"|\/auth|\/saved|\/boards/,
  );
});

test("global footer stays inside the modal-inert site content wrapper", async () => {
  const layout = await read("components/site-chrome/site-chrome.tsx");

  assert.match(
    layout,
    /<div data-site-content>[\s\S]*?<SiteFooter \/>[\s\S]*?<\/div>/,
  );
});
