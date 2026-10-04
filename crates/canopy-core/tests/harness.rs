//! End-to-end: build a tiny catalog, run the harness, check the goals.

use std::fs;
use std::path::Path;

use canopy_core::catalog::Catalog;
use canopy_core::env::{learner_env, AppPaths, EditorMode};
use canopy_core::git::Git;
use canopy_core::harness::test_lesson;
use canopy_core::snapshot;

fn lib_dir() -> std::path::PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../../lessons/_lib")
}

fn write(path: &Path, body: &str) {
    fs::create_dir_all(path.parent().unwrap()).unwrap();
    fs::write(path, body).unwrap();
}

fn catalog_with(id: &str, files: &[(&str, &str)]) -> (tempfile::TempDir, Catalog) {
    let dir = tempfile::tempdir().unwrap();
    let root = dir.path();
    write(
        &root.join("manifest.yaml"),
        "formatVersion: 1\ncontentVersion: test\n",
    );
    write(
        &root.join("sections.yaml"),
        "- { id: 9, slug: t, title: T, level: core, summary: s }\n",
    );
    std::os::unix::fs::symlink(lib_dir(), root.join("_lib")).unwrap();
    for (name, body) in files {
        write(&root.join(id).join(name), body);
    }
    let cat = Catalog::load(root).unwrap();
    (dir, cat)
}

const SETUP: &str = r#"source "$CANOPY_LIB/setup-lib.sh"
new_bare origin.git
new_repo seed
commit_file a.txt "one" "First"
mark first
commit_file a.txt "two" "Second"
git tag -a v1 -m "Release one"
git push -q ../origin.git main v1
clone_repo origin.git work
as sam
git switch -q -c feature
commit_file b.txt "bee" "Add b"
mark feature-tip
git switch -q main
write notes.txt "draft"
"#;

const GOAL: &str = r#"{
  "questions": [
    { "id": "first", "prompt": "Which commit came first?", "type": "commit", "answer": "@mark:first" },
    { "id": "count", "prompt": "How many commits on main?", "type": "number", "answer": 3 },
    { "id": "pick", "prompt": "Pick", "type": "choice", "options": ["a","b","c"], "answers": [0,2] },
    { "id": "word", "prompt": "Word", "type": "text", "accept": ["Merge"] }
  ],
  "goals": [
    { "label": "answers", "check": { "type": "all", "checks": [
      { "type": "answer", "question": "first" }, { "type": "answer", "question": "count" },
      { "type": "answer", "question": "pick" }, { "type": "answer", "question": "word" } ] } },
    { "label": "merge commit", "check": { "type": "commitParents", "rev": "main", "count": 2 } },
    { "label": "feature merged", "check": { "type": "isAncestor", "ancestor": "@mark:feature-tip", "descendant": "main" } },
    { "label": "count", "check": { "type": "commitCount", "range": "@mark:first..main", "equals": 3 } },
    { "label": "message", "check": { "type": "commitMessage", "rev": "main", "matches": "^Merge branch 'feature'" } },
    { "label": "stash", "check": { "type": "stash", "count": 1, "messageContains": "notes" } },
    { "label": "clean", "check": { "type": "status", "clean": true } },
    { "label": "tag", "check": { "type": "tag", "name": "v1", "annotated": true, "target": "main~1", "message": "Release one" } },
    { "label": "lightweight", "check": { "type": "tag", "name": "v2", "annotated": false, "target": "main" } },
    { "label": "pushed", "check": { "repo": "origin.git", "type": "refAt", "ref": "main", "target": "refs/heads/main" } },
    { "label": "origin has merge", "check": { "repo": "origin.git", "type": "commitParents", "rev": "main", "count": 2 } },
    { "label": "upstream", "check": { "type": "upstream", "branch": "main", "upstream": "origin/main" } },
    { "label": "branch gone", "check": { "type": "branchExists", "name": "feature", "present": false } },
    { "label": "on main", "check": { "type": "currentBranch", "name": "main" } },
    { "label": "file", "check": { "type": "fileContent", "source": "HEAD", "path": "b.txt", "lines": ["bee"] } },
    { "label": "file in rev", "check": { "type": "fileInRev", "rev": "@mark:first", "path": "b.txt", "present": false } },
    { "label": "used merge", "check": { "type": "usedCommand", "matches": "^git merge\\b" } },
    { "label": "failed cmd", "check": { "type": "usedCommand", "matches": "^git switch nope", "exitCode": 128 } },
    { "label": "no op", "check": { "type": "operation", "value": null } },
    { "label": "reachable", "check": { "type": "reachable", "rev": "@mark:feature-tip" } },
    { "label": "remote", "check": { "type": "remote", "name": "origin", "url": "origin.git" } },
    { "label": "config", "check": { "type": "config", "key": "user.name", "value": "Canopy Learner", "scope": "system" } },
    { "label": "cwd", "check": { "type": "cwd", "path": "work" } },
    { "label": "not", "check": { "type": "not", "check": { "type": "pathExists", "path": "work/notes.txt" } } },
    { "label": "sticky", "sticky": true, "check": { "type": "pathExists", "path": "work/notes.txt" } },
    { "label": "sticky mid", "sticky": true, "check": { "type": "all", "checks": [
      { "type": "stash", "count": 1 }, { "type": "branchExists", "name": "feature" } ] } },
    { "label": "author", "check": { "type": "commitAuthor", "rev": "@mark:feature-tip", "name": "Sam Chen" } },
    { "label": "changes", "check": { "type": "commitChanges", "rev": "@mark:feature-tip", "paths": ["b.txt"], "exact": true } }
  ]
}"#;

