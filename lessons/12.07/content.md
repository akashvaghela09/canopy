Gitflow is a branching model with long-lived lanes and strict rules about which branch merges where:

- `main` holds released versions only. Each merge into it is a release, marked with a tag.
- `develop` is where finished features gather for the next release.
- `feature/*` branches start from `develop` and merge back into `develop`.
- `release/*` branches start from `develop` when a release is being prepared. Only version bumps and last fixes go there. The release merges into `main`, gets tagged, and merges back into `develop` so those fixes are not lost.
- `hotfix/*` branches start from `main` for urgent fixes to a release, and merge into both `main` and `develop` (or into the current `release/*` branch, if one is open).

Every merge uses a merge commit, never a fast-forward, so the graph shows where each branch began and ended. Gitflow fits projects that ship numbered versions; teams that deploy continuously usually find it heavy.

## Try it

`main` is at `v1.0.0` and `develop` is one commit ahead. Take a feature all the way to a release.

1. Create `feature/login` from `develop`. Add `src/login.js` containing a line `// Lantern: login`, commit it.
2. Merge the feature into `develop` with a merge commit.
3. Create `release/1.1.0` from `develop`. Change `VERSION` to `1.1.0` and commit it there.
4. Merge the release into `main` with a merge commit, then tag `main` with an annotated tag `v1.1.0`.
5. Merge the release into `develop` with a merge commit as well.

## What just happened

Watch the lanes in the graph: `main` has gained one merge commit, tagged `v1.1.0`, after `v1.0.0`. `develop` has absorbed the feature and the release. The release branch can be deleted now; the merge commits keep its history readable.
