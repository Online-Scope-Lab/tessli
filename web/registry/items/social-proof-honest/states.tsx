// Fictional product: Northwind Notes. No real people, customers or metrics.
import { exampleQuotes, ProofNote } from "./demo";
import { SocialProofHonest } from "./social-proof-honest";

function SingleQuote() {
  const [first] = exampleQuotes;
  return (
    <SocialProofHonest
      title="One research team on moving their notes, in their own words"
      description="One quote you can check beats a wall of praise nobody can trace."
      quotes={[{ ...first, publishedAt: "2026-06-03" }]}
      note={<ProofNote />}
    />
  );
}

function NoProofYet() {
  return (
    <SocialProofHonest
      title="Check our work before you take our word for it"
      description="Northwind Notes opened to the public this year, so there are no customer stories to share yet. These public records show what we ship and how it runs."
      quotes={[]}
      fallback={[
        {
          label: "Read the changelog",
          href: "https://northwind-notes.example/changelog",
          description:
            "Every release since the public beta, with its date and what changed.",
        },
        {
          label: "Browse the sync engine’s source",
          href: "https://code.example/northwind-notes/sync",
          external: true,
          description:
            "The code that stores and syncs your notes is open source under the MIT licence.",
        },
        {
          label: "See the status history",
          href: "https://status.northwind-notes.example",
          description:
            "Every incident since launch, with what happened and what was fixed.",
        },
      ]}
      note={
        <p>
          When the first customer agrees to be quoted, their words go here with
          a link to where they said them. Demo links for a fictional product.
        </p>
      }
    />
  );
}

/** Extra states, keyed by the names in notes.md `states` (after the first). */
export const states = {
  single: SingleQuote,
  "no-proof-yet": NoProofYet,
};
