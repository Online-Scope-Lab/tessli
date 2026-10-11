import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { parse as parseYaml } from "yaml";

import {
  ACCESS_VALUES,
  CATEGORY_DEFINITIONS,
} from "../scripts/catalogue-lib.mjs";
import {
  ACCESS_OPTIONS,
  CATEGORY_OPTIONS,
  COMMENT_MARKER,
  FORM_FIELDS,
  checkLink,
  findDuplicates,
  isPrivateAddress,
  isSuggestSourceForm,
  loadSources,
  normaliseUrl,
  parseIssueForm,
  runSuggestSourceCheck,
  validateSuggestion,
} from "../scripts/suggest-source-check.mjs";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const SUMMARY =
  "Side-by-side examples of about 60 component types from public design systems.";

function formBody(overrides = {}) {
  const values = {
    name: "Component Gallery",
    url: "https://component.gallery/",
    category: "Design systems and pattern libraries",
    kind: "Reference guide",
    access: "Free",
    summary: SUMMARY,
    why: "Complements GOV.UK Design System and Material Design 3.",
    frameworks: "Not applicable",
    license: "_No response_",
    affiliation: "No affiliation",
    checks: [
      "- [X] I searched the catalogue and open issues; it is not already listed or proposed.",
      "- [X] The URL opens without login and shows meaningful content (or I chose Paid).",
      "- [X] The URL contains no referral, affiliate or tracking parameters.",
      "- [X] I am a human submitter, and I have opened and looked at this source myself.",
    ].join("\n"),
    ...overrides,
  };
  return FORM_FIELDS.map(
    (field) => `### ${field.label}\n\n${values[field.key]}`,
  ).join("\n\n");
}

const sources = [
  {
    slug: "land-book",
    name: "Land-book",
    url: "https://land-book.com",
    status: "active",
  },
  {
    slug: "designindex",
    name: "DesignIndex",
    url: "https://www.designindex.xyz",
    status: "archived",
    archived_reason: "Off-scope: meta-directory of design resources",
  },
  {
    slug: "icons8",
    name: "Icons8",
    url: "https://icons8.com/icons",
    status: "archived",
    archived_reason: "Triage score 12/18 (keep threshold 14): overlap",
  },
];

test("issue-form bodies parse into fields, with _No response_ as empty", () => {
  const fields = parseIssueForm(formBody().replace(/\n/gu, "\r\n"));

  assert.equal(fields.name, "Component Gallery");
  assert.equal(fields.url, "https://component.gallery/");
  assert.equal(fields.summary, SUMMARY);
  assert.equal(fields.license, "");
  assert.equal(isSuggestSourceForm(fields), true);
  assert.equal(isSuggestSourceForm(parseIssueForm("### Bug\n\nBroken")), false);
  assert.equal(isSuggestSourceForm(parseIssueForm("")), false);

  // A "###" line typed inside an answer does not start a new field.
  const nested = parseIssueForm(
    formBody({ why: "Reasons:\n### Canonical URL\nhttps://evil.example" }),
  );
  assert.equal(nested.url, "https://component.gallery/");
  assert.match(nested.why, /evil\.example/u);
});

test("URLs normalise host, www, tracking parameters, fragment and trailing slash", () => {
  const normalised = normaliseUrl(
    "  https://WWW.Example.COM/Path/?utm_source=x&id=7&ref=hn&fbclid=1&gclid=2&UTM_Medium=y#top ",
  );
  assert.equal(normalised.ok, true);
  assert.equal(normalised.url, "https://example.com/Path?id=7");
  assert.equal(normalised.host, "example.com");
  assert.deepEqual(normalised.removedParams.sort(), [
    "UTM_Medium",
    "fbclid",
    "gclid",
    "ref",
    "utm_source",
  ]);

  assert.equal(normaliseUrl("https://example.com/").url, "https://example.com");
  assert.equal(
    normaliseUrl("https://example.com/a///").url,
    "https://example.com/a",
  );
  assert.equal(
    normaliseUrl("http://example.com/a").key,
    normaliseUrl("https://www.example.com/a/").key,
  );
  assert.equal(
    normaliseUrl("https://example.com/?referrer=1").url,
    "https://example.com?referrer=1",
  );
  assert.deepEqual(normaliseUrl("not a url"), { ok: false, error: "invalid" });
  assert.deepEqual(normaliseUrl("ftp://example.com"), {
    ok: false,
    error: "protocol",
  });
  assert.deepEqual(normaliseUrl("javascript:alert(1)"), {
    ok: false,
    error: "protocol",
  });
});

