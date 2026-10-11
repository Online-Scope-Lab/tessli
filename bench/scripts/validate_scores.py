#!/usr/bin/env python3
"""Validate human review scores for blinded Taste Bench pairs.

Scores are human input only. A score file is rejected unless it is attributed
to a named human reviewer, carries a submission timestamp and the reviewer's
declarations, and fills in every dimension: a 1-5 score for A and for B, a
preference (A, B or tie) and a written note. Names that belong to software
(an AI model, a bot, an agent, the harness) are rejected.

This script never writes or edits a score, and it refuses to run inside the
bench harness or a coding-agent session (see bench_lib.AGENT_ENV_MARKERS).

    python3 -I bench/scripts/validate_scores.py bench/scores
"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import argparse
import json
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path

import bench_lib as lib

SCHEMA = "taste-bench-score/1"
PREFERENCES = ("A", "B", "tie")
DECLARATIONS = ("human_reviewer", "scored_without_ai_assistance", "condition_unknown_while_scoring", "not_the_operator")
TOP_LEVEL = {"schema", "pair_id", "reviewer", "reviewer_kind", "submitted_at", "declarations", "dimensions", "overall_note"}
MIN_NOTE_LENGTH = 15
SOFTWARE_WORDS = re.compile(
    r"\b(gpt[\w.-]*|chatgpt|openai|anthropic|codex|copilot|llm|bot|robot|agent|assistant|harness|"
    r"automation|automated|tessli)\b",
    re.IGNORECASE,
)
UPPERCASE_AI = re.compile(r"\bAI\b|\bA\.I\.")
MODEL_FAMILY = re.compile(
    r"^\s*(claude|gemini|llama|mistral|bard|grok|deepseek|qwen)\s*$|"
    r"\b(claude|gemini|llama|mistral|grok|deepseek|qwen)[\s._-]*\d",
    re.IGNORECASE,
)


KNOWN_BOT_HANDLES = {"dependabot", "renovate", "github-actions", "copilot", "claude", "codex", "devin"}


def names_software(text: str) -> bool:
    """True when a reviewer name or handle names an AI model, a bot or the harness."""
    return bool(SOFTWARE_WORDS.search(text) or UPPERCASE_AI.search(text) or MODEL_FAMILY.search(text))


HANDLE = re.compile(r"^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$")


def score_errors(data: object, *, pair_ids: set[str] | None = None, not_before: datetime | None = None) -> list[str]:
    """Every reason this score document is not an acceptable human review."""
    if not isinstance(data, dict):
        return ["the file must hold one JSON object"]
    errors: list[str] = []
    if data.get("schema") != SCHEMA:
        errors.append(f"schema must be {SCHEMA!r}")
    for key in sorted(set(data) - TOP_LEVEL):
        errors.append(f"unexpected field {key!r}")

    pair = data.get("pair_id")
    if not isinstance(pair, str) or not pair:
        errors.append("pair_id is missing")
    elif pair_ids is not None and pair not in pair_ids:
        errors.append(f"pair_id {pair!r} is not in the committed list of pairs")

    reviewer = data.get("reviewer")
    if not isinstance(reviewer, dict):
        errors.append("reviewer must name the human reviewer: {\"name\": ..., \"github\": ...}")
    else:
        for key in sorted(set(reviewer) - {"name", "github"}):
            errors.append(f"unexpected reviewer field {key!r}")
        name = reviewer.get("name")
        github = reviewer.get("github")
        if not isinstance(name, str) or len(name.strip()) < 2:
            errors.append("reviewer.name must be the reviewer's name")
        elif names_software(name):
            errors.append(f"reviewer.name {name!r} names software; scores must come from a human reviewer")
        if not isinstance(github, str) or not HANDLE.match(github):
            errors.append("reviewer.github must be the reviewer's GitHub handle")
        elif names_software(github.replace("-", " ")) or github.lower() in KNOWN_BOT_HANDLES:
            errors.append(f"reviewer.github {github!r} names software; scores must come from a human reviewer")

    if data.get("reviewer_kind") != "human":
        errors.append("reviewer_kind must be \"human\"; AI or delegated reviews are not accepted")

    submitted = lib.parse_timestamp(data.get("submitted_at"))
    if submitted is None:
        errors.append("submitted_at must be an ISO 8601 timestamp with a time zone, e.g. 2026-11-02T14:05:00Z")
    else:
        if submitted > datetime.now(timezone.utc) + timedelta(minutes=5):
            errors.append("submitted_at is in the future")
        if not_before is not None and submitted < not_before:
            errors.append("submitted_at is earlier than the blinding commitment")

    declarations = data.get("declarations")
    if not isinstance(declarations, dict):
        errors.append("declarations are missing")
    else:
        for key in DECLARATIONS:
            if declarations.get(key) is not True:
                errors.append(f"declarations.{key} must be true")
        for key in sorted(set(declarations) - set(DECLARATIONS)):
            errors.append(f"unexpected declaration {key!r}")

    dimensions = data.get("dimensions")
    if not isinstance(dimensions, dict):
        errors.append("dimensions are missing")
    else:
        for key in sorted(set(dimensions) - set(lib.DIMENSIONS)):
            errors.append(f"unknown dimension {key!r}")
        for key in lib.DIMENSIONS:
            entry = dimensions.get(key)
            if not isinstance(entry, dict):
                errors.append(f"dimensions.{key} is missing")
                continue
            for side in lib.LABELS:
                value = entry.get(side)
                if isinstance(value, bool) or not isinstance(value, int) or not 1 <= value <= 5:
                    errors.append(f"dimensions.{key}.{side} must be a whole number from 1 to 5")
            if entry.get("preference") not in PREFERENCES:
                errors.append(f"dimensions.{key}.preference must be A, B or tie")
            note = entry.get("note")
            if not isinstance(note, str) or len(note.strip()) < MIN_NOTE_LENGTH:
                errors.append(f"dimensions.{key}.note must explain the scores ({MIN_NOTE_LENGTH}+ characters)")
            for extra in sorted(set(entry) - {"A", "B", "preference", "note"}):
                errors.append(f"unexpected field dimensions.{key}.{extra}")
    if "overall_note" in data and not isinstance(data["overall_note"], str):
        errors.append("overall_note must be text")
    return errors


def load_commitment(path: Path) -> tuple[set[str] | None, datetime | None]:
    if not path.is_file():
        return None, None
    commitment = lib.read_json(path)
    return set(commitment.get("pair_ids", [])), lib.parse_timestamp(commitment.get("created_at"))


def score_files(paths: list[Path]) -> list[Path]:
    files: list[Path] = []
    for path in paths:
        if path.is_dir():
            files.extend(sorted(p for p in path.rglob("*.json") if p.is_file()))
        else:
            files.append(path)
    return files


def load_valid_scores(scores_dir: Path, commitment_path: Path) -> tuple[list[dict], list[str]]:
    """All score documents under scores_dir, or the errors that make any of them unusable."""
    pair_ids, not_before = load_commitment(commitment_path)
    if pair_ids is None:
        return [], [f"{commitment_path} not found: scores can only be checked against a committed blinding"]
    documents: list[dict] = []
    errors: list[str] = []
    seen: set[tuple[str, str]] = set()
    if not scores_dir.is_dir():
        return documents, errors
    for path in score_files([scores_dir]):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as error:
            errors.append(f"{path}: not readable JSON ({error})")
            continue
        problems = score_errors(data, pair_ids=pair_ids, not_before=not_before)
        if not problems:
            key = (data["pair_id"], data["reviewer"]["github"].lower())
            if key in seen:
                problems.append(f"{data['reviewer']['github']} scored pair {data['pair_id']} twice")
            seen.add(key)
            if path.parent.name != data["pair_id"]:
                problems.append(f"file must live in {data['pair_id']}/, not {path.parent.name}/")
        errors.extend(f"{path}: {problem}" for problem in problems)
        if not problems:
            documents.append(data | {"_path": str(path)})
    return documents, errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("paths", type=Path, nargs="+", help="Score files or directories (e.g. bench/scores)")
    parser.add_argument("--commitment", type=Path, default=lib.BENCH_DIR / "packets" / "commitment.json")
    args = parser.parse_args(argv)

    markers = lib.agent_markers_present()
    if markers:
        print(
            "REFUSED: scores are human input only, and this looks like an automated or agent session "
            f"({', '.join(markers)} set). Run it yourself in your own terminal."
        )
        return 3

    pair_ids, not_before = load_commitment(args.commitment)
    files = score_files(args.paths)
    if not files:
        print("No score files found")
        return 1
    failed = False
    for path in files:
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as error:
            print(f"INVALID {path}: not readable JSON ({error})")
            failed = True
            continue
        problems = score_errors(data, pair_ids=pair_ids, not_before=not_before)
        if problems:
            failed = True
            print(f"INVALID {path}")
            print("\n".join(f"  - {problem}" for problem in problems))
        else:
            print(f"VALID   {path}")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
