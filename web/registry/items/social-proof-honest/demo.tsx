// Fictional product: Northwind Notes. Every quote here is a labelled
// placeholder that shows the shape of a good quote; none is from a real
// person, organisation or customer. Links point at reserved .example domains.
import { SocialProofHonest, type ProofQuote } from "./social-proof-honest";

export const exampleQuotes: ProofQuote[] = [
  {
    id: "interview-notes",
    quote:
      "We stopped losing interview notes between projects. Everything is searchable in one place, and export is plain Markdown, so we never felt locked in.",
    name: "Full name",
    role: "Role, organisation",
    source: {
      label: "Read the case study",
      href: "https://northwind-notes.example/customers/case-study",
    },
    placeholder: true,
  },
  {
    id: "shared-notebooks",
    quote:
      "Shared notebooks replaced the long email threads we used to send round after every research session.",
    name: "Full name",
    role: "Role, organisation",
    source: {
      label: "Read the original post",
      href: "https://customer.example/blog/original-post",
      external: true,
    },
    placeholder: true,
  },
  {
    id: "offline",
    quote:
      "Offline mode is why we switched. Our field team writes notes on site, and they sync once people are back in signal.",
    name: "Full name",
    role: "Role, organisation",
    source: {
      label: "Watch the talk where this was said",
      href: "https://video.example/talks/original-talk",
      external: true,
    },
    placeholder: true,
  },
];

export function ProofNote() {
  return (
    <p>
      Example quotes for a fictional product. Publish a quote only with the
      named person’s written permission, in their exact words, with a link to
      where it first appeared.
    </p>
  );
}

export default function SocialProofHonestDemo() {
  return (
    <SocialProofHonest
      title="Research teams on moving their notes, in their own words"
      description="Each quote links to where it was first published, so you can read it in context before you decide."
      quotes={exampleQuotes}
      note={<ProofNote />}
    />
  );
}
