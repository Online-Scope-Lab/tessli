import Link from "next/link";

import { CopyCommand } from "@/components/library/copy-command";
import { Button } from "@/components/ui/button";
import { getLibraryItem, getLibraryItems, installCommand } from "@/lib/library";
import { TESSLI_MCP_TOOL_CATALOGUE } from "@/lib/mcp-tool-catalogue";
import { repositoryCloneUrl, repositoryUrl } from "@/lib/repository";
import {
  getRules,
  getRulesByCategory,
  getRulesIndex,
  RULES_INDEX_PATH,
  rulesInstallCommand,
} from "@/lib/rules";
import { getSourceProfile } from "@/lib/source-profiles";

import styles from "./for-ai.module.css";

export const metadata = {
  title: "For AI",
  description:
    "Install Tessli items and the rules file with the shadcn CLI, run the local read-only MCP server, and read every item, rule and source as plain JSON or Markdown.",
};

/** The `mcp` script in web/package.json runs `node mcp/server.ts`. */
const setupCommands = `git clone ${repositoryCloneUrl}
cd tessli/web
npm ci
npm run mcp`;

// The client starts the server file directly: `npm run` prints its banner
// to standard output, which would corrupt the MCP stream.
const clientConfiguration = `{
  "mcpServers": {
    "tessli": {
      "command": "node",
      "args": ["/absolute/path/to/tessli/web/mcp/server.ts"]
    }
  }
}`;

const skillUrl = `${repositoryUrl}/blob/main/skills/tessli/SKILL.md`;

const steps = [
  ["Read the rules", "Read TESSLI.md before any UI work, or call get_rules."],
  [
    "Find an item",
    "Call search_items with a short brief, or browse the library. Read “Use when” and “Avoid when” before choosing.",
  ],
  [
    "Install it",
    "Run the item’s shadcn command. It lands in components/<slug>.tsx with its shadcn/ui dependencies.",
  ],
  [
    "Adapt it",
    "Swap the demo content for the project’s real content. Keep the semantic tokens and the project’s own theme.",
  ],
  [
    "Check it",
    "Render at 1440, 768 and 390 px and run the check line of every rule the item lists. Fix what fails, then check again.",
  ],
] as const;

function requireExample<T>(value: T | null | undefined, name: string): T {
  if (!value) throw new Error(`Missing For AI example: ${name}.`);
  return value;
}

