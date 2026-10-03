A release is a commit with a name. Semantic versioning gives the name a shape, `MAJOR.MINOR.PATCH`: bump PATCH for fixes, MINOR for new features that keep compatibility, MAJOR for breaking changes. The name lives in an annotated tag, which records who made the release and when, and can also be signed (section 15).

Between releases, `git describe` turns any commit into a readable version: `v2.3.0-5-g1a2b3c4` means "five commits after v2.3.0, at 1a2b3c4". Build scripts use it so every build says exactly where it came from. On a tagged commit it prints the tag itself.

## Try it

Lantern is ready for its first release.

1. Set `VERSION` to `1.0.0`, commit, and create an annotated tag `v1.0.0` on that commit. Push the tag to origin.
2. Run `./build.sh` and read what it prints.
3. Add two commits: append `- search notes` to `CHANGELOG.md` and commit; append `- due reminders` and commit.
4. Run `./build.sh` again, or ask git to describe the commit directly. Answer the question in the lesson panel.
5. Set `VERSION` to `1.1.0`, commit, tag it `v1.1.0` (annotated) and push both the commits and the tags.

## What just happened

`describe` output changed from `v1.0.0` to `v1.0.0-2-g...` and then to `v1.1.0`. The number in the middle counts commits since the last release, so anyone running a development build can tell how far it is from a tagged version.
