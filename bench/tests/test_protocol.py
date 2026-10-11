"""The protocol and the harness say the same thing."""

from __future__ import annotations

import re
import unittest

from helpers import lib

from agreement import RELIABILITY_THRESHOLD, SIGNIFICANCE, sign_test_p
from reveal import MIN_REVIEWERS

PROTOCOL = (lib.BENCH_DIR / "PROTOCOL.md").read_text(encoding="utf-8")


class ProtocolTest(unittest.TestCase):
    def test_dimension_table_matches_the_harness(self):
        rows = dict(re.findall(r"^\| ([A-Z][a-z]+(?: [a-z]+)?) \| (.+?) \|$", PROTOCOL, re.MULTILINE))
        for key in lib.DIMENSIONS:
            self.assertEqual(rows.get(lib.DIMENSION_TITLES[key]), lib.DIMENSION_QUESTIONS[key], key)

    def test_dimensions_match_the_quality_gates(self):
        gates = (lib.REPO_ROOT / "docs" / "quality-gates.md").read_text(encoding="utf-8")
        listed = " · ".join(lib.DIMENSION_TITLES[key].lower() for key in lib.DIMENSIONS)
        self.assertIn(listed, gates)

    def test_decision_rule_numbers(self):
        self.assertIn("at least 0.667", PROTOCOL)
        self.assertEqual(RELIABILITY_THRESHOLD, 0.667)
        self.assertEqual(SIGNIFICANCE, 0.05)
        self.assertIn("at least three", PROTOCOL)
        self.assertEqual(MIN_REVIEWERS, 3)
        # "With 18 pairs and no ties, the Tessli build must win at least 13."
        self.assertLessEqual(sign_test_p(13, 5), SIGNIFICANCE)
        self.assertGreater(sign_test_p(12, 6), SIGNIFICANCE)
        self.assertIn("at least 13", PROTOCOL)

    def test_design_numbers(self):
        self.assertEqual(len(lib.brief_dirs()), 6)
        self.assertIn("**36 builds**", PROTOCOL)
        self.assertIn("**18 pairs**", PROTOCOL)

    def test_model_is_withheld(self):
        self.assertIn(lib.MODEL_PLACEHOLDER, PROTOCOL)
        template = lib.read_json(lib.BENCH_DIR / "frozen.template.json")
        self.assertEqual(template["model"], lib.MODEL_PLACEHOLDER)

    def test_no_claim_of_improvement(self):
        for path in [lib.BENCH_DIR / "PROTOCOL.md", lib.BENCH_DIR / "README.md", *lib.BENCH_DIR.glob("*/README.md")]:
            text = path.read_text(encoding="utf-8")
            match = re.search(r"improves? AI output|gives? AI taste", text, re.IGNORECASE)
            self.assertIsNone(match, f"{path.name}: {match and match.group(0)}")


if __name__ == "__main__":
    unittest.main()
