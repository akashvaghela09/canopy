# Canopy

Learn git by running real git. Canopy is a desktop app with a terminal, a file tree and editor, and an animated commit graph on one screen. 225 lessons take you from your first `cd` to git internals. Every command runs in real git inside a learning folder Canopy creates; your own projects are never touched.

## Develop

Requirements: Rust (stable), Node 22+, pnpm, git 2.32+, and the Tauri Linux dependencies (`libwebkit2gtk-4.1-dev` and friends).

```sh
pnpm install
pnpm tauri dev          # run the app
cargo test --workspace  # Rust tests
pnpm test               # frontend tests
```

## Lessons

Lessons live in `lessons/`, one folder per lesson (format: `docs/LESSON_FORMAT.md`, curriculum: `docs/LESSONS.md`).

```sh
cargo run -q -p canopy-lesson -- validate        # prerequisite order and file shape
cargo run -q -p canopy-lesson -- test 6          # run every solution in section 6 against its goals
cargo run -q -p canopy-lesson -- test -v 6.08    # one lesson, with the shell transcript
python3 tools/lesson-try.py 6.08 --shell         # open a learner shell after setup
```

Lesson updates reach learners without a new app release: see `docs/CONTENT_UPDATES.md`.

## Layout

| Path | What |
|---|---|
| `crates/canopy-core` | Lesson catalog, setup runner, goal checker, repo snapshots (no UI) |
| `crates/canopy-lesson` | CLI to validate and test lessons |
| `src-tauri` | Tauri backend: PTY shell, SQLite, file watcher, editor bridge, content updates |
| `src` | React + Redux Toolkit + Tailwind v4 frontend; `src/graph` is the commit graph |
| `lessons` | Lesson content |
| `docs` | Architecture, lesson format, curriculum, design spec |

## License

MIT
