# v1.2 research notes: market, registry format, evidence

Date: 2026-10-10
Method: Vendor websites were mostly blocked from the planning environment. Facts about shadcn and licences were checked against the projects' GitHub repositories, cloned on 2026-10-10. Items marked **[S]** come from search summaries and need a direct check before they are cited publicly.

## 1. shadcn registry (the distribution format to adopt)

Source: `shadcn-ui/ui` docs and source at HEAD, 2026-10-10.

### Item schema

Defined in `registry-item.json`.

- **Required fields:** `name`, `type`.
- **Optional fields:** `title`, `description`, `author`, `dependencies`, `devDependencies`, `registryDependencies`, `files[]`, `cssVars{theme, light, dark}`, `css`, `envVars`, `meta` (free-form), `docs` (a message printed when the item is installed), `categories[]`.
- **Types:** `registry:lib`, `block`, `component`, `ui`, `hook`, `theme`, `page`, `file`, `style`, `base`, `font`, `item`.
- **Files:** each entry has `path`, `content`, `type` and `target`. `target` is required for `page` and `file`.

### Building and installing

- **Build:** `shadcn build` writes `public/r/<name>.json`. `shadcn registry validate` checks a registry (added 2026-05-20).
- **Namespaces:** `@ns` support arrived with CLI 3.0 (2025-08-27). There is "no central registrar".
- **Registry Directory:**
  - You get listed through a PR to `apps/v4/registry/directory.json`.
  - It held 434 namespaces on 2026-10-10.
  - An experimental "Registry Health" check affects ordering.
- **GitHub registries (2026-06-01):** `npx shadcn add owner/repo/item` installs straight from a root `registry.json`, with no build or hosting step. Private repos work through `gh` or `GH_TOKEN` (2026-08-24).
- **Universal items (2025-07-11):** an item can ship any file, including rules and AGENTS.md files.

### shadcn MCP server

- **Setup:** `npx shadcn@latest mcp init --client …`.
- **Tools:** search, list and view items; get examples; get the add command; get an audit checklist.

### What this means for Tessli

- Tessli doesn't need its own installer.
- Ship a GitHub registry and list `@tessli`.
- Carry the taste notes in `meta.tessli`, plus a `registry:file` rules file.

## 2. Landscape

| Library | Licence and price | Distribution | Per-item "when to use / not" reasoning |
|---|---|---|---|
| 21st.dev | Platform with an API key; "21st MCP" [S] | shadcn format | No |
| shadcnblocks | Paid. Licence bars redistribution and building UI libraries [S] | `@shadcnblocks` | No |
| Kibo UI | MIT; acquired by shadcnblocks in 2025 [S] | `@kibo-ui` | No |
| Magic UI | MIT; Pro is paid | `@magicui`, llms.txt, a skill, MCP | Generic motion advice only |
| Aceternity | Free plus Pro; licence unverified | `@aceternity` | No |
| coss.com/ui (formerly Origin UI) | Components MIT inside an AGPL repo | `@coss`, llms.txt, a skill | **Yes, for its own primitives** |
| Tailark | Free MIT; Pro behind a key [S] | `@tailark` | No |
| Untitled UI React | Free MIT; Pro is paid [S] | CLI, MCP | No |
| Tailwind Plus | Paid. **Can't be redistributed as a component library** [S] | Copy-paste | No |
| HyperUI, Flowbite, daisyUI | MIT (Flowbite and daisyUI also sell Pro) | Sites, llms.txt, MCPs [S] | No |

**Conclusion:**

- **Crowded:** block and component registries, animated marketing sections, install-via-MCP, llms.txt, generic anti-slop skills.
- **Open:**
  - structured judgment per item at section and page level;
  - "common default vs. this" contrasts;
  - a public, reproducible taste evaluation;
  - cross-library curation.

## 3. Giving coding agents taste: what exists and what's proven

