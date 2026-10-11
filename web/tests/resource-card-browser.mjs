import assert from "node:assert/strict";

const endpoint = process.env.CDP_ENDPOINT ?? "http://127.0.0.1:9222";
const browseUrl =
  process.env.TESSLI_BROWSE_URL ?? "http://127.0.0.1:3000/resources";
const pending = new Map();
let messageId = 0;

async function delay(milliseconds) {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function pageTargets() {
  const response = await fetch(`${endpoint}/json/list`);
  const targets = await response.json();
  return targets.filter((target) => target.type === "page");
}

async function findPageTarget() {
  const deadline = Date.now() + 10_000;

  while (Date.now() < deadline) {
    try {
      const page = (await pageTargets())[0];
      if (page?.webSocketDebuggerUrl) {
        return page;
      }
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

  if (!request) {
    return;
  }

  pending.delete(message.id);
  if (message.error) {
    request.reject(new Error(message.error.message));
  } else {
    request.resolve(message.result);
  }
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
    if (await evaluateSettled(expression)) {
      return;
    }

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

const firstCard = "[data-browse-view=cards] [data-resource-card]";

async function revealFirstCard() {
  await evaluate(`(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    document.querySelector('${firstCard}')?.scrollIntoView({
      block: 'center',
    });
  })()`);
  await delay(100);
}

async function hoverFirstCard() {
  const point = await evaluate(`(() => {
    const card = document.querySelector('${firstCard}');
    const rect = card.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  })()`);

  await send("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x: point.x,
    y: point.y,
  });
}

await send("Page.enable");
await send("Runtime.enable");
await markDocumentStale();
await send("Page.navigate", { url: browseUrl });
await waitFor(
  `!window.__tessliStale && document.readyState === "complete" && document.querySelectorAll("${firstCard}").length > 0`,
  "profile-linked Browse cards",
);

await revealFirstCard();
await hoverFirstCard();
await waitFor(
  `getComputedStyle(document.querySelector("${firstCard}")).transform !== "none"`,
  "the card hover lift",
);
await waitFor(
  `getComputedStyle(document.querySelector("${firstCard}"), "::before").backgroundSize.includes("100% 1px")`,
  "the card hover border trace",
);

assert.equal(
  await evaluate(`(() => {
    const paragraph = Array.from(
      document.querySelectorAll('${firstCard} p'),
    ).find((candidate) => candidate.textContent.trim().length > 20);
    if (!paragraph) return false;
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(paragraph);
    selection.removeAllRanges();
    selection.addRange(range);
    const selected = selection.toString().trim().length > 20;
    selection.removeAllRanges();
    return selected;
  })()`),
  true,
  "Card text should remain selectable.",
);

assert.equal(
  await evaluate("document.documentElement.scrollWidth <= window.innerWidth"),
  true,
  "Browse cards must not overflow horizontally.",
);

assert.equal(
  await evaluate(`(() => {
    const cards = Array.from(
      document.querySelectorAll('[data-browse-view=cards] [data-resource-card]'),
    );

    return cards.every((card) => {
      const inspect = card.querySelector('a[data-resource-inspect]');
      const primary = card.querySelector(':scope > a[data-resource-profile-link]');
      const save = card.querySelector('button[data-resource-save], button[aria-pressed]');
      const visit = card.querySelector('a[data-resource-visit]');
      const archived = card.getAttribute('data-resource-status') === 'archived';
      const independentActions = archived
        ? !visit && /Archived/.test(card.textContent)
        : visit?.getAttribute('target') === '_blank' &&
          visit?.getAttribute('rel') === 'noopener noreferrer';

      return Boolean(
        inspect &&
          primary?.getAttribute('href')?.startsWith('/resources/') &&
          !primary.hasAttribute('target') &&
          !save &&
          independentActions &&
          !card.querySelector('a a, a button, button a, button button'),
      );
    });
  })()`),
  true,
  "Every profile-linked Browse card should keep Inspect and Visit as independent controls, with no Save control.",
);

assert.equal(
  await evaluate(`(() => {
    const inspect = document.querySelector('[data-browse-view=cards] a[data-resource-inspect]');
    inspect?.focus();
    return document.activeElement === inspect && inspect.closest('[data-resource-card]')?.matches(':focus-within');
  })()`),
  true,
  "The explicit Inspect action should be keyboard-focusable.",
);

const mediaOrder = ["preview", "favicon", "generated"];
const mediaCardIndex = await evaluate(`(() => {
  const cards = Array.from(
    document.querySelectorAll('[data-browse-view=cards] [data-resource-card]'),
  );
  return cards.findIndex(
    (card) => card.getAttribute('data-media-state') !== 'generated' && card.querySelector('img'),
  );
})()`);
assert.notEqual(
  mediaCardIndex,
  -1,
  "At least one Browse card should render preview or favicon media.",
);
const mediaCard = `document.querySelectorAll('[data-browse-view=cards] [data-resource-card]')[${mediaCardIndex}]`;
const observedStates = [
  await evaluate(`${mediaCard}.getAttribute('data-media-state')`),
];

while (observedStates.at(-1) !== "generated") {
  const previous = observedStates.at(-1);
  await evaluate(
    `${mediaCard}.querySelector('img')?.dispatchEvent(new Event('error'))`,
  );
  await waitFor(
    `${mediaCard}.getAttribute('data-media-state') !== '${previous}'`,
    `the media fallback to advance past ${previous}`,
  );
  observedStates.push(
    await evaluate(`${mediaCard}.getAttribute('data-media-state')`),
  );
}

assert.deepEqual(
  observedStates,
  mediaOrder.filter((state) => observedStates.includes(state)),
  "Card media should fall back in preview, favicon, generated-mark order.",
);
assert.equal(
  await evaluate(`(() => {
    const card = ${mediaCard};
    const mark = card.querySelector(':scope > a span[aria-hidden="true"]');
    return !card.querySelector('img') && /^[A-Z0-9]$/.test(mark?.textContent?.trim() ?? '');
  })()`),
  true,
  "A card whose media all fails should render the generated mark without an image.",
);

socket.close();
console.log(
  "Resource card hover, selection, overflow, independent-action, and media-fallback checks passed.",
);
