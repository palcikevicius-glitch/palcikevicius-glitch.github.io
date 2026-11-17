# WISPBOUND V0.1.1

WISPBOUND is an original mobile survivor prototype. This release implements the selected dark folklore concept, 12 base weapons, 24 alternative evolutions and two Ultimate combinations. It supersedes the weapon counts in the earlier concept V2 documents. No slot machine is included.

## Play and install

Open https://wispbound-benas.egna-3646.chatgpt.site/ to play without an account. The download screen is at `/#download` and the Android package is `wispbound-android.apk`. Android requires version 8 or newer and a current system WebView. On iPhone, open the page in Safari and choose Share, Add to Home Screen. The iPhone version is a web app, not a native IPA.

Use the joystick, arrow pad, WASD or keyboard arrows. Attacks are automatic. Collect the blue experience crystals, select gifts on level-up, and move in a closed loop when the ritual meter is full. Each character invokes a different sustained magical ability for seven seconds before bonuses. Pause or return to camp to save an unfinished journey.

The initial character is Rasa, starting with Iron Bell. Buy the other eleven characters with earned gold. Each has a fixed starting weapon and a unique ritual. Picking up a weapon adds it to the Arsenal; undiscovered weapons remain available as level-up gifts.

## V0.1.1 changes

Version sequence: V0.1.0, V0.1.1, V0.1.2. Internal build codes stay monotonic; the current Android build is 112. Main language is English, with Russian and Lithuanian translations.

Normal enemies have 2× previous HP, guardians 3× and main bosses 4×. Bosses clear a circular arena, telegraph attacks for 0.95 seconds and drop a chest with three equipment rewards. Victory waits for the final chest. A maxed loadout receives explicitly labelled supplies. Chest rewards apply once and the reveal survives reload.

All twelve character rituals have sustained combat behavior. A closed movement loop activates a charged ritual. Crown blades deal collision damage throughout their orbit. Raven dives burst on impact, needles pierce, and homing shots have a hard two-second lifetime limit. Evolutions add shields, freezes, roots, cleaves, fragment showers, life steal, moving sanctuaries or burning trails. Evolved gear can gain three chest resonance ranks (+8% damage per rank).

Eight artifacts improve armor (+1), effect duration (+8%), damage (+6%), attack rate (+5%), effect area (+10%), regeneration (+0.25 HP/s), maximum health (+8%) or reach (+8%) per level. Effect area uses a square-root radius multiplier. All cap at three levels, and gift cards show totals before and after.

There are 54 obtainable skills and 80 achievements. Each of six final masteries requires all eight earlier skills in its branch. New challenge counters begin with this update; legacy mid-run history is not used to invent flawless or restricted-loadout wins.

Four new original retro scores run for 3:14–3:28. All scenes are primed by a user audio gesture, with crossfades and a Settings → Play music retry. Pixel sharpness controls render resolution; effect pixel size, intensity and screen shake are adjustable separately. Enemy warnings stay visible above friendly effects.

Profile schema 6, journey schema 5 and envelope 7 migrate earlier saves. Stable storage keys, the Android application ID, native origin and signing identity are retained. New encounter fields default safely, old enemy HP scales once and old collected progress stays intact.

## Historical V0.0.8 changes

The joystick appears centered at the touch-down point anywhere on the arena, then hides on release. A five-pixel dead zone prevents movement from a tap. Only the active finger controls movement; extra touches, buttons, cancelled touches, pause, blur and resize are handled without leaving the hero moving. Joystick size and opacity remain adjustable; arrow-pad placement remains fixed and configurable.

After an update, What’s new shows the newest notes followed by all earlier recorded versions. The Updates screen shows the same complete history below its controls. No save schema or progression changes are made in V0.0.8.

## V0.0.7 changes

The version sequence is now V0.0.5, V0.0.6, and so on. Unread release notes open after installation; Settings → What's new retains the history. The main language is English, with Russian and Lithuanian options.

All 12 bases cap at level 6. Levels 2, 3, 5 and 6 each add one real attack unit: a projectile, raven, returning sickle, pulse, pool, trail, mine, meteor, orbiting blade, flame fan or target according to the weapon. Levels 4 and 6 each add 15 percentage points of attack rate, for +30% at level 6. Every level also adds 10% base damage and 2.5% reach; projectile speed and persistent zone duration improve slightly. Percentages add relative to level 1. Upgrade cards show actual before/after combat values. Evolved forms use mature scaling and their own attack patterns; heavy single-projectile forms remain single-projectile forms.

