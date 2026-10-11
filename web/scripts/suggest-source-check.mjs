#!/usr/bin/env node
// First-pass check for "Suggest a source" issues, run by
// .github/workflows/suggest-source.yml. It parses the issue-form body,
// normalises the URL, looks for duplicates among sources/*.yml (archived ones
// included), validates the fields, fetches the link once and writes one
// Markdown summary. It never accepts, labels, closes or edits anything: a
// maintainer still opens every suggestion.
//
// Input: the issue body in the ISSUE_BODY environment variable (never through
// a shell command line). Output: the summary at REPORT_PATH (or stdout), and
// `applicable=true|false` in GITHUB_OUTPUT when that is set.

import { appendFile, writeFile } from "node:fs/promises";
import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parse as parseYaml } from "yaml";

import { CATEGORY_DEFINITIONS, readSourceFiles } from "./catalogue-lib.mjs";

export const COMMENT_MARKER = "<!-- tessli:suggest-source-check -->";

/** The fields of .github/ISSUE_TEMPLATE/suggest-source.yml, in form order. */
export const FORM_FIELDS = [
  { key: "name", label: "Source name", required: true },
  { key: "url", label: "Canonical URL", required: true },
  { key: "category", label: "Category", required: true },
  { key: "kind", label: "What kind of source is it?", required: true },
  { key: "access", label: "Access model", required: true },
  { key: "summary", label: "What will someone find there?", required: true },
  { key: "why", label: "Why include it?", required: true },
  {
    key: "frameworks",
    label: "Frameworks or tools (if relevant)",
    required: false,
  },
  { key: "license", label: "Licence (if known)", required: false },
  {
    key: "affiliation",
    label: "Your relationship to this source",
    required: true,
  },
  { key: "checks", label: "Before submitting", required: true },
];

/** Form option label → category id: exactly the current categories. */
export const CATEGORY_OPTIONS = new Map(
  CATEGORY_DEFINITIONS.map((category) => [category.label, category.id]),
);

/** Form option label → access value (null: the maintainer decides). */
export const ACCESS_OPTIONS = new Map([
  ["Free", "free"],
  ["Open source", "open-source"],
  ["Freemium (useful free tier)", "freemium"],
  ["Paid", "paid"],
  ["Not sure", null],
]);

export const SUMMARY_LENGTH = { min: 40, max: 200 };
export const LINK_CHECK = { timeoutMs: 10_000, maxRedirects: 5 };

const NO_RESPONSE = "_No response_";
const TRACKING_PARAM = /^(?:utm_.+|ref|fbclid|gclid)$/iu;
const HEADING = /^###[ \t]+(.+?)[ \t]*$/u;

function repoRootFromModule() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
}

/**
 * Splits an issue-form body into its fields. Only the form's own headings
 * start a section, so a "###" line typed inside an answer stays part of it.
 */
export function parseIssueForm(body) {
  const labels = new Map(FORM_FIELDS.map((field) => [field.label, field.key]));
  const sections = new Map();
  let current = null;
  for (const line of String(body ?? "")
    .replace(/\r\n?/gu, "\n")
    .split("\n")) {
    const heading = HEADING.exec(line);
    if (heading && labels.has(heading[1]) && !sections.has(heading[1])) {
      current = heading[1];
      sections.set(current, []);
    } else if (current) {
      sections.get(current).push(line);
    }
  }

  const fields = {};
  for (const [label, lines] of sections) {
    const value = lines.join("\n").trim();
    fields[labels.get(label)] = value === NO_RESPONSE ? "" : value;
  }
  return fields;
}

/** True when the body comes from the suggest-source form. */
export function isSuggestSourceForm(fields) {
  return (
    Object.hasOwn(fields, "url") &&
    Object.hasOwn(fields, "summary") &&
    Object.hasOwn(fields, "category")
  );
}

/**
 * Normalises a URL for comparison: lowercase host without "www.", no
 * tracking parameters (utm_*, ref, fbclid, gclid), no fragment, no trailing
 * slash. `key` ignores the scheme so http and https duplicates match.
 */
export function normaliseUrl(raw) {
  const text = String(raw ?? "").trim();
  let url;
  try {
    url = new URL(text);
  } catch {
    return { ok: false, error: "invalid" };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { ok: false, error: "protocol" };
  }

  url.hostname = url.hostname.toLowerCase().replace(/^www\./u, "");
  url.hash = "";
  url.username = "";
  url.password = "";
  const removedParams = [...new Set(url.searchParams.keys())].filter((key) =>
    TRACKING_PARAM.test(key),
  );
  for (const key of removedParams) url.searchParams.delete(key);
  if (removedParams.length > 0 && url.searchParams.size === 0) url.search = "";

  const pathname = url.pathname.replace(/\/+$/u, "");
  const key = `${url.host}${pathname}${url.search}`;
  return {
    ok: true,
    url: `${url.protocol}//${key}`,
    key,
    host: url.hostname,
    https: url.protocol === "https:",
    removedParams,
  };
}

