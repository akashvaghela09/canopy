Give `git merge` more than one branch and it makes a single merge commit with all of them as parents: an **octopus** merge. It is for bundling several independent topic branches at once, and it is meant for branches that do not conflict. The octopus strategy will not resolve conflicts between earlier branches: if one appears before the last branch, it refuses and leaves nothing to clean up. Only a conflict with the last branch stops like an ordinary merge, leaving markers to resolve. Branches that conflict are better merged one at a time.

## Try it

1. Four branches wait: `header`, `footer`, `sidebar` and `clash`. Look at what each changed.
2. Try all four at once: `git merge header footer sidebar clash`. `clash` comes last, so git stops with a conflict in `theme.css`, where `clash` and `header` edit the same line. Do not resolve it: abort the merge (the usual way to abort a merge in progress). Had `clash` come first, git would have refused outright with "Should not be doing an octopus", and there would be nothing to abort.
3. Merge the three that are independent: `git merge header footer sidebar -m "Merge header, footer and sidebar"`.
4. Look at the graph: four edges into one commit. Print the commit object and count the `parent` lines.
5. Answer the question in the lesson panel.

## What just happened

An octopus merge is a commit with many parents; git's object model never limited that to two. The strategy is deliberately simple: it merges cleanly or gives up, letting only the last branch leave conflicts for you, rather than produce a tangle of conflicts across many branches.
