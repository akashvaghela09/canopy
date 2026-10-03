# Notes for sections 1 and 2

Gaps in the format or tooling that affected these lessons, and places where the
lessons deviate from `docs/LESSONS.md`. Nothing here was invented in the files;
each item uses the closest existing option.

## Harness and checker

- **Interactive bash history expansion.** The learner shell is `bash -i`, so
  `echo "!audit.log" >> .gitignore` fails with "event not found". 2.10 tells the learner to
  use single quotes for the `!` line (and the editor in the files panel). Worth knowing for
  any later lesson that writes `!` patterns from the terminal.
- **Unborn branch.** 1.03 checks `currentBranch: main` on a repo with no commits. The checker
  uses `symbolic-ref`, so this works; noting it in case that implementation changes.
- **Repo folder that does not exist at start.** 1.03 (`repo: garden`, an empty folder) and
  1.07 (`repo: bakery`, not created until the learner makes it) name a repo the graph cannot
  open until the learner runs `git init`. The app needs to tolerate a missing or non-repo
  `repo` path (show the "no repo yet" / "no commits yet" state).
- **`fileContent` with `repo: null`.** 1.02 uses `fileContent` with `path: project/hello.txt`
  relative to `LESSON_ROOT`, since there is no default repo. The checker accepts this.
- **Guard goals that pass at start.** Several lessons have one goal that already passes
  after setup on purpose (2.10 "ignored files still on disk", 2.11 "nothing staged",
  2.12 "clean tree", 2.13 "do not commit"). They exist to block shortcuts (deleting the files,
  committing); the harness only fails when *all* goals pass at start, so this is fine.

## Deviations from LESSONS.md

- **1.05** LESSONS says "learner names the file git lists as untracked". The learner creates
  the file themselves, so naming it would be trivial; the question asks for the *heading*
  git lists it under instead, and a `status` check confirms the file is untracked.
- **1.06** shows `git log` (taught in 2.09) as an inspection step. The lesson is `guided`,
  and the point is to see author, date and message stored in the commit; no `log` skill is
  claimed in `teaches`.
- **2.02** LESSONS implies the file is already staged ("commit the staged file only"). The
  learner stages it themselves so that `add` is a real recalled step, per ARCHITECTURE 6.5.
- **2.06** The modifications and the new file are created by setup rather than by the
  learner, to keep the lesson to its one idea (`-a`).
- **2.09** The three older commits are made by setup (with fixed authors and dates, so the
  "who" and "when" questions have stable answers); the learner adds the fourth commit.
- **2.10** Also teaches `echo ... >>` (append) in a hint and one sentence, because
  `.gitignore` needs several lines and only `>` was taught in 1.02. The files-panel editor is
  offered as the primary route.
- **2.12** A rename is checked by content and presence in HEAD (`journal.txt` has the old
  text, `notes.txt` is gone) rather than by git's rename detection, which the check set
  cannot express directly. The transcript confirms git reports both as `renamed:`. The
  second rename accepts any route except `git mv` (plain `mv` or the files panel), checked
  as "chapter1.md is in the index" plus "no `git mv ... draft.md` command".
- **2.13** The reproduction target stages the deletion of `e.txt` (`D  e.txt`) rather than
  leaving it unstaged, so the end state is unambiguous for the `status` check
  (`modified: []`, `exact: true`).
- **2.14** "Each change its own commit" is checked with a read-only `shell` check (the
  validator warns about it, expected): the commits that add `.gitignore`, add `utils.py`,
  delete `old_notes.txt` and add `cart.py` must be four distinct commits
  (`git log --no-renames --diff-filter=A|D`; without `--no-renames` the rename shows as R).
  The latest commit must have a subject and a body; the content now says so.
- **Boss `requires`** (1.07, 2.14) list the real skill ids instead of `[section]`. 2.14 does
  not need `commit-a`, `diff`, `diff-staged` or `status-short`, so they are not listed.

## Changes after review (lessons/_reviews/section-1-2.md)

- Harness: `canopy-lesson test` re-checks goals after every command, so sticky goals are
  tested like in the app. 1.01 ("move into notes") and 2.04 ("-u first") now use sticky
  state checks (2.04 combined with the `-u` usedCommand).
- Identity: the engine now keeps the fallback identity in Canopy's private system config,
  only when no identity exists at any level, so 1.04's global goals no longer pass at start.
  1.04 content mentions the system-level fallback and corrects how layers are read.
- 1.01 no longer calls the current folder "the working directory"; "working tree" is
  defined where first used (2.01, 1.05).
- 2.11 accepts secrets.env as untracked or ignored (the content suggests ignoring it) and
  explains the double listing in status.
- 2.03 requires both lines in the committed todo.txt; 2.06 accepts combined flags like `-qa`
  and has a plausible wrong option; 2.09 accepts "Sam Chen <sam@example.com>"; 2.10 adds a
  question on `!` negation (force-adding or listing names would otherwise skip it); 2.13's
  example table uses names different from the repo so the questions need the real output.
- `requires` additions: 2.10 `commit`, 2.12 `commit`, 2.13 `add`, `add-patterns`.