export default function ForAiPage() {
  const items = getLibraryItems();
  const reviewedItems = items.filter(
    (item) => item.notes.status === "reviewed",
  ).length;
  const exampleItem = requireExample(
    getLibraryItem("pricing-tiers"),
    "pricing-tiers",
  );
  const exampleSource = requireExample(
    getSourceProfile("land-book"),
    "land-book",
  );
  const rules = getRules();
  const reviewedRules = rules.filter(
    (rule) => rule.status === "reviewed",
  ).length;
  const ruleAreas = getRulesByCategory().length;
  const index = getRulesIndex();
  const indexKilobytes = (new TextEncoder().encode(index).length / 1024)
    .toFixed(1)
    .replace(/\.0$/u, "");
  const indexExcerpt = index
    .split("\n")
    .filter((line) => line.startsWith("- "))
    .slice(0, 3)
    .join("\n");

  return (
    <main className={styles.page} data-for-ai-page id="main-content">
      <div className="tessli-container">
        <header className={styles.hero}>
          <h1>Code and reasoning, in the formats agents read.</h1>
          <p className={styles.lede}>
            Coding agents install Tessli items with the shadcn CLI, keep the
            rules in one small file and can query both through a local MCP
            server. They get the same code, notes and rules people see in the
            library.
          </p>
          <div className={styles.heroActions}>
            <Button href="/library">Browse the library</Button>
            <Button href="#local-mcp" variant="secondary">
              Set up local MCP
            </Button>
          </div>
        </header>

        <section
          aria-labelledby="install-title"
          className={styles.section}
          data-for-ai-install
          id="install"
        >
          <div className={styles.sectionHeading}>
            <h2 id="install-title">Install with the shadcn CLI.</h2>
            <p>
              Run these in a project set up with shadcn/ui. Items use semantic
              theme tokens, so they take on your project’s theme rather than
              Tessli’s.
            </p>
          </div>

          <div className={`${styles.panelGrid} ${styles.commandPanels}`}>
            <article>
              <h3>One item</h3>
              <p>
                Adds the item as one component file, with the shadcn/ui
                primitives it needs. This one is{" "}
                <Link href={`/library/${exampleItem.slug}`}>
                  {exampleItem.notes.title}
                </Link>
                ; every item page shows its own command.
              </p>
              <CopyCommand
                command={installCommand(exampleItem.slug)}
                label="Copy the item install command"
              />
            </article>
            <article>
              <h3>The rules file</h3>
              <p>
                Adds TESSLI.md to the project root, where your agent’s
                instructions can point to it.
              </p>
              <CopyCommand
                command={rulesInstallCommand()}
                label="Copy the rules install command"
              />
            </article>
          </div>
        </section>

        <section
          aria-labelledby="rules-file-title"
          className={styles.section}
          data-for-ai-rules-file
        >
          <div className={styles.sectionHeading}>
            <h2 id="rules-file-title">TESSLI.md keeps every rule in reach.</h2>
            <p>
              A compact index generated from the rule files: one line per rule,
              with the rule and how to check it. Small enough for an agent to
              read before every UI task.
            </p>
          </div>

          <div className={styles.rulesFile}>
            <dl className={styles.facts}>
              <div>
                <dt>Rules</dt>
                <dd>
                  {rules.length} in {ruleAreas} areas, from hierarchy to
                  accessibility
                </dd>
              </div>
              <div>
                <dt>Size</dt>
                <dd>{indexKilobytes} KB of Markdown</dd>
              </div>
              <div>
                <dt>Review</dt>
                <dd>
                  {reviewedRules === 0
                    ? "All drafts until a maintainer signs them"
                    : `${reviewedRules} of ${rules.length} signed by a maintainer; the rest are drafts`}
                </dd>
              </div>
              <div>
                <dt>Installs to</dt>
                <dd>TESSLI.md at the project root</dd>
              </div>
            </dl>
            <div className={styles.excerpt}>
              <pre
                aria-label="The first lines of TESSLI.md"
                className={`${styles.codeBlock} ${styles.wrap}`}
              >
                <code>{indexExcerpt}</code>
              </pre>
              <div className={styles.inlineLinks}>
                <a href={RULES_INDEX_PATH}>Read TESSLI.md</a>
                <Link href="/rules">Read the rules with their reasons</Link>
              </div>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="workflow-title"
          className={styles.section}
          data-for-ai-workflow
        >
          <div className={styles.sectionHeading}>
            <h2 id="workflow-title">How an agent uses Tessli.</h2>
            <p>
              Five steps, in order. They are packaged as an Agent Skill,{" "}
              <code>skills/tessli/SKILL.md</code>, that an agent can load
              directly.
            </p>
          </div>

          <ol className={styles.steps}>
            {steps.map(([title, description], index) => (
              <li key={title}>
                <span aria-hidden="true">{index + 1}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </li>
            ))}
          </ol>
          <p className={styles.afterList}>
            <a href={skillUrl} rel="noopener noreferrer" target="_blank">
              Read the Agent Skill on GitHub <span aria-hidden="true">↗</span>
            </a>
          </p>
        </section>

        <section
          aria-labelledby="local-mcp-title"
          className={`${styles.section} ${styles.mcpSection}`}
          data-for-ai-local-mcp
          id="local-mcp"
        >
          <div className={styles.sectionHeading}>
            <h2 id="local-mcp-title">Local MCP server.</h2>
            <p>
              A read-only process your MCP client starts from a checkout of the
              repository. It reads the same committed data as this site, makes
              no network requests and writes nothing.
            </p>
          </div>

          <div className={styles.panelGrid}>
            <article>
              <h3>Run it</h3>
              <p>
                It needs Node.js 22.18 or later. Install the locked
                dependencies, then <code>npm run mcp</code> starts the server
                and waits for a client on standard input.
              </p>
              <pre
                aria-label="Commands to run the Tessli MCP server"
                className={styles.codeBlock}
                tabIndex={0}
              >
                <code>{setupCommands}</code>
              </pre>
            </article>
            <article>
              <h3>Add it to your client</h3>
              <p>
                Point the client at the server file with an absolute path on
                your machine. Field names vary by client.
              </p>
              <pre
                aria-label="Example MCP client configuration"
                className={styles.codeBlock}
                tabIndex={0}
              >
                <code>{clientConfiguration}</code>
              </pre>
              <a
                className={styles.externalLink}
                href={repositoryUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                Open the Tessli repository <span aria-hidden="true">↗</span>
              </a>
            </article>
          </div>

          <h3 className={styles.subheading}>
            {TESSLI_MCP_TOOL_CATALOGUE.length} read-only tools
          </h3>
          <dl className={styles.tools} data-for-ai-tools>
            {TESSLI_MCP_TOOL_CATALOGUE.map((tool) => (
              <div key={tool.name}>
                <dt>
                  <code>{tool.name}</code>
                </dt>
                <dd>
                  {tool.returns}
                  <span>Input: {tool.inputs}</span>
                </dd>
              </div>
            ))}
          </dl>

          <p
            className={styles.remoteStatus}
            data-for-ai-remote-status="unavailable"
          >
            There is no hosted or remote Tessli MCP. Don’t configure an endpoint
            for it.
          </p>
        </section>

        <section
          aria-labelledby="agent-gets-title"
          className={styles.section}
          data-for-ai-agent-gets
        >
          <div className={styles.sectionHeading}>
            <h2 id="agent-gets-title">What an agent gets.</h2>
            <p>
              The same records the website renders, from {items.length} items
              and {rules.length} rules to the curated sources.
            </p>
          </div>

          <div className={styles.contentGrid}>
            <article>
              <h3>For each item</h3>
              <ul>
                <li>The code, and the install command</li>
                <li>When to use it and when not to</li>
                <li>The rules it follows</li>
                <li>
                  The common AI default it replaces, and why this is better
                </li>
                <li>How people break it when adapting it</li>
                <li>States, responsive behaviour and accessibility notes</li>
                <li>Credits and review status</li>
              </ul>
            </article>
            <article>
              <h3>For each rule</h3>
              <ul>
                <li>The rule in one line</li>
                <li>Why it matters</li>
                <li>How to check it</li>
                <li>The default it guards against</li>
                <li>The items that apply it</li>
              </ul>
            </article>
            <article>
              <h3>For each source</h3>
              <ul>
                <li>What it is for and what to explore</li>
                <li>How to access it</li>
                <li>Its limitations</li>
                <li>Alternatives, and how each differs</li>
                <li>Its status; archived sources name a replacement</li>
              </ul>
            </article>
          </div>
        </section>

        <section
          aria-labelledby="representations-title"
          className={styles.section}
          data-for-ai-representations
        >
          <div className={styles.sectionHeading}>
            <h2 id="representations-title">Plain files at stable URLs.</h2>
            <p>
              No integration needed: send an agent one of these URLs, or let it
              fetch them itself.
            </p>
          </div>

          <dl className={styles.files}>
            <div>
              <dt>
                <a href="/llms.txt">llms.txt</a>
              </dt>
              <dd>
                What Tessli is, its routes, install commands and boundaries,
                with counts taken from the data.
              </dd>
            </div>
            <div>
              <dt>
                <a href={RULES_INDEX_PATH}>{RULES_INDEX_PATH}</a>
              </dt>
              <dd>The rules index, the same file the rules install adds.</dd>
            </div>
            <div>
              <dt>
                <code>/library/&lt;slug&gt;/item.json</code> and{" "}
                <code>item.md</code>
              </dt>
              <dd>
                An item’s code, full notes, rules and install command. Example:{" "}
                <a href={`/library/${exampleItem.slug}/item.json`}>
                  {exampleItem.slug} JSON
                </a>
                ,{" "}
                <a href={`/library/${exampleItem.slug}/item.md`}>
                  {exampleItem.slug} Markdown
                </a>
                .
              </dd>
            </div>
            <div>
              <dt>
                <code>/resources/&lt;slug&gt;/profile.json</code> and{" "}
                <code>profile.md</code>
              </dt>
              <dd>
                A source’s purpose, access routes, limitations and alternatives.
                Example:{" "}
                <a href={`/resources/${exampleSource.slug}/profile.json`}>
                  {exampleSource.name} JSON
                </a>
                ,{" "}
                <a href={`/resources/${exampleSource.slug}/profile.md`}>
                  {exampleSource.name} Markdown
                </a>
                .
              </dd>
            </div>
          </dl>
        </section>

        <section
          aria-labelledby="not-claimed-title"
          className={`${styles.section} ${styles.notClaimed}`}
          data-for-ai-not-claimed
        >
          <h2 id="not-claimed-title">What Tessli does not claim.</h2>
          <ul>
            <li>
              <strong>That it makes AI-generated UI better.</strong> That claim
              waits for a published, blinded comparison scored by people. Until
              then, Tessli says only that its library is explained, open and
              installable.
            </li>
            <li>
              <strong>That its items and rules are reviewed.</strong>{" "}
              {reviewedItems} of {items.length} items and {reviewedRules} of{" "}
              {rules.length} rules are signed by a maintainer today; the rest
              are marked community or draft wherever they appear.
            </li>
            <li>
              <strong>That a source is the best.</strong> Source profiles are
              curator notes kept in the repository, not live checks of the
              provider. Confirm access, pricing and licences with the provider.
            </li>
            <li>
              <strong>Hosted access.</strong> The MCP server runs only on your
              machine. It never contacts a provider, reads credentials or writes
              state.
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