/**
 * Finds catalogue sources (any status) with the same normalised URL or, when
 * the URL differs, the same host.
 */
export function findDuplicates(normalised, sources) {
  if (!normalised?.ok) return [];
  const matches = [];
  for (const source of sources) {
    const existing = normaliseUrl(source.url);
    if (!existing.ok) continue;
    if (existing.key === normalised.key) {
      matches.push({ match: "url", source });
    } else if (existing.host === normalised.host) {
      matches.push({ match: "domain", source });
    }
  }
  return matches.sort(
    (left, right) =>
      (left.match === "url" ? 0 : 1) - (right.match === "url" ? 0 : 1) ||
      left.source.slug.localeCompare(right.source.slug),
  );
}

function tickedBoxes(value) {
  const boxes = String(value ?? "")
    .split("\n")
    .map((line) => /^\s*[-*]\s+\[( |x|X)\]/u.exec(line))
    .filter(Boolean);
  return {
    total: boxes.length,
    ticked: boxes.filter((box) => box[1] !== " ").length,
  };
}

/** Field-level validation. Messages never repeat the submitter's text. */
export function validateSuggestion(fields) {
  const errors = [];
  const notes = [];

  for (const field of FORM_FIELDS) {
    if (field.required && !String(fields[field.key] ?? "").trim()) {
      errors.push(`"${field.label}" is empty.`);
    }
  }

  const normalised = normaliseUrl(fields.url);
  if (fields.url && !normalised.ok) {
    errors.push(
      normalised.error === "protocol"
        ? "The URL must start with https://."
        : "The URL is not a valid web address.",
    );
  } else if (normalised.ok) {
    if (!normalised.https) {
      errors.push("Use the https:// address.");
    }
    if (normalised.removedParams.length > 0) {
      errors.push(
        `Remove the tracking parameters (${normalised.removedParams
          .map((param) => `\`${param.replace(/`/gu, "")}\``)
          .join(", ")}); the form asks for a clean URL.`,
      );
    }
  }

  if (fields.summary) {
    const length = fields.summary.replace(/\s+/gu, " ").trim().length;
    if (length < SUMMARY_LENGTH.min || length > SUMMARY_LENGTH.max) {
      errors.push(
        `The summary is ${length} characters; it needs ${SUMMARY_LENGTH.min}–${SUMMARY_LENGTH.max}.`,
      );
    }
  }

  if (fields.category && !CATEGORY_OPTIONS.has(fields.category.trim())) {
    errors.push(
      "The category is not one of the form's options. Pick one of the current categories.",
    );
  }
  if (fields.access && !ACCESS_OPTIONS.has(fields.access.trim())) {
    errors.push("The access model is not one of the form's options.");
  }

  if (fields.checks) {
    const { total, ticked } = tickedBoxes(fields.checks);
    if (total === 0 || ticked < total) {
      errors.push('Every "Before submitting" box must be ticked.');
    }
  }

  if (fields.affiliation && fields.affiliation.trim() !== "No affiliation") {
    notes.push(
      "The submitter reports a relationship with this source; a maintainer weighs that when reviewing.",
    );
  }

  return {
    errors,
    notes,
    normalised,
    categoryId: CATEGORY_OPTIONS.get(fields.category?.trim()) ?? null,
    access: ACCESS_OPTIONS.get(fields.access?.trim()) ?? null,
  };
}

// --- Link check ----------------------------------------------------------

const BLOCKED = new BlockList();
for (const [network, prefix] of [
  ["0.0.0.0", 8], // "this" network
  ["10.0.0.0", 8], // private
  ["100.64.0.0", 10], // shared (carrier-grade NAT)
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local, cloud metadata
  ["172.16.0.0", 12], // private
  ["192.0.0.0", 24], // IETF protocol assignments
  ["192.0.2.0", 24], // documentation
  ["192.88.99.0", 24], // 6to4 relay anycast
  ["192.168.0.0", 16], // private
  ["198.18.0.0", 15], // benchmarking
  ["198.51.100.0", 24], // documentation
  ["203.0.113.0", 24], // documentation
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved, broadcast
]) {
  BLOCKED.addSubnet(network, prefix, "ipv4");
}
for (const [network, prefix] of [
  ["::", 127], // unspecified and loopback
  ["100::", 64], // discard
  ["2001::", 23], // IETF protocol assignments, Teredo
  ["2001:db8::", 32], // documentation
  ["fc00::", 7], // unique local
  ["fe80::", 10], // link-local
  ["fec0::", 10], // site-local (deprecated)
  ["ff00::", 8], // multicast
]) {
  BLOCKED.addSubnet(network, prefix, "ipv6");
}

/**
 * Expands an IPv6 address to its eight 16-bit groups. The WHATWG URL parser
 * canonicalises it first, so a dotted tail (::ffff:127.0.0.1) becomes hex.
 */
function ipv6Groups(address) {
  const canonical = new URL(`http://[${address}]/`).hostname.slice(1, -1);
  const [head, tail] = canonical.split("::");
  const parse = (part) =>
    part ? part.split(":").map((group) => Number.parseInt(group, 16)) : [];
  const left = parse(head);
  const right = parse(tail);
  const gap = tail === undefined ? 0 : 8 - left.length - right.length;
  return [...left, ...new Array(gap).fill(0), ...right];
}

