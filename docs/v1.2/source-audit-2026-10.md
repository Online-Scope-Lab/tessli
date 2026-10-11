# Source audit, October 2026

Date: 2026-10-11
Scope: the 129 sources that were `active` or `needs-review` (archived sources were not rechecked).
Method: this sandbox's network blocks direct requests to most sites, so liveness and redirects came from a third-party redirect checker and web search. Maintenance and quality notes come from web search only. Treat each note as a lead for the owner to confirm, not as a verified fact.

## Applied in this change

| Source                                                            | Change                                                                                                                                   | Evidence                                                                                                                                                                                 |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `godly`                                                           | Name → "Recent.Design (formerly Godly)", URL → `https://recent.design`; the archived `recent-design` record now has `replaced_by: godly` | `godly.website` redirects to `recent.design` (also found by the suggest-source check, issue #155). The catalogue check now allows an archived source to share a URL with its replacement |
| `lenis`                                                           | URL → `https://lenis.dev`                                                                                                                | `lenis.darkroom.engineering` redirects there                                                                                                                                             |
| `relume`                                                          | URL → `https://www.relume.ai`                                                                                                            | `relume.io` redirects there                                                                                                                                                              |
| `shopify-polaris`                                                 | URL → `https://shopify.dev/docs/api/app-home/web-components`; `needs-review` → `active`                                                  | Polaris React is deprecated and archived; Polaris now ships as web components documented on shopify.dev                                                                                  |
| `origin-ui` (coss UI)                                             | `needs-review` → `active`                                                                                                                | `coss.com/ui` is live and is the renamed Origin UI                                                                                                                                       |
| `react-aria`                                                      | `needs-review` → `active`                                                                                                                | `react-aria.adobe.com` is live (React Aria's new docs site)                                                                                                                              |
| `v0`                                                              | `needs-review` → `active`                                                                                                                | `v0.app` is live and actively developed                                                                                                                                                  |
| `fffuel`, `heroui`, `ibm-carbon-design-system`, `realtime-colors` | URL changed to the host it redirects to (`www.` added or removed)                                                                        | Permanent redirect                                                                                                                                                                       |

## Flagged for the owner: weak

Live, but possibly not worth keeping in a directory for thoughtful UI work. Decide keep or archive; archiving needs a reason.

| Source                         | Concern                                                                                                           |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `happy-hues`                   | About 17 static palettes from 2019; no sign of updates since                                                      |
| `variable-fonts` (v-fonts.com) | Still labelled "limited beta"; last technical update reported in 2021                                             |
| `who-can-use`                  | Useful, but its repo has had no push since June 2024                                                              |
| `realtime-colors`              | Repo and docs reported unchanged since 2023–24                                                                    |
| `landingfolio`                 | Upsell-heavy: templates and components behind paid plans                                                          |
| `saasframe`                    | Paid-only Pro; no free plan reported                                                                              |
| `page-flows`                   | Paid-only ($99/yr)                                                                                                |
| `lordicon`                     | Most of the library behind Pro; free icons need attribution                                                       |
| `streamline`                   | Full use needs a paid subscription; free sets need attribution                                                    |
| `tailwind-plus`                | Reported closed to new customers after a reported acquisition of Tailwind Labs (Sept 2026); confirm before acting |

Kept as fine but upsell-heavy, worth a `limitations` line: `aceternity-ui`, `coolors`, `flowbite`, `kibo-ui`, `mobbin`, `relume`, `uiverse`, `framer` (a paid product rather than a resource).

## Flagged for the owner: unclear

Live, but search found no dated activity in the last ~18 months. Open each and decide.

`404s`, `60fps`, `bentogrids`, `built-for-mars`, `cta-gallery`, `haikei`, `ios-icon-gallery`, `landing-love`, `lapa-ninja` (blocks automated checks), `navbar-gallery`, `nicelydone`, `one-page-love`, `pricing-pages`, `saas-pages`, `supahero`, `typewolf`, `wise-design`.

## Everything else

The remaining checked sources looked live and maintained, with no flags.
