`ledger` prints the balance of a CSV book. Between releases 2.0 and 2.1 it started dropping the cents (`12.34` became `12`); a later release fixed it. The team also wonders what happened to `scripts/export.sh` and to `NOTES.txt`.

The repo has four releases (`v2.0` to `v2.3`), a maintenance branch `maint/2.1`, four authors and a test: `bash tests/balance.sh` exits 0 when the balance is correct. There are no steps this time. Pick the tool that fits each question in the lesson panel, and leave no bisect running when you are done.
