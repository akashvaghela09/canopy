# Brief for lesson reviewers

You are the senior reviewer for lesson content in **Canopy**, a desktop app that teaches git by running real git (terminal + files + animated commit graph + lesson panel). Repo: /home/akash/myDrive/canopy. Another author (Fable) wrote the lessons you review. You do an independent, rigorous review. In the first pass you do NOT edit lesson files: you write findings; the lead rules on them and may then ask you to apply them.

## Read
- `lessons/_notes/WRITER_BRIEF.md` (the rules the author had), `docs/LESSON_FORMAT.md`, the matching entries and conventions in `docs/LESSONS.md`, `docs/ARCHITECTURE.md` section 6, the author's notes `lessons/_notes/section-<N>.md`.
- Every file of every lesson in your sections, plus fixtures they source from `lessons/_lib/fixtures/`.
- For tone/consistency reference: the reviewed sections 1–2 (`lessons/1.*`, `lessons/2.*`) and `lessons/_reviews/section-1-2.md` (an example of the review quality expected).

## Engine facts
- The harness re-checks goals after every solution command (sticky goals work) and does not require commands to exit 0 (a goal may require a refusal via `usedCommand` + `exitCode`).
- Learner shell: `bash --norc -i`, history expansion on, Canopy-private HOME, `--global` = Canopy's config, `--system` = Canopy-private file holding a fallback identity ("Canopy Learner") used only when no identity is set elsewhere.
- Setup runs with a fixed clock and identities (alex/sam/priya/jordan); learner commits use real time.
- If the live catalog is broken by a half-written lesson from another section, test against a copy: `cp -r lessons /tmp/claude-1000/<you>/lessons` and pass `--lessons <copy>`.

- New check option: "Ran X while in state Y" / "do X before Y": a sticky goal `all[usedCommand with "last": true, <state check>]` latches only if the most recent command matched while the state held.
- `commit` questions accept only hash prefixes (>= 4 hex) unless `"allowRefs": true`; solutions answer with `@mark:name`.

## Review each lesson for
1. **Git accuracy**: every statement and command correct for git 2.32+.
2. **Pedagogy**: one new idea; matches the curriculum entry; recall rule (no commands for `requires` skills unless `guided`); clear; under two minutes to read; steps lead to the goals; progressive hints.
3. **Goal robustness** (most important): goals must not pass at the start, must not be passable by a wrong approach, and must accept every reasonable valid approach. Write alternative solutions to `/tmp/claude-1000/<your-dir>/*.yaml` and run `./target/debug/canopy-lesson test <id> --solution <file>`. At least two genuinely different valid approaches per non-trivial lesson and at least one plausible wrong approach. Report each result.
4. **Questions**: answers truly correct (verify with real git, e.g. `python3 tools/lesson-try.py <id> --no-solution --keep`); wrong options plausible but unambiguous; text answers accept reasonable variants.
5. **Setup/fixtures/actions**: deterministic, realistic, minimal; marks correct; actions sensible when run twice.
6. **Consistency** with earlier sections: terminology, tone, UI references.

Also run `./target/debug/canopy-lesson validate` and `./target/debug/canopy-lesson test <sections>`.

## Output
Write `lessons/_reviews/section-<N>.md`: short overall verdict; then per lesson: findings with severity (blocker / major / minor / nit), exact file and text, why it matters, and a concrete proposed fix (exact replacement text or JSON). Test proposed goal fixes in a scratch copy where practical. Then a table of the alternative-approach tests with results. Be specific and skeptical. Reply with counts by severity and the top 10 findings.
