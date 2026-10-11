# Taste Bench

The Taste Bench is how Tessli will find out, in public, whether its rules and registry help a coding agent build better UI. Read the protocol first: [`PROTOCOL.md`](PROTOCOL.md) fixes the question, design, review, agreement measure, decision rule and threats to validity before any scored run. Until its results exist, Tessli makes no claim about AI output.

Status: the protocol, briefs, starter, prompts and tooling are in place. No scored build has run and no human has scored anything yet.

## Layout

```text
bench/
├── PROTOCOL.md            the pre-registered protocol
├── frozen.template.json   copy to frozen.json and fill in before the first scored build
├── briefs/01…06/          brief.md (given to the builder), task.yaml (states, widths), rubric.md (reviewer notes)
├── starter/               the app every build starts from (Next.js, Tailwind v4, shadcn base files, lockfile);
│                          new_run.py copies it into each run's workspace and installs it with npm ci
├── conditions/            the prompts (identical in both) and the Tessli overlay; see conditions/README.md
├── scripts/               the harness (Python standard library and Node; no new dependencies)
├── schemas/               score.schema.json, the reviewer's score file
├── tests/                 unit tests (npm run bench:test)
├── runs/                  one directory per build, by opaque run id (see runs/README.md)
├── packets/               the blinding commitment and one review packet per pair (see packets/README.md)
├── scores/                human score files, one per reviewer per pair (see scores/README.md)
└── results/               created at the reveal: reveal.json (reveal.py) and outcome.json (agreement.py)
```

The scripts run under `python3 -I` (isolated mode); each one adds only its own directory to the import path. `capture.mjs` uses the Playwright and axe-core already installed for `web/`, so run `npm ci` in `web/` first.

## Running a batch

Commands run from the repository root. `~/work` and `~/bench-private` stand for any two directories outside this repository; neither may be inside a Git repository. The builder's working directory is `~/work/<run-id>`, so its path must stay neutral: `new_run.py` refuses a workspace root whose path contains `bench`, `baseline`, `tessli`, `experiment` or `eval` (use something like `~/work` or `~/projects`).

### 1. Freeze the conditions

```bash
cp bench/frozen.template.json bench/frozen.json
```

Write the private model record (exact model identifier, harness version, date) to `~/bench-private/model-record.txt`, put its `sha256sum` in `model_record_sha256`, fill in every other field, leave `model` as `withheld-by-operator`, and commit `frozen.json`. `new_run.py` refuses placeholders, a named model and uncommitted bench inputs.

### 2. Build (36 times)

For each brief 01–06 and run index 1–3, in the order the protocol gives:

```bash
python3 -I bench/scripts/new_run.py --brief 01 --condition baseline --run-index 1 --workspace-root ~/work
```

It prints the run id, the workspace (`~/work/<run-id>`, dependencies installed with `npm ci`) and the prompts (`bench/runs/<run-id>/prompt/system.md` and `task.md`). For a `tessli` run, also serve the registry for the whole build:

```bash
python3 -m http.server 4100 --bind 127.0.0.1 --directory web/public/r
```

Then:

```bash
python3 -I bench/scripts/record_run.py start bench/runs/<run-id>
# start the builder in ~/work/<run-id> with system.md as its system prompt and task.md as its only message;
# stop it when it finishes or the time allowance runs out, and do not touch the workspace
python3 -I bench/scripts/record_run.py finish bench/runs/<run-id> --workspace ~/work/<run-id> \
  --outcome completed --turns 1 [--input-tokens N --output-tokens N]
```

### 3. Capture

```bash
node bench/scripts/capture.mjs --run bench/runs/<run-id> --workspace ~/work/<run-id>
```

It runs `npm run build` and `npm run start` in the workspace (port 4310), then for every state loads `/?state=<name>` at 1440, 768 and 390 px: a full-page screenshot, horizontal overflow (also at 320 px), console and page errors, and axe-core with the WCAG 2.2 AA tags. Results: `bench/runs/<run-id>/evidence.json` and `screenshots/<state>-<width>.png`. One server at a time.

