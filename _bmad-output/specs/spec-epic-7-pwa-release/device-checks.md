# Epic 7 device checks and deferred items

Every item earlier epics deferred to epic 7, with its disposition: **Device** (Jared, Android
phone, tailnet preview, CAP-9), **Desktop** (Jared, desktop Chrome, CAP-9, F16), **Production**
(after the merge, CAP-10, `release-checklist.md`), **Built** (a capability of this epic), **Sweep**
(CAP-8), **Optional (owner)** (left unreviewed by owner decision; run only if Jared reinstates
it), **Out** (with the reason). Setup: `docs/device-testing.md` (CAP-7); for seeded rows (G4–G6), after seeding close the
Chrome tab, then launch the installed app; for Desktop rows, open the tailnet URL (or
`localhost:4173`) in desktop Chrome, clear its site data or close every tab on that origin before
reading a new build, and confirm the menu footer before recording the row. Jared records pass,
fail or a finding per row in the epic Notes, with the footer it was read on; a failure becomes a
fix ticket, or a spec §9 or owner question where the row says so. A fixed row is re-read on the
build that carries the fix, and any Device or Desktop row whose subject a later fix (pre- or
post-merge) touches is re-read (F12).

| Id | Check | Source | Disposition |
| --- | --- | --- | --- |
| G1 | Install through Chrome's own install UI; the icon, name and splash follow DESIGN.md A-D5; launches standalone and portrait. | brief §7; AD-16; epic 1 retro "not exercised" | Device; again on production (CAP-10) |
| G2 | After the first online launch, keep the app open about a minute on Wi-Fi, close every WordCell window and relaunch once online (now controlled), or check chrome://serviceworker-internals shows the worker ACTIVATED (unverified) (CAP-7 documents this); then relaunch in airplane mode: the Board boots, a word validates, no message. | brief §6.8; epic 1 retro | Device + Built (CAP-4); again on production |
| G3 | Update: install build A and run G2's readiness step for it (on the tailnet, before A's server stops); serve (or deploy) build B, keeping site data (CAP-7); close every WordCell window (swipe the app from recents, close every Chrome tab on the origin), then launch cold: footer A (B fetched; a resume fetches nothing, A-A15; footer B here is a spoiled read, redone from the start, not a fix ticket; a second consecutive spoiled read, after A's readiness step, is a finding, not another redo); readiness: keep it open about a minute on Wi-Fi, or see B waiting in chrome://serviceworker-internals (unverified); with the app left in recents, open the same URL in a Chrome tab: footer A; resume the app from recents: still A (if the resume visibly reboots, record the renderer as discarded: footer B there is consistent only if the Chrome tab also shows a fresh boot or is gone, otherwise it is an activation-timing failure (owner question, per the Disposition) (unverified)); wherever a window shows the Q-38 message, Jared taps its Reload, then reads the menu footer (a reload never activates the waiting worker, AD-16, A-A15, so footer A still proves the rule); close every WordCell window, the app in recents and every Chrome tab on the origin, relaunch: footer B; no prompt at any point. | AD-16, A-E4, A-A15; Open Questions | Device + Built (CAP-4); production via the 1.0.0 commit (CAP-10); a failure of activation timing once B was fetched and waiting is an owner question about AD-16/A-A15 (activation is the browser's; skip-waiting is ruled out); any other failure (B never fetched, no worker) is a fix ticket; a spoiled production read is redone at the next deploy or rests on the tailnet G3 read |
| G4 | Force-stop both Chrome and WordCell in Android app settings (the installed app's page may live in Chrome's process) and relaunch; record whether the splash screen shows before the Board (a cold-start sign (unverified); an observation, not a pass condition). At the brief §6.2 boundaries: Place with a free letter, a non-default placement order and a redo tail; `gaveUp`; a finish recorded then undone (note the six Statistics (R-84) before the win; win, Undo, force-stop, relaunch: they match); non-default prefs (theme, speed, timer): everything restored, timer not ahead. | brief §6.2; AD-17 kill variant | Device (tailnet: CAP-7's G4 fixtures, the rest by play); again on production, the boundaries reached by play (production cannot be seeded; the win/undo case from any won game) |
| G5 | Relaunch into Game over (seeded won game): end sheet expanded with no animation; Android back collapses it; back again leaves the app. | spine Proposed epics row 7; A-A11 | Device; a failure is a spec §9 question (A-A11) |
| G6 | Relaunch with an unreadable history (seeded `history-invalid-*`): the History notice shows; open Reset history's confirm; Android back closes the confirm, then the notice, then leaves the app. | A-A11; epic 3 retro item 6, C-E7b | Device (CAP-7's history-only seed, `--history` alone); a failure is a spec §9 question |
| G7 | Launch rewind: with the menu or a panel plus a confirm open, force-stop and relaunch; in a Chrome tab, reload with two overlays open; tap the dictionary banner's Reload after a 404 if reproducible: never the fatal surface, Board at its base entry, back leaves the app. | AD-13 250 ms rewind and "stored `wc` above the real history" edge; epic 3 C-E7b; epic 4 D20 | Device |
| G8 | Dispatch feel: no perceptible lag on Confirm, Undo, Redo or New game over a long game. | epic 3 C-E7a, item 8, R5 | Device judgement (F10); measure only if lag is felt |
| G9 | `main.ts` pointer-controller registration order has no test. | epic 4 sweep D20 (4.6 deferred) | Sweep: add a test, or decline with a reason (CAP-8) |
| G10 | Mid-drag, edge-swipe back: the drag ends, the app stays open, the selection follows epic 4 F24; mid-drag, switch apps and return: no stuck drag. | epic 4 F24, 4.9 residual | Device |
| G11 | Long press on a card, tile or WordCell: no system context menu, text selection or callout. | epic 4 4.6 deferred (AD-11) | Device |
| G12 | Long still press on the WordCell view scrim closes or ignores as built, nothing beneath reacts. | epic 4 D10 (4.11-m1) | Device |
| G13 | Fling the page, then grow the tray (add tiles) before it settles: no jump or lost fling from the anchor `scrollTop` write. | epic 5 F-8; epic 5 SPEC CAP-9 | Device |
| G14 | A fast double tap on a Validate that succeeds validates, then confirms. | epic 5 SPEC F21 | Device |
| G15 | Composing with k ≥ 2 destination cards: no seam between D-block tiles at the phone's pixel ratio. | epic 4 sweep (4.3 residual) | Device |
| G16 | Pass: no misdrop, lost drop or stuck drag traced to a release ≥ 8 px with no move or to a lost touch end during the ten-game run. A qualifying game with a misdrop or lost drop (Jared's judgement at the drop, brief §6.3) resets the count to zero and becomes a finding or fix ticket; a stuck drag that loses the drop counts as a lost drop, otherwise it is a finding. | epic 4 D17 (4.8-p2a), D18 | Production: observed during the ten-game run (CAP-10); no build item |
| G17 | Win, background the app mid-celebration, return: end sheet expanded; back and ☰ act normally. | epic 10 entry 7 open question, F28 | Device |
| G18 | The epic 6 Success signal, played on the phone. | epic 6 retro A10; left unreviewed by owner decision 2026-10-16, "any problem is fixed when it arises" (epic 6 retro; epic 8 retro) | Optional (owner) |
| G19 | TalkBack pass: card, tile, WordCell and control names and the live-region announcements read as EXPERIENCE.md says. | epic 6 retro A10; owner decision 2026-10-16 as G18 | Optional (owner) |
| G20 | Wheel over the WordCell view scrim does not scroll the board. | epic 4 D10 (4.11-m2) | Desktop |
| G21 | Window shorter than 384 px: the desktop height rule holds. | epic 4 D10 (4-4) | Desktop |
| G22 | No stale hover under a still mouse after a layout shift. | epic 4 D20 | Desktop |
| G23 | Safe-area inset change without a resize. | epic 4 D10 (4-4) | Out: the installed app is portrait-locked; insets change only on a system navigation-mode switch mid-session; residual accepted, reopened if seen |
| G24 | WordCell view wider than the screen below ~320 px. | epic 4 D10 (4.11-m3) | Out: below DESIGN.md's 360 px minimum; no target device |
| G25 | Q-42 service-worker-controlled branch in Playwright (P7). | epic 3 retro item 6, C-E7b, O4 | Built (CAP-5) |
| G26 | Q-40 worker and precache failures (P7). | epic 3 `rule-coverage.md` | Built (CAP-5) |
| G27 | `size-budget.mjs` names `src/shell/sw.ts` before it exists. | epic 1 retro (accepted coupling) | Built (CAP-6) |
| G28 | Packaging tests against `dist/` too; drop `includeAssets` and duplicate icons; one precache entry per URL. | epic 1 retro A3 | Built (CAP-6 re-check; closed at HEAD, F13) |
