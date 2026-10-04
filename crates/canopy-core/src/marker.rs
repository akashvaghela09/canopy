//! Parsing the prompt marker printed by the learner shell after each command
//! (see `env::BASHRC`). Works on a byte stream split at arbitrary points.

use serde::Serialize;

const START: &[u8] = b"\x1b]7770;";
const END: u8 = 0x07;
const MAX_MARKER: usize = 64 * 1024;

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PromptEvent {
    pub exit_code: i32,
    pub cwd: String,
    /// Shell history number of the last command, if any command ran yet.
    pub hist_num: Option<u64>,
    /// The last command line from history (may repeat across prompts).
    pub command: Option<String>,
}

/// One command the learner ran, as recorded in the command log.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CommandEntry {
    pub command: String,
    pub exit_code: i32,
    pub cwd: String,
    /// Unix millis.
    pub at: i64,
}

#[derive(Debug, Default)]
pub struct MarkerParser {
    buf: Vec<u8>,
    last_hist: Option<u64>,
}

pub enum Chunk {
    Output(Vec<u8>),
    Prompt(PromptEvent),
}

impl MarkerParser {
    pub fn new() -> Self {
        Self::default()
    }

    /// Feed bytes; returns terminal output with markers removed, and the
    /// prompt events found, in order.
    pub fn feed(&mut self, data: &[u8]) -> Vec<Chunk> {
        self.buf.extend_from_slice(data);
        let mut out = Vec::new();
        let mut plain = Vec::new();
        let mut i = 0;
        while i < self.buf.len() {
            if self.buf[i] == 0x1b {
                let rest = &self.buf[i..];
                if rest.len() < START.len() {
                    if START.starts_with(rest) {
                        break; // maybe a marker split across reads; wait for more
                    }
                } else if rest.starts_with(START) {
                    match rest.iter().position(|&b| b == END) {
                        Some(end) => {
                            if !plain.is_empty() {
                                out.push(Chunk::Output(std::mem::take(&mut plain)));
                            }
                            let body =
                                String::from_utf8_lossy(&rest[START.len()..end]).into_owned();
                            if let Some(ev) = parse_body(&body) {
                                out.push(Chunk::Prompt(ev));
                            }
                            i += end + 1;
                            continue;
                        }
                        None if rest.len() < MAX_MARKER => break,
                        None => {} // not a real marker; pass through
                    }
                }
            }
            plain.push(self.buf[i]);
            i += 1;
        }
        self.buf.drain(..i);
        if !plain.is_empty() {
            out.push(Chunk::Output(plain));
        }
        out
    }

    /// Turn a prompt event into a new command entry, or None when the prompt
    /// was not preceded by a new command (empty line, first prompt).
    pub fn command_for(&mut self, ev: &PromptEvent, now_ms: i64) -> Option<CommandEntry> {
        let num = ev.hist_num?;
        if self.last_hist == Some(num) {
            return None;
        }
        self.last_hist = Some(num);
        Some(CommandEntry {
            command: ev.command.clone().unwrap_or_default(),
            exit_code: ev.exit_code,
            cwd: ev.cwd.clone(),
            at: now_ms,
        })
    }
}

fn parse_body(body: &str) -> Option<PromptEvent> {
    let (code, rest) = body.split_once(';')?;
    let (cwd, hist) = rest.split_once('\x1f').unwrap_or((rest, ""));
    let hist = hist.trim_start();
    let (hist_num, command) = if hist.is_empty() {
        (None, None)
    } else {
        let digits: String = hist.chars().take_while(|c| c.is_ascii_digit()).collect();
        let cmd = hist[digits.len()..]
            .trim_start()
            .trim_end_matches('\n')
            .to_string();
        (digits.parse().ok(), Some(cmd))
    };
    Some(PromptEvent {
        exit_code: code.trim().parse().unwrap_or(0),
        cwd: cwd.to_string(),
        hist_num,
        command,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn events(chunks: Vec<Chunk>) -> (String, Vec<PromptEvent>) {
        let mut s = String::new();
        let mut ev = Vec::new();
        for c in chunks {
            match c {
                Chunk::Output(b) => s.push_str(&String::from_utf8_lossy(&b)),
                Chunk::Prompt(p) => ev.push(p),
            }
        }
        (s, ev)
    }

    #[test]
    fn parses_marker_split_across_reads() {
        let mut p = MarkerParser::new();
        let full = b"hello\x1b]7770;1;/tmp/x\x1f  12  git status\x07$ ";
        let (a, b) = full.split_at(10);
        let (s1, e1) = events(p.feed(a));
        let (s2, e2) = events(p.feed(b));
        assert_eq!(s1 + &s2, "hello$ ");
        assert!(e1.is_empty());
        assert_eq!(
            e2,
            vec![PromptEvent {
                exit_code: 1,
                cwd: "/tmp/x".into(),
                hist_num: Some(12),
                command: Some("git status".into())
            }]
        );
    }

    #[test]
    fn dedupes_empty_enter() {
        let mut p = MarkerParser::new();
        let ev = PromptEvent {
            exit_code: 0,
            cwd: "/".into(),
            hist_num: Some(3),
            command: Some("ls".into()),
        };
        assert!(p.command_for(&ev, 0).is_some());
        assert!(p.command_for(&ev, 0).is_none());
        let first = PromptEvent {
            exit_code: 0,
            cwd: "/".into(),
            hist_num: None,
            command: None,
        };
        assert!(p.command_for(&first, 0).is_none());
    }

    #[test]
    fn passes_other_escapes_through() {
        let mut p = MarkerParser::new();
        let (s, e) = events(p.feed(b"\x1b[31mred\x1b[0m"));
        assert_eq!(s, "\x1b[31mred\x1b[0m");
        assert!(e.is_empty());
    }
}
