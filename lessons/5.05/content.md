So far every branch label sat somewhere on one straight line. History forks the moment two branches each get their own new commit. Git calls this **divergence**: the branches share a past but have different newest commits.

Nothing special is needed to make it happen. Commit on one branch, switch, commit on the other.

## Try it

1. Create a branch `river` from the current commit and switch to it.
2. Write a new file `trails/river.md` with a heading such as `# River walk`, then make a commit, for example "Add river walk".
3. Switch back to `main`. The river file disappears from the files panel: it only exists on `river`.
4. On `main`, add a line to `gear.md` (for example `- water filter`) and make a commit.
5. Draw the graph with all branches included, and answer the questions in the lesson panel.

## What just happened

The graph now has two lanes in two colors. "Add gear checklist" is the last commit both branches share; above it, each branch has one commit the other does not. Neither branch is ahead of the other any more. Bringing the two lanes back together is what merging does, in section 6.
