import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { issueFormUrl, repositoryFileUrl } from "../lib/repository.ts";

const currentFile = fileURLToPath(import.meta.url);
const webRoot = path.resolve(path.dirname(currentFile), "..");
const repoRoot = path.resolve(webRoot, "..");

async function read(relativePath) {
  return readFile(path.join(webRoot, relativePath), "utf8");
}

test("GitHub helpers build the exact issue-form and file URLs", () => {
  assert.equal(
    issueFormUrl("suggest-source.yml"),
    "https://github.com/Online-Scope-Lab/tessli/issues/new?template=suggest-source.yml",
  );
  assert.equal(
    issueFormUrl("submit-design.yml"),
    "https://github.com/Online-Scope-Lab/tessli/issues/new?template=submit-design.yml",
  );
  assert.equal(
    issueFormUrl("report-source.yml"),
    "https://github.com/Online-Scope-Lab/tessli/issues/new?template=report-source.yml",
  );
  assert.equal(
    issueFormUrl("bug.yml"),
    "https://github.com/Online-Scope-Lab/tessli/issues/new?template=bug.yml",
  );
  assert.equal(
    repositoryFileUrl("CONTRIBUTING.md", "contribute-an-item"),
    "https://github.com/Online-Scope-Lab/tessli/blob/main/CONTRIBUTING.md#contribute-an-item",
  );
  assert.equal(
    repositoryFileUrl("web/registry/_template"),
    "https://github.com/Online-Scope-Lab/tessli/tree/main/web/registry/_template",
  );
});

test("every linked issue form, document, anchor and template exists in the repository", async () => {
  for (const template of [
    "suggest-source.yml",
    "submit-design.yml",
    "report-source.yml",
    "bug.yml",
  ]) {
    await readFile(path.join(repoRoot, ".github/ISSUE_TEMPLATE", template));
  }
  const contributing = await readFile(
    path.join(repoRoot, "CONTRIBUTING.md"),
    "utf8",
  );
  assert.match(contributing, /^### Contribute an item$/m);
  for (const file of [
    "CODE_OF_CONDUCT.md",
    "TRADEMARKS.md",
    "web/registry/_template/notes.md",
  ]) {
    await readFile(path.join(repoRoot, file));
  }
});

test("/contribute offers four GitHub paths and no in-site form", async () => {
  const page = await read("app/(site)/contribute/page.tsx");

  for (const [title, call] of [
    ["Suggest a source", 'issueFormUrl("suggest-source.yml")'],
    ["Submit a design", 'issueFormUrl("submit-design.yml")'],
    [
      "Contribute an item",
      'repositoryFileUrl("CONTRIBUTING.md", "contribute-an-item")',
    ],
    ["Contribute an item", 'repositoryFileUrl("web/registry/_template")'],
    ["Report a problem", 'issueFormUrl("report-source.yml")'],
    ["Report a problem", 'issueFormUrl("bug.yml")'],
  ]) {
    assert.ok(page.includes(`title: "${title}"`), title);
    assert.ok(page.includes(call), call);
  }
  assert.match(page, /id="main-content"/);
  assert.match(page, /<h1>/);
  assert.doesNotMatch(page, /<form|fetch\(|action=|localStorage/);
});

test("/contribute summarises the contribution rules honestly", async () => {
  const page = await read("app/(site)/contribute/page.tsx");

  assert.match(page, /Original work only\./);
  assert.match(page, /Tailwind Plus or shadcnblocks/);
  assert.match(page, /Disclose AI assistance\./);
  assert.match(page, /No invented proof\./);
  assert.match(page, /Developer Certificate of Origin/);
  assert.match(page, /git commit -s/);
  assert.match(page, /MIT licence/);
  assert.doesNotMatch(page, /improves? AI output|gives? AI taste|→/i);
});
