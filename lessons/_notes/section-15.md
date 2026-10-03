# Notes: section 15, Specialist tools (lesson author)

All 18 lessons pass `canopy-lesson test 15`. Tools preflight: `git-subtree` on 15.05, 15.06, 15.18;
`ssh-keygen` on 15.12 and 15.18. `minGit`: 15.12 and 15.18 "2.34" (SSH signing), 15.16 "2.29".

## Fixtures

- `_lib/fixtures/s15-lib.sh`: `make_lib <name> [versions...]` builds `<name>.git` (bare) with one commit per
  version (files `version.txt`, `greet.txt`, author Sam) through a temporary clone that is deleted afterwards.
  Marks `<name>-<version>` (dots as dashes) and `<name>-tip`. Used by 15.01 to 15.06 and 15.18.
- Submodule setups run `git -c protocol.file.allow=always submodule add ...` / `clone --recurse-submodules`
  because setup has its own throwaway config; the learner shell relies on Canopy's global config.
- 15.05 has an action `lib-update` (Sam publishes lib 1.1 from the `upstream` clone; a second run is a no-op).

## Format gaps

- `shell` checks (read-only) cover: gitlink detection (`ls-files -s` / `ls-tree` mode 160000; `fileInRev` on
  a gitlink would need `cat-file -e` on an object the superproject does not have), cross-repo equality of
  commits (15.02, 15.03, 15.09), `git apply --check` of a patch folder in another repo (15.07, 15.18),
  `verify-tag`/`verify-commit` (15.12, 15.18), tarball listings (15.10, 15.18), `bundle verify`/`list-heads`
  (15.18), `count-objects` and commit-graph presence (15.16). 15.08 now uses `operation: null`, which covers `am`. Candidate check types: `gitlink`, `refEquals` across repos, `signatureValid`, `archiveContains`.
- `usedCommand` defaults to exit code 0; 15.14's "attempt the merge that includes clash" sets
  `"exitCode": null` so the failed octopus attempt counts.
- 15.11 reads notes with `fileContent` at `source: refs/notes/commits`, `path: <full commit id>` (no fanout
  for a handful of notes). Fine for the lesson, but fragile if git ever fans out small notes trees.
- 15.12 keys are created inside the lesson repo (`project/keys/`), untracked and listed in `.git/info/exclude` by
  setup so they cannot be committed; `user.signingkey` and `gpg.ssh.allowedSignersFile` are set with absolute
  paths via `$PWD`. Verification needs OpenSSH 8.2+
  (`ssh-keygen -Y`), which the `ssh-keygen` preflight does not distinguish.
- 15.16 never runs `maintenance start`; a `not usedCommand` goal guards it. The commit-graph task writes a
  split chain under `.git/objects/info/commit-graphs/`; the check accepts that or a single `commit-graph` file.

## Deviations from LESSONS.md

- 15.04 (`rm` in `requires`): `git rm lib` is described by intent ("remove the path as you remove any tracked
  path") rather than shown; the hint names it. Flagged `destructive` (deletes the cached clone).
- 15.06 scenarios: icons (submodule), utils (subtree), fonts (subtree). A third distinct outcome (plain copy)
  was not used because a subtree add also produces plain tracked files and the two cannot be told apart.
- 15.09: "send only recent commits" is checked by `usedCommand` with a `..` range plus the offline clone being
  level with `project`; the bundle's actual content is not inspected.
- 15.11 shows `git push origin refs/notes/commits` although `push` is in `requires`: pushing the notes ref is
  the lesson's own content.
- 15.12 shows the three `git config` keys although `config-settings` is in `requires`: the key names are the
  lesson's content and cannot be recalled from earlier lessons. The tamper step is an amend (new unsigned
  object); the tag keeps verifying because it points at the original commit.
- 15.14 setup adds a commit on `main` after branching; without it octopus fast-forwards to the first branch and
  the merge has three parents. `clash` is required to be unmerged at the end (it is the demonstration).
- 15.15: the rename similarity is 20% (`R020`), so the default 50% fails with modify/delete and
  `-X find-renames=20%` succeeds. `rename-threshold` is accepted as a synonym.
- 15.17: `feature-v2` is built in setup by rebasing and recommitting with reworded messages; the third commit's
  content is edited so `git cherry` shows `+` for it. `commit` answers use `@mark:f3` / `@mark:v1`.
- 15.18 (boss): the archive must contain the library's files, which makes subtree the working choice
  (a submodule's files are not archived); the text says so. The key pair is pre-generated in `../keys`; the
  learner writes the allowed-signers file and the config. Patches are checked only by count (3) and
  `apply --check` against the colleague's clone.

## Alternative approaches tried (all pass)

15.01 (absolute submodule URL), 15.02 (`submodule init` + `update`; plain clone then `update --init`),
15.03 (change pushed from a separate lib clone, then `submodule update --remote`), 15.04 (`deinit -f`, `rm -f`),
15.05 (named remote `lib` instead of a path), 15.07 (`-3` on `feature`, combined `--check --stat`),
15.08 (plain `am` fails, `--abort`, then `am -3`), 15.09 (`main v1.0` instead of `--all`, `HEAD~1..main`,
fetch + merge FETCH_HEAD), 15.10 (archive in the lesson folder, attribute without trailing slash),
15.12 (private key as `signingkey`, amend with a new message), 15.13 (`--strategy=ours`),
15.15 (`-Xfind-renames=20%`), 15.16 (`commit-graph write --reachable`, `--task loose-objects` with a space),
15.18 (named remote, `format-patch -3 search`, bundle `--all`).

## Review fixes applied (see `_reviews/section-15.md`)

- 15.01: commit goal checks `.gitmodules` and the gitlink in HEAD (two-commit approach passes).
- 15.03: goals no longer pass at start (`refNotAt main @mark:app-tip`); new question on `submodule update --remote`.
- 15.04: "removal is committed" needs a new commit; text says to run deinit first.
- 15.05, 15.06: subtree goals also require the `git-subtree-dir: vendor/<name>` trailer (hand copies fail);
  15.06 text says to commit the submodule before `subtree add`; fonts "every plain clone".
- 15.07: apply-check glob skips a cover letter; "subject line".
- 15.08: `operation: null`; text mentions the `AM` prompt and when `-3` can rebuild the pre-image.
- 15.09: offline must be cloned from `full.bundle` and updated by fetch/pull from a `.bundle`; range regex accepts
  `A ^B` and `git -C`; text no longer claims `v1.0..main` carries only missing commits.
- 15.10: attributes read from `v2.0`; regex accepts `/tests`, `tests/`, `tests/**`; archive check looks for files
  under tests/notes (an empty dir entry from `tests/**` is fine); no "byte-identical" claim.
- 15.12: warning that `ssh-keygen` without `-f` targets the real `~/.ssh` (OpenSSH uses the passwd home, not
  `$HOME`); `keys/` excluded; tamper goal needs the tag; step 6 shows `echo $?` and `%G?`; OpenSSH 8.2 noted.
- 15.13: regex accepts `-sours`.
- 15.14: octopus text corrected: only the last branch may leave hand-resolvable conflicts; an earlier conflict
  refuses outright (nothing to abort).
- 15.15: `ort` default since 2.34. 15.16: 91 objects, `maintenance stop` as the undo, guard counts any exit code,
  systemd timers. `minGit` stays "2.29" (2.30 for loose-objects could not be confirmed from release notes; Canopy
  requires 2.32 anyway). 15.17: patch-id wording. 15.18: tag must verify with the release key's fingerprint;
  archive check tolerates an empty tests/ entry.