### 4. Pair and blind

```bash
python3 -I bench/scripts/validate_pair.py --all bench/runs --workspace-root ~/work
BENCH_SEED=$(python3 -c "import secrets; print(secrets.token_hex(32))") \
  python3 -I bench/scripts/randomize_blind_labels.py --sealed ~/bench-private/mapping.json
```

`validate_pair.py` checks each pair (same brief, run index, prompts, starter, commit and frozen fields; both finished and captured; workspaces unchanged since the build). `randomize_blind_labels.py` writes the sealed mapping to `~/bench-private/` and the commitment to `bench/packets/commitment.json`. Keep the seed and the mapping private; commit the commitment.

### 5. Packets

```bash
# first time only: create the branch as an orphan (no history from main) in a new worktree (Git 2.42 or later)
git worktree add --orphan -b bench-artifacts ~/bench-artifacts
# later, when the branch already exists on GitHub: git fetch origin bench-artifacts && git worktree add ~/bench-artifacts bench-artifacts
python3 -I bench/scripts/prepare_blind_packet.py --sealed ~/bench-private/mapping.json --artifacts-out ~/bench-artifacts
```

It writes `bench/packets/<pair-id>/PACKET.md` and `score-form.json`, and copies the screenshots to `~/bench-artifacts/packets/<pair-id>/<A|B>/`. Look at every screenshot (protocol, Blinding step 5), commit them in `~/bench-artifacts` and push the branch (`git -C ~/bench-artifacts push -u origin bench-artifacts`), then commit the packets on `main` and send reviewers the links.

### 6. Review

Reviewers follow their packet: copy `score-form.json` to `bench/scores/<pair-id>/<github-handle>.json`, fill in every field and open a pull request. Score pull requests are public, so remind every reviewer not to open other reviewers' score pull requests or files until their own is submitted (each score file declares this; see Threats to validity in the protocol). Check each one in your own terminal:

```bash
python3 -I bench/scripts/validate_scores.py bench/scores
```

The validator refuses to run in an automated or agent session (scores are human input only), so a person runs it.

### 7. Reveal and analyse

After every pair has at least three valid, committed reviews:

```bash
python3 -I bench/scripts/reveal.py --sealed ~/bench-private/mapping.json --out bench/results/reveal.json
python3 -I bench/scripts/agreement.py --reveal bench/results/reveal.json --out bench/results/outcome.json
```

`reveal.py` verifies the commitment, the reviewer count and that every score file is committed and unchanged, then writes the mapping and the salt. `agreement.py` reports Krippendorff's alpha (ordinal) per dimension and overall, preference counts per pair, and the verdict under the protocol's decision rule. Then publish everything listed under Publication in the protocol.

## Tests

`npm run bench:test` in `web/` (also part of `npm run check` and CI) runs the unit tests in `tests/`: Krippendorff's alpha against Krippendorff's published examples, the sign test, the decision rule, label balance and commitment, the reveal round trip and its refusals, packets that never name a condition or run, score validation (unattributed, incomplete and software-attributed scores are rejected), the starter and prompts (identical across conditions, nothing that gives the setup away), the six briefs, and `new_run.py`, `record_run.py` and `validate_pair.py` on real workspaces. It also syntax-checks `capture.mjs`, which needs a browser and is exercised by a dry run instead.

## Dry run

To check the harness end to end without a builder, run steps 2–5 with `new_run.py --dry-run`, a hand-written page in place of the builder, `--allow-dry-run` on `validate_pair.py` and `randomize_blind_labels.py`, and every output directory (`--runs-dir`, `--commitment`, `--out`, `--artifacts-out`) outside the repository. Dry runs are marked non-evaluative and can never be paired for scoring. Delete their output afterwards.
