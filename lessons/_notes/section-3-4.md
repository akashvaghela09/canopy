# Notes: sections 3 and 4 (lesson author)

Gaps in the lesson format that came up, and places where the lessons deviate from `docs/LESSONS.md`.

## Format gaps

- **3.06 (commit ids)**: the "a 3-character prefix is refused" step is graded with `usedCommand` and
  `"exitCode": 128`; the harness does not require solution commands to exit 0, so `solution.yaml` runs
  `git show 3ad` as a real line.
- **Ordering of commands** is checked with sticky goals: an `all` of the `usedCommand` plus a state that only
  holds *before* the destructive step (4.01 diff while the junk is still in notes.txt, 4.09 status while HEAD
  is still on the experiment, 4.11 dry run while scratch.txt and tmp/ still exist). The harness re-checks goals
  after every command, so the wrong order never latches.
- **Regex engine**: the checker is Rust, so `usedCommand` regexes avoid lookaround (4.01 originally used a
  negative lookahead to exclude `--staged`; it now lists the allowed forms:
  `^git restore( (--worktree|-W|--))* (\./)?notes\.txt\s*$`).
- **Start-state check**: the CLI only fails when *all* goals already pass at the start. Every lesson here has
  at least one state-based goal that fails at the start (checked by hand); guard goals such as "main did not
  move" (4.10) or "ignored files still exist" (4.11) pass from the start by design.
- **3.03 date filters**: git's `--since=YYYY-MM-DD` uses the current time of day, so a commit on a boundary date
  could flip in or out. The fixture puts all commits near midday UTC and keeps the boundary dates (March 11 and
  March 17) free of commits, so the answer (3) is stable for the dates the lesson names.
- **Rename detection** (3.04 `--follow`, 3.10 `R` status, 3.13 "which file was renamed") relies on git's default
  `diff.renames=true` (git >= 2.9). The app's isolated gitconfig must not turn it off.
- **4.09** uses `not reachable` for the dropped commits; this assumes the `reachable` check does not count the
  reflog or ORIG_HEAD (it walks branches, tags, remote refs and HEAD, which is correct).

## Deviations from LESSONS.md

- **`requires` kept exactly as listed**, even where a lesson uses an older skill as a real step that is not in
  its list: 3.07, 4.03, 4.05, 4.07, 4.08, 4.12, 4.13 all need `add`/`commit` (taught in 2.01/2.02) to finish.
  The text describes those steps by intent, never by command, so the recall rule holds either way. If the
  validator or the app ever uses `requires` for more than ordering, add `add` and `commit` to those lists.
- **4.06** is flagged `guided`. LESSONS.md calls it "guided exploration" but does not carry the "(guided)" marker.
  It shows `git log --oneline --graph` and `git status`, both required skills, which the flag permits.
- **4.12** and **4.13** are flagged `destructive` (not flagged in LESSONS.md): 4.12's `scrap` case and 4.13 both
  discard uncommitted edits and untracked files. Their first sentence says so.
- **4.05**: `--no-edit` is described but not exercised.
  "Revert and edit before committing" is folded into the `--no-commit` task (the learner commits with
  their own message); there is no separate "edit a file mid-revert" step, to keep one idea per lesson.
- **3.06**: "find the shortest unambiguous prefix" is covered by a sentence on `--abbrev=4`; in this repo every
  commit is unique at 4 characters, so it is not a separate question.
- **3.01**: "limit to the last N commits" is checked with `-n 3` / `-3` / `--max-count=3`, plus a question that can
  only be answered from that limited output.
- **3.13 / 4.13 (boss)**: goals only, as required; `requires` lists the real skill ids (as 1.07 and 2.14 do).
  3.13 adds two questions beyond the four named in LESSONS.md (tip of the merged branch, commits by one author)
  to cover `log-graph`/`relative-refs` and `log-filter`. "What HEAD~4 contained" is a choice about the
  snapshot (KELVIN_OFFSET value and whether `to_fahrenheit` exists yet), which separates HEAD~4 from HEAD~3,
  HEAD~5 and the 5th line of a plain log; DEFAULT_CITY alone did not.
- **minGit**: 4.01, 4.02, 4.03, 4.12 and 4.13 set `minGit: "2.23"` because they need `git restore`.

## Fixtures

- `_lib/fixtures/bakery.sh`: shared by 3.01 to 3.12 (15 commits on main, two side branches, one merge, two
  annotated tags, one rename, one whitespace-only commit, four authors, dates spread over March 2024).
- `_lib/fixtures/weather.sh`: used by 3.13 only (different project, so the boss answers are fresh).
- Section 4 lessons each build their own small repo in `setup.sh`.

## Review

Applied the fixes from `lessons/_reviews/section-3-4.md` (2026-10-03). Commit questions rely on the engine's
hex-only default (no `allowRefs` needed anywhere in sections 3–4).
