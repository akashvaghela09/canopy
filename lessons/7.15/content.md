Tags do not travel with a normal push. You send them on purpose:

```
git push origin <tag>          one tag
git push --tags                every local tag (often too many)
git push --follow-tags         the branch, plus annotated tags on its history that the remote lacks
git push origin --delete <tag> remove a tag from the remote
```

On the receiving side, `git fetch` brings along tags that point into the history it fetches. `git fetch --tags` asks for all of them.

## Try it

1. List the tags. There is a `v1.0-rc` that was pushed by mistake; `git ls-remote --tags origin` shows it on the remote too.
2. Create an annotated tag `v1.0` on the current commit with a short message.
3. Push it with `git push origin v1.0`. Check `git ls-remote --tags origin` again.
4. Remove the wrong tag from the remote: `git push origin --delete v1.0-rc`. Delete it locally as well.
5. Press **Teammate fetches tags**. Switch the graph to the Teammate repo: `v1.0` has arrived.

## What just happened

Tags are refs, like branches, and the remote only learns about the ones you push. Deleting a remote tag is the same push form as deleting a remote branch. Sam's clone picked up `v1.0` on the next fetch; Sam still has a local `v1.0-rc`, because fetch does not delete tags unless asked (`git fetch --prune --prune-tags`).
