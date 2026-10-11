# Packets

What blind reviewers see, written by `scripts/randomize_blind_labels.py` and `scripts/prepare_blind_packet.py`:

```text
packets/
├── commitment.json         SHA-256 commitment to the label mapping, and the list of pair ids
└── <pair-id>/              e.g. 03-5c1e9a: the brief number and six hex digits
    ├── PACKET.md           brief, reviewer notes, screenshots of A and B, mechanical evidence, score form
    └── score-form.json     the empty score file the reviewer copies to bench/scores/
```

`commitment.json` is committed before any packet goes out. The mapping it commits to (which build is A and which is B in each pair) is sealed in a file outside the repository and published only by `scripts/reveal.py`, after every score is committed.

**Screenshots are not on `main`.** They live on the `bench-artifacts` branch, at `packets/<pair-id>/<A|B>/<state>-<width>.png`, and each packet links them by raw URL (`https://raw.githubusercontent.com/Online-Scope-Lab/tessli/bench-artifacts/packets/…`). Thirty-six builds with up to eight states at three widths come to several hundred full-page images, which would bloat every clone of `main`. Push the `bench-artifacts` branch before sharing a packet, or its images will not load.

A packet never names a condition, a run id or a run path; `prepare_blind_packet.py` refuses to write one that does, and `bench/tests/test_packet.py` checks it.
