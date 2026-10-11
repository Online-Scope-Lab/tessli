import rulesData from "../data/rules.json" with { type: "json" };

import { installCommand } from "./library";

/** One rule: the validated frontmatter of rules/<ID>.md plus derived items. */
export type Rule = Readonly<{
  id: string;
  category: string;
  title: string;
  statement: string;
  why: string;
  check: string;
  anti_pattern: string;
  status: "draft" | "reviewed";
  reviewed_by: readonly string[];
  reviewed_at: string | null;
  sources: readonly string[];
  /** Optional prose after the frontmatter, as Markdown paragraphs. */
  body: string;
  /** Library items whose notes list this rule; derived at build time. */
  items: readonly Readonly<{ slug: string; title: string }>[];
}>;

export type RuleCategory = Readonly<{
  id: string;
  prefix: string;
  label: string;
}>;

const rules = rulesData.rules as unknown as readonly Rule[];
const categories = rulesData.categories as readonly RuleCategory[];
const byId = new Map(rules.map((rule) => [rule.id, rule]));

/** Every rule, in category order. */
export function getRules(): readonly Rule[] {
  return rules;
}

export function getRule(id: string): Rule | undefined {
  return byId.get(id);
}

/** Categories with their rules, in order; empty categories are left out. */
export function getRulesByCategory(): readonly Readonly<{
  category: RuleCategory;
  rules: readonly Rule[];
}>[] {
  return categories
    .map((category) => ({
      category,
      rules: rules.filter((rule) => rule.category === category.id),
    }))
    .filter((group) => group.rules.length > 0);
}

export function ruleCategoryLabel(id: string): string {
  return categories.find((category) => category.id === id)?.label ?? id;
}

/** The compact agent index (rules/TESSLI.md), served at /rules/TESSLI.md. */
export function getRulesIndex(): string {
  return rulesData.index;
}

export const RULES_INDEX_PATH = "/rules/TESSLI.md";

/** `npx shadcn@latest add online-scope-lab/tessli/rules` */
export function rulesInstallCommand(): string {
  return installCommand("rules");
}

/** Honest review status for display. */
export function ruleStatusText(rule: Rule): string {
  if (rule.status === "reviewed" && rule.reviewed_at) {
    return `Reviewed by ${rule.reviewed_by
      .map((handle) => `@${handle}`)
      .join(", ")} on ${rule.reviewed_at}`;
  }
  return "Draft — not yet reviewed by a maintainer";
}
