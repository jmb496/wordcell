# Review log — spec-epic-7-pwa-release (SPEC.md + companions)

State: pass 3: done

Target: `_bmad-output/specs/spec-epic-7-pwa-release/` (SPEC.md, rule-coverage.md, device-checks.md, release-checklist.md, build-notes.md). Mode: docs, thorough, max 7.
Pre-loop: HEAD fe1ba6f6def230a892e73fe006281307df31247e; copies at `SPEC.review-log.passes/pass0/`; words 5770 (SPEC 2737, build-notes 911, device-checks 1034, release-checklist 593, rule-coverage 495).
Owner constraints: no update prompt (AD-16 stands; the Open Question stays open for the owner); merging and pushing stay with the owner.

## Pass 1 — 2026-10-29
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 18, minor 13, decision-needed 0  |  Dropped in triage: 0 (duplicates merged across lenses)
Words (docs): 7455 (1.29 x pass 0)  |  Snapshot: SPEC.review-log.passes/pass1/ (fix diff pass1.fix.diff)
Fixer: all 30 applied; F17 added (sw.ts import rejection); tool claims checked against Playwright 1.63.0 / workbox-window 7.4.1 / current dist; unverified: chrome://serviceworker-internals "ACTIVATED" on Android (G2), splash as cold-start sign (G4), Chrome tab keeps B waiting (G3) — device-only facts.
### Applied
- [major] SPEC F6, build-notes Playwright mechanics — `serviceWorkers: 'block'` in a `pwa` spec makes `Workbox.register()` reject (Playwright's stub resolves `undefined`), so CAP-1 throws to AD-15 → fixer item 1
- [major] SPEC CAP-4, F8, build-notes Update — a byte-changed `sw.js` alone yields no observable new build (same assets, `build:test` pins the footer) → fixer item 2
- [major] SPEC CAP-4, rule-coverage Q-40/A-A15 rows — "every window" never exercised (one page only) → fixer item 3
- [major] SPEC CAP-2, build-notes precacheComplete — AD-17 types it `boolean` but its definition needs async Cache Storage; build-time URL list impossible (circular revisions) → fixer item 4
- [major] SPEC CAP-1, build-notes state — no precedence for active+installing/waiting, missed pre-load updates, sticky `failed`, superseded redundant → fixer item 5
- [major] SPEC CAP-1/CAP-3, build-notes Boot — failure reporting path vs the awaited attempt unspecified; persistence-after-failed-registration branch untested → fixer item 6
- [major] rule-coverage AD-16 order and AD-7 rows, CAP-3 — `main.ts` order and "once per launch" claimed by shell Vitest that cannot see them (`storage.ts` is stateless, AD-7) → fixer item 7
- [major] rule-coverage "no skip-waiting message sent" (B), CAP-1 — the bundled workbox-window chunk contains `SKIP_WAITING`, so a build scan cannot prove it → fixer item 8
- [major] SPEC CAP-6, rule-coverage AD-18 row — `size-budget.test.mjs` runs in the unit suite before `build` in `test:all`/CI → fixer item 9
- [major] SPEC CAP-5, rule-coverage Q-40 — precache-failure branch (install turns redundant) has no Playwright case → fixer item 10
- [major] device-checks G3, release-checklist step 4, CAP-10 — sequence omits the launch that fetches B; "window still open" not achievable as written; same-origin Chrome tabs count as windows; tailnet vs production installs → fixer item 11
- [major] device-checks G4, release-checklist §6.2 — omits brief §6.2 "finish recorded then undone" boundary; force-stop target unnamed → fixer item 12
- [major] SPEC CAP-10, F11, release-checklist — branch for the post-merge release commit and fixes, version of a post-merge fix, footer per production row/game unspecified → fixer item 13
- [major] release-checklist §6.4 / Done when 3 — id-level audit weaker than brief §6.4 and AGENTS.md sentence coverage; Q-ids not in §2–§7 → fixer item 14
- [major] SPEC CAP-7, build-notes Device tooling — once a worker controls the origin, NavigationRoute answers `/seed.html` with the app; "Repeat step 3" breaks → fixer item 15
- [major] device-checks G18/G19, release-checklist Done when 1 — epic 6 A10 left unreviewed by owner decision 2026-10-16; spec makes it gating without citing that → fixer item 16
- [major] SPEC F4, CAP-9 — F4 contradicts AD-15 "a fatal during boot does not stop boot()" (and AD-7 "failed" settle); CAP-9 sync omits AD-15/AD-7; no test for halted → no register/persist → fixer item 17
- [major] SPEC CAP-1 — a rejected `import('./shell/sw')` in production (AD-8's stale-hash case) is unspecified, so rule 6 would show the fatal surface → fixer item 18
- [minor] CAP-2 intent "controls the page" (no `clientsClaim`) → item 19; §6.9 row and SPEC Open Questions → item 20; hook-free Q-40 placement in `dist-smoke` testMatch, assert route hit → item 21; G16 pass criterion → item 22; §6.7 process sentence → item 23; D-only rows under the A-A15 fallback → item 24; Q-42 hold the retry pending → item 25; CAP-9 Device and Desktop rows → item 26; G3 failure is an owner question → item 27; order proof records settle → item 28; ten-game trigger wording in the Open Question → item 29; G2 readiness step → item 30
### Default applied (technical)
- F6 — `block` allowed only in `dist-smoke`; `pwa` specs keep `allow` and use `context.route` or wait for `precacheComplete()`
- F8 — routed B `sw.js` changes the `index.html` precache revision; B's `index.html` carries a distinct marker; assert A while waiting, B only after every page closed
- precacheComplete — keep AD-17's `boolean`; env-gated code recomputes asynchronously and returns the last value; Playwright polls; URL list parsed from fetched `/sw.js`
- swState precedence — `failed` sticky for the launch > waiting > installing > active > unregistered; read the registration's workers after `register()` resolves; superseded redundant is not a failure
- failure reporting — attempt promise always resolves after `failed`; hook builds report via `reportError` → AD-15; production requests persistence after a failure (`dist-smoke` proves it)
- SKIP_WAITING proof — shell Vitest with a faked Workbox + `src/` source scan; B only for generated `sw.js`
- size-budget real build — `postbuild` failure when the manifest has `src/shell/sw.ts` without a dynamic edge, plus a `build-output.spec.ts` case reading `.vite/manifest.json`
- release commit / post-merge fixes — locally on `pwa-release` brought up to date from `main`; owner merges and pushes; a fix keeps `1.0.0`, differs by SHA
- sw.ts import rejection — Q-40 failure (`failed`, silent in production, thrown in hook builds); `dist-smoke` case 404s the chunk
- G18/G19 — optional owner rows outside Done when 1, citing the 2026-10-16 decision, unless Jared reinstates them
### Decision needed (functionality / UX / gameplay)
- none new (the SPEC's three Open Questions remain the owner's)
### Dropped
- none

## Pass 2 — 2026-10-29
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 13, minor 16, decision-needed 0  |  Dropped in triage: 1
Words (docs): 8427 (1.46 x pass 0)  |  Snapshot: SPEC.review-log.passes/pass2/ (fix diff pass2.fix.diff)
Fixer: all 28 applied; checked `npm version 1.0.0 --no-git-tag-version` (npm 11.12.1, throwaway copy: sets package.json and both package-lock.json root versions, no commit/tag), `git merge --ff-only`, Playwright 1.63.0 `Request.serviceWorker()`, workbox-window markers; phone-only facts marked (unverified) in the documents.
### Applied
- [major] G3, release-checklist step 4, CAP-10 — the expected Q-38 halt covers the board and the menu footer (`Menu.svelte` only); footer unreadable as written → fixer item 1
- [major] CAP-1/F17, rule-coverage F17 row — hook-build branch of a rejected `sw.ts` import (fatal, `failed`, no persistence) untested → item 2
- [major] release-checklist header/closing vs step 2 — G1/G2/G4 read before the 1.0.0 commit cannot meet "every production row records `1.0.0`" → item 3
- [major] CAP-6, build-notes Packaging — `workbox-window` imported only by `sw.ts` is inlined into its chunk; no manifest key to assert → item 4
- [major] CAP-7, `device-preview.mjs:106` hint — "clear site data after every build" wipes build A, defeating G3's tailnet update read → item 5
- [major] CAP-1, build-notes Failure — "this launch's own installing worker" undefined for a worker installing before `sw.ts` loaded and an update failing under an active worker → item 6
- [major] G16, release-checklist §6.3 — brief §6.3: a misdrop or lost drop breaks the consecutive run; unstated → item 7
- [major] G3, release step 4 — no readiness step before closing every window (B may still be installing; failure routed to an owner question) → item 8
- [major] release-checklist §6.3 — game seeds are shown nowhere in the UI (`src/ui` has no seed render) → item 9
- [major] F11, release step 3 — "brought up to date with `main`" unowned; an agent `git merge` would be an agent merge → item 10
- [major] CAP-10, release step 1 — "after the owner's go-ahead the epic merges" reads as an agent merge; Jared merges and pushes → item 11
- [major] build-notes Boot, CAP-3 — `main.ts` calling `storage.ts` `requestPersistence()` breaks AGENTS.md "storage.ts is called only by the shell stores" → item 12
- [major] build-notes precacheComplete, CAP-2/CAP-4 — background recompute fetches the un-precached `/sw.js`, which rejects offline (AD-15) and breaks the §6.8 offline test → item 13
- [minor] items 14–29: setter ownership (F1/build-notes vs F17); F5 "dev" wording vs F3; F4/F17 row keys to convention ids; EXPERIENCE.md A-E4 Assumptions row in the CAP-9 sync; §6.6 reproduction tests for fix tickets; G4 aggregate statistics; `unverified` device claims in G2/G4; synthetic test for the new size-budget failure branch; P7-turned-D rows are §6.4 gaps Jared accepts; F6 `context.route` caveat for failing precached URLs; route-hit / worker-origin / redundant-wait assertions in the Q-40 `dist-smoke` cases; `package-lock.json` version; Done when 3 exemptions sentence-level only; `--history` argument parsing and history-only seed; merge the duplicate activation rows
### Default applied (technical)
- Q-38 during G3 — a window showing the other-window message is read by tapping its Reload then opening the menu footer (a reload never activates the waiting worker, A-A15)
- F17 hook build — a `pwa` case routes the `sw.ts` chunk to 404: fatal surface, `swState()` `failed`, no `persisted`/`persist`
- production rows before 1.0.0 — each row records the footer it was read on; rows read on the merged pre-release build count for 1.0.0 because the release commit changes only the version (F12)
- workbox-window placement — assert the `src/shell/sw.ts` key is a dynamic entry outside the counted set; prove `workbox-window` by content (`messageSkipWaiting`, `serviceWorker.register` only in files of the `sw.ts` closure)
- device-preview hint — clearing site data is required before a seed or fresh install; the G3 update read is the named exception (hint printed only with a seed fixture, or an `--update-read` flag suppresses it)
- redundant worker — any installing worker `sw.ts` observes this launch (present at `register()` or found later, first install or update) turning redundant without a newer installing/waiting worker → `failed`
- G3 readiness — wait about a minute on Wi-Fi or see the new version WAITING in chrome://serviceworker-internals before closing every window
- §6.3 evidence — date, outcome, final score, committed-word count and footer from the end sheet; seeds not required
- branch update — the agent only fast-forwards (`git merge --ff-only main`), else stops for Jared
- `requestPersistence()` in `main.ts` — kept per AD-7/AD-16; CAP-9 `bmad-project-context` edit names it as the one exception
- precacheComplete — recompute only on a call (never at boot or activation); URL list read once from `/sw.js` while online and kept; offline spec stops polling before `setOffline(true)`
- §6.3 run — a misdrop or lost drop resets the count to zero (brief §6.3); a stuck drag that loses the drop counts as a lost drop, otherwise a finding
### Decision needed (functionality / UX / gameplay)
- none new
### Dropped
- CAP-8 "only comments, tests, helpers and tooling change" too narrow — the restriction is the methodology's sweep rule (cited "user direction"), not a defect

## Pass 3 — 2026-10-29
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 6, minor 15, decision-needed 0  |  Dropped in triage: 0
Words (docs): 9228 (1.6 x pass 0)  |  Snapshot: SPEC.review-log.passes/pass3/ (fix diff pass3.fix.diff)
Fixer: all 21 applied; repo facts checked (size-budget closure/`manifest[...].file`, architecture-scan exclusions, device-preview hint line, spine AD-16 Binds and Structural Seed); unverified (design statements for the plan): `reportError` via `page.evaluate` reaching the AD-15 handler, `getRegistration()` activated gate; device-only steps marked (unverified) in the documents.
### Applied
- [major] CAP-6, rule-coverage AD-18, build-notes Packaging — the `sw.ts` static closure includes the entry chunk (F1's shared state module lives there), so "markers only in the `sw.ts` closure" is vacuous → fixer item 1
- [major] CAP-9, F11, release-checklist §6.6 — "records why the bug is device-only" is an exception brief §6.6 does not give → item 2
- [major] release-checklist §6.4 / Done when 1 — pass-2 accepted-gap path contradicts "gaps become fix tickets" and "checked and passing" → item 3
- [major] CAP-5, rule-coverage Q-40 (F17), build-notes — F17 `dist/` "persistence still requested" has no assertion → item 4
- [major] rule-coverage AD-16 AD-7 (F4) — "the plan picks the halting mechanism" lets a pre-mount halt pass without reaching the new post-dictionary `halted()` check → item 5
- [major] G3, release step 4, build-notes update read — "launch once" not required cold (a resume fetches nothing), readiness optional, every failure routed to an owner question; no recovery for a spoiled production read → item 6
- [minor] items 7–21: source-scan scope excludes tests (as AD-1's scan); precacheComplete returns false without fetching until an activated worker exists; one hint rule (print whenever a seed page is written; no `--update-read`); one re-read rule for fixed/touched rows; F12 carry-over limited to G1/G2/G4, ten-game run only on a `1.0.0` footer; CAP-3 ticket cites the AGENTS.md storage exception; release commit inside the CAP-10 plan (§6.7); CAP-9 failure routes include owner questions; spine sync adds the state module to AD-16 Binds and Structural Seed; stub `persisted()` false and assert one `persisted` then one `persist`; marker-B page also asserts a controller and `swState()` `active`; G3 discarded-renderer note; Success signal allows the accepted D gap; `navigator.storage` in the AD-1 single-owner scan; rename rule-coverage "Exempt" to "Covered elsewhere" except A-A3
### Default applied (technical)
- workbox-window placement — markers occur in no file of `index.html`'s counted closure (entry static and dynamic closure, not following the `sw.ts` edge) and do occur in the `src/shell/sw.ts` chunk's own file
- §6.6 device-only — recorded as a §6.6 gap with its reason, accepted by Jared in the epic Notes, listed in the audit, not counted as met
- §6.4/§6.6 gaps — "every other gap becomes a fix ticket"; a criterion counts as checked when each remaining gap is one Jared accepted
- F4 test — hold the dictionary route, halt the page after mount (e.g. a Q-38 write from a second page or `reportError`), fulfil; assert no `register`, `persisted` or `persist`
- G3 — start with every WordCell window closed; readiness before close-all; owner question only for activation timing once B was seen waiting, otherwise a fix ticket; a spoiled production read rests on the tailnet G3 read or is redone at the next deploy
### Decision needed (functionality / UX / gameplay)
- none new
### Dropped
- none
