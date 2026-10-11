#!/usr/bin/env python3
"""Create one Taste Bench run: an opaque run id, a fresh workspace and a manifest.

The workspace is a copy of bench/starter/ (plus the Tessli overlay and
rules/TESSLI.md for the `tessli` condition) in a directory OUTSIDE this
repository, named only by the opaque run id, so the builder can neither read
the repository nor tell from a path that it is part of a comparison. The
workspace root must have a neutral path too (e.g. ~/work or ~/projects): a
root whose path mentions the bench, a condition, an experiment or an
evaluation is refused. The rendered prompts and manifest go to
<runs-dir>/<run-id>/.

    python3 -I bench/scripts/new_run.py --brief 01 --condition tessli \
        --run-index 1 --frozen bench/frozen.json --workspace-root ~/work
"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import argparse
import re
import secrets
import shutil
import subprocess
from pathlib import Path

import bench_lib as lib

FROZEN_KEYS = {
    "builder_harness": str,
    "model": str,
    "model_record_sha256": str,
    "reasoning_level": str,
    "tools": list,
    "network_policy": str,
    "time_allowance_minutes": int,
    "turn_allowance": int,
    "verification_steps": list,
}
PLACEHOLDER = "RECORD_BEFORE_RUN"
# Words that would tell the builder, through its working directory, that it is
# part of a comparison. Matched anywhere in any component of the resolved path.
REVEALING_PATH_WORDS = re.compile(r"bench|baseline|tessli|experiment|eval", re.IGNORECASE)
REGISTRY_URL = "http://127.0.0.1:4100"


def validate_frozen(frozen: dict) -> list[str]:
    errors: list[str] = []
    for key, kind in FROZEN_KEYS.items():
        value = frozen.get(key)
        if value is None:
            errors.append(f"frozen.{key} is missing")
            continue
        if kind is int and (isinstance(value, bool) or not isinstance(value, int) or value <= 0):
            errors.append(f"frozen.{key} must be a positive whole number")
        elif kind is not int and not isinstance(value, kind):
            errors.append(f"frozen.{key} must be a {kind.__name__}")
        elif kind is list and (not value or not all(isinstance(item, str) and item.strip() for item in value)):
            errors.append(f"frozen.{key} must be a non-empty list of text")
        elif kind is str and not value.strip():
            errors.append(f"frozen.{key} is empty")
        if PLACEHOLDER in str(value):
            errors.append(f"frozen.{key} still says {PLACEHOLDER}")
    for key in sorted(set(frozen) - set(FROZEN_KEYS)):
        errors.append(f"frozen.{key} is not a frozen field (allowed: {', '.join(FROZEN_KEYS)})")
    if frozen.get("model") != lib.MODEL_PLACEHOLDER:
        errors.append(
            f"frozen.model must be exactly {lib.MODEL_PLACEHOLDER!r}: committed files never name the model; "
            "record it privately and put the record's SHA-256 in model_record_sha256"
        )
    if not re.fullmatch(r"[0-9a-f]{64}", str(frozen.get("model_record_sha256", ""))):
        errors.append("frozen.model_record_sha256 must be the 64-character SHA-256 of the private model record")
    return errors


def git(*args: str) -> str:
    result = subprocess.run(["git", "-C", str(lib.REPO_ROOT), *args], capture_output=True, text=True, check=True)
    return result.stdout.strip()


def tool_version(command: list[str]) -> str:
    try:
        return subprocess.run(command, capture_output=True, text=True, check=True).stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        return "unavailable"


def copy_tree(source: Path, destination: Path) -> None:
    for path in lib.tree_files(source):
        target = destination / path.relative_to(source)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, target)


def revealing_path_parts(path: Path) -> list[str]:
    """Components of path whose names hint at the bench, a condition or an evaluation."""
    return [part for part in path.parts if REVEALING_PATH_WORDS.search(part)]


def isolation_errors(workspace: Path, condition: str) -> list[str]:
    errors = []
    revealing = revealing_path_parts(workspace.resolve())
    if revealing:
        errors.append(f"the workspace path gives the setup away: {', '.join(revealing)}")
    if lib.enclosing_git_root(workspace) is not None:
        errors.append("the workspace is inside a Git repository")
    if lib.is_within(workspace, lib.REPO_ROOT):
        errors.append("the workspace is inside the Tessli repository")
    has_rules = (workspace / "TESSLI.md").exists()
    if has_rules != (condition == "tessli"):
        errors.append(f"TESSLI.md presence is wrong for {condition}")
    expected_agents = (
        lib.BENCH_DIR / "conditions" / "tessli" / "overlay" / "AGENTS.md"
        if condition == "tessli"
        else lib.BENCH_DIR / "starter" / "AGENTS.md"
    )
    if lib.sha256_file(workspace / "AGENTS.md") != lib.sha256_file(expected_agents):
        errors.append(f"AGENTS.md is not the {condition} version")
    for path in lib.tree_files(workspace):
        if re.search(r"bench|baseline|experiment", path.relative_to(workspace).as_posix(), re.IGNORECASE):
            errors.append(f"file name gives the setup away: {path.relative_to(workspace)}")
    return errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--brief", required=True, help="Brief id (01-06) or directory name")
    parser.add_argument("--condition", required=True, choices=lib.CONDITIONS)
    parser.add_argument("--run-index", required=True, type=int, help="1, 2 or 3")
    parser.add_argument("--frozen", type=Path, default=lib.BENCH_DIR / "frozen.json")
    parser.add_argument("--workspace-root", type=Path, required=True, help="Directory outside this repository")
    parser.add_argument("--runs-dir", type=Path, default=lib.BENCH_DIR / "runs")
    parser.add_argument("--no-install", action="store_true", help="Skip `npm ci` in the workspace")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Mark the run non-evaluative and allow uncommitted bench files (harness checks only)",
    )
    args = parser.parse_args(argv)

    if args.run_index < 1:
        parser.error("--run-index starts at 1")
    if not args.frozen.is_file():
        parser.error(f"{args.frozen} not found; copy bench/frozen.template.json and fill it in before the first run")
    frozen = lib.read_json(args.frozen)
    errors = validate_frozen(frozen)
    if errors:
        print("FROZEN CONDITIONS INVALID")
        print("\n".join(f"- {error}" for error in errors))
        return 1

    workspace_root = args.workspace_root.expanduser().resolve()
    if lib.is_within(workspace_root, lib.REPO_ROOT):
        parser.error("--workspace-root must be outside the repository, so the builder cannot read it")
    if lib.enclosing_git_root(workspace_root) is not None:
        parser.error(f"--workspace-root is inside a Git repository ({lib.enclosing_git_root(workspace_root)})")
    revealing = revealing_path_parts(workspace_root)
    if revealing:
        parser.error(
            f"--workspace-root {workspace_root} gives the setup away to the builder ({', '.join(revealing)}); "
            "use a neutral directory such as ~/work or ~/projects"
        )

    commit = git("rev-parse", "HEAD")
    dirty = git("status", "--porcelain", "--", "bench/starter", "bench/conditions", "bench/briefs", "rules", "web/public/r")
    if dirty and not args.dry_run:
        print("Commit the bench inputs before a scored run; uncommitted changes:\n" + dirty)
        return 1

    brief_dir = lib.find_brief(args.brief)
    task = lib.read_task_yaml(brief_dir / "task.yaml")
    states = task.get("states")
    if not isinstance(states, list) or not states or states[0] != "default":
        print(f"{brief_dir}/task.yaml: states must be a list starting with default")
        return 1

    condition_dir = lib.BENCH_DIR / "conditions" / args.condition
    system_prompt = (condition_dir / "system.md").read_text(encoding="utf-8")
    task_prompt = lib.render_template(
        (condition_dir / "task.md").read_text(encoding="utf-8"),
        {"brief": (brief_dir / "brief.md").read_text(encoding="utf-8").strip(), "states": lib.states_inline(states)},
    )

    runs_dir = args.runs_dir.resolve()
    while True:
        run_id = "r" + secrets.token_hex(6)
        if not (runs_dir / run_id).exists() and not (workspace_root / run_id).exists():
            break
    run_dir = runs_dir / run_id
    workspace = workspace_root / run_id

    starter = lib.BENCH_DIR / "starter"
    copy_tree(starter, workspace)
    condition_inputs: dict[str, object] = {}
    if args.condition == "tessli":
        overlay = condition_dir / "overlay"
        copy_tree(overlay, workspace)
        shutil.copy2(lib.REPO_ROOT / "rules" / "TESSLI.md", workspace / "TESSLI.md")
        condition_inputs = {
            "overlay_sha256": lib.tree_sha256(overlay)[0],
            "rules_sha256": lib.sha256_file(lib.REPO_ROOT / "rules" / "TESSLI.md"),
            "registry_sha256": lib.tree_sha256(lib.REPO_ROOT / "web" / "public" / "r")[0],
            "registry_url": REGISTRY_URL,
        }

    problems = isolation_errors(workspace, args.condition)
    if problems:
        shutil.rmtree(workspace)
        print("ISOLATION INVALID")
        print("\n".join(f"- {problem}" for problem in problems))
        return 1
    initial_sha, initial_files = lib.tree_sha256(workspace)

    prompt_dir = run_dir / "prompt"
    prompt_dir.mkdir(parents=True)
    (prompt_dir / "system.md").write_text(system_prompt, encoding="utf-8")
    (prompt_dir / "task.md").write_text(task_prompt, encoding="utf-8")

    installed = False
    if not args.no_install:
        subprocess.run(
            ["npm", "ci", "--no-audit", "--no-fund"], cwd=workspace, check=True, env=lib.harness_env()
        )
        installed = True

    manifest = {
        "schema": "taste-bench-run/1",
        "run_id": run_id,
        "created_at": lib.utc_now(),
        "evaluative": not args.dry_run,
        "brief_id": task["id"],
        "brief_slug": task.get("slug", brief_dir.name),
        "brief_sha256": lib.sha256_file(brief_dir / "brief.md"),
        "run_index": args.run_index,
        "condition": args.condition,
        "states": states,
        "prompt": {
            "system_sha256": lib.sha256_bytes(system_prompt.encode("utf-8")),
            "task_sha256": lib.sha256_bytes(task_prompt.encode("utf-8")),
        },
        "frozen": {
            **frozen,
            "bench_commit": commit,
            "bench_inputs_clean": not dirty,
            "starter_sha256": lib.tree_sha256(starter)[0],
            "node_version": tool_version(["node", "--version"]),
            "npm_version": tool_version(["npm", "--version"]),
        },
        "condition_inputs": condition_inputs,
        "workspace": {
            "name": run_id,
            "initial_sha256": initial_sha,
            "initial_files": initial_files,
            "dependencies_installed": installed,
        },
    }
    lib.write_json(run_dir / "manifest.json", manifest, overwrite=False)
    print(f"Run {run_id}")
    print(f"  workspace: {workspace}")
    print(f"  prompts:   {prompt_dir}")
    if args.condition == "tessli":
        print(f"  serve the registry for this build: python3 -m http.server 4100 --bind 127.0.0.1 --directory {lib.REPO_ROOT / 'web' / 'public' / 'r'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
