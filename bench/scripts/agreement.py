#!/usr/bin/env python3
"""Reviewer agreement and the pre-registered outcome for the Taste Bench.

- Krippendorff's alpha (ordinal) for each of the 12 dimensions, and overall,
  over the 1-5 scores. A unit is one side (A or B) of one pair (per dimension),
  or one side of one pair on one dimension (overall); its values are the
  reviewers' scores.
- Preference counts (A / B / tie) for every pair and dimension.
- With --reveal (after reveal.py): the same counts by condition, and the
  decision rule from bench/PROTOCOL.md applied to ship readiness.

Standard library only; alpha follows Krippendorff (2011), "Computing
Krippendorff's Alpha-Reliability", and is tested on its worked examples.

    python3 -I bench/scripts/agreement.py --out bench/results/agreement.json
    python3 -I bench/scripts/agreement.py --reveal bench/results/reveal.json --out bench/results/outcome.json
"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import argparse
from collections import defaultdict
from math import comb
from pathlib import Path
from typing import Hashable, Iterable, Sequence

import bench_lib as lib
from validate_scores import load_valid_scores

RELIABILITY_THRESHOLD = 0.667  # Krippendorff's lowest acceptable alpha for tentative conclusions
SIGNIFICANCE = 0.05
PRIMARY_DIMENSION = "ship_readiness"
GUARDRAIL_DIMENSION = "accessibility"


def krippendorff_alpha(units: Iterable[Sequence[Hashable]], metric: str = "ordinal") -> float | None:
    """Krippendorff's alpha for units given as lists of the values coders assigned.

    Missing values are simply left out of a unit. Units with fewer than two
    values are not pairable and are ignored. Returns None when alpha is
    undefined (fewer than two pairable values, or no variation at all).
    """
    if metric not in {"nominal", "ordinal", "interval"}:
        raise ValueError(f"Unknown metric {metric!r}")
    pairable = [list(unit) for unit in units if len(unit) >= 2]
    values = sorted({value for unit in pairable for value in unit})
    if len(values) < 2:
        return None
    coincidence: dict[tuple, float] = defaultdict(float)
    for unit in pairable:
        weight = 1 / (len(unit) - 1)
        for i, c in enumerate(unit):
            for j, k in enumerate(unit):
                if i != j:
                    coincidence[(c, k)] += weight
    totals = {c: sum(coincidence[(c, k)] for k in values) for c in values}
    n = sum(totals.values())
    index = {value: position for position, value in enumerate(values)}

    def delta2(c, k) -> float:
        if metric == "nominal":
            return 0.0 if c == k else 1.0
        if metric == "interval":
            return float(c - k) ** 2
        low, high = sorted((index[c], index[k]))
        between = sum(totals[values[g]] for g in range(low, high + 1))
        return (between - (totals[c] + totals[k]) / 2) ** 2

    observed = sum(coincidence[(c, k)] * delta2(c, k) for c in values for k in values)
    expected = sum(totals[c] * totals[k] * delta2(c, k) for c in values for k in values) / (n - 1)
    if expected == 0:
        return None
    return 1 - observed / expected


def sign_test_p(wins: int, losses: int) -> float:
    """One-sided exact sign test: P(X >= wins) for X ~ Binomial(wins + losses, 1/2)."""
    n = wins + losses
    if n == 0:
        return 1.0
    return sum(comb(n, k) for k in range(wins, n + 1)) / 2**n


def rounded(value: float | None) -> float | None:
    return None if value is None else round(value, 4)


def analyse(documents: list[dict], pair_ids: list[str], mapping: dict | None = None) -> dict:
    by_pair: dict[str, list[dict]] = defaultdict(list)
    for document in documents:
        by_pair[document["pair_id"]].append(document)

    per_dimension = {}
    overall_units = []
    for dimension in lib.DIMENSIONS:
        units = []
        for pair in pair_ids:
            for side in lib.LABELS:
                unit = [doc["dimensions"][dimension][side] for doc in by_pair[pair]]
                units.append(unit)
        overall_units.extend(units)
        per_dimension[dimension] = {
            "alpha_ordinal": rounded(krippendorff_alpha(units, "ordinal")),
            "units": sum(1 for unit in units if len(unit) >= 2),
            "scores": sum(len(unit) for unit in units),
        }

    preferences: dict[str, dict] = {}
    for pair in pair_ids:
        preferences[pair] = {"reviewers": len(by_pair[pair]), "dimensions": {}}
        for dimension in lib.DIMENSIONS:
            counts = {"A": 0, "B": 0, "tie": 0}
            for doc in by_pair[pair]:
                counts[doc["dimensions"][dimension]["preference"]] += 1
            preferences[pair]["dimensions"][dimension] = counts

    result: dict = {
        "schema": "taste-bench-agreement/1",
        "pairs": len(pair_ids),
        "reviewers": len({doc["reviewer"]["github"].lower() for doc in documents}),
        "score_files": len(documents),
        "alpha_ordinal": {
            "overall": rounded(krippendorff_alpha(overall_units, "ordinal")),
            "per_dimension": per_dimension,
        },
        "preferences_by_label": preferences,
    }
    if mapping is not None:
        result["outcome"] = outcome(preferences, mapping, per_dimension)
    return result


def outcome(preferences: dict, mapping: dict, per_dimension: dict) -> dict:
    """Apply the pre-registered decision rule (bench/PROTOCOL.md, "Decision rule")."""
    by_condition: dict[str, dict] = {}
    pair_winners: dict[str, dict[str, str]] = {}
    for pair, data in preferences.items():
        sides = mapping[pair]
        by_condition[pair] = {}
        pair_winners[pair] = {}
        for dimension, counts in data["dimensions"].items():
            converted = {"tessli": 0, "baseline": 0, "tie": counts["tie"]}
            for label in lib.LABELS:
                converted[sides[label]["condition"]] += counts[label]
            by_condition[pair][dimension] = converted
            if converted["tessli"] > converted["baseline"]:
                pair_winners[pair][dimension] = "tessli"
            elif converted["baseline"] > converted["tessli"]:
                pair_winners[pair][dimension] = "baseline"
            else:
                pair_winners[pair][dimension] = "tie"

    def tally(dimension: str) -> dict[str, int]:
        counts = {"tessli": 0, "baseline": 0, "tie": 0}
        for winners in pair_winners.values():
            counts[winners[dimension]] += 1
        return counts

    primary = tally(PRIMARY_DIMENSION)
    guardrail = tally(GUARDRAIL_DIMENSION)
    p_tessli = sign_test_p(primary["tessli"], primary["baseline"])
    p_baseline = sign_test_p(primary["baseline"], primary["tessli"])
    alpha = per_dimension[PRIMARY_DIMENSION]["alpha_ordinal"]
    too_few = [pair for pair, data in preferences.items() if data["reviewers"] < 3]

    if too_few or alpha is None or alpha < RELIABILITY_THRESHOLD:
        verdict = "unreliable"
    elif p_tessli <= SIGNIFICANCE and guardrail["baseline"] <= guardrail["tessli"]:
        verdict = "tessli-clearly-better"
    elif p_baseline <= SIGNIFICANCE:
        verdict = "baseline-clearly-better"
    else:
        verdict = "no-clear-difference"
    return {
        "verdict": verdict,
        "primary_dimension": PRIMARY_DIMENSION,
        "pairs_won": primary,
        "sign_test_p": {"tessli": round(p_tessli, 4), "baseline": round(p_baseline, 4)},
        "alpha_ordinal_primary": alpha,
        "reliability_threshold": RELIABILITY_THRESHOLD,
        "guardrail": {"dimension": GUARDRAIL_DIMENSION, "pairs_won": guardrail},
        "pairs_with_too_few_reviewers": too_few,
        "pairs_won_by_dimension": {dimension: tally(dimension) for dimension in lib.DIMENSIONS},
        "preferences_by_condition": by_condition,
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--scores-dir", type=Path, default=lib.BENCH_DIR / "scores")
    parser.add_argument("--commitment", type=Path, default=lib.BENCH_DIR / "packets" / "commitment.json")
    parser.add_argument("--reveal", type=Path, help="reveal.json from reveal.py; adds the outcome by condition")
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args(argv)

    documents, errors = load_valid_scores(args.scores_dir, args.commitment)
    if errors:
        print("SCORES INVALID")
        print("\n".join(f"- {error}" for error in errors))
        return 1
    if not documents:
        print("No scores yet")
        return 1
    pair_ids = sorted(lib.read_json(args.commitment)["pair_ids"])
    mapping = lib.read_json(args.reveal)["pairs"] if args.reveal else None
    result = analyse(documents, pair_ids, mapping)
    lib.write_json(args.out, result)
    print(f"alpha (ordinal), overall: {result['alpha_ordinal']['overall']}")
    for dimension, data in result["alpha_ordinal"]["per_dimension"].items():
        print(f"  {dimension:18} {data['alpha_ordinal']}")
    if mapping is not None:
        print(f"verdict: {result['outcome']['verdict']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