/**
 * The IPv4 address an IPv6 address carries, if any: IPv4-mapped
 * (::ffff:0:0/96), IPv4-compatible (::/96), NAT64 (64:ff9b::/96 and
 * 64:ff9b:1::/48) and 6to4 (2002::/16), in dotted or hex form.
 */
function embeddedIpv4(groups) {
  const toIpv4 = (high, low) =>
    [high >> 8, high & 0xff, low >> 8, low & 0xff].join(".");
  const zero = (from, to) =>
    groups.slice(from, to).every((group) => group === 0);
  if (zero(0, 5) && (groups[5] === 0xffff || groups[5] === 0)) {
    return toIpv4(groups[6], groups[7]);
  }
  if (
    groups[0] === 0x64 &&
    groups[1] === 0xff9b &&
    (zero(2, 6) || groups[2] === 1)
  ) {
    return toIpv4(groups[6], groups[7]);
  }
  if (groups[0] === 0x2002) return toIpv4(groups[1], groups[2]);
  return null;
}

/**
 * True for loopback, private, link-local, shared, documentation, reserved or
 * multicast addresses, including IPv4 ones carried inside IPv6 (mapped,
 * compatible, NAT64, 6to4) in either textual form. Anything that is not an IP
 * address counts as private.
 */
export function isPrivateAddress(address) {
  const value = String(address).toLowerCase();
  const family = isIP(value);
  if (family === 4) return BLOCKED.check(value, "ipv4");
  if (family !== 6) return true;
  const embedded = embeddedIpv4(ipv6Groups(value));
  if (embedded && BLOCKED.check(embedded, "ipv4")) return true;
  return BLOCKED.check(value, "ipv6");
}

async function hostIsPublic(hostname, lookupImpl) {
  const host = hostname.replace(/^\[|\]$/gu, "");
  if (host === "localhost" || host.endsWith(".localhost")) return false;
  const addresses = isIP(host)
    ? [{ address: host }]
    : await lookupImpl(host, { all: true });
  return (
    addresses.length > 0 &&
    addresses.every(({ address }) => !isPrivateAddress(address))
  );
}

/**
 * Requests the URL once (HEAD, then GET if HEAD fails or is refused),
 * following at most five redirects by hand, each to a public https or http
 * host. Reports the status only; no body is read. fetch resolves the name
 * again, so a DNS-rebinding host keeps a small window (see docs/decisions.md).
 */
export async function checkLink(rawUrl, options = {}) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const lookupImpl = options.lookupImpl ?? lookup;
  const timeoutMs = options.timeoutMs ?? LINK_CHECK.timeoutMs;
  const maxRedirects = options.maxRedirects ?? LINK_CHECK.maxRedirects;

  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false, reason: "invalid URL" };
  }

  for (let redirects = 0; ; redirects += 1) {
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return { ok: false, redirects, reason: "redirects to a non-web URL" };
    }
    try {
      if (!(await hostIsPublic(url.hostname, lookupImpl))) {
        return {
          ok: false,
          redirects,
          reason: "not fetched: the host is private or reserved",
        };
      }
    } catch {
      return { ok: false, redirects, reason: "the host name does not resolve" };
    }

    let response;
    let method = "HEAD";
    try {
      response = await fetchImpl(url, {
        method,
        redirect: "manual",
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch {
      response = null;
    }
    if (!response || response.status >= 400) {
      method = "GET";
      try {
        response = await fetchImpl(url, {
          method,
          redirect: "manual",
          signal: AbortSignal.timeout(timeoutMs),
        });
        await response.body?.cancel();
      } catch {
        return {
          ok: false,
          redirects,
          reason: `no response within ${timeoutMs / 1000}s`,
        };
      }
    }

    const location = response.headers.get("location");
    if (response.status >= 300 && response.status < 400 && location) {
      if (redirects >= maxRedirects) {
        return {
          ok: false,
          redirects,
          reason: `more than ${maxRedirects} redirects`,
        };
      }
      try {
        url = new URL(location, url);
      } catch {
        return { ok: false, redirects, reason: "redirects to an invalid URL" };
      }
      continue;
    }

    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      method,
      redirects,
      finalHost: url.hostname.toLowerCase().replace(/^www\./u, ""),
    };
  }
}

