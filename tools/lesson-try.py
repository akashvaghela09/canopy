#!/usr/bin/env python3
"""Run a lesson's setup.sh and solution.yaml in a temp folder and print the result.

Dev tool for lesson authors. It does not evaluate goal.json (the Rust harness
`canopy-lesson test` does that); it shows the state so you can confirm the
setup and solution behave as intended.

Usage: tools/lesson-try.py 2.03 [--keep] [--no-solution] [--shell]
"""
import argparse
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
LESSONS = ROOT / "lessons"
LIB = LESSONS / "_lib"


def run(cmd, **kw):
    return subprocess.run(cmd, text=True, **kw)


def main():
    sys.stdout.reconfigure(line_buffering=True)
    ap = argparse.ArgumentParser()
    ap.add_argument("lesson")
    ap.add_argument("--keep", action="store_true", help="keep the temp folder")
    ap.add_argument("--no-solution", action="store_true")
    ap.add_argument("--shell", action="store_true", help="open an interactive learner shell after setup")
    args = ap.parse_args()

    ldir = LESSONS / args.lesson
    meta = yaml.safe_load((ldir / "lesson.yaml").read_text())
    root = Path(tempfile.mkdtemp(prefix=f"canopy-{args.lesson}-"))
    app = root.parent / (root.name + "-app")
    app.mkdir()
    state = root.parent / (root.name + "-state")

    base_env = {
        "PATH": os.environ["PATH"],
        "HOME": str(app),
        "LANG": "C.UTF-8",
        "TERM": "dumb",
    }
    setup_env = dict(base_env, LESSON_ROOT=str(root), LESSON_DIR=str(ldir),
                     CANOPY_LIB=str(LIB), CANOPY_STATE=str(state))

    print(f"== setup ({root})")
    r = run(["bash", str(ldir / "setup.sh")], cwd=root, env=setup_env)
    if r.returncode != 0:
        sys.exit(f"setup.sh failed with exit {r.returncode}")

    gitconfig = app / "gitconfig"
    gitconfig.write_text("[init]\n\tdefaultBranch = main\n")
    learner_env = dict(base_env,
                       GIT_CONFIG_GLOBAL=str(gitconfig),
                       GIT_CONFIG_NOSYSTEM="1",
                       GIT_CEILING_DIRECTORIES=str(root.parent),
                       GIT_PAGER="cat",
                       GIT_EDITOR="true")
    if meta.get("identity", True):
        run(["git", "config", "--global", "user.name", "Learner"], env=learner_env, check=True)
        run(["git", "config", "--global", "user.email", "learner@example.com"], env=learner_env, check=True)

    start = root / (meta.get("start") or ".")

    if args.shell:
        run(["bash", "--noprofile", "--norc", "-i"], cwd=start, env=dict(learner_env, PS1="learner$ "))
    elif not args.no_solution:
        sol = yaml.safe_load((ldir / "solution.yaml").read_text()) or {}
        lines = []
        for line in (sol.get("commands") or "").splitlines():
            s = line.strip()
            if s.startswith("#action "):
                act = next(a for a in meta.get("actions", []) if a["id"] == s.split()[1])
                lines.append(
                    f'echo "== action {act["id"]}"; ( env -i PATH="$PATH" HOME="$HOME" '
                    f'LESSON_ROOT={root} LESSON_DIR={ldir} CANOPY_LIB={LIB} CANOPY_STATE={state} '
                    f'bash {ldir / act["script"]} )')
            elif s and not s.startswith("#"):
                lines.append(f'echo "learner$ "{_q(s)}; {s}; echo "[exit $?]"')
        print("== solution")
        run(["bash", "--noprofile", "--norc"], cwd=start, env=learner_env, input="\n".join(lines) + "\n")
        if sol.get("answers"):
            print(f"== answers: {sol['answers']}")

    repo = meta.get("repo")
    if repo:
        rp = root / repo
        print(f"\n== final state of {repo}")
        run(["git", "-C", str(rp), "log", "--oneline", "--graph", "--all", "--decorate", "-n", "30"], env=learner_env)
        if not repo.endswith(".git"):
            run(["git", "-C", str(rp), "status", "-sb"], env=learner_env)
    if (state / "marks.tsv").exists():
        print("\n== marks\n" + (state / "marks.tsv").read_text())

    if args.keep or args.shell:
        print(f"kept: {root}")
    else:
        shutil.rmtree(root)
        shutil.rmtree(app)


def _q(s):
    return "'" + s.replace("'", "'\\''") + "'"


if __name__ == "__main__":
    main()
