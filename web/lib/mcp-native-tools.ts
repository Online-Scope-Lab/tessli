import library from "../data/library.json" with { type: "json" };
import {
  getLibraryItem,
  getLibraryItems,
  installCommand,
  libraryCategoryLabel,
  type LibraryItem,
} from "./library.ts";
import {
  createPublicLibraryItemRepresentation,
  createPublicSourceRepresentation,
} from "./public-representations.mjs";
import {
  getRules,
  getRulesIndex,
  RULES_INDEX_PATH,
  ruleCategoryLabel,
  rulesInstallCommand,
  type Rule,
} from "./rules.ts";
import { getSimilarSourceProfiles } from "./similar-sources.ts";
import { getSourceProfile, type SourceProfile } from "./source-profiles.ts";
import {
  retrieveTaskSources,
  TaskRetrievalInputError,
  type TaskRetrievalInput,
} from "./task-retrieval.ts";

/**
 * The five read-only tools of the local Tessli MCP server (plan §6.6). Every
 * tool reads the committed JSON the website reads (data/library.json,
 * data/rules.json, data/catalogue.json); none fetches, writes or keeps state.
 */

export const NATIVE_MCP_LIMITS = Object.freeze({
  /** search_items: default and maximum number of items returned. */
  items: 5,
  maxItems: 12,
  /** get_rules: maximum rules returned for a brief or explicit ids. */
  rules: 12,
  /** get_item: maximum characters of one code file before it is cut. */
  itemFileCharacters: 40_000,
});

export class NativeMcpInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativeMcpInputError";
  }
}

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "build",
  "by",
  "for",
  "from",
  "i",
  "in",
  "into",
  "is",
  "it",
  "make",
  "me",
  "my",
  "need",
  "of",
  "on",
  "or",
  "our",
  "that",
  "the",
  "this",
  "to",
  "ui",
  "use",
  "we",
  "with",
]);