test("duplicates are found by URL and by domain, archived sources included", () => {
  assert.deepEqual(
    findDuplicates(
      normaliseUrl("https://designindex.xyz/?utm_source=x"),
      sources,
    ).map(({ match, source }) => [match, source.slug, source.status]),
    [["url", "designindex", "archived"]],
  );
  assert.deepEqual(
    findDuplicates(
      normaliseUrl("https://icons8.com/illustrations"),
      sources,
    ).map(({ match, source }) => [match, source.slug]),
    [["domain", "icons8"]],
  );
  assert.deepEqual(
    findDuplicates(normaliseUrl("https://component.gallery"), sources),
    [],
  );
  assert.deepEqual(findDuplicates(normaliseUrl("nope"), sources), []);
});

test("validation checks required fields, summary length, category and access", () => {
  const valid = validateSuggestion(parseIssueForm(formBody()));
  assert.deepEqual(valid.errors, []);
  assert.equal(valid.categoryId, "design-systems");
  assert.equal(valid.access, "free");

  const invalid = validateSuggestion(
    parseIssueForm(
      formBody({
        name: "_No response_",
        url: "http://example.com/?utm_campaign=launch",
        category: "Sections and UI patterns",
        access: "Lifetime deal",
        summary: "Too short.",
        affiliation: "I created it",
        checks: "- [X] I searched the catalogue\n- [ ] The URL opens",
      }),
    ),
  );
  assert.deepEqual(invalid.errors, [
    '"Source name" is empty.',
    "Use the https:// address.",
    "Remove the tracking parameters (`utm_campaign`); the form asks for a clean URL.",
    "The summary is 10 characters; it needs 40–200.",
    "The category is not one of the form's options. Pick one of the current categories.",
    "The access model is not one of the form's options.",
    'Every "Before submitting" box must be ticked.',
  ]);
  assert.equal(invalid.notes.length, 1);

  const long = validateSuggestion(
    parseIssueForm(formBody({ summary: "x".repeat(201) })),
  );
  assert.deepEqual(long.errors, [
    "The summary is 201 characters; it needs 40–200.",
  ]);
  const edges = [40, 200].map(
    (length) =>
      validateSuggestion(
        parseIssueForm(formBody({ summary: "y".repeat(length) })),
      ).errors,
  );
  assert.deepEqual(edges, [[], []]);
  assert.deepEqual(
    validateSuggestion(parseIssueForm(formBody({ url: "notaurl" }))).errors,
    ["The URL is not a valid web address."],
  );
});

test("the issue form offers exactly the categories and access values the check accepts", async () => {
  const form = parseYaml(
    await readFile(
      path.join(repoRoot, ".github/ISSUE_TEMPLATE/suggest-source.yml"),
      "utf8",
    ),
  );
  const elements = new Map(
    form.body
      .filter((element) => element.id)
      .map((element) => [element.id, element]),
  );

  assert.equal(form.title, "[Source]: ");
  assert.deepEqual(
    elements.get("category").attributes.options,
    CATEGORY_DEFINITIONS.map((category) => category.label),
  );
  assert.deepEqual(
    [...CATEGORY_OPTIONS.values()],
    CATEGORY_DEFINITIONS.map((category) => category.id),
  );
  assert.deepEqual(elements.get("access").attributes.options, [
    ...ACCESS_OPTIONS.keys(),
  ]);
  for (const value of ACCESS_OPTIONS.values()) {
    assert.ok(value === null || ACCESS_VALUES.includes(value), value);
  }

  // Every form field is parsed under its label, with the same requiredness.
  const inputs = form.body.filter((element) => element.type !== "markdown");
  assert.deepEqual(
    inputs.map((element) => [
      element.attributes.label,
      element.type === "checkboxes"
        ? element.attributes.options.every((option) => option.required)
        : Boolean(element.validations?.required),
    ]),
    FORM_FIELDS.map((field) => [field.label, field.required]),
  );
});

