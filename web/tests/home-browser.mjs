import assert from "node:assert/strict";

const endpoint = process.env.CDP_ENDPOINT ?? "http://127.0.0.1:9222";
const origin = process.env.TESSLI_ORIGIN ?? "http://127.0.0.1:3000";
const pending = new Map();
let messageId = 0;

async function delay(milliseconds) {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function findPageTarget() {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${endpoint}/json/list`);
      const targets = await response.json();
      const page = targets.find((target) => target.type === "page");
      if (page?.webSocketDebuggerUrl) return page;
    } catch {
      // Chrome may still be starting.
    }
    await delay(100);
  }
  throw new Error("Chrome DevTools endpoint did not become ready.");
}

const page = await findPageTarget();
const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  const request = pending.get(message.id);
  if (!request) return;
  pending.delete(message.id);
  if (message.error) request.reject(new Error(message.error.message));
  else request.resolve(message.result);
});

function send(method, params = {}) {
  const id = ++messageId;
  return new Promise((resolve, reject) => {
    pending.set(id, { reject, resolve });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const response = await send("Runtime.evaluate", {
    awaitPromise: true,
    expression,
    returnByValue: true,
  });
  if (response.exceptionDetails)
    throw new Error(response.exceptionDetails.text);
  return response.result.value;
}

// Polling right after Page.navigate can land on the document swap, which CDP
// rejects with a transient error. Treat that as "not ready yet"; the waitFor
// deadline still bounds the wait, and its timeout reports the last such error.
const transientNavigationError =
  /Inspected target navigated or closed|Execution context was destroyed|Cannot find context with specified id|Cannot find default execution context|Promise was collected/;
let lastTransientError = null;

async function evaluateSettled(expression) {
  try {
    return await evaluate(expression);
  } catch (error) {
    if (transientNavigationError.test(error.message)) {
      lastTransientError = error.message;
      return false;
    }
    throw error;
  }
}

async function waitFor(expression, label, timeout = 10_000) {
  const deadline = Date.now() + timeout;
  lastTransientError = null;
  while (Date.now() < deadline) {
    if (await evaluateSettled(expression)) return;
    await delay(75);
  }
  throw new Error(
    `Timed out waiting for ${label}.${lastTransientError ? ` Last transient CDP error: ${lastTransientError}` : ""}`,
  );
}

// Page.navigate returns before the old document is gone, so a readiness check
// could pass against it. Mark the current document first; readiness checks
// then require !window.__tessliStale, which only a new document satisfies.
async function markDocumentStale() {
  await waitFor("window.__tessliStale = true", "stale-document marker");
}

await send("Page.enable");
await send("Runtime.enable");

async function auditHome(width, height) {
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width <= 430,
  });
  await markDocumentStale();
  await send("Page.navigate", { url: `${origin}/` });
  await waitFor(
    `!window.__tessliStale && document.readyState === "complete" && Boolean(document.querySelector('[data-home-sections]'))`,
    `Home sections at ${width}`,
  );

  return evaluate(`(() => {
    const sections = document.querySelector('[data-home-sections]');
    const featured = Array.from(sections.querySelectorAll('[data-home-featured-item]'));
    const frames = featured.map((card) => card.querySelector('[data-preview-thumbnail]'));
    return {
      heroTitle: document.querySelector('#explore-hero-title')?.textContent,
      heroArtwork: document.querySelector('img[src*="tessli-hero-geometry.webp"]')?.getAttribute('src'),
      searchAction: document.querySelector('form[aria-label="Search Tessli resources"]')?.getAttribute('action'),
      searchName: document.querySelector('[data-explore-search-input]')?.getAttribute('name'),
      h2s: Array.from(sections.querySelectorAll('h2')).map((h) => h.textContent.trim()),
      featured: featured.map((card) => card.getAttribute('data-home-featured-item')),
      featuredLinks: featured.map((card) => card.querySelector('h3 a')?.getAttribute('href')),
      thumbnailsInert: frames.every((frame) => frame?.inert === true),
      thumbnailRatios: frames.map((frame) => {
        const box = frame.getBoundingClientRect();
        return Math.round((box.width / box.height) * 100) / 100;
      }),
      lazyFrames: Array.from(sections.querySelectorAll('[data-preview-thumbnail] iframe')).every(
        (frame) => frame.getAttribute('loading') === 'lazy' && frame.getAttribute('src').startsWith('/preview/'),
      ),
      anatomyRules: sections.querySelectorAll('[data-home-anatomy-rules] a[href^="/rules/"]').length,
      anatomyDefault: sections.querySelector('[data-home-anatomy-default] p')?.textContent.length ?? 0,
      commands: Array.from(sections.querySelectorAll('[data-home-for-ai] [data-install-command]')).map((c) => c.textContent),
      forAiHref: sections.querySelector('[data-home-for-ai] a[href="/for-ai"]')?.getAttribute('href'),
      sourcesLinks: Array.from(sections.querySelectorAll('[data-home-sources] a')).map((a) => a.getAttribute('href')),
      sourcesCopy: sections.querySelector('[data-home-sources] p')?.textContent ?? '',
      contributeLinks: Array.from(sections.querySelectorAll('[data-home-contribute] a')).map((a) => a.getAttribute('href')),
      eyebrows: document.querySelectorAll('main [class*="eyebrow"]').length,
      arrows: (sections.textContent.match(/→/g) ?? []).length,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  })()`);
}

for (const [width, height] of [
  [1440, 900],
  [390, 844],
]) {
  const audit = await auditHome(width, height);
  const label = `home at ${width}`;

  assert.equal(audit.heroTitle, "Find better design resources, faster.", label);
  assert.equal(audit.heroArtwork, "/brand/tessli-hero-geometry.webp", label);
  assert.equal(audit.searchAction, "/resources", label);
  assert.equal(audit.searchName, "q", label);
  assert.deepEqual(
    audit.h2s,
    [
      "UI with the reasoning attached.",
      "Anatomy of an item.",
      "The same notes, for coding agents.",
      "Where else to look.",
      "Built in the open.",
    ],
    label,
  );
  assert.deepEqual(
    audit.featured,
    ["product-hero", "dashboard-overview", "empty-state"],
    label,
  );
  assert.deepEqual(
    audit.featuredLinks,
    audit.featured.map((slug) => `/library/${slug}`),
    label,
  );
  assert.equal(audit.thumbnailsInert, true, `${label}: previews are inert`);
  // Fixed 16:10 frames, so a preview loading late never shifts the page.
  assert.ok(
    audit.thumbnailRatios.every((ratio) => Math.abs(ratio - 1.6) < 0.02),
    `${label}: preview ratios ${audit.thumbnailRatios}`,
  );
  assert.equal(audit.lazyFrames, true, `${label}: lazy /preview iframes`);
  assert.ok(audit.anatomyRules >= 3, `${label}: anatomy rules`);
  assert.ok(audit.anatomyDefault > 40, `${label}: anatomy default`);
  assert.deepEqual(
    audit.commands,
    [
      "npx shadcn@latest add online-scope-lab/tessli/rules",
      "npx shadcn@latest add online-scope-lab/tessli/pricing-tiers",
    ],
    label,
  );
  assert.equal(audit.forAiHref, "/for-ai", label);
  assert.deepEqual(audit.sourcesLinks, ["/resources", "/collections"], label);
  assert.match(
    audit.sourcesCopy,
    /\b\d+ design and frontend sources in \d+ categories/u,
  );
  assert.deepEqual(
    audit.contributeLinks,
    ["/contribute", "https://github.com/Online-Scope-Lab/tessli"],
    label,
  );
  assert.equal(audit.eyebrows, 1, `${label}: one eyebrow, in the hero`);
  assert.equal(audit.arrows, 0, `${label}: no arrows on ordinary links`);
  assert.equal(audit.overflow, false, `${label}: no horizontal overflow`);
}

socket.close();
console.log("Home browser checks passed.");
