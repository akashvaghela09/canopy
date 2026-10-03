A shallow clone cuts history short. A partial clone keeps the whole history but leaves some *objects* on the server until they are needed:

- `--filter=blob:none`: download every commit and tree, but no file contents. Git fetches a blob the moment something needs it: a checkout, a diff, a `show`. History commands like `git log` work without any download because they only read commits.
- `--filter=tree:0`: download commits only; trees and blobs come on demand. Even smaller, but more round trips when you browse old history.

The remote is marked as a *promisor*: it promised to serve missing objects later. `git rev-list --objects --all --missing=print` lists objects and prints missing ones with a leading `?`, which is how you can watch the on-demand fetching happen. The server must allow filtering (`uploadpack.allowFilter`), which this lesson's origin does.

## Try it

1. Make a blobless clone: `git clone --filter=blob:none "file://$PWD/origin.git" blobless`. Go inside and look at the log; it is complete.
2. Count missing objects: `git rev-list --objects --all --missing=print | grep -c '^?'`. Answer the question in the lesson panel.
3. Show the very first commit with `git show $(git rev-list --max-parents=0 HEAD)`. Git fetches the blobs it needs. Count the missing objects again.
4. Back in the lesson folder, make a treeless clone of the same origin named `treeless` with `--filter=tree:0`, and compare `git count-objects -v` in both clones.

## What just happened

The blobless clone started with every commit and tree but only the blobs of the checked-out files. Showing an old commit triggered a fetch of exactly the blobs that diff needed. The remote's config in `.git/config` records the filter (`remote.origin.partialclonefilter`) and the promise (`remote.origin.promisor`), so later fetches keep the same behaviour.
