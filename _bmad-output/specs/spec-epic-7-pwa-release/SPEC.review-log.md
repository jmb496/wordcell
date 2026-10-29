# Review log — spec-epic-7-pwa-release (SPEC.md + companions)

State: pass 6: done

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

## Pass 4 — 2026-10-29
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment (late-pass bar)  |  Findings: major 4, minor 19, decision-needed 0  |  Dropped in triage: 1
Words (docs): 10098 (1.75 x pass 0)  |  Snapshot: SPEC.review-log.passes/pass4/ (fix diff pass4.fix.diff)
Fixer: all 21 applied (11/14 overlap resolved: a deferred ten-game question means its proposed default); checked `computeBudget` returns `{ rows, total, errors }`, `strip(sf, keepStrings)`, workbox-window 7.4.1 / vite-plugin-pwa 1.3.0 `^7.4.1`, `page.clock`, `context.serviceWorkers()`, dictionary `TIMEOUT_MS = 30_000`; unverified: Playwright#14711 routing limit on 1.63, `self.serviceWorker.state` activation poll, Firefox repeat prompt (marked in SPEC).
### Applied
- [major] rule-coverage F4 row, build-notes Boot — a halt after mount but before the dictionary request returns at the existing post-`whenVisible()` check; no sync point before the empty-call assertion; a halt during the pending `sw.ts` import still registers (gating test can pass vacuously) → fixer item 1
- [major] release-checklist Evidence kinds, Done when 1, §6.4/§6.6 — "counts as checked" redefines the initiative's "checked and passes" → item 2
- [major] SPEC CAP-9, build-notes Close-out — new scans (`navigator.storage` single owner; skip-waiting/`updateSW` ban) not synced into spine AD-1 (the scan-list authority) or AGENTS.md Single owners → item 3
- [major] SPEC CAP-4/F8, CAP-5, build-notes, Assumptions — the update proof and `/sw.js`-unavailable cases rely on `context.route` for the worker main script; Playwright documents updated-main-script fetches as unroutable (microsoft/playwright#14711; not in the pinned types, unverified), and the Assumption would turn a tooling limit into an accepted D gap → item 4
- [minor] items 5–23: G3 discarded-renderer note conditional on the tab; spoiled-read definition, tailnet A readiness, tailnet read for Done when 2 only when production spoiled; no-fixture hint; counted-set wording per `computeBudget` and one build-output bar; unconditional `workbox-window` dependency + Scaffold deltas; skip-waiting scan with strings kept; Firefox OQ wording and §6.9 deferral scope; G28 disposition label; dev-path, timeout-path and no-`sw`-chunk-in-dev tests; ten-game rule if that OQ is deferred; wait for B activation before opening the page; F6 remedy limited and handler-hit assertions; in-page URL extraction; CAP-3 halting wording; production G4 by play; G5–G7 in the installed app; §6.4/§6.6 audits before the merge
### Default applied (technical)
- F4 test — halt only after the dictionary route handler received the request; init script and route on the first page only; after fulfil, poll `dictionaryState()` out of `loading` and let a macrotask pass; add a `halted()` check between the `sw.ts` import resolving and the registration attempt
- accepted gaps — recorded as "checked, not passing"; any such gap at declaration needs Jared's explicit waiver of initiative Done when 1 for that criterion in the initiative Notes
- update and `/sw.js` cases — the spec serves a temp copy of `dist-test/` with its own Node static server and swaps `sw.js`/`index.html` A→B on disk (or removes `sw.js`); `context.route` only for worker-originated precache fetches; the D fallback only when Chromium's activation timing itself differs, never for a routing limit
### Decision needed (functionality / UX / gameplay)
- none new
### Dropped
- CAP-8 "allow technical production fixes in the sweep" — repeat of pass 2's dropped item (methodology's sweep rule, "user direction")

