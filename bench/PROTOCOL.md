# Taste Bench protocol

Version 1, published 2026-10-11, before any scored run. If anything below changes after the first scored build starts, the change gets a new protocol version and the affected builds are run again; results from different versions are never pooled.

Tessli does not claim that its rules or items improve AI-built UI. This protocol is how that question gets answered, in public, whatever the answer is ([plan §9](../docs/v1.2/plan.md#9-taste-bench-earning-the-claim)). How to operate it is in [`README.md`](README.md).

## Question

When a coding agent builds a screen from a brief, do independent human reviewers, who cannot tell which build is which, judge the build better when the project also contains Tessli's rules file and access to the Tessli registry?

The answer covers one builder (agent harness and model) on six fictional greenfield briefs. It says nothing about other models, existing codebases or real users.

## Design

- **Briefs:** six, in [`briefs/`](briefs/): a landing page, a workspace dashboard, a CSV import flow, workspace settings, a mobile visit report (adapted from `evaluation/task-01…05` at the `v1.1-archive` tag) and an order exceptions queue (new). Each brief is for a fictional product, self-contained (it carries all the content and data the screen needs) and byte-identical in both conditions. Each lists the states the screen must show. The library's starter items cover the same kinds of screens but are not copies of these briefs (plan §9).
- **Conditions:** two, in [`conditions/`](conditions/):
  - **baseline:** the starter app in [`starter/`](starter/) (Next.js, TypeScript, Tailwind CSS v4 and the shadcn/ui base files with the stock neutral theme);
  - **tessli:** the same starter plus `TESSLI.md` (copied from `rules/TESSLI.md` at the frozen commit), a section in the project's `AGENTS.md` that points to it, and the Tessli registry served at `http://127.0.0.1:4100` from `web/public/r/` at the frozen commit. The builder lists items with `curl -s http://127.0.0.1:4100/registry.json` and installs one with `npx shadcn@4.21.4 add http://127.0.0.1:4100/<name>.json`. The registry is local, so it is pinned to the frozen commit and works without reaching GitHub; the GitHub registry (`online-scope-lab/tessli/<name>`) is not used, because it follows `main`.
- **Runs:** three per brief per condition: **36 builds**.
- **Pairs:** a pair is the baseline and Tessli builds of the same brief with the same run index: **18 pairs**.
- **Prompts:** a system prompt and a task prompt, byte-identical in both conditions. Neither says the build is part of a comparison or names a condition; the only difference between conditions is what is in the project. The task prompt asks for each state to be viewable at `/?state=<name>`, marked with `data-state` on `<main>`, so states can be captured without clicking through.
- **Order:** for each brief and run index the two builds run back to back: baseline first for run 1 and 3, Tessli first for run 2. Briefs run in order 01–06.
- **Every build counts.** A build that fails, times out or never builds is reviewed as it is (its packet says what is missing). A run may be repeated only for an infrastructure failure outside the builder (the harness crashed before the builder produced anything, the network was down); the failed run stays in `runs/` with the reason recorded, and its replacement gets a new id.

## Frozen per run

`bench/frozen.json` is committed before the first scored build and copied into every run's manifest. A pair is valid only if both manifests agree on every field ([`scripts/validate_pair.py`](scripts/validate_pair.py)).

| Field | What is frozen |
| --- | --- |
| `builder_harness` | the agent harness and its exact version |
| `model` | always `withheld-by-operator` in committed files (see below) |
| `model_record_sha256` | SHA-256 of the operator's private model record |
| `reasoning_level` | the reasoning or effort setting |
| `tools` | every tool the builder may use |
| `network_policy` | what the builder may reach (the same in both conditions) |
| `time_allowance_minutes` | wall-clock limit per build |
| `turn_allowance` | prompts the builder receives; `1` means the task prompt only, with no follow-up or repair turns |
| `verification_steps` | what the operator runs after the build |

`new_run.py` adds, automatically: the bench commit (it refuses a scored run when the starter, conditions, briefs, rules or registry have uncommitted changes), the starter's hash, the Node.js and npm versions, the SHA-256 of both rendered prompts and of the brief, and for Tessli runs the hashes of the overlay, `TESSLI.md` and the registry. `record_run.py` records elapsed time, turns, tokens (when the harness reports them) and the hash of the finished workspace, which is checked again before pairing.

**The model is withheld from committed files.** Repository policy for this automation forbids writing model identifiers into committed files, so every manifest's `model` field says `withheld-by-operator`. Before the first build the operator writes a private record (the exact model identifier, the harness version and the date) and commits only its SHA-256 as `model_record_sha256`. The record is published with the results, and anyone can check it against the hash.

**Network policy.** Both conditions get the same network: the npm registry and `ui.shadcn.com` (or one local mirror of it set through `REGISTRY_URL`, used identically in both), so `npx shadcn add` works the same way. No web search or browsing in either condition. The local Tessli registry runs only during Tessli builds.

## Isolation

Each build runs in a fresh copy of the starter in a directory outside the repository and outside any Git repository, named only by an opaque run id (`r` and 12 hex digits). It contains no `.git`, no bench files and nothing that names the comparison; `new_run.py` checks this before the build. The builder's working directory is that copy; it must not be given the path of this repository.

## Blinding

1. After all 36 builds are captured, [`scripts/randomize_blind_labels.py`](scripts/randomize_blind_labels.py) validates every pair and labels the two builds of each pair A and B from a secret seed, balanced so that the Tessli build is A in half the pairs.
2. The **sealed mapping** is written to a path outside the repository that only the operator can read. The **commitment**, a SHA-256 over the mapping and a 256-bit secret salt, is committed as `bench/packets/commitment.json` before any packet goes out.
3. [`scripts/prepare_blind_packet.py`](scripts/prepare_blind_packet.py) writes one Markdown packet per pair: the brief, the reviewer notes, both builds' screenshots in every state at 1440, 768 and 390 px, a summary of the mechanical evidence and the empty score form. It refuses to write a packet that names a condition, a run id or a run path. Pair ids name the brief and nothing else.
4. Screenshots live on the `bench-artifacts` branch, not `main`; packets link to them by raw URL. Run directories (manifests name the condition) stay with the operator until the reveal.
5. Before packets go out the operator looks at every screenshot for text that names Tessli or the setup (for example an item's demo copy). Nothing is edited; any such case is listed in the results as a blinding failure for that pair.

## Review

- **Reviewers:** at least three independent humans score every pair; ideally the same reviewers score all 18 pairs. The operator, who holds the mapping, does not review. Reviewers do not discuss builds with each other before the reveal and do not use AI assistance to score.
- **What they see:** the packet only, not the code. Code would reveal the condition (installed items and `TESSLI.md` are visible in it).
- **Scores:** for each of the twelve dimensions in [`docs/quality-gates.md`](../docs/quality-gates.md#review-dimensions), a 1–5 score for A and for B (higher is always better; for regression risk, 5 means the least risk), a preference (A, B or tie) and a written note pointing at something visible. The questions each dimension asks are in every packet and in [`schemas/score.schema.json`](schemas/score.schema.json).

| Dimension | Question |
| --- | --- |
| Task fit | Does the screen do what the brief asks, for the person it describes? |
| Hierarchy | Is it clear what matters most, what to read first and what to do next? |
| Mobile usability | At 390 px, is it comfortable to read and operate, not a squeezed desktop? |
| Discoverability | Can people find the controls and paths the brief needs without guessing? |
| Density | Is the amount of information per screen right for the task: not cramped, not sparse? |
| Coherence | Do the parts read as one designed screen rather than assembled pieces? |
| Consistency | Are the same things done the same way across the screen and its states? |
| Component reuse | Are repeated elements (buttons, fields, rows, messages) visibly one consistent set? |
| Accessibility | Labels, contrast, focus, target size and structure; use the axe counts as one input. |
| Restraint | Free of decoration, effects and invented content the task does not need? |
| Regression risk | How likely is it to break or mislead in real use: overflow, broken states, risky actions? |
| Ship readiness | Could this be shipped as it is, with minor fixes at most? |

- **Submission:** each reviewer commits `bench/scores/<pair-id>/<github-handle>.json` through a pull request from their own account. [`scripts/validate_scores.py`](scripts/validate_scores.py) rejects any file that is not attributed to a named human reviewer with a submission timestamp after the commitment, that leaves any field empty, or whose reviewer is software. Scores are human input only: no script in the bench writes, fills in or edits a score, and the validator refuses to run inside the harness or a coding-agent session. Scores are not edited after the reveal.

## Agreement

[`scripts/agreement.py`](scripts/agreement.py) reports:

- **Krippendorff's alpha (ordinal)** for each dimension, with one unit per side of each pair (36 units) and the reviewers' scores as values, and overall, with one unit per side, pair and dimension (432 units);
- **preference counts** (A, B, tie) for every pair and dimension, and after the reveal the same counts by condition.

## Decision rule

Fixed now, applied once after the reveal.

1. **Primary outcome: ship readiness preference.** In each pair, the build preferred by more reviewers on ship readiness wins the pair; equal counts are a tie.
2. **Test:** a one-sided exact sign test over the pairs that are not tied. With 18 pairs and no ties, the Tessli build must win at least 13 for p ≤ 0.05.
3. **Reliability:** ordinal alpha on ship readiness must be at least 0.667, and every pair must have at least three reviewers. Otherwise the verdict is **unreliable** and no claim is made either way.
4. **Guardrail:** the Tessli build must not lose more pairs than it wins on accessibility.

| Verdict | When | What follows |
| --- | --- | --- |
| `tessli-clearly-better` | p ≤ 0.05 for Tessli, reliable, guardrail holds | Tessli may report exactly that, with the numbers and a link to the results: "In the Taste Bench, human reviewers preferred the build made with Tessli in N of 18 pairs." Never a general claim about taste or about AI output. |
| `baseline-clearly-better` | p ≤ 0.05 for baseline, reliable | Published as it is. Change the rules and items and run again under a new protocol version, or drop the claim. |
| `no-clear-difference` | otherwise | Same as above. |
| `unreliable` | alpha below 0.667 or too few reviewers | Published as it is; no claim. A new review round needs a new protocol version and new labels. |

Everything else (per-dimension wins, mean score differences, the mechanical evidence by condition) is reported as descriptive and exploratory, never as the result.

## Threats to validity

- **The builder could inspect Tessli.** The workspace is outside the repository and has no Git history, but a builder with network or web access could find the public repository, and its model may have seen Tessli during training. The network policy forbids web search in both conditions, and it is frozen.
- **The code reveals the condition.** Reviewers see screenshots and mechanical evidence only, so component reuse and regression risk are judged from what renders, not from the code. Visual habits of the Tessli items could still hint at the condition; demo text could name it (see Blinding, step 5).
- **Small n.** Eighteen pairs detect only a large difference: Tessli must win at least 13 of 18. A null result is not proof of no effect.
- **Same-family model.** Tessli's rules and items were drafted with help from coding agents. If the builder's model is from the same family, it may share the authors' preferences, which could inflate the effect; the result applies only to the builder used.
- **Reviewers recruited by the owner.** Reviewers may know Tessli and favour its style. Mitigations: blind labels, the declarations in every score file, at least three reviewers per pair, and publishing every reviewer's handle and notes.
- **The yardstick overlaps the rules.** Several Tessli rules cite the same review dimensions reviewers score, so the Tessli condition is measured on its own terms. The briefs and reviewer notes are written from each brief's requirements, not from the rules.
- **An artificial handover.** The `?state=` contract, fixture data and a single prompt with no repair turns are the same for both conditions but are not how real projects are built.
- **The operator knows the mapping.** The operator does not review, packets are generated mechanically, and the commitment is public before review starts.

## Publication

- **Before the first scored build:** this protocol, the briefs, starter, prompts and scripts (this commit), then `bench/frozen.json` with the model record hash.
- **Before review:** `bench/packets/` (the commitment, every packet) on `main` and the packet screenshots on `bench-artifacts`.
- **After every score is committed:** the reveal (`reveal.py` checks the commitment and that every score is committed first), all 36 run directories (manifests, prompts, telemetry, evidence), their screenshots on `bench-artifacts`, every score file, the agreement and outcome files, and the private model record.
- **The `/bench` page** is built only after human scores exist, and shows the result whatever it is, failed builds and blinding failures included.
