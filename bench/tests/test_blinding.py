"""Blind labels: commitment, sealed mapping outside the repository, and the reveal round trip."""

from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from helpers import git, init_repo, lib, make_batch, make_run, quiet, write_scores

import randomize_blind_labels as randomize
from randomize_blind_labels import assign, commitment_of
from reveal import reveal

SEED = "5" * 64
REVIEWERS = [("ana-r", "Ana Ruiz"), ("ben-k", "Ben Kaur"), ("chi-m", "Chi Mbeki")]


class BlindingTest(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.tmp = Path(self._tmp.name)
        self.runs = self.tmp / "runs"
        self.pairs = make_batch(self.runs)
        self.sealed = self.tmp / "private" / "mapping.json"
        self.commitment = self.tmp / "public" / "commitment.json"

    def tearDown(self):
        self._tmp.cleanup()

    def blind(self, *extra: str, seed: str = SEED):
        return quiet(randomize.main, ["--runs-dir", str(self.runs), "--sealed", str(self.sealed),
                                      "--commitment", str(self.commitment), "--seed", seed, *extra])

    def test_commitment_matches_the_sealed_mapping(self):
        code, _ = self.blind()
        self.assertEqual(code, 0)
        sealed = lib.read_json(self.sealed)
        public = lib.read_json(self.commitment)
        self.assertEqual(commitment_of(sealed["payload"]), public["commitment"])
        self.assertEqual(len(public["pair_ids"]), 6)
        self.assertEqual(self.sealed.stat().st_mode & 0o777, 0o600)

    def test_public_commitment_reveals_no_mapping(self):
        self.blind()
        text = self.commitment.read_text(encoding="utf-8")
        self.assertNotRegex(text.lower(), r"baseline|tessli|\"r[0-9a-f]{12}\"")
        self.assertNotIn(lib.read_json(self.sealed)["payload"]["salt"], text)

    def test_labels_are_balanced_and_reproducible(self):
        first = assign(SEED, self.pairs)["payload"]
        second = assign(SEED, self.pairs)["payload"]
        self.assertEqual(first, second)
        tessli_as_a = sum(1 for sides in first["pairs"].values() if sides["A"]["condition"] == "tessli")
        self.assertEqual(tessli_as_a, 3)
        for sides in first["pairs"].values():
            self.assertEqual({sides["A"]["condition"], sides["B"]["condition"]}, set(lib.CONDITIONS))
        other = assign("6" * 64, self.pairs)["payload"]
        self.assertNotEqual(commitment_of(first), commitment_of(other))

    def test_pair_ids_name_the_brief_but_not_the_run(self):
        payload = assign(SEED, self.pairs)["payload"]
        for pair, sides in payload["pairs"].items():
            self.assertRegex(pair, r"^0[12]-[0-9a-f]{6}$")
            for label in lib.LABELS:
                self.assertNotIn(sides[label]["run_id"], pair)

    def test_refuses_a_mapping_inside_the_repository(self):
        inside = lib.BENCH_DIR / "packets" / "sealed-mapping-test.json"
        code, _ = quiet(randomize.main, ["--runs-dir", str(self.runs), "--sealed", str(inside),
                                         "--commitment", str(self.commitment), "--seed", SEED])
        self.assertNotEqual(code, 0)
        self.assertFalse(inside.exists())

    def test_refuses_a_weak_seed_and_overwrites(self):
        code, _ = self.blind(seed="short")
        self.assertNotEqual(code, 0)
        self.assertEqual(self.blind()[0], 0)
        self.assertNotEqual(self.blind()[0], 0)

    def test_refuses_unpaired_or_dry_runs(self):
        make_run(self.runs, "r0000000000ff", brief_id="03", run_index=1, condition="tessli")
        code, out = self.blind()
        self.assertEqual(code, 1)
        self.assertIn("no baseline run", out)

    def test_dry_runs_need_explicit_permission(self):
        runs = self.tmp / "dry-runs"
        make_run(runs, "r00000000000a", condition="baseline", evaluative=False)
        make_run(runs, "r00000000000b", condition="tessli", evaluative=False)
        args = ["--runs-dir", str(runs), "--sealed", str(self.tmp / "dry.json"),
                "--commitment", str(self.tmp / "dry-commitment.json"), "--seed", SEED]
        self.assertEqual(quiet(randomize.main, args)[0], 1)
        self.assertEqual(quiet(randomize.main, [*args, "--allow-dry-run"])[0], 0)


class RevealTest(unittest.TestCase):
    """Reveal only after every pair has three committed human reviews."""

    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.tmp = Path(self._tmp.name)
        runs = self.tmp / "runs"
        make_batch(runs, briefs=("01",), run_indexes=(1, 2))
        self.sealed_path = self.tmp / "private" / "mapping.json"
        self.repo = init_repo(self.tmp / "repo")
        self.commitment_path = self.repo / "packets" / "commitment.json"
        code, _ = quiet(randomize.main, ["--runs-dir", str(runs), "--sealed", str(self.sealed_path),
                                         "--commitment", str(self.commitment_path), "--seed", SEED])
        self.assertEqual(code, 0)
        self.sealed = lib.read_json(self.sealed_path)
        self.public = lib.read_json(self.commitment_path)
        self.scores = self.repo / "scores"

    def tearDown(self):
        self._tmp.cleanup()

    def score_everything(self):
        for pair in self.public["pair_ids"]:
            write_scores(self.scores, pair, REVIEWERS)
        git(self.repo, "add", "-A")
        git(self.repo, "commit", "-q", "-m", "scores")

    def run_reveal(self, sealed=None):
        return reveal(sealed or self.sealed, self.public, self.scores, self.commitment_path, 3)

    def test_round_trip(self):
        self.score_everything()
        result, errors = self.run_reveal()
        self.assertEqual(errors, [])
        self.assertEqual(result["commitment"], self.public["commitment"])
        self.assertEqual(result["pairs"], self.sealed["payload"]["pairs"])
        rebuilt = {"version": 1, "salt": result["salt"], "pairs": result["pairs"]}
        self.assertEqual(commitment_of(rebuilt), self.public["commitment"])

    def test_refuses_before_scores_are_in(self):
        result, errors = self.run_reveal()
        self.assertIsNone(result)
        self.assertTrue(any("0 reviewers" in error for error in errors), errors)

    def test_refuses_with_two_reviewers(self):
        for pair in self.public["pair_ids"]:
            write_scores(self.scores, pair, REVIEWERS[:2])
        git(self.repo, "add", "-A")
        git(self.repo, "commit", "-q", "-m", "scores")
        result, errors = self.run_reveal()
        self.assertIsNone(result)
        self.assertTrue(any("2 reviewers" in error for error in errors), errors)

    def test_refuses_uncommitted_or_edited_scores(self):
        for pair in self.public["pair_ids"]:
            write_scores(self.scores, pair, REVIEWERS)
        result, errors = self.run_reveal()
        self.assertIsNone(result)
        self.assertTrue(any("not committed" in error for error in errors), errors)

        git(self.repo, "add", "-A")
        git(self.repo, "commit", "-q", "-m", "scores")
        path = next(self.scores.rglob("*.json"))
        data = json.loads(path.read_text(encoding="utf-8"))
        data["overall_note"] = "changed after commit"
        path.write_text(json.dumps(data), encoding="utf-8")
        result, errors = self.run_reveal()
        self.assertIsNone(result)
        self.assertTrue(any("changed since it was committed" in error for error in errors), errors)

    def test_refuses_a_tampered_mapping(self):
        self.score_everything()
        tampered = json.loads(json.dumps(self.sealed))
        pair = sorted(tampered["payload"]["pairs"])[0]
        sides = tampered["payload"]["pairs"][pair]
        sides["A"], sides["B"] = sides["B"], sides["A"]
        result, errors = self.run_reveal(tampered)
        self.assertIsNone(result)
        self.assertIn("does not hash", errors[0])

    def test_refuses_invalid_scores(self):
        pair = self.public["pair_ids"][0]
        write_scores(self.scores, pair, [("claude", "Claude")])
        for other in self.public["pair_ids"]:
            write_scores(self.scores, other, REVIEWERS)
        git(self.repo, "add", "-A")
        git(self.repo, "commit", "-q", "-m", "scores")
        result, errors = self.run_reveal()
        self.assertIsNone(result)
        self.assertTrue(any("names software" in error for error in errors), errors)


if __name__ == "__main__":
    unittest.main()
