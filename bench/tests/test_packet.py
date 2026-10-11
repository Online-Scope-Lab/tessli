"""Blind-review packets: complete, and free of anything that reveals a condition."""

from __future__ import annotations

import json
import re
import tempfile
import unittest
from pathlib import Path

from helpers import lib, make_batch, quiet

import prepare_blind_packet as packet
import randomize_blind_labels as randomize

SEED = "7" * 64
NEUTRAL_URL = "https://example.test/artifacts"


class PacketTest(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.tmp = Path(self._tmp.name)
        self.runs = self.tmp / "runs"
        # Every brief, so every brief's text and reviewer notes go through the leak check.
        self.pairs = make_batch(self.runs, briefs=("01", "02", "03", "04", "05", "06"), run_indexes=(1,))
        self.sealed = self.tmp / "private" / "mapping.json"
        self.commitment = self.tmp / "packets" / "commitment.json"
        code, _ = quiet(randomize.main, ["--runs-dir", str(self.runs), "--sealed", str(self.sealed),
                                         "--commitment", str(self.commitment), "--seed", SEED])
        self.assertEqual(code, 0)
        self.out = self.tmp / "packets"
        self.artifacts = self.tmp / "artifacts"

    def tearDown(self):
        self._tmp.cleanup()

    def build(self, url: str = NEUTRAL_URL) -> int:
        code, _ = quiet(packet.main, ["--sealed", str(self.sealed), "--commitment", str(self.commitment),
                                      "--runs-dir", str(self.runs), "--out", str(self.out),
                                      "--artifacts-out", str(self.artifacts), "--artifacts-url", url])
        return code

    def packets(self) -> dict[str, tuple[str, str]]:
        result = {}
        for pair in lib.read_json(self.commitment)["pair_ids"]:
            result[pair] = (
                (self.out / pair / "PACKET.md").read_text(encoding="utf-8"),
                (self.out / pair / "score-form.json").read_text(encoding="utf-8"),
            )
        return result

    def test_packets_never_name_a_condition_or_a_run(self):
        self.assertEqual(self.build(), 0)
        run_ids = [run for slot in self.pairs.values() for run in slot.values()]
        packets = self.packets()
        self.assertEqual(len(packets), 6)
        for pair, (text, form) in packets.items():
            for content in (text, form):
                self.assertNotRegex(content, re.compile(r"baseline|tessli", re.IGNORECASE), pair)
                self.assertNotIn(str(self.runs), content)
                self.assertNotRegex(content, r"(^|[^\w])runs/")
                for run_id in run_ids:
                    self.assertNotIn(run_id, content)
        image_paths = [p.relative_to(self.artifacts).as_posix() for p in self.artifacts.rglob("*.png")]
        for path in image_paths:
            self.assertRegex(path, r"^packets/\d{2}-[0-9a-f]{6}/[AB]/[a-z0-9-]+-(1440|768|390)\.png$")

    def test_repository_name_appears_only_in_the_shared_image_url(self):
        url = packet.DEFAULT_ARTIFACTS_URL
        self.assertEqual(self.build(url), 0)
        for text, _ in self.packets().values():
            stripped = text.replace(url + "/", "")
            self.assertNotRegex(stripped, re.compile(r"baseline|tessli", re.IGNORECASE))

    def test_packet_has_brief_screenshots_evidence_and_empty_form(self):
        self.assertEqual(self.build(), 0)
        sealed = lib.read_json(self.sealed)
        for pair, (text, form) in self.packets().items():
            brief_id = pair.split("-")[0]
            task = lib.read_task_yaml(lib.find_brief(brief_id) / "task.yaml")
            self.assertIn(task["title"], text)
            for state in task["states"]:
                self.assertIn(f"### `{state}`", text)
                for width in lib.WIDTHS:
                    for label in lib.LABELS:
                        self.assertIn(f"{NEUTRAL_URL}/packets/{pair}/{label}/{state}-{width}.png", text)
                        self.assertTrue((self.artifacts / "packets" / pair / label / f"{state}-{width}.png").is_file())
            for title in lib.DIMENSION_TITLES.values():
                self.assertIn(f"| {title} |", text)
            self.assertIn("| Console errors | 1 | 1 |", text)
            self.assertIn(sealed["commitment"], text)
            data = json.loads(form)
            self.assertEqual(data["pair_id"], pair)
            self.assertTrue(all(entry["A"] is None and entry["B"] is None for entry in data["dimensions"].values()))
            self.assertEqual(data["reviewer"], {"name": "", "github": ""})

    def test_console_messages_stay_out_of_packets(self):
        # The fixture's console message names the condition and run id; only the count may appear.
        self.assertEqual(self.build(), 0)
        for text, _ in self.packets().values():
            self.assertNotIn("console_messages", text)

    def test_refuses_artifacts_inside_the_repository(self):
        code, _ = quiet(packet.main, ["--sealed", str(self.sealed), "--commitment", str(self.commitment),
                                      "--runs-dir", str(self.runs), "--out", str(self.out),
                                      "--artifacts-out", str(lib.BENCH_DIR / "packets" / "images")])
        self.assertNotEqual(code, 0)
        self.assertFalse((lib.BENCH_DIR / "packets" / "images").exists())

    def test_refuses_a_mapping_that_does_not_match_the_commitment(self):
        sealed = lib.read_json(self.sealed)
        pair = sorted(sealed["payload"]["pairs"])[0]
        sides = sealed["payload"]["pairs"][pair]
        sides["A"], sides["B"] = sides["B"], sides["A"]
        lib.write_json(self.sealed, sealed)
        self.assertEqual(self.build(), 1)
        self.assertFalse(self.out.joinpath(pair, "PACKET.md").exists())

    def test_leak_check_catches_condition_names_and_run_ids(self):
        self.assertEqual(packet.leaks("Build A used the Tessli rules", []), ["Tessli"])
        self.assertEqual(packet.leaks("see r0123456789ab", ["r0123456789ab"]), ["r0123456789ab"])
        self.assertEqual(packet.leaks("from bench/runs/x", []), ["runs/"])
        self.assertEqual(packet.leaks("nothing to see", []), [])


if __name__ == "__main__":
    unittest.main()
