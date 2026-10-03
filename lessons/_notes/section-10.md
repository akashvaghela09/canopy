# Notes: section 10, Recovery (lesson author)

Format gaps, environment facts that shaped the lessons, and deviations from `docs/LESSONS.md`.

## Environment facts that matter here

- **Setup reflogs are dated 2024.** Reflog entries written by setup carry the fixed clock's timestamps
  (`GIT_COMMITTER_DATE`), so every entry is already older than git's 90-day default when the learner
  opens the lesson. Consequences: (a) `@{yesterday}`, `@{2.hours.ago}` resolve to the current tip in
  every setup repo (10.02 explains this and uses explicit dates instead); (b) any `git gc` the learner
  runs expires the *entire* setup reflog, not only unreachable entries (10.11 says so in its last
  paragraph). No other lesson runs `gc`, and the repos are far too small for auto-gc to trigger.
- **`@{<date>}` is read in the learner's local time zone.** 10.02 spaces its reflog entries several
  days apart and asks about dates in the middle of the gaps (2024-03-10, 2024-03-13T12:00), so the
  answer is the same for any zone from UTC-14 to UTC+14.
- **`fsck --lost-found` lists commits that are only in the reflog as dangling** (verified on git
  2.43), while `fsck --unreachable` honours reflogs unless `--no-reflogs` is given. 10.09 expires the
  reflog in setup anyway so the "reflog is no help, fsck is" story holds for both commands.
- **`git bisect reset -q` is not valid** (no `-q`); irrelevant here but noted for section 11.
- **`setup-lib.sh commit_file` takes exactly three arguments** (path, one content string, message).
  Multi-line files use `write` + `commit`. (A first draft passed extra lines to `commit_file` and
  silently produced one-line files with empty messages; worth a guard in the lib.)
- In the harness, `git stash apply` with a raw commit id works for dropped stashes (10.10, 10.12,
  10.13); `git stash store <id>` followed by `pop` is the accepted alternative.

## Format gaps

- **Solution commands cannot use `@mark:`** (only answers can), so solutions that need a setup commit id
  compute it in the shell instead (`$(git fsck --unreachable | ... | grep ' On main: ' | cut ...)`,
  `old=$(git rev-parse HEAD@{1})`). A `@mark:` expansion in `commands:` would make these readable.
- **10.11 "object is gone" check**: there is no "object does not exist" check type. `fileInRev` with
  `present: false` against `@mark:lost` works because `cat-file -e <sha>:README.md` fails once the
  commit object is pruned; recorded here in case `fileInRev` ever starts erroring instead of failing
  on an unknown revision.
- **10.04 "undo the pull"** cannot be distinguished from the start state (main ends where it began),
  so it is checked with `usedCommand` on `reset ... ORIG_HEAD`; the pull and the merge themselves are
  sticky state goals.
- **Ordering**: 10.11 enforces "read the reflog before expiring it" with a sticky `all[usedCommand last,
  fileInRev @mark:lost present]`. 10.03's label was relaxed to "Read the reflog" instead, since enforcing
  order there would trap learners who use ORIG_HEAD first.
- The "ghost trail" visualisation named in LESSONS.md for 10.01 has no panel id, but the graph draws
  commits known only to HEAD's reflog in solid gray, and rewritten originals (a later commit with the
  same subject and author exists) dashed and hollow with a dotted arrow to the copy. 10.01, 10.03, 10.05,
  10.06, 10.07 and 10.11 point at these. Dropped stashes and expired reflogs (10.09, 10.10) show nothing.

## Deviations from LESSONS.md

- **10.04** keeps `rebase` in `requires` as listed but the task has no rebase step; the text only
  mentions that rebase also writes ORIG_HEAD. The experiment branch forks one commit below the pull
  base so that the merge step is a real merge (a branch forked at the tip would fast-forward).
- **10.05**: the "wrong" rebase is onto a sibling branch (`wip-styles`), not a conflicting one, so it
  completes without intervention in setup. `ORIG_HEAD` also works here and the text says so; the goal
  accepts either route.
- **10.08**: LESSONS.md lists `cherry-pick` in `requires`; the scenario (one file dropped by an amend)
  is solved by restoring the file from `HEAD@{1}` or by resetting and re-amending, both accepted.
  Cherry-picking `HEAD@{1}` also applies cleanly here and is accepted (mentioned in step 3).
  `restore-source` was added to `requires` because hint 2 and step 2 use it.
- **10.09** lists `requires: [reflog-read, show, concept-refs-files]` (the curriculum's "concept
  `refs-files`"). The never-staged file is only described in the text (there is nothing to put in
  the repo); the "staged-but-uncommitted content" is recovered from the dangling blob.
- **10.11** is flagged `destructive` (not flagged in LESSONS.md): it deliberately destroys the lost
  commit. Defaults quoted (90 days reachable, 30 days unreachable, prune 2 weeks) were checked against
  `git help config` for gc.reflogExpire / gc.reflogExpireUnreachable / gc.pruneExpire on git 2.43.
- **10.12** uses `start: "."` with five case repos in `repos:`; `repo:` is the first case so the graph
  has a default. The unrecoverable case is graded by a question (nothing to check in the repo).
- **10.13** (boss) and 10.12 case 4: the stash goal accepts the content back in the working tree *or*
  in `stash@{0}` (checked by content, so `git stash store <id>` works with or without `-m`).
- **Original ids vs copies** (review X3): 10.03, 10.05, 10.06 and 10.13 require the original commits
  (labels say "original"); cherry-picked copies fail there by design. 10.07 also accepts copies of both
  experiment commits on any branch (shell check on subjects). 10.08 and 10.10 check content.
- **10.01** no longer has the "main stays where the reset left it" goal (it penalised early recovery).
- `requires` kept exactly as listed everywhere; several lessons also need `add`/`commit`/`log`/`show`
  as real steps, described by intent only.

## Alternatives tested (all pass)

10.03 `reset --hard main@{1}`; 10.04 `pull --ff-only` + `merge --no-edit`; 10.05 `reset --hard
ORIG_HEAD`; 10.06 and 10.07 `switch -c <name> HEAD@{1}`; 10.08 `reset --hard HEAD@{1}` then re-amend
the message; 10.09 `fsck --unreachable` + `git show <blob>` redirect; 10.10 `stash store` + `stash
pop`; 10.11 `reflog expire --expire-unreachable=now --all` instead of config; 10.12 mixed (`main@{1}`,
`switch -c`, `ORIG_HEAD`, `stash store`); 10.13 `branch -f`-free route via `switch` + `reset --hard
feature/api-v2@{1}` and `stash store`.
