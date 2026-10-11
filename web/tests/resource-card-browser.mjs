import assert from "node:assert/strict";

const endpoint = process.env.CDP_ENDPOINT ?? "http://127.0.0.1:9222";
const browseUrl =
  process.env.TESSLI_RESOURCE_CARD_URL ?? "http://127.0.0.1:3000/resources";
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

async function waitFor(expression, label, timeout = 7_500) {
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    if (await evaluate(expression)) {
      return;
    }

    await delay(50);
  }

  throw new Error(`Timed out waiting for ${label}.`);
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
await send("Page.navigate", { url: browseUrl });
await waitFor(
  `document.readyState === "complete" && document.querySelectorAll("${firstCard}").length > 0`,
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
      const save = card.querySelector('button[data-resource-save]');
      const visit = card.querySelector('a[data-resource-visit]');
      const unavailable = card.getAttribute('data-resource-status') === 'unavailable';
      const independentActions = unavailable
        ? !visit && /Provider unavailable/.test(card.textContent)
        : visit?.getAttribute('target') === '_blank' &&
          visit?.getAttribute('rel') === 'noopener noreferrer';

      return Boolean(
        inspect &&
          primary?.getAttribute('href')?.startsWith('/resources/') &&
          !primary.hasAttribute('target') &&
          save &&
          independentActions &&
          !card.querySelector('a a, a button, button a, button button'),
      );
    });
  })()`),
  true,
  "Every profile-linked Browse card should keep Inspect, Visit, and Save as independent controls.",
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

socket.close();
console.log(
  "Resource card hover, selection, overflow, and independent-action checks passed.",
);
