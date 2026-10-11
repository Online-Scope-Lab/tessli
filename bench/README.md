# Taste Bench

The Taste Bench is how Tessli will find out, in public, whether its rules and registry help a coding agent build better UI. Read the protocol first: [`PROTOCOL.md`](PROTOCOL.md) fixes the question, design, review, agreement measure, decision rule and threats to validity before any scored run. Until its results exist, Tessli makes no claim about AI output.

## Status

- The protocol is published (version 1, 2026-10-11), with the briefs, starter, prompts and tooling.
- The harness has been tested end to end with a dummy dry run: a hand-written page in place of a builder, marked non-evaluative and deleted afterwards.
- The 36 AI builds have **not** been run. The automation environment the bench was prepared in could not launch the builder, so a human operator runs them; [Operator notes](#operator-notes) collects what that operator needs to know.
- No human scores exist.
- A `/bench` results page will be published once human scores exist.

## Layout

```text
bench/
├── PROTOCOL.md            the pre-registered protocol
├── frozen.template.json   copy to frozen.json and fill in before the first scored build
├── briefs/01…06/          brief.md (given to the builder), task.yaml (states, widths), rubric.md (reviewer notes)
├── starter/               the app every build starts from (Next.js, Tailwind v4, shadcn base files, lockfile);
│                          new_run.py copies it into each run's workspace and installs it with npm ci
├── conditions/            the prompts (identical in both) and the Tessli overlay; see conditions/README.md
├── scripts/               the harness (Python standard library and Node; no new dependencies),
│                          including build_shadcn_mirror.mjs for a local shadcn base registry
├── schemas/               score.schema.json, the reviewer's score file
├── tests/                 unit tests (npm run bench:test)
├── runs/                  one directory per build, by opaque run id (see runs/README.md)
├── packets/               the blinding commitment and one review packet per pair (see packets/README.md)
├── scores/                human score files, one per reviewer per pair (see scores/README.md)
└── results/               created at the reveal: reveal.json (reveal.py) and outcome.json (agreement.py)
```

The scripts run under `python3 -I` (isolated mode); each one adds only its own directory to the import path. `capture.mjs` uses the Playwright and axe-core already installed for `web/`, so run `npm ci` in `web/` first.

## Operator notes

What the first attempt to start the builds showed. None of this changes the protocol; it is how to apply it. Every rule here is the same for both conditions.

- **`turn_allowance: 1` is one prompt, not one agent step.** The builder receives `task.md` and nothing after it: no follow-up, no repair turn. Within that turn it works as long as it needs (reading files, running commands, building). Do not translate it into a harness limit on agent steps, such as a CLI's `--max-turns 1`, which would stop the builder after its first tool call. Record `--turns 1`.
- **Enforce the 60 minutes with `timeout`.** Wrap the builder command in `timeout --kill-after=30s 60m …` so `time_allowance_minutes` is enforced rather than watched. Exit status 124 (or 137 after the kill) means the allowance ran out: record `--outcome time-allowance-reached`. Keep whatever the workspace holds; it is reviewed as it is.
- **Workspaces under a neutral root, such as `/tmp/ws/`.** The builder sees its working directory, so `new_run.py` refuses any root whose path gives the setup away, for example anything containing `tessli` (a clone of this repository, a home directory or a temporary directory named after it). Use a root that survives until the reveal: `validate_pair.py` re-hashes every workspace before pairing, and some systems clear `/tmp` on reboot; on such a system use a persistent neutral root such as `~/work` instead of `/tmp/ws`.
- **Same tool list in both conditions.** The project notes in a Tessli workspace tell the builder to read the local registry with `curl -s http://127.0.0.1:4100/…`, so the frozen `tools` must allow that, and must allow it in both conditions: the same curl rule, restricted to `http://127.0.0.1`, in the baseline too (where nothing listens on port 4100). The harness gets one permission configuration for every build; only the project differs.
- **Mirror the shadcn base registry when `ui.shadcn.com` is unreachable.** `npx shadcn@4.21.4 add <component>` fetches the base registry from `ui.shadcn.com`. Where that host is blocked, build a local mirror once from the shadcn sources at the CLI's tag, outside the repository:

  ```bash
  node bench/scripts/build_shadcn_mirror.mjs --out /tmp/shadcn-mirror > ~/bench-private/shadcn-mirror.sha256
  sha256sum ~/bench-private/shadcn-mirror.sha256   # the mirror hash; the script also prints it
  ```

  It needs `git` and access to GitHub, refuses a tag that no longer points at the pinned commit, adds no dependency and gives the same bytes every time. Serve it for every build in both conditions, and give every builder the same `REGISTRY_URL`:

  ```bash
  python3 -m http.server 4200 --bind 127.0.0.1 --directory /tmp/shadcn-mirror
  export REGISTRY_URL=http://127.0.0.1:4200/r
  ```

  Freeze it: name the mirror, its URL and the mirror hash in `network_policy`, and before each batch check that nothing has changed with `(cd /tmp/shadcn-mirror && sha256sum -c --quiet ~/bench-private/shadcn-mirror.sha256)`. The mirror is a reconstruction (see the script's header for its two deliberate differences from `ui.shadcn.com`), so a batch uses either the mirror or `ui.shadcn.com` for all 36 builds, never a mix.
- **Keep instructions from outside the workspace away from the builder.** No user-level instructions file, skill or MCP server for the account that runs the builds, and no `AGENTS.md` or `CLAUDE.md` in any parent of the workspace root. A builder that ran inside a session with access to this repository would read the repository's own guidance, so builders always start as separate, fresh processes.
- **Example headless command.** One way to start a builder with restricted tools, for Claude Code's print mode. It has not been run for the bench; check every flag and permission-rule syntax against the harness version you freeze, and adapt it to another harness the same way. The model stays in the private record, here through `BENCH_MODEL`, and the harness output goes to `~/bench-private/` because it may name the model.

  ```bash
  REPO=~/src/repo; RUN=r0123456789ab          # this repository's clone and the run id new_run.py printed
  cd /tmp/ws/$RUN
  REGISTRY_URL=http://127.0.0.1:4200/r timeout --kill-after=30s 60m \
    claude -p \
      --system-prompt-file "$REPO/bench/runs/$RUN/prompt/system.md" \
      --model "$BENCH_MODEL" \
      --permission-mode dontAsk \
      --strict-mcp-config \
      --allowedTools "Read" "Write" "Edit" "Glob" "Grep" \
        "Bash(npm:*)" "Bash(npx shadcn@4.21.4:*)" "Bash(node:*)" \
        "Bash(ls:*)" "Bash(cat:*)" "Bash(mkdir:*)" "Bash(rm:*)" "Bash(mv:*)" "Bash(cp:*)" \
        "Bash(curl -s http://127.0.0.1:*)" \
      --disallowedTools "WebSearch" "WebFetch" \
      --output-format json \
      < "$REPO/bench/runs/$RUN/prompt/task.md" \
      > ~/bench-private/$RUN-output.json
  echo "exit $?"   # 124 or 137: time-allowance-reached
  ```

  The same command, flags and allowed tools go into `builder_harness` and `tools` in `frozen.json`. Tool rules are not a network boundary (`npm` and `node` can reach anything the machine can), so enforce `network_policy` at the network level as well, for example with a proxy or firewall that allows only the npm registry and `127.0.0.1`. Token counts for `record_run.py finish` are in the JSON output.

## Running a batch

Commands run from the repository root. `/tmp/ws` and `~/bench-private` stand for any two directories outside this repository; neither may be inside a Git repository. The builder's working directory is `/tmp/ws/<run-id>`, so its path must stay neutral: `new_run.py` refuses a workspace root whose path contains `bench`, `baseline`, `tessli`, `experiment` or `eval` anywhere, home directory and temporary-directory names included (use something like `/tmp/ws`). Read [Operator notes](#operator-notes) before the first build.

### 1. Freeze the conditions

```bash
cp bench/frozen.template.json bench/frozen.json
```

Write the private model record (exact model identifier, harness version, date) to `~/bench-private/model-record.txt`, put its `sha256sum` in `model_record_sha256`, fill in every other field, leave `model` as `withheld-by-operator`, and commit `frozen.json`. `tools` lists the same permission rules for both conditions, including reading `http://127.0.0.1` with curl; if the shadcn base registry is mirrored, `network_policy` names the mirror and its hash (see [Operator notes](#operator-notes)). `new_run.py` refuses placeholders, a named model and uncommitted bench inputs.

### 2. Build (36 times)

For each brief 01–06 and run index 1–3, in the order the protocol gives:

```bash
python3 -I bench/scripts/new_run.py --brief 01 --condition baseline --run-index 1 --workspace-root /tmp/ws
```

It prints the run id, the workspace (`/tmp/ws/<run-id>`, dependencies installed with `npm ci`) and the prompts (`bench/runs/<run-id>/prompt/system.md` and `task.md`). If the shadcn base registry is mirrored, serve the mirror for the whole build in both conditions. For a `tessli` run, also serve the Tessli registry for the whole build:

```bash
python3 -m http.server 4100 --bind 127.0.0.1 --directory web/public/r
```

Then:

```bash
python3 -I bench/scripts/record_run.py start bench/runs/<run-id>
# start the builder in /tmp/ws/<run-id> with system.md as its system prompt and task.md as its only message,
# under `timeout` (see Operator notes); stop it when it finishes or the time allowance runs out,
# and do not touch the workspace
python3 -I bench/scripts/record_run.py finish bench/runs/<run-id> --workspace /tmp/ws/<run-id> \
  --outcome completed --turns 1 [--input-tokens N --output-tokens N]
```

### 3. Capture

```bash
node bench/scripts/capture.mjs --run bench/runs/<run-id> --workspace /tmp/ws/<run-id>
```

It runs `npm run build` and `npm run start` in the workspace (port 4310), then for every state loads `/?state=<name>` at 1440, 768 and 390 px: a full-page screenshot, horizontal overflow (also at 320 px), console and page errors, and axe-core with the WCAG 2.2 AA tags. Results: `bench/runs/<run-id>/evidence.json` and `screenshots/<state>-<width>.png`. One server at a time.

### 4. Pair and blind

```bash
python3 -I bench/scripts/validate_pair.py --all bench/runs --workspace-root /tmp/ws
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

`npm run bench:test` in `web/` (also part of `npm run check` and CI) runs the unit tests in `tests/`: Krippendorff's alpha against Krippendorff's published examples, the sign test, the decision rule, label balance and commitment, the reveal round trip and its refusals, packets that never name a condition or run, score validation (unattributed, incomplete and software-attributed scores are rejected), the starter and prompts (identical across conditions, nothing that gives the setup away), the six briefs, and `new_run.py`, `record_run.py` and `validate_pair.py` on real workspaces. It also runs the Node unit tests for `build_shadcn_mirror.mjs`'s helpers (the import rewrite, the registry-source reader, item building and the manifest; no network) and syntax-checks `capture.mjs`, which needs a browser and is exercised by a dry run instead.

## Dry run

To check the harness end to end without a builder, run steps 2–5 with `new_run.py --dry-run`, a hand-written page in place of the builder, `--allow-dry-run` on `validate_pair.py` and `randomize_blind_labels.py`, and every output directory (`--runs-dir`, `--commitment`, `--out`, `--artifacts-out`) outside the repository. Dry runs are marked non-evaluative and can never be paired for scoring. Delete their output afterwards.
