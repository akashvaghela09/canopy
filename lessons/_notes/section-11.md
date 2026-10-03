# Notes: section 11, Detective work (lesson author)

## Fixtures (all in `lessons/_lib/fixtures/`, each builds in under one second)

- **`s11-shop.sh`** (repo `pricer`): used by 11.01, 11.02, 11.03, 11.04, 11.08, 11.09, 11.10, 11.11,
  11.12. 30 commits on main over Feb 5 to Mar 19 2024 by four authors, one merged feature branch, tags
  v0.1, v0.2 (lightweight), v1.0, v1.1 (annotated), a maintenance branch `release/0.2`, a rebased
  topic series in two versions (`topic/rounding-v1`, `topic/rounding`), a planted bug (TAX_RATE
  0.20 -> 0.02, "Tidy tax constants") and its fix, a whitespace-only reformat, a function moved
  between files, two renames (USAGE.md -> docs/usage.md, vat.py -> tax.py) and one deletion
  (config/defaults.toml). The header comment lists every mark and the shortlog counts. Messages that
  would give an answer away are neutral ("Accept prices stored as strings", "Clean up cart.py",
  "Reorganize the docs", "Extend the discount table"); keep them that way.
- **`s11-bisect.sh`** (repo `tally`): 11.05, 11.06, 11.07. 64 commits generated in a loop (5 h apart),
  tag v2.0 at commit 8, three planted behaviours: the sum bug at 41 (`tests/sum.sh` detects it; bisect
  path from v2.0 is 36, 50, 43, 39, 41, 40 = six steps), the fmt bug at 53 (`bash fmt.sh 1205` prints
  12.5), and the negative-number fix at 36 with untestable commits 30-32 (syntax error). The old/new
  search for the fix visits 36, 22, 29, 32 (skip), 33, 34, 35, so `bisect skip` is a real step.
  Commits 20 and 60 are harmless fmt.sh decoys so `git log -- fmt.sh` does not give 11.06's answer;
  commit 36 has the neutral message "Tidy up the input loop". Add decoys only in filler slots: the
  commit count fixes the bisect paths. On main `tally.sh -2 5` prints -2 (the sum bug), exit 0.
- **`s11-ledger.sh`** (repo `ledger`): 11.13 only, so the boss answers are fresh. 27 commits, tags
  v2.0 to v2.3, `maint/2.1`, a regression (commit 14) between v2.0 and v2.1, its fix (commit 20, Priya)
  before v2.2, a tab reindent after the fix (so plain blame says Jordan, `-w` says Priya), a renamed
  script and a deleted notes file, and `tests/balance.sh` for bisecting. The regression, rename and
  deletion commits have neutral messages ("Tidy report()", "Reorganize scripts", "Clean up the repo root").

Mark names are per fixture; a lesson sources exactly one fixture, so there is no clash.

## Environment facts and format gaps

- **`git shortlog` with no revision reads stdin when stdin is not a terminal.** The app and the
  harness both run the shell in a PTY, so bare `git shortlog -sn` reads HEAD there. 11.09 teaches the
  bare form and mentions the stdin behaviour once, as a note for scripts.
- **`--since=<date>` is evaluated at the current time of day, in local time.** The fixture keeps
  2024-03-09 to 03-11 free of commits so `--since=2024-03-10` gives the same ranking (Jordan 2,
  others 1) in every time zone; "since 2024-03-01" was dropped because it tied Jordan and Priya.