test("private and reserved addresses are never fetched", async () => {
  for (const address of [
    "127.0.0.1",
    "10.1.2.3",
    "172.16.0.1",
    "192.168.1.1",
    "169.254.169.254",
    "100.64.0.1",
    "0.0.0.0",
    "::1",
    "fd00::1",
    "fe80::1",
    "::ffff:127.0.0.1",
    // IPv4 carried in IPv6, in the hex form the WHATWG URL parser produces.
    "::ffff:7f00:1",
    "::ffff:a9fe:a9fe",
    "::ffff:a00:1",
    "::127.0.0.1",
    "::7f00:1",
    "::ffff:0:7f00:1",
    "::ffff:0:a9fe:a9fe",
    "64:ff9b::7f00:1",
    "64:ff9b::a9fe:a9fe",
    "64:ff9b:1::a00:1",
    "2002:a00:1::1",
    "::",
    "2001:db8::1",
    "192.0.2.1",
    "255.255.255.255",
    "not-an-address",
  ]) {
    assert.equal(isPrivateAddress(address), true, address);
  }
  for (const address of [
    "93.184.216.34",
    "2606:4700::1",
    "::ffff:5db8:d822",
    "64:ff9b::5db8:d822",
  ]) {
    assert.equal(isPrivateAddress(address), false, address);
  }

  let fetched = 0;
  const result = await checkLink("https://internal.example", {
    lookupImpl: async () => [{ address: "10.0.0.5" }],
    fetchImpl: async () => {
      fetched += 1;
      return new Response(null, { status: 200 });
    },
  });
  assert.equal(fetched, 0);
  assert.equal(result.ok, false);
  assert.match(result.reason, /private or reserved/u);

  // A literal IPv4-mapped address, and a public host redirecting to one.
  for (const start of [
    "http://[::ffff:127.0.0.1]:3000/",
    "http://[64:ff9b::a9fe:a9fe]/latest/meta-data/",
    "https://public.example/",
  ]) {
    const hosts = [];
    const blocked = await checkLink(start, {
      lookupImpl: async () => [{ address: "93.184.216.34" }],
      fetchImpl: async (url) => {
        hosts.push(url.hostname);
        return new Response(null, {
          status: 302,
          headers: { location: "http://[::ffff:169.254.169.254]/" },
        });
      },
    });
    assert.equal(blocked.ok, false, start);
    assert.match(blocked.reason, /private or reserved/u);
    assert.deepEqual(
      hosts,
      start.startsWith("https://public") ? ["public.example"] : [],
    );
  }
});

test("the link check uses HEAD, falls back to GET and caps redirects at five", async () => {
  const lookupImpl = async () => [{ address: "93.184.216.34" }];
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push([init.method, url.href, init.redirect]);
    if (url.pathname === "/start") {
      return new Response(null, {
        status: 301,
        headers: { location: "https://www.example.org/end" },
      });
    }
    return new Response(null, { status: init.method === "HEAD" ? 405 : 200 });
  };

  const result = await checkLink("https://example.com/start", {
    fetchImpl,
    lookupImpl,
  });
  assert.deepEqual(result, {
    ok: true,
    status: 200,
    method: "GET",
    redirects: 1,
    finalHost: "example.org",
  });
  assert.deepEqual(calls, [
    ["HEAD", "https://example.com/start", "manual"],
    ["HEAD", "https://www.example.org/end", "manual"],
    ["GET", "https://www.example.org/end", "manual"],
  ]);

  let hops = 0;
  const loop = await checkLink("https://example.com/0", {
    lookupImpl,
    fetchImpl: async (url) => {
      hops += 1;
      return new Response(null, {
        status: 302,
        headers: { location: `/${Number(url.pathname.slice(1)) + 1}` },
      });
    },
  });
  assert.equal(hops, 6);
  assert.deepEqual(loop, {
    ok: false,
    redirects: 5,
    reason: "more than 5 redirects",
  });

  const malformed = await checkLink("https://example.com", {
    lookupImpl,
    fetchImpl: async () =>
      new Response(null, { status: 302, headers: { location: "http://[bad" } }),
  });
  assert.deepEqual(malformed, {
    ok: false,
    redirects: 0,
    reason: "redirects to an invalid URL",
  });

  const down = await checkLink("https://example.com", {
    lookupImpl,
    fetchImpl: async () => {
      throw new Error("timeout");
    },
  });
  assert.deepEqual(down, {
    ok: false,
    redirects: 0,
    reason: "no response within 10s",
  });
});

