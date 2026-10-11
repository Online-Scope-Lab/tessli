#!/usr/bin/env python3
"""Assign blind labels A and B to every pair and commit to the mapping.

Pairs are formed from the run manifests (same brief, same run index, one run
per condition) and each pair must pass validate_pair.py first. Labels come from
a secret seed (`--seed` or the BENCH_SEED environment variable) and are
balanced: half the pairs show the Tessli build as A, half as B.

Two files are written:

- the SEALED mapping, at a path OUTSIDE this repository that the operator
  chooses and keeps private until every score is committed;
- the public COMMITMENT (bench/packets/commitment.json by default): the SHA-256
  of the sealed payload, which includes a 256-bit salt derived from the seed,
  so the mapping cannot be guessed from the hash. Only this file is committed.

    BENCH_SEED=$(python3 -c "import secrets; print(secrets.token_hex(32))")
    python3 -I bench/scripts/randomize_blind_labels.py --sealed ~/bench-private/mapping.json
"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import argparse
from pathlib import Path

import bench_lib as lib
from validate_pair import pair_errors

MIN_SEED_LENGTH = 32


def pair_id(seed: str, brief_id: str, run_index: int) -> str:
    return f"{brief_id}-{lib.hmac_hex(seed, f'pair:{brief_id}:{run_index}')[:6]}"


def assign(seed: str, pairs: dict[tuple[str, int], dict[str, str]]) -> dict:
    """Build the sealed payload: {version, salt, pairs: {pair_id: {A: {...}, B: {...}}}}."""
    order = sorted(pairs, key=lambda key: lib.hmac_hex(seed, f"order:{key[0]}:{key[1]}"))
    half = len(order) // 2
    payload_pairs: dict[str, dict] = {}
    keys: dict[str, dict] = {}
    for position, key in enumerate(order):
        if position < half:
            tessli_label = "A"
        elif position < 2 * half:
            tessli_label = "B"
        else:  # odd count: the last pair is decided by the seed
            tessli_label = "A" if int(lib.hmac_hex(seed, "odd"), 16) % 2 == 0 else "B"
        other_label = "B" if tessli_label == "A" else "A"
        slot = pairs[key]
        identifier = pair_id(seed, key[0], key[1])
        if identifier in payload_pairs:
            raise ValueError(f"Pair id collision for {identifier}; choose another seed")
        payload_pairs[identifier] = {
            tessli_label: {"condition": "tessli", "run_id": slot["tessli"]},
            other_label: {"condition": "baseline", "run_id": slot["baseline"]},
        }
        keys[identifier] = {"brief_id": key[0], "run_index": key[1]}
    payload = {"version": 1, "salt": lib.hmac_hex(seed, "salt"), "pairs": payload_pairs}
    return {"payload": payload, "pair_keys": keys}


def commitment_of(payload: dict) -> str:
    return lib.sha256_bytes(lib.canonical_json(payload))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--runs-dir", type=Path, default=lib.BENCH_DIR / "runs")
    parser.add_argument("--sealed", type=Path, required=True, help="Private mapping file, outside this repository")
    parser.add_argument("--commitment", type=Path, default=lib.BENCH_DIR / "packets" / "commitment.json")
    parser.add_argument("--seed", help="Secret seed (default: the BENCH_SEED environment variable)")
    parser.add_argument("--allow-dry-run", action="store_true", help="Accept non-evaluative runs (harness checks only)")
    args = parser.parse_args(argv)

    seed = args.seed or os.environ.get("BENCH_SEED", "")
    if len(seed) < MIN_SEED_LENGTH:
        parser.error(f"The seed must be secret and at least {MIN_SEED_LENGTH} characters (use secrets.token_hex(32))")
    sealed = args.sealed.expanduser().resolve()
    if lib.is_within(sealed, lib.REPO_ROOT):
        parser.error("--sealed must be outside the repository: the mapping stays private until scores are committed")
    if sealed.exists():
        parser.error(f"Refusing to overwrite {sealed}")
    if args.commitment.exists():
        parser.error(f"Refusing to overwrite {args.commitment}; a batch is blinded once")

    runs = lib.load_runs(args.runs_dir)
    pairs, errors = lib.group_pairs(runs)
    for key, slot in sorted(pairs.items()):
        if set(slot) != set(lib.CONDITIONS):
            continue
        dirs = (args.runs_dir / slot["baseline"], args.runs_dir / slot["tessli"])
        errors.extend(
            f"brief {key[0]} run {key[1]}: {problem}"
            for problem in pair_errors(dirs, allow_dry_run=args.allow_dry_run)
        )
    if not pairs:
        errors.append(f"No runs found under {args.runs_dir}")
    if errors:
        print("CANNOT BLIND")
        print("\n".join(f"- {error}" for error in errors))
        return 1

    result = assign(seed, pairs)
    payload = result["payload"]
    commitment = commitment_of(payload)
    created_at = lib.utc_now()
    lib.write_json(
        sealed,
        {
            "schema": "taste-bench-sealed-mapping/1",
            "created_at": created_at,
            "commitment": commitment,
            "payload": payload,
            "pair_keys": result["pair_keys"],
        },
        private=True,
        overwrite=False,
    )
    lib.write_json(
        args.commitment,
        {
            "schema": "taste-bench-commitment/1",
            "algorithm": "SHA-256 of the canonical JSON (sorted keys, no whitespace, UTF-8) of the sealed payload {version, salt, pairs}",
            "commitment": commitment,
            "created_at": created_at,
            "labels": list(lib.LABELS),
            "pair_ids": sorted(payload["pairs"]),
        },
        overwrite=False,
    )
    print(f"{len(payload['pairs'])} pairs blinded; commitment {commitment}")
    print(f"Sealed mapping: {sealed} (keep it private and out of the repository)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
