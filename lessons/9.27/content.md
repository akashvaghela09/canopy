Your branch `feature/export` is on origin, waiting for review, and the reviewer sent it back: the history is a mess. Meanwhile Sam pushed a commit to `main` that touches the README.

Turn the branch into this series, in this order, on top of the latest `origin/main`:

1. `Add export button` (with the button label fix folded in)
2. `Add CSV export` (the message currently has a typo)
3. `Add tests for CSV export`
4. `Add export settings` (only `settings.js`)
5. `Fix README typo` (only `README.md`)

The current last commit mixes the settings and the README fix; split it. Where your README fix meets Sam's change, keep both: the line should read `Exports data as CSV or JSON files.` When the series is clean, update the branch on origin without endangering anyone else's work.

The goals in the lesson panel describe the target; the order of your steps and the commands are up to you.
