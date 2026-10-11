// Walks the contribution paths the way a first-time contributor does and checks
// that every mistake they are likely to make gets a message that says what to
// change. Item paths (submit a design → build it, contribute an item) copy
// web/registry/_template into a temporary checkout and run the real registry
// build; the source path validates CONTRIBUTING.md's own example file.
import assert from "node:assert/strict";
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, test } from "node:test";

import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

import {
  CATALOGUE_FIX_GUIDE,
  composeCatalogue,
} from "../scripts/catalogue-lib.mjs";
import {
  buildRegistry,
  FIX_GUIDE,
  parseNotes,
  REPO_ROOT,
  RegistryError,
} from "../scripts/registry-lib.mjs";
import {
  ADD_SOURCE_GUIDE_URL,
  runSuggestSourceCheck,
} from "../scripts/suggest-source-check.mjs";

const SLUG = "order-summary";
const ITEM_DIR = `web/registry/items/${SLUG}`;
const temporaryRoots = [];

after(async () => {
  for (const root of temporaryRoots) {
    await rm(root, { recursive: true, force: true });
  }
});

/**
 * A minimal checkout: the real schemas, rules, template, shadcn primitives and
 * web/package.json, with web/registry/items/ holding only a fresh copy of the
 * template, exactly as CONTRIBUTING.md step 1 makes it.
 */
async function checkoutWithTemplateCopy() {
  const root = await mkdtemp(path.join(tmpdir(), "tessli-contributor-"));
  temporaryRoots.push(root);
  await mkdir(path.join(root, "web/registry/items"), { recursive: true });
  for (const shared of [
    "schemas",
    "rules",
    "web/registry/_template",
    "web/registry/shadcn",
  ]) {
    await symlink(path.join(REPO_ROOT, shared), path.join(root, shared));
  }
  await cp(
    path.join(REPO_ROOT, "web/package.json"),
    path.join(root, "web/package.json"),
  );
  await cp(
    path.join(REPO_ROOT, "web/registry/_template"),
    path.join(root, ITEM_DIR),
    { recursive: true },
  );
  return root;
}

async function buildProblems(root) {
  try {
    await buildRegistry({ repoRoot: root });
  } catch (error) {
    assert.ok(error instanceof RegistryError, String(error));
    return error.problems;
  }
  return [];
}

function assertProblem(problems, pattern) {
  assert.ok(
    problems.some((problem) => pattern.test(problem)),
    `expected a problem matching ${pattern}, got:\n${problems.join("\n")}`,
  );
}

/** Renames the item file and its imports, as CONTRIBUTING.md step 2 says. */
async function renameItemFile(root) {
  const dir = path.join(root, ITEM_DIR);
  await rename(
    path.join(dir, "example-item.tsx"),
    path.join(dir, `${SLUG}.tsx`),
  );
  for (const file of ["demo.tsx", "states.tsx"]) {
    const text = await readFile(path.join(dir, file), "utf8");
    await writeFile(
      path.join(dir, file),
      text.replaceAll('"./example-item"', `"./${SLUG}"`),
    );
  }
}

async function writeNotes(root, change) {
  const file = path.join(root, ITEM_DIR, "notes.md");
  const { frontmatter, body } = parseNotes(
    await readFile(file, "utf8"),
    "notes",
  );
  const next = change({ frontmatter: structuredClone(frontmatter), body });
  await writeFile(
    file,
    `---\n${stringifyYaml(next.frontmatter)}---\n\n${next.body}\n`,
  );
}

