"""The starter, the two conditions and the six briefs."""

from __future__ import annotations

import json
import re
import unittest

from helpers import lib

STARTER = lib.BENCH_DIR / "starter"
CONDITIONS = lib.BENCH_DIR / "conditions"
# Words that would tell a builder it is in a comparison, or which arm it is in.
GIVEAWAY = re.compile(r"\b(bench\w*|experiment\w*|baseline|condition\w*|blind\w*|evaluation)\b", re.IGNORECASE)


class StarterTest(unittest.TestCase):
    def test_starter_has_the_shadcn_base_files(self):
        for name in ("package.json", "package-lock.json", "components.json", "lib/utils.ts", "app/globals.css",
                     "app/layout.tsx", "app/page.tsx", "postcss.config.mjs", "tsconfig.json", "AGENTS.md"):
            self.assertTrue((STARTER / name).is_file(), name)
        components = json.loads((STARTER / "components.json").read_text(encoding="utf-8"))
        self.assertEqual(components["tailwind"]["baseColor"], "neutral")
        self.assertEqual(components["tailwind"]["css"], "app/globals.css")
        self.assertNotIn("registries", components)
        css = (STARTER / "app" / "globals.css").read_text(encoding="utf-8")
        for variable in ("--background", "--foreground", "--primary", "--muted-foreground", "--border", "--ring"):
            self.assertIn(f"{variable}:", css)

    def test_dependencies_are_exact_and_locked(self):
        package = json.loads((STARTER / "package.json").read_text(encoding="utf-8"))
        lock = json.loads((STARTER / "package-lock.json").read_text(encoding="utf-8"))
        for group in ("dependencies", "devDependencies"):
            for name, version in package[group].items():
                self.assertRegex(version, r"^\d+\.\d+\.\d+$", f"{name} must be pinned exactly")
                self.assertEqual(lock["packages"][f"node_modules/{name}"]["version"], version, name)
        self.assertEqual(lock["packages"][""]["dependencies"], package["dependencies"])

    def test_starter_has_no_build_output_or_dependencies(self):
        for name in ("node_modules", ".next", "next-env.d.ts"):
            self.assertFalse((STARTER / name).exists(), name)

    def test_nothing_in_the_starter_gives_the_setup_away(self):
        # The lockfile is excluded: it names third-party packages such as baseline-browser-mapping.
        for path in lib.tree_files(STARTER):
            if path.name == "package-lock.json":
                continue
            text = path.read_text(encoding="utf-8")
            self.assertNotRegex(text, GIVEAWAY, path.name)
            self.assertNotRegex(text, re.compile("tessli", re.IGNORECASE), path.name)


class ConditionsTest(unittest.TestCase):
    def test_prompts_are_byte_identical_across_conditions(self):
        for name in ("system.md", "task.md"):
            baseline = (CONDITIONS / "baseline" / name).read_bytes()
            self.assertEqual(baseline, (CONDITIONS / "tessli" / name).read_bytes(), name)

    def test_prompts_do_not_mention_the_comparison_or_a_condition(self):
        for name in ("system.md", "task.md"):
            text = (CONDITIONS / "baseline" / name).read_text(encoding="utf-8")
            self.assertNotRegex(text, GIVEAWAY, name)
            self.assertNotRegex(text, re.compile("tessli", re.IGNORECASE), name)

    def test_every_brief_renders_into_the_task_prompt(self):
        template = (CONDITIONS / "baseline" / "task.md").read_text(encoding="utf-8")
        self.assertEqual(set(re.findall(r"\{\{(\w+)\}\}", template)), {"brief", "states"})
        for brief_dir in lib.brief_dirs():
            task = lib.read_task_yaml(brief_dir / "task.yaml")
            brief = (brief_dir / "brief.md").read_text(encoding="utf-8").strip()
            rendered = lib.render_template(template, {"brief": brief, "states": lib.states_inline(task["states"])})
            self.assertIn(brief, rendered)
            for state in task["states"]:
                self.assertIn(f"`{state}`", rendered)

    def test_tessli_overlay_only_adds_to_the_project_notes(self):
        overlay = CONDITIONS / "tessli" / "overlay"
        self.assertEqual([p.relative_to(overlay).as_posix() for p in lib.tree_files(overlay)], ["AGENTS.md"])
        starter_notes = (STARTER / "AGENTS.md").read_text(encoding="utf-8")
        tessli_notes = (overlay / "AGENTS.md").read_text(encoding="utf-8")
        self.assertTrue(tessli_notes.startswith(starter_notes), "the overlay must keep the starter's notes verbatim")
        added = tessli_notes[len(starter_notes):]
        self.assertIn("TESSLI.md", added)
        self.assertIn("http://127.0.0.1:4100", added)
        self.assertIn("npx shadcn@4.21.4 add http://127.0.0.1:4100/<name>.json", added)
        self.assertNotRegex(added, GIVEAWAY)
        self.assertFalse((CONDITIONS / "baseline" / "overlay").exists())

    def test_rules_file_and_registry_exist_for_the_tessli_condition(self):
        self.assertTrue((lib.REPO_ROOT / "rules" / "TESSLI.md").is_file())
        self.assertTrue((lib.REPO_ROOT / "web" / "public" / "r" / "registry.json").is_file())


class BriefsTest(unittest.TestCase):
    def test_six_briefs_with_their_files(self):
        dirs = lib.brief_dirs()
        self.assertEqual([d.name[:2] for d in dirs], ["01", "02", "03", "04", "05", "06"])
        for directory in dirs:
            for name in ("brief.md", "task.yaml", "rubric.md"):
                self.assertTrue((directory / name).is_file(), f"{directory.name}/{name}")

    def test_task_files(self):
        slugs = set()
        for directory in lib.brief_dirs():
            task = lib.read_task_yaml(directory / "task.yaml")
            self.assertEqual(task["id"], directory.name[:2])
            self.assertEqual(directory.name, f"{task['id']}-{task['slug']}")
            self.assertEqual(task["route"], "/")
            self.assertEqual(task["widths"], [str(width) for width in lib.WIDTHS])
            states = task["states"]
            self.assertEqual(states[0], "default")
            self.assertEqual(len(states), len(set(states)))
            for state in states:
                self.assertRegex(state, r"^[a-z][a-z0-9-]*$")
            slugs.add(task["slug"])
            if task["id"] != "06":
                self.assertIn("v1.1-archive", task["adapted_from"])
        self.assertEqual(len(slugs), 6)

    def test_briefs_are_self_contained_fiction(self):
        for directory in lib.brief_dirs():
            task = lib.read_task_yaml(directory / "task.yaml")
            brief = (directory / "brief.md").read_text(encoding="utf-8")
            self.assertIn("fictional", brief)
            self.assertEqual(brief.splitlines()[0], f"# {task['title']}")
            for state in task["states"]:
                self.assertIn(f"`{state}`", brief, f"{directory.name} must describe state {state}")
            for text in (brief, (directory / "rubric.md").read_text(encoding="utf-8")):
                self.assertNotRegex(text, GIVEAWAY, directory.name)
                self.assertNotRegex(text, re.compile("tessli", re.IGNORECASE), directory.name)

    def test_task_yaml_reader_rejects_what_it_does_not_understand(self):
        import tempfile
        from pathlib import Path

        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "task.yaml"
            path.write_text("states:\n  - default\n", encoding="utf-8")
            with self.assertRaises(ValueError):
                lib.read_task_yaml(path)


if __name__ == "__main__":
    unittest.main()