const SOLUTION: &str = r#"commands: |
  git stash push -u -m "notes draft"
  git switch nope
  git merge --no-ff --no-edit feature
  git branch -d feature
  git tag v2
  git push -q
answers:
  first: "@mark:first"
  count: "3"
  pick: [2, 0]
  word: " merge "
"#;

#[test]
fn harness_runs_solution_and_checks_goals() {
    let lesson = "9.01";
    let (_dir, cat) = catalog_with(
        lesson,
        &[
            ("lesson.yaml", "id: \"9.01\"\nsection: 9\ntitle: T\nkind: practice\nrepo: work\nstart: work\nhints: [h]\n"),
            ("content.md", "x"),
            ("setup.sh", SETUP),
            ("goal.json", GOAL),
            ("solution.yaml", SOLUTION),
        ],
    );
    let issues = canopy_core::validate::validate(&cat);
    assert!(
        issues
            .iter()
            .all(|i| i.level != canopy_core::validate::Level::Error),
        "{issues:?}"
    );

    let data = tempfile::tempdir().unwrap();
    let report = test_lesson(&cat, cat.lesson(lesson).unwrap(), data.path()).unwrap();
    let failed: Vec<_> = report.goals.iter().filter(|g| !g.passed).collect();
    assert!(
        failed.is_empty(),
        "failed: {failed:#?}\n{}",
        report.transcript
    );
    assert!(
        report.wrong_answers.is_empty(),
        "{:?}",
        report.wrong_answers
    );
    assert!(report.passed());

    // Snapshot of the finished repo.
    let paths = AppPaths::new(data.path());
    let git = Git::new(
        paths.lesson_root(lesson).join("work"),
        learner_env(&paths, lesson, EditorMode::NoOp),
    );
    let snap = snapshot::take(&git).unwrap();
    assert_eq!(snap.head.branch.as_deref(), Some("main"));
    assert_eq!(snap.stashes.len(), 1);
    assert!(snap.refs.iter().any(|r| r.name == "v1" && r.annotated));
    assert!(snap.refs.iter().any(|r| r.name == "origin/main"));
    assert_eq!(
        snap.commits.iter().filter(|c| c.parents.len() == 2).count(),
        1
    );
    assert!(snap.commits.iter().all(|c| c.reachable));
}

