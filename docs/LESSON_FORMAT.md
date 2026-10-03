# Lesson Format (formatVersion 1)

The contract between lesson content and the app. Every lesson in `LESSONS.md` becomes one folder under `/lessons`. The app, the validator and the content-update bundle all read this format, so follow it exactly.

## 1. Layout

```
/lessons
  manifest.yaml              formatVersion, contentVersion
  sections.yaml              section metadata (id, slug, title, level, summary)
  /_lib/setup-lib.sh         helpers sourced by every setup and action script
  /1.01/                     one folder per lesson, named by lesson id
    lesson.yaml              metadata (required)
    content.md               text the learner reads (required)
    setup.sh                 builds the starting repos (required, may be nearly empty)
    goal.json                goals and questions (required)
    solution.yaml            reference solution, used by the test harness (required)
    /actions/*.sh            optional scripted events (teammate pushes, etc.)
    /files/*                 optional fixture files copied by setup.sh
```

## 2. lesson.yaml

```yaml
id: "2.03"                       # string, matches folder name and LESSONS.md
section: 2
title: Staged vs changed-after-staging
kind: practice                   # practice | concept | boss
teaches: [concept-three-areas]   # skill ids from LESSONS.md ("concept X" -> concept-X)
requires: [add, commit, status]  # must all be taught by lessons with a lower id
flags: []                        # any of: destructive, guided, optional
minGit: "2.23"                   # optional; lesson shows a "needs newer git" notice below this
tools: []                        # optional preflight: gpg, ssh-keygen, git-subtree
identity: true                   # default true: app ensures user.name/email exist in the app
                                 # global config before setup. false only for lessons that
                                 # teach setting identity (1.04) or need it unset.
repo: project                    # primary repo (graph + default for checks), relative to LESSON_ROOT
start: project                   # terminal working directory, relative to LESSON_ROOT ("." allowed)
repos:                           # optional; every repo the graph can switch between
  - { path: work, label: Your clone }
  - { path: origin.git, label: origin }
  - { path: teammate, label: Teammate }
panels: [three-areas]            # optional: three-areas (strip under the graph), files (opens the Files drawer), inside-git (Inside .git tab)
actions:                         # optional buttons in the lesson panel
  - { id: teammate-push, label: "Teammate pushes a fix", script: actions/teammate-push.sh }
hints:                           # optional, shown one at a time on request, no penalty
  - "Look at the two sections of `git status`."
  - "Stage the file again to put the newest version in staging."
```

Rules:
- `requires` lists only skills taught in **earlier** lessons. Boss lessons may list `requires: [section]` meaning "all of this section"; the validator expands it.
- Lessons with no repo (pure terminal lessons like 1.01) set `repo: null` and `start: "."`.

## 3. content.md

Plain Markdown, rendered in the lesson panel. Structure:

```markdown
One or two short paragraphs explaining the idea. Plain English, short sentences.

## Try it
1. Steps the learner performs. New commands for this lesson are shown in `code`.
2. Skills from `requires` are described by intent ("make a commit"), not by command.

## What just happened
Short explanation tying the result to the graph or panels. Optional.
```

The lesson panel splits on these headings: text before `## Try it` is the Read tab, `## Try it` to `## What just happened` is the Try it tab, and `## What just happened` is shown as a recap once the lesson is complete. `## Try it` is required, except in boss lessons, which use `## Your tasks` and show everything on one Challenge tab.

Writing rules:
- Action buttons (from `actions` in lesson.yaml) appear inline in the step that names their label in **bold**, so bold the label in that step.
- One new idea per lesson. Short. A learner should read it in under two minutes.
- **Recall rule:** never show the command for a skill in `requires`, unless the lesson has the `guided` flag. Describe the intent instead.
- Destructive lessons start with one sentence saying what will be lost; the app adds its own banner.
- Do not repeat the goal checklist in prose; the app shows goals from `goal.json` next to the text.
- Refer to UI as: "the terminal", "the graph", "the files panel", "the three-area panel", "the lesson panel".
- No emojis, no marketing tone, no "simply"/"just"/"easy".

## 4. setup.sh

Bash, runs non-interactively before the lesson starts (and on "Reset lesson").

