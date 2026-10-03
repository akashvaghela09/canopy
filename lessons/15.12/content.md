A signature proves that a commit or tag was made by someone holding a private key, and that nothing in it changed since. Git can sign with GPG or, since version 2.34, with an SSH key, which is what this lesson uses (it needs OpenSSH 8.2 or newer). Verification needs an **allowed signers** file: lines of `email public-key` that say which key belongs to whom.

- `git config gpg.format ssh`, `git config user.signingkey <path to .pub>`, `git config gpg.ssh.allowedSignersFile <file>`,
- `git commit -S`, `git tag -s`: sign,
- `git verify-commit <commit>`, `git verify-tag <tag>`, `git log --show-signature`: verify.

## Try it

1. Make a throwaway key inside this folder: `mkdir keys` then `ssh-keygen -t ed25519 -N '' -C canopy -f keys/canopy-key`. Always pass `-f` with a path in this folder: without it, `ssh-keygen` offers your real `~/.ssh/id_ed25519`, outside Canopy. If you ever see that prompt, press Ctrl+C. The `keys/` folder is excluded from commits, so the private key stays out of history.
2. Configure signing for this repository:
   `git config gpg.format ssh`
   `git config user.signingkey "$PWD/keys/canopy-key.pub"`
3. Create the allowed signers file and point git at it:
   `echo "$(git config user.email) $(cat keys/canopy-key.pub)" > keys/allowed_signers`
   `git config gpg.ssh.allowedSignersFile "$PWD/keys/allowed_signers"`
4. Add a line to `CHANGELOG.md` and commit it with `-S`. Then create the signed annotated tag: `git tag -s v1.0 -m "Release 1.0"`.
5. Verify both: `git verify-commit HEAD`, `git verify-tag v1.0`, and `git log --show-signature -1`.
6. Tamper: amend the commit without `-S` (keep the message). Run `git verify-commit HEAD; echo $?`: no output and a non-zero status. `git log -2 --format='%h %G? %s'` shows the difference too: `G` for a good signature, `N` for none. Then answer the question.

## What just happened

The signature covers the whole commit object. Amending made a new object, and git signed nothing because you did not ask, so verification fails on the new tip. The tag still verifies: it points at the original signed commit, which still exists. Set `commit.gpgsign true` to sign every commit by default.
