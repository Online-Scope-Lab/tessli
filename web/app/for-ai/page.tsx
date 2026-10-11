import Link from "next/link";

import { Button } from "@/components/ui/button";
import { repositoryCloneUrl, repositoryUrl } from "@/lib/repository";
import { getSourceProfile } from "@/lib/source-profiles";

import styles from "./for-ai.module.css";

export const metadata = {
  title: "For AI",
  description:
    "Turn a design task into a small, explicit source handoff for an agent—through source guides, public representations, or local MCP.",
};

const setupCommands = `git clone ${repositoryCloneUrl}
cd tessli/web
npm ci
npm run mcp`;
const clientConfiguration = `{
  "mcpServers": {
    "tessli": {
      "command": "npm",
      "args": ["run", "mcp"],
      "cwd": "/absolute/path/to/tessli/web"
    }
  }
}`;

function requireSourceProfile(identifier: string) {
  const profile = getSourceProfile(identifier);
  if (!profile) {
    throw new Error(`Missing For AI source-profile example: ${identifier}.`);
  }
  return profile;
}

const workflow = [
  [
    "State the task",
    "Name the surface, constraints, and the question the build needs to answer.",
  ],
  [
    "Retrieve for task fit",
    "Start with a small source set and the recorded reason each source belongs.",
  ],
  [
    "Inspect the source guide",
    "Use the guide to see what to explore, the access route, limitations, and alternatives.",
  ],
  [
    "Keep the decision",
    "Record in your own project notes which sources you selected or rejected, and which questions stay open.",
  ],
  [
    "Hand off compact context",
    "Give the agent your notes with the source guide URLs or their JSON or Markdown representations.",
  ],
  [
    "Build and review",
    "The agent implements; browser review and a human decision determine what the project keeps.",
  ],
] as const;