#[test]
fn identical_setup_gives_identical_hashes() {
    let (_dir, cat) = catalog_with(
        "9.01",
        &[
            (
                "lesson.yaml",
                "id: \"9.01\"\nsection: 9\ntitle: T\nkind: practice\nrepo: work\nstart: work\n",
            ),
            ("setup.sh", SETUP),
        ],
    );
    let lesson = cat.lesson("9.01").unwrap();
    let ids: Vec<String> = (0..2)
        .map(|_| {
            let data = tempfile::tempdir().unwrap();
            let paths = AppPaths::new(data.path());
            let attempt = canopy_core::runner::prepare(&paths, &cat.lib_dir(), lesson).unwrap();
            canopy_core::runner::read_marks(&attempt.state).unwrap()["feature-tip"].clone()
        })
        .collect();
    assert_eq!(ids[0], ids[1]);
}

#[test]
fn snapshot_survives_a_broken_ref() {
    let dir = tempfile::tempdir().unwrap();
    let paths = AppPaths::new(dir.path());
    paths.ensure().unwrap();
    let repo = dir.path().join("workspace/r");
    fs::create_dir_all(&repo).unwrap();
    let git = Git::new(&repo, learner_env(&paths, "r", EditorMode::NoOp));
    git.run(&["init", "-q", "-b", "main"]).unwrap();
    git.run(&[
        "-c",
        "user.name=a",
        "-c",
        "user.email=a@b",
        "commit",
        "-q",
        "--allow-empty",
        "-m",
        "one",
    ])
    .unwrap();
    fs::write(
        repo.join(".git/refs/heads/broken"),
        "1111111111111111111111111111111111111111\n",
    )
    .unwrap();
    let snap = snapshot::take(&git).unwrap();
    assert!(snap.refs.iter().any(|r| r.name == "main"));
    assert!(!snap.refs.iter().any(|r| r.name == "broken"));
    assert_eq!(snap.commits.len(), 1);
}

#[test]
fn identity_carries_between_lessons_but_not_into_identity_lessons() {
    use canopy_core::runner::{sync_profile, write_lesson_config};
    let (_dir, cat) = catalog_with(
        "9.01",
        &[(
            "lesson.yaml",
            "id: \"9.01\"\nsection: 9\ntitle: T\nkind: practice\n",
        )],
    );
    let lesson = cat.lesson("9.01").unwrap().clone();
    let data = tempfile::tempdir().unwrap();
    let paths = AppPaths::new(data.path());
    paths.ensure().unwrap();

    // Lesson A: the learner sets a global identity.
    write_lesson_config(&paths, &lesson).unwrap();
    let git = Git::new(data.path(), learner_env(&paths, "9.01", EditorMode::NoOp));
    git.run(&["config", "--global", "user.name", "Ada"])
        .unwrap();
    git.run(&["config", "--global", "user.email", "ada@example.com"])
        .unwrap();
    git.run(&["config", "--global", "alias.st", "status"])
        .unwrap();
    sync_profile(&paths, "9.01").unwrap();

    // Lesson B gets the identity, but not the alias.
    let mut b = lesson.clone();
    b.meta.id = "9.02".into();
    write_lesson_config(&paths, &b).unwrap();
    let gb = Git::new(data.path(), learner_env(&paths, "9.02", EditorMode::NoOp));
    assert_eq!(
        gb.run(&["config", "--global", "user.name"]).unwrap().trim(),
        "Ada"
    );
    assert!(gb
        .try_run(&["config", "--global", "alias.st"])
        .unwrap()
        .is_none());
    assert!(
        gb.ok(&["config", "--global", "include.path", "x"]).unwrap(),
        "learner can set include.path"
    );

    // A lesson that teaches identity starts without it (system fallback only).
    let mut c = lesson.clone();
    c.meta.id = "9.03".into();
    c.meta.identity = false;
    write_lesson_config(&paths, &c).unwrap();
    let gc = Git::new(data.path(), learner_env(&paths, "9.03", EditorMode::NoOp));
    assert!(gc
        .try_run(&["config", "--global", "user.name"])
        .unwrap()
        .is_none());
    assert_eq!(
        gc.run(&["config", "user.name"]).unwrap().trim(),
        "Canopy Learner"
    );
}