/** Notes a contributor has actually filled in, for an order summary. */
function filledIn({ frontmatter }) {
  return {
    frontmatter: {
      ...frontmatter,
      id: SLUG,
      kind: "component",
      category: "forms",
      title: "Order summary that shows the total before payment",
      summary:
        "Shows line items, discounts, tax and the total a buyer will pay, before they enter card details.",
      use_when: ["A checkout collects payment on the same page."],
      avoid_when: ["The price is not final until after payment."],
      ai_default:
        "A card with a bold total, a coupon field and no tax or shipping until the last step.",
      why_this_is_better: ["Every amount that makes up the total is visible."],
      failures: ["Hiding shipping until after the card form."],
      responsive: {
        desktop: "A column beside the payment form.",
        mobile: "A collapsed summary above the form that expands in place.",
      },
      a11y: ["Amounts are text in a description list, not only colour."],
      contributors: ["octocat"],
    },
    body: "A checkout loses trust when the total changes at the last step.",
  };
}

test("a template copied as-is is rejected with the rename step to do", async () => {
  const root = await checkoutWithTemplateCopy();
  const problems = await buildProblems(root);

  assertProblem(
    problems,
    new RegExp(
      `${ITEM_DIR}: missing ${SLUG}\\.tsx\\. Rename example-item\\.tsx to ${SLUG}\\.tsx and update the "\\./example-item" imports in demo\\.tsx and states\\.tsx\\.`,
    ),
  );
  // The kept template file is explained by that message, not reported twice.
  assert.ok(!problems.some((problem) => /unexpected file/.test(problem)));
});

test("unfilled template notes are named field by field", async () => {
  const root = await checkoutWithTemplateCopy();
  await renameItemFile(root);
  const problems = await buildProblems(root);

  assertProblem(
    problems,
    /notes\.md: id "example-item" must equal the folder name "order-summary"; set `id: order-summary`\./,
  );
  for (const field of [
    "title",
    "summary",
    "use_when",
    "avoid_when",
    "ai_default",
    "why_this_is_better",
    "failures",
    "a11y",
    "responsive.desktop",
    "responsive.mobile",
  ]) {
    assertProblem(
      problems,
      new RegExp(
        `notes\\.md: \`${field.replace(".", "\\.")}\` still has the template's example text; describe this item\\.`,
      ),
    );
  }
  assertProblem(
    problems,
    /`contributors` still lists the placeholder "your-github-handle"; put your GitHub handle/,
  );
  assertProblem(
    problems,
    /the prose after the frontmatter is still the template's/,
  );
});

test("missing and invalid fields say what to write instead", async () => {
  const root = await checkoutWithTemplateCopy();
  await renameItemFile(root);
  await writeNotes(root, (notes) => {
    const next = filledIn(notes);
    delete next.frontmatter.summary;
    delete next.frontmatter.use_when;
    next.frontmatter.kind = "widget";
    next.frontmatter.titel = "Typo";
    next.frontmatter.rules = ["H-01"];
    next.frontmatter.reviewed_by = ["octocat"];
    next.frontmatter.reviewed_at = "2026-10-11";
    return next;
  });
  const problems = await buildProblems(root);
  const label = `${ITEM_DIR}/notes.md`;

  assertProblem(
    problems,
    new RegExp(`^${label}: missing the required field \`summary\`\\. `),
  );
  assertProblem(
    problems,
    new RegExp(`^${label}: missing the required field \`use_when\`\\.`),
  );
  assertProblem(
    problems,
    /`kind` is "widget"; use one of: `component`, `section`, `page`\./,
  );
  assertProblem(
    problems,
    /unknown field `titel`\. Check its spelling; schemas\/library-item\.schema\.json lists every allowed field\./,
  );
  assertProblem(
    problems,
    /`rules` lists 1 entry; it needs 3–8\. List 3–8 existing rule ids/,
  );
  assertProblem(
    problems,
    /`reviewed_by` lists 1 entry; it needs none\. Contributors leave `status: community`, `reviewed_by: \[\]` and `reviewed_at: null`; only a maintainer signs/,
  );
  assertProblem(
    problems,
    /`reviewed_at` must be null, not "2026-10-11"\. Contributors leave/,
  );
  // Messages are plain sentences, never raw ajv output.
  for (const problem of problems) {
    assert.doesNotMatch(
      problem,
      /must NOT have|must match "else"|\/notes\.md\//,
    );
  }
});

