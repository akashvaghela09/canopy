A plain clone of a project with submodules brings the pointers, not the libraries: the submodule folders are empty. Two commands fill them.

- `git submodule update --init --recursive`: register every submodule from `.gitmodules`, clone it, and check out the pinned commit (`--recursive` does the same inside nested submodules),
- `git clone --recurse-submodules <url>`: clone and do all of that in one step.

## Try it

1. `work` is a plain clone. Look inside `lib/`: empty. `git submodule status` shows the pinned commit with a `-` in front, meaning "not initialised".
2. Run `git submodule update --init --recursive`. Look at `lib/version.txt`.
3. The library repository has moved on to 1.1, yet you got 1.0. Inside `lib/`, check the status: HEAD is detached at the pinned commit.
4. Go up to the lesson folder and make a second clone with `--recurse-submodules` into `fresh`. Its `lib/` is filled straight away.
5. Answer the questions in the lesson panel.

## What just happened

The project decides which library commit is used, not the library's branch. That is the point of a submodule: builds are reproducible because the pointer is part of history. The cost is the extra step after every clone and after every pull that moves the pointer.
