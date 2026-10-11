# Project notes

- Next.js (App Router) with TypeScript and Tailwind CSS v4. Pages live in `app/`.
- shadcn/ui is set up (`components.json`, `lib/utils.ts`, theme variables in `app/globals.css`). Add a shadcn component with `npx shadcn@4.21.4 add <component>`; it lands in `components/ui/`.
- `npm run dev` starts a development server; `npm run build` must pass before you finish.

## UI rules and ready-made items

- `TESSLI.md` in the project root lists UI rules for structure and behaviour (not a visual style; keep this project's theme). Read it before you build UI, and check your work against each rule's check at 1440, 768 and 390 px.
- Components, sections and pages that follow those rules are available from a shadcn registry served locally at `http://127.0.0.1:4100`:
  - List them: `curl -s http://127.0.0.1:4100/registry.json`. Each item has a title, a description and `meta.tessli` with when to use it, when not to, and the rules it applies.
  - Read one, including its code: `curl -s http://127.0.0.1:4100/<name>.json`.
  - Install one: `npx shadcn@4.21.4 add http://127.0.0.1:4100/<name>.json`. Then adapt its content and props to the brief; keep this project's theme.
- Use an item only where it fits the brief; build the rest yourself.
