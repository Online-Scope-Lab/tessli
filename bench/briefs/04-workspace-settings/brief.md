# Workspace settings for a shared support inbox

Quayline is a fictional product; any resemblance to a real product is unintended. Use only the content below as data.

## The product

Quayline is a shared email inbox for small customer-support teams. A workspace belongs to one company; its members answer customer emails together.

## Who uses this screen

Tomás Reyes, the workspace owner at Brightwater Bicycles. He changes settings rarely, so he needs to find things quickly and be sure that what he changed was saved. Agents on his team can open the same settings page but may only change their own notification preferences.

## What the screen must do

One settings page for the workspace, organised so that Tomás can find each area quickly:

- **Workspace profile:** workspace name, support email address, time zone.
- **Notifications:** for the person viewing: email me when a conversation is assigned to me; when a customer replies; a daily summary at 08:00.
- **Members and roles:** list members with their role, invite a member by email, change a member's role, remove a member. Roles: Owner (everything, including deleting the workspace), Admin (everything except deleting the workspace and changing the Owner), Agent (answers conversations; changes only their own notifications).
- **Delete workspace:** permanently deletes all conversations, contacts and settings for every member. It cannot be undone. Only the Owner can do it.

Changes must be saved explicitly, and the page must make clear what is unsaved, saving, saved or failed.

## Content to use

Workspace: Brightwater Bicycles · support@brightwaterbikes.example · Time zone: Europe/Lisbon · 4 members · 1,284 conversations.

| Member | Email | Role | Last active |
| --- | --- | --- | --- |
| Tomás Reyes (you) | tomas@brightwaterbikes.example | Owner | Now |
| Ana Sousa | ana@brightwaterbikes.example | Admin | Today 09:12 |
| Kofi Mensah | kofi@brightwaterbikes.example | Agent | Yesterday |
| Lena Fischer | lena@brightwaterbikes.example | Agent | 3 Oct |

Pending invitation: jo@brightwaterbikes.example (Agent), sent 10 Oct.

## States

- `default`: the page as Tomás (Owner) first opens it.
- `unsaved-changes`: Tomás has changed the workspace name but not saved it.
- `saving`: a save is in progress.
- `saved`: the save succeeded.
- `validation-error`: the support email address is invalid; the error says what to fix.
- `permission-denied`: the page as Kofi (Agent) sees it; controls he cannot use are not offered, and he can tell why.
- `delete-confirm`: the confirmation step for deleting the workspace.
- `delete-failed`: deletion failed; say what happened and that nothing was deleted.

## Out of scope

Billing, integrations, security and personal profile settings, and any page other than this one.