Amber needles and ravens actively turn toward moving enemies, reacquire invalid targets and use swept collision. Returning sickles curve back to their bearer. Physical SVG weapon illustrations now appear in menus, equipment slots and suitable combat projectiles.

The world contains collidable rocks and trees plus breakable supply crates. Every crate drops one pickup: Time Stop freezes enemies and their contact damage for 8 seconds; Magnet immediately gathers all ground XP crystals regardless of distance; Fireblast damages nearby enemies in a 560-unit radius; Journey XP grants 12 + 2 × journey level XP, before XP bonuses. Pickups last 90 seconds. Broken crates, active pickups and freeze duration survive saving/resuming; deterministic scenery regenerates as the player explores.

Three mini bosses appear per five-minute stage: 1:15 / 2:30 / 3:45, then 6:15 / 7:30 / 8:45, and so on. They drop an Instant Upgrade pickup (five-minute lifetime), one Evolution core and one shard. Collecting it immediately raises a random owned base weapon below level 6; if all are mastered, it upgrades an owned artifact below level 3; if everything is mastered, it grants 75 gold and 25 health. It never consumes a normal level-up choice or invents a new slot. Regular bosses still arrive at 5:00 / 10:00 / 15:00 / 20:00.

Ordinary waves start at three enemies every 0.82 seconds and rise to seven every 0.44 seconds, with a 260-enemy cap. Arrivals are reduced by more than half compared with V0.0.6. Each five-minute stage starts with its weakest tier only, introduces the next tier after two minutes, and adds the third tier in its final minute. The four stages use tiers 1/2/3, 2/3/4, 3/4/5 and 4/5/6. Three visible archetypes distinguish the tiers: wisp, fast claw and armored guardian. Tier HP is 22 times the tier: exactly that many level-1, D-rank, unboosted Iron Bell hits. Stronger weapons still kill faster. Enemy contact damage also rises with tier; their overhead bars show their level.

Crates are walk-through supplies, not colliders. After the first at 0:20, a crate is attempted every 37.5 seconds (about four per 2.5 minutes), with at most four present and a 100-second crate lifetime. Exploration never regenerates crates. Rocks and trees remain solid.

A compact upper-left equipment grid contains six weapon capacity cells and six artifact cells, followed by level/XP. A small elapsed timer sits at the top center and gold at the far right. There is no boss countdown. Ritual charge is shown directly below the character. Eight original physical artifact SVGs replace glyph icons in gifts, the HUD and recipe ingredients. Gift offers rotate through recent history, guarantee an undiscovered family when eligible slots remain, and mix owned upgrades and artifacts. Choices and their rotation state persist across reloads.

## Weapons and recipes

Each base weapon has two alternatives. A journey can take only one branch of a particular base weapon. A direct evolution requires weapon level 6, the listed artifact at level 1 and one Evolution Core. Artifacts are retained. A failed experiment spends nothing. Evolved forms start at their final power; they do not require six more upgrades.

| Base weapon | Evolution A and artifact | Evolution B and artifact |
| --- | --- | --- |
| Iron Bell | Oath Bell + Linen Thread | Mourning Echo + Mirror Shard |
| Amber Needle | Sun Spindle + Ember Heart | Resin Web + Wind Knot |
| Ember Coil | Ember Seam + Linen Thread | Ash Garden + Ember Pouch |
| Spring Vessel | Living Spring + Spring Drop | Frozen Ford + Mirror Shard |
| Ash Raven | Night Flock + Wind Knot | Watch Raven + Ember Heart |
| Thread Spindle | Fate Loom + Mirror Shard | Hush Knot + Linen Thread |
| Hollow Crown | Worldroot Heart + Root Sigil | Hollow Regent + Astral Lens |
| Star Seed | Starfall Choir + Astral Lens | Eventide Comet + Ember Heart |
| Moon Sickle | Silver Reaping + Wind Knot | Blood Moon + Spring Drop |
| Thorn Lantern | Briar Beacon + Root Sigil | Witchfire Lantern + Ember Pouch |
| Grave Compass | Last Procession + Linen Thread | Burial Star + Astral Lens |
| Storm Chime | Thunder Liturgy + Mirror Shard | Tempest Heart + Wind Knot |

The table names the output form followed by its required artifact; the first column supplies its base ingredient.

**Sanctuary of Dawn** combines Oath Bell and Living Spring with one Catalyst. It creates a moving healing and repelling sanctuary. **Solar Loom** combines Sun Spindle and Ember Seam with one Catalyst. It fires eight piercing solar threads and leaves burning seams.

