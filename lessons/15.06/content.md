Both tools bring another repository into yours. They answer different needs.

Choose a **submodule** when the project must pin an exact commit, you will not edit the library here, and you want its history and size kept out of your repository. Everyone pays with an extra step after cloning.

Choose a **subtree** when a plain clone must contain the files, when you expect to patch the library locally, or when the people cloning should not need access to the library's repository. You pay with the library's content in your history.

## Try it

Three libraries are needed. Read each situation, pick the tool, and apply it. Use `icons`, `vendor/utils` and `vendor/fonts` as the paths.

1. **icons**: the design team's icon set. They release often and want every product pinned to one exact release. Nobody edits icons here.
2. **utils**: a small helper library you will patch locally and send fixes back to now and then. New teammates should get the code with a plain clone.
3. **fonts**: a few font files that must be present in every plain clone. Nobody here will ever change them, and they rarely change upstream.

Commit so that the project records all three. `subtree add` needs a clean working tree, so commit the submodule before adding a subtree. Then answer the questions.

## What just happened

One pin that must be exact and stays untouched; two folders that must be present and may be edited. The question to ask is "what does a plain clone need, and who will edit this?", not "which tool is better".
