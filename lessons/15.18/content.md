Lantern 2.0 ships today. A throwaway signing key pair is waiting in `../keys` (`release-key`, `release-key.pub`); a colleague's clone at `main` is in `../colleague`; the greeting library lives in `../lib.git`.

Deliver, in this repository and the lesson folder:

- the library vendored at `vendor/lib` so that a plain clone, and the release archive, contain its files;
- the three commits of the `search` branch exported as a patch series into `../outbox`, ready for the colleague to check;
- a signed annotated release tag `v2.0` on `main` that verifies with the key in `../keys`;
- a release archive `../release-2.0.tar.gz` of that tag, with everything under `release-2.0/`, without `tests/`;
- a bundle `../app.bundle` carrying `main` and the `v2.0` tag, for offline transfer.
