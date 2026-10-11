"""Score validation: only complete, attributed, human reviews pass."""

from __future__ import annotations

import copy
import json
import os
import subprocess
import sys
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

from helpers import SCRIPTS, lib, valid_score

from prepare_blind_packet import score_form
from validate_scores import score_errors

PAIR = "01-abc123"


class ScoreErrorsTest(unittest.TestCase):
    def assertRejected(self, document, fragment, **kwargs):
        errors = score_errors(document, **kwargs)
        self.assertTrue(errors, "expected the score to be rejected")
        self.assertTrue(any(fragment in error for error in errors), f"{fragment!r} not in {errors}")

    def test_complete_human_review_passes(self):
        self.assertEqual(score_errors(valid_score(PAIR), pair_ids={PAIR}), [])

    def test_empty_packet_form_is_rejected(self):
        errors = score_errors(score_form(PAIR))
        self.assertTrue(any("reviewer.name" in error for error in errors))
        self.assertTrue(any("submitted_at" in error for error in errors))
        self.assertTrue(any("declarations.human_reviewer" in error for error in errors))
        self.assertTrue(any("dimensions.task_fit.A" in error for error in errors))

    def test_rejects_unattributed_scores(self):
        document = valid_score(PAIR)
        del document["reviewer"]
        self.assertRejected(document, "reviewer must name the human reviewer")
        self.assertRejected(valid_score(PAIR, reviewer={"name": "", "github": "jane-doe"}), "reviewer.name")
        self.assertRejected(valid_score(PAIR, reviewer={"name": "Jane Doe", "github": ""}), "reviewer.github")

    def test_rejects_agent_and_bot_scores(self):
        self.assertRejected(valid_score(PAIR, reviewer_kind="ai-delegated"), "reviewer_kind")
        for name in ("Claude", "ChatGPT", "AI reviewer", "Gemini", "Mistral", "Review Bot", "Bench harness", "Coding Agent"):
            self.assertRejected(valid_score(PAIR, name=name), "names software")
        for handle in ("review-bot", "claude", "copilot", "dependabot", "some-agent"):
            self.assertRejected(valid_score(PAIR, github=handle), "reviewer.github")

    def test_human_names_that_resemble_software_pass(self):
        for name in ("Ai Tanaka", "Claude Dupont", "Maria Lopez"):
            self.assertEqual(score_errors(valid_score(PAIR, name=name)), [], name)

    def test_rejects_missing_or_bad_timestamps(self):
        self.assertRejected(valid_score(PAIR, submitted_at=""), "submitted_at")
        self.assertRejected(valid_score(PAIR, submitted_at="2026-10-11 12:00"), "time zone")
        future = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
        self.assertRejected(valid_score(PAIR, submitted_at=future), "future")
        later = datetime.now(timezone.utc) + timedelta(hours=1)
        self.assertRejected(valid_score(PAIR), "earlier than the blinding", not_before=later)

    def test_rejects_unconfirmed_declarations(self):
        document = valid_score(PAIR)
        document["declarations"]["scored_without_ai_assistance"] = False
        self.assertRejected(document, "scored_without_ai_assistance")

    def test_rejects_incomplete_or_out_of_range_dimensions(self):
        document = valid_score(PAIR)
        del document["dimensions"]["restraint"]
        self.assertRejected(document, "dimensions.restraint is missing")
        for bad in (0, 6, 3.5, "4", True, None):
            document = valid_score(PAIR)
            document["dimensions"]["hierarchy"]["B"] = bad
            self.assertRejected(document, "dimensions.hierarchy.B")
        document = valid_score(PAIR)
        document["dimensions"]["density"]["preference"] = "both"
        self.assertRejected(document, "preference")
        document = valid_score(PAIR)
        document["dimensions"]["density"]["note"] = "ok"
        self.assertRejected(document, "note")
        document = valid_score(PAIR)
        document["dimensions"]["vibes"] = copy.deepcopy(document["dimensions"]["density"])
        self.assertRejected(document, "unknown dimension")

    def test_rejects_unknown_fields_and_pairs(self):
        self.assertRejected(valid_score(PAIR, generated_by="harness"), "unexpected field")
        self.assertRejected(valid_score("09-ffffff"), "not in the committed list", pair_ids={PAIR})


class ValidateScoresCliTest(unittest.TestCase):
    def run_cli(self, path: Path, extra_env: dict[str, str]) -> subprocess.CompletedProcess:
        env = {key: value for key, value in os.environ.items() if key not in lib.AGENT_ENV_MARKERS}
        env.update(extra_env)
        return subprocess.run(
            [sys.executable, "-I", str(SCRIPTS / "validate_scores.py"), str(path), "--commitment", str(path.parent / "none.json")],
            capture_output=True, text=True, env=env,
        )

    def test_refuses_inside_the_harness_or_an_agent_session(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / f"{PAIR}.json"
            path.write_text(json.dumps(valid_score(PAIR)), encoding="utf-8")
            for marker in ("TESSLI_BENCH_HARNESS", "CLAUDECODE"):
                result = self.run_cli(path, {marker: "1"})
                self.assertEqual(result.returncode, 3, result.stdout)
                self.assertIn("REFUSED", result.stdout)

    def test_validates_files_for_a_person(self):
        with tempfile.TemporaryDirectory() as tmp:
            good = Path(tmp) / "good.json"
            good.write_text(json.dumps(valid_score(PAIR)), encoding="utf-8")
            result = self.run_cli(good, {})
            self.assertEqual(result.returncode, 0, result.stdout)
            bad = Path(tmp) / "bad.json"
            bad.write_text(json.dumps(score_form(PAIR)), encoding="utf-8")
            result = self.run_cli(bad, {})
            self.assertEqual(result.returncode, 1)
            self.assertIn("INVALID", result.stdout)


if __name__ == "__main__":
    unittest.main()
