#!/usr/bin/env node
// Capture the mechanical evidence for one Taste Bench run.
//
// For every state in the run's manifest it loads `/?state=<name>` (`/` for
// `default`) at 1440, 768 and 390 px, takes a full-page screenshot, checks for
// horizontal overflow (also at 320 px), counts console and page errors, and
// runs axe-core with the WCAG 2.2 AA tags. Results go to
// <run-dir>/evidence.json and <run-dir>/screenshots/<state>-<width>.png.
//
// Uses the Playwright and axe-core already installed for web/ (no new
// dependencies): run `npm ci` in web/ first.
//
//   node bench/scripts/capture.mjs --run bench/runs/<run-id> --workspace /tmp/ws/<run-id>
//   node bench/scripts/capture.mjs --run bench/runs/<run-id> --url http://127.0.0.1:4310
//
// With --workspace it runs `npm run build` and `npm run start` in the
// workspace itself (port --port, default 4310) and stops the server after.
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const benchDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const webRequire = createRequire(path.join(benchDir, "..", "web", "package.json"));
const { chromium } = webRequire("@playwright/test");
const { AxeBuilder } = webRequire("@axe-core/playwright");

const WIDTHS = [1440, 768, 390];
const OVERFLOW_ONLY_WIDTHS = [320];
const VIEWPORT_HEIGHT = 900;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const runDir = argument("--run");
const workspace = argument("--workspace");
const port = Number(argument("--port") ?? 4310);
let baseUrl = argument("--url");
if (!runDir || (!workspace && !baseUrl) || (workspace && baseUrl)) {
  console.error(
    "Usage: node bench/scripts/capture.mjs --run <run-dir> (--workspace <dir> [--port 4310] | --url <base-url>)",
  );
  process.exit(2);
}

const manifest = JSON.parse(await readFile(path.join(runDir, "manifest.json"), "utf8"));
const harnessEnv = { ...process.env, TESSLI_BENCH_HARNESS: "1", NEXT_TELEMETRY_DISABLED: "1" };

function run(command, args, cwd) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, env: harnessEnv, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    child.stdout.on("data", (chunk) => (output += chunk));
    child.stderr.on("data", (chunk) => (output += chunk));
    child.on("close", (code) => resolve({ code, output }));
  });
}

async function waitFor(url, seconds) {
  for (let attempt = 0; attempt < seconds; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.status < 500) return true;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return false;
}

const evidence = {
  schema: "taste-bench-evidence/1",
  run_id: manifest.run_id,
  captured_at: new Date().toISOString().replace(/\.\d{3}Z$/u, "Z"),
  axe_tags: AXE_TAGS,
  viewport_height: VIEWPORT_HEIGHT,
  build: { ran: Boolean(workspace), ok: null },
  states: [],
  console_messages: [],
  summary: null,
};

let server;
if (workspace) {
  const build = await run("npm", ["run", "build"], workspace);
  evidence.build.ok = build.code === 0;
  if (!evidence.build.ok) {
    evidence.build.output_tail = build.output.split("\n").slice(-40).join("\n");
  } else {
    baseUrl = `http://127.0.0.1:${port}`;
    server = spawn("npm", ["run", "start", "--", "--hostname", "127.0.0.1", "--port", String(port)], {
      cwd: workspace,
      env: harnessEnv,
      stdio: "ignore",
      detached: true,
    });
    if (!(await waitFor(baseUrl, 60))) {
      evidence.build.ok = false;
      evidence.build.output_tail = `next start did not answer on ${baseUrl} within 60 s`;
    }
  }
}

function stopServer() {
  if (server) {
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {
      // already stopped
    }
  }
}

function summarise(axe) {
  const byImpact = {};
  for (const violation of axe.violations) {
    const impact = violation.impact ?? "unknown";
    byImpact[impact] = (byImpact[impact] ?? 0) + violation.nodes.length;
  }
  return {
    violations: axe.violations.length,
    nodes: axe.violations.reduce((total, violation) => total + violation.nodes.length, 0),
    by_impact: byImpact,
    rules: axe.violations.map(({ id, impact, nodes }) => ({ id, impact, nodes: nodes.length })),
  };
}

