// Rule set builder. Reads rules/<ID>.md (one rule per file, YAML frontmatter
// validated by schemas/rule.schema.json) and produces, in memory, the compact
// agent index rules/TESSLI.md and the site's web/data/rules.json. Which library
// items apply a rule is derived from the items' notes.md, never hand-kept.
// Deterministic and offline. registry-lib.mjs calls it; `npm run
// registry:check` fails on drift.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export const RULES_DIR = "rules";
export const RULE_SCHEMA_PATH = "schemas/rule.schema.json";
export const TESSLI_INDEX_FILE = "TESSLI.md";
export const TESSLI_INDEX_PATH = `${RULES_DIR}/${TESSLI_INDEX_FILE}`;
export const RULES_DATA_PATH = "web/data/rules.json";
/** Agents keep the index in context, so it must stay small. */
export const TESSLI_INDEX_MAX_BYTES = 8192;
/** Where `shadcn add online-scope-lab/tessli/rules` puts the index. */
export const TESSLI_INDEX_TARGET = "~/TESSLI.md";

/** Category order, id prefix and label. The prefix is part of every rule id. */
export const RULE_CATEGORIES = [
  { id: "hierarchy", prefix: "H", label: "Hierarchy" },
  { id: "typography", prefix: "T", label: "Typography" },
  { id: "spacing", prefix: "S", label: "Spacing and density" },
  { id: "colour", prefix: "C", label: "Colour" },
  { id: "components", prefix: "K", label: "Components" },
  { id: "copy", prefix: "W", label: "Copy" },
  { id: "states", prefix: "ST", label: "States" },
  { id: "responsive", prefix: "R", label: "Responsive" },
  { id: "motion", prefix: "M", label: "Motion" },
  { id: "accessibility", prefix: "A", label: "Accessibility" },
];

const RULE_FILE = /^([A-Z]{1,2})-(\d{2})\.md$/u;

function ruleOrder(a, b) {
  const categoryIndex = (rule) =>
    RULE_CATEGORIES.findIndex((category) => category.id === rule.category);
  return (
    categoryIndex(a) - categoryIndex(b) ||
    Number(a.id.split("-")[1]) - Number(b.id.split("-")[1])
  );
}

function schemaProblems(validate, label) {
  return (validate.errors ?? []).map(
    (error) =>
      `${label}${error.instancePath || ""} ${error.message}${
        error.keyword === "additionalProperties"
          ? `: ${error.params.additionalProperty}`
          : ""
      }`,
  );
}

/**
 * Loads and validates every rule file.
 * @param {(text: string, label: string) => {frontmatter: object, body: string}} parse
 * @returns {Promise<{rules: object[], problems: string[]}>}
 */
export async function loadRules(repoRoot, validate, parse) {
  const dir = path.join(repoRoot, RULES_DIR);
  const entries = await readdir(dir, { withFileTypes: true });
  const problems = [];
  const rules = [];
  const prefixes = new Map(RULE_CATEGORIES.map((c) => [c.id, c.prefix]));

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name === TESSLI_INDEX_FILE) continue;
    const label = `${RULES_DIR}/${entry.name}`;
    if (!entry.isFile() || !RULE_FILE.test(entry.name)) {
      problems.push(
        `${label}: unexpected entry. ${RULES_DIR}/ holds one <ID>.md file per rule (for example H-01.md) and the generated ${TESSLI_INDEX_FILE}.`,
      );
      continue;
    }
    let parsed;
    try {
      parsed = parse(await readFile(path.join(dir, entry.name), "utf8"), label);
    } catch (error) {
      if (error?.problems) {
        problems.push(...error.problems);
        continue;
      }
      throw error;
    }
    const { frontmatter, body } = parsed;
    if (!validate(frontmatter)) {
      problems.push(...schemaProblems(validate, label));
      continue;
    }
    const id = entry.name.slice(0, -3);
    if (frontmatter.id !== id) {
      problems.push(
        `${label}: id "${frontmatter.id}" must equal the file name "${id}".`,
      );
      continue;
    }
    const prefix = prefixes.get(frontmatter.category);
    if (id.split("-")[0] !== prefix) {
      problems.push(
        `${label}: a ${frontmatter.category} rule id starts with "${prefix}-".`,
      );
      continue;
    }
    rules.push({ ...frontmatter, body });
  }

  for (const field of ["title", "statement"]) {
    const seen = new Map();
    for (const rule of rules) {
      const key = rule[field].toLowerCase();
      if (seen.has(key)) {
        problems.push(
          `${RULES_DIR}/${rule.id}.md: same ${field} as ${seen.get(key)}.`,
        );
      }
      seen.set(key, rule.id);
    }
  }

  return { rules: rules.sort(ruleOrder), problems };
}

