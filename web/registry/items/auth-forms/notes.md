---
id: auth-forms
kind: page
category: auth
title: Sign-in and sign-up with validation
summary: Sign-in and sign-up pages that check each field when people leave it, explain every error in text next to its field, and show progress, failure and success plainly.
use_when:
  - The product signs people in with an email address and password, and creates accounts the same way.
  - You need the sign-in and sign-up screens to share one structure, so people who switch between them are not surprised.
avoid_when:
  - Sign-in is only through single sign-on or a social provider; show one clear button per provider instead of an empty form.
  - The product uses passwordless email links or passkeys only; ask for the email address alone and explain what happens next.
  - Sign-up needs several steps (workspace, plan, invitations); keep this as the first step and move the rest after the account exists.
rules:
  - A-04 # label every control
  - C-02 # never colour alone
  - ST-03 # state changes don't move the page
  - ST-04 # errors explain and offer a way out
  - W-04 # answer first
  - A-05 # announce changes in place
  - H-01 # one primary action per surface
  - A-01 # 44px touch targets
ai_default: >-
  A centred card on a gradient background with a logo, placeholder-only
  inputs, a "Remember me" checkbox, two equally loud buttons ("Sign in" and
  "Sign up"), and validation that runs only on submit and shows a red border
  or a red "Invalid input" banner at the top of the form, with no word about
  which field is wrong or what to do.
why_this_is_better:
  - Every field has a visible label; hints and errors sit under their field and are tied to it with aria-describedby, so a screen reader reads the error with the field.
  - A field is checked when people leave it with a value, not while they type and not only on submit. Once an error shows, it clears the moment the value is fixed.
  - Errors carry an icon and words as well as colour, and say what to do ("Enter an email address in the format name@example.com", "Use at least 12 characters. This one has 9.").
  - The line under each field is reserved, and form-level messages appear below the button, so validation and failures never push the fields or the button down.
  - Sign-in only checks that a password was typed; length rules apply at sign-up, where a password is created. The one rule is length, with no composition rules.
  - A failed sign-in says the outcome first ("You’re not signed in"), explains why without revealing which field was wrong, and offers a password reset link.
  - A Show button reveals the password instead of a second "confirm password" field, and the inputs use autocomplete values that password managers recognise.
  - Sign-up success replaces the form with "Check your email", names the address used, and moves focus to that heading.
failures:
  - Validating on every keystroke, which shows "invalid email" before people have finished typing.
  - Disabling the submit button until the form is valid, which hides why nothing happens.
  - Applying sign-up password rules at sign-in, which locks out people whose password predates the rules.
  - Saying which of email or password was wrong, which tells an attacker which addresses have accounts.
  - Removing the reserved message line to save space, so the form jumps as errors come and go.
  - Blocking paste into the password field, which breaks password managers.
states:
  [
    sign-in,
    sign-in-errors,
    signing-in,
    sign-in-failed,
    sign-up,
    sign-up-errors,
    check-email,
  ]
responsive:
  desktop: A single form column (at most 28rem) in a bordered panel, centred under the product name; labels sit above full-width inputs and the one primary button spans the column.
  mobile: Below 640px the panel border and padding go away and the form is the page, with full-width 44px inputs and button and the 16px text that stops phones zooming in on focus.
a11y:
  - Every input has a visible label element; hints and errors are linked with aria-describedby and invalid fields set aria-invalid.
  - Errors show an icon and text, not only a red border, and the form-level message names the fields to fix.
  - On submit with errors, focus moves to the first invalid field; progress, failure and success are announced through one polite live region below the button.
  - The password toggle is a real button whose name reads "Show password" or "Hide password", and the submit button keeps focus while the request runs.
  - Inputs, the password toggle, the reset link and the switch link are at least 44px tall and show a focus ring; the spinner stops under reduced motion while the button text still says what is happening.
status: community
reviewed_by: []
reviewed_at: null
contributors: []
provenance: original
license: MIT
---

Sign-in forms usually fail people at the worst moment: they type, press the button, and get a red border or a banner that says "Invalid input". This item checks each field when people leave it, says in words what is wrong and how to fix it, and keeps that message next to the field it belongs to.

Space for messages is reserved under every field and below the button, so the form stays still as errors appear and clear. Sign-in and sign-up share one structure; only sign-up enforces the password length, because that is where a password is created. A failed sign-in states the outcome first and never says which of the two fields was wrong.

The component is presentational: pass `onSubmit` and throw to show the failure message. Without it, the preview simulates a short request so every state can be seen. Nothing is sent anywhere. Keep the reserved lines, the linked errors and the single primary button when you adapt it.
