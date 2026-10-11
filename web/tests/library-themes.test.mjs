import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const css = await readFile(
  new URL("../registry/themes.css", import.meta.url),
  "utf8",
);
const THEMES = ["tessli", "neutral", "dark"];
const SEMANTIC = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "border",
  "input",
  "ring",
  "radius",
];

function themeVariables(theme) {
  const block = new RegExp(`\\[data-theme="${theme}"\\]\\s*\\{([^}]*)\\}`).exec(
    css,
  );
  assert.ok(block, `theme ${theme} is defined`);
  return Object.fromEntries(
    [...block[1].matchAll(/--([\w-]+):\s*([^;]+);/g)].map((match) => [
      match[1],
      match[2].trim(),
    ]),
  );
}

function luminance(hex) {
  const value = hex.replace("#", "");
  assert.match(value, /^[0-9a-f]{6}$/i, `${hex} is a 6-digit hex colour`);
  const [r, g, b] = [0, 2, 4].map((index) => {
    const channel = parseInt(value.slice(index, index + 2), 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

test("each preview theme defines every shadcn semantic variable", () => {
  for (const theme of THEMES) {
    const variables = themeVariables(theme);
    for (const name of SEMANTIC) {
      assert.ok(variables[name], `${theme} defines --${name}`);
    }
  }
});

// WCAG 2.2 AA: 4.5:1 for normal text (1.4.3), 3:1 for UI components and
// focus indicators (1.4.11).
const TEXT_PAIRS = [
  ["foreground", "background"],
  ["muted-foreground", "background"],
  ["muted-foreground", "card"],
  ["muted-foreground", "muted"],
  ["primary-foreground", "primary"],
  ["card-foreground", "card"],
  ["popover-foreground", "popover"],
  ["secondary-foreground", "secondary"],
  ["accent-foreground", "accent"],
  ["destructive", "background"],
  ["destructive", "card"],
];
const NON_TEXT_PAIRS = [
  ["primary", "background"],
  ["ring", "background"],
  ["ring", "card"],
];

for (const theme of THEMES) {
  test(`${theme} theme meets WCAG 2.2 AA contrast`, () => {
    const variables = themeVariables(theme);
    for (const [pairs, minimum] of [
      [TEXT_PAIRS, 4.5],
      [NON_TEXT_PAIRS, 3],
    ]) {
      for (const [text, surface] of pairs) {
        const ratio = contrast(variables[text], variables[surface]);
        assert.ok(
          ratio >= minimum,
          `${theme}: --${text} on --${surface} is ${ratio.toFixed(2)}:1, needs ${minimum}:1`,
        );
      }
    }
  });
}

test("the Tessli theme keeps the brand tokens", () => {
  const tessli = themeVariables("tessli");
  assert.equal(tessli.background, "#fcf8f3");
  assert.equal(tessli.foreground, "#151412");
  assert.equal(tessli.primary, "#f05217");
  assert.equal(tessli["primary-foreground"], "#151412");
  assert.equal(themeVariables("dark")["color-scheme"], undefined);
  assert.match(css, /\[data-theme="dark"\] \{\s*color-scheme: dark;/);
});

test("themes are scoped to previews and mapped for Tailwind", async () => {
  const globals = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(css, /:root|^body|^html/m);
  for (const name of SEMANTIC.filter((name) => name !== "radius")) {
    assert.ok(
      globals.includes(`--color-${name}: var(--${name});`),
      `@theme inline maps --${name}`,
    );
  }
  assert.match(globals, /--radius-lg: var\(--radius\);/);
  assert.match(
    globals,
    /@custom-variant dark \(&:where\(\[data-theme="dark"\], \[data-theme="dark"\] \*\)\);/,
  );
  const preview = await readFile(
    new URL("../app/preview/[slug]/page.tsx", import.meta.url),
    "utf8",
  );
  assert.match(preview, /import "@\/registry\/themes\.css";/);
  assert.match(preview, /data-theme=\{theme\}/);
});
