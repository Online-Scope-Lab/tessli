// TEMPLATE. demo.tsx renders the first state in notes.md `states` at
// /preview/<slug>. Use realistic but clearly fictional content (a made-up
// product such as "Northwind Notes", .example email domains). No real brands,
// logos, testimonials or metrics presented as real.
import { ExampleItem } from "./example-item";

export default function ExampleItemDemo() {
  return (
    <ExampleItem
      title="A heading that says what this section is for"
      description="One or two sentences of realistic, clearly fictional demo copy."
    />
  );
}
