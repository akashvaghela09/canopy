# Lesson content updates

Lessons are data (`lessons/`), separate from the app. Learners can pull new or fixed lessons from the repo without installing a new Canopy.

## How it works

1. **Publishing.** When `lessons/` changes on `main`, `.github/workflows/lessons-release.yml`:
   - tests every lesson (`canopy-lesson test`),
   - stamps `contentVersion` as `YYYY.MM.DD.<run>`,
   - packs `lessons/` into `canopy-lessons-<version>.tar.gz` (`tools/package-lessons.sh`), without `_notes` and `_reviews`,
   - signs it with minisign (`<pack>.minisig`),
   - publishes a release `lessons-<version>` and uploads `latest.json` to the fixed release `lessons-latest`.
2. **Checking.** In the app, Settings → Lessons → **Check for updates**. This is the only time Canopy goes online. It fetches `latest.json`:
   ```json
   { "contentVersion": "2026.11.02.7", "formatVersion": 1, "url": ".../canopy-lessons-2026.11.02.7.tar.gz",
     "sha256": "…", "size": 1880000, "changelog": "- Fix 6.15 wording" }
   ```
   A newer `contentVersion` with the same `formatVersion` can be installed. A higher `formatVersion` needs a newer app and is only reported.
3. **Installing.** Download (max 64 MB) → SHA-256 check → minisign signature check against the public key built into the app → unpack into `content/staging` (paths that escape the folder are refused) → load and validate with the same validator CI uses → swap into `content/current` (the previous copy is kept as `content/previous`) → reload.
4. **Using.** On start, the app uses `content/current` if it is newer than the lessons bundled with the app; otherwise the bundled copy. Progress is keyed by lesson id, so it is never affected. If the open lesson changed, the learner is told to reset it.

Why signatures are mandatory: lesson `setup.sh` and action scripts run on the learner's machine. An unsigned or tampered pack is never installed.

## One-time setup

1. Generate a signing key pair (keep the secret key safe; it is the only way to publish packs):
   ```sh
   minisign -G -p canopy-lessons.pub -s canopy-lessons.key
   ```
2. In the GitHub repo settings, add secrets `MINISIGN_SECRET_KEY` (contents of `canopy-lessons.key`) and `MINISIGN_PASSWORD`.
3. The official feed URL and public key (`canopy-lessons.pub`, committed in the repo root) are built into the app by default (`src-tauri/src/updates.rs`). Keep `canopy-lessons.key` out of the repo (it is git-ignored) and store it somewhere safe. A fork can override both at build time:
   ```sh
   export CANOPY_CONTENT_FEED="https://github.com/<owner>/<repo>/releases/download/lessons-latest/latest.json"
   export CANOPY_CONTENT_PUBKEY="<the base64 key line from canopy-lessons.pub>"
   pnpm tauri build
   ```
   A build without these shows "no lesson update source configured" and works offline as usual.

## Rules for content changes

- Never renumber or reuse a lesson id; retire a lesson with `flags: [retired]`.
- Bump `formatVersion` in `lessons/manifest.yaml` only together with an app release that reads the new format.
