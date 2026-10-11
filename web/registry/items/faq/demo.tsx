// Fictional product: Northwind Notes. No real brand, data or metrics.
import { Faq } from "./faq";

const items = [
  {
    question: "Can I export everything if I leave?",
    answer: (
      <p>
        Yes. Export in Settings downloads every notebook as Markdown files with
        their attachments, on every plan. Exports keep folder structure and note
        links.
      </p>
    ),
  },
  {
    question: "What happens to my notes if I stop paying?",
    answer: (
      <p>
        Your workspace moves to the free plan. Nothing is deleted; notebooks
        over the free limit become read-only until you upgrade or archive some.
      </p>
    ),
  },
  {
    question: "Do you offer a discount for annual billing?",
    answer: (
      <p>
        Annual billing costs the same as ten months of monthly billing. You can
        switch between monthly and annual at any time; the change applies from
        your next invoice.
      </p>
    ),
  },
  {
    question: "Who can see a shared notebook?",
    answer: (
      <p>
        Only the people you invite. Shared links are off by default, and you can
        see and remove every member from the notebook’s Sharing panel.
      </p>
    ),
  },
  {
    question: "Does it work offline?",
    answer: (
      <p>
        The desktop and mobile apps keep your recent notebooks available
        offline. Edits sync when you reconnect; if two people edit the same
        note, both versions are kept.
      </p>
    ),
  },
];

export default function FaqDemo() {
  return (
    <Faq
      title="Questions before you switch"
      description="What teams usually ask about data, billing and sharing before moving their notes to Northwind Notes."
      items={items}
      openFirst
      contact={
        <p>
          Not answered here? Email{" "}
          <a
            href="mailto:support@northwind-notes.example"
            className="font-medium break-words text-foreground underline underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            support@northwind-notes.example
          </a>{" "}
          and a person replies within one working day.
        </p>
      }
    />
  );
}
