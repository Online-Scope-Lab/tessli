import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const webRoot = path.resolve(path.dirname(currentFile), "..");

async function read(relativePath) {
  return readFile(path.join(webRoot, relativePath), "utf8");
}

test("primary navigation is Library | Sources | For AI, with Contribute and GitHub as utilities", async () => {
  const navigation = await read("components/site-header/navigation.ts");
  const { availablePrimaryNavigationItems, availableUtilityNavigationItems } =
    await import("../components/site-header/navigation.ts");
  const { repositoryUrl } = await import("../lib/repository.ts");

  assert.deepEqual(
    availablePrimaryNavigationItems.map((item) => [item.label, item.href]),
    [
      ["Library", "/library"],
      ["Sources", "/resources"],
      ["For AI", "/for-ai"],
    ],
  );
  assert.deepEqual(
    availableUtilityNavigationItems.map((item) => [
      item.label,
      item.href,
      Boolean(item.external),
    ]),
    [
      ["Contribute", "/contribute", false],
      ["GitHub", repositoryUrl, true],
    ],
  );
  // The GitHub link reads the canonical repository constant.
  assert.match(navigation, /href: repositoryUrl/);
  assert.doesNotMatch(
    navigation,
    /label: "Explore"|label: "Browse"|label: "Collections"|label: "Saved"|label: "Boards"|\/saved|\/boards|\/submit|\/suggest/,
  );
});

test("navigation active states follow the section, not a string prefix", async () => {
  const {
    primaryNavigationItems,
    utilityNavigationItems,
    isNavigationItemActive,
  } = await import("../components/site-header/navigation.ts");
  const items = [...primaryNavigationItems, ...utilityNavigationItems];
  const active = (pathname) =>
    items
      .filter((item) => isNavigationItemActive(item, pathname))
      .map((item) => item.label);

  assert.deepEqual(active("/"), []);
  assert.deepEqual(active("/library"), ["Library"]);
  assert.deepEqual(active("/library/pricing-tiers"), ["Library"]);
  assert.deepEqual(active("/resources"), ["Sources"]);
  assert.deepEqual(active("/resources/land-book"), ["Sources"]);
  // Collections are curated source guides, so they sit under Sources.
  assert.deepEqual(active("/collections"), ["Sources"]);
  assert.deepEqual(active("/collections/saas-landing-pages"), ["Sources"]);
  assert.deepEqual(active("/for-ai"), ["For AI"]);
  assert.deepEqual(active("/contribute"), ["Contribute"]);
  assert.deepEqual(active("/rules"), []);
  assert.deepEqual(active("/librarything"), []);
});

test("header implements accessible modal navigation behaviour", async () => {
  const header = await read("components/site-header/site-header.tsx");

  assert.match(header, /aria-modal="true"/);
  assert.match(header, /aria-labelledby="mobile-navigation-title"/);
  assert.match(header, /role="dialog"/);
  assert.match(header, /event\.key === "Escape"/);
  assert.match(header, /document\.body\.style\.overflow = "hidden"/);
  assert.match(header, /siteContent\.inert = true/);
  assert.match(header, /trigger\?\.isConnected/);
  assert.match(header, /event\.key !== "Tab"/);
  assert.match(header, /desktopQuery\.addEventListener\("change"/);
  assert.match(header, /window\.addEventListener\("popstate"/);
  assert.match(header, /aria-label="Utilities"/);
  assert.match(header, /aria-label="Mobile utilities"/);
  // External utility links open safely and say so to screen readers.
  assert.match(header, /rel="noopener noreferrer"/);
  assert.match(header, /target="_blank"/);
  assert.match(header, /\(opens in a new tab\)/);
  assert.doesNotMatch(header, /href="\/auth"|Sign in to Tessli|isAuthActive/);
  assert.doesNotMatch(header, /fake avatar|theme toggle/i);
});

test("header avoids synchronous state updates during effect setup", async () => {
  const header = await read("components/site-header/site-header.tsx");

  assert.doesNotMatch(header, /useEffect\(\(\) => \{\s*closeMenu\(\)/);
  assert.match(header, /requestAnimationFrame\(updateScrollState\)/);
  assert.match(header, /cancelAnimationFrame\(focusFrame\)/);
});

test("header visual contract uses underline, utilities, and a viewport modal", async () => {
  const css = await read("components/site-header/site-header.module.css");

  assert.match(css, /\.navigationLink::after/);
  assert.match(css, /background: var\(--accent\)/);
  assert.match(css, /\.utilityNavigation \{/);
  assert.match(css, /\.utilityLink \{/);
  assert.match(css, /\.mobileUtilities \{/);
  assert.match(css, /@media \(max-width: 767px\)/);
  assert.match(css, /\.sheetLayer \{[\s\S]*?inset: 0/);
  assert.match(css, /\.sheet \{[\s\S]*?height: 100%/);
  assert.doesNotMatch(css, /\.accountLink|\.mobileAccountLink|backdrop-filter/);
});

test("site chrome mounts one global header and isolates site content", async () => {
  const layout = await read("components/site-chrome/site-chrome.tsx");
  const siteLayout = await read("app/(site)/layout.tsx");
  const rootLayout = await read("app/layout.tsx");
  const notFound = await read("app/not-found.tsx");
  const home = await read("app/(site)/page.tsx");
  const lab = await read("app/(site)/lab/page.tsx");

  assert.match(layout, /<SiteHeader \/>/);
  assert.match(layout, /href="#main-content"/);
  assert.match(layout, /data-site-content/);
  // Every site page and the 404 page get the chrome; /preview renders bare.
  assert.match(siteLayout, /<SiteChrome>/);
  assert.match(notFound, /<SiteChrome>/);
  assert.doesNotMatch(rootLayout, /SiteHeader|SiteFooter|SiteChrome/);
  assert.match(home, /id="main-content"/);
  assert.match(lab, /id="main-content"/);
  assert.doesNotMatch(lab, /<header/);
});
