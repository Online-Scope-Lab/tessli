#!/usr/bin/env python3
"""Check that two runs form a fair pair before they are blinded and reviewed.

A pair is one `baseline` and one `tessli` run of the same brief with the same
run index, built from the same prompts, starter, commit and frozen conditions,
both finished and captured.

    python3 -I bench/scripts/validate_pair.py bench/runs/<run-a> bench/runs/<run-b>
    python3 -I bench/scripts/validate_pair.py --all bench/runs
"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import argparse
from pathlib import Path

import bench_lib as lib


def pair_errors(
    run_dirs: tuple[Path, Path],
    *,
    allow_dry_run: bool = False,
    workspace_root: Path | None = None,
) -> list[str]:
    errors: list[str] = []
    manifests = []
    for run_dir in run_dirs:
        for name in ("manifest.json", "telemetry.json", "evidence.json", "prompt/system.md", "prompt/task.md"):
            if not (run_dir / name).is_file():
                errors.append(f"{run_dir.name}: missing {name}")
    if errors:
        return errors
    for run_dir in run_dirs:
        manifest = lib.read_json(run_dir / "manifest.json")
        telemetry = lib.read_json(run_dir / "telemetry.json")
        evidence = lib.read_json(run_dir / "evidence.json")
        name = manifest["run_id"]
        if run_dir.name != name:
            errors.append(f"{run_dir}: directory name differs from run_id {name}")
        if "ended_at" not in telemetry:
            errors.append(f"{name}: the build was never finished (record_run.py finish)")
        if evidence.get("run_id") != name:
            errors.append(f"{name}: evidence.json belongs to another run")
        if evidence.get("summary") is None:
            errors.append(f"{name}: evidence.json has no summary (capture did not complete)")
        for prompt, field in (("system.md", "system_sha256"), ("task.md", "task_sha256")):
            actual = lib.sha256_file(run_dir / "prompt" / prompt)
            if actual != manifest["prompt"][field]:
                errors.append(f"{name}: prompt/{prompt} no longer matches its recorded SHA-256")
        if not manifest.get("evaluative") and not allow_dry_run:
            errors.append(f"{name}: is a dry run and cannot be scored")
        if manifest.get("evaluative") and not manifest["frozen"].get("bench_inputs_clean"):
            errors.append(f"{name}: was created from uncommitted bench inputs")
        if manifest["frozen"].get("model") != lib.MODEL_PLACEHOLDER:
            errors.append(f"{name}: manifest names a model; it must say {lib.MODEL_PLACEHOLDER!r}")
        if workspace_root is not None:
            workspace = Path(workspace_root).expanduser() / name
            if not workspace.is_dir():
                errors.append(f"{name}: workspace {workspace} not found")
            elif lib.tree_sha256(workspace)[0] != telemetry.get("final_workspace_sha256"):
                errors.append(f"{name}: the workspace changed after the build finished")
        manifests.append(manifest)

    left, right = manifests
    if {left["condition"], right["condition"]} != set(lib.CONDITIONS):
        errors.append(f"conditions are {left['condition']} and {right['condition']}; need one of each")
    for field in ("brief_id", "brief_sha256", "run_index", "states", "prompt"):
        if left.get(field) != right.get(field):
            errors.append(f"{field} differs: {left.get(field)!r} vs {right.get(field)!r}")
    for field in sorted(set(left["frozen"]) | set(right["frozen"])):
        if left["frozen"].get(field) != right["frozen"].get(field):
            errors.append(
                f"frozen.{field} differs: {left['frozen'].get(field)!r} vs {right['frozen'].get(field)!r}"
            )
    for manifest in manifests:
        expected_inputs = manifest["condition"] == "tessli"
        if bool(manifest.get("condition_inputs")) != expected_inputs:
            errors.append(f"{manifest['run_id']}: condition_inputs do not match its condition")
    return errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("run_dirs", type=Path, nargs="*")
    parser.add_argument("--all", type=Path, metavar="RUNS_DIR", help="Validate every pair under a runs directory")
    parser.add_argument("--allow-dry-run", action="store_true", help="Accept non-evaluative runs (harness checks only)")
    parser.add_argument("--workspace-root", type=Path, help="Also re-hash each workspace against its finished build")
    args = parser.parse_args(argv)

    if args.all:
        runs = lib.load_runs(args.all)
        pairs, errors = lib.group_pairs(runs)
        targets = [
            (key, (args.all / slot["baseline"], args.all / slot["tessli"]))
            for key, slot in sorted(pairs.items())
            if set(slot) == set(lib.CONDITIONS)
        ]
    elif len(args.run_dirs) == 2:
        errors = []
        targets = [(("?", 0), tuple(args.run_dirs))]
    else:
        parser.error("Give two run directories, or --all <runs-dir>")

    for key, dirs in targets:
        problems = pair_errors(dirs, allow_dry_run=args.allow_dry_run, workspace_root=args.workspace_root)
        label = f"brief {key[0]} run {key[1]}" if args.all else f"{dirs[0].name} + {dirs[1].name}"
        errors.extend(f"{label}: {problem}" for problem in problems)
        if not problems:
            print(f"PAIR VALID: {label}")
    if errors:
        print("PAIR INVALID")
        print("\n".join(f"- {error}" for error in errors))
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
