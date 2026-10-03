//! Loading the lesson catalog from a content folder (docs/LESSON_FORMAT.md).

use std::cmp::Ordering;
use std::fs;
use std::path::{Path, PathBuf};

use anyhow::{bail, Context, Result};
use serde::{Deserialize, Serialize};

use crate::goal::GoalFile;

pub const FORMAT_VERSION: u32 = 1;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Manifest {
    pub format_version: u32,
    pub content_version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Section {
    pub id: u32,
    pub slug: String,
    pub title: String,
    pub level: String,
    pub summary: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RepoRef {
    pub path: String,
    pub label: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Action {
    pub id: String,
    pub label: String,
    pub script: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum LessonKind {
    Practice,
    Concept,
    Boss,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct LessonMeta {
    pub id: String,
    pub section: u32,
    pub title: String,
    pub kind: LessonKind,
    #[serde(default)]
    pub teaches: Vec<String>,
    #[serde(default)]
    pub requires: Vec<String>,
    #[serde(default)]
    pub flags: Vec<String>,
    #[serde(default)]
    pub min_git: Option<String>,
    #[serde(default)]
    pub tools: Vec<String>,
    #[serde(default = "default_true")]
    pub identity: bool,
    #[serde(default)]
    pub repo: Option<String>,
    #[serde(default = "default_start")]
    pub start: String,
    #[serde(default)]
    pub repos: Vec<RepoRef>,
    #[serde(default)]
    pub panels: Vec<String>,
    #[serde(default)]
    pub actions: Vec<Action>,
    #[serde(default)]
    pub hints: Vec<String>,
}

fn default_true() -> bool {
    true
}

fn default_start() -> String {
    ".".into()
}

impl LessonMeta {
    pub fn has_flag(&self, flag: &str) -> bool {
        self.flags.iter().any(|f| f == flag)
    }

    /// (section, number) parsed from an id like "9.09".
    pub fn order_key(&self) -> (u32, u32) {
        parse_id(&self.id).unwrap_or((u32::MAX, u32::MAX))
    }
}

pub fn parse_id(id: &str) -> Option<(u32, u32)> {
    let (a, b) = id.split_once('.')?;
    Some((a.parse().ok()?, b.parse().ok()?))
}

#[derive(Debug, Clone)]
pub struct Lesson {
    pub meta: LessonMeta,
    pub dir: PathBuf,
}

impl Lesson {
    pub fn content(&self) -> Result<String> {
        read(&self.dir.join("content.md"))
    }

    pub fn goal(&self) -> Result<GoalFile> {
        let text = read(&self.dir.join("goal.json"))?;
        serde_json::from_str(&text).with_context(|| format!("{}/goal.json", self.meta.id))
    }

    pub fn solution(&self) -> Result<Solution> {
        let text = read(&self.dir.join("solution.yaml"))?;
        serde_yaml_ng::from_str(&text).with_context(|| format!("{}/solution.yaml", self.meta.id))
    }
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Solution {
    #[serde(default)]
    pub commands: String,
    #[serde(default)]
    pub answers: std::collections::BTreeMap<String, serde_json::Value>,
}

#[derive(Debug, Clone)]
pub struct Catalog {
    pub root: PathBuf,
    pub manifest: Manifest,
    pub sections: Vec<Section>,
    /// Sorted by lesson id.
    pub lessons: Vec<Lesson>,
    /// Lesson folders that could not be loaded (skipped): (folder, error).
    pub errors: Vec<(String, String)>,
}

impl Catalog {
    pub fn load(root: &Path) -> Result<Catalog> {
        let root = &fs::canonicalize(root).with_context(|| format!("lessons folder {}", root.display()))?;
        let manifest: Manifest = serde_yaml_ng::from_str(&read(&root.join("manifest.yaml"))?)
            .context("manifest.yaml")?;
        if manifest.format_version != FORMAT_VERSION {
            bail!(
                "content formatVersion {} is not supported (expected {})",
                manifest.format_version,
                FORMAT_VERSION
            );
        }
        let sections: Vec<Section> =
            serde_yaml_ng::from_str(&read(&root.join("sections.yaml"))?).context("sections.yaml")?;

        let mut lessons = Vec::new();
        let mut errors = Vec::new();
        for entry in fs::read_dir(root).with_context(|| format!("reading {}", root.display()))? {
            let entry = entry?;
            let name = entry.file_name().to_string_lossy().into_owned();
            if parse_id(&name).is_none() || !entry.file_type()?.is_dir() {
                continue;
            }
            let dir = entry.path();
            let meta = read(&dir.join("lesson.yaml")).and_then(|text| {
                serde_yaml_ng::from_str::<LessonMeta>(&text).with_context(|| format!("{name}/lesson.yaml"))
            });
            match meta {
                Ok(meta) if meta.id == name => lessons.push(Lesson { meta, dir }),
                Ok(meta) => errors.push((name.clone(), format!("lesson.yaml has id {:?}", meta.id))),
                Err(e) => errors.push((name.clone(), format!("{e:#}"))),
            }
        }
        lessons.sort_by(|a, b| compare_ids(&a.meta.id, &b.meta.id));
        errors.sort_by(|a, b| compare_ids(&a.0, &b.0));
        Ok(Catalog { root: root.to_path_buf(), manifest, sections, lessons, errors })
    }

    pub fn lesson(&self, id: &str) -> Option<&Lesson> {
        self.lessons.iter().find(|l| l.meta.id == id)
    }

    pub fn lib_dir(&self) -> PathBuf {
        self.root.join("_lib")
    }
}

pub fn compare_ids(a: &str, b: &str) -> Ordering {
    match (parse_id(a), parse_id(b)) {
        (Some(x), Some(y)) => x.cmp(&y),
        _ => a.cmp(b),
    }
}

fn read(path: &Path) -> Result<String> {
    fs::read_to_string(path).with_context(|| format!("reading {}", path.display()))
}