## Pass 5 — 2026-10-29
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment (late-pass bar)  |  Findings: major 2, minor 19, decision-needed 0  |  Dropped in triage: 0
Words (docs): 10942 (1.9 x pass 0)  |  Snapshot: SPEC.review-log.passes/pass5/ (fix diff pass5.fix.diff)
Fixer: all 20 items applied; checked `e2e/helpers.spec.ts`, `PORT = 4173`, `playwright.pwa.config.ts` testIgnore/testMatch (new `e2e/pwa/sw-failure.spec.ts` runs under `pwa` only), fixtures `session-place-free-letter-redo-tail.json` and `session-gave-up.json`, `readPrecacheManifest`, retrospective paths; item 17 excludes App's permanent `role="status"` live region (`App.svelte:106`); unverified: Playwright#14711 on 1.63 (marked in F8/build-notes), visibility of the clipped live region.
### Applied
- [major] CAP-1/F4, rule-coverage F4 row, build-notes Boot — the pass-4 `halted()` check between the `sw.ts` import resolving and registration has no test (`main.ts` has no Vitest) → fixer item 1
- [major] G3, release step 4 — "otherwise redo the read from the start" turns an activation-timing failure (B active while a live A tab is open) into a redo, contradicting G3's Disposition; spoiled-read redos uncapped → item 2
- [minor] items 3–21: F8 tool claim `(unverified for 1.63)`; static server as an `e2e/helpers/` module tested in `e2e/helpers.spec.ts`; CAP-9 audits run last; version of a post-merge fix before the release commit; desktop-read line in the CAP-7 doc; AD-18 Size and AD-17 Projects in the CAP-9 sync; test-name id for the offline row; worker replaced by an `active` newer worker is not `failed`; update-sequence pages must be controlled (early activation with an uncontrolled page is a setup error, not a D gap); one ten-game footer rule; F10 vs G8 actions; seeded rows G4–G6 and G4 tailnet fixtures; CAP-8 fourth outcome (a `src/` fix becomes a fix ticket under technical defaults); a `pwa`-only file for the `dist-test/` Q-40/F17 cases; P7 assertion of no prompt/indicator; F6 exception for F7's precached dictionary; offline order vs AD-17 wording; a `dist-smoke` offline case (epic 1 retro R2); `sources:` adds three retrospectives
### Default applied (technical)
- F4 second check — a P7 `pwa` variant holds the `sw.ts` chunk request (handler asserted hit), halts the page, fulfils, waits for the import to settle plus a macrotask, asserts no `register`, `persisted` or `persist`
- G3 — footer B after a visible reboot with a live A tab is an activation-timing failure (owner question per Disposition); a second consecutive spoiled read after A's readiness step becomes a finding
### Decision needed (functionality / UX / gameplay)
- none new
### Dropped
- none

## Pass 6 — 2026-10-29
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment (late-pass bar)  |  Findings: major 1, minor 16, decision-needed 0  |  Dropped in triage: 0
Words (docs): 11576 (2.01 x pass 0)  |  Snapshot: SPEC.review-log.passes/pass6/ (fix diff pass6.fix.diff)
Fixer: all 17 applied; checked `manifest: true` and `dist-test/.vite/manifest.json`, `Dialog.svelte` role, `REGION` export, `__WB_REVISION__` in workbox-precaching `createCacheKey.js`, `Workbox.js` 7.4.1 ~89–100, Playwright 1.63 `serviceWorkers` context option; unverified: Chromium sending `Sec-Fetch-Mode: navigate` to the local static server (design requirement for the helper).
### Applied
- [major] rule-coverage AD-16 dynamic-import row, CAP-1 — the order tests record `dictionaryState()` only at `register`, so an eager `import('./shell/sw')` at boot (the `workbox-window` chunk competing with the dictionary for first Validate, AD-18) passes → fixer item 1
- [minor] items 2–17: route a second consecutive spoiled G3 read and define how G3 resolves for Done when 2; desktop re-read = clear site data only; offline no-prompt check timing (right after the offline reload; the deal accepts the New game confirm); static-server fallback for navigations only, other missing paths 404, query string ignored (four lenses); drop the unverified live-region visibility claim; `dist-smoke` offline test name and offline order in the CAP-9 AD-17 sync; `alertdialog` in the no-prompt roles, checked on the single reloaded page and the final marker-B page, multi-page step asserts only markers (Q-38 may show); `navigator.storage` scan exclusions and an AD-1 S row; `sw.ts` listens for `updatefound` itself (workbox-window drops its listener after an external update, `Workbox.js` 89–100); worker mode per `test.describe` in `dist-smoke.spec.ts`; spanning game on a restart does not count; `precacheComplete()` last-value semantics in the CAP-9 AD-17 sync; §6.7 re-measured on the release commit; audit-gap fix tickets land before the merge; define "resolved" for Done when 1; quote the two hint lines separately
### Default applied (technical)
- eager-import check — the order test (or the F4 post-import case, which holds the `sw.ts` chunk route) reads `dictionaryState()` when the chunk request reaches the route handler and asserts it is not `loading`
### Decision needed (functionality / UX / gameplay)
- none new
### Dropped
- none
