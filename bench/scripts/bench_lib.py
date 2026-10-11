"""Shared helpers for the Taste Bench scripts (Python standard library only).

Every entry-point script adds this directory to ``sys.path`` itself, so the
scripts work under ``python3 -I`` (isolated mode), which does not put the
script directory or the current directory on the import path.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

BENCH_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = BENCH_DIR.parent

CONDITIONS = ("baseline", "tessli")
LABELS = ("A", "B")
WIDTHS = (1440, 768, 390)
OVERFLOW_ONLY_WIDTHS = (320,)

# The twelve review dimensions (docs/quality-gates.md), in their published order.
DIMENSIONS = (
    "task_fit",
    "hierarchy",
    "mobile_usability",
    "discoverability",
    "density",
    "coherence",
    "consistency",
    "component_reuse",
    "accessibility",
    "restraint",
    "regression_risk",
    "ship_readiness",
)
DIMENSION_TITLES = {
    "task_fit": "Task fit",
    "hierarchy": "Hierarchy",
    "mobile_usability": "Mobile usability",
    "discoverability": "Discoverability",
    "density": "Density",
    "coherence": "Coherence",
    "consistency": "Consistency",
    "component_reuse": "Component reuse",
    "accessibility": "Accessibility",
    "restraint": "Restraint",
    "regression_risk": "Regression risk",
    "ship_readiness": "Ship readiness",
}

# The committed value of every manifest's `model` field. The operator records
# the exact model privately and discloses it with the results (PROTOCOL.md).
MODEL_PLACEHOLDER = "withheld-by-operator"

# Environment variables that mark an automated or agent session. Scores are
# human input only, so validate_scores.py refuses to run when any is set.
# TESSLI_BENCH_HARNESS is set by the bench's own scripts for their children.
AGENT_ENV_MARKERS = (
    "TESSLI_BENCH_HARNESS",
    "CLAUDECODE",
    "CLAUDE_CODE_ENTRYPOINT",
    "AI_AGENT",
    "CODEX_SANDBOX",
    "CODEX_SANDBOX_NETWORK_DISABLED",
)

# Words that must never appear in anything a blind reviewer sees.
CONDITION_LEAK_PATTERN = re.compile(r"baseline|tessli", re.IGNORECASE)


def harness_env() -> dict[str, str]:
    """Environment for child processes the harness starts."""
    env = dict(os.environ)
    env["TESSLI_BENCH_HARNESS"] = "1"
    return env


def agent_markers_present(env: dict[str, str] | None = None) -> list[str]:
    env = os.environ if env is None else env
    return [name for name in AGENT_ENV_MARKERS if env.get(name)]


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def parse_timestamp(value: object) -> datetime | None:
    """Parse an ISO 8601 timestamp that carries a time zone; None if invalid."""
    if not isinstance(value, str) or not value.strip():
        return None
    text = value.strip()
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    try:
        parsed = datetime.fromisoformat(text)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return None
    return parsed


def read_json(path: Path) -> dict:
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError(f"{path} must contain a JSON object")
    return data


def write_json(path: Path, data: object, *, private: bool = False, overwrite: bool = True) -> None:
    path = Path(path)
    if not overwrite and path.exists():
        raise FileExistsError(f"Refusing to overwrite {path}")
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(data, indent=2, ensure_ascii=False) + "\n"
    if private:
        fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            handle.write(text)
    else:
        path.write_text(text, encoding="utf-8")


def canonical_json(data: object) -> bytes:
    return json.dumps(data, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(Path(path).read_bytes())


TREE_SKIP_DIRS = {"node_modules", ".next", ".git", "out", ".turbo"}
TREE_SKIP_FILES = {"next-env.d.ts", "tsconfig.tsbuildinfo", ".DS_Store"}


def tree_files(root: Path) -> list[Path]:
    """Files under root, sorted, skipping dependency and build output."""
    root = Path(root)
    files: list[Path] = []
    for current, dirs, names in os.walk(root):
        dirs[:] = sorted(d for d in dirs if d not in TREE_SKIP_DIRS)
        for name in sorted(names):
            if name in TREE_SKIP_FILES or name.endswith(".tsbuildinfo"):
                continue
            files.append(Path(current) / name)
    return sorted(files, key=lambda p: p.relative_to(root).as_posix())


def tree_sha256(root: Path) -> tuple[str, int]:
    """Deterministic hash of a directory's files (path + content), and the file count."""
    root = Path(root)
    digest = hashlib.sha256()
    files = tree_files(root)
    for path in files:
        rel = path.relative_to(root).as_posix()
        digest.update(rel.encode("utf-8") + b"\0")
        digest.update(sha256_file(path).encode("ascii") + b"\n")
    return digest.hexdigest(), len(files)


def hmac_hex(secret: str, message: str) -> str:
    return hmac.new(secret.encode("utf-8"), message.encode("utf-8"), hashlib.sha256).hexdigest()


def enclosing_git_root(path: Path) -> Path | None:
    """The nearest directory at or above path that holds .git, if any."""
    current = Path(path).resolve()
    for candidate in (current, *current.parents):
        if (candidate / ".git").exists():
            return candidate
    return None


