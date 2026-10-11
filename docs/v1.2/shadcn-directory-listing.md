# Listing Tessli in the shadcn registry directory

Plan §6.6 and Phase 4 list Tessli in the shadcn directory as `@tessli`, so `npx shadcn add @tessli/<item>` works with no configuration. This file is the entry, the pull request text and the checks to run first. **Nobody has opened this pull request.** The owner opens it, once the pre-flight checklist below passes.

Researched on 2026-10-11 from `shadcn-ui/ui@main`:

- the directory: [`apps/v4/registry/directory.json`](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/directory.json), 434 entries, none named `@tessli`;
- the rules for adding one: [`apps/v4/content/docs/registry/registry-index.mdx`](https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/registry/registry-index.mdx);
- the schema the validation script applies: [`apps/v4/lib/registry-directory.ts`](https://github.com/shadcn-ui/ui/blob/main/apps/v4/lib/registry-directory.ts), run by `pnpm validate:registries` ([`apps/v4/scripts/validate-registries.mts`](https://github.com/shadcn-ui/ui/blob/main/apps/v4/scripts/validate-registries.mts));
- the Registry Health monitor that starts watching an entry once it is merged: [`apps/v4/lib/registry-health/monitor.ts`](https://github.com/shadcn-ui/ui/blob/main/apps/v4/lib/registry-health/monitor.ts).

## What the directory needs

Each entry is a JSON object with exactly these keys (the schema is strict, so any other key fails validation):

| Key           | Rule                                                                                                  |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| `name`        | The namespace: `@` then letters, digits, `_` or `-`. Unique, ignoring case.                           |
| `homepage`    | A URL.                                                                                                |
| `url`         | A URL that contains `{name}`. The CLI and the monitor replace `{name}` with an item name.             |
| `description` | Free text. Current entries run from 21 to 355 characters.                                             |
| `logo`        | An inline SVG string. Most entries use `var(--foreground)` so the mark follows the directory's theme. |
| `author`      | Optional.                                                                                             |

The docs add four requirements: the registry is open source and public; it conforms to the registry schema; it is **flat**, meaning `{name}` resolves both the index (`registry`) and every item at the same level; and a `files` array in the index carries no `content`.

### GitHub `owner/repo` or a hosted URL?

The directory only takes a hosted URL template. The docs say so directly: "You do not need to submit a public GitHub registry to the registry directory to use it with `owner/repo/item` addresses. The registry directory is for namespaces such as `@acme`." So `npx shadcn add online-scope-lab/tessli/<item>` (which reads the root [`registry.json`](../../registry.json)) keeps working without a listing, and `@tessli` needs a URL with `{name}`.

Tessli already publishes one JSON file per item, with its code inlined, at `web/public/r/<slug>.json` (served at `/r/<slug>.json`), plus `web/public/r/rules.json`. From this change it also generates [`web/public/r/registry.json`](../../web/public/r/registry.json), a copy of the root index, because the Registry Health monitor fetches `url` with `{name}` set to `registry` and checks that its `name` matches the namespace (`tessli` matches `@tessli`). `npm run registry:check` keeps it in sync, and `registry` is now a reserved item slug.

Two URL templates resolve that layout:

1. **Hosted, recommended:** `https://tessli.vercel.app/r/{name}.json`. It matches the `homepage`, the `docs` links inside every item and the 397 of 434 entries that use the `<origin>/r/{name}.json` shape. It needs the site deployed from `main` at that domain. **Verified on 2026-10-11**; see [Pre-flight status](#pre-flight-status).
2. **Fallback:** `https://raw.githubusercontent.com/Online-Scope-Lab/tessli/main/web/public/r/{name}.json`. On 2026-10-11 `…/r/pricing-tiers.json` answered HTTP 200 from `main`. Five directory entries already use `raw.githubusercontent.com`. Its costs: GitHub serves it as `text/plain` (the CLI accepts that; the health monitor records it), and it ties the namespace to a repository path.

**Checked locally on 2026-10-11** against `next start` with `"@tessli": "http://127.0.0.1:3000/r/{name}.json"` in a test project's `components.json`, using shadcn CLI 4.21.4: `shadcn search @tessli` lists all 13 items from `/r/registry.json`, and `shadcn view @tessli/faq` and `@tessli/rules` resolve their item files. `shadcn add @tessli/faq` passed the registry check but could not finish, because this session's network blocks `ui.shadcn.com`, which the CLI calls for base colours. The full install is pre-flight step 3.

Changing the URL later takes another pull request to shadcn-ui/ui, so list the domain Tessli intends to keep. If a custom domain is planned, list after it is live.

## The entry

Insert it in alphabetical position, after `@terrae` and before `@tetra-ui` (the file is mostly, not strictly, alphabetical):

```json
{
  "name": "@tessli",
  "homepage": "https://tessli.vercel.app/library",
  "url": "https://tessli.vercel.app/r/{name}.json",
  "description": "Sections, pages and components on shadcn/ui primitives, each with notes on when to use it, when not to, the UI rules it follows and the generic default it replaces. Also installs a compact rules file, TESSLI.md.",
  "author": "Online Scope",
  "logo": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><path fill='var(--foreground)' d='M7 7h18v5.2h-1.1c-.4-2-1.3-2.9-3.4-2.9h-2.6v13.3c0 1.3.6 1.8 2.3 1.9v1h-8.4v-1c1.7-.1 2.3-.6 2.3-1.9V9.3h-2.6c-2.1 0-3 .9-3.4 2.9H7z'/><circle cx='25' cy='23.9' r='2.1' fill='#f05217'/></svg>"
}
```

- The `logo` is the Tessli mark from [`web/app/icon.svg`](../../web/app/icon.svg) without its off-white tile, with the letter set to `var(--foreground)` and the orange signal dot kept. The mark is excluded from the MIT licence ([`TRADEMARKS.md`](../../TRADEMARKS.md)); the owner submitting it is the rights holder's choice to make.
- The `description` says what the items are, not what they do for anyone's output: no claim about AI output or taste (plan §2). It does not say "reviewed": at the time of writing every item is `community` and every rule a draft.
- With the fallback URL, change only `url`.

## Pull request

**Title:** `feat(registry): add @tessli to the registry directory`

Before opening, check the titles of the most recently merged directory pull requests and match their convention if it differs.

**Body:**

```markdown
Adds `@tessli` to `apps/v4/registry/directory.json`.

Tessli is an open-source (MIT) UI library on shadcn/ui primitives. Each item ships its reasoning as data: when to use it, when not to, the UI rules it follows and the generic default it replaces, in `meta.tessli` on the registry item. It also publishes `@tessli/rules`, a `registry:file` item that installs a compact rules index as `TESSLI.md`.

- Homepage: https://tessli.vercel.app/library
- Registry index: https://tessli.vercel.app/r/registry.json (flat; items at `/r/{name}.json`, files without `content` in the index)
- Source: https://github.com/Online-Scope-Lab/tessli (the root `registry.json` also works as a GitHub registry)

Checked:

- [x] `pnpm validate:registries` passes
- [x] `/r/registry.json` and every `/r/{name}.json` return 200 with JSON
- [x] `npx shadcn@latest add @tessli/pricing-tiers` and `@tessli/rules` install into a fresh Next.js + shadcn/ui project with `"@tessli": "https://tessli.vercel.app/r/{name}.json"` in `components.json`, and the project builds
```

Tick the boxes only after running each check.

## Pre-flight checklist

All must be true before the pull request is opened:

1. **This change is on `main`**, so `web/public/r/registry.json` exists, and `npm run registry:check` passes there.
2. **The site is deployed from `main` at `https://tessli.vercel.app`** (or the fallback URL is used). From a machine outside Vercel, each of these returns HTTP 200 with a JSON body and no login, Vercel Deployment Protection page or bot challenge:

   ```bash
   curl -fsS https://tessli.vercel.app/r/registry.json | jq -r .name          # tessli
   curl -fsS https://tessli.vercel.app/r/pricing-tiers.json | jq -r .name     # pricing-tiers
   curl -fsS https://tessli.vercel.app/r/rules.json | jq -r .name             # rules
   curl -fsSI https://tessli.vercel.app/library | head -1                     # 200
   ```

   Every name in `registry.json`'s `items` must resolve the same way: `jq -r '.items[].name' | while read n; do curl -fsS -o /dev/null "https://tessli.vercel.app/r/$n.json" || echo "missing $n"; done`.

3. **A fresh install works through the namespace.** In a new Next.js app with `npx shadcn@latest init`, add `"registries": { "@tessli": "https://tessli.vercel.app/r/{name}.json" }` to `components.json`, then run `npx shadcn@latest add @tessli/pricing-tiers` and `npx shadcn@latest add @tessli/rules`. Expect `components/pricing-tiers.tsx` importing `@/components/ui/button` and `@/lib/utils`, `button` installed from shadcn/ui, `TESSLI.md` at the project root, and `npm run build` passing.
4. **The namespace is still free:** `@tessli` is not in the current `directory.json` (case-insensitive).
5. **The entry validates:** in a fork of `shadcn-ui/ui`, add the entry, run `pnpm install` and `pnpm validate:registries`, and see all checks pass.
6. **The owner confirms** the domain is the one to keep, the logo and the description.
7. **Claims still hold:** the description names no reviewed items, ratings or counts, and nothing on the homepage says Tessli improves AI output.

## Pre-flight status

Run on 2026-10-11 against the live site:

| Step               | Result                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1. On `main`       | ✅ `web/public/r/registry.json` is on `main` and `npm run registry:check` passes.                                                                                                                                                                                                                                                                                              |
| 2. Served publicly | ✅ `/r/registry.json` (`name: tessli`, 13 items) and every item file, `rules.json` included, return 200 with `application/json` and no login or challenge. `/library` returns 200.                                                                                                                                                                                             |
| 3. Fresh install   | ✅ In a new `create-next-app` project after `npx shadcn@latest init`, with `"@tessli": "https://tessli.vercel.app/r/{name}.json"` in `components.json`: `add @tessli/pricing-tiers` created `components/pricing-tiers.tsx`, importing `@/components/ui/button` and `@/lib/utils`. `add @tessli/rules` created `TESSLI.md`. `npm run build` passed with the component imported. |
| 4. Namespace free  | ✅ `@tessli` is not among the 435 entries in `https://ui.shadcn.com/r/registries.json`.                                                                                                                                                                                                                                                                                        |
| 5. Entry validates | ⏳ Owner: run `pnpm validate:registries` in a fork of `shadcn-ui/ui` with the entry added.                                                                                                                                                                                                                                                                                     |
| 6. Owner confirms  | ⏳ Owner: confirm `tessli.vercel.app` is the domain to keep, and approve the logo and description.                                                                                                                                                                                                                                                                             |
| 7. Claims hold     | ✅ The description names no reviewed items, ratings or counts.                                                                                                                                                                                                                                                                                                                 |

After the merge, `npx shadcn@latest add @tessli/<item>` works with no configuration, and the Registry Health page starts reporting on the index, a daily sample of items and a dry-run install. Update `/for-ai`, the README and `skills/tessli/SKILL.md` to show the `@tessli/<item>` form next to `online-scope-lab/tessli/<item>` in a follow-up change.