test("states, rules and imports that do not line up are explained", async () => {
  const root = await checkoutWithTemplateCopy();
  await renameItemFile(root);
  await writeNotes(root, (notes) => {
    const next = filledIn(notes);
    next.frontmatter.states = ["default", "empty", "error"];
    next.frontmatter.rules = ["H-01", "W-02", "Z-99"];
    return next;
  });
  const itemFile = path.join(root, ITEM_DIR, `${SLUG}.tsx`);
  await writeFile(
    itemFile,
    `import { Stepper } from "@/registry/shadcn/ui/stepper";\nimport confetti from "canvas-confetti";\n${await readFile(itemFile, "utf8")}`,
  );
  const problems = await buildProblems(root);

  assertProblem(
    problems,
    /states\.tsx: exports states \[empty\], but notes\.md lists \[empty, error\] after the first state\. Make the `states` keys/,
  );
  assertProblem(
    problems,
    /rules lists Z-99, but rules\/Z-99\.md does not exist\. Use an id from rules\/TESSLI\.md\./,
  );
  assertProblem(
    problems,
    /web\/registry\/shadcn\/ui\/stepper\.tsx is not vendored\. Copy the primitive from shadcn\/ui/,
  );
  assertProblem(
    problems,
    /imports the package canvas-confetti, which is not a dependency of web\/package\.json\. Use what web\/package\.json already has, or add canvas-confetti there with a one-line reason/,
  );
});

test("a filled-in copy of the template builds into an installable item", async () => {
  const root = await checkoutWithTemplateCopy();
  await renameItemFile(root);
  await writeNotes(root, filledIn);
  const { files, items } = await buildRegistry({ repoRoot: root });

  assert.deepEqual(
    items.map((item) => item.slug),
    [SLUG],
  );
  const published = JSON.parse(files.get(`web/public/r/${SLUG}.json`));
  assert.equal(published.name, SLUG);
  assert.equal(published.meta.tessli.status, "community");
  assert.deepEqual(published.meta.tessli.contributors, ["octocat"]);
  const index = JSON.parse(files.get("web/public/r/registry.json"));
  assert.deepEqual(
    index.items.map((item) => item.name),
    [SLUG, "rules"],
  );
  assert.deepEqual(index, JSON.parse(files.get("registry.json")));
});

test("the registry and catalogue CLIs point a contributor at the fix", () => {
  const guide = FIX_GUIDE.join("\n");
  assert.match(guide, /npm run registry:build/);
  assert.match(guide, /schemas\/library-item\.schema\.json/);
  assert.match(guide, /CONTRIBUTING\.md, "Contribute an item"/);
  const catalogueGuide = CATALOGUE_FIX_GUIDE.join("\n");
  assert.match(catalogueGuide, /npm run catalogue:generate/);
  assert.match(catalogueGuide, /schemas\/source\.schema\.json/);
  assert.match(catalogueGuide, /CONTRIBUTING\.md, "Add a source"/);
});

async function contributingSourceExample() {
  const contributing = await readFile(
    path.join(REPO_ROOT, "CONTRIBUTING.md"),
    "utf8",
  );
  const section = contributing.slice(contributing.indexOf("### Add a source"));
  const block = /```yaml\n([\s\S]*?)```/u.exec(section);
  assert.ok(block, "CONTRIBUTING.md shows an example source file");
  return block[1];
}

async function composeOne(text, name = "example-patterns.yml") {
  const read = async (file) =>
    JSON.parse(await readFile(path.join(REPO_ROOT, file), "utf8"));
  return composeCatalogue([{ name, text }], {
    sourceSchema: await read("schemas/source.schema.json"),
    catalogueSchema: await read("schemas/catalogue.schema.json"),
  });
}

