// TEMPLATE. Optional: delete this file if the item has one state. Otherwise
// export `states`, keyed by every name in notes.md `states` after the first;
// each renders at /preview/<slug>?state=<name>. Do not add "use client" here.
import { ExampleItem } from "./example-item";

function Empty() {
  return (
    <ExampleItem
      title="The same item with nothing to show"
      description="Say why it is empty and what to do next."
    />
  );
}

export const states = {
  empty: Empty,
};
