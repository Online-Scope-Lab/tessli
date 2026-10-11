---
name: tessli
description: Build or restyle UI with the Tessli library and rules. Use when creating or changing a page, section or component (hero, features, pricing, social proof, FAQ, call to action, settings, tables, dashboards, forms, sign-in, empty states, mobile list and detail) in a React and Tailwind project set up with shadcn/ui, and when checking UI against Tessli's rules.
---

# Tessli

Tessli is an open-source UI library that explains itself: each item is code plus notes on when to use it, when not to, the rules it follows and the common default it replaces. The rules cover structure and behaviour, not a palette.

## Steps

1. **Read the rules.** Read `TESSLI.md` at the project root. If it is missing, add it with `npx shadcn@latest add online-scope-lab/tessli/rules`, or read <https://tessli.vercel.app/rules/TESSLI.md>, or call the MCP tool `get_rules`.
2. **Find an item.** Call `search_items` with a short brief, then `get_item` for its code and notes. Without the MCP server, browse <https://tessli.vercel.app/library> and read `/library/<slug>/item.md`. Read "Use when" and "Avoid when" before choosing; if nothing fits, build from the rules alone.
3. **Install it.** `npx shadcn@latest add online-scope-lab/tessli/<slug>`. The item lands in `components/<slug>.tsx` with its shadcn/ui dependencies.
4. **Adapt it.** Replace the demo content with the project's real content. Keep semantic tokens (`bg-background`, `text-foreground`, `bg-primary`, `text-muted-foreground`, `border-border`) and the project's own theme; never hard-code colours. Avoid the failures listed in the item's notes.
5. **Verify it.** Render the page at 1440, 768 and 390 px (and 320 px for overflow). Check each rule the item lists, plus any rule you touched, using its check line. Fix what fails and check again.

## Don't

- Don't invent data: no made-up metrics, logos, testimonials, ratings or user counts. Use the project's real content or clearly fictional placeholders.
- Don't mark anything as reviewed. Only a Tessli maintainer signs items and rules.
- Don't claim the result is better because it used Tessli; show the checks you ran.