An Ultimate consumes both evolved weapons, occupies two of the six weapon capacity units and cannot evolve again. Only one Ultimate is allowed per journey. Both component orders work. The third boss drops a Catalyst in addition to a Core. Ordinary boss defeats provide Cores; a final boss ends the journey instead.

The in-game Codex has 26 discoverable recipes. Hidden recipes show no ingredient or compatibility hints. After the first successful performance, the recipe and relevant item badges become visible. This development README intentionally contains spoilers.

## Progression and settings

Hero level persists up to 60; journey level resets. Gold and Forge Shards are earned during journeys and claimed once on completion or defeat. Forging is deterministic: D Common, C Uncommon, B Rare, A Epic, S Legendary, SS Mythical, SSS Ancient, SSS+ Divine. Colors progress through black, gray, purple, orange, gold, red, animated fire and a bright luminous finish. Forge gold costs are three times V0.0.5 and shard costs twice V0.0.5; owned ranks retain their value. Each rank adds 6.5% damage in this initial balance.

The constellation tree has 48 distinct talents across six branches: Hearth, Steel, Runes, Gale, Moon and Stars. Every talent has a unique mechanical effect, translated descriptions, branching prerequisites and a cost of 1–3 points. Paths join through either prerequisite, then split into keystones. Effects include armor, emergency healing, one revival, regenerating ward, extra projectiles, criticals, execution, repeat volleys, ritual freeze/nova, dodge, movement attacks, crate loot, rerolls, four-choice gifts and starting weapon levels. The maximum earned budget remains 80 (59 hero levels plus the first 21 discoveries), against a full-tree cost of 90. Respec is free. Changes apply to new journeys. V0.0.6 and older skill allocations are refunded in full; all other progress remains, and an unfinished journey retains its original bonuses until it ends.

Forgotten Village, Drowned Mill and Bellwood last 20 minutes of waves. Lantern Quarry and Glass Marsh last 10 minutes. Bosses arrive at 5-minute intervals. The final encounter starts at 20:00 or 10:00 and may extend the journey. Maps reveal sequentially: Village → Quarry → Mill → Marsh → Bellwood. Defeat the previous map’s final boss to reveal the next map; boss farming does not unlock maps. Locked names, story and duration are hidden behind ???. Maps currently share the prototype arena layout and enemy family with different palettes and story introductions.

English is the default. Russian and Lithuanian cover menus, gameplay descriptions and story introductions. Proper names remain in English. Controls support joystick or arrows, size, opacity, side and bottom offset. Graphics quality changes rendering detail and resolution. Sound quality currently changes effect density, not the source recording bitrate. Music and effect volume are separate. A separate animated title screen precedes camp. Tap to awaken starts title music; Enter camp transitions to menu music. Four arrangements use the user-supplied ReelAudio-74174.mp3 fragment, transformed with DSP and additional synthesized accompaniment: intro (60 s), menu (55.38 s), combat (51.43 s), boss (45 s). Playback crossfades for about 2.2 seconds after the next track starts; active regular bosses override combat music. Returning to camp restores menu music. Music pauses when the app is hidden. These are remixes of supplied material, not wholly original recordings or Terraria/Ori samples. Three new short spirit-impact sounds alternate during kills. Audio is measured at approximately -20 to -18 LUFS, with no clipping and verified MP3 gapless padding. Subjective listening and physical-device audio testing remain to be done.

## Updates

The current release channel is `direct`. The game checks `/release.json` from its fixed release origin. Display version V0.0.6 corresponds to internal build code 106; V0.0.7 must use build 107. The Android manifest and game display the new semantic version. For already-installed V1.04 and older clients, release.json keeps the legacy transport alias version=1.06 and adds displayVersion=0.0.6. Clients compare only monotonic build codes. This compatibility alias lets old clients download the renamed release directly without an intermediate installation. Add a matching changelog entry for every release; packaging refuses a build without release notes.

Android checks the package ID, expected build code, exact byte count, SHA-256 and signing identity before opening Android's installer. The user authorizes installation in the system dialog. The app requests the install-from-this-source permission only when the user chooses to install an update. Failed downloads leave the installed game intact. Progress is stored separately from the APK assets.

The web/iPhone version stages a complete, hash-verified service-worker cache. It changes to the new version only after the user presses Restart & update. A failed staging operation cannot activate a partial new cache. Old caches are retained for other already-open tabs. Applying an update is blocked while a journey remains unfinished; finishing the journey unlocks it. Offline play is available after the first complete cache installation. Device/browser storage eviction can remove web progress, so export a backup.

