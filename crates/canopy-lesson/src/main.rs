//! canopy-lesson: validate and test lesson content.
//!
//!   canopy-lesson validate [--lessons DIR]
//!   canopy-lesson test [--lessons DIR] [-v] [--solution FILE] [ID|PREFIX ...]
//!
//! `test 3` runs every lesson in section 3; `test 3.04` runs one lesson.

mod preview;

use std::path::PathBuf;
use std::process::ExitCode;

use anyhow::Result;
use canopy_core::catalog::Catalog;
use canopy_core::harness::{test_lesson, test_lesson_with};
use canopy_core::validate::{validate, Level};

fn main() -> ExitCode {
    match run() {
        Ok(true) => ExitCode::SUCCESS,
        Ok(false) => ExitCode::FAILURE,
        Err(e) => {
            eprintln!("error: {e:#}");
            ExitCode::from(2)
        }
    }
}

fn run() -> Result<bool> {
    let mut args: Vec<String> = std::env::args().skip(1).collect();
    let mut lessons_dir = PathBuf::from("lessons");
    if let Some(i) = args.iter().position(|a| a == "--lessons") {
        lessons_dir = PathBuf::from(args.get(i + 1).cloned().unwrap_or_default());
        args.drain(i..=i + 1);
    }
    let mut solution_file: Option<PathBuf> = None;
    if let Some(i) = args.iter().position(|a| a == "--solution") {
        solution_file = Some(PathBuf::from(args.get(i + 1).cloned().unwrap_or_default()));
        args.drain(i..=i + 1);
    }
    let verbose = args.iter().any(|a| a == "-v");
    args.retain(|a| a != "-v");
    let Some(cmd) = args.first().cloned() else {
        eprintln!("usage: canopy-lesson validate | test [-v] [ID|SECTION ...] [--lessons DIR]");
        return Ok(false);
    };
    let catalog = Catalog::load(&lessons_dir)?;

    match cmd.as_str() {
        "validate" => {
            let issues = validate(&catalog);
            for i in &issues {
                println!("{i}");
            }
            let errors = issues.iter().filter(|i| i.level == Level::Error).count();
            println!(
                "{} lessons, {} errors, {} warnings",
                catalog.lessons.len(),
                errors,
                issues.len() - errors
            );
            Ok(errors == 0)
        }
        "test" => {
            let filters = &args[1..];
            let selected: Vec<_> = catalog
                .lessons
                .iter()
                .filter(|l| {
                    filters.is_empty()
                        || filters.iter().any(|f| {
                            l.meta.id == *f || l.meta.id.split('.').next() == Some(f.as_str())
                        })
                })
                .collect();
            let mut failed = 0;
            for lesson in &selected {
                let tmp = tempfile::Builder::new().prefix("canopy-test-").tempdir()?;
                let result = match &solution_file {
                    Some(f) => std::fs::read_to_string(f)
                        .map_err(anyhow::Error::from)
                        .and_then(|t| Ok(serde_yaml_ng::from_str(&t)?))
                        .and_then(|sol| test_lesson_with(&catalog, lesson, tmp.path(), sol)),
                    None => test_lesson(&catalog, lesson, tmp.path()),
                };
                match result {
                    Err(e) => {
                        failed += 1;
                        println!("FAIL {} {}: {e:#}", lesson.meta.id, lesson.meta.title);
                    }
                    Ok(r) => {
                        let ok = r.passed();
                        if !ok {
                            failed += 1;
                        }
                        println!("{} {} {}", if ok { "ok  " } else { "FAIL" }, r.lesson, lesson.meta.title);
                        if !ok || verbose {
                            for g in &r.goals {
                                let err = g.error.as_deref().map(|e| format!("  ({e})")).unwrap_or_default();
                                println!("       [{}] {}{err}", if g.passed { "x" } else { " " }, g.label);
                            }
                            if !r.passing_at_start.is_empty() {
                                println!("       passing at start: {:?}", r.passing_at_start);
                            }
                            if !r.wrong_answers.is_empty() {
                                println!("       wrong solution answers: {:?}", r.wrong_answers);
                            }
                            if r.timed_out {
                                println!("       timed out");
                            }
                        }
                        if verbose {
                            println!("------ transcript\n{}\n------", r.transcript.trim_end());
                        }
                    }
                }
            }
            println!("{} tested, {} failed", selected.len(), failed);
            Ok(failed == 0)
        }
        "preview" => {
            let id = args.get(1).cloned().unwrap_or_default();
            let lesson = catalog.lesson(&id).ok_or_else(|| anyhow::anyhow!("no lesson {id}"))?;
            let run = !args.iter().any(|a| a == "--no-solution");
            println!("{}", serde_json::to_string(&preview::preview(&catalog, lesson, run)?)?);
            Ok(true)
        }
        other => {
            eprintln!("unknown command {other}");
            Ok(false)
        }
    }
}