- **`blame --ignore-revs-file` needs full 40-character ids** (an abbreviated id gives "invalid object
  name"). 11.04 says so and the hint suggests `git rev-parse <short> > .git-blame-ignore-revs`.
- **`blame -C` needs a moved block of at least 40 alphanumeric characters** by default; the moved
  `format_price` body is long enough. The root commit shows with a `^` prefix in blame output.
- **`log -L` does not follow renames**, so `total()` stays in `pricer/cart.py` for the whole history.
  `-L :total:` lists four commits (verified); removing an adjacent function did not register.
- **`log -S` skips value-only line changes** and ignores pure renames (rename detection is on), which
  is exactly the -S versus -G lesson in 11.02. `-S TAX_RATE` also lists "Add VAT helper" (a second
  file referencing the constant); the question counts `-G 'TAX_RATE ='` results instead (3).
- **`git bisect reset` takes no `-q`.** Solutions use the plain form.
- **Bisect goals**: `operation: null` plus `currentBranch: main` enforce "finish with `bisect reset`";
  both pass at the start by design (other goals do not). 11.05 accepts `bisect run` as well as manual
  `good`/`bad` so a learner who already knows `run` is not blocked.
- **Bisect must really narrow the search** (review X2): 11.05/11.06 have a sticky goal `refAt
  refs/bisect/bad @mark:...` plus a read-only shell check that `refs/bisect/<new term>` minus the
  `<old term>-*` refs is one commit (terms read from BISECT_TERMS). 11.07 lets the learner pick terms,
  so its shell check tests `tally.sh -2 5` at the narrowed commit (exit 0) and its parent (non-zero).
  11.07's skip goal is a sticky state check (`refs/bisect/skip-*` exists), so `bisect run` with exit
  125 counts. These add validator "shell check" warnings.
- `usedCommand` regexes accept `git --no-pager`, `git -C <dir>` and `git -c k=v` before the command.
- The graph shows refs/bisect/* as small badges named by term, so 11.05 points at them.
- Solution commands cannot use `@mark:`; where a command needs a setup id the solution derives it
  (`$(git log --format=%h --grep '...')`). Alternative solutions use the fixed short ids.
- Multi-select `choice` questions (11.03, 11.10, 11.11, 11.13) use `answers: [...]`; the app must
  present these as multi-select.

## Deviations from LESSONS.md

- **11.03** "learner lists the commits that changed it" is a multi-select question over commit
  messages plus one `commit` question (first change after creation).
- **11.04** adds a `-C` task (function moved between files) on top of the whitespace/ignore-rev task,
  since `-M`/`-C` are in the skill definition. `minGit: "2.23"` for `--ignore-rev(s-file)`.
- **11.05** uses the repo's own `tests/sum.sh` rather than asking the learner to write one; 11.06 is
  where the learner writes a script (`term-files`).
- **11.07** "bisecting through merges" is explained only (the tally history is linear); the
  untestable-commit case is a real step.
- **11.08** keeps `rebase` in `requires` as listed but the learner does not rebase; the fixture holds
  the before/after series so the answers are deterministic. The two-range form of `range-diff` is
  taught; `A...B` would pull main's commits into the second range.
- **11.10** asks the `name-rev` result as a choice (`tags/v1.1~3`) rather than free text. The content
  uses a made-up example (`tags/v3.2~4`) so it does not show the answer.
- **11.12** teaches `--follow` again although 3.04 introduced it (it is in the skill definition);
  the new idea is `--diff-filter`. The deleted file is not named in the content or prompts (a text
  question asks for its path), so `--diff-filter=D` is needed rather than `git log -- <path>`.
- **11.13** (boss): goals only; six questions covering bisect/pickaxe, blame options, containment,
  rename and deletion queries.
- `requires` kept exactly as listed; lessons also use `log --grep`, `show`, `log --oneline` as real
  steps described by intent.

## Alternatives tested (all pass)

11.01 `-S"..." -- <path>`; 11.02 `--pickaxe-regex -S` and `-GTAX_RATE`; 11.03 `-L '/def total/,/^$/:'`;
11.04 `--ignore-rev` with `-L`, full-id ignore file, `-C -C`; 11.05 `bisect start HEAD v2.0` +
`bisect run bash tests/sum.sh`; 11.06 script outside the repo run with `sh`, `bisect bad HEAD`/`good
v2.0` separately; 11.07 built-in `old`/`new` terms; 11.08 `range-diff <base> <rev1> <rev2>` and an
explicit `topic/rounding~2..` range; 11.09 `-s -n HEAD` and quoted `--since`; 11.10 `branch -a
--contains`, `--is-ancestor && echo`; 11.11 pathspecs and two revisions at once; 11.12
`--name-status` instead of `--summary`; the old-name answer is case-sensitive (`usage.md` is rejected;
accepted spellings are `USAGE.md`, `/USAGE.md`, `./USAGE.md`); 11.13 pickaxe (`-G ... v2.0..v2.1`) instead of bisect,
`--ignore-rev` instead of `-w`, `--is-ancestor` for the maint branch.

Review fixes (section-11 review) re-tested: 11.04 bundled `-wC` and the `blame.ignoreRevsFile` config
route; 11.07 `--term-good/--term-bad` and `bisect run` with exit 125; 11.09 `--after`; 11.11 a commit id
or `main~20` as the revision. Guess-only bisects (`start; bad; reset`, `run true`, bare `skip`) fail.
