One global config cannot hold two identities. Includes solve that: a config file can pull in another file, either always or only when a condition holds.

- `include.path = <file>` includes a file unconditionally. People use it to keep aliases or shared settings in a separate file.
- `includeIf "gitdir:<folder>/".path = <file>` includes a file only for repositories under that folder. The pattern must end with `/` to match everything below it, and paths should be absolute (`~/` is allowed).

Both are written with `git config --global`, where the key is `include.path` or `includeIf.gitdir:<folder>/.path`. Git evaluates the condition every time it runs, so a repo that moves between folders changes identity with it.

## Try it

The folder `conf/` holds three ready-made files: `shared.gitconfig` (an alias and a line-ending setting), `work.gitconfig` (name and company email) and `personal.gitconfig` (name and home email). Two repos live here: `work/client-app` and `personal/blog`.

1. Run `pwd` to see the full path of this lesson folder. You need it for every path below.
2. Include `conf/shared.gitconfig` unconditionally in the global config. Then `git st` works in any repo.
3. Add a conditional include for `gitdir:<lesson folder>/work/` that loads `conf/work.gitconfig`, and one for `personal/` that loads `conf/personal.gitconfig`.
4. In each repo, there is an uncommitted file waiting. Commit it in both repos, then check the author of each new commit.

## What just happened

Neither repo has `user.name` or `user.email` in its own config; the identity arrives through the include when git notices which folder the repo is in. Your own name is still in the global file, but the include comes later in that file, so for matching repos its values win. New repos under `work/` get the company identity automatically, which is the point: you set it once and stop thinking about it.
