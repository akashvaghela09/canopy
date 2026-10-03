//! `canopy-lesson preview <id>`: set up a lesson (optionally run its solution)
//! and dump the data the UI needs, for the browser preview mode (src/dev/).

use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::Path;

use anyhow::Result;
use canopy_core::catalog::{Catalog, Lesson};
use canopy_core::check::{evaluate_goals, CheckContext};
use canopy_core::env::{learner_env, AppPaths, EditorMode};
use canopy_core::git::{is_repo_root, Git};
use canopy_core::harness::test_lesson;
use canopy_core::runner::{prepare, read_marks};
use canopy_core::snapshot;
use canopy_core::validate::recommended_before;
use serde_json::{json, Value};

pub fn preview(catalog: &Catalog, lesson: &Lesson, run_solution: bool) -> Result<Value> {
    let tmp = tempfile::Builder::new().prefix("canopy-preview-").tempdir()?;
    let paths = AppPaths::new(tmp.path());
    let id = &lesson.meta.id;
    let mut transcript = String::new();
    let mut answers: HashMap<String, Value> = HashMap::new();
    let mut commands = Vec::new();
    let mut harness_goals = None;
    if run_solution {
        let report = test_lesson(catalog, lesson, tmp.path())?;
        transcript = report.transcript;
        commands = report.commands;
        harness_goals = Some(report.goals);
        answers = lesson.solution()?.answers.into_iter().collect();
    } else {
        prepare(&paths, &catalog.lib_dir(), lesson)?;
    }
    let root = paths.lesson_root(id);
    let env = learner_env(&paths, id, EditorMode::NoOp);
    let marks = read_marks(&paths.lesson_state(id))?;
    let goal = lesson.goal()?;
    let start = root.join(&lesson.meta.start);
    let ctx = CheckContext {
        root: &root,
        default_repo: lesson.meta.repo.as_deref(),
        env: &env,
        marks: &marks,
        commands: &commands,
        questions: &goal.questions,
        answers: &answers,
        cwd: Some(&start),
    };
    // The harness checked goals after every command, so sticky goals are right there.
    let goals = harness_goals.unwrap_or_else(|| evaluate_goals(&goal, &ctx, &mut HashSet::new()));
    let complete = goals.iter().all(|g| g.passed);

    let mut repo_list: Vec<(String, String)> = lesson.meta.repos.iter().map(|r| (r.path.clone(), r.label.clone())).collect();
    if let Some(p) = &lesson.meta.repo {
        if !repo_list.iter().any(|(x, _)| x == p) {
            repo_list.insert(0, (p.clone(), p.clone()));
        }
    }
    let repos: Vec<Value> = repo_list
        .into_iter()
        .map(|(path, label)| {
            let dir = root.join(&path);
            let snap = match is_repo_root(&dir, &env) {
                Ok(Some(_)) => snapshot::take(&Git::new(&dir, env.clone())).ok(),
                _ => None,
            };
            json!({ "path": path, "label": label, "snapshot": snap, "error": null })
        })
        .collect();

    let mut files: HashMap<String, Vec<Value>> = HashMap::new();
    list_tree(&root, &root, &mut files)?;

    let catalog_view = json!({
        "manifest": catalog.manifest,
        "sections": catalog.sections,
        "lessons": catalog.lessons.iter().map(|l| {
            let mut v = serde_json::to_value(&l.meta).unwrap();
            v["recommended"] = json!(recommended_before(catalog, l));
            v["needsNewerGit"] = json!(false);
            v
        }).collect::<Vec<_>>(),
        "completed": {}, "skipped": [],
    });
    let lesson_view = json!({
        "meta": lesson.meta,
        "content": lesson.content()?,
        "questions": goal.questions.iter().map(|q| q.public()).collect::<Vec<_>>(),
        "goals": goal.goals.iter().map(|g| g.label.clone()).collect::<Vec<_>>(),
        "answers": answers.iter().map(|(k, v)| (k.clone(), json!({ "value": v, "correct": true }))).collect::<HashMap<_, _>>(),
        "actions": lesson.meta.actions.iter().map(|a| json!({
            "id": a.id, "label": a.label, "script": a.script,
            "source": fs::read_to_string(lesson.dir.join(&a.script)).unwrap_or_default(),
        })).collect::<Vec<_>>(),
        "recommended": recommended_before(catalog, lesson),
        "hasAttempt": true,
    });
    let update = json!({
        "lessonId": id,
        "goals": goals,
        "complete": complete,
        "justCompleted": complete,
        "cwd": lesson.meta.start.trim_start_matches("./").replace('.', ""),
        "repos": repos,
        "commands": commands.len(),
    });
    Ok(json!({ "catalog": catalog_view, "lesson": lesson_view, "update": update, "transcript": transcript, "files": files }))
}

fn list_tree(root: &Path, dir: &Path, out: &mut HashMap<String, Vec<Value>>) -> Result<()> {
    let rel = dir.strip_prefix(root)?.to_string_lossy().into_owned();
    let mut entries = Vec::new();
    for e in fs::read_dir(dir)?.flatten() {
        let name = e.file_name().to_string_lossy().into_owned();
        let meta = e.metadata()?;
        let path = e.path().strip_prefix(root)?.to_string_lossy().into_owned();
        entries.push(json!({ "name": name, "path": path, "dir": meta.is_dir(), "size": meta.len() }));
        if meta.is_dir() && name != ".git" {
            list_tree(root, &e.path(), out)?;
        }
    }
    entries.sort_by(|a, b| b["dir"].as_bool().cmp(&a["dir"].as_bool()).then(a["name"].as_str().cmp(&b["name"].as_str())));
    out.insert(rel, entries);
    Ok(())
}
