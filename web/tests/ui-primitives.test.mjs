import assert from "node:assert/strict";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";

import ts from "typescript";

const currentFile = fileURLToPath(import.meta.url);
const webRoot = path.resolve(path.dirname(currentFile), "..");
const uiRoot = path.join(webRoot, "components/ui");
// Inside node_modules so the compiled modules resolve react and next/link.
const outDir = path.join(webRoot, "node_modules/.cache/tessli-ui-test");
const require = createRequire(path.join(webRoot, "package.json"));
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

let ui;

before(async () => {
  await rm(outDir, { force: true, recursive: true });
  await mkdir(outDir, { recursive: true });
  // CSS modules resolve to their class names, so markup assertions can name them.
  await writeFile(
    path.join(outDir, "css-module.cjs"),
    "module.exports = new Proxy({}, { get: (_, key) => (key === '__esModule' ? false : String(key)) });\n",
  );
  const files = (await readdir(uiRoot)).filter((file) => file.endsWith(".tsx"));
  for (const file of files) {
    const source = await readFile(path.join(uiRoot, file), "utf8");
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: {
        esModuleInterop: true,
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    });
    await writeFile(
      path.join(outDir, file.replace(/\.tsx$/, ".cjs")),
      outputText.replaceAll(/"\.\/[\w-]+\.module\.css"/g, '"./css-module.cjs"'),
    );
  }
  const load = (name) => require(path.join(outDir, `${name}.cjs`));
  ui = {
    ...load("button"),
    ...load("eyebrow"),
    ...load("field"),
    ...load("tag"),
  };
});

after(() => rm(outDir, { force: true, recursive: true }));

function render(component, props, ...children) {
  return renderToStaticMarkup(
    React.createElement(component, props, ...children),
  );
}

test("Button renders a typed button with the variant class", () => {
  assert.equal(
    render(ui.Button, { variant: "secondary" }, "Save"),
    '<button class="button secondary" type="button">Save</button>',
  );
  assert.equal(
    render(ui.Button, { type: "submit" }, "Send"),
    '<button class="button primary" type="submit">Send</button>',
  );
  assert.match(
    render(ui.Button, { variant: "quiet", className: "wide" }, "Skip"),
    /class="button quiet wide"/,
  );
});

test("Button with href renders an internal link or a safe external link", () => {
  assert.equal(
    render(ui.Button, { href: "/resources" }, "Browse"),
    '<a class="button primary" href="/resources">Browse</a>',
  );
  assert.equal(
    render(ui.Button, { href: "#local-mcp", variant: "secondary" }, "Jump"),
    '<a class="button secondary" href="#local-mcp">Jump</a>',
  );
  assert.equal(
    render(ui.Button, { href: "https://example.com", variant: "quiet" }, "Go"),
    '<a class="button quiet" href="https://example.com" rel="noopener noreferrer" target="_blank">Go</a>',
  );
});

test("Field wires label, hint, and error to the control", () => {
  const plain = render(ui.Field, { id: "name", label: "Name" });
  assert.equal(
    plain,
    '<div class="field"><label class="label" for="name">Name</label><input class="control" id="name"/></div>',
  );

  const described = render(ui.Field, {
    id: "url",
    label: "Source URL",
    hint: "Use the canonical homepage.",
    error: "Enter a valid URL.",
    type: "url",
  });
  assert.match(described, /<label class="label" for="url">Source URL<\/label>/);
  assert.match(
    described,
    /<input type="url" aria-describedby="url-hint url-error" aria-invalid="true" class="control" id="url"\/>/,
  );
  assert.match(
    described,
    /<p class="hint" id="url-hint">Use the canonical homepage\.<\/p>/,
  );
  assert.match(
    described,
    /<p class="error" id="url-error">Enter a valid URL\.<\/p>/,
  );

  const multiline = render(ui.Field, {
    id: "notes",
    label: "Notes",
    hint: "Optional.",
    multiline: true,
    rows: 4,
  });
  assert.match(
    multiline,
    /<textarea rows="4" aria-describedby="notes-hint" class="control" id="notes"><\/textarea>/,
  );
  assert.doesNotMatch(multiline, /aria-invalid|multiline/);
});

test("Tag and Eyebrow render plain, non-interactive text", () => {
  assert.equal(
    render(ui.Tag, null, "Typography"),
    '<span class="tag neutral">Typography</span>',
  );
  assert.equal(
    render(
      ui.Tag,
      { tone: "signal", "data-intelligence-badge": "true" },
      "Component System",
    ),
    '<span data-intelligence-badge="true" class="tag signal">Component System</span>',
  );
  assert.equal(
    render(ui.Eyebrow, null, "Curated design resources"),
    '<p class="eyebrow">Curated design resources</p>',
  );
});

test("primitive styles keep tokens, focus, and touch targets", async () => {
  const [button, field, tag, eyebrow] = await Promise.all(
    ["button", "field", "tag", "eyebrow"].map((name) =>
      readFile(path.join(uiRoot, `${name}.module.css`), "utf8"),
    ),
  );

  assert.match(button, /\.button \{[^}]*min-height: 44px/);
  assert.match(
    button,
    /\.button:focus-visible \{[^}]*outline: 3px solid var\(--focus\)/,
  );
  assert.match(
    button,
    /\.primary \{[^}]*background: var\(--accent\);[^}]*color: var\(--text-strong\)/,
  );
  assert.match(field, /\.control \{[^}]*min-height: 44px/);
  assert.match(
    field,
    /\.control:focus-visible \{[^}]*outline: 3px solid var\(--focus\)/,
  );
  assert.match(field, /\[aria-invalid="true"\]/);
  assert.match(tag, /var\(--radius-control-sm\)/);
  assert.match(eyebrow, /text-transform: uppercase/);
  for (const css of [button, field, tag, eyebrow]) {
    assert.doesNotMatch(
      css,
      /#[0-9a-f]{3,8}\b/i,
      "primitives use tokens, not hex",
    );
  }
});
