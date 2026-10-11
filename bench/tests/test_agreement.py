"""Krippendorff's alpha, the sign test and the pre-registered outcome."""

from __future__ import annotations

import unittest

from helpers import lib, valid_score

from agreement import analyse, krippendorff_alpha, sign_test_p

# Krippendorff (2011), "Computing Krippendorff's Alpha-Reliability", the
# four-coder, twelve-unit example with missing values (also on Wikipedia).
# Published results: nominal 0.743, ordinal 0.815, interval 0.849.
N = None
CODERS = (
    [1, 2, 3, 3, 2, 1, 4, 1, 2, N, N, N],
    [1, 2, 3, 3, 2, 2, 4, 1, 2, 5, N, 3],
    [N, 3, 3, 3, 2, 3, 4, 2, 2, 5, 1, N],
    [1, 2, 3, 3, 2, 4, 4, 1, 2, 5, 1, N],
)
TEXTBOOK_UNITS = [[value for value in unit if value is not None] for unit in zip(*CODERS)]

# The same paper's two-coder binary example: nominal alpha 0.095.
BINARY_UNITS = [list(pair) for pair in zip([0, 1, 0, 0, 0, 0, 0, 0, 1, 0], [1, 1, 1, 0, 0, 1, 0, 0, 0, 0])]


class KrippendorffAlphaTest(unittest.TestCase):
    def test_textbook_example_ordinal(self):
        self.assertAlmostEqual(krippendorff_alpha(TEXTBOOK_UNITS, "ordinal"), 0.815, places=3)

    def test_textbook_example_nominal_and_interval(self):
        self.assertAlmostEqual(krippendorff_alpha(TEXTBOOK_UNITS, "nominal"), 0.743, places=3)
        self.assertAlmostEqual(krippendorff_alpha(TEXTBOOK_UNITS, "interval"), 0.849, places=3)

    def test_binary_example(self):
        self.assertAlmostEqual(krippendorff_alpha(BINARY_UNITS, "nominal"), 0.095, places=3)

    def test_perfect_agreement_is_one(self):
        self.assertEqual(krippendorff_alpha([[1, 1, 1], [3, 3, 3], [5, 5, 5]], "ordinal"), 1.0)

    def test_ordinal_rewards_near_misses_over_nominal(self):
        units = [[1, 2], [2, 3], [4, 5], [5, 5], [1, 1]]
        self.assertGreater(krippendorff_alpha(units, "ordinal"), krippendorff_alpha(units, "nominal"))

    def test_undefined_cases_return_none(self):
        self.assertIsNone(krippendorff_alpha([[3, 3], [3, 3, 3]], "ordinal"))  # no variation
        self.assertIsNone(krippendorff_alpha([[1], [2], [3]], "ordinal"))  # nothing pairable
        self.assertIsNone(krippendorff_alpha([], "ordinal"))

    def test_unknown_metric(self):
        with self.assertRaises(ValueError):
            krippendorff_alpha(TEXTBOOK_UNITS, "ratio-ish")


class SignTestTest(unittest.TestCase):
    def test_known_values(self):
        self.assertAlmostEqual(sign_test_p(13, 5), 0.0481, places=4)  # 13 of 18 pairs
        self.assertAlmostEqual(sign_test_p(12, 6), 0.1189, places=4)
        self.assertEqual(sign_test_p(0, 0), 1.0)
        self.assertEqual(sign_test_p(0, 4), 1.0)
        self.assertAlmostEqual(sign_test_p(4, 0), 1 / 16)


def scores_for(pairs: dict[str, str], reviewers=("ana-r", "ben-k", "chi-m"), disagree: bool = False) -> list[dict]:
    """Score documents where the preferred label in `pairs` wins every dimension."""
    documents = []
    for pair, winner in pairs.items():
        for position, github in enumerate(reviewers):
            high, low = (5, 2) if not disagree else ((5, 1) if position % 2 else (1, 5))
            document = valid_score(pair, github=github, name=github.title())
            for key in lib.DIMENSIONS:
                a, b = (high, low) if winner == "A" else (low, high)
                preference = winner if not disagree else ("A" if a > b else "B")
                document["dimensions"][key] = {"A": a, "B": b, "preference": preference, "note": "Visible reason for the scores."}
            documents.append(document)
    return documents


class OutcomeTest(unittest.TestCase):
    def setUp(self):
        self.pair_ids = [f"0{1 + i // 3}-{i:06x}" for i in range(18)]
        # The Tessli build is A in the first nine pairs and B in the rest (balanced labels).
        self.mapping = {
            pair: {
                "A": {"condition": "tessli" if i < 9 else "baseline", "run_id": f"ra{i}"},
                "B": {"condition": "baseline" if i < 9 else "tessli", "run_id": f"rb{i}"},
            }
            for i, pair in enumerate(self.pair_ids)
        }

    def winners(self, tessli_wins: int) -> dict[str, str]:
        result = {}
        for i, pair in enumerate(self.pair_ids):
            tessli_label = "A" if i < 9 else "B"
            other = "B" if tessli_label == "A" else "A"
            result[pair] = tessli_label if i < tessli_wins else other
        return result

    def test_agreement_and_counts(self):
        result = analyse(scores_for(self.winners(13)), self.pair_ids)
        self.assertEqual(result["reviewers"], 3)
        self.assertEqual(result["alpha_ordinal"]["overall"], 1.0)
        self.assertEqual(result["alpha_ordinal"]["per_dimension"]["ship_readiness"]["units"], 36)
        counts = result["preferences_by_label"][self.pair_ids[0]]["dimensions"]["ship_readiness"]
        self.assertEqual(counts, {"A": 3, "B": 0, "tie": 0})
        self.assertNotIn("outcome", result)

    def test_clear_win_needs_thirteen_of_eighteen(self):
        outcome = analyse(scores_for(self.winners(13)), self.pair_ids, self.mapping)["outcome"]
        self.assertEqual(outcome["verdict"], "tessli-clearly-better")
        self.assertEqual(outcome["pairs_won"], {"tessli": 13, "baseline": 5, "tie": 0})
        outcome = analyse(scores_for(self.winners(12)), self.pair_ids, self.mapping)["outcome"]
        self.assertEqual(outcome["verdict"], "no-clear-difference")

    def test_symmetric_for_the_baseline(self):
        outcome = analyse(scores_for(self.winners(4)), self.pair_ids, self.mapping)["outcome"]
        self.assertEqual(outcome["verdict"], "baseline-clearly-better")

    def test_unreliable_when_reviewers_disagree(self):
        outcome = analyse(scores_for(self.winners(18), disagree=True), self.pair_ids, self.mapping)["outcome"]
        self.assertEqual(outcome["verdict"], "unreliable")

    def test_unreliable_with_fewer_than_three_reviewers(self):
        documents = scores_for(self.winners(18), reviewers=("ana-r", "ben-k"))
        outcome = analyse(documents, self.pair_ids, self.mapping)["outcome"]
        self.assertEqual(outcome["verdict"], "unreliable")
        self.assertEqual(len(outcome["pairs_with_too_few_reviewers"]), 18)

    def test_accessibility_guardrail_blocks_a_win(self):
        documents = scores_for(self.winners(18))
        for document in documents:
            pair = document["pair_id"]
            baseline_label = "A" if self.mapping[pair]["A"]["condition"] == "baseline" else "B"
            document["dimensions"]["accessibility"]["preference"] = baseline_label
        outcome = analyse(documents, self.pair_ids, self.mapping)["outcome"]
        self.assertEqual(outcome["verdict"], "no-clear-difference")


if __name__ == "__main__":
    unittest.main()
