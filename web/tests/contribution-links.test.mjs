// Every link a contributor follows from /contribute, CONTRIBUTING.md, the
// README, the docs index, the GitHub templates and the contributor drafts in
// docs/v1.2 must land on something that exists in this repository: a file or
// folder, a heading anchor, or an issue form.
import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { repositoryUrl } from "../lib/repository.ts";

const webRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const repoRoot = path.resolve(webRoot, "..");
const REPO_URL = /^https:\/\/github\.com\/Online-Scope-Lab\/tessli(?=[/?#]|$)/u;
/** Repository pages that are not files: the repo itself and GitHub views. */
const GITHUB_VIEWS = new Set(["", "/contribute", "/issues", "/pulls", ".git"]);

async function exists(relativePath) {
  try {
    await stat(path.join(repoRoot, relativePath));
    return true;
  } catch {
    return false;
  }
}

/** GitHub's heading anchor: lowercase, punctuation dropped, spaces to hyphens. */
function anchorFor(heading) {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .replace(/\s/gu, "-");
}

async function anchors(relativePath) {
  const text = await readFile(path.join(repoRoot, relativePath), "utf8");
  return new Set(
    withoutCodeBlocks(text)
      .split("\n")
      .map((line) => /^#{1,6}\s+(.+?)\s*$/u.exec(line)?.[1])
      .filter(Boolean)
      .map(anchorFor),
  );
}

function withoutCodeBlocks(text) {
  return text.replace(/^```[\s\S]*?^```/gmu, "");
}

/**
 * Checks one link target found in `from` (a repo-relative file). Returns a
 * problem string, or null when the target exists. External sites are skipped.
 */
async function problemWith(target, from) {
  let file;
  let anchor;
  if (target.startsWith("#")) {
    file = from;
    anchor = target.slice(1);
  } else if (REPO_URL.test(target)) {
    const rest = target.replace(REPO_URL, "");
    const issueForm = /^\/issues\/new\?template=([\w.-]+)$/u.exec(rest);
    if (issueForm) {
      return (await exists(`.github/ISSUE_TEMPLATE/${issueForm[1]}`))
        ? null
        : `${from}: ${target} opens a missing issue form`;
    }
    const blob = /^\/(?:blob|tree)\/main\/([^#?]*)(?:#(.+))?$/u.exec(rest);
    if (!blob) {
      return GITHUB_VIEWS.has(rest) || /^\/issues\?q=[^#\s]+$/u.test(rest)
        ? null
        : `${from}: ${target} is not a known repository page`;
    }
    file = decodeURIComponent(blob[1]).replace(/\/$/u, "");
    anchor = blob[2];
  } else if (/^[a-z][a-z0-9+.-]*:/iu.test(target)) {
    return null; // another site, or mailto:
  } else {
    const [relative, hash] = target.split("#");
    file = path
      .normalize(path.join(path.dirname(from), decodeURIComponent(relative)))
      .replace(/\/$/u, "");
    anchor = hash;
  }

  if (!(await exists(file))) return `${from}: ${target} → ${file} is missing`;
  if (anchor && file.endsWith(".md")) {
    if (!(await anchors(file)).has(anchor)) {
      return `${from}: ${target} → no heading #${anchor} in ${file}`;
    }
  }
  return null;
}

/** Link targets in Markdown: [text](target), <https://…> and bare repo URLs. */
function markdownTargets(text) {
  const prose = withoutCodeBlocks(text).replace(/`[^`\n]*`/gu, "");
  const targets = new Set();
  for (const match of prose.matchAll(/\]\(([^)\s]+)\)/gu))
    targets.add(match[1]);
  for (const match of prose.matchAll(/<(https?:\/\/[^>\s]+)>/gu))
    targets.add(match[1]);
  for (const match of prose.matchAll(
    /https:\/\/github\.com\/Online-Scope-Lab\/tessli[^\s)>"'`,]*/gu,
  ))
    targets.add(match[0].replace(/[.:;]$/u, ""));
  return [...targets];
}

async function problemsIn(relativePath, targets) {
  const problems = [];
  for (const target of targets) {
    const problem = await problemWith(target, relativePath);
    if (problem) problems.push(problem);
  }
  return problems;
}

const MARKDOWN_FILES = [
  "CONTRIBUTING.md",
  "README.md",
  "docs/README.md",
  ".github/PULL_REQUEST_TEMPLATE.md",
  "docs/v1.2/good-first-issues.md",
  "docs/v1.2/shadcn-directory-listing.md",
];

test("every repository link in the contributor documents resolves", async () => {
  const problems = [];
  let checked = 0;
  for (const file of MARKDOWN_FILES) {
    const targets = markdownTargets(
      await readFile(path.join(repoRoot, file), "utf8"),
    );
    checked += targets.length;
    problems.push(...(await problemsIn(file, targets)));
  }
  assert.ok(checked > 50, `checked ${checked} links`);
  assert.deepEqual(problems, []);
});

test("every repository path CONTRIBUTING.md names in code resolves", async () => {
  const text = await readFile(path.join(repoRoot, "CONTRIBUTING.md"), "utf8");
  const paths = [...text.matchAll(/`([^`\n]+)`/gu)]
    .map((match) => match[1])
    .filter((value) =>
      /^(?:\.github|web|schemas|rules|sources|docs|lib_data|skills)\/[\w./-]*$/u.test(
        value,
      ),
    )
    // Test output, created by `npm run test:items`, is not committed.
    .filter((value) => !value.startsWith("web/artifacts/"));
  assert.ok(paths.length > 10, `checked ${paths.length} paths`);
  const missing = [];
  for (const value of paths) {
    if (!(await exists(value))) missing.push(value);
  }
  assert.deepEqual(missing, []);
});

test("the GitHub issue forms' own links resolve", async () => {
  const dir = ".github/ISSUE_TEMPLATE";
  const problems = [];
  for (const name of (await readdir(path.join(repoRoot, dir))).sort()) {
    const file = `${dir}/${name}`;
    const text = await readFile(path.join(repoRoot, file), "utf8");
    problems.push(...(await problemsIn(file, markdownTargets(text))));
  }
  assert.deepEqual(problems, []);
});

test("every link on /contribute resolves", async () => {
  const page = await readFile(
    path.join(webRoot, "app/(site)/contribute/page.tsx"),
    "utf8",
  );
  const targets = [];
  for (const match of page.matchAll(/issueFormUrl\("([^"]+)"\)/gu)) {
    targets.push(`${repositoryUrl}/issues/new?template=${match[1]}`);
  }
  for (const match of page.matchAll(
    /repositoryFileUrl\(\s*"([^"]+)"(?:,\s*"([^"]+)")?\s*\)/gu,
  )) {
    targets.push(
      `${repositoryUrl}/blob/main/${match[1]}${match[2] ? `#${match[2]}` : ""}`,
    );
  }
  assert.ok(targets.length >= 9, `found ${targets.length} links`);
  assert.deepEqual(
    await problemsIn("web/app/(site)/contribute/page.tsx", targets),
    [],
  );
  // The other two links are the repository and its good-first-issue list.
  assert.match(page, /href=\{repositoryUrl\}/u);
  assert.match(page, /href: goodFirstIssuesUrl/u);
});

test("the anchor helper matches GitHub's heading anchors", () => {
  assert.equal(anchorFor("Sign-off (DCO)"), "sign-off-dco");
  assert.equal(anchorFor("Contribute an item"), "contribute-an-item");
  assert.equal(anchorFor("Review dimensions"), "review-dimensions");
});
