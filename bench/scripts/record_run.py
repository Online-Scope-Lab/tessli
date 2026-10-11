#!/usr/bin/env python3
"""Record a build's wall-clock time, turns, token use and final workspace hash.

Run `start` immediately before the builder gets the prompt and `finish` as soon
as it stops (or the time allowance runs out). `finish` hashes the workspace
(without node_modules and build output) so the code that was captured and
reviewed can be checked against the code the builder left.

    python3 -I bench/scripts/record_run.py start bench/runs/<run-id>
    python3 -I bench/scripts/record_run.py finish bench/runs/<run-id> \
        --workspace ~/work/<run-id> --outcome completed --turns 1
"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import argparse
import time
from pathlib import Path

import bench_lib as lib

OUTCOMES = ("completed", "time-allowance-reached", "builder-error")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("action", choices=["start", "finish"])
    parser.add_argument("run_dir", type=Path, help="bench/runs/<run-id>")
    parser.add_argument("--workspace", type=Path, help="The run's workspace (finish)")
    parser.add_argument("--outcome", choices=OUTCOMES, help="How the build ended (finish)")
    parser.add_argument("--turns", type=int, help="Builder turns used, prompt included (finish)")
    parser.add_argument("--input-tokens", type=int)
    parser.add_argument("--output-tokens", type=int)
    parser.add_argument("--token-reason", default="The builder harness did not report token use for this run.")
    args = parser.parse_args(argv)

    manifest = lib.read_json(args.run_dir / "manifest.json")
    telemetry_path = args.run_dir / "telemetry.json"

    if args.action == "start":
        if telemetry_path.exists():
            parser.error(f"Refusing to overwrite {telemetry_path}")
        lib.write_json(
            telemetry_path,
            {
                "schema": "taste-bench-telemetry/1",
                "run_id": manifest["run_id"],
                "started_at": lib.utc_now(),
                "started_at_ns": time.time_ns(),
            },
        )
        print(f"Started {manifest['run_id']}")
        return 0

    if not telemetry_path.exists():
        parser.error("Run `start` first")
    if not args.workspace or not args.outcome or args.turns is None:
        parser.error("finish needs --workspace, --outcome and --turns")
    workspace = args.workspace.expanduser().resolve()
    if workspace.name != manifest["run_id"]:
        parser.error(f"{workspace} is not the workspace of run {manifest['run_id']}")
    data = lib.read_json(telemetry_path)
    if "ended_at" in data:
        parser.error("This run is already finished")

    ended_ns = time.time_ns()
    elapsed_ns = max(0, ended_ns - int(data.pop("started_at_ns")))
    if args.input_tokens is None or args.output_tokens is None:
        tokens = {"status": "unavailable", "reason": args.token_reason}
    else:
        tokens = {
            "status": "reported",
            "input": args.input_tokens,
            "output": args.output_tokens,
            "total": args.input_tokens + args.output_tokens,
        }
    final_sha, final_files = lib.tree_sha256(workspace)
    allowance = manifest["frozen"]["time_allowance_minutes"] * 60
    data.update(
        {
            "ended_at": lib.utc_now(),
            "elapsed_seconds": round(elapsed_ns / 1_000_000_000, 3),
            "within_time_allowance": elapsed_ns / 1_000_000_000 <= allowance,
            "turns": args.turns,
            "within_turn_allowance": args.turns <= manifest["frozen"]["turn_allowance"],
            "outcome": args.outcome,
            "tokens": tokens,
            "final_workspace_sha256": final_sha,
            "final_workspace_files": final_files,
            "workspace_changed": final_sha != manifest["workspace"]["initial_sha256"],
        }
    )
    lib.write_json(telemetry_path, data)
    print(f"Finished {manifest['run_id']} after {data['elapsed_seconds']} s")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
