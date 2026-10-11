#!/usr/bin/env node
// One-off, deterministic application of the owner-approved triage
// (docs/v1.2/catalogue-triage-final.csv) to sources/<slug>.yml.
//
// Run from the repository root:  node docs/v1.2/apply-triage.mjs
// then regenerate the catalogue: (cd web && npm run catalogue:generate)
//
// It is idempotent and network-free. It only edits the lines it owns
// (status, archived_reason, replaced_by, and for fix-url rows url, name and
// summary); it never changes an id and never deletes a file. The lasting
// guarantee is web/tests/catalogue-triage.test.mjs, not this script.

import { readFile, readdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(path.join(root, "web/package.json"));
const { stringify } = require("yaml");

const CSV_PATH = "docs/v1.2/catalogue-triage-final.csv";
const KEEP_SCORE = 14; // decision_note: "MAYBE resolved by score rule (>=14 keep)"
const MAX_SCORE = 18; // browse x2 + unique + alive + free_depth + quality, each 0-3

// fix-url rows. The proxy in the session that applied the triage blocked
// every outbound check (HTTP 403 from the gateway), so none of these URLs
// could be opened: each row is set to needs-review and the gap is recorded
// in docs/decisions.md.
const FIX_URL = {
  "origin-ui": {
    name: "coss UI",
    url: "https://coss.com/ui",
    summary:
      "Copyable Tailwind and shadcn-style components (formerly Origin UI)",
  },
  "react-aria": { url: "https://react-aria.adobe.com" },
  // No documented successor: the CSV only asks to confirm the canonical URL.
  "shopify-polaris": {},
  v0: { url: "https://v0.app" },
};

// Rows whose CSV reason is a redirect, a dead link or a duplicate: the reason
// is shortened by hand so the source page reads plainly. Every fact is from
// the CSV reason column.
const GATE_REASONS = {
  "web-interactions-gallery":
    "Dead link: the listed URL returned HTTP 404 (media check, 2026-08-02)",
  "inspo-page":
    "Redirects to Details.so, a different brand (August 2026 check)",
  "ui-sources": "Redirects to ScreensDesign (August 2026 check)",
  "design-vault": "Redirects to ScreensDesign (August 2026 check)",
  scrnshts: "Redirects to ScreensDesign (August 2026 check)",
  screenlane: "Redirects to Page Flows, which is already listed",
  "ui-movement": "Redirects to Page Flows, which is already listed",
  "saas-examples":
    "Domain now resolves to a personal site, not the SaaS examples gallery (August 2026 check)",
  "mailchimp-pattern-library":
    "Returned HTTP 503 in August 2026; the pattern library is long abandoned",
  "audi-ui": "Dead link: returned HTTP 404 in August 2026",
};

// replaced_by: only where the CSV reason names exactly one successor that is
// an active catalogue source (redirects, merges, "superseded by", "fork").
const REPLACED_BY = {
  screenlane: "page-flows",
  "ui-movement": "page-flows",
  "ux-bites": "built-for-mars",
  siiimple: "minimal-gallery",
  feather: "lucide",
};

const MERGE_REASONS = {
  // Its merge target, Dark Mode Design, is archived in the same triage, so
  // there is no active replacement to point at.
  "dark-design":
    "Merged into Dark Mode Design as a near-duplicate; Dark Mode Design is archived too",
  "ux-bites": "Merged into Built for Mars (same product and domain)",
};

// First words that are names and keep their capital when a reason follows a
// colon.
const PROPER_START =
  /^(?:Microsoft|Tailwind|Segment|Uber|Ionic|Freepik|Envato|Bootstrap|Shopify|Vue|Svelte|Workday|Google|Dribbble-shot|Icons8)\b/u;

function lowerFirst(text) {
  const firstWord = text.split(/[\s/]/u)[0];
  if (PROPER_START.test(text) || /[A-Z]/u.test(firstWord.slice(1))) {
    return text;
  }
  return text.charAt(0).toLowerCase() + text.slice(1);
}

export function archivedReason(row) {
  if (row.owner_decision === "merge") return MERGE_REASONS[row.slug];
  if (GATE_REASONS[row.slug]) return GATE_REASONS[row.slug];
  // Drop notes about Tessli's own collections: they described the old
  // membership, not the source.
  const reason = row.reason
    .replace(/\s*\(in (?:OSS|a11y) collection\)/u, "")
    .trim();
  if (row.rule === "gate:off-scope") {
    const cleaned = reason.replace(/;\s*off-scope(?: for UI\/frontend)?$/u, "");
    return `Off-scope: ${lowerFirst(cleaned)}`;
  }
  if (row.rule.startsWith("score")) {
    const score = Number(row.score_total);
    if (!(score < KEEP_SCORE)) {
      throw new Error(`${row.slug}: archived by score but scored ${score}`);
    }
    return `Triage score ${score}/${MAX_SCORE} (keep threshold ${KEEP_SCORE}): ${lowerFirst(reason)}`;
  }
  throw new Error(`${row.slug}: no reason rule for ${row.rule}`);
}

export function parseCsv(text) {
  const rows = [];
  let field = "";
  let row = [];
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [header, ...body] = rows.filter((cells) => cells.some(Boolean));
  return body.map((cells) =>
    Object.fromEntries(header.map((key, index) => [key, cells[index] ?? ""])),
  );
}

function scalarLine(key, value) {
  return stringify({ [key]: value }, { lineWidth: 0 }).trimEnd();
}

function setLine(lines, key, value) {
  const index = lines.findIndex((line) => line.startsWith(`${key}:`));
  if (index === -1) throw new Error(`missing ${key}`);
  lines[index] = scalarLine(key, value);
}

function planFor(row) {
  switch (row.owner_decision) {
    case "keep":
      return { status: "active" };
    case "archive":
    case "merge":
      return {
        status: "archived",
        archived_reason: archivedReason(row),
        ...(REPLACED_BY[row.slug] ? { replaced_by: REPLACED_BY[row.slug] } : {}),
      };
    case "fix-url":
      return { status: "needs-review", ...FIX_URL[row.slug] };
    default:
      throw new Error(`${row.slug}: unknown owner_decision ${row.owner_decision}`);
  }
}

async function main() {
  const rows = parseCsv(await readFile(path.join(root, CSV_PATH), "utf8"));
  const files = (await readdir(path.join(root, "sources"))).filter((name) =>
    name.endsWith(".yml"),
  );
  if (rows.length !== files.length) {
    throw new Error(`${rows.length} CSV rows but ${files.length} source files`);
  }

  const counts = {};
  for (const row of rows) {
    const file = path.join(root, "sources", `${row.slug}.yml`);
    const text = await readFile(file, "utf8");
    if (!text.includes(`\nid: ${row.id}\n`) && !text.startsWith(`id: ${row.id}\n`)) {
      throw new Error(`${row.slug}: id does not match ${row.id}`);
    }
    const plan = planFor(row);
    const lines = text
      .replace(/\n$/u, "")
      .split("\n")
      .filter(
        (line) =>
          !line.startsWith("archived_reason:") && !line.startsWith("replaced_by:"),
      );
    for (const key of ["name", "url", "summary", "status"]) {
      if (plan[key] !== undefined) setLine(lines, key, plan[key]);
    }
    const statusIndex = lines.findIndex((line) => line.startsWith("status:"));
    const extra = [];
    if (plan.archived_reason) {
      extra.push(scalarLine("archived_reason", plan.archived_reason));
    }
    if (plan.replaced_by) extra.push(scalarLine("replaced_by", plan.replaced_by));
    lines.splice(statusIndex + 1, 0, ...extra);
    const next = `${lines.join("\n")}\n`;
    if (next !== text) await writeFile(file, next);
    counts[plan.status] = (counts[plan.status] ?? 0) + 1;
  }
  console.log(JSON.stringify(counts));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await main();
}
