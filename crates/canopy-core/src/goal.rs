//! goal.json types: goals, checks and questions.

use serde::de::Error as _;
use serde::{Deserialize, Deserializer, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct GoalFile {
    #[serde(default)]
    pub questions: Vec<Question>,
    pub goals: Vec<Goal>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Goal {
    pub label: String,
    pub check: Check,
    #[serde(default)]
    pub sticky: bool,
}

/// A check plus the optional `repo` field shared by every check type.
#[derive(Debug, Clone, Serialize)]
pub struct Check {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub repo: Option<String>,
    #[serde(flatten)]
    pub kind: CheckKind,
}

impl<'de> Deserialize<'de> for Check {
    fn deserialize<D: Deserializer<'de>>(d: D) -> Result<Self, D::Error> {
        let mut map = serde_json::Map::deserialize(d)?;
        let repo = match map.remove("repo") {
            None | Some(Value::Null) => None,
            Some(Value::String(s)) => Some(s),
            Some(other) => {
                return Err(D::Error::custom(format!(
                    "repo must be a string, got {other}"
                )))
            }
        };
        let kind = CheckKind::deserialize(Value::Object(map)).map_err(D::Error::custom)?;
        Ok(Check { repo, kind })
    }
}

/// Text matchers shared by several checks. Every field that is set must hold.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TextMatch {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub equals: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub contains: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub not_contains: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub matches: Option<String>,
}

impl TextMatch {
    pub fn is_empty(&self) -> bool {
        self.equals.is_none()
            && self.contains.is_none()
            && self.not_contains.is_none()
            && self.matches.is_none()
    }
}

fn exit_zero() -> Option<i32> {
    Some(0)
}

fn yes() -> bool {
    true
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase", deny_unknown_fields)]
pub enum CheckKind {
    All {
        checks: Vec<Check>,
    },
    Any {
        checks: Vec<Check>,
    },
    Not {
        check: Box<Check>,
    },
    #[serde(rename_all = "camelCase")]
    RepoExists {
        path: String,
        #[serde(default)]
        bare: Option<bool>,
    },
    PathExists {
        path: String,
    },
    PathAbsent {
        path: String,
    },
    Cwd {
        path: String,
    },
    #[serde(rename_all = "camelCase")]
    FileContent {
        path: String,
        #[serde(default)]
        source: Option<String>,
        #[serde(default)]
        equals: Option<String>,
        #[serde(default)]
        contains: Option<String>,
        #[serde(default)]
        not_contains: Option<String>,
        #[serde(default)]
        matches: Option<String>,
        #[serde(default)]
        lines: Option<Vec<String>>,
    },
    FileInRev {
        path: String,
        rev: String,
        #[serde(default = "yes")]
        present: bool,
    },
    Status {
        #[serde(default)]
        clean: Option<bool>,
        #[serde(default)]
        staged: Option<Vec<String>>,
        #[serde(default)]
        modified: Option<Vec<String>>,
        #[serde(default)]
        untracked: Option<Vec<String>>,
        #[serde(default)]
        conflicted: Option<Vec<String>>,
        #[serde(default)]
        ignored: Option<Vec<String>>,
        #[serde(default)]
        exact: bool,
    },
    BranchExists {
        name: String,
        #[serde(default = "yes")]
        present: bool,
    },
    CurrentBranch {
        name: Option<String>,
    },
    RefAt {
        #[serde(rename = "ref")]
        reference: String,
        target: String,
    },
    RefNotAt {
        #[serde(rename = "ref")]
        reference: String,
        target: String,
    },
    IsAncestor {
        ancestor: String,
        descendant: String,
    },
    CommitCount {
        range: String,
        #[serde(default)]
        equals: Option<u64>,
        #[serde(default)]
        min: Option<u64>,
        #[serde(default)]
        max: Option<u64>,
    },
    #[serde(rename_all = "camelCase")]
    CommitMessage {
        rev: String,
        #[serde(default)]
        equals: Option<String>,
        #[serde(default)]
        contains: Option<String>,
        #[serde(default)]
        not_contains: Option<String>,
        #[serde(default)]
        matches: Option<String>,
    },
    CommitParents {
        rev: String,
        count: usize,
    },
    CommitAuthor {
        rev: String,
        #[serde(default)]
        name: Option<String>,
        #[serde(default)]
        email: Option<String>,
    },
    CommitChanges {
        rev: String,
        paths: Vec<String>,
        #[serde(default)]
        exact: bool,
    },
    Tag {
        name: String,
        #[serde(default = "yes")]
        present: bool,
        #[serde(default)]
        annotated: Option<bool>,
        #[serde(default)]
        target: Option<String>,
        #[serde(default)]
        message: Option<String>,
    },
    Remote {
        name: String,
        #[serde(default)]
        url: Option<String>,
        #[serde(default = "yes")]
        present: bool,
    },
    Upstream {
        branch: String,
        upstream: Option<String>,
    },
    Config {
        key: String,
        #[serde(default)]
        value: Option<String>,
        #[serde(default)]
        scope: Option<String>,
        #[serde(default = "yes")]
        present: bool,
    },
    Operation {
        value: Option<String>,
    },
    #[serde(rename_all = "camelCase")]
    Stash {
        #[serde(default)]
        count: Option<usize>,
        #[serde(default)]
        message_contains: Option<String>,
    },
    WorktreeCount {
        equals: usize,
    },
    Reachable {
        rev: String,
        #[serde(default)]
        from: Option<Vec<String>>,
    },
    #[serde(rename_all = "camelCase")]
    UsedCommand {
        matches: String,
        #[serde(default = "exit_zero")]
        exit_code: Option<i32>,
        /// Only the most recent command counts. With `sticky` and a state
        /// check in an `all`, this means "ran X while the repo was in state Y".
        #[serde(default)]
        last: bool,
    },
    Answer {
        question: String,
    },
    Shell {
        script: String,
    },
}

#[derive(Debug, Clone, Serialize)]
pub struct Question {
    pub id: String,
    pub prompt: String,
    #[serde(flatten)]
    pub kind: QuestionKind,
}

impl<'de> Deserialize<'de> for Question {
    fn deserialize<D: Deserializer<'de>>(d: D) -> Result<Self, D::Error> {
        let mut map = serde_json::Map::deserialize(d)?;
        let mut take = |key: &str| match map.remove(key) {
            Some(Value::String(s)) => Ok(s),
            _ => Err(D::Error::custom(format!("question needs a string `{key}`"))),
        };
        let id = take("id")?;
        let prompt = take("prompt")?;
        let kind = QuestionKind::deserialize(Value::Object(map))
            .map_err(|e| D::Error::custom(format!("question {id}: {e}")))?;
        Ok(Question { id, prompt, kind })
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase", deny_unknown_fields)]
pub enum QuestionKind {
    Choice {
        options: Vec<String>,
        #[serde(default)]
        answer: Option<usize>,
        #[serde(default)]
        answers: Option<Vec<usize>>,
    },
    Text {
        accept: Vec<String>,
        #[serde(default, rename = "caseSensitive")]
        case_sensitive: bool,
    },
    Number {
        answer: i64,
    },
    Commit {
        answer: String,
        #[serde(default)]
        repo: Option<String>,
        /// Also accept names like `main` or `HEAD~2`. Off by default so the
        /// question's own wording cannot be typed back as the answer.
        #[serde(default, rename = "allowRefs")]
        allow_refs: bool,
    },
}

impl Question {
    /// The question as shown to the learner, without the correct answer.
    pub fn public(&self) -> Value {
        let mut v = serde_json::json!({ "id": self.id, "prompt": self.prompt });
        let obj = v.as_object_mut().unwrap();
        match &self.kind {
            QuestionKind::Choice {
                options, answers, ..
            } => {
                obj.insert("type".into(), "choice".into());
                obj.insert("options".into(), serde_json::to_value(options).unwrap());
                obj.insert("multiple".into(), answers.is_some().into());
            }
            QuestionKind::Text { .. } => {
                obj.insert("type".into(), "text".into());
            }
            QuestionKind::Number { .. } => {
                obj.insert("type".into(), "number".into());
            }
            QuestionKind::Commit { .. } => {
                obj.insert("type".into(), "commit".into());
            }
        }
        v
    }
}