test("CONTRIBUTING.md's example source file is valid as written", async () => {
  const example = await contributingSourceExample();
  const result = await composeOne(example);
  assert.deepEqual(result.report.issues.errors, []);
  assert.equal(result.catalogue.resources.length, 1);
  const summary = parseYaml(example).summary;
  assert.ok(summary.length >= 40 && summary.length <= 200, summary);
});

test("source mistakes say which field to fix and how", async () => {
  const example = parseYaml(await contributingSourceExample());
  const messages = async (changes, name) => {
    const result = await composeOne(
      stringifyYaml({ ...example, ...changes }),
      name,
    );
    return result.report.issues.errors.map((error) => error.message);
  };

  assertProblem(
    await messages({ category: "colour" }),
    /sources\/example-patterns\.yml: category "colour" is not a Tessli category; use one of: website-inspiration, .*color-accessibility/,
  );
  assertProblem(
    await messages({}, "example.yml"),
    /slug "example-patterns" must equal the file name "example"; rename the file or fix the slug\./,
  );
  assertProblem(
    await messages({ access: "free-tier" }),
    /`access` is "free-tier"; use one of: `free`, `open-source`, `freemium`, `paid`, `free-trial`\./,
  );
  assertProblem(
    await messages({ added_at: "11/10/2026" }),
    /`added_at` is "11\/10\/2026"; write a real date as YYYY-MM-DD/,
  );
  assertProblem(
    await messages({ status: "archived" }),
    /missing the required field `archived_reason`\. An archived source needs `archived_reason`/,
  );
  assertProblem(
    await messages({ replaced_by: "land-book" }),
    /`archived_reason` and `replaced_by` are only for `status: archived`/,
  );
});

test("the suggest-source comment links the one-file guide", async () => {
  assert.equal(
    ADD_SOURCE_GUIDE_URL,
    "https://github.com/Online-Scope-Lab/tessli/blob/main/CONTRIBUTING.md#add-a-source",
  );
  const body = [
    ["Source name", "Example Patterns"],
    ["Canonical URL", "https://example-patterns.example"],
    ["Category", "Design systems and pattern libraries"],
    ["What kind of source is it?", "Reference guide"],
    ["Access model", "Free"],
    [
      "What will someone find there?",
      "Side-by-side examples of common interface patterns, each linked to its source.",
    ],
    ["Why include it?", "Complements Component Gallery."],
    ["Your relationship to this source", "No affiliation"],
    ["Before submitting", "- [x] a\n- [x] b\n- [x] c\n- [x] d"],
  ]
    .map(([label, value]) => `### ${label}\n\n${value}`)
    .join("\n\n");
  const { report } = await runSuggestSourceCheck(body, []);
  assert.match(report, /#### If a maintainer accepts it/);
  assert.ok(report.includes(`[Add a source](${ADD_SOURCE_GUIDE_URL})`));
  assert.match(report, /`category: design-systems`, `access: free`/);
});

test("CI is safe for pull requests from forks", async () => {
  const text = await readFile(
    path.join(REPO_ROOT, ".github/workflows/ci.yml"),
    "utf8",
  );
  const workflow = parseYaml(text);

  assert.deepEqual(Object.keys(workflow.on).sort(), ["pull_request", "push"]);
  assert.deepEqual(workflow.permissions, { contents: "read" });
  for (const job of Object.values(workflow.jobs)) {
    assert.equal(job.permissions, undefined, "no job widens the token");
    const checkout = job.steps.find((step) =>
      String(step.uses).startsWith("actions/checkout@"),
    );
    assert.equal(checkout.with?.["persist-credentials"], false);
  }
  // A fork's pull request gets no secrets and a read-only token; CI needs
  // neither. Comments may name what is avoided; the steps must not use it.
  const code = text
    .split("\n")
    .filter((line) => !/^\s*#/u.test(line))
    .join("\n");
  assert.doesNotMatch(
    code,
    /secrets\.|pull_request_target|github\.token|GITHUB_TOKEN|gh (?:pr|issue|api)/u,
  );
});