V0.0.6 reads legacy raw saves and format-2/3 checksummed saves. It writes checksummed format 4 with profile/run schema 3, so older builds protect rather than overwrite newer saves. It keeps the stable `wispbound.save` storage key, `lt.benas.wispbound` Android package, signing identity and `https://wispbound.local/` WebView origin. Automatic saves retain a previous valid copy. Downloading/applying an update creates a verified checkpoint; failure prevents installation. If the primary save is unreadable, a valid backup is restored and the damaged raw data is retained separately. Saves from a newer format are protected from downgrade. Two V1.03 tabs cannot silently overwrite each other's progress.

Hero XP/level, gold, shards, forged ranks, recipes, settings and unfinished journeys are preserved. Pre-V0.0.7 skill points are refunded for the redesigned tree. Base weapon levels 7–8 become the new maximum 6. Older versions did not record map-specific wins or every weapon pickup: migration recovers weapon families from recorded ranks, discovered recipes and the saved journey, and credits a map only when the saved journey records a victory. Other map wins and unrecorded pickups cannot be reconstructed. From this release onward, collected weapons and cleared maps persist explicitly. A manual Export save / Import save is available for changing devices. This is device storage, not cloud sync: uninstalling, clearing application/browser data or storage eviction can erase local copies. Export a file before those actions. Browser and APK progress live in separate containers and transfer through export/import.

Journey XP thresholds are exactly double V0.0.5: the first level requires 22 crystals, then `2 * ceil((8 + level * 3) * 1.35)`. Permanent hero thresholds also double to `240 * heroLevel`. An older unfinished journey retains its current saved threshold until its next level. No earned levels or XP are removed. V0.0.5 saves gain new crate and mini-boss schedules without retroactively spawning missed encounters.

New profiles use English regardless of device language. An explicitly selected RU/LT setting survives updates. The UI has animated entrances, card reveals, lantern glow, drifting fireflies, forge/skill unlock feedback and a rotating evolution seal. Combat adds spirit release bursts, crystal sparkles, projectile trails, rotating ritual marks and boss/evolution celebrations. Reduced-motion preferences suppress decorative motion.

V1.02 fixed offline installation on hosts that inject HTML metadata. V1.03 retains its verified plain-text canonical shell and atomic asset cache.

Store migration requires a new store build, not only a server switch. Remove `REQUEST_INSTALL_PACKAGES` and the direct installer from the Google Play variant, use Play In-App Updates or the store listing, raise the Android target SDK to the current requirement and configure store signing so existing direct installs can migrate where supported. The manifest already supports a `store` channel and store URLs, but native Play integration is future work. A native iOS release needs Apple's build and distribution process.

This personal APK targets API 35 using the available local toolchain. It is not a Google Play submission package; the researched current Play target requirement is API 36. No store account, listing or paid service was created.

## Source and release workflow

The source uses buildless JavaScript modules and Canvas 2D, packaged in a small native Android WebView shell. No runtime framework dependency is needed.

1. Run `node --test tests/*.test.mjs`.
2. Run `node scripts/serve.mjs` and use the printed local address for browser checks.
3. For a new release, change `VERSION` in `dist/catalog.js` and the Android manifest version together. Keep the package ID and signing identity unchanged.
4. Run `python android/build.py --tools PATH_TO_ANDROID_TOOLS --build NEW_EMPTY_BUILD_DIRECTORY --signing EXISTING_PRIVATE_SIGNING_DIRECTORY --output dist/wispbound-android.apk`.
5. Run `node scripts/release.mjs` to hash the final APK and cache assets. Do not edit any `dist` assets after this step; repeat the build and manifest generation if source changes.
6. Publish the exact source/build via the Sites workflow, preserving `.openai/hosting.json` and its project ID. Verify the public release manifest and downloaded APK hash.

The private signing key and password remain outside this source tree, in the original workspace's `work/wispbound-signing` directory. They are excluded from the source archive, hosting and APK. Preserve both files and back them up securely before future releases. Losing the key prevents normal updates of existing installations.

Export/import uses a local JSON file. Existing progress is not shared with a server. Updates and site requests may be logged by the hosting provider. There are no accounts, advertisements, purchases or gameplay analytics in this build.

## Verification and remaining work

