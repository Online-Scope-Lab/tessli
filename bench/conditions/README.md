# Conditions

Each build runs under exactly one of two conditions. The prompts are the same in both; the only difference is what is in the project when the builder starts.

| | `baseline` | `tessli` |
| --- | --- | --- |
| Prompt (`system.md`, `task.md`) | identical bytes | identical bytes |
| Project | `bench/starter/` | `bench/starter/` plus `overlay/` |
| `AGENTS.md` | the starter's project notes | the same notes plus a section on `TESSLI.md` and the local registry |
| `TESSLI.md` | absent | `rules/TESSLI.md` from the frozen commit, copied in by `new_run.py` |
| Local shadcn registry at `http://127.0.0.1:4100` | not running | `web/public/r/` from the frozen commit, served for the whole build |

`task.md` has two placeholders that `new_run.py` fills from the brief: `{{brief}}` (the brief's `brief.md`, verbatim) and `{{states}}` (the `states` list from its `task.yaml`, as comma-separated code spans). The rendered prompts are written to the run directory and their SHA-256 recorded in the manifest; `validate_pair.py` refuses a pair whose prompts differ.

Neither prompt says the build is part of a comparison or names a condition. `bench/tests/test_starter_and_conditions.py` checks that, and that the two prompts stay byte-identical.

There is no `baseline/overlay/`: the baseline project is the starter unchanged.