- **Anthropic `frontend-design` skill:** Apache-2.0, `anthropics/skills`, HEAD 2026-10-09. The 2025-11-12 announcement shows qualitative before/after examples, with no metrics.
  - It lists current AI-generated "default" looks, quoted verbatim: "a warm cream background (near #F4F1EA) with a high-contrast serif display and a terracotta or warm-clay accent". Its "template chrome" includes "a tracked-out ALL-CAPS eyebrow label above every heading", numbered markers on non-sequences, and "a '→' appended to link and button text".
  - **This directly affects Tessli's house style. See plan §4.**
- **Vercel, "AGENTS.md outperforms skills in our agent evals" (2026-01-27) [S]:**
  - A compact, roughly 8 KB docs index in AGENTS.md reached a 100% pass rate.
  - A skill reached 53%, the same as no docs. It reached 79% when the agent was explicitly told to use it.
  - **Scope:** this measured Next.js API correctness, not visual quality.
- **Research:**
  - UICrit (UIST 2024): LLM UI critique improved with few-shot visual examples but stayed below human designers.
  - Apple (arXiv 2509.16779, 2025): designer-annotation fine-tuning beat the baselines in human evaluation [S].
- **Storybook MCP:** ships with an eval harness that grades build, types, lint, tests and accessibility. It doesn't grade taste.
- **Bottom line:** no public controlled study shows that a component library plus rules improves the design quality of AI-built UI. That gap is Tessli's Taste Bench (plan §9).

## 4. Community directories: moderation precedents

- **sindresorhus/awesome:**
  - PR checklist; "fully AI-generated PRs not accepted".
  - Submitters review other PRs.
  - `awesome-lint`.
- **awesome-selfhosted-data:**
  - One YAML file per entry; one item per PR.
  - CI lint and export.
  - Daily dead-link and unmaintained checks.
- **lychee-action v2:**
  - Scheduled link check; opens an issue through `create-issue-from-file`.
  - Use `--cache` and `fail: false` for scheduled runs.
- **GitHub issue forms (`.github/ISSUE_TEMPLATE/*.yml`):** they can only mark fields required. Real validation needs an Action.

## 5. Licensing notes

- **Code licence:** MIT is the ecosystem norm for component code, as with Magic UI, Kibo, HyperUI, Flowbite, daisyUI and coss components.
- **DCO vs CLA:** a DCO is a lighter per-commit sign-off. The trade-off is that relicensing later is harder.
- **Paid kits:** Tailwind Plus and shadcnblocks licences forbid redistribution and building libraries, so reject ports and "recreations" of their items [S].
- **AI-generated work:** the US Copyright Office's 2025 report says AI output without sufficient human control isn't copyrightable [S]. Require disclosure and real human review.
- **Third-party site screenshots:** the more a gallery substitutes for the original, the weaker its fair-use position [S]. Render Tessli's own items; don't mirror third-party sites.

## 6. Sources

- github.com/shadcn-ui/ui: `apps/v4/content/docs/**`, `apps/v4/registry/directory.json`, `packages/shadcn/src/mcp/index.ts` (HEAD 2026-10-10)
- github.com/anthropics/skills: `skills/frontend-design/SKILL.md` (HEAD 2026-10-09)
- GitHub repos cloned 2026-10-10:
  - 21st-dev/magic-mcp, magicuidesign/magicui, cosscom/coss, shadcnblocks/kibo
  - untitleduico/react, markmead/hyperui, themesberg/flowbite, saadeghi/daisyui
  - vercel/registry-starter, storybookjs/mcp
  - sindresorhus/awesome, awesome-selfhosted/awesome-selfhosted-data, lycheeverse/lychee-action
- https://claude.com/blog/improving-frontend-design-through-skills (2025-11-12)
- https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals (2026-01-27) [S]
- https://tailwindcss.com/plus/license [S]; https://www.shadcnblocks.com/license [S]
- https://arxiv.org/abs/2407.08850; https://arxiv.org/abs/2509.16779 [S]
- https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms
