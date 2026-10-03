//! App database: progress, settings and the current attempt per lesson
//! (docs/ARCHITECTURE.md section 4.6). Never stores repo state.

use std::collections::{HashMap, HashSet};
use std::path::Path;

use anyhow::Result;
use canopy_core::marker::CommandEntry;
use rusqlite::{params, Connection, OptionalExtension};

pub struct Db {
    conn: Connection,
}

const MIGRATIONS: &[&str] = &[
    // 1: initial schema
    "CREATE TABLE completion (
        lesson_id TEXT PRIMARY KEY,
        completed_at INTEGER NOT NULL
     );
     CREATE TABLE setting (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
     );
     CREATE TABLE attempt_command (
        lesson_id TEXT NOT NULL,
        seq INTEGER NOT NULL,
        command TEXT NOT NULL,
        exit_code INTEGER NOT NULL,
        cwd TEXT NOT NULL,
        at INTEGER NOT NULL,
        PRIMARY KEY (lesson_id, seq)
     );
     CREATE TABLE attempt_answer (
        lesson_id TEXT NOT NULL,
        question_id TEXT NOT NULL,
        value TEXT NOT NULL,
        correct INTEGER NOT NULL,
        PRIMARY KEY (lesson_id, question_id)
     );
     CREATE TABLE attempt_sticky (
        lesson_id TEXT NOT NULL,
        goal_index INTEGER NOT NULL,
        PRIMARY KEY (lesson_id, goal_index)
     );",
    // 2: skipped lessons count as complete but are shown differently
    "ALTER TABLE completion ADD COLUMN skipped INTEGER NOT NULL DEFAULT 0;",
];

impl Db {
    pub fn open(path: &Path) -> Result<Db> {
        let conn = Connection::open(path)?;
        conn.pragma_update(None, "journal_mode", "WAL")?;
        conn.pragma_update(None, "foreign_keys", "ON")?;
        conn.execute("CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL)", [])?;
        let current: i64 = conn
            .query_row("SELECT version FROM schema_version", [], |r| r.get(0))
            .optional()?
            .unwrap_or(0);
        for (i, sql) in MIGRATIONS.iter().enumerate().skip(current as usize) {
            conn.execute_batch(&format!("BEGIN; {sql} COMMIT;"))?;
            conn.execute("DELETE FROM schema_version", [])?;
            conn.execute("INSERT INTO schema_version (version) VALUES (?1)", [(i + 1) as i64])?;
        }
        Ok(Db { conn })
    }

    pub fn completed(&self) -> Result<HashMap<String, i64>> {
        let mut stmt = self.conn.prepare("SELECT lesson_id, completed_at FROM completion")?;
        let rows = stmt.query_map([], |r| Ok((r.get(0)?, r.get(1)?)))?;
        Ok(rows.collect::<Result<_, _>>()?)
    }

    /// Returns true if this is the first completion. Completing a skipped
    /// lesson for real clears its skipped state.
    pub fn mark_complete(&self, lesson: &str, at: i64) -> Result<bool> {
        let n = self.conn.execute(
            "INSERT OR IGNORE INTO completion (lesson_id, completed_at) VALUES (?1, ?2)",
            params![lesson, at],
        )?;
        self.conn.execute("UPDATE completion SET skipped = 0 WHERE lesson_id = ?1", [lesson])?;
        Ok(n > 0)
    }

    pub fn mark_skipped(&self, lesson: &str, at: i64) -> Result<()> {
        self.conn.execute(
            "INSERT OR IGNORE INTO completion (lesson_id, completed_at, skipped) VALUES (?1, ?2, 1)",
            params![lesson, at],
        )?;
        Ok(())
    }

    pub fn skipped(&self) -> Result<Vec<String>> {
        let mut stmt = self.conn.prepare("SELECT lesson_id FROM completion WHERE skipped = 1")?;
        let rows = stmt.query_map([], |r| r.get(0))?;
        Ok(rows.collect::<Result<_, _>>()?)
    }

    /// Remove completion for these lessons (reset progress).
    pub fn clear_completion(&self, lessons: &[String]) -> Result<()> {
        let mut stmt = self.conn.prepare("DELETE FROM completion WHERE lesson_id = ?1")?;
        for l in lessons {
            stmt.execute([l])?;
        }
        Ok(())
    }

    pub fn setting(&self, key: &str) -> Result<Option<String>> {
        Ok(self
            .conn
            .query_row("SELECT value FROM setting WHERE key = ?1", [key], |r| r.get(0))
            .optional()?)
    }

    pub fn settings(&self) -> Result<HashMap<String, String>> {
        let mut stmt = self.conn.prepare("SELECT key, value FROM setting")?;
        let rows = stmt.query_map([], |r| Ok((r.get(0)?, r.get(1)?)))?;
        Ok(rows.collect::<Result<_, _>>()?)
    }

    pub fn set_setting(&self, key: &str, value: &str) -> Result<()> {
        self.conn.execute(
            "INSERT INTO setting (key, value) VALUES (?1, ?2)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            params![key, value],
        )?;
        Ok(())
    }

    pub fn clear_attempt(&self, lesson: &str) -> Result<()> {
        for table in ["attempt_command", "attempt_answer", "attempt_sticky"] {
            self.conn.execute(&format!("DELETE FROM {table} WHERE lesson_id = ?1"), [lesson])?;
        }
        Ok(())
    }

    pub fn add_command(&self, lesson: &str, c: &CommandEntry) -> Result<()> {
        self.conn.execute(
            "INSERT INTO attempt_command (lesson_id, seq, command, exit_code, cwd, at)
             VALUES (?1, (SELECT COALESCE(MAX(seq), 0) + 1 FROM attempt_command WHERE lesson_id = ?1), ?2, ?3, ?4, ?5)",
            params![lesson, c.command, c.exit_code, c.cwd, c.at],
        )?;
        Ok(())
    }

    pub fn commands(&self, lesson: &str) -> Result<Vec<CommandEntry>> {
        let mut stmt = self.conn.prepare(
            "SELECT command, exit_code, cwd, at FROM attempt_command WHERE lesson_id = ?1 ORDER BY seq",
        )?;
        let rows = stmt.query_map([lesson], |r| {
            Ok(CommandEntry { command: r.get(0)?, exit_code: r.get(1)?, cwd: r.get(2)?, at: r.get(3)? })
        })?;
        Ok(rows.collect::<Result<_, _>>()?)
    }

    pub fn set_answer(&self, lesson: &str, question: &str, value: &serde_json::Value, correct: bool) -> Result<()> {
        self.conn.execute(
            "INSERT INTO attempt_answer (lesson_id, question_id, value, correct) VALUES (?1, ?2, ?3, ?4)
             ON CONFLICT(lesson_id, question_id) DO UPDATE SET value = excluded.value, correct = excluded.correct",
            params![lesson, question, value.to_string(), correct],
        )?;
        Ok(())
    }

    /// question id -> (value, correct)
    pub fn answers(&self, lesson: &str) -> Result<HashMap<String, (serde_json::Value, bool)>> {
        let mut stmt = self
            .conn
            .prepare("SELECT question_id, value, correct FROM attempt_answer WHERE lesson_id = ?1")?;
        let rows = stmt.query_map([lesson], |r| {
            let v: String = r.get(1)?;
            Ok((r.get::<_, String>(0)?, (serde_json::from_str(&v).unwrap_or_default(), r.get(2)?)))
        })?;
        Ok(rows.collect::<Result<_, _>>()?)
    }

    pub fn sticky(&self, lesson: &str) -> Result<HashSet<usize>> {
        let mut stmt = self.conn.prepare("SELECT goal_index FROM attempt_sticky WHERE lesson_id = ?1")?;
        let rows = stmt.query_map([lesson], |r| r.get::<_, i64>(0))?;
        Ok(rows.filter_map(|r| r.ok()).map(|i| i as usize).collect())
    }

    pub fn add_sticky(&self, lesson: &str, index: usize) -> Result<()> {
        self.conn.execute(
            "INSERT OR IGNORE INTO attempt_sticky (lesson_id, goal_index) VALUES (?1, ?2)",
            params![lesson, index as i64],
        )?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn migrate_and_roundtrip() {
        let dir = tempfile_dir();
        let db = Db::open(&dir.join("t.db")).unwrap();
        assert!(db.mark_complete("1.01", 5).unwrap());
        assert!(!db.mark_complete("1.01", 6).unwrap());
        db.set_setting("theme", "dark").unwrap();
        db.set_setting("theme", "light").unwrap();
        assert_eq!(db.setting("theme").unwrap().as_deref(), Some("light"));
        let c = CommandEntry { command: "git status".into(), exit_code: 0, cwd: "/".into(), at: 1 };
        db.add_command("1.01", &c).unwrap();
        db.add_command("1.01", &c).unwrap();
        assert_eq!(db.commands("1.01").unwrap().len(), 2);
        db.clear_attempt("1.01").unwrap();
        assert!(db.commands("1.01").unwrap().is_empty());
        drop(db);
        // Reopen: migrations are not re-run.
        let db = Db::open(&dir.join("t.db")).unwrap();
        assert_eq!(db.completed().unwrap().len(), 1);
        std::fs::remove_dir_all(dir).ok();
    }

    fn tempfile_dir() -> std::path::PathBuf {
        let d = std::env::temp_dir().join(format!("canopy-db-test-{}", std::process::id()));
        std::fs::create_dir_all(&d).unwrap();
        d
    }
}
