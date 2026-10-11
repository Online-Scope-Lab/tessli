#!/usr/bin/env python3
"""Reveal which build was which, once every score is committed.

Checks, in order, and refuses on the first failure:

1. the sealed mapping hashes to the committed commitment (bench/packets/commitment.json);
2. every committed pair has valid scores from at least --min-reviewers distinct human reviewers;
3. every score file is tracked by Git and unchanged since the last commit.

Then it writes the label-to-condition mapping, with the salt so anyone can
re-check the commitment, to --out (e.g. bench/results/reveal.json).

    python3 -I bench/scripts/reveal.py --sealed ~/bench-private/mapping.json --out bench/results/reveal.json
"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import argparse
import subprocess
from collections import defaultdict
from pathlib import Path

import bench_lib as lib
from randomize_blind_labels import commitment_of
from validate_scores import load_valid_scores

MIN_REVIEWERS = 3


def git(cwd: Path, *args: str) -> subprocess.CompletedProcess:
    return subprocess.run(["git", "-C", str(cwd), *args], capture_output=True, text=True)


def uncommitted_scores(paths: list[Path]) -> list[str]:
    """Score files that are untracked or modified since the last commit."""
    problems = []
    for path in paths:
        root = git(path.parent, "rev-parse", "--show-toplevel")
        if root.returncode != 0:
            problems.append(f"{path}: not inside a Git repository")
            continue
        if git(path.parent, "ls-files", "--error-unmatch", path.name).returncode != 0:
            problems.append(f"{path}: not committed")
        elif git(path.parent, "diff", "--quiet", "HEAD", "--", path.name).returncode != 0:
            problems.append(f"{path}: changed since it was committed")
    return problems


def reveal(sealed: dict, public: dict, scores_dir: Path, commitment_path: Path, min_reviewers: int) -> tuple[dict | None, list[str]]:
    payload = sealed["payload"]
    commitment = commitment_of(payload)
    if commitment != public.get("commitment") or commitment != sealed.get("commitment"):
        return None, ["the sealed mapping does not hash to the committed commitment"]
    if sorted(payload["pairs"]) != sorted(public.get("pair_ids", [])):
        return None, ["the sealed mapping and the commitment list different pairs"]

    documents, errors = load_valid_scores(scores_dir, commitment_path)
    if errors:
        return None, errors
    reviewers: dict[str, set[str]] = defaultdict(set)
    for document in documents:
        reviewers[document["pair_id"]].add(document["reviewer"]["github"].lower())
    for pair in sorted(payload["pairs"]):
        if len(reviewers[pair]) < min_reviewers:
            errors.append(f"pair {pair} has {len(reviewers[pair])} reviewers; {min_reviewers} are needed before the reveal")
    if errors:
        return None, errors
    errors = uncommitted_scores([Path(document["_path"]) for document in documents])
    if errors:
        return None, errors

    head = git(scores_dir, "rev-parse", "HEAD").stdout.strip()
    return {
        "schema": "taste-bench-reveal/1",
        "revealed_at": lib.utc_now(),
        "commitment": commitment,
        "salt": payload["salt"],
        "scores_commit": head,
        "pairs": {
            pair: {label: dict(sides[label]) for label in lib.LABELS} for pair, sides in sorted(payload["pairs"].items())
        },
    }, []


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--sealed", type=Path, required=True)
    parser.add_argument("--commitment", type=Path, default=lib.BENCH_DIR / "packets" / "commitment.json")
    parser.add_argument("--scores-dir", type=Path, default=lib.BENCH_DIR / "scores")
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--min-reviewers", type=int, default=MIN_REVIEWERS)
    args = parser.parse_args(argv)
    if args.min_reviewers < MIN_REVIEWERS:
        parser.error(f"The protocol needs at least {MIN_REVIEWERS} reviewers per pair")

    result, errors = reveal(
        lib.read_json(args.sealed), lib.read_json(args.commitment), args.scores_dir, args.commitment, args.min_reviewers
    )
    if errors:
        print("NOT REVEALED")
        print("\n".join(f"- {error}" for error in errors))
        return 1
    lib.write_json(args.out, result, overwrite=False)
    print(f"Revealed {len(result['pairs'])} pairs to {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
