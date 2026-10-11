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

test("resource card exposes independent profile and visit actions", async () => {
  const component = await read("components/resource-card/resource-card.tsx");
  const anchorClose = component.indexOf("</a>");

  assert.match(component, /^"use client";/);
  assert.match(component, /<a[\s\S]*?className=\{styles\.cardLink\}/);
  assert.match(component, /aria-labelledby=\{titleId\}/);
  assert.match(component, /aria-describedby=\{descriptionId\}/);
  assert.match(component, /target=\{opensExternal \? "_blank" : undefined\}/);
  assert.match(
    component,
    /rel=\{opensExternal \? "noopener noreferrer" : undefined\}/,
  );
  assert.ok(anchorClose > 0);
  assert.doesNotMatch(
    component,
    /<button|onSavedChange|aria-pressed|data-resource-save/,
  );
  assert.match(component, /profileHref\?: string/);
  assert.match(component, /data-resource-primary-link/);
  assert.match(component, /data-resource-profile-link/);
  assert.match(component, /data-resource-inspect=\{resource\.id\}/);
  assert.match(
    component,
    /aria-label=\{`Inspect \$\{resource\.name\} on Tessli`\}/,
  );
  assert.match(component, /href=\{internalProfileHref\}/);
  assert.match(component, /data-resource-visit=\{resource\.id\}/);
  assert.match(component, /href=\{resource\.url\}/);
  assert.match(component, /target="_blank"/);
  assert.match(component, /rel="noopener noreferrer"/);
  assert.match(component, /Provider unavailable/);
  assert.doesNotMatch(component, /window\.open|router\.push|preventDefault/);
});

test("resource media follows the safe preview, favicon, generated fallback chain", async () => {
  const component = await read("components/resource-card/resource-card.tsx");

  assert.match(component, /kind: "preview"/);
  assert.match(component, /kind: "favicon"/);
  assert.match(component, /resource\.previewImageUrl/);
  assert.match(component, /resource\.faviconUrl/);
  assert.match(component, /generatedMark\(resource\.name\)/);
  assert.match(component, /addEventListener\("error", advanceFallback\)/);
  assert.match(component, /image\.complete && image\.naturalWidth === 0/);
  assert.match(component, /queueMicrotask\(advanceFallback\)/);
  assert.match(component, /setMediaIndex\(\(current\) => current \+ 1\)/);
  assert.match(component, /loading="lazy"/);
  assert.match(component, /decoding="async"/);
  assert.match(component, /referrerPolicy="no-referrer"/);
  assert.match(component, /!value\.startsWith\("\/\/"\)/);
  assert.match(component, /url\.protocol === "https:"/);
  assert.doesNotMatch(component, /onLoad=|data-media-loaded/);
  assert.doesNotMatch(
    component,
    /next\/image|dangerouslySetInnerHTML|fetch\(|XMLHttpRequest|innerHTML/,
  );
});

test("resource card geometry survives long copy and restores restrained hover motion", async () => {
  const component = await read("components/resource-card/resource-card.tsx");
  const css = await read("components/resource-card/resource-card.module.css");

  assert.match(css, /aspect-ratio: 16 \/ 10/);
  assert.match(css, /border-radius: 0/);
  assert.match(css, /\.mediaImage\s*\{[\s\S]*?opacity: 1/);
  assert.doesNotMatch(css, /\.mediaImage\s*\{[\s\S]*?opacity: 0/);
  assert.match(css, /\.mediaLabel\s*\{[\s\S]*?background:/);
  assert.match(css, /-webkit-line-clamp: 2/);
  assert.match(css, /-webkit-line-clamp: 3/);
  assert.doesNotMatch(css, /min-height:\s*2\.5em/);
  assert.doesNotMatch(css, /min-height:\s*4\.35em/);
  assert.match(css, /\.description\s*\{[\s\S]*?margin: var\(--space-2\) 0 0/);
  assert.match(css, /\.tags\s*\{[\s\S]*?margin-top: var\(--space-3\)/);
  assert.match(css, /\.footer\s*\{[\s\S]*?margin-top: auto/);
  assert.match(css, /min-height: 44px/);
  assert.doesNotMatch(css, /\.saveButton/);
  assert.match(
    css,
    /\.profileAction\s*\{[\s\S]*?grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/,
  );
  assert.match(
    css,
    /\.profileAction a,[\s\S]*?\.unavailableAction\s*\{[\s\S]*?min-height: 44px/,
  );
  assert.match(css, /\.card::before/);
  assert.match(css, /transition: background-size var\(--motion-fast\)/);
  assert.match(css, /\.card:hover,\s*\.card:focus-within/);
  assert.match(css, /transform: translateY\(-2px\)/);
  assert.match(css, /\.card:hover::before,\s*\.card:focus-within::before/);
  assert.match(
    css,
    /background-size:\s*100% 1px,\s*1px 100%,\s*100% 1px,\s*1px 100%/,
  );
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /@media \(forced-colors: active\)/);
  assert.match(component, /className=\{styles\.intelligenceBadge\}/);
  assert.doesNotMatch(component, /style=\{\{/);
  assert.match(
    css,
    /\.tags \.intelligenceBadge[\s\S]*color: var\(--accent-text\)/,
  );
  assert.doesNotMatch(css, /border-radius: 1[2-9]px|backdrop-filter/);
});
