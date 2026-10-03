//! Build-time checks for lesson content: prerequisite order and file shape.

use std::collections::{HashMap, HashSet};
use std::fmt;

use regex::Regex;

use crate::catalog::{Catalog, Lesson};
use crate::goal::{Check, CheckKind};

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Level {
    Error,
    Warning,
}

#[derive(Debug, Clone)]
pub struct Issue {
    pub lesson: String,
    pub level: Level,
    pub message: String,
}

impl fmt::Display for Issue {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        let lvl = match self.level {
            Level::Error => "error",
            Level::Warning => "warning",
        };
        write!(f, "{lvl}: {}: {}", self.lesson, self.message)
    }
}

/// Skill id -> the lesson that teaches it (first one wins).
pub fn skill_owners(catalog: &Catalog) -> HashMap<String, String> {
    let mut owners = HashMap::new();
    for l in &catalog.lessons {
        for s in &l.meta.teaches {
            owners.entry(s.clone()).or_insert_with(|| l.meta.id.clone());
        }
    }
    owners
}

/// Lessons a learner is recommended to complete before `lesson`: the lessons
/// that teach its required skills. Boss `section` requirements are ignored.
pub fn recommended_before(catalog: &Catalog, lesson: &Lesson) -> Vec<String> {
    let owners = skill_owners(catalog);
    let mut out: Vec<String> = Vec::new();
    for r in &lesson.meta.requires {
        if let Some(owner) = owners.get(r) {
            if owner != &lesson.meta.id && !out.contains(owner) {
                out.push(owner.clone());
            }
        }
    }
    out.sort_by(|a, b| crate::catalog::compare_ids(a, b));
    out
}

pub fn validate(catalog: &Catalog) -> Vec<Issue> {
    let mut issues: Vec<Issue> = catalog
        .errors
        .iter()
        .map(|(lesson, message)| Issue { lesson: lesson.clone(), level: Level::Error, message: message.clone() })
        .collect();
    let mut taught: HashSet<String> = HashSet::new();
    let mut teacher: HashMap<String, String> = HashMap::new();
    let section_ids: HashSet<u32> = catalog.sections.iter().map(|s| s.id).collect();

    for lesson in &catalog.lessons {
        let id = lesson.meta.id.clone();
        let mut push = |level: Level, message: String| issues.push(Issue { lesson: id.clone(), level, message });

        if !section_ids.contains(&lesson.meta.section) {
            push(Level::Error, format!("section {} is not in sections.yaml", lesson.meta.section));
        }
        if crate::catalog::parse_id(&id).map(|(s, _)| s) != Some(lesson.meta.section) {
            push(Level::Error, "id does not start with its section number".into());
        }
        for r in &lesson.meta.requires {
            if r == "section" {
                continue;
            }
            if !taught.contains(r) {
                let later = catalog
                    .lessons
                    .iter()
                    .find(|l| l.meta.teaches.contains(r))
                    .map(|l| format!(" (taught later in {})", l.meta.id))
                    .unwrap_or_else(|| " (never taught)".into());
                push(Level::Error, format!("requires `{r}` before it is taught{later}"));
            }
        }
        for t in &lesson.meta.teaches {
            if let Some(prev) = teacher.get(t) {
                push(Level::Warning, format!("teaches `{t}`, already taught in {prev}"));
            }
        }
        for flag in &lesson.meta.flags {
            if !["destructive", "guided", "optional", "retired"].contains(&flag.as_str()) {
                push(Level::Error, format!("unknown flag `{flag}`"));
            }
        }
        for f in ["content.md", "setup.sh", "goal.json", "solution.yaml"] {
            if !lesson.dir.join(f).exists() {
                push(Level::Error, format!("missing {f}"));
            }
        }
        for a in &lesson.meta.actions {
            if !lesson.dir.join(&a.script).exists() {
                push(Level::Error, format!("action {} script {} missing", a.id, a.script));
            }
        }
        if lesson.meta.hints.is_empty() && lesson.meta.kind != crate::catalog::LessonKind::Boss {
            push(Level::Warning, "no hints".into());
        }

        match lesson.goal() {
            Err(e) => push(Level::Error, format!("{e:#}")),
            Ok(goal) => {
                if goal.goals.is_empty() {
                    push(Level::Error, "goal.json has no goals".into());
                }
                let qids: HashSet<&str> = goal.questions.iter().map(|q| q.id.as_str()).collect();
                if qids.len() != goal.questions.len() {
                    push(Level::Error, "duplicate question ids".into());
                }
                let mut used = HashSet::new();
                for g in &goal.goals {
                    walk(&g.check, &mut |c| match &c.kind {
                        CheckKind::Answer { question } => {
                            used.insert(question.clone());
                            if !qids.contains(question.as_str()) {
                                push(Level::Error, format!("goal answers unknown question `{question}`"));
                            }
                        }
                        CheckKind::UsedCommand { matches, .. } => regex_ok(matches, &mut push),
                        CheckKind::FileContent { matches: Some(m), .. } | CheckKind::CommitMessage { matches: Some(m), .. } => {
                            regex_ok(m, &mut push)
                        }
                        CheckKind::FileContent { equals: None, contains: None, not_contains: None, matches: None, lines: None, .. } => {
                            push(Level::Error, "fileContent check has no matcher".into())
                        }
                        CheckKind::CommitCount { equals: None, min: None, max: None, .. } => {
                            push(Level::Error, "commitCount check has no equals/min/max".into())
                        }
                        CheckKind::Shell { .. } => push(Level::Warning, "uses a shell check".into()),
                        _ => {}
                    });
                }
                for q in &goal.questions {
                    if !used.contains(&q.id) {
                        push(Level::Warning, format!("question `{}` is not required by any goal", q.id));
                    }
                }
                match lesson.solution() {
                    Err(e) => push(Level::Error, format!("{e:#}")),
                    Ok(sol) => {
                        for q in &goal.questions {
                            if !sol.answers.contains_key(&q.id) {
                                push(Level::Error, format!("solution.yaml has no answer for `{}`", q.id));
                            }
                        }
                        for line in sol.commands.lines() {
                            if let Some(a) = line.trim().strip_prefix("#action ") {
                                if !lesson.meta.actions.iter().any(|x| x.id == a.trim()) {
                                    push(Level::Error, format!("solution runs unknown action `{}`", a.trim()));
                                }
                            }
                        }
                    }
                }
            }
        }

        for t in &lesson.meta.teaches {
            taught.insert(t.clone());
            teacher.entry(t.clone()).or_insert_with(|| lesson.meta.id.clone());
        }
    }
    issues
}

fn regex_ok(pattern: &str, push: &mut impl FnMut(Level, String)) {
    if let Err(e) = Regex::new(pattern) {
        push(Level::Error, format!("bad regex {pattern:?}: {e}"));
    }
}

fn walk(check: &Check, f: &mut impl FnMut(&Check)) {
    f(check);
    match &check.kind {
        CheckKind::All { checks } | CheckKind::Any { checks } => checks.iter().for_each(|c| walk(c, f)),
        CheckKind::Not { check } => walk(check, f),
        _ => {}
    }
}
