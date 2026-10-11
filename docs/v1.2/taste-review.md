# Taste review checklist

Every library item is `community` and every rule is `draft` until a maintainer signs it (see [Community and reviewed](../../CONTRIBUTING.md#community-and-reviewed)). This checklist is for that sign-off. Work through one item at a time; an item takes about 10–15 minutes.

## How to review an item

1. Open its library page (it shows the notes, rules and code) and each state below in the three themes. Resize the browser to 1440, 768, 390 and 320 px wide (or use the browser's device toolbar).
2. Tick each check:
   - [ ] **It looks right** in Tessli, Neutral and Dark at every width: nothing overflows sideways, nothing overlaps, text is readable.
   - [ ] **Every state makes sense**: loading, empty and error states say what happened and what to do next.
   - [ ] **The keyboard works**: Tab reaches every control in order, focus is always visible, Escape closes anything that opens.
   - [ ] **The notes are honest**: "use when" and "don't use when" match the item, and the "AI default" it replaces is a real, recognisable failure.
   - [ ] **Each listed rule is really followed**: open the rule, read its _How to check_, and check the item against it. Remove any rule it does not meet.
   - [ ] **No invented proof**: demo content is clearly fictional (Northwind Notes) with no fake ratings, logos or user counts.
3. Decide:
   - **Sign it**: in `web/registry/items/<slug>/notes.md` set `status: reviewed`, `reviewed_by: [<your GitHub handle>]`, `reviewed_at: <today, YYYY-MM-DD>`. Run `npm run registry:build` in `web/` and open a PR. A second maintainer approving the PR is the second pair of eyes.
   - **Not yet**: open an issue naming the item and what fails, label `enhancement`. Leave it `community`.

Rules are signed the same way in `rules/<ID>.md` (`status: reviewed`, `reviewed_by`, `reviewed_at`), after reading the rule's _Why_, _How to check_ and _Sources_ and confirming at least one item applies it correctly.

## Items

### Sign-in and sign-up with validation (`auth-forms`, page)

- [ ] Signed · [library page](https://tessli.vercel.app/library/auth-forms)
- `sign-in`: [Tessli](https://tessli.vercel.app/preview/auth-forms?state=sign-in) · [Neutral](https://tessli.vercel.app/preview/auth-forms?state=sign-in&theme=neutral) · [Dark](https://tessli.vercel.app/preview/auth-forms?state=sign-in&theme=dark)
- `sign-in-errors`: [Tessli](https://tessli.vercel.app/preview/auth-forms?state=sign-in-errors) · [Neutral](https://tessli.vercel.app/preview/auth-forms?state=sign-in-errors&theme=neutral) · [Dark](https://tessli.vercel.app/preview/auth-forms?state=sign-in-errors&theme=dark)
- `signing-in`: [Tessli](https://tessli.vercel.app/preview/auth-forms?state=signing-in) · [Neutral](https://tessli.vercel.app/preview/auth-forms?state=signing-in&theme=neutral) · [Dark](https://tessli.vercel.app/preview/auth-forms?state=signing-in&theme=dark)
- `sign-in-failed`: [Tessli](https://tessli.vercel.app/preview/auth-forms?state=sign-in-failed) · [Neutral](https://tessli.vercel.app/preview/auth-forms?state=sign-in-failed&theme=neutral) · [Dark](https://tessli.vercel.app/preview/auth-forms?state=sign-in-failed&theme=dark)
- `sign-up`: [Tessli](https://tessli.vercel.app/preview/auth-forms?state=sign-up) · [Neutral](https://tessli.vercel.app/preview/auth-forms?state=sign-up&theme=neutral) · [Dark](https://tessli.vercel.app/preview/auth-forms?state=sign-up&theme=dark)
- `sign-up-errors`: [Tessli](https://tessli.vercel.app/preview/auth-forms?state=sign-up-errors) · [Neutral](https://tessli.vercel.app/preview/auth-forms?state=sign-up-errors&theme=neutral) · [Dark](https://tessli.vercel.app/preview/auth-forms?state=sign-up-errors&theme=dark)
- `check-email`: [Tessli](https://tessli.vercel.app/preview/auth-forms?state=check-email) · [Neutral](https://tessli.vercel.app/preview/auth-forms?state=check-email&theme=neutral) · [Dark](https://tessli.vercel.app/preview/auth-forms?state=check-email&theme=dark)
- Rules it claims: [A-04](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/A-04.md) Label every control, [C-02](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/C-02.md) Never colour alone, [ST-03](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/ST-03.md) State changes don't move the page, [ST-04](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/ST-04.md) Errors explain and offer a way out, [W-04](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/W-04.md) Answer first, [A-05](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/A-05.md) Announce changes in place, [H-01](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/H-01.md) One primary action per surface, [A-01](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/A-01.md) 44px touch targets

### Closing CTA and footer (`closing-cta-footer`, section)

- [ ] Signed · [library page](https://tessli.vercel.app/library/closing-cta-footer)
- `default`: [Tessli](https://tessli.vercel.app/preview/closing-cta-footer) · [Neutral](https://tessli.vercel.app/preview/closing-cta-footer?theme=neutral) · [Dark](https://tessli.vercel.app/preview/closing-cta-footer?theme=dark)
- `footer-only`: [Tessli](https://tessli.vercel.app/preview/closing-cta-footer?state=footer-only) · [Neutral](https://tessli.vercel.app/preview/closing-cta-footer?state=footer-only&theme=neutral) · [Dark](https://tessli.vercel.app/preview/closing-cta-footer?state=footer-only&theme=dark)
- Rules it claims: [H-01](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/H-01.md) One primary action per surface, [W-01](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/W-01.md) Headings make a specific point, [W-02](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/W-02.md) Action labels name the outcome, [W-05](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/W-05.md) Arrows only for leaving, [S-02](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/S-02.md) One shared edge, [K-02](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/K-02.md) Links go, buttons do, [R-01](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/R-01.md) Recompose for small screens, [A-01](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/A-01.md) 44px touch targets

### Dashboard overview (`dashboard-overview`, page)

- [ ] Signed · [library page](https://tessli.vercel.app/library/dashboard-overview)
- `default`: [Tessli](https://tessli.vercel.app/preview/dashboard-overview) · [Neutral](https://tessli.vercel.app/preview/dashboard-overview?theme=neutral) · [Dark](https://tessli.vercel.app/preview/dashboard-overview?theme=dark)
- `loading`: [Tessli](https://tessli.vercel.app/preview/dashboard-overview?state=loading) · [Neutral](https://tessli.vercel.app/preview/dashboard-overview?state=loading&theme=neutral) · [Dark](https://tessli.vercel.app/preview/dashboard-overview?state=loading&theme=dark)
- `empty`: [Tessli](https://tessli.vercel.app/preview/dashboard-overview?state=empty) · [Neutral](https://tessli.vercel.app/preview/dashboard-overview?state=empty&theme=neutral) · [Dark](https://tessli.vercel.app/preview/dashboard-overview?state=empty&theme=dark)
- `error`: [Tessli](https://tessli.vercel.app/preview/dashboard-overview?state=error) · [Neutral](https://tessli.vercel.app/preview/dashboard-overview?state=error&theme=neutral) · [Dark](https://tessli.vercel.app/preview/dashboard-overview?state=error&theme=dark)
- Rules it claims: [H-01](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/H-01.md) One primary action per surface, [W-01](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/W-01.md) Headings make a specific point, [W-03](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/W-03.md) No invented proof, [W-04](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/W-04.md) Answer first, [T-03](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/T-03.md) Tabular figures for compared numbers, [C-02](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/C-02.md) Never colour alone, [ST-01](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/ST-01.md) Every data region has its states, [R-01](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/R-01.md) Recompose for small screens

### Data table with filters and states (`data-table`, component)

- [ ] Signed · [library page](https://tessli.vercel.app/library/data-table)
- `default`: [Tessli](https://tessli.vercel.app/preview/data-table) · [Neutral](https://tessli.vercel.app/preview/data-table?theme=neutral) · [Dark](https://tessli.vercel.app/preview/data-table?theme=dark)
- `loading`: [Tessli](https://tessli.vercel.app/preview/data-table?state=loading) · [Neutral](https://tessli.vercel.app/preview/data-table?state=loading&theme=neutral) · [Dark](https://tessli.vercel.app/preview/data-table?state=loading&theme=dark)
- `empty`: [Tessli](https://tessli.vercel.app/preview/data-table?state=empty) · [Neutral](https://tessli.vercel.app/preview/data-table?state=empty&theme=neutral) · [Dark](https://tessli.vercel.app/preview/data-table?state=empty&theme=dark)
- `no-results`: [Tessli](https://tessli.vercel.app/preview/data-table?state=no-results) · [Neutral](https://tessli.vercel.app/preview/data-table?state=no-results&theme=neutral) · [Dark](https://tessli.vercel.app/preview/data-table?state=no-results&theme=dark)
- `error`: [Tessli](https://tessli.vercel.app/preview/data-table?state=error) · [Neutral](https://tessli.vercel.app/preview/data-table?state=error&theme=neutral) · [Dark](https://tessli.vercel.app/preview/data-table?state=error&theme=dark)
- Rules it claims: [ST-01](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/ST-01.md) Every data region has its states, [ST-02](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/ST-02.md) Empty states differ by cause, [ST-03](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/ST-03.md) State changes don't move the page, [ST-04](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/ST-04.md) Errors explain and offer a way out, [S-03](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/S-03.md) Density fits the task, [T-03](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/T-03.md) Tabular figures for compared numbers, [A-05](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/A-05.md) Announce changes in place, [R-02](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/R-02.md) Reflow at 320 without sideways scroll

### Empty state that says why and what next (`empty-state`, component)

- [ ] Signed · [library page](https://tessli.vercel.app/library/empty-state)
- `first-use`: [Tessli](https://tessli.vercel.app/preview/empty-state?state=first-use) · [Neutral](https://tessli.vercel.app/preview/empty-state?state=first-use&theme=neutral) · [Dark](https://tessli.vercel.app/preview/empty-state?state=first-use&theme=dark)
- `no-results`: [Tessli](https://tessli.vercel.app/preview/empty-state?state=no-results) · [Neutral](https://tessli.vercel.app/preview/empty-state?state=no-results&theme=neutral) · [Dark](https://tessli.vercel.app/preview/empty-state?state=no-results&theme=dark)
- `error`: [Tessli](https://tessli.vercel.app/preview/empty-state?state=error) · [Neutral](https://tessli.vercel.app/preview/empty-state?state=error&theme=neutral) · [Dark](https://tessli.vercel.app/preview/empty-state?state=error&theme=dark)
- Rules it claims: [H-02](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/H-02.md) Headings follow the outline, [S-02](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/S-02.md) One shared edge, [C-02](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/C-02.md) Never colour alone, [W-02](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/W-02.md) Action labels name the outcome, [ST-01](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/ST-01.md) Every data region has its states, [ST-02](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/ST-02.md) Empty states differ by cause, [ST-04](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/ST-04.md) Errors explain and offer a way out, [A-01](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/A-01.md) 44px touch targets

### FAQ that answers real objections (`faq`, section)

- [ ] Signed · [library page](https://tessli.vercel.app/library/faq)
- `default`: [Tessli](https://tessli.vercel.app/preview/faq) · [Neutral](https://tessli.vercel.app/preview/faq?theme=neutral) · [Dark](https://tessli.vercel.app/preview/faq?theme=dark)
- Rules it claims: [H-02](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/H-02.md) Headings follow the outline, [S-02](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/S-02.md) One shared edge, [K-01](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/K-01.md) Native elements first, [W-04](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/W-04.md) Answer first, [R-03](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/R-03.md) Break where the content breaks, [M-01](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/M-01.md) Motion only explains change, [M-02](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/M-02.md) Respect reduced motion, [A-06](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/A-06.md) Keyboard complete, nothing hover-only

### Feature section, evidence-led (`feature-evidence`, section)

- [ ] Signed · [library page](https://tessli.vercel.app/library/feature-evidence)
- `default`: [Tessli](https://tessli.vercel.app/preview/feature-evidence) · [Neutral](https://tessli.vercel.app/preview/feature-evidence?theme=neutral) · [Dark](https://tessli.vercel.app/preview/feature-evidence?theme=dark)
- `two-features`: [Tessli](https://tessli.vercel.app/preview/feature-evidence?state=two-features) · [Neutral](https://tessli.vercel.app/preview/feature-evidence?state=two-features&theme=neutral) · [Dark](https://tessli.vercel.app/preview/feature-evidence?state=two-features&theme=dark)
- Rules it claims: [K-04](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/K-04.md) No identical card grids, [W-01](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/W-01.md) Headings make a specific point, [W-03](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/W-03.md) No invented proof, [C-03](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/C-03.md) The accent is scarce, [H-02](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/H-02.md) Headings follow the outline, [T-01](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/T-01.md) Readable line length, [T-03](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/T-03.md) Tabular figures for compared numbers, [R-01](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/R-01.md) Recompose for small screens

### Mobile list to detail (`mobile-list-detail`, page)

- [ ] Signed · [library page](https://tessli.vercel.app/library/mobile-list-detail)
- `default`: [Tessli](https://tessli.vercel.app/preview/mobile-list-detail) · [Neutral](https://tessli.vercel.app/preview/mobile-list-detail?theme=neutral) · [Dark](https://tessli.vercel.app/preview/mobile-list-detail?theme=dark)
- `detail`: [Tessli](https://tessli.vercel.app/preview/mobile-list-detail?state=detail) · [Neutral](https://tessli.vercel.app/preview/mobile-list-detail?state=detail&theme=neutral) · [Dark](https://tessli.vercel.app/preview/mobile-list-detail?state=detail&theme=dark)
- `empty`: [Tessli](https://tessli.vercel.app/preview/mobile-list-detail?state=empty) · [Neutral](https://tessli.vercel.app/preview/mobile-list-detail?state=empty&theme=neutral) · [Dark](https://tessli.vercel.app/preview/mobile-list-detail?state=empty&theme=dark)
- `error`: [Tessli](https://tessli.vercel.app/preview/mobile-list-detail?state=error) · [Neutral](https://tessli.vercel.app/preview/mobile-list-detail?state=error&theme=neutral) · [Dark](https://tessli.vercel.app/preview/mobile-list-detail?state=error&theme=dark)
- Rules it claims: [R-01](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/R-01.md) Recompose for small screens, [R-03](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/R-03.md) Break where the content breaks, [A-01](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/A-01.md) 44px touch targets, [A-06](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/A-06.md) Keyboard complete, nothing hover-only, [A-05](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/A-05.md) Announce changes in place, [K-01](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/K-01.md) Native elements first, [H-02](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/H-02.md) Headings follow the outline, [ST-04](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/ST-04.md) Errors explain and offer a way out

### Pricing tiers compared on the limits that matter (`pricing-tiers`, section)

- [ ] Signed · [library page](https://tessli.vercel.app/library/pricing-tiers)
- `default`: [Tessli](https://tessli.vercel.app/preview/pricing-tiers) · [Neutral](https://tessli.vercel.app/preview/pricing-tiers?theme=neutral) · [Dark](https://tessli.vercel.app/preview/pricing-tiers?theme=dark)
- `annual`: [Tessli](https://tessli.vercel.app/preview/pricing-tiers?state=annual) · [Neutral](https://tessli.vercel.app/preview/pricing-tiers?state=annual&theme=neutral) · [Dark](https://tessli.vercel.app/preview/pricing-tiers?state=annual&theme=dark)
- Rules it claims: [H-01](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/H-01.md) One primary action per surface, [T-03](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/T-03.md) Tabular figures for compared numbers, [C-02](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/C-02.md) Never colour alone, [C-04](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/C-04.md) No effects as emphasis, [K-03](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/K-03.md) Compared options share rows, [W-02](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/W-02.md) Action labels name the outcome, [ST-03](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/ST-03.md) State changes don't move the page, [R-03](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/R-03.md) Break where the content breaks

### Product hero with real UI (`product-hero`, section)

- [ ] Signed · [library page](https://tessli.vercel.app/library/product-hero)
- `default`: [Tessli](https://tessli.vercel.app/preview/product-hero) · [Neutral](https://tessli.vercel.app/preview/product-hero?theme=neutral) · [Dark](https://tessli.vercel.app/preview/product-hero?theme=dark)
- Rules it claims: [H-01](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/H-01.md) One primary action per surface, [W-01](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/W-01.md) Headings make a specific point, [W-02](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/W-02.md) Action labels name the outcome, [W-03](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/W-03.md) No invented proof, [C-03](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/C-03.md) The accent is scarce, [C-04](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/C-04.md) No effects as emphasis, [S-02](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/S-02.md) One shared edge, [R-01](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/R-01.md) Recompose for small screens

### Settings: account and danger zone (`settings-account`, page)

- [ ] Signed · [library page](https://tessli.vercel.app/library/settings-account)
- `default`: [Tessli](https://tessli.vercel.app/preview/settings-account) · [Neutral](https://tessli.vercel.app/preview/settings-account?theme=neutral) · [Dark](https://tessli.vercel.app/preview/settings-account?theme=dark)
- `field-errors`: [Tessli](https://tessli.vercel.app/preview/settings-account?state=field-errors) · [Neutral](https://tessli.vercel.app/preview/settings-account?state=field-errors&theme=neutral) · [Dark](https://tessli.vercel.app/preview/settings-account?state=field-errors&theme=dark)
- `saved`: [Tessli](https://tessli.vercel.app/preview/settings-account?state=saved) · [Neutral](https://tessli.vercel.app/preview/settings-account?state=saved&theme=neutral) · [Dark](https://tessli.vercel.app/preview/settings-account?state=saved&theme=dark)
- `save-error`: [Tessli](https://tessli.vercel.app/preview/settings-account?state=save-error) · [Neutral](https://tessli.vercel.app/preview/settings-account?state=save-error&theme=neutral) · [Dark](https://tessli.vercel.app/preview/settings-account?state=save-error&theme=dark)
- `confirm-delete`: [Tessli](https://tessli.vercel.app/preview/settings-account?state=confirm-delete) · [Neutral](https://tessli.vercel.app/preview/settings-account?state=confirm-delete&theme=neutral) · [Dark](https://tessli.vercel.app/preview/settings-account?state=confirm-delete&theme=dark)
- `delete-error`: [Tessli](https://tessli.vercel.app/preview/settings-account?state=delete-error) · [Neutral](https://tessli.vercel.app/preview/settings-account?state=delete-error&theme=neutral) · [Dark](https://tessli.vercel.app/preview/settings-account?state=delete-error&theme=dark)
- `deletion-started`: [Tessli](https://tessli.vercel.app/preview/settings-account?state=deletion-started) · [Neutral](https://tessli.vercel.app/preview/settings-account?state=deletion-started&theme=neutral) · [Dark](https://tessli.vercel.app/preview/settings-account?state=deletion-started&theme=dark)
- Rules it claims: [ST-05](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/ST-05.md) Destructive actions state consequences, [ST-04](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/ST-04.md) Errors explain and offer a way out, [ST-03](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/ST-03.md) State changes don't move the page, [A-04](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/A-04.md) Label every control, [A-05](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/A-05.md) Announce changes in place, [A-06](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/A-06.md) Keyboard complete, nothing hover-only, [H-01](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/H-01.md) One primary action per surface, [W-02](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/W-02.md) Action labels name the outcome

### Honest social proof (`social-proof-honest`, section)

- [ ] Signed · [library page](https://tessli.vercel.app/library/social-proof-honest)
- `default`: [Tessli](https://tessli.vercel.app/preview/social-proof-honest) · [Neutral](https://tessli.vercel.app/preview/social-proof-honest?theme=neutral) · [Dark](https://tessli.vercel.app/preview/social-proof-honest?theme=dark)
- `single`: [Tessli](https://tessli.vercel.app/preview/social-proof-honest?state=single) · [Neutral](https://tessli.vercel.app/preview/social-proof-honest?state=single&theme=neutral) · [Dark](https://tessli.vercel.app/preview/social-proof-honest?state=single&theme=dark)
- `no-proof-yet`: [Tessli](https://tessli.vercel.app/preview/social-proof-honest?state=no-proof-yet) · [Neutral](https://tessli.vercel.app/preview/social-proof-honest?state=no-proof-yet&theme=neutral) · [Dark](https://tessli.vercel.app/preview/social-proof-honest?state=no-proof-yet&theme=dark)
- Rules it claims: [W-03](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/W-03.md) No invented proof, [W-02](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/W-02.md) Action labels name the outcome, [W-05](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/W-05.md) Arrows only for leaving, [K-04](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/K-04.md) No identical card grids, [S-02](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/S-02.md) One shared edge, [T-01](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/T-01.md) Readable line length, [C-04](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/C-04.md) No effects as emphasis, [A-01](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/A-01.md) 44px touch targets

## Rules

Sign a rule once at least one signed item applies it correctly.

- [ ] [A-01](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/A-01.md) 44px touch targets
- [ ] [A-02](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/A-02.md) Visible focus
- [ ] [A-03](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/A-03.md) AA contrast in every theme
- [ ] [A-04](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/A-04.md) Label every control
- [ ] [A-05](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/A-05.md) Announce changes in place
- [ ] [A-06](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/A-06.md) Keyboard complete, nothing hover-only
- [ ] [C-01](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/C-01.md) Semantic tokens only
- [ ] [C-02](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/C-02.md) Never colour alone
- [ ] [C-03](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/C-03.md) The accent is scarce
- [ ] [C-04](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/C-04.md) No effects as emphasis
- [ ] [H-01](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/H-01.md) One primary action per surface
- [ ] [H-02](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/H-02.md) Headings follow the outline
- [ ] [H-03](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/H-03.md) One eyebrow at most
- [ ] [H-04](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/H-04.md) Numbers only for sequences
- [ ] [K-01](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/K-01.md) Native elements first
- [ ] [K-02](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/K-02.md) Links go, buttons do
- [ ] [K-03](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/K-03.md) Compared options share rows
- [ ] [K-04](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/K-04.md) No identical card grids
- [ ] [M-01](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/M-01.md) Motion only explains change
- [ ] [M-02](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/M-02.md) Respect reduced motion
- [ ] [R-01](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/R-01.md) Recompose for small screens
- [ ] [R-02](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/R-02.md) Reflow at 320 without sideways scroll
- [ ] [R-03](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/R-03.md) Break where the content breaks
- [ ] [S-01](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/S-01.md) Group by proximity
- [ ] [S-02](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/S-02.md) One shared edge
- [ ] [S-03](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/S-03.md) Density fits the task
- [ ] [ST-01](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/ST-01.md) Every data region has its states
- [ ] [ST-02](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/ST-02.md) Empty states differ by cause
- [ ] [ST-03](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/ST-03.md) State changes don't move the page
- [ ] [ST-04](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/ST-04.md) Errors explain and offer a way out
- [ ] [ST-05](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/ST-05.md) Destructive actions state consequences
- [ ] [T-01](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/T-01.md) Readable line length
- [ ] [T-02](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/T-02.md) Few sizes, from one scale
- [ ] [T-03](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/T-03.md) Tabular figures for compared numbers
- [ ] [W-01](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/W-01.md) Headings make a specific point
- [ ] [W-02](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/W-02.md) Action labels name the outcome
- [ ] [W-03](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/W-03.md) No invented proof
- [ ] [W-04](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/W-04.md) Answer first
- [ ] [W-05](https://github.com/Online-Scope-Lab/tessli/blob/main/rules/W-05.md) Arrows only for leaving
