import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import {
  goodFirstIssuesUrl,
  issueFormUrl,
  repositoryFileUrl,
  repositoryUrl,
} from "@/lib/repository";

import styles from "./contribute.module.css";

export const metadata: Metadata = {
  title: "Contribute",
  description:
    "Suggest a source, submit a design, contribute a library item or report a problem. Every path ends in a GitHub issue or pull request.",
};

type ContributionLink = Readonly<{ label: string; href: string }>;

type ContributionPath = Readonly<{
  id: string;
  title: string;
  who: string;
  body: string;
  lands: string;
  links: readonly ContributionLink[];
}>;

const paths: readonly ContributionPath[] = [
  {
    id: "suggest-source",
    title: "Suggest a source",
    who: "For anyone with a good design or frontend link.",
    body: "The issue form asks for the name, URL, category and access, what someone will find there, why it belongs next to one to three sources already in Tessli, and your relationship to it.",
    lands:
      "An issue labelled source:suggestion. An automated comment checks the URL for duplicates and whether it opens; a maintainer opens the source and decides.",
    links: [
      { label: "Suggest a source", href: issueFormUrl("suggest-source.yml") },
    ],
  },
  {
    id: "submit-design",
    title: "Submit a design",
    who: "For designers with a component, section or page.",
    body: "Share a screenshot or a Figma link, the problem it solves and what the common default gets wrong. Only share work you made or have the right to share.",
    lands:
      "An issue labelled design:needs-implementation that a developer can pick up. If it becomes an item, the designer and the developer are both credited.",
    links: [
      { label: "Submit a design", href: issueFormUrl("submit-design.yml") },
    ],
  },
  {
    id: "contribute-item",
    title: "Contribute an item",
    who: "For developers who want to add to the library.",
    body: "Copy the item template, build the item with shadcn/ui primitives and semantic tokens, and fill in its taste notes honestly: use when, avoid when, the rules it follows and the default it replaces. Building a submitted design or a good first issue is a good place to start.",
    lands:
      "A pull request. CI checks the notes, the build and the preview in three themes and at five widths; then a maintainer reviews it.",
    links: [
      {
        label: "Read the item guide",
        href: repositoryFileUrl("CONTRIBUTING.md", "contribute-an-item"),
      },
      {
        label: "Open the item template",
        href: repositoryFileUrl("web/registry/_template"),
      },
      { label: "Find a good first issue", href: goodFirstIssuesUrl },
    ],
  },
  {
    id: "report-problem",
    title: "Report a problem",
    who: "For a broken link, wrong information or a bug.",
    body: "Report a listed source that is broken, has moved or should be archived, or anything on this site that does not work as expected.",
    lands:
      "An issue. Sources are never deleted silently: one that should go is archived with a reason, so its history and old links survive.",
    links: [
      {
        label: "Report a source problem",
        href: issueFormUrl("report-source.yml"),
      },
      { label: "Report a bug", href: issueFormUrl("bug.yml") },
    ],
  },
];

const rules = [
  [
    "Original work only.",
    "No ports or recreations of paid kits such as Tailwind Plus or shadcnblocks; their licences forbid it. Adapted open-source work names its source and licence.",
  ],
  [
    "Disclose AI assistance.",
    "It is allowed, but say so in the issue or pull request, and a person must have reviewed the result. Unreviewed AI-generated work is rejected.",
  ],
  [
    "No invented proof.",
    "No made-up metrics, ratings, customer logos or testimonials, in demo content or anywhere else. Fictional content looks clearly fictional.",
  ],
  [
    "Sign off your commits.",
    "Tessli uses the Developer Certificate of Origin instead of a CLA: commit with git commit -s.",
  ],
] as const;

export default function ContributePage() {
  return (
    <main className={styles.page} data-contribute-page id="main-content">
      <div className="tessli-container">
        <header className={styles.header}>
          <h1>Contribute on GitHub.</h1>
          <p className={styles.lede}>
            Tessli has no accounts and no forms of its own. Every way to
            contribute ends in a GitHub issue or pull request, where GitHub’s
            sign-in and moderation apply and the discussion stays public.
          </p>
        </header>

        <ul className={styles.paths} aria-label="Ways to contribute">
          {paths.map((path) => (
            <li key={path.id}>
              <section
                aria-labelledby={`${path.id}-title`}
                className={styles.path}
                data-contribute-path={path.id}
              >
                <h2 id={`${path.id}-title`}>{path.title}</h2>
                <p className={styles.who}>{path.who}</p>
                <p>{path.body}</p>
                <p className={styles.lands}>
                  <span>What happens next</span> {path.lands}
                </p>
                <div className={styles.actions}>
                  {path.links.map((link) => (
                    <Button
                      href={link.href}
                      key={link.href}
                      variant="secondary"
                    >
                      {link.label}
                      <span aria-hidden="true">↗</span>
                      <span className="sr-only"> (opens GitHub)</span>
                    </Button>
                  ))}
                </div>
              </section>
            </li>
          ))}
        </ul>

        <section
          aria-labelledby="contribute-rules-title"
          className={styles.rules}
          data-contribute-rules
        >
          <div className={styles.rulesHeading}>
            <h2 id="contribute-rules-title">The rules, in short.</h2>
            <p>
              Maintainers enforce these in review. Contributions are released
              under the MIT licence; the Tessli name, wordmark and hero artwork
              are not part of it.
            </p>
          </div>
          <dl className={styles.ruleList}>
            {rules.map(([term, detail]) => (
              <div key={term}>
                <dt>{term}</dt>
                <dd>{detail}</dd>
              </div>
            ))}
          </dl>
          <ul className={styles.readMore} aria-label="Contribution documents">
            <li>
              <a
                href={repositoryFileUrl("CONTRIBUTING.md")}
                rel="noopener noreferrer"
                target="_blank"
              >
                Contributing guide
                <span aria-hidden="true">↗</span>
              </a>
            </li>
            <li>
              <a
                href={repositoryFileUrl("CODE_OF_CONDUCT.md")}
                rel="noopener noreferrer"
                target="_blank"
              >
                Code of conduct
                <span aria-hidden="true">↗</span>
              </a>
            </li>
            <li>
              <a
                href={repositoryFileUrl("TRADEMARKS.md")}
                rel="noopener noreferrer"
                target="_blank"
              >
                Licence and trademarks
                <span aria-hidden="true">↗</span>
              </a>
            </li>
            <li>
              <a href={repositoryUrl} rel="noopener noreferrer" target="_blank">
                The repository
                <span aria-hidden="true">↗</span>
              </a>
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
