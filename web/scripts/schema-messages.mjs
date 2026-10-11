// Turns ajv errors into messages a first-time contributor can act on: which
// field, what is wrong with the value, and what to write instead. Shared by
// the library registry (items and rules) and the catalogue (sources).
//
// Compile schemas with `verbose: true` so errors carry the offending value.

const LINE_PATTERN = "^\\S(?:.*\\S)?$";

/** "/use_when/0" → "use_when item 1"; "" → "the frontmatter". */
function fieldName(instancePath, rootName) {
  if (!instancePath) return rootName;
  const parts = instancePath
    .split("/")
    .slice(1)
    .map((part) => part.replace(/~1/gu, "/").replace(/~0/gu, "~"));
  let name = "";
  for (const part of parts) {
    if (/^\d+$/u.test(part)) name += ` item ${Number(part) + 1}`;
    else name += name ? `.${part}` : part;
  }
  return `\`${name}\``;
}

function topField(error) {
  if (error.keyword === "required") return error.params.missingProperty;
  if (error.keyword === "additionalProperties") {
    return error.instancePath
      ? error.instancePath.split("/")[1]
      : error.params.additionalProperty;
  }
  return error.instancePath.split("/")[1] ?? "";
}

function describeValue(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "a list";
  if (typeof value === "object") return "a mapping";
  if (typeof value === "string") {
    const shown = value.length > 40 ? `${value.slice(0, 37)}…` : value;
    return JSON.stringify(shown);
  }
  return String(value);
}

const TYPE_ADVICE = {
  array: "a YAML list (one `- item` per line, or `[]` when empty)",
  string: "text",
  object: "a mapping of `key: value` lines",
  integer: "a whole number",
  number: "a number",
  null: "null",
};

function lengthRange(schema) {
  const min = schema?.minLength;
  const max = schema?.maxLength;
  if (min !== undefined && max !== undefined) return `${min}–${max}`;
  if (min !== undefined) return `at least ${min}`;
  return `at most ${max}`;
}

function itemsRange(schema) {
  const min = schema?.minItems;
  const max = schema?.maxItems;
  if (max === 0) return "none";
  if (min !== undefined && max !== undefined) return `${min}–${max}`;
  if (min !== undefined) return `at least ${min}`;
  return `at most ${max}`;
}

function plural(count, word) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function message(error, field, schemaPath) {
  const { keyword, params, data, parentSchema } = error;
  switch (keyword) {
    case "required":
      return `missing the required field \`${params.missingProperty}\`.`;
    case "additionalProperties":
      return `unknown field \`${params.additionalProperty}\`${
        error.instancePath ? ` in ${field}` : ""
      }. Check its spelling; ${schemaPath} lists every allowed field.`;
    case "enum":
      return `${field} is ${describeValue(data)}; use one of: ${params.allowedValues
        .map((value) => `\`${value}\``)
        .join(", ")}.`;
    case "const":
      return `${field} must be \`${params.allowedValue}\`.`;
    case "type":
      return `${field} must be ${
        TYPE_ADVICE[params.type] ?? params.type
      }, not ${describeValue(data)}.`;
    case "minLength":
    case "maxLength":
      return `${field} is ${plural(
        typeof data === "string" ? data.length : 0,
        "character",
      )}; it needs ${lengthRange(parentSchema)}.`;
    case "minItems":
    case "maxItems":
      return `${field} lists ${plural(
        Array.isArray(data) ? data.length : 0,
        "entry",
      ).replace(/entrys$/u, "entries")}; it needs ${itemsRange(parentSchema)}.`;
    case "uniqueItems":
      return `${field} lists the same value twice (entries ${params.j + 1} and ${params.i + 1}).`;
    case "pattern":
      if (params.pattern === LINE_PATTERN) {
        return `${field} must be non-empty text without leading or trailing spaces.`;
      }
      return `${field} is ${describeValue(data)}, which is not in the expected format (\`${params.pattern}\`).`;
    case "format":
      if (params.format === "date") {
        return `${field} is ${describeValue(data)}; write a real date as YYYY-MM-DD, for example 2026-10-11.`;
      }
      if (params.format === "uri") {
        return `${field} is ${describeValue(data)}; write a full http:// or https:// URL.`;
      }
      return `${field} is not a valid ${params.format}.`;
    case "minimum":
      return `${field} must be ${params.comparison} ${params.limit}.`;
    default:
      return `${field} ${error.message}.`;
  }
}

/**
 * Formats ajv errors for one file.
 *
 * @param {import("ajv").ErrorObject[] | null | undefined} errors
 * @param {object} options
 * @param {string} options.label    file label, e.g. "sources/x.yml"
 * @param {string} options.schemaPath repo path of the schema, for "see …" hints
 * @param {object} [options.schema] the root schema; property descriptions are
 *   appended to messages about that property
 * @param {Record<string, string>} [options.hints] extra advice, keyed by an
 *   error's schemaPath (for if/then/else rules) or by its top-level field
 * @param {string} [options.rootName] what the instance root is called
 * @returns {string[]} one message per problem, de-duplicated
 */
export function formatSchemaErrors(
  errors,
  { label, schemaPath, schema, hints = {}, rootName = "the file" },
) {
  const list = errors ?? [];
  // A failed anyOf/oneOf reports every branch; keep one message for it.
  const unionPaths = new Set(
    list
      .filter((error) => ["anyOf", "oneOf"].includes(error.keyword))
      .map((error) => error.instancePath),
  );
  const messages = [];
  for (const error of list) {
    if (error.keyword === "if") continue;
    const unionChild =
      !["anyOf", "oneOf"].includes(error.keyword) &&
      unionPaths.has(error.instancePath) &&
      /\/(?:anyOf|oneOf)\/\d+\//u.test(error.schemaPath);
    if (unionChild) continue;

    const field = fieldName(error.instancePath, rootName);
    const top = topField(error);
    let text;
    if (["anyOf", "oneOf"].includes(error.keyword)) {
      text = `${field} is ${describeValue(error.data)}, which is not allowed here.`;
    } else if (error.keyword === "not") {
      text = `${field} has a field that is not allowed here.`;
    } else {
      text = message(error, field, schemaPath);
    }
    const description = schema?.properties?.[top]?.description;
    const hint = hints[error.schemaPath] ?? hints[top];
    const extra = hint ?? (error.keyword === "required" ? description : null);
    messages.push(`${label}: ${text}${extra ? ` ${extra}` : ""}`);
  }
  return [...new Set(messages)];
}