function normalizeText(value: string): string {
  return value
    .toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/**
 * Splits a brief into search terms: lower-case words of two or more
 * characters without stop words, with a trailing plural "s" dropped so
 * "tables" matches "table" (terms match at the start of a word).
 */
export function toSearchTerms(brief: string): readonly string[] {
  const terms = normalizeText(brief)
    .split(" ")
    .filter((term) => term.length > 1 && !STOP_WORDS.has(term))
    .map((term) =>
      term.length > 3 && term.endsWith("s") && !term.endsWith("ss")
        ? term.slice(0, -1)
        : term,
    );
  return Array.from(new Set(terms));
}

type SearchField = Readonly<{
  label: string;
  weight: number;
  text: string;
}>;

function field(
  label: string,
  weight: number,
  values: readonly (string | null | undefined)[],
): SearchField {
  return {
    label,
    weight,
    text: ` ${normalizeText(values.filter(Boolean).join(" "))} `,
  };
}

/**
 * Deterministic keyword score: each term counts once, in the first field
 * (fields are listed heaviest first) where a word starts with it. Returns
 * the score and the matched term and field pairs.
 */
function scoreFields(
  fields: readonly SearchField[],
  terms: readonly string[],
): { score: number; matched: readonly string[] } {
  let score = 0;
  const matched: string[] = [];
  for (const term of terms) {
    const hit = fields.find((candidate) => candidate.text.includes(` ${term}`));
    if (!hit) continue;
    score += hit.weight;
    const reason = `${term} (${hit.label})`;
    if (!matched.includes(reason)) matched.push(reason);
  }
  return { score, matched };
}

/**
 * Keeps candidates that score at least a third of the best score, so a
 * brief that clearly names one thing does not trail a list of incidental
 * one-word matches. Order: score, then the tie-breaker key.
 */
function rankCandidates<T extends { score: number; key: string }>(
  candidates: readonly T[],
): readonly T[] {
  const matching = candidates.filter((candidate) => candidate.score > 0);
  const top = Math.max(0, ...matching.map((candidate) => candidate.score));
  return matching
    .filter((candidate) => candidate.score * 3 >= top)
    .sort(
      (left, right) =>
        right.score - left.score || compareText(left.key, right.key),
    );
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

/* ------------------------------------------------------------------ items */

const ruleById = new Map(getRules().map((rule) => [rule.id, rule]));

function itemFields(item: LibraryItem): readonly SearchField[] {
  const notes = item.notes;
  return [
    field("title", 10, [item.slug, notes.title]),
    field("category", 8, [
      notes.category,
      libraryCategoryLabel(notes.category),
    ]),
    field("kind", 6, [notes.kind]),
    field("summary", 5, [notes.summary]),
    field("use when", 4, notes.use_when),
    field("common default", 3, [notes.ai_default, ...notes.failures]),
    field("why it is better", 2, notes.why_this_is_better),
    field(
      "rules",
      2,
      notes.rules.map((id) => ruleById.get(id)?.title),
    ),
    field("notes", 1, [
      item.body,
      notes.responsive.desktop,
      notes.responsive.mobile,
      ...notes.a11y,
      ...notes.states,
    ]),
  ];
}

const itemSearchIndex = getLibraryItems().map((item) => ({
  item,
  fields: itemFields(item),
}));

function toItemSummary(item: LibraryItem, matched: readonly string[]) {
  const notes = item.notes;
  return {
    slug: item.slug,
    title: notes.title,
    kind: notes.kind,
    category: notes.category,
    summary: notes.summary,
    status: notes.status,
    rules: [...notes.rules],
    install: installCommand(item.slug),
    matched,
  };
}

/**
 * search_items: ranks library items for a brief by keyword matches over the
 * items' notes (title, category, kind, summary, use-when, the default each
 * replaces, applied rules, prose); weak incidental matches are dropped. No
 * embeddings and no network: the same brief always returns the same order
 * (score, then slug).
 */
export function searchNativeItems(
  brief: string,
  limit: number = NATIVE_MCP_LIMITS.items,
) {
  const boundedLimit = requireIntegerInRange(
    limit,
    1,
    NATIVE_MCP_LIMITS.maxItems,
    "limit",
  );
  const terms = toSearchTerms(brief);
  const ranked = rankCandidates(
    itemSearchIndex.map(({ item, fields }) => ({
      item,
      key: item.slug,
      ...scoreFields(fields, terms),
    })),
  );

  return {
    brief: brief.trim(),
    terms,
    matchCount: ranked.length,
    items: ranked
      .slice(0, boundedLimit)
      .map(({ item, matched }) => toItemSummary(item, matched)),
    ...(ranked.length === 0
      ? {
          hint: "No item matched. Try the kind of screen or section (pricing, settings, table, empty state) or browse /library.",
          categories: Array.from(
            new Set(getLibraryItems().map((item) => item.notes.category)),
          ).sort(compareText),
        }
      : {}),
    boundary:
      "Ranking is deterministic keyword matching over the items' recorded notes. Items with status community have not been reviewed by a maintainer.",
  };
}

/**
 * get_item: the same document as /library/<slug>/item.json — the code file,
 * the full notes (meta.tessli in registry.json), the applied rules with their
 * statements, and the install command.
 */
export function getNativeItem(slug: string) {
  const normalized = slug.trim();
  const item = getLibraryItem(normalized);
  if (!item) {
    throw new NativeMcpInputError(
      `Unknown Tessli library item: ${normalized || "(blank)"}. Use search_items to find item slugs.`,
    );
  }
  const document = createPublicLibraryItemRepresentation(
    item,
    library.installPrefix,
    getRules(),
  );
  const code = document.item.source.code;
  if (code.length <= NATIVE_MCP_LIMITS.itemFileCharacters) return document;
  return {
    ...document,
    item: {
      ...document.item,
      source: {
        ...document.item.source,
        code: code.slice(0, NATIVE_MCP_LIMITS.itemFileCharacters),
        truncated: true,
        fullCode: document.representations.json,
      },
    },
  };
}

/* ------------------------------------------------------------------ rules */

const RULE_ID_PATTERN = /\b([a-z]{1,2})-(\d{2})\b/giu;

function toRuleGuide(rule: Rule) {
  return {
    id: rule.id,
    category: rule.category,
    title: rule.title,
    statement: rule.statement,
    check: rule.check,
    status: rule.status,
    path: `/rules/${rule.id}`,
    items: rule.items.map((item) => item.slug),
  };
}

function ruleFields(rule: Rule): readonly SearchField[] {
  return [
    field("title", 8, [rule.title]),
    field("category", 6, [rule.category, ruleCategoryLabel(rule.category)]),
    field("statement", 5, [rule.statement]),
    field("check", 3, [rule.check]),
    field("common default", 2, [rule.anti_pattern]),
    field("why", 1, [rule.why, rule.body]),
  ];
}

const ruleSearchIndex = getRules().map((rule) => ({
  rule,
  fields: ruleFields(rule),
}));

const RULE_BOUNDARY =
  "Every rule is a draft until a maintainer signs it (status reviewed). Rules cover structure and behaviour, not a palette: keep the project's own theme.";

/**
 * get_rules: with no topic, the compact index (rules/TESSLI.md). With rule
 * ids in the topic ("H-01 ST-03"), exactly those rules. Otherwise, rules
 * ranked by keyword matches over title, category, statement, check and the
 * default each rule guards against.
 */
export function getNativeRules(topic: string = "") {
  const query = topic.trim();
  if (!query) {
    return {
      mode: "index" as const,
      ruleCount: getRules().length,
      path: RULES_INDEX_PATH,
      install: rulesInstallCommand(),
      index: getRulesIndex(),
      boundary: RULE_BOUNDARY,
    };
  }

  const ids = Array.from(
    new Set(
      Array.from(query.matchAll(RULE_ID_PATTERN), (match) =>
        `${match[1]}-${match[2]}`.toUpperCase(),
      ),
    ),
  );
  if (ids.length > 0) {
    const known = ids.filter((id) => ruleById.has(id));
    const unknown = ids.filter((id) => !ruleById.has(id));
    if (known.length === 0) {
      throw new NativeMcpInputError(
        `Unknown Tessli rule id: ${unknown.join(", ")}. Call get_rules with no topic for the full index.`,
      );
    }
    return {
      mode: "ids" as const,
      query,
      rules: known
        .slice(0, NATIVE_MCP_LIMITS.rules)
        .map((id) => toRuleGuide(ruleById.get(id) as Rule)),
      ...(unknown.length > 0 ? { unknownIds: unknown } : {}),
      boundary: RULE_BOUNDARY,
    };
  }

  const terms = toSearchTerms(query);
  const ranked = rankCandidates(
    ruleSearchIndex.map(({ rule, fields }) => ({
      rule,
      key: rule.id,
      ...scoreFields(fields, terms),
    })),
  );

  return {
    mode: "search" as const,
    query,
    terms,
    matchCount: ranked.length,
    rules: ranked
      .slice(0, NATIVE_MCP_LIMITS.rules)
      .map(({ rule, matched }) => ({ ...toRuleGuide(rule), matched })),
    ...(ranked.length === 0
      ? {
          hint: "No rule matched. Call get_rules with no topic for the full index.",
        }
      : {}),
    boundary: RULE_BOUNDARY,
  };
}

/* ---------------------------------------------------------------- sources */

/**
 * find_sources: the website's task retrieval, unchanged — non-archived
 * sources only, deterministic order, at most eight, each with recorded fit
 * reasons, caveats, access routes and alternatives.
 */
export function findNativeSources(input: TaskRetrievalInput) {
  try {
    return retrieveTaskSources(input);
  } catch (error) {
    if (error instanceof TaskRetrievalInputError) {
      throw new NativeMcpInputError(error.message);
    }
    throw error;
  }
}

function resolveSourceProfile(identifier: string): SourceProfile {
  const normalized = identifier.trim();
  const profile = getSourceProfile(normalized);
  if (!profile) {
    throw new NativeMcpInputError(
      `Unknown Tessli source: ${normalized || "(blank)"}. Use find_sources to find source slugs.`,
    );
  }
  return profile;
}

/**
 * get_source: the same document as /resources/<slug>/profile.json. An
 * archived source still resolves, with status archived, its reason and its
 * replacement, and no access route.
 */
export function getNativeSource(identifier: string) {
  const profile = resolveSourceProfile(identifier);
  return createPublicSourceRepresentation(
    profile,
    getSimilarSourceProfiles(profile, 2),
  );
}

/* ---------------------------------------------------------------- helpers */

function requireIntegerInRange(
  value: number,
  minimum: number,
  maximum: number,
  name: string,
): number {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new NativeMcpInputError(
      `${name} must be an integer between ${minimum} and ${maximum}.`,
    );
  }
  return value;
}