// --- Report --------------------------------------------------------------

function code(value) {
  return `\`${String(value).replace(/`/gu, "%60")}\``;
}

function plural(count, word) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export function renderReport({ validation, duplicates, link }) {
  const lines = [
    COMMENT_MARKER,
    "### Automated first-pass check",
    "",
    "This is an automatic check. It does not accept, label or add the source: a maintainer opens and reviews every suggestion. Edit the issue to re-run it.",
    "",
  ];

  if (validation.normalised.ok) {
    lines.push(`**Normalised URL:** ${code(validation.normalised.url)}`, "");
  }

  lines.push("#### Form");
  if (validation.errors.length === 0) {
    lines.push(
      "",
      "- Required fields, summary length, category and access look right.",
    );
  } else {
    lines.push("", ...validation.errors.map((error) => `- ${error}`));
  }
  lines.push(...validation.notes.map((note) => `- ${note}`), "");

  lines.push("#### Already in Tessli?", "");
  if (duplicates.length === 0) {
    lines.push(
      validation.normalised.ok
        ? "- No source with this URL or domain is in the catalogue, archived ones included."
        : "- Not checked: the URL could not be read.",
    );
  } else {
    for (const { match, source } of duplicates) {
      const status =
        source.status === "archived"
          ? `archived${source.archived_reason ? `: ${source.archived_reason}` : ""}`
          : source.status;
      lines.push(
        `- ${match === "url" ? "Same URL" : "Same domain"} as **${source.name}** (${code(`sources/${source.slug}.yml`)}, ${status}).`,
      );
    }
  }
  lines.push("");

  lines.push("#### Link", "");
  if (!validation.normalised.ok) {
    lines.push("- Not checked: the URL could not be read.");
  } else if (!link) {
    lines.push("- Not checked: the link check was skipped for this run.");
  } else if (link.status !== undefined) {
    const via = link.redirects
      ? `, after ${plural(link.redirects, "redirect")} to ${code(link.finalHost)}`
      : "";
    lines.push(`- HTTP ${link.status} (${link.method})${via}.`);
  } else {
    lines.push(`- Not reachable: ${link.reason}.`);
  }
  lines.push("");
  return `${lines.join("\n")}`;
}

/** Runs every check for one issue body. */
export async function runSuggestSourceCheck(body, sources, options = {}) {
  const fields = parseIssueForm(body);
  if (!isSuggestSourceForm(fields)) return { applicable: false };
  const validation = validateSuggestion(fields);
  const duplicates = findDuplicates(validation.normalised, sources);
  const link =
    validation.normalised.ok && options.checkLink
      ? await options.checkLink(validation.normalised.url)
      : null;
  return {
    applicable: true,
    fields,
    validation,
    duplicates,
    link,
    report: renderReport({ validation, duplicates, link }),
  };
}

export async function loadSources(root = repoRootFromModule()) {
  const files = await readSourceFiles(root);
  return files.map(({ text }) => {
    const data = parseYaml(text);
    return {
      slug: data.slug,
      name: data.name,
      url: data.url,
      status: data.status,
      ...(data.archived_reason
        ? { archived_reason: data.archived_reason }
        : {}),
    };
  });
}

async function main() {
  const sources = await loadSources();
  const result = await runSuggestSourceCheck(
    process.env.ISSUE_BODY ?? "",
    sources,
    { checkLink: process.env.SKIP_LINK_CHECK === "1" ? null : checkLink },
  );
  if (process.env.GITHUB_OUTPUT) {
    await appendFile(
      process.env.GITHUB_OUTPUT,
      `applicable=${result.applicable}\n`,
    );
  }
  if (!result.applicable) {
    console.log("Not a suggest-source form body; nothing to report.");
    return;
  }
  if (process.env.REPORT_PATH) {
    await writeFile(process.env.REPORT_PATH, result.report);
    console.log(`Report written to ${process.env.REPORT_PATH}.`);
  } else {
    process.stdout.write(result.report);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main();
}