export default function ForAiPage() {
  const componentSource = requireSourceProfile("shadcn-ui");
  const limitation = componentSource.limitations[0];

  return (
    <main className={styles.page} data-for-ai-page id="main-content">
      <div className="tessli-container">
        <header className={styles.hero}>
          <h1>Turn research into an agent’s next clear move.</h1>
          <p className={styles.lede}>
            Tessli helps a person frame a design task, choose useful sources,
            keep the decisions that matter, and hand over compact context for
            implementation and review. It routes research; it does not promise a
            finished outcome.
          </p>
          <div className={styles.heroActions}>
            <Button href="/resources">Start with a task</Button>
            <Button href="#local-mcp" variant="secondary">
              Set up local MCP
            </Button>
          </div>
        </header>

        <section
          aria-labelledby="workflow-title"
          className={styles.workflowSection}
          data-for-ai-workflow
        >
          <div className={styles.sectionHeading}>
            <div>
              <h2 id="workflow-title">From task to reviewed implementation.</h2>
            </div>
            <p>
              The useful unit is not a giant catalogue dump. It is a task, a
              small source set, and the project decisions that travel with it.
            </p>
          </div>

          <ol className={styles.workflow}>
            {workflow.map(([title, description], index) => (
              <li key={title}>
                <span aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section
          aria-labelledby="agent-context-title"
          className={styles.section}
        >
          <div className={styles.sectionHeading}>
            <div>
              <h2 id="agent-context-title">
                Guidance with a reason to use it.
              </h2>
            </div>
            <p>
              Each source guide makes the practical next step visible: what a
              source helps with, what to inspect, how to access it, one
              important limitation, and differentiated alternatives.
            </p>
          </div>

          <div className={styles.contextGrid}>
            <article>
              <h3>Task-fit guidance</h3>
              <p>
                Retrieval is deterministic and grounded in the recorded source
                profile. It returns a bounded shortlist instead of treating
                every source as equally relevant.
              </p>
            </article>
            <article>
              <h3>Access that names the route</h3>
              <p>
                A source can point to a browser, documentation, registry, source
                code, API, MCP, CLI, or plugin—only where that route is
                recorded.
              </p>
            </article>
            <article>
              <h3>Project-owned decisions</h3>
              <p>
                Your project notes record why a source was selected or rejected,
                plus constraints and questions the agent should not guess.
              </p>
            </article>
          </div>
        </section>

        <section
          aria-labelledby="example-title"
          className={`${styles.section} ${styles.exampleSection}`}
          data-for-ai-example
        >
          <div className={styles.sectionHeading}>
            <div>
              <h2 id="example-title">A result a builder can act on.</h2>
            </div>
            <p>
              This example uses recorded canonical data—not a simulated provider
              preview or a generic recommendation.
            </p>
          </div>

          <div className={styles.exampleLedger}>
            <article className={styles.taskBrief}>
              <p className={styles.ledgerLabel}>Task</p>
              <p>
                Add a code-owned, accessible settings panel to a
                Next.js/Tailwind product.
              </p>
              <dl>
                <div>
                  <dt>Needs</dt>
                  <dd>Accessible components, implementation guidance</dd>
                </div>
                <div>
                  <dt>Keep in view</dt>
                  <dd>Custom visual language, not a copied template</dd>
                </div>
              </dl>
            </article>

            <article className={styles.sourceResult}>
              <p className={styles.ledgerLabel}>One recorded result</p>
              <h3>{componentSource.name}</h3>
              <p>{componentSource.summary}</p>
              <ul>
                <li>
                  Fits the recorded React, Tailwind, and Next.js framework
                  context.
                </li>
                <li>
                  Supports recorded accessible-component and design-system setup
                  workflows.
                </li>
                <li>
                  <strong>Limitation:</strong> {limitation}
                </li>
              </ul>
              <Link href={`/resources/${componentSource.slug}`}>
                Inspect the {componentSource.name} source guide
              </Link>
            </article>
          </div>
        </section>

        <section
          aria-labelledby="representations-title"
          className={styles.section}
          data-for-ai-representations
        >
          <div className={styles.sectionHeading}>
            <div>
              <h2 id="representations-title">
                Use a source guide or public representation.
              </h2>
            </div>
            <p>
              An agent does not need a Tessli-specific integration to receive
              canonical source guidance. Send a stable source-guide URL, or use
              its public JSON or Markdown representation.
            </p>
          </div>

          <div className={styles.accessGrid}>
            <article>
              <h3>Semantic source pages</h3>
              <p>
                The public source guide is designed for direct reading and links
                to the recorded provider route separately.
              </p>
              <Link href={`/resources/${componentSource.slug}`}>
                Open the source guide
              </Link>
            </article>
            <article>
              <h3>Public JSON and Markdown</h3>
              <p>
                These static representations expose the same source truth in a
                compact, model-neutral form.
              </p>
              <div className={styles.inlineLinks}>
                <Link href={`/resources/${componentSource.slug}/profile.json`}>
                  Source JSON
                </Link>
                <Link href={`/resources/${componentSource.slug}/profile.md`}>
                  Source Markdown
                </Link>
              </div>
            </article>
          </div>
        </section>

        <section
          aria-labelledby="local-mcp-title"
          className={`${styles.section} ${styles.mcpSection}`}
          data-for-ai-local-mcp
          id="local-mcp"
        >
          <div className={styles.sectionHeading}>
            <div>
              <h2 id="local-mcp-title">Local MCP is the current transport.</h2>
            </div>
            <p>
              Tessli MCP is a read-only process that an MCP client starts from a
              checked-out repository. It can retrieve task-fit source guidance
              and compact research briefs from the same canonical data.
            </p>
          </div>

          <div className={styles.setupGrid}>
            <article>
              <h3>Run it from the repository</h3>
              <p>
                Install the locked dependencies, then start the local server
                from the <code>web</code> workspace. It waits for an MCP client
                over standard input and output.
              </p>
              <pre
                aria-label="Tessli local MCP installation commands"
                className={styles.codeBlock}
                tabIndex={0}
              >
                <code>{setupCommands}</code>
              </pre>
            </article>
            <article>
              <h3>Let the client start the process</h3>
              <p>
                Configure your MCP client with the repository location. Field
                names vary by client; replace the example path on your machine.
              </p>
              <pre
                aria-label="Example local MCP client configuration"
                className={styles.codeBlock}
                tabIndex={0}
              >
                <code>{clientConfiguration}</code>
              </pre>
              <a href={repositoryUrl} rel="noopener noreferrer" target="_blank">
                Open the Tessli repository <span aria-hidden="true">↗</span>
              </a>
            </article>
          </div>

          <p
            className={styles.remoteStatus}
            data-for-ai-remote-status="unavailable"
          >
            Remote and hosted MCP are unavailable today. Do not configure an
            endpoint, and do not expect Tessli to access provider accounts or
            browser state.
          </p>
        </section>

        <section
          aria-labelledby="routes-title"
          className={styles.section}
          data-for-ai-access-routes
        >
          <div className={styles.sectionHeading}>
            <div>
              <h2 id="routes-title">Choose the recorded access route.</h2>
            </div>
            <p>
              Tessli names an allowed next step; it does not proxy a provider,
              supply credentials, or stand in for a provider’s terms.
            </p>
          </div>

          <dl className={styles.routeList}>
            <div>
              <dt>Read</dt>
              <dd>Browser or documentation for inspection and guidance.</dd>
            </div>
            <div>
              <dt>Integrate</dt>
              <dd>
                Package registry, source code, API, CLI, or plugin where
                recorded.
              </dd>
            </div>
            <div>
              <dt>Connect</dt>
              <dd>
                MCP only when a source records a provider-owned endpoint and its
                access boundary.
              </dd>
            </div>
          </dl>
        </section>

        <section
          aria-labelledby="boundaries-title"
          className={`${styles.section} ${styles.boundaries}`}
          data-for-ai-boundaries
        >
          <h2 id="boundaries-title">
            Keep project context private and provider boundaries clear.
          </h2>
          <p>
            Tessli routes agents to recorded public source paths. It does not
            mirror paid or private provider content, bypass access controls,
            supply provider credentials, ingest a project automatically, or make
            a hidden write on a person’s behalf.
          </p>
        </section>
      </div>
    </main>
  );
}
