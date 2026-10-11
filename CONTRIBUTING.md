# Contributing to Tessli

Thanks for helping. Tessli has no accounts or in-site forms: every contribution is a GitHub issue or a pull request, and GitHub's own login and moderation do the rest.

Please read the [Code of Conduct](CODE_OF_CONDUCT.md) first. By contributing you agree that your work is released under the [MIT licence](LICENSE). The Tessli name, wordmark and hero artwork are not part of that licence; see [TRADEMARKS.md](TRADEMARKS.md).

## Ways to contribute

| You have                                  | Do this                                                                                                                                                                                                                  | It lands as                                                                              |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| A good design or frontend source          | Open a [**Suggest a source**](https://github.com/Online-Scope-Lab/tessli/issues/new?template=suggest-source.yml) issue                                                                                                   | Issue labelled `source:suggestion`; a maintainer or contributor turns it into a small PR |
| A design (screenshot or Figma link)       | Open a [**Submit a design**](https://github.com/Online-Scope-Lab/tessli/issues/new?template=submit-design.yml) issue                                                                                                     | Issue labelled `design:needs-implementation`, which developers can pick up               |
| Code for a library item                   | Open a pull request (see [Contribute an item](#contribute-an-item))                                                                                                                                                      | PR checked by CI, then reviewed by maintainers                                           |
| A broken link, wrong information or a bug | Open a [**Report a source problem**](https://github.com/Online-Scope-Lab/tessli/issues/new?template=report-source.yml) or [**Bug report**](https://github.com/Online-Scope-Lab/tessli/issues/new?template=bug.yml) issue | Issue                                                                                    |

Designers and developers who build an item from a submitted design are both credited on the item.

### Contribute an item

**Honest status: the library is not open for item contributions yet.** Tessli v1.2 is in progress. Today the site is the curated Sources directory. The library, the item template (`web/registry/_template/`) and the CI checks for items arrive in Phase 2, and the first items are built and reviewed by the maintainers to set the bar. Until then, the most useful contributions are source suggestions, design submissions, problem reports and fixes to the existing site.

When the template lands, an item will be a folder you copy, fill in and open as a PR. The [item checklist](#item-checklist) below is the bar it will be reviewed against.

## Local setup

You need Node.js 22 or later and npm.

```bash
git clone https://github.com/Online-Scope-Lab/tessli.git
cd tessli/web
npm ci
npm run dev
```

Before opening a PR, run the checks from `web/`:

```bash
npm run format:check
npm run typecheck
npm run lint
npm test
npm run catalogue:check
npm run build
```

(`npm run format` fixes formatting. A single `npm run check` command will replace this list.)

Branch from the latest `main`, keep one focused change per PR, and fill in the pull request template.

## Item checklist

A library item is accepted as `community` only when all of these are true:

- **Semantic tokens only.** No hard-coded brand colours, fonts or spacing values.
- **Works in all three themes:** Tessli, Neutral and Dark.
- **Works at 1440, 1024, 768, 390 and 320 px** with no horizontal overflow.
- **States are covered** where they apply: loading, empty, error and success.
- **Accessible:** semantic HTML and landmarks, full keyboard use, a visible `:focus-visible` state, adequate touch targets, reduced-motion support, no information shown only on hover or only by colour, and WCAG 2.2 AA contrast.
- **`notes.md` is filled in:** use when, avoid when, rules, the common AI default it replaces, failures, states, responsive behaviour, accessibility notes, contributors, provenance and licence.
- **`status: community`.** Only a maintainer can mark an item `reviewed`, by signing it with their GitHub handle and a date. Don't set `reviewed_by` or `reviewed_at` yourself.
- **Realistic but clearly fictional demo content.**

## Contribution rules

These are enforced in review.

- **Original work only.** No ports or "recreations" of paid kits such as Tailwind Plus or shadcnblocks; their licences forbid it.
- **Adapted open-source work must name its source and licence**, both in `notes.md` and in the PR description.
- **No invented metrics, logos or testimonials.** No fake ratings, user counts, customer logos, quotes or verification claims, in demo content or anywhere else. Fictional content must look clearly fictional.
- **AI assistance is allowed but must be disclosed** in the PR, and a human must have actually reviewed the result. Unreviewed AI-generated work is rejected, because human judgment is the point of Tessli.
- **No new dependency without a one-line reason** in the PR description.
- **Sources are never deleted silently.** A source that should go is archived with a reason, so its ID, history and old links survive.

## Sign-off (DCO)

Tessli uses the [Developer Certificate of Origin](https://developercertificate.org/) instead of a CLA. Sign off every commit:

```bash
git commit -s -m "feat: add two-tier pricing section"
```

This adds a `Signed-off-by: Your Name <you@example.com>` line, which certifies that you wrote the change or have the right to submit it under the project's licence. To sign off commits you already made on your branch, run `git rebase --signoff main` and force-push your branch (never `main`).

## Questions

Open an issue. For conduct concerns, follow the private reporting route in the [Code of Conduct](CODE_OF_CONDUCT.md#enforcement).
