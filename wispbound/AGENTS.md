# WISPBOUND publishing and delivery

- Talk to the user in Lithuanian. Never show or commit the Android signing key or its password.
- Active source: this folder (`wispbound/` in the `palcikevicius-glitch.github.io` repository).
- Public game and update origin (GitHub Pages, from `main`): https://palcikevicius-glitch.github.io/wispbound/dist/
  - `release.json`, `wispbound-android.apk` (stable name used by the in-app updater), versioned APK, `atsisiusti.html`.
  - The repository root belongs to another app (Autoknygelė). Do not change files outside `wispbound/`.
- Android: package `lt.benas.wispbound`, WebView origin `https://wispbound.local/`, save keys `wispbound.save` / `wispbound.profiles`, envelope 9, schema 6. Never change these; never uninstall for an update.
- V0.2.0 (build 125) moved the updater from the old chatgpt.site address to GitHub Pages. Installs older than build 125 need one manual APK install; later updates work in-app.
- Versioning: V0.2.0, V0.2.1 … V0.2.9, V0.3.0 …; V1.0.0 is the Google Play release. Until then the game is a public Beta (`VERSION.beta`). Android build numbers always increase (next: 127).
- Release steps: update `VERSION` (dist/catalog.js), AndroidManifest versionCode/Name, package.json, changelog entry + LT/RU rows in content-i18n.js; run tests; build APK with `android/build.py` into a fresh build dir using the original signing folder (kept outside the repo); copy to `wispbound-vX.Y.Z-beta-buildN.apk`; run `node scripts/release.mjs` last; update `atsisiusti.html` and QR (`python3 scripts/qr.py URL out.svg`).
- After every published update give the user: versioned APK, verified public APK link and a version-labelled QR for the direct APK.
- Second 3D line (V0.2.0 TEST build 123) is archived separately; do not merge it unless asked.
