# Contact import flow for a nonprofit CRM

Ledgerleaf is a fictional product; any resemblance to a real product is unintended. Use only the content below as data.

## The product

Ledgerleaf is a contact and donation manager for small nonprofits. Volunteers often keep supporter lists in spreadsheets, so Ledgerleaf lets an administrator import a CSV file of contacts.

## Who uses this screen

Dana Whitfield, the volunteer coordinator at Riverside Food Bank. She is careful but not technical, imports a few hundred contacts a few times a year, and is worried about creating duplicates or losing data.

## What the flow must do

One page that takes Dana through the import in steps:

1. **Upload:** choose a `.csv` file (up to 5 MB) or drop it on the page.
2. **Map columns:** match each column in the file to a Ledgerleaf field, or skip it. Ledgerleaf suggests matches; Dana can change them.
3. **Fix problems:** rows that cannot be imported as they are, with why each one fails and how to fix or skip it.
4. **Preview:** what will be created and updated, before anything changes.
5. **Import and finish:** confirm, see progress, then a clear summary of what happened.

Dana must be able to go back a step without losing what she has done, see where she is in the flow, and understand before confirming exactly what the import will change. The import adds and updates contacts; it cannot be undone automatically.

## Content to use

File: `riverside-supporters-2025.csv`, 248 rows, 212 KB.

Columns in the file and Ledgerleaf's suggested match:

| Column in file | Suggested field | Sample value |
| --- | --- | --- |
| First | First name | Amara |
| Last | Last name | Lindqvist |
| E-mail | Email | amara.l@example.org |
| Phone | Phone | 0161 555 0142 |
| Postcode | Postcode | M14 6RH |
| Last gift | (no match; suggest skip) | 2025-03-14 |
| Notes | Notes | Prefers post |

Ledgerleaf fields: First name, Last name, Email, Phone, Postcode, Notes, Tags.

Problems found after mapping (6 rows):

| Row | Problem |
| --- | --- |
| 17 | Email "j.okoro@example" is missing the part after the dot. |
| 42 | Last name is empty. |
| 88 | Same email as row 12 (amara.l@example.org). |
| 131 | Phone "call after 6pm" is not a phone number. |
| 190 | Same email as an existing contact, Amara Lindqvist; importing will update that contact. |
| 233 | Postcode "N/A" is not a postcode. |

Preview after fixes: 236 new contacts, 9 existing contacts updated, 3 rows skipped (or whatever follows from Dana's choices).

## States

- `default`: the upload step before a file is chosen.
- `file-selected`: a file chosen and checked, ready to continue.
- `mapping`: the column-mapping step.
- `validation-errors`: the problem rows step.
- `preview`: the summary before confirming.
- `importing`: the import in progress.
- `complete`: the import finished, with a summary and the next things Dana can do.
- `network-error`: the import failed part-way because the connection dropped; say what was and was not imported and how to continue.

## Out of scope

Real file parsing, the contacts list itself and any other page. Use the fixture data above.
