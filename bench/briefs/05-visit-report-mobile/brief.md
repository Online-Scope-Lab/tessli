# Mobile visit report for lift technicians

Liftwell is a fictional product; any resemblance to a real product is unintended. Use only the content below as data.

## The product

Liftwell is the job app for technicians at Cardinal Lift Services, a company that inspects and repairs passenger lifts in apartment buildings. Technicians use it on their phones on site.

## Who uses this screen

Priya Natarajan, a lift technician, finishing a routine inspection. She is standing in a machine room or a corridor, often wearing gloves, with one hand free and a weak or missing mobile signal. She wants to record the visit correctly and get to the next job.

## What the screen must do

A phone-first screen to complete one visit report:

- Confirm the site and the lift she is at (the app has the job details; she confirms or corrects them).
- Record the outcome: passed, passed with advisory, or failed and taken out of service.
- Add notes (required when the outcome is not "passed").
- Add photos (at least one is required when the outcome is not "passed"); show upload progress for each.
- Flag an issue that needs a follow-up visit, with a short description and urgency (routine or urgent).
- Submit the report. If she is offline, the report is saved on the phone and sent when the connection returns; she must be able to tell which is happening.

It must work well at 390 px first; on wider screens it may use the space but must not become a different workflow.

## Content to use

Job 4471 · Routine inspection · Today, booked 10:00–11:00.

Site: Marlowe Court, 12 Quay Street, Leith EH6 6JF. Lift: Passenger lift B (east stair), 8 floors, 630 kg. Building contact: Mr. D. Kerr, caretaker, 0131 496 0219.

Previous visit: 2 September, passed with advisory: "Door gear on floor 5 noisy; recheck next visit."

## States

- `default`: the report open with job details, nothing entered yet.
- `offline`: no connection; the screen says the report will be saved on the phone and sent later.
- `photo-uploading`: two photos added, one uploaded and one in progress.
- `validation-error`: Priya tried to submit "failed" without notes or a photo; the errors say what is missing.
- `issue-flagged`: an urgent follow-up issue added to the report.
- `submitted`: the report was sent; confirm it and offer the next job.
- `sync-failed`: a report saved offline failed to send; say it is still safe on the phone and how to retry.

## Out of scope

The job list, navigation to other screens, camera access and real uploads. Use the fixture data above.
