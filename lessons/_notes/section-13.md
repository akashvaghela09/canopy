# Notes: section 13 (Configuration and productivity)

Format gaps, deviations from `docs/LESSONS.md`, side effects on Canopy's own config, and verification notes.

## Fixture

- `_lib/fixtures/s13-history.sh`: the "garden" journal (7 commits on main by three authors, annotated tag
  `v0.2`, unmerged branch `seedlings`). Used by 13.03 and 13.04. Every other lesson builds its own repos.
- Lesson-local files: `13.08/files/pre-receive` (server hook installed into the lesson's `origin.git`),
  `13.11/files/canopy-merge` and `canopy-diff` (tiny tools copied into `project/tools/`).

## Global and system config: the per-lesson model

Each lesson attempt has its own `GIT_CONFIG_GLOBAL` (Canopy defaults plus the learner's saved name/email, unless
`identity: false`), its own `GIT_CONFIG_SYSTEM` (fallback identity "Canopy Learner") and its own `XDG_CONFIG_HOME`,
all in Canopy's private state folder and recreated on Reset. Aliases, excludes, includes and hooksPath set with
`--global` in one lesson do not reach any other lesson. Only a global `user.name`/`user.email` is copied back to the
profile (read with `--no-includes`, so identities that arrive through 13.06/13.15 includes are not saved).

- **13.01** still has the learner unset `core.abbrev` at system and global level, as `--unset` practice. Its first
  question asks about `init.defaultbranch` (always only in global); `user.name` can appear in both system and global.
- **13.02** accepts the settings at either level (the checks read effective values).
- **13.05** points `core.excludesFile` at a file inside the lesson folder.
- The learner shell's `GIT_EDITOR` wins over `core.editor`, so 13.02 only mentions `core.editor`.

## Format gaps

- **`scope: system`** for the `config` check is not in the format doc's list (`local`, `global`, `worktree`)
  but the checker passes any scope through as `--<scope>`, and `--system` honours `GIT_CONFIG_SYSTEM`. 13.01
  relies on it (set and unset at system level). If the scope list is ever enforced, 13.01 needs a `shell` check.
- **Absolute paths.** `gitdir:` patterns and include paths must be absolute; the lessons tell the learner to use
  `pwd`/`$PWD` from the lesson folder, always quoted (the macOS data folder contains a space). Tool commands in
  13.11 use relative paths instead (git runs them from the top of the working tree). There is no way to template the lesson root into content.md.
- **13.14** uses one `shell` check (validator warning) to prove that the root commit's blobs were fetched on
  demand: `git rev-list --objects --missing=print <root>` must print no `?` lines. No listed check can look at
  object presence. The missing-object count asked in the question (7) is deterministic because setup is.
- **Hook exit codes.** "The hook blocked the commit" is `usedCommand ^git commit` with `exitCode: 1` (13.07,
  13.15) and "the server rejected the push" is `usedCommand ^git push` with `exitCode: 1` (13.08). Both are
  sticky so later successful commits/pushes do not matter.
- **Reading stdin.** `git difftool`/`git mergetool` prompt before launching the tool; the lessons use `-y` (or
  `*.prompt false`) so the harness and the in-app terminal do not hang on a prompt.
- **Self-blocking hook.** A pre-commit hook that greps the staged diff for `FIXME` blocks the commit of its own
  script (the script contains the word). 13.07's hook therefore scans only staged `.js` changes
  (`git diff --cached -- '*.js'`), and 13.15 asks for the same rule.

## Deviations from LESSONS.md

- **13.01**: demonstrates all four levels on one key (`core.abbrev`, visible in `git log --oneline`), plus
  `--unset` and `--show-origin`. `config -e` is mentioned only (the harness cannot drive an editor session).
  The override "at a narrower level" is local/worktree; the local `pull.rebase` planted by setup is what gets
  unset. Worktree config needs `extensions.worktreeConfig=true` (a goal).
- **13.02**: `minGit: "2.37"` (push.autoSetupRemote). The five settings practised are pull.rebase,
  fetch.prune, push.autoSetupRemote, rebase.autoStash, merge.conflictstyle=zdiff3 (zdiff3 needs 2.35, covered
  by 2.37). `init.defaultBranch`, `core.editor` and `diff.algorithm` are mentioned, not set. Setup gives the
  clone an unpushed commit, so the branches diverge: a default pull refuses, a merge-pull makes a merge commit,
  and only rebase + autoStash reaches the checked state (main ends with "Add usage notes", no merges, README.md
  still modified). That goal is sticky because a later `commit -a` may sweep the README edit. The push goal
  requires a plain `git push` as the most recent command.
- **13.03**: the format is checked by regex on the typed command (`--pretty=format:`/`tformat:` or `--format=`;
  `%h`, `%ad`/`%as`, `%an`, `%d`, `%s` in that order; `--date=short` or `%as`) plus two questions only answerable from the output. "Filter by author" reuses `log-filter`.
- **13.04**: the shell alias is `wip` (`!git add -A && git commit -m wip`); its effect is checked by state
  (HEAD message `wip`, clean tree), and the `git config` command must set it to a `!` value. Aliases are global, as the curriculum intends.
- **13.05**: the global ignore file lives in the lesson folder (see above). `.git/info/exclude` is used in `app`
  only; `docs/scratch.md` must stay untracked to prove the exclude is local. Neither repo's `info/exclude` may
  hold `.swp`, so the editor patterns must come from the global file.
- **13.06**: the three config files are provided by setup (`conf/`), so the lesson is about includes only.
  `include.path` (unconditional) and `includeIf gitdir:` (conditional) are both practised.
- **13.07**: `commit-msg` is mentioned, not practised, to keep one idea. `core.hooksPath` is set to a
  project-local `hooks/` folder which is then committed. "The hook blocked" requires the most recent command to
  be a `git commit` that exited 1 with the FIXME staged (or with `-a`), so a commit with nothing staged does not count.
- **13.08**: `pre-receive` (server, installed by setup), `pre-push` and `post-merge` are practised;
  `prepare-commit-msg` is described only. The "fix the message" step uses `amend-message` (in `requires`) and is
  described by intent. The pre-push script skips deletions (all-zero sha).
- **13.09**: `git archive` is not run; `export-ignore` is checked with `git check-attr` (a shell check), so
  glob or per-path rules both pass. `git add --renormalize`
  is shown as a new command. The `-diff` behaviour is a question.
- **13.10**: the repeated conflict is "merge, undo (hard reset one back), merge again" rather than a rebase;
  `rebase-conflict` stays in `requires` as listed; `merge-undo-reset` is added. Undoing the merge is described by
  intent. A sticky goal proves rerere worked: right after a `git merge`, a merge is in progress and `config.txt`
  already reads `timeout = 90` without markers.
- **13.11**: tools are lesson scripts (`canopy-merge` writes a union merge via `git merge-file --union`). Goals
  also require `trustExitCode true` and `keepBackup false`. `canopy-merge` appends to `.git/canopy-merge.log`,
  which proves the tool resolved the conflict. Tool commands use relative paths (`tools/...`).
- **13.12**: `minGit: "2.25"`. The lesson runs `sparse-checkout init --cone` before `set` so that root files
  are kept on git < 2.37 (where cone mode is not the default); on newer git the call is redundant but harmless.
  `sparse-checkout add` (2.26) is not required; `set api docs` is used instead. `disable` is mentioned only.
- **13.13/13.14** clone with `"file://$PWD/origin.git"` (quoted; shown verbatim because `--depth`/`--filter` are the new
  syntax). 13.14's origin sets `uploadpack.allowFilter` and `uploadpack.allowAnySHA1InWant` in setup.
- **13.15 (boss)**: `minGit: "2.25"` (`clone --sparse`); on 2.25-2.36 a non-cone `set api` still gives the
  checked state. The reference solution and the alternative (`--no-checkout`
  + `init --cone`) both pass on 2.43.

## Verification

- `canopy-lesson validate`: 0 errors; the warnings in this section are the shell checks in 13.09 and 13.14.
- Reviewed in `lessons/_reviews/section-13.md`; the findings were applied and re-tested there.
- `canopy-lesson test 12 13`: 28/28 ok on git 2.43.0.
- Alternative solutions tried and passing: 13.01 (`--unset --system` order, no `--local` flag), 13.02
  (`--local` everywhere, `fetch --prune`, `pull --rebase`, stash around the branch), 13.03 (different
  separators and `--format=format:`), 13.05 (lowercase key, `$(pwd)`, `git -C`), 13.07 (`-n`, `cp`+`rm`,
  `./hooks`), 13.08 (reword via `rebase -i`, local branch + `--no-ff` merge), 13.09 (commit attributes first,
  renormalize second), 13.10 (`--local`, manual marker removal, `ORIG_HEAD`), 13.11 (`*.prompt false`,
  unquoted placeholders), 13.12 (`clone --sparse`, `sparse-checkout add`), 13.13 (`--depth=1`, `--deepen=3`),
  13.14 (`checkout` of the root commit instead of `show`), 13.15 (`core.hooksPath`, `--add` includes,
  `--no-checkout` clone + `init --cone` + `checkout`).
