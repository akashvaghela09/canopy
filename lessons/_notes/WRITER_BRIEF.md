# Brief for lesson authors

You write lessons for **Canopy**, a desktop app that teaches git by running real git in a learning folder: terminal + file tree/editor + animated commit graph + lesson panel on one screen. Repo: /home/akash/myDrive/canopy.

## Read first
- `docs/LESSON_FORMAT.md`: the exact file format. It is a contract with the app. Use only the check types, question types and fields it lists (unknown fields are rejected by the validator).
- `docs/LESSONS.md`: the curriculum. Keep each lesson's id, title, teaches and requires as listed (`concept X` becomes skill id `concept-X`). Read the conventions blocks for your sections.
- `docs/ARCHITECTURE.md` section 6 (recall rule, one idea per lesson, boss lessons are goals-only) and section 8 (isolation).
- Examples of finished, reviewed-quality lessons: `lessons/2.03`, and sections 1–2 (`lessons/1.*`, `lessons/2.*`). Match their tone and depth.
- `lessons/_lib/setup-lib.sh`: helpers for setup.sh (fixed clock, authors alex/sam/priya/jordan, `mark`, `new_bare`, `clone_repo`, `goto`). Shared pre-built repos may go in `lessons/_lib/fixtures/<name>.sh`, but only your sections may use files you create there; name them after your section (e.g. `fixtures/s07-team.sh`).

## Writing
- Plain English, short sentences, concrete. Each content.md readable in under two minutes. No emojis, no "simply/just/easy".
- **Recall rule:** never show the command for a skill listed in `requires`; describe the intent ("make a commit", "create a branch"). Show the new command(s) this lesson teaches. `guided` lessons may show everything.
- Destructive lessons: add `destructive` to flags; first sentence says what will be lost.
- 1–3 hints per lesson, progressively more specific; the last may give the command.
- Boss lessons: goals only, no step list; list the real skill ids in `requires`.

## Goals
- Goals must not pass at the start, and must be checkable from final state, command usage or answers.
- **Accept every valid approach**, not just your solution. Prefer state checks over `usedCommand`. Use `usedCommand` only when the lesson is about a specific command form, and write regexes that accept reasonable variants (option order, `-m` vs `--message`, extra flags).
- Never check hashes of commits the learner creates (their commits use real time). Check messages, content, parent counts, ancestry. Commits made in setup have fixed hashes: refer to them with `@mark:`.
- Use `"sticky": true` for intermediate milestones that are no longer true at the end (e.g. "visit the old commit" before "come back to main"). The harness re-checks goals after every command, like the app.
- Use questions where the curriculum says "answers match" / "learner names...". Wrong options must be plausible. Use the `commit` question type with `@mark:` answers for "which commit".
- Remote lessons: setup builds `origin.git` (bare), `work/` (learner clone) and, when needed, `teammate/`. Things that happen "while the learner works" (teammate pushes, force-pushes) are **actions** (`actions/*.sh`, listed in lesson.yaml, triggered in solution.yaml with `#action <id>`). Actions source setup-lib.sh, `goto teammate`, use `as sam` etc., and must behave sensibly if run twice. List every repo in `repos:` with a friendly label.
- Editors: in solution.yaml set `GIT_SEQUENCE_EDITOR`/`GIT_EDITOR` inline when a command needs edited text (e.g. `GIT_SEQUENCE_EDITOR="sed -i -e '2s/^pick/squash/'" git rebase -i HEAD~3`). In the app, learners edit in an in-app editor; content.md should say "the editor opens" rather than naming vim/nano.
- Interactive bash has history expansion on: `!` inside double quotes breaks. Use single quotes in content and solutions where `!` appears.
- Version-sensitive lessons (see the table at the end of LESSONS.md): set `minGit`. Tool lessons: set `tools` (gpg, ssh-keygen, git-subtree).
- Learner shell environment: `HOME` is a Canopy-private folder; `--global` config is Canopy's own file; `--system` config is also a Canopy-private file (GIT_CONFIG_SYSTEM). Never touch anything outside the lesson folder; never run `git maintenance start`.

- "Ran X while in state Y" / "do X before Y": a sticky goal `all[usedCommand with "last": true, <state check>]` latches only if the most recent command matched while the state held.
- `commit` questions accept only hash prefixes (>= 4 hex) unless `"allowRefs": true`; solutions answer with `@mark:name`.

## Verify (mandatory)
From the repo root:
- `./target/debug/canopy-lesson validate`: no errors for your lessons (errors from sections not yet written are not yours).
- `./target/debug/canopy-lesson test -v <id>` for each lesson (or `test <section>`). A lesson is done only when it reports `ok`. Read the transcript and confirm the commands did what the lesson claims.
- Try at least one **alternative valid approach** for every non-trivial lesson: write it to a temp yaml and run `./target/debug/canopy-lesson test <id> --solution /path/alt.yaml`. If a reasonable approach fails, loosen the goals.
- Solution commands may fail on purpose (e.g. to show a refusal). The harness does not require exit 0; a goal can require the failure with `usedCommand` + `"exitCode": 128` (or whatever code git returns).
- `python3 tools/lesson-try.py <id> --shell` opens a learner shell after setup if you want to explore by hand.

## Boundaries
- Only write inside your own lesson folders, your own fixtures, and your own notes file `lessons/_notes/section-<N>.md`. Do not edit the format doc, setup-lib.sh, tools, Rust code, or other sections. Do not git commit.
- If the format is missing something you need, do not invent fields. Use the closest option (e.g. a read-only `shell` check) and record the gap in your notes file. Also record every deviation from LESSONS.md and why.

## Report
When finished, reply with: lessons written, one verification line per lesson, alternative approaches tried, and the gaps/deviations you noted.
