# Scores

Human review scores, one file per reviewer per pair:

```text
scores/<pair-id>/<github-handle>.json
```

To review a pair, open its packet (`bench/packets/<pair-id>/PACKET.md`), copy its `score-form.json` here under your GitHub handle, fill in every field and open a pull request from your own account. Each of the twelve dimensions needs a 1–5 score for A and for B, a preference (A, B or tie) and a note that points at something you can see. Confirm the four declarations: you are a human reviewer, you scored without AI assistance, you did not know which build was which, and you did not run the builds.

The format is [`../schemas/score.schema.json`](../schemas/score.schema.json). `python3 -I bench/scripts/validate_scores.py bench/scores` checks it, and rejects files that are not attributed to a named human reviewer with a timestamp, that leave anything empty, or whose reviewer is software. Scores are human input only: no script writes or edits them, and they are not changed after the reveal.

There are no scores yet.