def is_within(path: Path, parent: Path) -> bool:
    try:
        Path(path).resolve().relative_to(Path(parent).resolve())
        return True
    except ValueError:
        return False


_INLINE_LIST = re.compile(r"^\[(.*)\]$")


def _scalar(text: str) -> str:
    text = text.strip()
    if len(text) >= 2 and text[0] == text[-1] and text[0] in "\"'":
        return text[1:-1]
    return text


def read_task_yaml(path: Path) -> dict:
    """Read a brief's task.yaml: flat `key: value` lines and `key: [a, b]` lists.

    The files are deliberately this simple so the harness needs no YAML library.
    Anything else is an error rather than a guess.
    """
    data: dict[str, object] = {}
    for number, raw in enumerate(Path(path).read_text(encoding="utf-8").splitlines(), start=1):
        line = raw.rstrip()
        if not line or line.lstrip().startswith("#"):
            continue
        if line.startswith((" ", "\t", "-")) or ":" not in line:
            raise ValueError(f"{path}:{number}: expected a top-level `key: value` line")
        key, _, value = line.partition(":")
        key = key.strip()
        value = value.strip()
        if key in data:
            raise ValueError(f"{path}:{number}: duplicate key {key!r}")
        match = _INLINE_LIST.match(value)
        if match:
            inner = match.group(1).strip()
            data[key] = [_scalar(item) for item in inner.split(",")] if inner else []
        else:
            data[key] = _scalar(value)
    return data


def brief_dirs(briefs_dir: Path | None = None) -> list[Path]:
    briefs_dir = BENCH_DIR / "briefs" if briefs_dir is None else Path(briefs_dir)
    return sorted(p for p in briefs_dir.iterdir() if p.is_dir() and (p / "task.yaml").is_file())


def find_brief(brief_id: str, briefs_dir: Path | None = None) -> Path:
    for directory in brief_dirs(briefs_dir):
        task = read_task_yaml(directory / "task.yaml")
        if task.get("id") == brief_id or directory.name == brief_id:
            return directory
    raise SystemExit(f"Unknown brief {brief_id!r}; see bench/briefs/")


def render_template(template: str, values: dict[str, str]) -> str:
    rendered = template
    for key, value in values.items():
        rendered = rendered.replace("{{" + key + "}}", value)
    leftover = re.findall(r"\{\{\s*[\w-]+\s*\}\}", rendered)
    if leftover:
        raise ValueError(f"Unfilled template placeholders: {', '.join(sorted(set(leftover)))}")
    return rendered


def states_inline(states: Iterable[str]) -> str:
    return ", ".join(f"`{state}`" for state in states)


def load_runs(runs_dir: Path) -> dict[str, dict]:
    """Map run id -> manifest for every run directory under runs_dir."""
    runs: dict[str, dict] = {}
    runs_dir = Path(runs_dir)
    if not runs_dir.is_dir():
        return runs
    for directory in sorted(runs_dir.iterdir()):
        manifest_path = directory / "manifest.json"
        if directory.is_dir() and manifest_path.is_file():
            manifest = read_json(manifest_path)
            runs[manifest["run_id"]] = manifest
    return runs


def group_pairs(runs: dict[str, dict]) -> tuple[dict[tuple[str, int], dict[str, str]], list[str]]:
    """Group runs into pairs by (brief, run index): one run per condition.

    Returns ({(brief, run_index): {condition: run_id}}, errors).
    """
    pairs: dict[tuple[str, int], dict[str, str]] = {}
    errors: list[str] = []
    for run_id, manifest in sorted(runs.items()):
        key = (str(manifest.get("brief_id")), int(manifest.get("run_index", 0)))
        condition = manifest.get("condition")
        slot = pairs.setdefault(key, {})
        if condition in slot:
            errors.append(f"Brief {key[0]} run {key[1]} has two {condition} runs: {slot[condition]} and {run_id}")
            continue
        slot[condition] = run_id
    for key, slot in sorted(pairs.items()):
        missing = [c for c in CONDITIONS if c not in slot]
        if missing:
            errors.append(f"Brief {key[0]} run {key[1]} has no {' or '.join(missing)} run")
    return pairs, errors


# What each dimension asks, for reviewers. Builds start from the same small
# starter, so "consistency" and "regression risk" are read within the build.
DIMENSION_QUESTIONS = {
    "task_fit": "Does the screen do what the brief asks, for the person it describes?",
    "hierarchy": "Is it clear what matters most, what to read first and what to do next?",
    "mobile_usability": "At 390 px, is it comfortable to read and operate, not a squeezed desktop?",
    "discoverability": "Can people find the controls and paths the brief needs without guessing?",
    "density": "Is the amount of information per screen right for the task: not cramped, not sparse?",
    "coherence": "Do the parts read as one designed screen rather than assembled pieces?",
    "consistency": "Are the same things done the same way across the screen and its states?",
    "component_reuse": "Are repeated elements (buttons, fields, rows, messages) visibly one consistent set?",
    "accessibility": "Labels, contrast, focus, target size and structure; use the axe counts as one input.",
    "restraint": "Free of decoration, effects and invented content the task does not need?",
    "regression_risk": "How likely is it to break or mislead in real use: overflow, broken states, risky actions?",
    "ship_readiness": "Could this be shipped as it is, with minor fixes at most?",
}