test("the report has one marker, names duplicates with status, and never echoes form text", async () => {
  const result = await runSuggestSourceCheck(
    formBody({
      name: "@everyone <img src=x>",
      url: "https://designindex.xyz/#x",
      why: "`rm -rf` @maintainers",
    }),
    sources,
    {
      checkLink: async () => ({
        ok: true,
        status: 200,
        method: "HEAD",
        redirects: 0,
        finalHost: "designindex.xyz",
      }),
    },
  );

  assert.equal(result.applicable, true);
  assert.equal(result.report.split(COMMENT_MARKER).length, 2);
  assert.ok(result.report.startsWith(COMMENT_MARKER));
  assert.match(
    result.report,
    /\*\*Normalised URL:\*\* `https:\/\/designindex\.xyz`/u,
  );
  assert.match(
    result.report,
    /Same URL as \*\*DesignIndex\*\* \(`sources\/designindex\.yml`, archived: Off-scope: meta-directory of design resources\)/u,
  );
  assert.match(result.report, /- HTTP 200 \(HEAD\)\./u);
  assert.doesNotMatch(result.report, /@everyone|<img|rm -rf|@maintainers/u);
  assert.doesNotMatch(result.report, /accept(ed)? the source|will be added/iu);

  assert.deepEqual(
    await runSuggestSourceCheck("### Bug\n\nNot a source form", sources),
    { applicable: false },
  );
});

test("the link line tells a skipped check apart from an unreadable URL", async () => {
  const skipped = await runSuggestSourceCheck(
    formBody({ url: "https://example.com" }),
    sources,
  );
  assert.equal(skipped.link, null);
  assert.match(skipped.report, /- Not checked: the link check was skipped/u);
  assert.doesNotMatch(skipped.report, /could not be read/u);

  let called = 0;
  const invalid = await runSuggestSourceCheck(
    formBody({ url: "not a url" }),
    sources,
    {
      checkLink: async () => {
        called += 1;
        return { ok: true, status: 200, method: "HEAD", redirects: 0 };
      },
    },
  );
  assert.equal(called, 0);
  assert.match(
    invalid.report,
    /#### Link\n\n- Not checked: the URL could not be read\./u,
  );
});

test("the check reads every source file, archived ones included", async () => {
  const loaded = await loadSources(repoRoot);
  // Every source file, so later additions are covered without editing this.
  assert.ok(loaded.length >= 295);
  const archived = loaded.find((source) => source.slug === "designindex");
  assert.equal(archived.status, "archived");
  assert.match(archived.archived_reason, /\S/u);
});

test("the suggest-source workflow is safe and only comments", async () => {
  const text = await readFile(
    path.join(repoRoot, ".github/workflows/suggest-source.yml"),
    "utf8",
  );
  const workflow = parseYaml(text);

  assert.deepEqual(workflow.on, { issues: { types: ["opened", "edited"] } });
  // No default token permissions; each job asks for only what it needs.
  assert.deepEqual(workflow.permissions, {});
  assert.deepEqual(Object.keys(workflow.jobs).sort(), ["check", "comment"]);

  // The job that reads untrusted issue text and fetches the link cannot write.
  const job = workflow.jobs.check;
  assert.deepEqual(job.permissions, { contents: "read" });
  assert.match(
    job.if,
    /startsWith\(github\.event\.issue\.title, '\[Source\]'\)/u,
  );
  assert.match(job.if, /### Canonical URL/u);
  const checkout = job.steps.find((step) =>
    String(step.uses).startsWith("actions/checkout@"),
  );
  assert.equal(checkout.with["persist-credentials"], false);
  assert.equal(checkout.with.ref, undefined, "default-branch code only");

  const run = job.steps.find((step) => step.id === "check");
  assert.equal(run.run.trim(), "node web/scripts/suggest-source-check.mjs");
  assert.equal(run.env.ISSUE_BODY, "${{ github.event.issue.body }}");
  assert.equal(job.outputs.report, "${{ steps.report.outputs.report }}");

  // The job that can write runs no repository code: one github-script step.
  const comment = workflow.jobs.comment;
  assert.equal(comment.needs, "check");
  assert.deepEqual(comment.permissions, { issues: "write" });
  assert.equal(comment.steps.length, 1);
  const [post] = comment.steps;
  assert.match(String(post.uses), /^actions\/github-script@/u);
  assert.equal(post.env.REPORT, "${{ needs.check.outputs.report }}");

  // Issue text reaches code only through env, never a shell line or script.
  for (const step of [...job.steps, ...comment.steps]) {
    assert.doesNotMatch(step.run ?? "", /\$\{\{/u);
    assert.doesNotMatch(step.with?.script ?? "", /\$\{\{/u);
  }
  assert.match(post.with.script, /tessli:suggest-source-check/u);
  assert.match(post.with.script, /updateComment/u);
  assert.match(post.with.script, /createComment/u);
  assert.doesNotMatch(
    text,
    /pull_request_target|addLabels|removeLabel|issues\.update\b|state:\s*["']closed|git push|contents:\s*write/u,
  );
});
