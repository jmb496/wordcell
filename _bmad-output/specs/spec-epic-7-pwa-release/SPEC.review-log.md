# Review log — spec-epic-7-pwa-release (SPEC.md + companions)

State: pass 1: done

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
