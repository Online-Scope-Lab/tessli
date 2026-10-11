"""Fixtures for the bench tests: fake runs, score files and temporary Git repositories."""

from __future__ import annotations

import contextlib
import io
import json
import os
import subprocess
import sys
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent.parent / "scripts"
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

import bench_lib as lib  # noqa: E402

PNG_BYTES = b"\x89PNG\r\n\x1a\nfixture"
FROZEN = {
    "builder_harness": "fixture-harness 0.0.0",
    "model": lib.MODEL_PLACEHOLDER,
    "model_record_sha256": "0" * 64,
    "reasoning_level": "fixture",
    "tools": ["shell", "file read/write"],
    "network_policy": "fixture: none",
    "time_allowance_minutes": 60,
    "turn_allowance": 1,
    "verification_steps": ["capture.mjs"],
}


def quiet(function, *args, **kwargs):
    """Call a script's main() without printing to the test output; return (result, stdout)."""
    out = io.StringIO()
    with contextlib.redirect_stdout(out), contextlib.redirect_stderr(io.StringIO()):
        try:
            result = function(*args, **kwargs)
        except SystemExit as exit_:
            result = exit_.code
    return result, out.getvalue()


def make_run(runs_dir: Path, run_id: str, *, brief_id: str = "01", run_index: int = 1, condition: str = "baseline",
             states: list[str] | None = None, evaluative: bool = True) -> Path:
    """A finished, captured run directory, as new_run/record_run/capture would leave it."""
    brief_dir = lib.find_brief(brief_id)
    task = lib.read_task_yaml(brief_dir / "task.yaml")
    states = list(task["states"]) if states is None else states
    run_dir = Path(runs_dir) / run_id
    (run_dir / "prompt").mkdir(parents=True)
    (run_dir / "prompt" / "system.md").write_text("system prompt\n", encoding="utf-8")
    (run_dir / "prompt" / "task.md").write_text(f"task prompt for {brief_id}\n", encoding="utf-8")
    manifest = {
        "schema": "taste-bench-run/1",
        "run_id": run_id,
        "created_at": "2026-10-11T00:00:00Z",
        "evaluative": evaluative,
        "brief_id": brief_id,
        "brief_slug": task["slug"],
        "brief_sha256": lib.sha256_file(brief_dir / "brief.md"),
        "run_index": run_index,
        "condition": condition,
        "states": states,
        "prompt": {
            "system_sha256": lib.sha256_file(run_dir / "prompt" / "system.md"),
            "task_sha256": lib.sha256_file(run_dir / "prompt" / "task.md"),
        },
        "frozen": {**FROZEN, "bench_commit": "f" * 40, "bench_inputs_clean": True, "starter_sha256": "s" * 64,
                   "node_version": "v22", "npm_version": "10"},
        "condition_inputs": {"rules_sha256": "r" * 64} if condition == "tessli" else {},
        "workspace": {"name": run_id, "initial_sha256": "i" * 64, "initial_files": 10, "dependencies_installed": True},
    }
    lib.write_json(run_dir / "manifest.json", manifest)
    lib.write_json(run_dir / "telemetry.json", {"schema": "taste-bench-telemetry/1", "run_id": run_id,
                                                "started_at": "2026-10-11T00:00:00Z", "ended_at": "2026-10-11T00:30:00Z",
                                                "final_workspace_sha256": "e" * 64})
    (run_dir / "screenshots").mkdir()
    for state in states:
        for width in lib.WIDTHS:
            (run_dir / "screenshots" / f"{state}-{width}.png").write_bytes(PNG_BYTES)
    lib.write_json(run_dir / "evidence.json", {
        "schema": "taste-bench-evidence/1",
        "run_id": run_id,
        "build": {"ran": True, "ok": True},
        "states": [],
        "console_messages": [{"state": "default", "width": 390, "type": "console", "text": f"{condition} {run_id}"}],
        "summary": {"build_ok": True, "states": len(states), "states_reachable": len(states),
                    "screenshots": len(states) * 3, "overflow": [], "console_errors": 1, "page_errors": 0,
                    "axe_violations_max": 1, "axe_nodes_total": 2},
    })
    return run_dir


def make_batch(runs_dir: Path, briefs: tuple[str, ...] = ("01", "02"), run_indexes: tuple[int, ...] = (1, 2, 3)) -> dict:
    """Paired runs for every brief and run index; returns {(brief, index): {condition: run_id}}."""
    pairs = {}
    counter = 0
    for brief in briefs:
        for index in run_indexes:
            slot = {}
            for condition in lib.CONDITIONS:
                counter += 1
                run_id = f"r{counter:012x}"
                make_run(runs_dir, run_id, brief_id=brief, run_index=index, condition=condition)
                slot[condition] = run_id
            pairs[(brief, index)] = slot
    return pairs


def valid_score(pair_id: str, github: str = "jane-doe", name: str = "Jane Doe", **overrides) -> dict:
    document = {
        "schema": "taste-bench-score/1",
        "pair_id": pair_id,
        "reviewer": {"name": name, "github": github},
        "reviewer_kind": "human",
        "submitted_at": lib.utc_now(),
        "declarations": {
            "human_reviewer": True,
            "scored_without_ai_assistance": True,
            "condition_unknown_while_scoring": True,
            "not_the_operator": True,
        },
        "dimensions": {
            key: {"A": 4, "B": 3, "preference": "A", "note": "A states the next step plainly; B buries it."}
            for key in lib.DIMENSIONS
        },
        "overall_note": "",
    }
    document.update(overrides)
    return document


def git(cwd: Path, *args: str) -> str:
    env = {**os.environ, "GIT_AUTHOR_NAME": "Fixture", "GIT_AUTHOR_EMAIL": "fixture@example.invalid",
           "GIT_COMMITTER_NAME": "Fixture", "GIT_COMMITTER_EMAIL": "fixture@example.invalid"}
    return subprocess.run(["git", "-C", str(cwd), *args], check=True, capture_output=True, text=True, env=env).stdout


def init_repo(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    git(path, "init", "-q")
    git(path, "config", "commit.gpgsign", "false")
    return path


def write_scores(scores_dir: Path, pair_id: str, reviewers: list[tuple[str, str]], **overrides) -> list[Path]:
    paths = []
    for github, name in reviewers:
        path = scores_dir / pair_id / f"{github}.json"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(valid_score(pair_id, github=github, name=name, **overrides)), encoding="utf-8")
        paths.append(path)
    return paths
