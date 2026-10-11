"""new_run, record_run and validate_pair on real workspaces (no dependency install)."""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from helpers import FROZEN, lib, quiet

import new_run
import record_run
from validate_pair import pair_errors


class RunsTest(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.tmp = Path(self._tmp.name)
        self.frozen = self.tmp / "frozen.json"
        lib.write_json(self.frozen, FROZEN)
        self.runs = self.tmp / "runs"
        self.work = self.tmp / "work"

    def tearDown(self):
        self._tmp.cleanup()

    def new(self, condition: str, *extra: str, frozen: Path | None = None) -> tuple[int, str]:
        return quiet(new_run.main, ["--brief", "02", "--condition", condition, "--run-index", "1",
                                    "--frozen", str(frozen or self.frozen), "--workspace-root", str(self.work),
                                    "--runs-dir", str(self.runs), "--no-install", "--dry-run", *extra])

    def only_run(self, condition: str) -> tuple[Path, dict]:
        for run_dir in self.runs.iterdir():
            manifest = lib.read_json(run_dir / "manifest.json")
            if manifest["condition"] == condition:
                return run_dir, manifest
        raise AssertionError(f"no {condition} run")

    def test_workspaces_differ_only_by_the_condition_files(self):
        self.assertEqual(self.new("baseline")[0], 0)
        self.assertEqual(self.new("tessli")[0], 0)
        base_dir, base = self.only_run("baseline")
        tessli_dir, tessli = self.only_run("tessli")
        base_ws, tessli_ws = self.work / base["run_id"], self.work / tessli["run_id"]
        self.assertFalse((base_ws / "TESSLI.md").exists())
        self.assertEqual((tessli_ws / "TESSLI.md").read_bytes(), (lib.REPO_ROOT / "rules" / "TESSLI.md").read_bytes())
        base_files = {p.relative_to(base_ws).as_posix() for p in lib.tree_files(base_ws)}
        tessli_files = {p.relative_to(tessli_ws).as_posix() for p in lib.tree_files(tessli_ws)}
        self.assertEqual(tessli_files - base_files, {"TESSLI.md"})
        differing = {f for f in base_files if (base_ws / f).read_bytes() != (tessli_ws / f).read_bytes()}
        self.assertEqual(differing, {"AGENTS.md"})
        self.assertFalse((base_ws / ".git").exists())

        self.assertRegex(base["run_id"], r"^r[0-9a-f]{12}$")
        self.assertEqual(base["prompt"], tessli["prompt"])
        self.assertEqual((base_dir / "prompt" / "task.md").read_bytes(), (tessli_dir / "prompt" / "task.md").read_bytes())
        self.assertIn("`no-active-projects`", (base_dir / "prompt" / "task.md").read_text(encoding="utf-8"))
        self.assertFalse(base["evaluative"])
        self.assertEqual(base["frozen"]["model"], lib.MODEL_PLACEHOLDER)
        self.assertEqual(tessli["condition_inputs"]["registry_url"], "http://127.0.0.1:4100")
        self.assertEqual(base["condition_inputs"], {})

    def test_refuses_a_named_model_and_placeholders(self):
        named = self.tmp / "named.json"
        lib.write_json(named, {**FROZEN, "model": "some-model-id"})
        code, out = self.new("baseline", frozen=named)
        self.assertEqual(code, 1)
        self.assertIn("withheld-by-operator", out)
        template = lib.BENCH_DIR / "frozen.template.json"
        code, out = self.new("baseline", frozen=template)
        self.assertEqual(code, 1)
        self.assertIn("RECORD_BEFORE_RUN", out)
        self.assertFalse(self.runs.exists())

    def test_refuses_a_workspace_inside_the_repository(self):
        code, _ = quiet(new_run.main, ["--brief", "02", "--condition", "baseline", "--run-index", "1",
                                       "--frozen", str(self.frozen), "--workspace-root", str(lib.BENCH_DIR / "runs"),
                                       "--runs-dir", str(self.runs), "--no-install", "--dry-run"])
        self.assertNotEqual(code, 0)
        self.assertFalse(self.runs.exists())

    def test_record_and_validate_a_dry_pair(self):
        self.new("baseline")
        self.new("tessli")
        dirs = []
        for condition in lib.CONDITIONS:
            run_dir, manifest = self.only_run(condition)
            workspace = self.work / manifest["run_id"]
            self.assertEqual(quiet(record_run.main, ["start", str(run_dir)])[0], 0)
            (workspace / "app" / "page.tsx").write_text("export default function Page() { return <main data-state=\"default\" />; }\n")
            self.assertEqual(quiet(record_run.main, ["finish", str(run_dir), "--workspace", str(workspace),
                                                     "--outcome", "completed", "--turns", "1"])[0], 0)
            telemetry = lib.read_json(run_dir / "telemetry.json")
            self.assertTrue(telemetry["workspace_changed"])
            self.assertEqual(telemetry["tokens"]["status"], "unavailable")
            lib.write_json(run_dir / "evidence.json", {"run_id": manifest["run_id"], "summary": {"build_ok": True}})
            dirs.append(run_dir)

        self.assertEqual(pair_errors(tuple(dirs), allow_dry_run=True, workspace_root=self.work), [])
        self.assertTrue(any("dry run" in e for e in pair_errors(tuple(dirs))))

        workspace = self.work / dirs[0].name
        (workspace / "app" / "extra.ts").write_text("export const late = true;\n")
        errors = pair_errors(tuple(dirs), allow_dry_run=True, workspace_root=self.work)
        self.assertTrue(any("changed after the build finished" in e for e in errors), errors)

        (dirs[1] / "prompt" / "task.md").write_text("edited prompt\n")
        errors = pair_errors(tuple(dirs), allow_dry_run=True)
        self.assertTrue(any("prompt/task.md no longer matches" in e for e in errors), errors)

    def test_validate_pair_rejects_mismatched_runs(self):
        from helpers import make_run

        a = make_run(self.runs, "r00000000000a", brief_id="01", condition="baseline")
        b = make_run(self.runs, "r00000000000b", brief_id="02", condition="baseline")
        errors = pair_errors((a, b))
        self.assertTrue(any("need one of each" in e for e in errors))
        self.assertTrue(any(e.startswith("brief_id differs") for e in errors))


if __name__ == "__main__":
    unittest.main()