```bash
#!/usr/bin/env bash
source "$CANOPY_LIB/setup-lib.sh"

new_repo project
commit_file README.md "# Notes" "Add README"
write todo.txt "buy milk"
git add todo.txt
write todo.txt "buy milk" "buy bread"
```

Environment given by the runner:
| Var | Meaning |
|---|---|
| `LESSON_ROOT` | empty folder for this attempt; the script starts with `cwd = LESSON_ROOT` |
| `LESSON_DIR` | the lesson's source folder (read fixtures from `$LESSON_DIR/files`) |
| `CANOPY_LIB` | folder holding `setup-lib.sh` |
| `CANOPY_STATE` | private state folder (marks, clock), kept outside LESSON_ROOT |
| `GIT_CONFIG_GLOBAL` | a throwaway config for setup only (the learner's app config is not touched) |

Setup runs with a fixed identity and fixed, advancing dates, so starting repos are identical for every learner. The learner's own shell does **not** get these: their commits use their own identity and the real time. Never check the hash of a commit the learner creates; check structure, messages and content.

### setup-lib.sh helpers

| Helper | Effect |
|---|---|
| `new_repo <dir>` | `git init -b main` in `$LESSON_ROOT/<dir>` and `cd` into it |
| `new_bare <dir>` | bare repo with `main` as default branch |
| `clone_repo <src> <dst>` | clone, then `cd` into dst |
| `goto <dir>` | `cd "$LESSON_ROOT/<dir>"` |
| `write <path> <line>...` | write lines to a file (creates folders) |
| `append <path> <line>...` | append lines |
| `commit <message>` | stage everything (`add -A`), advance the clock, commit |
| `commit_file <path> <content> <message>` | write + commit |
| `as <name>` | switch author: `alex` (default), `sam`, `priya`, `jordan`, or `"Full Name <mail>"` |
| `tick [seconds]` | advance the clock (default 1 hour); `commit` calls it |
| `at <date>` | set the clock to an ISO date, e.g. `at 2024-03-01T09:00` |
| `mark <name> [rev]` | remember a commit id for checks (`@mark:name`) |
| `local_config <key> <value>` | set config in the current repo |

Anything else is plain git. Keep setups small: only the history the lesson needs.

## 5. goal.json

```json
{
  "questions": [
    {
      "id": "which-version",
      "prompt": "Which version of todo.txt is staged right now?",
      "type": "choice",
      "options": ["Only \"buy milk\"", "\"buy milk\" and \"buy bread\""],
      "answer": 0
    }
  ],
  "goals": [
    { "label": "Answer the question", "check": { "type": "answer", "question": "which-version" } },
    { "label": "Commit the newest version of todo.txt",
      "check": { "type": "fileContent", "source": "HEAD", "path": "todo.txt", "contains": "buy bread" } },
    { "label": "Leave the working tree clean", "check": { "type": "status", "clean": true } }
  ]
}
```

The lesson is complete when **every goal passes**. Goals are re-checked after each terminal command, each editor save and each answer. A goal with `"sticky": true` stays passed once it passes (use for intermediate milestones, e.g. "visit the old commit" before "come back to main").

### Common check fields
- `repo`: repo path relative to `LESSON_ROOT`; default is `lesson.yaml` `repo`.
- Revisions (`rev`, `target`, `source`, ...) are any git revision (`main`, `HEAD~2`, `v1.0^{}`, `origin/main`) or `@mark:<name>` from setup.

### Check types

| type | fields | passes when |
|---|---|---|
| `all` / `any` | `checks: [...]` | every / at least one sub-check passes |
| `not` | `check` | the sub-check fails |
| `repoExists` | `path`, `bare?` | a git repo exists there |
| `pathExists` / `pathAbsent` | `path` (relative to LESSON_ROOT) | file or folder on disk exists / does not |
| `cwd` | `path` | terminal cwd equals `LESSON_ROOT/path` |
| `fileContent` | `path`, `source` (`worktree` default, `index`, or a revision), one of `equals`, `contains`, `notContains`, `matches` (regex), `lines` (exact list) | content matches |
| `fileInRev` | `path`, `rev`, `present` (bool) | file exists / not in that commit's tree |
| `status` | any of `clean: true`, `staged`, `modified`, `untracked`, `conflicted`, `ignored` (path lists), `exact` (bool, default false: lists must be included; true: lists must match exactly) | working tree state matches |
| `branchExists` | `name`, `present` (default true) | local branch exists / not |
| `currentBranch` | `name` (or `null` for detached HEAD) | HEAD is on that branch |
| `refAt` | `ref`, `target` | `ref` resolves to the same commit as `target` |
| `refNotAt` | `ref`, `target` | resolves to a different commit |
| `isAncestor` | `ancestor`, `descendant` | `merge-base --is-ancestor` succeeds |
| `commitCount` | `range` (e.g. `main`, `main..feature`, or extra rev-list arguments such as `main --merges`), one of `equals`, `min`, `max` | `rev-list --count <range>` matches (range is split on spaces) |
| `commitMessage` | `rev`, one of `equals`, `contains`, `matches` | message (full) matches |
| `commitParents` | `rev`, `count` | number of parents |
| `commitAuthor` | `rev`, `name?`, `email?` | author matches |
| `commitChanges` | `rev`, `paths` (list), `exact` (bool) | the commit touches these paths |
| `tag` | `name`, `present?`, `annotated?`, `target?`, `message?` | tag state |
| `remote` | `name`, `url?` (`contains` match), `present?` | remote configured |
| `upstream` | `branch`, `upstream` (e.g. `origin/main`) | tracking configured |
| `config` | `key`, `value?`, `scope?` (`local`, `global`, `worktree`), `present?` | config value |
| `operation` | `value`: `null`, `merge`, `rebase`, `am`, `cherry-pick`, `revert`, `bisect` | in-progress operation |
| `stash` | `count?`, `messageContains?` (applies to `stash@{0}`) | stash list |
| `worktreeCount` | `equals` | number of worktrees incl. main one |
| `reachable` | `rev`, `from` (default `--all` refs) | commit reachable from any ref |
| `usedCommand` | `matches` (regex against the typed command line), `exitCode?` (default 0; `null` = any), `last?` (default false) | the learner ran such a command in this attempt; with `last: true`, it must be the most recent command. Combine `last` with a state check inside a sticky `all` to require "ran X while the repo was in state Y". |
| `answer` | `question` | that question was answered correctly |
| `shell` | `script`, `repo?` | escape hatch: script exits 0. Must be read-only. Use only when nothing above fits. |

### Question types

| type | fields | correct when |
|---|---|---|
| `choice` | `options`, `answer` (index) or `answers` (list, for multi-select) | selection matches |
| `text` | `accept` (list), `caseSensitive?` (default false) | trimmed answer equals one accepted value |
| `number` | `answer` | integer equals |
| `commit` | `answer`: a revision or `@mark:name`, `repo?`, `allowRefs?` (default false) | answer is a hash prefix (min 4 chars) of that commit; with `allowRefs: true`, names like `main` or `HEAD~2` are accepted too. Solutions may answer with `@mark:name`. |

Wrong answers are never penalised; the learner can retry.

## 6. solution.yaml

Used by the test harness (and CI) to prove the lesson works: run setup, feed `commands` line by line into the same shell the learner gets, submit `answers`, then every goal must pass.

```yaml
commands: |
  git status
  git add todo.txt
  git commit -m "Add bread"
answers:
  which-version: 0
```

- One shell command per line, exactly as a learner would type it. Comment lines are ignored.
- `#action <id>` runs a lesson action at that point.
- Editors: the harness sets `GIT_EDITOR=true`. When a command needs an editor result, set it inline, e.g. `GIT_SEQUENCE_EDITOR="sed -i '2s/^pick/squash/'" git rebase -i HEAD~3` or `git commit -m ...`.

## 7. actions

Scripts in `actions/` simulate other people (teammate pushes, a force-push mistake). They source `setup-lib.sh`, run real git, and are readable by the learner from the lesson panel. Each action may run more than once; write them so a second run does something sensible or nothing.

## 8. sections.yaml

```yaml
- id: 1
  slug: orientation
  title: Orientation
  level: beginner          # beginner | core | intermediate | advanced
  summary: Terminal basics, what a repo is, and your first look at git.
```

## 9. Versioning and content updates

`manifest.yaml` holds `formatVersion` (this document, integer) and `contentVersion` (date-based, e.g. `2026.10.03.1`). The app only installs a content bundle whose `formatVersion` it supports. Lesson ids are permanent: never renumber a published lesson, because progress is keyed on the id. To retire a lesson, add `flags: [retired]`.
