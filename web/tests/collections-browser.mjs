import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

const endpoint = process.env.CDP_ENDPOINT ?? "http://127.0.0.1:9222";
const origin = process.env.TESSLI_ORIGIN ?? "http://127.0.0.1:3000";
const outputDirectory = new URL("../artifacts/playbooks/", import.meta.url);
const pending = new Map();
let messageId = 0;
const browserFailures = [];

const collectionSlugs = [
  "saas-landing-pages",
  "typography-font-tools",
  "motion-starter-pack",
  "open-source-ui-libraries",
  "accessible-colour-tools",
  "design-systems-worth-studying",
];

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
  if (message.method === "Runtime.exceptionThrown") {
    browserFailures.push(message.params.exceptionDetails.text);
  }
  if (
    message.method === "Runtime.consoleAPICalled" &&
    message.params.type === "error"
  ) {
    browserFailures.push(
      message.params.args
        .map((argument) => argument.value ?? argument.description ?? "error")
        .join(" "),
    );
  }
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
  if (response.exceptionDetails) {
    throw new Error(
      response.exceptionDetails.exception?.description ??
        response.exceptionDetails.text ??
        "Browser evaluation failed.",
    );
  }
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

async function waitFor(expression, label, timeout = 7_500) {
  const deadline = Date.now() + timeout;
  lastTransientError = null;
  while (Date.now() < deadline) {
    if (await evaluateSettled(expression)) return;
    await delay(50);
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

async function navigate(pathname, readyExpression) {
  await markDocumentStale();
  await send("Page.navigate", { url: `${origin}${pathname}` });
  await waitFor(
    `!window.__tessliStale && document.readyState === "complete" && (${readyExpression})`,
    pathname,
  );
}

async function screenshot(filename) {
  const image = await send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
  });
  await writeFile(
    new URL(filename, outputDirectory),
    Buffer.from(image.data, "base64"),
  );
}

await mkdir(outputDirectory, { recursive: true });
await Promise.all([send("Page.enable"), send("Runtime.enable")]);
await send("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});
await navigate(
  "/collections",
  'document.querySelectorAll("[data-collection-card]").length === 6',
);

assert.equal(
  await evaluate('document.querySelectorAll("[data-collection-card]").length'),
  6,
);
assert.equal(
  await evaluate(
    'document.querySelectorAll("[data-collection-stage-count=\\"3\\"]").length',
  ),
  6,
);
assert.deepEqual(
  await evaluate(
    'Array.from(document.querySelectorAll("[data-collection-card] a")).map((link) => link.getAttribute("href"))',
  ),
  collectionSlugs.map((slug) => `/collections/${slug}`),
);
assert.equal(
  await evaluate(
    `document.querySelector('nav[aria-label="Primary navigation"] a[aria-current="page"]')?.textContent?.trim()`,
  ),
  "Collections",
);
assert.equal(
  await evaluate("document.documentElement.scrollWidth <= window.innerWidth"),
  true,
);
await screenshot("playbooks-index-1440x900.png");

for (const [index, slug] of collectionSlugs.entries()) {
  await navigate(
    `/collections/${slug}`,
    `document.querySelectorAll('[data-collection-detail="${slug}"] [data-collection-resource-grid] > li').length === 10`,
  );

  assert.equal(
    await evaluate('document.querySelectorAll("[data-playbook-stage]").length'),
    3,
    `${slug} should expose three ordered stages.`,
  );
  assert.equal(
    await evaluate(
      'document.querySelectorAll("[data-collection-resource-grid] > li").length',
    ),
    10,
    `${slug} should expose ten ordered resources.`,
  );
  assert.equal(
    await evaluate(
      'document.querySelectorAll("[data-playbook-resource-role]").length',
    ),
    10,
    `${slug} should explain every source role.`,
  );
  assert.equal(
    await evaluate(
      'document.querySelectorAll("[data-collection-resource-grid] [data-resource-save]").length',
    ),
    0,
  );
  assert.equal(
    await evaluate(
      'Boolean(document.querySelector("a[href=\\"/boards\\"], a[href=\\"/saved\\"]"))',
    ),
    false,
  );
  assert.equal(
    await evaluate(
      'Boolean(document.querySelector("a[href=\\"#research-sequence\\"]")) && Boolean(document.getElementById("research-sequence"))',
    ),
    true,
  );
  assert.equal(
    await evaluate(
      `Boolean(document.querySelector('a[href="/collections/${slug}/collection.md"]'))`,
    ),
    true,
  );
  assert.equal(
    await evaluate(
      `Boolean(document.querySelector('a[href="/collections/${slug}/collection.json"]'))`,
    ),
    true,
  );

  if (index === 0) {
    await screenshot("playbook-detail-1440x900.png");
  }

  assert.equal(
    await evaluate(
      `document.querySelector('nav[aria-label="Primary navigation"] a[aria-current="page"]')?.textContent?.trim()`,
    ),
    "Collections",
  );
  assert.equal(
    await evaluate("document.documentElement.scrollWidth <= window.innerWidth"),
    true,
  );
}

await send("Emulation.setDeviceMetricsOverride", {
  width: 390,
  height: 844,
  deviceScaleFactor: 1,
  mobile: true,
});
await navigate(
  "/collections/saas-landing-pages",
  'document.querySelectorAll("[data-playbook-stage]").length === 3',
);
assert.equal(
  await evaluate("document.documentElement.scrollWidth <= window.innerWidth"),
  true,
);
assert.equal(
  await evaluate(
    'getComputedStyle(document.querySelector("[data-collection-resource-grid]" )).gridTemplateColumns.split(" ").length',
  ),
  1,
);
await screenshot("playbook-detail-390x844.png");

socket.close();
assert.deepEqual(browserFailures, []);
console.log(
  "Collections research paths, stages and machine links checks passed.",
);
