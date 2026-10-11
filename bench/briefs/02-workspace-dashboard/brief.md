# Workspace dashboard for a copy-approval tool

Draftroom is a fictional product; any resemblance to a real product is unintended. Use only the content below as data. Do not add metrics, charts or numbers that are not given here.

## The product

Draftroom is where a small content agency sends website copy to its clients for approval. Each project is a set of pages; each page is a draft that the client approves, rejects with comments, or leaves pending. The agency's writers then revise rejected drafts.

## Who uses this screen

Maya Okafor, the agency's workspace owner, opens the dashboard every morning. She wants to know which projects are at risk today and what she should do first. She does not need traffic or engagement figures; she needs unresolved work.

## What the screen must do

- Put what needs action first: drafts the client rejected, comments nobody has answered, and projects close to their due date.
- Show every active project with its status, progress and due date, so Maya can see which are on track.
- Show recent activity (who did what, when) without letting it push the urgent work down.
- Give each item that needs action a clear way to open it (links may point to `#`).
- Include the app's navigation (Dashboard, Projects, Clients, Settings) and the workspace name.

## Content to use

Today is Tuesday 14 October. Workspace: Northlight Content Studio.

Active projects:

| Project | Client | Pages approved | Pending | Rejected | Unanswered comments | Due |
| --- | --- | --- | --- | --- | --- | --- |
| Spring catalogue | Fernhill Garden Supply | 9 of 12 | 1 | 2 | 3 | Thu 16 Oct |
| Clinic website refresh | Eastgate Physio | 4 of 10 | 6 | 0 | 0 | Fri 31 Oct |
| Product launch pages | Tidewater Kayaks | 2 of 5 | 1 | 2 | 1 | Mon 20 Oct |
| Careers section | Holloway Builders | 7 of 7 | 0 | 0 | 0 | Wed 15 Oct |
| Menu and ordering | Saffron Lane Kitchen | 0 of 4 | 4 | 0 | 2 | Fri 7 Nov |

Rejected drafts:

- "Raised beds" page (Spring catalogue), rejected by Ines Duarte yesterday at 16:40: "Prices are from last year's list."
- "Seed starter kits" page (Spring catalogue), rejected by Ines Duarte yesterday at 16:52: "Too long; cut to the three kit sizes."
- "Touring kayaks" page (Product launch pages), rejected by Sam Whitlock today at 08:15: "Remove the warranty claim until legal signs off."
- "Accessories" page (Product launch pages), rejected by Sam Whitlock today at 08:21: "Missing the dry bag."

Recent activity (newest first): Sam Whitlock rejected two drafts in Product launch pages (today 08:21); Priya Raman uploaded 3 revised drafts to Clinic website refresh (yesterday 17:30); Ines Duarte rejected two drafts in Spring catalogue (yesterday 16:52); Holloway Builders approved the last Careers page (yesterday 11:05); Leo Brandt added 4 pages to Menu and ordering (Monday 15:20).

## States

- `default`: the populated dashboard as above.
- `first-use`: a new workspace with no projects yet; explain how to start and offer the one action (create a project).
- `loading`: data is still loading.
- `no-active-projects`: projects exist but all are complete or archived; nothing needs action.
- `error`: the dashboard data failed to load; say what failed and offer a way to retry.

## Out of scope

The project, client and settings pages themselves, sign-in and real data loading.
