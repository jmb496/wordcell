---
id: SPEC-epic-7-pwa-release
companions:
  - rule-coverage.md
  - device-checks.md
  - release-checklist.md
  - build-notes.md
  - ../../../docs/game-flow-spec.md
  - ../../planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md
  - ../../planning-artifacts/briefs/brief-wordcell-2026-09-26/brief.md
  - ../../planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md
  - ../../planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md
  - ../../initiative-wordcell-v1/initiative-wordcell-v1.md
  - ../../../AGENTS.md
  - ../../../docs/development-methodology.md
  - ../../../docs/device-testing.md
sources:
  - ../../initiative-wordcell-v1/epic-scaffold-ci-deploy/epic-scaffold-ci-deploy-retrospective.md
  - ../../initiative-wordcell-v1/epic-app-shell/epic-app-shell-retrospective.md
  - ../../initiative-wordcell-v1/epic-board-and-gestures/epic-board-and-gestures-retrospective.md
  - ../../initiative-wordcell-v1/epic-board-and-gestures/story-refactor-sweep-plan.md
  - ../../initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place-retrospective.md
  - ../../initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard-retrospective.md
---

> **Canonical contract.** This SPEC and the files in `companions:` are the contract for what to build, test and validate. The spine (AD-7, AD-15, AD-16, AD-17, AD-18), spec Q-40 and Q-42, and brief §6 are the rule text; this spec cites them and restates none.

# Epic 7 — PWA and release

## Why

Mandate and finish line. Every Proposed epic except row 7 is built, merged and deployed (initiative Notes, 2026-10-29), yet the live app registers no service worker: it neither installs as an offline app nor protects its storage, and brief §6.8's offline criterion is unproven. Earlier epics deferred their real-phone checks here (`device-checks.md`), and the initiative's Done when 1 (every brief §6 criterion checked, device checks included) is what remains before v1. This epic wires the worker under the decided policy (AD-16, Q-40), proves it in Playwright, sweeps, then has Jared confirm everything on his Android phone and declare v1 released (`release-checklist.md`). Branch `pwa-release`; epic 7 takes `after` epic 11 (initiative Notes, 2026-10-25).

## Capabilities

In build order; each depends on those above it unless noted. `rule-coverage.md` maps each rule and spine behaviour to its capability and test kind; `build-notes.md` holds the how and the technical defaults.

- **CAP-1** Service-worker registration and state (AD-16, AD-15, Q-40, A-A15)
  - **intent:** The production app installs its offline precache after the dictionary settles, never swaps code under an open game, and reports what its worker is doing.
  - **success:** `src/shell/sw.ts` exists, is loaded only by dynamic `import()` at AD-16's boot step (after the dictionary settles, ready, failed or timed out) and registers the generated worker with no prompt UI, no `updateSW` call and no skip-waiting message; it is not imported in `vite dev` (state stays `unregistered`); a halted launch stops the tail before it (F4). A shell-side state (`unregistered`, `installing`, `waiting`, `active`, `failed`) follows the registration; a rejected registration, a worker that turns redundant while installing, or an absent `navigator.serviceWorker` sets `failed`, shows nothing in production and throws to the AD-15 handler in dev and test builds (Q-40). The generated `sw.js` still activates a waiting worker only on a `SKIP_WAITING` message, which nothing sends (build-output assertion). Shell Vitest `AD-16` covers the state transitions and the failure split with a faked registration.

