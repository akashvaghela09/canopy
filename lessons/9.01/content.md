A commit can never be changed. Its id is a hash of everything in it: the files, the message, the author and the committer with their dates, and the parent id. Change one character of the message and you have a different hash, which means a different commit.

So what does "rewriting history" mean? Git makes a **new** commit with the content you asked for and moves the branch label onto it. The old commit stays in the repository, unreachable, like the commit you reset away in section 4. Every command in this section works like that: amend, cherry-pick and rebase all create copies and move labels. Nothing is edited in place.

This lesson is guided: type the commands as shown and watch the graph.

## Try it

1. Run `git log --oneline -3`. The last message has a typo, "pancaks". Note its short id.
2. Fix the message by replacing the last commit:

       git commit --amend -m "Add recipe for pancakes"

3. Run `git log --oneline -3` again. The top commit has a new id. The commit below it is unchanged.
4. Draw the graph with `git log --oneline --graph --all`. The old commit is not listed. In the graph it is ghosted: still there, but no branch reaches it.
5. Answer the questions in the lesson panel.

## What just happened

`--amend` is a shortcut for "reset the branch to the parent, then commit again with the same changes", keeping the original author. The replacement has the same parent, files and author as the original. The message differs, and so does the committer time, so the id differs.

The golden rule for the whole section: rewrite only commits that nobody else has yet. Once a commit is shared, its id is in other people's repositories, and a replacement does not remove it from there. For shared commits, a revert is the right tool.
