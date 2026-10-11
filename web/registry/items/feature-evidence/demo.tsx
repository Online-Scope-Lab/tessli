// Fictional product: Northwind Notes. The people, notes, dates and limits are
// invented for the demo and labelled as such; they describe no real product.
import {
  BeforeAfter,
  EvidencePanel,
  ExactLimits,
  FeatureEvidence,
  type EvidenceFeature,
} from "./feature-evidence";

const versions = [
  {
    time: "Today, 14:32",
    author: "Ravi Menon",
    change: "Added 2 lines, removed 1",
    viewing: true,
  },
  { time: "Today, 09:15", author: "Ana Silva", change: "Added 6 lines" },
  {
    time: "Yesterday, 17:48",
    author: "Ravi Menon",
    change: "Created the note",
  },
];

const diff: { kind: "same" | "removed" | "added"; text: string }[] = [
  { kind: "same", text: "Measure the north wall before ordering" },
  { kind: "removed", text: "Order 12 panels" },
  { kind: "added", text: "Order 14 panels, including two spares" },
  { kind: "added", text: "Ask Ana to confirm the door width" },
];

function VersionHistory() {
  return (
    <EvidencePanel title="Site visit, north wing" meta="Version history">
      <ol className="divide-y divide-border border-b border-border">
        {versions.map((version) => (
          <li
            key={version.time}
            className={
              version.viewing
                ? "border-l-2 border-foreground bg-muted px-4 py-3"
                : "border-l-2 border-transparent px-4 py-3"
            }
          >
            <p className="flex flex-wrap items-baseline justify-between gap-x-4">
              <span className="font-medium tabular-nums">{version.time}</span>
              {version.viewing ? (
                <span className="font-medium">Viewing</span>
              ) : null}
            </p>
            <p className="mt-0.5 text-muted-foreground">
              {version.author} · {version.change}
            </p>
          </li>
        ))}
      </ol>
      <div className="px-4 py-3">
        <p className="text-muted-foreground">Changes in this version</p>
        <ul className="mt-2 space-y-1 font-mono">
          {diff.map((line) => (
            <li
              key={line.text}
              className={
                line.kind === "added"
                  ? "flex gap-2 rounded-sm bg-muted px-2 py-0.5 font-medium"
                  : line.kind === "removed"
                    ? "flex gap-2 px-2 py-0.5 text-muted-foreground line-through"
                    : "flex gap-2 px-2 py-0.5 text-muted-foreground"
              }
            >
              <span aria-hidden="true" className="w-3 shrink-0">
                {line.kind === "added"
                  ? "+"
                  : line.kind === "removed"
                    ? "−"
                    : ""}
              </span>
              <span className="min-w-0 break-words">
                {line.kind === "same" ? null : (
                  <span className="sr-only">
                    {line.kind === "added" ? "Added: " : "Removed: "}
                  </span>
                )}
                {line.text}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </EvidencePanel>
  );
}

function Checkbox({ done }: { done: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-sm border border-foreground"
    >
      {done ? (
        <svg
          viewBox="0 0 16 16"
          className="size-3"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3.5 8.5l3 3 6-7" />
        </svg>
      ) : null}
    </span>
  );
}

function ExportBeforeAfter() {
  return (
    <BeforeAfter
      before={{
        label: "In Northwind Notes",
        content: (
          <div>
            <p className="text-base font-semibold">Site visit, north wing</p>
            <ul className="mt-3 space-y-2">
              <li className="flex gap-2">
                <Checkbox done />
                <span>
                  <span className="sr-only">Done: </span>
                  Measure the north wall
                </span>
              </li>
              <li className="flex gap-2">
                <Checkbox done={false} />
                <span>
                  <span className="sr-only">To do: </span>
                  Order 14 panels
                </span>
              </li>
            </ul>
            <p className="mt-3 text-muted-foreground">
              Linked note: <span className="text-foreground">Panel order</span>
            </p>
          </div>
        ),
      }}
      after={{
        label: "In the exported file",
        content: (
          <pre className="font-mono text-sm leading-relaxed break-words whitespace-pre-wrap">
            {`# Site visit, north wing

- [x] Measure the north wall
- [ ] Order 14 panels

Linked note: [Panel order](panel-order.md)`}
          </pre>
        ),
      }}
    />
  );
}

const versionHistory: EvidenceFeature = {
  id: "version-history",
  title: "Every edit is kept, and any version can be restored",
  description: (
    <p>
      Version history records each change to a note with who made it and when.
      Restoring an older version never overwrites the current text; it is saved
      as a version first, so a restore can itself be undone.
    </p>
  ),
  evidence: <VersionHistory />,
  evidenceCaption:
    "Version history for one note: who changed it, when, and the exact lines.",
  facts: [
    { label: "History kept on Personal", value: "7 days" },
    { label: "History kept on Team", value: "1 year" },
    { label: "Before a restore", value: "Current text saved" },
  ],
  link: {
    label: "Read how version history works",
    href: "#version-history",
  },
};

const offline: EvidenceFeature = {
  id: "offline",
  title: "Recent notebooks open without a connection",
  description: (
    <p>
      The desktop and mobile apps keep your most recently opened notebooks on
      the device. Offline edits sync when you reconnect; if two people changed
      the same note, both versions are kept.
    </p>
  ),
  evidence: (
    <ExactLimits
      limits={[
        {
          value: "50",
          unit: "notebooks",
          label: "The most recently opened, kept on each device.",
        },
        {
          value: "2",
          unit: "GB",
          label:
            "Attachment space per device. The oldest files are cleared first.",
        },
      ]}
    />
  ),
  evidenceCaption: "Offline limits per device, the same on every plan.",
};

const exportFeature: EvidenceFeature = {
  id: "export",
  title: "Leave with plain Markdown files, links intact",
  description: (
    <p>
      Export turns every notebook into a folder of Markdown files with their
      attachments. Checklists, headings and links between notes survive the
      move.
    </p>
  ),
  evidence: <ExportBeforeAfter />,
  evidenceCaption: "One note in the app and in the file export produces.",
};

const footnote = (
  <p>
    Northwind Notes is a fictional product. The people, notes and limits shown
    here are demo content.
  </p>
);

export function FeatureEvidenceExample({
  variant = "default",
}: {
  variant?: "default" | "two-features";
}) {
  if (variant === "two-features") {
    return (
      <FeatureEvidence
        title="Notes that keep their history and leave as plain files"
        description="What teams check before moving their notes, shown with the part of the app that does the work."
        lead={versionHistory}
        supporting={[exportFeature]}
        footnote={footnote}
      />
    );
  }

  return (
    <FeatureEvidence
      title="Notes that keep their history, open offline and leave as plain files"
      description="What teams check before moving their notes, shown with the part of the app that does the work."
      lead={versionHistory}
      supporting={[offline, exportFeature]}
      more={{
        title: "Also on every plan",
        items: [
          {
            term: "Sharing",
            detail:
              "Off by default. Invite people by email and remove anyone from the Sharing panel.",
          },
          {
            term: "Search",
            detail: "Covers note titles, note text and attachment file names.",
          },
          {
            term: "Keyboard",
            detail:
              "Every command has a shortcut. Press ? to see the full list.",
          },
        ],
      }}
      footnote={footnote}
    />
  );
}

export default function FeatureEvidenceDemo() {
  return <FeatureEvidenceExample />;
}