- **CAP-2** Test hook `swState()` and `precacheComplete()` (AD-17)
  - **intent:** Playwright can tell when the worker controls the page and the offline precache is complete.
  - **success:** `window.__wordcell` gains `swState()` (CAP-1's state) and `precacheComplete()` (AD-17 Reading state's definition, against the generated manifest's URL list, never a hand list); the frozen object has exactly six keys; `src/shell/test-hook.ts`, `e2e/globals.d.ts`, `e2e/test-hook.spec.ts` and `e2e/pwa/test-hook.spec.ts` change together; in the dev server `swState()` is `unregistered` and `precacheComplete()` false; neither accessor pulls `workbox-window` into the main chunk (F1); `dist/` still contains no `__wordcell` (`dist-smoke`).

- **CAP-3** Persistent-storage request (AD-7, A-A3)
  - **intent:** The offline cache and stored games are protected from eviction where the browser allows it, with nothing shown by the app.
  - **success:** `requestPersistence()` in `src/shell/storage.ts` runs once per launch when CAP-1's attempt settles (registered, failed, or skipped in dev), calls `navigator.storage.persist()` only when `persisted()` is false, ignores a `false` result and an absent `navigator.storage`, and lets a rejection reach AD-15; shell Vitest `AD-7` covers each branch and that it runs once; a `pwa` test proves it runs after the registration attempt settles.

- **CAP-4** Offline and update proofs (brief §6.8, AD-16, AD-17, A-A15, A-E4)
  - **intent:** The shipped build is proven to work with no network and to take an update only when every window has closed.
  - **success:** in `e2e/pwa/` (`pwa` project, `dist-test/`): after `precacheComplete()`, with the network disabled, a reload boots the Board, deals, validates a word (dictionary `ready`) and shows no fatal surface (brief §6.8); a first-launch test shows the order dictionary settled → registration → persistence request, and the dictionary appears once in the precache manifest with revision `null` (existing `precache.spec.ts`, AD-8 one download); a byte-changed worker after a reload leaves `swState()` `waiting` and the old build serving (footer version or build marker unchanged), and only after every page of the context has closed does a new page get the new build. Specs that route requests across a reload declare their worker setting explicitly (F6); every existing `pwa` and `dist-smoke` spec stays green.

- **CAP-5** Failure and controlled-branch proofs (Q-40, Q-42; epic 3 retrospective item 6, C-E7b, O4)
  - **intent:** A broken worker never costs a player the game, and the dictionary banner behaves as Q-42 says when the worker controls the page.
  - **success:** Playwright `Q-40`: with the worker script unavailable, the hook-free `dist/` build boots, plays and validates with no surface, and the `dist-test/` build reaches the AD-15 fatal surface with `swState()` `failed`; Playwright `Q-42` under a controlling worker: after a dictionary 404, Reload retries in place with the banner kept visible (no page load), and the banner hides when the retry succeeds; the mechanism is test-only (F7). The epic 3 `rule-coverage.md` P7 rows for Q-40 and Q-42 point at these tests.

- **CAP-6** Packaging and size budget with a real worker module (AD-16, AD-18; epic 1 retrospective A3 and the `size-budget.mjs` coupling)
  - **intent:** The build checks keep proving what ships now that `sw.ts` exists.
  - **success:** `e2e/pwa/build-output.spec.ts` "registers no service worker automatically" becomes: no `registerSW.js`, nothing in `index.html` or the entry chunk's static closure calls `serviceWorker.register`, and the only registration is in the chunk reached by the dynamic import of `src/shell/sw.ts`; `scripts/size-budget.mjs` sees the real `sw.ts` dynamic edge on the built manifest (a test on the real build shows the `sw.ts` chunk and `workbox-window` outside the counted set) and the total stays at or under 600,000 bytes, the margin recorded; the A3 items are confirmed closed at HEAD (F13); `npm run test:all` green.

- **CAP-7** Device-read tooling for a registered worker (`docs/device-testing.md`, `scripts/device-preview.mjs`)
  - **intent:** Jared can run every check in `device-checks.md` from the tailnet preview, now that a worker persists between builds.
  - **success:** the seed page can also store a named `fixtures/history-*.json` as `wordcell:history` (for the A-A11 History-notice check) and still clears the origin's workers first; `docs/device-testing.md` covers clearing site data between builds, a two-build update read (install build A, serve build B, relaunch with a window open, then after closing every window) and offline launch; `scripts/device-preview.test.mjs` (or the existing tests) covers the seed page change; nothing new ships in `dist/` deploys.

- **CAP-8** Refactor sweep (AD-17 Speed, AD-18; methodology; user direction)
  - **intent:** The epic's own deferred findings are settled and the budgets re-measured before the owner's device read.
  - **success:** one table row per deferred finding of entries CAP-1…CAP-7 (plans' `deferred`, residual risks, unapplied review minors), each fixed here, closed by a cited commit, declined with a reason, or an owner-call row; the 4.6 "main.ts controller-registration order has no test" item is fixed by a test or declined with a reason (`device-checks.md` row G9); the unit suite's warm median under 5 s and a watch re-run under 1 s on a Linux-filesystem checkout, and the AD-18 margin, recorded with the commit; only comments, tests, test helpers and tooling change unless an owner-call row says otherwise; `npm run test:all` and `npm run test:screens` green.

- **CAP-9** Close-out documents and device read (hitl; `device-checks.md`)
  - **intent:** The planning documents match what was built, and every deferred check is done on Jared's Android phone.
  - **success:** the spine (AD-16 boot tail and update policy as built, AD-17's hook key list now six (F14), AD-7 `requestPersistence()`, Capability → Architecture Map row "PWA, offline, install, manifest") and EXPERIENCE.md's "New app version installed" row match the build, through `bmad-architecture` and `bmad-ux`; AGENTS.md changes, if any, go through `bmad-project-context`; this epic's `rule-coverage.md` has no empty row and the epic 3 P7 rows are closed; Jared runs every "Device" row of `device-checks.md` on the tailnet preview and records pass, fail or a finding per row in the epic Notes; a failure is a fix ticket or a spec §9 question (A-A11), never silently accepted.

- **CAP-10** v1 release (hitl; `release-checklist.md`; initiative Done when 1–3)
  - **intent:** WordCell v1 is live, installed on Jared's phone from production, and every brief §6 criterion is checked.
  - **success:** after the owner's go-ahead the epic merges to `main` and CI deploys it (no manual deploy, AD-18); Jared installs from the production URL through Chrome's own install UI and passes the production rows of `release-checklist.md` (offline launch, force-stop restore §6.2); a release commit sets `package.json` `version` to `1.0.0` and deploys; the installed app keeps showing the old footer version while any WordCell window stays open and shows `1.0.0 (<sha>)` after every window has closed and it relaunches (AD-16, A-E4); Jared plays ten consecutive qualifying games on 1.0.0 (brief §6.3; restart rule per Open Questions) and judges §6.1; every brief §6 criterion and initiative Done when 1–3 has its evidence in `release-checklist.md`; Jared declares v1 released and marks the initiative done.

## Constraints

- AD-16's update policy and Q-40 are decided: no prompt UI, no `updateSW`, no skip-waiting, no player-visible worker failure; changing any of them is an owner question, not a build choice (Open Questions).
- Boot order (AD-16): the worker registers only after the dictionary settles and persistence is requested only after that attempt settles; the dictionary is downloaded once (AD-8, never override `dontCacheBustURLsMatching`).
- `workbox-window` and `src/shell/sw.ts` stay out of the main chunk; the counted set stays at or under 600,000 bytes (AD-18, A-A4).
- Layers (AD-1): `sw.ts` and the worker state are shell modules; shell never imports `src/ui/`; `navigator.storage` and `localStorage` only in `src/shell/storage.ts` (AD-7).
- Rule 6: no try/catch around registration or persistence beyond the specified outcomes (Q-40 `failed`, AD-7 `false`/absent).
- Test seams only through AD-17's hook; no production code path exists for a test (CAP-5 mechanism, F7). The hook stays out of `dist/`.
- No change to the deal, the Session or history shape, `SESSION_VERSION` or `HISTORY_VERSION`; R-02 golden deal literals unchanged.
- Test split (AD-17): Q-40, Q-42 and brief §6.8 → Playwright (`pwa`, `dist-smoke`); shell Vitest is `AD-n`, never rule coverage; device rows are owner checks, not tests.
- Commits are local; merging to `main` and pushing are the owner's (rule 7, methodology).

## Non-goals

- Play Store, Bubblewrap or any TWA (brief §8, spine Deferred); iOS testing (brief §7).
- An update prompt, a "new version" notice, an offline indicator, a custom install prompt or `beforeinstallprompt` handling (AD-16, EXPERIENCE.md State Patterns, brief §7).
- Runtime caching beyond the precache, background sync, push, telemetry or crash reporting (spine Deferred).
- A custom domain, preview deploys or a second environment (A-A6).
- Epic 10 and 11 open items the owner declined or deferred (epic 11 retrospective A1–A10, incl. the celebration clean-up A4 and the `nav.spec.ts:163` flake A7); a recurrence of that flake follows A7, outside this epic.
- Rule, scoring, layout or look changes; any engine change.

## Success signal

`npm run test:all` and `npm run test:screens` are green with the offline, update, Q-40 and Q-42 tests passing; on his Android phone Jared installs WordCell from the production URL, launches it in airplane mode and plays, sees 1.0.0 arrive only after closing every window, restores a force-stopped game exactly, finishes ten consecutive qualifying games with no misdrop or lost drop, and every row of `release-checklist.md` carries its evidence.

## Assumptions

- Chrome on Android activates a waiting worker when the last window of the installed app is closed (swiped from recents); a reload or resume from the background does not (A-A15). CAP-9 and CAP-10 confirm it on the phone.
- Playwright's Chromium can serve, intercept and close pages in a way that shows A-A15's rule in CAP-4; where it cannot, the device read is the evidence and the plan says so.
- If A-A11 fails on the phone (Android back skips a boot-pushed entry), it becomes a spec §9 question for the owner (spine A-A11); no code answers it first.
- Firefox may ask the player to allow persistent storage when `persist()` runs (see Open Questions); Chrome decides silently.

## Open Questions

- **New-version prompt.** Today (AD-16, A-E4), an update takes effect silently the next time the app is launched after every WordCell window has closed; a reload or resuming from the background keeps the old version, and the player is never told. The alternative is a visible "new version" prompt that applies the update on a tap, which reopens AD-16 and adds UX (a message, its place, its catalogue text). Proposed default: keep AD-16, no prompt; CAP-9 and CAP-10 check the silent behaviour instead of "the update prompt".
- **Ten-game run across a fix.** If a fix ships while Jared is playing the ten qualifying games (brief §6.3), does the run restart? Proposed default: it restarts only when the deploy changes drag, drop or layout code (`src/ui/gestures/`, `src/ui/layout/`), since only those decide a misdrop or lost drop; other fixes keep the count. Practical effect: fewer replayed games, at the cost of counting games from two builds.
- **Firefox persistent-storage prompt.** AD-7 requests persistent storage once per launch in every browser; desktop Firefox (best effort, brief §7) shows its own permission prompt for it, which Chrome does not. Proposed default: keep AD-7 as is (Firefox players may see that browser prompt once); the alternative, requesting only in the installed app, changes A-A3.

## Decisions

Technical defaults under the owner's standing rule (accept the proposed default); none changes gameplay, UX or offline/update behaviour. Details in `build-notes.md`.

| # | Question | Decision |
| --- | --- | --- |
| F1 | Where does the worker state live? | A small shell module the hook and `sw.ts` share, statically importable, with no `workbox-window` import; `sw.ts` (dynamic chunk) owns `workbox-window` and writes the state. |
| F2 | Registration API | `workbox-window`'s `Workbox` in `sw.ts`, as AD-16 names; not `virtual:pwa-register`. |
| F3 | Dev builds | `sw.ts` is not imported; state stays `unregistered`; persistence is still requested (AD-7 "skipped in dev"). |
| F4 | A halted launch | The boot tail stops at its existing `halted()` checks: no registration, no persistence request; the next launch registers. |
| F5 | Absent `navigator.serviceWorker` | A Q-40 failure: `failed`, silent in production, thrown in dev and test builds. |
| F6 | Existing specs once a worker registers | Audit every `pwa` and `dist-smoke` spec; a spec that routes requests across a reload sets its worker mode explicitly (Playwright `serviceWorkers`) with a comment; the offline, update and Q-42 specs use `allow`. |
| F7 | Q-42 controlled 404 | Test-only: the spec makes the controlled page miss the precached dictionary and see a 404 (e.g. a context route plus removing the cache entry); no production branch is added. |
| F8 | Update proof | A byte-changed `sw.js` served after the first worker is active; the build marker is the menu footer `__APP_VERSION__` or another existing build-specific string. |
| F9 | Device tooling | `device-preview.mjs` gains an optional history fixture; dev tooling only, never in `public/`. |
| F10 | C-E7a dispatch figure and R5 | Judged on the phone during CAP-9/CAP-10 play (no felt lag on Confirm, Undo or Redo); a number is measured (chrome://inspect) only if lag is felt, and then R5 is revisited in a follow-up ticket. |
| F11 | Release marker | `package.json` `1.0.0` in a release commit after the epic merge, so its deploy is also the production update check; Jared may tag `v1.0.0` (pushing is his). |
| F12 | Order of release work | CAP-9 runs on the tailnet preview before the merge; CAP-10 runs on production after it; the retrospective follows CAP-10. |
| F13 | Epic 1 A3 | Already closed: the packaging specs run under `dist-smoke` through `buildRoot()`, `includeManifestIcons: false`, and the one-entry-per-URL test; CAP-6 re-checks it. |
| F14 | AD-17 "exactly the keys" | The Celebration seam's four-key list is superseded by six keys (Reading state already names `swState` and `precacheComplete`); a spine doc sync at CAP-9, not a deviation. |
| F15 | Earlier P7 rows | Epic 3 `rule-coverage.md` Q-40 and Q-42 (P7) close against CAP-5's tests at CAP-9. |
| F16 | Desktop-only deferred checks | Run by Jared in desktop Chrome during CAP-9 (`device-checks.md` rows marked Desktop, G20–G22). |

Next owner answer takes F17.
