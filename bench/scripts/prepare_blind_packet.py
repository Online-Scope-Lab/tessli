#!/usr/bin/env python3
"""Write one blind-review packet per pair, plus the screenshots it links to.

For every pair in the sealed mapping this writes <out>/<pair-id>/PACKET.md and
an empty <out>/<pair-id>/score-form.json, and copies each build's screenshots
to <artifacts-out>/packets/<pair-id>/<A|B>/<state>-<width>.png. The packet
links the screenshots by raw URL on the `bench-artifacts` branch, so main
stays small: push <artifacts-out> to that branch before sharing packets.

A packet carries the brief, the reviewer notes, the screenshots for A and B at
1440, 768 and 390 px, a summary of the mechanical evidence and the 12-dimension
score form with empty fields. It never names a condition, a run id or a path
that could reveal one; the script refuses to write a packet that does.

    python3 -I bench/scripts/prepare_blind_packet.py --sealed ~/bench-private/mapping.json \
        --artifacts-out ~/bench-artifacts
"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import argparse
import re
import shutil
from pathlib import Path

import bench_lib as lib
from randomize_blind_labels import commitment_of

DEFAULT_ARTIFACTS_URL = "https://raw.githubusercontent.com/Online-Scope-Lab/tessli/bench-artifacts"


def demote(markdown: str, levels: int = 2) -> str:
    lines = []
    fenced = False
    for line in markdown.strip().splitlines():
        if line.startswith("```"):
            fenced = not fenced
        if not fenced and re.match(r"^#{1,6}\s", line):
            line = "#" * levels + line
        lines.append(line)
    return "\n".join(lines)


def evidence_rows(evidence: dict | None) -> dict[str, str]:
    if evidence is None or evidence.get("summary") is None:
        return {"build": "not captured"}
    summary = evidence["summary"]
    build = {True: "passed", False: "failed", None: "built outside capture"}[summary.get("build_ok")]
    overflow = summary.get("overflow") or []
    return {
        "build": build,
        "states": f"{summary.get('states_reachable', 0)} of {summary.get('states', 0)}",
        "overflow": ", ".join(f"`{item}`" for item in overflow) if overflow else "none",
        "console": str(summary.get("console_errors", 0)),
        "page": str(summary.get("page_errors", 0)),
        "axe_rules": str(summary.get("axe_violations_max", 0)),
        "axe_nodes": str(summary.get("axe_nodes_total", 0)),
    }


def score_form(pair: str) -> dict:
    return {
        "schema": "taste-bench-score/1",
        "pair_id": pair,
        "reviewer": {"name": "", "github": ""},
        "reviewer_kind": "human",
        "submitted_at": "",
        "declarations": {
            "human_reviewer": False,
            "scored_without_ai_assistance": False,
            "condition_unknown_while_scoring": False,
            "other_scores_unseen_while_scoring": False,
            "not_the_operator": False,
        },
        "dimensions": {key: {"A": None, "B": None, "preference": None, "note": ""} for key in lib.DIMENSIONS},
        "overall_note": "",
    }


def render_packet(
    pair: str,
    brief_dir: Path,
    states: list[str],
    images: dict[str, dict[tuple[str, int], str | None]],
    evidence: dict[str, dict | None],
    commitment: str,
) -> str:
    task = lib.read_task_yaml(brief_dir / "task.yaml")
    brief = demote((brief_dir / "brief.md").read_text(encoding="utf-8"))
    rubric_path = brief_dir / "rubric.md"
    rubric = demote(rubric_path.read_text(encoding="utf-8")) if rubric_path.is_file() else "_None._"
    rows_a, rows_b = evidence_rows(evidence["A"]), evidence_rows(evidence["B"])

    out = [
        f"# Blind review packet {pair}",
        "",
        f"Brief {task['id']}: {task['title']}. Two builds of this brief, labelled **A** and **B**. "
        "The labels were assigned at random and this packet does not say how either build was made. "
        "Review on your own: do not discuss the builds with other reviewers, do not open other reviewers' score files "
        "or pull requests until your own pull request is open, and do not try to find out which is which "
        "until every score is committed.",
        "",
        f"Blinding commitment: `{commitment}`.",
        "",
        "## How to review",
        "",
        "1. Read the brief and the reviewer notes below.",
        "2. Compare A and B in every state at 1440, 768 and 390 px. Open an image for full size.",
        "3. Read the mechanical evidence. It is one input; it does not decide any score.",
        f"4. Copy `score-form.json` to `bench/scores/{pair}/<your-github-handle>.json`, fill in every field and open a pull request. "
        "Every dimension needs a 1–5 score for A and for B, a preference (A, B or tie) and a note that points at something you can see. "
        "Other reviewers' score pull requests are public: do not open them, or anything under `bench/scores/`, "
        "until yours is submitted.",
        "",
        "Scale: 1 = poor, would not ship · 2 = weak · 3 = acceptable · 4 = good · 5 = excellent, would ship as is. "
        "Higher is always better; for regression risk, 5 means the least risk.",
        "",
        "## The brief",
        "",
        brief,
        "",
        "## Reviewer notes for this brief",
        "",
        rubric,
        "",
        "## Screenshots",
        "",
    ]
    for state in states:
        out += [f"### `{state}`", "", "| Width | A | B |", "| --- | --- | --- |"]
        for width in lib.WIDTHS:
            cells = []
            for label in lib.LABELS:
                url = images[label].get((state, width))
                cells.append(f"[![{label}, {state}, {width} px]({url})]({url})" if url else "no screenshot")
            out.append(f"| {width} px | {cells[0]} | {cells[1]} |")
        out.append("")
    out += [
        "## Mechanical evidence",
        "",
        "Captured the same way for both builds: every state at 1440, 768 and 390 px (overflow also at 320 px), "
        "axe-core with the WCAG 2.2 AA tags.",
        "",
        "| Check | A | B |",
        "| --- | --- | --- |",
    ]
    for key, title in (
        ("build", "Production build"),
        ("states", "States reachable by URL"),
        ("overflow", "Horizontal overflow (state@width)"),
        ("console", "Console errors"),
        ("page", "Uncaught page errors"),
        ("axe_rules", "axe rules violated (worst capture)"),
        ("axe_nodes", "axe affected elements (all captures)"),
    ):
        out.append(f"| {title} | {rows_a.get(key, '–')} | {rows_b.get(key, '–')} |")
    out += [
        "",
        "## Score form",
        "",
        "The file of record is `score-form.json`; this table shows what it asks.",
        "",
        "| Dimension | Question | A (1–5) | B (1–5) | Preference (A / B / tie) | Note |",
        "| --- | --- | --- | --- | --- | --- |",
    ]
    for key in lib.DIMENSIONS:
        out.append(f"| {lib.DIMENSION_TITLES[key]} | {lib.DIMENSION_QUESTIONS[key]} |  |  |  |  |")
    out += [
        "",
        "Before you submit, confirm the five declarations in the form: you are a human reviewer, you scored without AI "
        "assistance, you did not know which build was which, you did not see any other reviewer's scores before "
        "submitting yours, and you are not the person who ran the builds.",
        "",
    ]
    return "\n".join(out)


def leaks(text: str, forbidden: list[str], allowed_prefix: str = "") -> list[str]:
    """What in text could reveal a condition. The artifacts URL prefix is the same
    for both sides (it holds the repository name), so it is ignored."""
    if allowed_prefix:
        text = text.replace(allowed_prefix, "")
    found = sorted({match.group(0) for match in lib.CONDITION_LEAK_PATTERN.finditer(text)})
    found += [item for item in forbidden if item and item in text]
    if re.search(r"(^|[^\w])runs/", text):
        found.append("runs/")
    return found


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--sealed", type=Path, required=True)
    parser.add_argument("--commitment", type=Path, default=lib.BENCH_DIR / "packets" / "commitment.json")
    parser.add_argument("--runs-dir", type=Path, default=lib.BENCH_DIR / "runs")
    parser.add_argument("--out", type=Path, default=lib.BENCH_DIR / "packets")
    parser.add_argument("--artifacts-out", type=Path, required=True, help="Checkout of the bench-artifacts branch")
    parser.add_argument("--artifacts-url", default=DEFAULT_ARTIFACTS_URL, help="Raw URL of that branch")
    args = parser.parse_args(argv)

    artifacts_out = args.artifacts_out.expanduser().resolve()
    if lib.is_within(artifacts_out, lib.REPO_ROOT):
        parser.error("--artifacts-out must be outside this checkout: screenshots go to the bench-artifacts branch, not main")
    sealed = lib.read_json(args.sealed)
    public = lib.read_json(args.commitment)
    commitment = commitment_of(sealed["payload"])
    if commitment != public["commitment"] or commitment != sealed["commitment"]:
        print("The sealed mapping does not match the committed hash; refusing to build packets")
        return 1

    runs_dir = args.runs_dir.resolve()
    pairs = sealed["payload"]["pairs"]
    for pair, sides in sorted(pairs.items()):
        manifests = {label: lib.read_json(runs_dir / sides[label]["run_id"] / "manifest.json") for label in lib.LABELS}
        states = manifests["A"]["states"]
        brief_dir = lib.find_brief(manifests["A"]["brief_id"])
        images: dict[str, dict[tuple[str, int], str | None]] = {}
        evidence: dict[str, dict | None] = {}
        for label in lib.LABELS:
            run_dir = runs_dir / sides[label]["run_id"]
            evidence_path = run_dir / "evidence.json"
            evidence[label] = lib.read_json(evidence_path) if evidence_path.is_file() else None
            images[label] = {}
            for state in states:
                for width in lib.WIDTHS:
                    source = run_dir / "screenshots" / f"{state}-{width}.png"
                    if not source.is_file():
                        images[label][(state, width)] = None
                        continue
                    relative = f"packets/{pair}/{label}/{state}-{width}.png"
                    target = artifacts_out / relative
                    target.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copyfile(source, target)
                    images[label][(state, width)] = f"{args.artifacts_url.rstrip('/')}/{relative}"

        text = render_packet(pair, brief_dir, states, images, evidence, public["commitment"])
        form = lib.canonical_json(score_form(pair)).decode("utf-8")
        forbidden = [sides[label]["run_id"] for label in lib.LABELS] + [str(runs_dir), str(artifacts_out)]
        found = leaks(text + form, forbidden, args.artifacts_url.rstrip("/") + "/")
        if found:
            print(f"REFUSED: packet {pair} would reveal {', '.join(found)}")
            return 1
        destination = args.out / pair
        destination.mkdir(parents=True, exist_ok=True)
        (destination / "PACKET.md").write_text(text, encoding="utf-8")
        lib.write_json(destination / "score-form.json", score_form(pair))
        print(f"Packet {pair}: {destination / 'PACKET.md'}")
    print(f"Push {artifacts_out} to the bench-artifacts branch so the packet images resolve.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
