// Item CI (plan §8): every library item, in every state and all three preview
// themes, at 1440, 1024, 768, 390 and 320 px. Fails on horizontal overflow,
// console errors, same-origin request failures and axe-core WCAG 2.2 AA
// violations. Saves one full-page screenshot per combination to
// artifacts/items/ for the reviewer.
import { mkdirSync, readFileSync } from "node:fs";

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const library = JSON.parse(
  readFileSync(new URL("../data/library.json", import.meta.url), "utf8"),
);
const THEMES = ["tessli", "neutral", "dark"];
const WIDTHS = [1440, 1024, 768, 390, 320];
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const outputDirectory = new URL("../artifacts/items/", import.meta.url);
mkdirSync(outputDirectory, { recursive: true });

test("every item has at least one preview state", () => {
  expect(library.items.length).toBeGreaterThan(0);
  for (const item of library.items) {
    expect(item.notes.states.length).toBeGreaterThan(0);
  }
});

for (const item of library.items) {
  const [firstState] = item.notes.states;
  for (const state of item.notes.states) {
    for (const theme of THEMES) {
      test(`${item.slug} · ${state} · ${theme}`, async ({ page, baseURL }) => {
        const problems = [];
        page.on("console", (message) => {
          if (message.type() === "error") {
            problems.push(`console: ${message.text()}`);
          }
        });
        page.on("pageerror", (error) => problems.push(`page: ${error}`));
        page.on("response", (response) => {
          if (response.status() >= 400 && response.url().startsWith(baseURL)) {
            problems.push(`HTTP ${response.status()} ${response.url()}`);
          }
        });

        const params = new URLSearchParams({ theme });
        if (state !== firstState) params.set("state", state);
        const path = `/preview/${item.slug}?${params}`;

        for (const width of WIDTHS) {
          await page.setViewportSize({ width, height: 900 });
          const response = await page.goto(path, { waitUntil: "networkidle" });
          expect(response?.status(), path).toBe(200);
          await expect(
            page.locator(
              `[data-preview="${item.slug}"][data-preview-state="${state}"][data-theme="${theme}"]`,
            ),
          ).toBeVisible();

          const overflow = await page.evaluate(() => {
            const root = document.documentElement;
            return root.scrollWidth - root.clientWidth;
          });
          expect(
            overflow,
            `${path} at ${width}px overflows`,
          ).toBeLessThanOrEqual(0);

          const { violations } = await new AxeBuilder({ page })
            .withTags(AXE_TAGS)
            .analyze();
          expect(
            violations.map(
              (violation) =>
                `${violation.id}: ${violation.help} (${violation.nodes
                  .map((node) => node.target.join(" "))
                  .join(", ")})`,
            ),
            `${path} at ${width}px has axe violations`,
          ).toEqual([]);

          await page.screenshot({
            path: new URL(
              `${item.slug}--${state}--${theme}--${width}.png`,
              outputDirectory,
            ).pathname,
            fullPage: true,
          });
        }

        expect(problems, `${path} reported errors`).toEqual([]);
      });
    }
  }
}