/** Every item's rule ids must exist. */
export function itemRuleProblems(items, rules, itemsDir) {
  const ids = new Set(rules.map((rule) => rule.id));
  const problems = [];
  for (const item of items) {
    for (const id of item.notes.rules) {
      if (!ids.has(id)) {
        problems.push(
          `${itemsDir}/${item.slug}/notes.md: rules lists ${id}, but ${RULES_DIR}/${id}.md does not exist.`,
        );
      }
    }
  }
  return problems;
}

/** The items that apply each rule, derived from the items' notes. */
function appliedBy(rule, items) {
  return items
    .filter((item) => item.notes.rules.includes(rule.id))
    .map((item) => ({ slug: item.slug, title: item.notes.title }))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

function reviewedCount(rules) {
  return rules.filter((rule) => rule.status === "reviewed").length;
}

/** rules/TESSLI.md: the compact index agents keep in context. */
export function tessliIndex(rules, siteOrigin) {
  const reviewed = reviewedCount(rules);
  const lines = [
    "# Tessli UI rules",
    "",
    `Tessli is an open-source UI library that ships its reasoning. These ${rules.length} rules cover structure and behaviour (hierarchy, spacing, states, copy, responsive, accessibility), not a visual style: keep your project's own theme.`,
    `Status: every rule is a draft until a maintainer signs it; ${reviewed} of ${rules.length} reviewed. Reasons and sources for each: ${siteOrigin}/rules`,
    "Use: read this before building UI. Then render at 1440, 768 and 390 px (and 320 px for overflow) and verify each rule's check.",
    "Format: `ID rule | how to check`. Generated from rules/*.md; edit those, not this file.",
  ];
  for (const category of RULE_CATEGORIES) {
    const inCategory = rules.filter((rule) => rule.category === category.id);
    if (!inCategory.length) continue;
    lines.push("", `## ${category.label}`, "");
    for (const rule of inCategory) {
      lines.push(`- ${rule.id} ${rule.statement} | ${rule.check}`);
    }
  }
  return `${lines.join("\n")}\n`;
}

/**
 * web/data/rules.json: every rule with the items that apply it, plus the
 * TESSLI.md text the site serves at /rules/TESSLI.md.
 */
export function rulesData(rules, items, index) {
  return {
    version: 1,
    generatedBy: "web/scripts/build-registry.mjs",
    indexPath: TESSLI_INDEX_PATH,
    categories: RULE_CATEGORIES,
    rules: rules.map((rule) => ({ ...rule, items: appliedBy(rule, items) })),
    index,
  };
}

/** The shadcn registry:file item that installs TESSLI.md into a project. */
export function rulesRegistryItem(rules, siteOrigin) {
  return {
    name: "rules",
    type: "registry:file",
    title: "Tessli UI rules (TESSLI.md)",
    description: `A compact index of Tessli's ${rules.length} UI rules (drafts until a maintainer signs them), installed as TESSLI.md at the project root for coding agents to read.`,
    files: [
      {
        path: TESSLI_INDEX_PATH,
        type: "registry:file",
        target: TESSLI_INDEX_TARGET,
      },
    ],
    docs: `Every rule with its reasons, checks and sources: ${siteOrigin}/rules`,
  };
}