V0.0.7 tests cover all stage boundaries, reduced arrivals and the population cap, weighted tree paths, actual V0.0.6 envelope migration, all 48 mechanical effects across combat/defense/ritual/movement/loot/progression, one-time revival/reroll persistence and music transitions. Save profiles and runs use schema 4 inside envelope format 5. Existing stable storage keys, package ID, signing identity and WebView origin remain unchanged.

The automated suite covers the exact roster counts, all 24 evolution paths, both Ultimate combinations in both orders, recipe discovery, weapon capacity, duplicate prevention, forging, skill prerequisites, save validation, one-time reward claims, boss timing and a 20-minute engine stress simulation. Service-worker tests cover staging, tampered assets, offline navigation and explicit activation. The stress simulation grants extra health to exercise the complete timeline; it is not a balance or difficulty certification.

The automated suite also covers the new tier boundaries, 12-guardian schedule, instant upgrades and fallback, crate caps and traversal, rotating discovery offers, six-by-six limits, doubled XP, forge costs and V0.0.5 migration. It also covers sequential-map gating, collected-weapon gating, actual attack-count upgrades for every family, breakable crates, deterministic scenery/collision, all four powerups, mini-boss rewards, schema-one migration and legacy-to-semantic version compatibility. It retains V1.04 tests for moving-target hits, reacquisition, piercing, boss priority, finite projectile lifetime, every base weapon level, real extra projectiles, evolved scaling, and release-note persistence. V1.03 adds tests for lossless legacy-save migration, corrupt-save recovery, full-storage failures, stale-tab conflicts, future-format protection, XP pacing and blocking updates after save failure. A real browser V1.02-to-V1.03 update was completed through the in-game buttons; the exported profile and journey matched exactly before and after. V0.0.5 browser checks cover locked map cards, collected-only Arsenal, overhead health bars, physical weapon sprites, actual Time Stop pickup, the 4:00 guardian, applying a level-6 upgrade, legacy-profile gold/rank/discovery preservation and 390-pixel mobile layout. Earlier checks cover settings, language changes and version checking. V0.0.6 browser checks verify the six-by-six mobile HUD, all eight rank colors and animations, physical artifact icons, exact upgrade previews and an Instant Upgrade pickup raising Iron Bell from level 1 to 2. APK compilation and Android v2/v3 signatures were verified. Installation, the Android permission/installer flow, physical phone performance and an installed APK-to-APK upgrade still require a device test. No native iPhone binary is supplied.

Combat art is currently drawn in code. The painted cover is concept art for the intended final art direction. Weapon-specific Canvas animation now distinguishes ravens, sickles, lightning, needles, water, flame, thread, meteors, mines, orbits and pulse effects, including evolved variants. Weapons are no longer shown in the hero’s hand. Kills release directional blood particles and short-lived ground stains. Low quality and reduced motion reduce effect detail. More enemy types, distinct map geometry, character unlocks and further art/audio polish remain future work.

## Platform references

- Android installer: https://developer.android.com/reference/android/content/pm/PackageInstaller
- Local WebView content: https://developer.android.com/develop/ui/views/layout/webapps/load-local-content
- Service-worker updates: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/update
- Google Play target API: https://support.google.com/googleplay/android-developer/answer/11926878
- Google Play update restrictions: https://support.google.com/googleplay/android-developer/answer/16559646
- Apple app review rules: https://developer.apple.com/app-store/review/guidelines/

Platform requirements were researched on 12 October 2026 and must be checked again before store submission.


## V0.1.0 pixel art

The renderer uses twelve original 32x40 four-frame hero sheets, six 24x32 enemy sheets and dedicated guardian/Bell Keeper sheets. Menus use matching full-body portraits, 32x32 physical item icons and a 256x224 forest chapel scene. All SVG artwork is composed of integer pixel rectangles; canvas and CSS use nearest-neighbor sampling. Map tiles are cached 32x32 canvases. Weapon geometry is drawn to a half-resolution transparent effect layer, then composited with nearest-neighbor scaling; gameplay geometry and hit detection are unchanged. Off-screen actors are culled from drawing. Reduced motion disables sprite cycling and decorative motion.

Reference: the general proportions and readability of the official Poncle screenshot at https://x.com/poncle_vampire/status/1658487553358696455 . No third-party sprites or textures are used.

Save envelope 6, profile schema 5, run schema 4, storage key, native origin, package ID and signing identity are unchanged.

Release numbering: this pixel-art release is V0.1.0. Subsequent releases use V0.1.1, V0.1.2 and so on; Android/internal build numbers continue increasing independently.
