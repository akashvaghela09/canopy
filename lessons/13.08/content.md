Hooks run on both ends of a push. On your side, `pre-push` runs before anything is sent and can stop the push. On the server, `pre-receive` runs once per push with every updated ref on its standard input, and a non-zero exit rejects the whole push. Server hooks are how teams enforce rules nobody can skip with `--no-verify`.

Two more client hooks are worth knowing: `prepare-commit-msg` edits the message template before the editor opens (teams use it to add a ticket number from the branch name), and `post-merge` runs after a successful merge (including one made by `git pull`), often to reinstall dependencies.

## Try it

Your clone has two unpushed commits. The bare `origin.git` has a `pre-receive` hook installed by the lesson; you can read it at `../origin.git/hooks/pre-receive`.

1. Push. Read the rejection, then read the hook to see the rule.
2. Give the last commit a real message instead of "wip" and push again.
3. Catch this earlier next time. Create `.git/hooks/pre-push` in your clone, executable:

   ```
   #!/bin/sh
   while read local_ref local_sha remote_ref remote_sha; do
     [ "$local_sha" = 0000000000000000000000000000000000000000 ] && continue
     if git rev-list --format=%s "$local_sha" --not --remotes | grep -qi '^wip'; then
       echo "pre-push: a wip commit is about to leave this machine" >&2
       exit 1
     fi
   done
   exit 0
   ```

4. Create `.git/hooks/post-merge`, executable, containing `echo "merged $(git rev-parse --short HEAD) at $(date)" >> .merge-log`. Then merge `origin/feature/colors` into `main` and look at `.merge-log`.

## What just happened

The server refused a push without any help from your side: that is policy. The pre-push hook gives you the same answer sooner, before the network is involved. The post-merge hook shows that hooks are not only guards; they can also react to what just happened.
