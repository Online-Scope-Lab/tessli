# Runs

One directory per build, named by its opaque run id (`r` and 12 hex digits), created by `scripts/new_run.py`:

```text
runs/<run-id>/
├── manifest.json     brief, run index, condition, frozen fields, prompt and input hashes
├── prompt/
│   ├── system.md     the system prompt given to the builder
│   └── task.md       the task prompt (the brief and its states filled in)
├── telemetry.json    start, end, elapsed time, turns, tokens, final workspace hash (record_run.py)
├── evidence.json     build result, per state and width: overflow, console and page errors, axe-core (capture.mjs)
└── screenshots/      <state>-<width>.png (git-ignored on main)
```

The workspace the builder worked in lives outside the repository, at `<workspace-root>/<run-id>`.

**Nothing here is committed before the reveal.** A manifest names its condition, so publishing it before review would unblind the reviewers. They are git-ignored for that reason. After every score is committed, the run directories are committed to `main` (`git add -f bench/runs`) and their screenshots to the `bench-artifacts` branch, under `runs/<run-id>/screenshots/`, to keep `main` small. Every run is published, failed builds included.

Run ids are random so that neither the builder (its working directory is named after the id) nor a reviewer can learn anything from them. Packets never contain run ids.
