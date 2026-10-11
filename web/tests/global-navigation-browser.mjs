import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

const endpoint = process.env.CDP_ENDPOINT ?? "http://127.0.0.1:9222";
const origin = process.env.TESSLI_ORIGIN ?? "http://127.0.0.1:3000";
const outputDirectory = new URL(
  "../artifacts/global-navigation/",
  import.meta.url,
);

const pending = new Map();
let messageId = 0;
let loadResolver = null;
const browserFailures = [];

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
  if (message.method === "Page.loadEventFired") {
    loadResolver?.();
    loadResolver = null;
  }
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
    pending.set(id, { resolve, reject });
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

async function navigate(url) {
  const loaded = new Promise((resolve) => {
    loadResolver = resolve;
  });
  await send("Page.navigate", { url });
  await Promise.race([
    loaded,
    delay(10_000).then(() => {
      throw new Error(`Timed out loading ${url}`);
    }),
  ]);
  await delay(250);
}

async function screenshot(name) {
  const image = await send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
  });
  await writeFile(
    new URL(name, outputDirectory),
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
await navigate(`${origin}/resources`);

const desktop = await evaluate(`(() => {
  const header = document.querySelector('body > header');
  const primary = Array.from(header.querySelectorAll('nav[aria-label="Primary navigation"] a'));
  const utilities = Array.from(header.querySelectorAll('nav[aria-label="Utilities"] a'));
  return {
    primary: primary.map((link) => [link.textContent.trim(), link.getAttribute('href')]),
    utilities: utilities.map((link) => [link.textContent.trim(), link.getAttribute('href')]),
    current: primary.filter((link) => link.getAttribute('aria-current') === 'page').map((link) => link.textContent.trim()),
    authLinks: [header, document.querySelector('footer')]
      .flatMap((region) => Array.from(region?.querySelectorAll('a, button') ?? []))
      .filter((control) => (control.getAttribute('href') ?? '').startsWith('/auth') || /sign[ -]?in|log[ -]?in/i.test(control.textContent))
      .length,
    legacyLabels: /Explore|Resources|Full reference/.test(header.textContent),
    searchTarget: Boolean(document.querySelector('#browse-search')),
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  };
})()`);

assert.deepEqual(desktop.primary, [
  ["Browse", "/resources"],
  ["Collections", "/collections"],
  ["For AI", "/for-ai"],
]);
assert.deepEqual(desktop.utilities, [["Search", "/resources#browse-search"]]);
assert.deepEqual(desktop.current, ["Browse"]);
assert.equal(desktop.authLinks, 0);
assert.equal(desktop.legacyLabels, false);
assert.equal(desktop.searchTarget, true);
assert.equal(desktop.overflow, false);
await screenshot("global-navigation-1440x900.png");

await send("Emulation.setDeviceMetricsOverride", {
  width: 390,
  height: 844,
  deviceScaleFactor: 1,
  mobile: true,
});
await navigate(`${origin}/collections`);
await evaluate(
  `document.querySelector('[data-mobile-menu-trigger]').click(); true`,
);
await delay(150);

const mobileOpen = await evaluate(`(() => {
  const sheet = document.querySelector('#mobile-navigation-sheet');
  return {
    dialog: sheet?.getAttribute('role'),
    modal: sheet?.getAttribute('aria-modal'),
    primary: Array.from(sheet.querySelectorAll('nav[aria-label="Mobile primary navigation"] a')).map((link) => link.textContent.trim()),
    current: Array.from(sheet.querySelectorAll('nav[aria-label="Mobile primary navigation"] a[aria-current="page"]')).map((link) => link.textContent.trim()),
    utilities: Array.from(sheet.querySelectorAll('nav[aria-label="Mobile utilities"] a')).map((link) => link.textContent.trim().replace(/→/g, '').trim()),
    authLinks: Array.from(sheet.querySelectorAll('a, button'))
      .filter((control) => (control.getAttribute('href') ?? '').startsWith('/auth') || /sign[ -]?in|log[ -]?in/i.test(control.textContent))
      .length,
    bodyOverflow: document.body.style.overflow,
    contentInert: document.querySelector('[data-site-content]').inert,
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  };
})()`);

assert.equal(mobileOpen.dialog, "dialog");
assert.equal(mobileOpen.modal, "true");
assert.deepEqual(mobileOpen.primary, ["Browse", "Collections", "For AI"]);
assert.deepEqual(mobileOpen.current, ["Collections"]);
assert.deepEqual(mobileOpen.utilities, ["Search"]);
assert.equal(mobileOpen.authLinks, 0);
assert.equal(mobileOpen.bodyOverflow, "hidden");
assert.equal(mobileOpen.contentInert, true);
assert.equal(mobileOpen.overflow, false);
await screenshot("global-navigation-mobile-open-390x844.png");

await send("Input.dispatchKeyEvent", {
  type: "keyDown",
  key: "Escape",
  code: "Escape",
});
await send("Input.dispatchKeyEvent", {
  type: "keyUp",
  key: "Escape",
  code: "Escape",
});
await delay(150);

const mobileClosed = await evaluate(`(() => ({
  hidden: document.querySelector('[class*="sheetLayer"]').hidden,
  bodyOverflow: document.body.style.overflow,
  contentInert: document.querySelector('[data-site-content]').inert,
}))()`);
assert.equal(mobileClosed.hidden, true);
assert.equal(mobileClosed.bodyOverflow, "");
assert.equal(mobileClosed.contentInert, false);

socket.close();
assert.deepEqual(browserFailures, []);
console.log("Global navigation browser checks passed.");
