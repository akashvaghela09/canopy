You can name commits by counting back from HEAD instead of copying ids.

- `HEAD~1` is the parent of HEAD. `HEAD~3` is three steps back. `HEAD~` alone means `HEAD~1`.
- `HEAD^` also means the parent. The difference shows up on a **merge commit**, which has two parents: `^1` is the first parent (the branch you were on), `^2` is the second parent (the branch that was merged in).

`~` always follows the first parent, so `HEAD~4` walks straight down the main line. `^2` is how you step sideways onto the merged branch. You can chain them: `HEAD~3^2` means "go back three, then take the second parent".

These work after any commit name, not only HEAD: `main~1`, `v1.0^2` (v1.0 is the merge).

## Try it

1. Draw the graph so you can see the merge three steps below HEAD.
2. Show `HEAD~2` and note which commit it is.
3. Show `HEAD~3^2`. Find it in the graph: it is on the side branch.
4. Compare `HEAD~4` with `HEAD~3^1`.
5. Answer the questions in the lesson panel.

## What just happened

Relative references are computed fresh every time from where HEAD is now. After your next commit, `HEAD~2` will mean a different commit. Use them for "a few steps back"; use ids or tags for a commit you need to name permanently.
