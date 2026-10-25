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

const implementedRoutes = new Set([
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

  for (const group of ["Browse", "Project", "Legal"]) {
    assert.match(navigation, new RegExp(`label: "${group}"`));
  }

  for (const route of footerRoutes) {
    assert.match(navigation, new RegExp(`href: "${route}"`));
  }

  // Plan §5: About · Rules · Contribute · Privacy · Terms · Content policy.
  for (const [label, route] of [
    ["About", "/about"],
    ["Rules", "/rules"],
    ["Contribute", "/contribute"],
    ["Privacy", "/privacy"],
    ["Terms", "/terms"],
    ["Content policy", "/content-policy"],
    ["Library", "/library"],
    ["Sources", "/resources"],
    ["Collections", "/collections"],
    ["For AI", "/for-ai"],
  ]) {
    assert.match(
      navigation,
      new RegExp(`label: "${label}", href: "${route.replace("/", "\\/")}"`),
    );
  }
  assert.match(
    navigation,
    /label: "GitHub repository", href: repositoryUrl, external: true/,
  );
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
  // Owner rule (2026-10-25): the Labs credit, a plain link to Tessli's page on
  // the company site (www host).
  assert.match(
    footer,
    /const labsCreditUrl = "https:\/\/www\.onlinescope\.in\/labs\/tessli";/,
  );
  assert.match(
    footer,
    /Built by <a href=\{labsCreditUrl\}>Online Scope Labs<\/a>/,
  );
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
  assert.match(placeholder, /Return home/);
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

  for (const [label, route] of [
    ["Library", "/library"],
    ["Sources", "/resources"],
    ["For AI", "/for-ai"],
    ["Contribute", "/contribute"],
  ]) {
    assert.match(
      navigation,
      new RegExp(
        `label: "${label}",\\s*href: "${route.replace("/", "\\/")}",\\s*available: true`,
      ),
    );
    await access(path.join(webRoot, `app/(site)${route}/page.tsx`));
  }
  assert.match(
    navigation,
    /label: "GitHub",\s*href: repositoryUrl,\s*available: true/,
  );
  assert.doesNotMatch(
    navigation,
    /label: "Explore"|label: "Resources"|label: "About"|label: "Saved"|label: "Boards"|\/auth|\/saved|\/boards|\/submit|\/suggest/,
  );
});

test("global footer stays inside the modal-inert site content wrapper", async () => {
  const layout = await read("components/site-chrome/site-chrome.tsx");

  assert.match(
    layout,
    /<div data-site-content>[\s\S]*?<SiteFooter \/>[\s\S]*?<\/div>/,
  );
});
