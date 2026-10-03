`.gitattributes` tells git how to treat files by path pattern. It is committed, so every clone follows the same rules. The attributes you will meet most:

- `text=auto`: git decides per file whether it is text; text files are stored with LF line endings, whatever the operating system wrote. `* text=auto` as the first line is the usual default.
- `eol=lf` / `eol=crlf`: force the line ending in the working tree for a pattern, for example shell scripts that must stay LF.
- `binary`: never normalize, never diff, never merge line by line.
- `-diff`: treat as text but do not show diffs (minified or generated files).
- `export-ignore`: leave the path out of `git archive` output.

Files that were committed before the rules existed keep their old line endings, even when you edit and add them again. `git add --renormalize .` re-stages every tracked file through the current rules.

## Try it

`notes.txt` and `scripts/build.sh` were committed with Windows line endings (CRLF). `assets/logo.png` is an image, `vendor/lib.min.js` is minified, and `docs/internal.md` should stay out of release archives.

1. Create `.gitattributes` with rules for all five cases listed above.
2. Run `git check-attr -a notes.txt` and `git check-attr -a assets/logo.png` to see which attributes apply.
3. Renormalize the existing files with `git add --renormalize .`, look at the status, and commit everything.
4. Answer the question in the lesson panel.

## What just happened

The commit stores `notes.txt` and `build.sh` with LF endings, so diffs between people on different systems stop showing every line as changed. The image is protected from any text handling, the minified file no longer floods diffs, and `git archive HEAD` would leave `docs/internal.md` out.
