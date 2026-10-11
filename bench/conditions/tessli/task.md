Build the screen described in this brief.

---

{{brief}}

---

How to hand it over:

- Build the screen at the home route (`app/page.tsx`); split it into components as you see fit. There is no backend: use the content in the brief as fixture data in the code.
- Make each state below viewable by URL, so it can be reviewed without clicking through: `/?state=<name>` shows that state and `/` shows `default`. While a state is shown, put `data-state="<name>"` on the page's `<main>` element. Interactive behaviour must still work normally.
- States: {{states}}
- It must work at 1440, 768 and 390 px wide, with a keyboard and with a screen reader.
- Do not add authentication, a database, analytics or tracking.
- `npm run build` must pass.
- Finish with a short summary: what you built, the decisions you made where the brief was open, and anything unfinished.