async function load(browser, state, width) {
  const context = await browser.newContext({ viewport: { width, height: VIEWPORT_HEIGHT }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  const pathname = state === "default" ? "/" : `/?state=${encodeURIComponent(state)}`;
  let status = null;
  try {
    const response = await page.goto(new URL(pathname, baseUrl).href, { waitUntil: "networkidle", timeout: 30_000 });
    status = response?.status() ?? null;
  } catch (error) {
    pageErrors.push(`navigation: ${error.message}`);
  }
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  const measured = await page
    .evaluate((name) => {
      const root = document.documentElement;
      return {
        state_marker_found: Boolean(document.querySelector(`main[data-state="${CSS.escape(name)}"]`)),
        scroll_width: root.scrollWidth,
        client_width: root.clientWidth,
        overflow: root.scrollWidth > root.clientWidth,
      };
    }, state)
    .catch(() => ({ state_marker_found: false, scroll_width: null, client_width: null, overflow: null }));
  return { context, page, pathname, status, consoleErrors, pageErrors, measured };
}

let browser;
try {
  if (evidence.build.ok !== false) {
    browser = await chromium.launch({ headless: true });
    evidence.tools = { chromium: browser.version() };
    const screenshotDir = path.join(runDir, "screenshots");
    await mkdir(screenshotDir, { recursive: true });
    for (const state of manifest.states) {
      const record = { state, path: state === "default" ? "/" : `/?state=${state}`, captures: [], overflow_only: [] };
      for (const width of WIDTHS) {
        const loaded = await load(browser, state, width);
        const screenshot = `screenshots/${state}-${width}.png`;
        await loaded.page.screenshot({ path: path.join(runDir, screenshot), fullPage: true });
        let axe;
        try {
          axe = summarise(await new AxeBuilder({ page: loaded.page }).withTags(AXE_TAGS).analyze());
        } catch (error) {
          axe = { error: error.message };
        }
        record.captures.push({
          width,
          http_status: loaded.status,
          screenshot,
          ...loaded.measured,
          console_errors: loaded.consoleErrors.length,
          page_errors: loaded.pageErrors.length,
          axe,
        });
        for (const text of loaded.consoleErrors) evidence.console_messages.push({ state, width, type: "console", text });
        for (const text of loaded.pageErrors) evidence.console_messages.push({ state, width, type: "page", text });
        await loaded.context.close();
      }
      for (const width of OVERFLOW_ONLY_WIDTHS) {
        const loaded = await load(browser, state, width);
        record.overflow_only.push({ width, ...loaded.measured });
        await loaded.context.close();
      }
      evidence.states.push(record);
    }
  }
} finally {
  await browser?.close();
  stopServer();
}

const captures = evidence.states.flatMap((state) => state.captures);
const overflowChecks = evidence.states.flatMap((state) => [...state.captures, ...state.overflow_only].map((c) => ({ ...c, state: state.state })));
evidence.summary = {
  build_ok: evidence.build.ok,
  states: manifest.states.length,
  states_reachable: evidence.states.filter((state) => state.captures.every((c) => c.state_marker_found)).length,
  screenshots: captures.length,
  overflow: overflowChecks.filter((c) => c.overflow).map((c) => `${c.state}@${c.width}`),
  console_errors: captures.reduce((total, c) => total + c.console_errors, 0),
  page_errors: captures.reduce((total, c) => total + c.page_errors, 0),
  axe_violations_max: Math.max(0, ...captures.map((c) => c.axe.violations ?? 0)),
  axe_nodes_total: captures.reduce((total, c) => total + (c.axe.nodes ?? 0), 0),
};
await writeFile(path.join(runDir, "evidence.json"), JSON.stringify(evidence, null, 2) + "\n");
console.log(JSON.stringify(evidence.summary, null, 2));
