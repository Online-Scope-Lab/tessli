---
id: settings-account
kind: page
category: settings
title: "Settings: account and danger zone"
summary: An account settings page whose profile form validates per field and reports saves in place, with a separate danger zone that offers export before a typed, confirmed delete.
use_when:
  - People edit a small profile (name, sign-in email) and can also close their account from the same page.
  - Deleting the account removes data people may want to keep, so an export has to come first.
avoid_when:
  - The settings span many areas (billing, notifications, security); give each its own page and keep only the danger zone here.
  - The action is reversible, such as archiving or leaving a workspace; offer undo instead of typed confirmation.
  - Deletion needs an admin or a support request; explain that route instead of showing a button that cannot finish the job.
rules:
  - ST-05 # destructive actions state consequences
  - ST-04 # errors explain and offer a way out
  - ST-03 # state changes don't move the page
  - A-04 # label every control
  - A-05 # announce changes in place
  - A-06 # keyboard complete, nothing hover-only
  - H-01 # one primary action per surface
  - W-02 # action labels name the outcome
ai_default: >-
  One card with Name and Email inputs, placeholder-only labels and a "Submit"
  button that gives no sign of whether anything saved, followed by a red
  "Delete account" button in the same card that deletes at once or opens an
  "Are you sure?" dialog with OK and Cancel and no word about what is lost or
  how to keep a copy.
why_this_is_better:
  - Every field has a visible label and a hint; errors are written under the field, linked with aria-describedby, and the first invalid field takes focus, so people know which field to fix and how.
  - Saving reports its result in place ("Saved", or "Not saved" with what is still safe), in space reserved under the button, so the form never jumps and a failed save does not lose edits.
  - The danger zone is its own section at the end of the page with its own heading, and its trigger is outlined, so Save stays the only primary action and a stray click cannot delete anything.
  - The danger zone offers the export first and lists, with real counts, what deletion removes and what stays with other people, before anyone opens the dialog.
  - The dialog repeats the consequences, gives Cancel the focus, and asks people to type their email address, so confirming is a decision rather than a reflex.
  - Errors say what happened to the data ("Nothing was removed") and offer one way forward.
failures:
  - Leaving the counts out of the deletes list, or writing "all your data", which hides what is actually lost.
  - Making the danger-zone trigger a filled red button beside Save, so the page has two competing primary actions.
  - Typing a fixed word such as DELETE to confirm, which people learn to type without reading; use something specific to the account.
  - Disabling the confirm button until the text matches, which gives keyboard and screen-reader users no reason why it does nothing.
  - Removing the export link because the export is slow; say how long it takes instead.
  - Showing "Saved" before the server confirms, or clearing the form when a save fails.
states:
  - default
  - field-errors
  - saved
  - save-error
  - confirm-delete
  - delete-error
  - deletion-started
responsive:
  desktop: Each section is a two-column row from 1024px, its heading and explanation on the left and the form or danger zone on the right; Save and its status message sit side by side, and the dialog's Cancel and Delete buttons sit right-aligned in one row.
  mobile: Sections stack heading first, inputs and buttons run full width with the status message under Save, and the dialog stacks Cancel above Delete so the safe action is reached first.
a11y:
  - The page title, sections and danger-zone blocks are headings in order (headingLevel sets the top level); the confirmation is a native modal dialog labelled by its own heading and described by the consequences.
  - Every input has a visible label and a hint; errors are linked with aria-describedby, inputs are marked aria-invalid, and the first invalid field takes focus on submit.
  - Save results, deletion errors and the start of deletion are announced through polite status regions; each message starts with its outcome and carries an icon as well as colour.
  - Escape or Cancel closes the dialog and returns focus to the button that opened it; when deletion starts, focus moves to the message that replaces that button.
  - Buttons and the export link are at least 44px tall with a visible focus ring; nothing depends on hover.
status: community
reviewed_by: []
reviewed_at: null
contributors: []
provenance: original
license: MIT
---

Account settings usually get one form and one red button. The form says nothing after Submit, and the button deletes everything at once, or asks "Are you sure?" without saying what will be lost.

This page treats them as two different jobs. The **profile form** validates each field and shows the error under that field. It reports the save result next to the button, in space that is already there, so the page never shifts. A failed save keeps the edits and says that nothing changed.

The **danger zone** is set apart: it comes last, has its own heading, and its trigger is an outlined button, so it never competes with Save. It offers the export first, then lists what deleting removes, with the person's own counts, and what stays with other people. The native `<dialog>` repeats the list, puts focus on Cancel and asks for the account's email address. Escape closes it and focus goes back to the trigger.

When adapting it, pass real counts to `deletes`, a real download URL to `exportHref`, and an `onSaveProfile` and `onDeleteAccount` that throw on failure, so the error states show. Keep the typed confirmation specific to the account.
