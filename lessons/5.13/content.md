HEAD normally points to a branch. It can also point straight at a commit, with no branch in between. Git calls that **detached HEAD**, and it is how you visit old commits.

```
git switch --detach <commit>
```

puts your files in the state of that commit. (`git checkout <commit>` does the same and detaches without asking.) Looking around is harmless: read files, run the log, switch back to a branch when done.

Committing while detached works too, but with a catch. The new commit's only name is HEAD. As soon as you switch to a branch, nothing points at it any more, and git warns you that you are leaving a commit behind. To keep such a commit, give it a branch before you leave: create a branch and switch to it in one step, as you already know how to do. The new branch starts at HEAD, which is your new commit, and HEAD attaches to it.

## Try it

1. Draw the graph. Then visit the commit "Add ridge trail", two commits below the tip of `main`, in detached mode. Read the status message and look at the files panel: `gear.md` does not exist yet here.
2. Write a file `ideas.md` with a line such as `Add a trail difficulty rating`, and make a commit.
3. Draw the graph again. Your commit sits on its own lane with `HEAD` on it directly, and no branch label.
4. Save the commit on a new branch called `ideas`.
5. Switch back to `main` and answer the question in the lesson panel.

## What just happened

While detached, the graph showed HEAD on a commit rather than on a flag. `switch -c` gave that commit a flag, so it is now part of a branch's history and will not be lost when HEAD moves on. `main` never moved during any of this.
