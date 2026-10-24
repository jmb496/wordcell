---
title: 'Celebration interruptions'
type: 'feature'
ticket: '7'
created: '2026-10-24'
status: 'built'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: true
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-end-of-game-words/story-celebration-interruptions.md'
warnings: [oversized]
deferred: []
baseline_revision: 'eaf8ffb1086d65f2736333f7e4b361b288c0912c'
---

<intent-contract>

## Intent

**Problem:** A running win celebration has no ☰/`M`, hide or resize end: ☰ throws the `open(menu)` guard to AD-15 and `M` is ignored (entries 4–6's interim gap, the epic's merge blocker); hiding the app or resizing leaves the run going; and Playwright has no proof for the Cancel, Redo and keys behaviours entries 4–5 already provide.

**Approach:** Exactly as the ticket (story file; read it fully: Description bullets Interface, Hide, Resize, Halted, Menu, Keys, Cancel, Redo; AC) states, with the resolutions under Design Notes: `openMenu()` (ends a running celebration, then opens the menu once nav settles, only over `endSheet`) for ☰ and `M`; `installInterruptions(...)` registering one before-hide callback and `resize`/`orientationchange` listeners that call the plain `celebration.end()` unless halted; the R-87 interruption rows and `AD-19`/`AD-13` Vitest cases. The one deviation from the ticket Interface: `openMenu()` lives in a new `src/ui/open-menu.ts`, not `open-surface.ts` (Design Notes item 3).

## Boundaries & Constraints

**Always:** `celebration.end()` unchanged (no mode, no parameter, no halted check inside it). The halted check is the injected `halted()` inside the `installInterruptions` callbacks only; interruptions.ts imports no store. The deferred menu open runs inside `act()`. Test names carry ids (`R-87` P6, `AD-19` / `AD-13` Vitest). No new screenshot baseline, no changed one.

**Never:** a spine, SPEC, EXPERIENCE.md, rule-coverage, epic, tickets.toml or ticket file edit (entry 9 / owner); a change to `step.ts`, `skip.ts`, `act.ts` or the run's start/done path in `end-sheet.ts`; a size compare or debounce on resize; a second `done` path for hide; `window.__wordcell` in a hook-free helper.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Hide mid-run | run live, not halted; before-hide callback (`visibilitychange` hidden) | `end()`: one pop, `done` once after a microtask; `done` (hidden) defers the sheet to `whenVisible()`, no announce | — |
| Second flush | `pagehide` after the hide | no-op (no run): no pop, no `done` | — |
| No run | hide callback, `resize`, `orientationchange` with nothing running | no-op | — |
| Resize / orientation | run live, not halted; `resize` or `orientationchange` on `win` | `end()` once; a later event is a no-op | — |
| Halted | `halted()` true; hide callback, `resize`, `orientationchange` | run stays live: no pop, no `done` | — |
| ☰ / `M` mid-run | top `celebration` | `celebration.end()` first, then `nav.whenSettled(act(...))` opens the menu if the top is `endSheet` | top not `endSheet` at the settle: the open is dropped (ticket default) |
| ☰ / `M` otherwise | top not `celebration` | `openSurface('menu')` at once (today's behaviour, its guards unchanged) | today's `AD-13 open(menu)` throws |
| Double ☰ / `M` twice | second press before or after the settle | one menu, no Halted surface (second press: direct open over `endSheet` and the first's deferred open dropped, or ignored by the open menu) | — |
| `M` in keys.ts | only `celebration` suspending | the `menu` row runs (`CELEBRATION_KEYS` gains `menu`) | another suspending entry: ignored, as today |

</intent-contract>

## Code Map

- `src/ui/open-menu.ts` (new) -- `export function openMenu(): void`: `if (overlays.top === 'celebration') { celebration.end(); nav.whenSettled(act(() => { if (overlays.top === 'endSheet') openSurface('menu'); })); return; } openSurface('menu');`. Imports `nav` (`../shell/nav`), `act` (`./act`), `openSurface` (`./open-surface`), `overlays`, and `celebration` from `./celebration/celebration.svelte.ts` (explicit `.ts`, as main.ts and end-sheet.ts: drvfs resolves `./celebration.svelte` case-insensitively to `Celebration.svelte`). No cycle: nothing celebration.svelte.ts imports reaches open-menu.ts. Header comment: SPEC F13, A-E16, AD-19, ticket 10.7, why the open waits for the settle (end's pop, then `done`'s microtask pushes `endSheet` behind it) and why it is act()-wrapped.
- `src/ui/open-surface.ts` -- header: "Synchronous … no second wait here" gains "(the one deferred caller is open-menu.ts `openMenu()`, which waits for a running celebration's end)". No code change.
- `src/ui/TopBar.svelte` L25–29 -- drop the local `openMenu` and the `openSurface` import; import `openMenu` from `./open-menu` (biome-ignore comment like the other markup-only imports if Biome flags it); `onclick={act(openMenu)}` unchanged; comment: ☰ opens through `openMenu()`.
- `src/ui/Menu.svelte` L17–18 -- comment "opened only through `openSurface('menu')` (the ☰ button)" → through open-menu.ts `openMenu()` (the ☰ button and `M`), which ends a running celebration first.
- `src/ui/keys.ts` -- L32 import `openMenu` from `./open-menu` (keep `openSurface` for `howToPlay`); `menu` row `run: () => openMenu()` (L258–264); L525–530 `CELEBRATION_KEYS = ['undo', 'newGame', 'menu']`, comment drops the interim-gap sentence (`M` ends the run, then opens the menu, open-menu.ts).
- `src/ui/overlays.svelte.ts` L72–76 -- `SUSPENDING` comment: `attempt()` still runs the `undo`, `newGame` and `menu` rows.
- `src/ui/celebration/interruptions.ts` (new) -- `installInterruptions({ win, registerBeforeHide, halted, end })`: `win: Pick<EventTarget, 'addEventListener'>`; one `stop = () => { if (!halted()) end(); }` passed to `registerBeforeHide` and to `win.addEventListener('resize' | 'orientationchange', stop)`; permanent (no removal); a second call throws `AD-19 installInterruptions() called twice` (module flag; tests `vi.resetModules()`). Header: AD-19 Hide / Resize, ticket 10.7, the rule 7 refinement (plain `end()`, queued pop; Design Notes item 1), halted (AD-15: `game.svelte.ts` `flush()` runs callbacks in every state).
- `src/main.ts` -- after `game.registerBeforeHide(() => noteSceneHide());` (L172): `installInterruptions({ win: window, registerBeforeHide: game.registerBeforeHide, halted, end: celebration.end })` with a one-line AD-19 comment; `halted` is main.ts's existing function (L118); `celebration` already imported.
- `src/shell/game.svelte.ts` L230–250 -- read only: `registerBeforeHide` appends; `flush()` runs every callback first, in every state, on `visibilitychange` hidden and on `pagehide`.
- `src/ui/end-sheet.ts` L40–55 -- read only: `done` opens + announces when visible, else `game.whenVisible().then(openDeferred)` with no announce (entry 5).
- `src/ui/celebration/celebration.svelte.ts` -- read only: `end()` = `clear()` then `finish(done)` (onEnd, `overlays.close('celebration')` → `removed` queues `done` in a microtask, then `nav.pop()`); a second `end()` returns at `clear() === null`.
- `src/shell/nav.ts` -- read only: `whenSettled` runs at once when settled, else after the queue drains (the pop's `popstate`, then the queued `endSheet` push).
- `src/ui/celebration/attached.test.ts` -- harness to extend: real overlays + attached singleton, nav mock with `store.settled` / `store.waiters`, recording `act` controller (`cancel` logged), `begin()`, `done` that opens the deferred sheet.
- `src/ui/keys.test.ts` -- L1440–1543 "AD-13 keys while the celebration runs": `KEY_OF` (L1445), its coverage test (L1485), the per-row loop, "AD-13 Z, Ctrl+Z and N act…" (L1510).
- `e2e/celebration.spec.ts` -- `readyToWin`, `winIntoRun`, `sheet`, `replay`, `primary`, `wcOf`, `GROUP`, `ROOT`, `enterIntoRun` (desktop describe), `stepUntilShown`, the Redo test (L540), the hidden-at-settle test (L229, the `hidePage`/`showPage` pattern), the reload test (L247, R-73, must stay green).
- `e2e/helpers/lifecycle.ts` (`hidePage`, `showPage`, `pageHide`, `animationFrames`); `e2e/helpers/live-region.ts` (`recordRegion`, `sets`); `e2e/helpers/dialogs.ts` (`wc`, `button`, `expectLeaves`); `e2e/history-notice.spec.ts` L62 `doubleTap` (two `touchscreen.tap`s 80 ms apart; copy it locally); `e2e/blocking.spec.ts` L18 `FATAL = 'Something went wrong.'` (the Halted heading); the menu dialog is `getByRole('dialog', { name: 'Menu' })`, ☰ `getByRole('button', { name: 'Menu', exact: true })`, How to play `getByRole('dialog', { name: 'How to play' })`, the view `[data-view-sheet]`.

## Tasks & Acceptance

**Execution:**
- [x] `src/ui/open-menu.ts` -- new, per the Code Map -- Menu bullet
- [x] `src/ui/TopBar.svelte`, `src/ui/keys.ts`, `src/ui/open-surface.ts`, `src/ui/Menu.svelte`, `src/ui/overlays.svelte.ts` -- wire `openMenu()`, `menu` in `CELEBRATION_KEYS`, the four comments -- Menu bullet
- [x] `src/ui/celebration/interruptions.ts` -- new, per the Code Map -- Interface, Hide, Resize, Halted bullets
- [x] `src/main.ts` -- the `installInterruptions` call -- Interface bullet
- [x] `src/ui/celebration/attached.test.ts` -- new describe "AD-19 interruptions and the menu end" over the attached singleton (fake `win` recording its listeners by type, a fake `registerBeforeHide` collecting callbacks, `halted` from a variable, `end: celebration.end`): `AD-19 the hide callback twice gives one pop and one done (after a microtask); the second is a no-op`; `AD-19 with no run the hide callback, resize and orientationchange are no-ops`; `AD-19 resize ends a live run once` and the same for `orientationchange` (each its own run; a second event adds nothing); `AD-19 while halted the hide callback, resize and orientationchange leave a live run running (no pop, no done)`; `AD-19 installInterruptions() twice throws`; `AD-19 openMenu() mid-run: end first (onEnd, pop), done after a microtask pushes endSheet, the menu opens only at the settle, inside act()` (`store.settled = false` before the call; after the microtask `top` is `endSheet` and no menu; settling the waiters logs `cancel` then the push; `top` `menu`, depth 2); `AD-19 openMenu() drops the deferred open when the top is not endSheet at the settle` (settled at the call: the waiter runs before `done`'s microtask; after it, depth 1, top `endSheet`, no menu); `AD-19 openMenu() with no celebration opens the menu at once`
- [x] `src/ui/keys.test.ts` -- `vi.mock('./celebration/celebration.svelte.ts', () => ({ celebration: { end: () => mocks.log.push('celebration.end') } }))`; `KEY_OF` type `Exclude<…, 'undo' | 'newGame' | 'menu'>` and its `menu` row removed; coverage test titled "AD-13 the KEY_OF table covers every ROWS id but undo, newGame and menu" filtering all three; "AD-13 Z, Ctrl+Z, N and M act while only celebration is open": `M` returns true and logs `celebration.end` (ACTED `['undo', 'undo', 'newGame', 'celebration.end']`, or `M` asserted on its own after re-`celebrate()`); existing `M` tests stay green (nothing else of the mock is reached with no celebration on top)
- [x] `e2e/celebration.spec.ts` -- the R-87 rows (AC below), in the `android` and `desktop` describes
- [x] `npm run test:all`, then `npm run test:screens`; `git status --porcelain | grep -- -snapshots` empty

**Acceptance Criteria:**
- Given the ticket's AC, when the suites run, then its four new R-87 rows, the Redo boundary row and the `AD-19` U cases pass, with these resolutions:
- Given a run (`android`), when `hidePage`, then `running()` false, `[data-celebration]` count 0, sheet count 0, `wcOf` polls to 0; `pageHide` adds no Halted surface (`FATAL` heading count 0) and changes nothing; `showPage` → sheet visible, `replay` focused, `wcOf` 1, and the region recorder started before `hidePage` holds no set starting with the win title (`Every column cleared.`); ☰ opens the menu (wc 2) and `goBack` closes only it (menu count 0, sheet visible, wc 1); `goBack` again collapses the sheet (`Show result:` button visible, wc 0, URL not `about:blank`).
- Given a fresh run per trigger (one test per trigger in a `for` over `setViewportSize` to 412×800 from the android viewport and `window.dispatchEvent(new Event('orientationchange'))`), when the trigger fires, then the hide row's outcome assertions hold (`running()` false, no copies) and the sheet is visible with `replay` focused and `wcOf` 1.
- Given a run (`android`), when ☰ is tapped, then `running()` false, no copies, the menu visible and `wcOf` polls to 2; `goBack` → menu count 0, sheet visible, wc 1. Given another run, when ☰ gets a `doubleTap` (two `touchscreen.tap`s 80 ms apart), then exactly one menu, wc 2 after `animationFrames(page, 3)`, no `FATAL` heading (either second-press branch; the drop branch's own proof is the U test). Given `desktop` (`enterIntoRun`), when `m` is pressed twice, then the same one-menu outcome.
- Given a run (`android`), when the Undo button is tapped (and, in its own test, New game, the primary action), then the Cancel outcome holds: `running()` false, no copies, sheet count 0, `wcOf` 0, sheet still count 0 after `animationFrames(page, 3)`; after New game, `expectLeaves` (back leaves the app).
- Given `desktop` (`enterIntoRun`), when `Shift+?` and, with `wordcell-3` focused (`.focus()`), `Enter` are pressed, then no How to play dialog, no `[data-view-sheet]`, `running()` still true; when `z` cancels, `y` restores the win (poll `running()` true), `Control+z` cancels, `y` again, `n` cancels, then each cancel shows the Cancel outcome.
- Given a run (`android`), when Undo, then Redo (poll `running()` true), then `finishCelebration`, then exactly one end-sheet dialog, expanded, `wcOf` 1.

## Implementation Notes

- Built as the Code Map states: `src/ui/open-menu.ts` (new), `src/ui/celebration/interruptions.ts` (new, module flag, `Pick<EventTarget, 'addEventListener'>` win), the main.ts call right after the `noteSceneHide` registration, the TopBar/keys wiring and the four comments. `celebration.end()`, `step.ts`, `skip.ts`, `act.ts` and end-sheet.ts unchanged.
- attached.test.ts: the new describe adds 10 cases (the listed ones, the resize/orientationchange case split per event type, plus one registration-count case). keys.test.ts: celebration module mocked, `menu` out of `KEY_OF`, `M` asserted in the combined "Z, Ctrl+Z, N and M" case (ACTED ends `celebration.end`).
- celebration.spec.ts: android adds the hide row, resize and orientationchange (one `for`), ☰ single, ☰ `doubleTap`, Undo button Cancel, New game Cancel + `expectLeaves`, and the Redo boundary row; desktop adds `M` twice and the `?` / WordCell `Enter` / `z` / `Control+z` / `n` row (each cancel its own run via `y`). Shared helpers `expectEndedNoSheet`, `expectCancelled`, `expectEndedIntoSheet`, `expectOneMenu` sit above the android describe.
- Negative control: with the main.ts `installInterruptions` call disabled, the hide, resize and orientationchange e2e tests fail; restored.
- Verification: lint (one pre-existing warning in e2e/end-sheet.spec.ts:845, untouched), check, unit (3581 passed), build with size budget, `test:e2e:dist` (19), `test:e2e` (1093 passed, 0 failed), `test:e2e:pwa` (17), all green; `test:all`'s steps were run as separate foreground commands (the backgrounded single run was terminated). `test:screens` 67 passed; no `-snapshots` path in `git status`.
- Review fixes: the drop-branch U test now runs in app ordering (nav unsettled at the call, a second `openMenu()` over `endSheet` before the settle, the waiter drops its open); the double ☰ and `M`-twice e2e tests go back to the sheet (menu gone, sheet visible, wc 1); the hide test waits 3 frames before reading the region, and the resize/orientationchange tests assert the win title is announced (positive control); interruptions.ts header states the Hide departure as pending the owner; TopBar's ☰ comment sits above the `openMenu` import.
- Owner checkpoint items 1–6 under Design Notes stay open for the owner (built without the plan-checkpoint nod, as 10.4–10.6).

## Plan Change Log

## Review Triage Log

### 2026-10-24 — Review pass
- verdicts: 22 findings — high 0, medium 3, low 14, false 5, maybe-false 0 (verification-gap reported none)
- findings:
  - `[medium]` `[patch]` (blind) the openMenu drop U test runs with nav settled at the call, an ordering the app never produces (end()'s pop leaves nav unsettled; the ticket AC requires nav unsettled until after done's microtask) — fixed: rewritten under app ordering (settled false, microtask, a second openMenu() opens over endSheet, the settled waiter drops its open: one menu push, depth 2).
  - `[low]` `[patch]` (blind) `expectOneMenu` never shows the sheet is behind the menu — fixed: the double ☰ and desktop M-twice tests go back after it (menu gone, sheet visible, wc 1).
  - `[low]` `[reject]` (blind) focus after back to ☰ unasserted on this path — pre-existing behaviour pinned by e2e/keys.spec.ts "AD-13 the menu over the expanded end sheet, closed by … back …, returns focus to the menu button"; this change does not touch the close path.
  - `[low]` `[patch]` (blind) no desktop `M` then back assertion (AC ☰ row, `M` desktop) — fixed with the M-twice test's back step above.
  - `[medium]` `[patch]` (blind) the hide test reads the live-region sets without waiting for the announce frame and has no positive control — fixed: `animationFrames(page, 3)` before reading; the resize/orientationchange tests record the region and assert the visible branch's outcome announce.
  - `[low]` `[reject]` (blind) no test for a visible `pagehide` mid-run — the ticket settles it: a reload discards the page and "R-87 a reload mid-run is a relaunch" stays green as the proof; bfcache is owner item 5's residual.
  - `[low]` `[reject]` (blind) no architecture scan pinning `openSurface('menu')` to open-menu.ts — a new caller is unlikely and the fix is a new scan, not a direct correction.
  - `[low]` `[reject]` (blind) keys.test.ts mocks the celebration module without `importOriginal` — a future import of another export fails loudly at test load; no current harm.
  - `[low]` `[patch]` (blind) interruptions.ts header states the unapproved rule 7 Hide refinement as settled and restates nav internals — fixed: reworded as pending the owner's rule 7 nod against AD-19 Hide, nav internals and plan pointer dropped.
  - `[low]` `[patch]` (blind) TopBar.svelte's ☰ comment orphaned after the local function went — fixed: moved above the `openMenu` import.
  - `[low]` `[reject]` (blind) `doubleTap`, `FATAL`, `WIN_TITLE` copied rather than shared — local copies follow the existing practice (history-notice.spec.ts keeps its own `doubleTap`); moving them means new helper tests in e2e/helpers.spec.ts.
  - `[low]` `[reject]` (edge) a visible `pagehide` (unload, bfcache) lets `done` open and announce and leaves nav's pop pending on restore — ticket Hide bullet and Notes accept it (reload moot; bfcache residual, owner item 5).
  - `[low]` `[reject]` (edge) a halt between the ☰/M press and the settle lets the deferred open push a menu under the Halted surface — a few-ms window, Halted is terminal (Reload only), and the guard adds a branch for no visible outcome.
  - `[low]` `[reject]` (edge) if `done`'s `openDeferred` returns false the ☰/M press ends the run and opens nothing — reachable only by an Undo inside the ms window between the press and the settle, after which the game is no longer won; the drop is the ticket's default (owner item 2).
  - `[false]` `[reject]` (intent) `openMenu()` lives in open-menu.ts, not open-surface.ts — a recorded technical default (Design Notes item 3, owner item 4), measured: the import broke 2 unit files.
  - `[false]` `[reject]` (intent) the build did not stop at the plan checkpoint — the run is unattended and records owner items instead, as 10.4–10.6; owner items 1–6 stay open in Design Notes and the result JSON.
  - `[medium]` `[patch]` (intent) the drop branch is proven only under a non-app nav ordering — same defect as the first blind row; fixed there.
  - `[low]` `[reject]` (intent) the e2e double ☰ tap probably reaches the open menu's scrim (detail 2, `firstClick`) or the inert main rather than the end→settle race — the AC row asks for the outcome (one menu, no Halted surface) whichever branch; the drop branch is the rewritten U test's.
  - `[low]` `[patch]` (intent) no desktop `M` then back assertion; sheet behind the menu inferred from the entry count — same fix as the blind back-step rows.
  - `[false]` `[reject]` (intent) lifecycle proven with synthetic `hidePage`/`showPage` — the ticket names these helpers and defers the platform to entry 9's Android read.
  - `[false]` `[reject]` (intent) resize test changes only the height and orientationchange no size — matches the ticket ("any such event during a run ends it, no size compare").
  - `[false]` `[reject]` (intent) halted proven only in Vitest — the ticket AC puts it in the U tests.

## Design Notes

Review-log items left for the build, resolved:
1. Dropped deferred open listed at the checkpoint: owner item 2 below.
2. keys.test.ts `M` observable: the celebration module is mocked so `end()` logs (Tasks).
3. `openMenu()` location: measured, not assumed. Importing celebration.svelte.ts from open-surface.ts fails 2 unit files at import (32 tests, `ReferenceError: window is not defined` from game.svelte.ts's import-time `storage` listener, e.g. overlays-surfaces.test.ts) and would drag the run controller into every importer of commands.ts, new-game.ts and the panels. Default taken: a small `src/ui/open-menu.ts`; open-surface.ts stays the single `overlays.open` owner (src/architecture-open-surface.test.ts unchanged). Owner item 4 records the Interface deviation for entry 9.
4. `Exclude<…>` gains `menu`: Tasks.
5. Resize on a mobile-browser toolbar show/hide (an innerHeight-only change, AD-11 / A-D11) ends the run: kept (ticket default, no size compare); residual for entry 9's Android read (owner item 5).
6. Double ☰ tap: `doubleTap` pattern, branch stated (AC).
7. `Z`, Ctrl+Z and `N` each their own run, via `y` Redo (AC).
8. Resize reuses the hide outcome assertions; the second trigger is its own test (AC).
9. Halted: the injected `halted()` (Boundaries, Code Map).
10. tickets.toml entry 7 `interface` (`end(hide-mode)`, main.ts registrations) stale: owner item 3.
11. bfcache announce: owner item 5.
12. Menu.svelte: Code Map.

Why the deferred open is act()-wrapped: between the press and the settle the end sheet's push lands and a new press can start on it (the sheet's buttons, its scrim); `act()` cancels any such press and clears a tile selection before the menu opens, as every other App-owned open does. `act.ts` is unchanged.

Owner checkpoint items (rule 7; plan checkpoint, built unattended as 10.4–10.6):
1. Hide (rule 7): AD-19 Hide reads "nav and rAF are unreliable on a hidden page, so the hide mode only stops the run and removes the entry, and the end sheet's open is queued for the store's next `whenVisible()`". The build calls the ordinary `end()` instead: the entry is removed with a queued `nav.pop()`. Safe because nav.ts `pop()` has no timer (a `popstate` delayed while the page is frozen only delays the queued sheet push to the resume), the rAF is cancelled by `clear()`, and entry 5's `done` already defers the open to `whenVisible()` with no announce on a hidden page (no second `done` path). If declined, the build stops for a ticket revision (a non-popping removal needs new AD-13 nav/overlays operations). If approved, entry 9 syncs AD-19 Hide (also: `installInterruptions`, not `main.ts`, registers the callback) and the EXPERIENCE.md Win celebration message row; the platform proof is entry 9's Android read.
2. ☰/`M` mid-run when the top at the settle is not `endSheet` (e.g. a back landing in between, or a second press that already opened the menu): the deferred open is dropped. This is the ticket's default, not a spec-prescribed outcome; it needs a SPEC F-row at entry 9's sync.
3. Entry 9 sync: tickets.toml entry 7's `interface` field (`end(hide-mode)`, main.ts registrations) is stale; the build uses plain `end()` and `installInterruptions`.
4. Interface deviation (technical, item 3 above): `openMenu()` is in `src/ui/open-menu.ts`, not `open-surface.ts`; entry 9's AD-13/AD-19 sync names open-menu.ts.
5. Residuals for entry 9's Android read: a toolbar resize ends the run; a back gesture between ☰'s queued pop and the sheet push is absorbed by nav as its own pending pop (AD-13); a bfcache restore after navigating away mid-run may leave nav's pending pop unsettled (the first back absorbed) and may keep the visible-branch outcome announce (scheduled by `done` after this flush's `cancelAnnounce()`); Android's handling of the sheet push after the hide callback is the ticket's open question.
6. This ticket closes the ☰/`M` merge blocker (10.4–10.6 owner items): the epic branch may merge once the owner accepts items 1–2.

## Verification

**Commands:**
- `npm run lint && npm run check && npm test` -- expected: green
- `npx playwright test e2e/celebration.spec.ts e2e/keys.spec.ts e2e/nav.spec.ts` -- expected: green
- `npm run test:all` -- expected: green
- `npm run test:screens` -- expected: green, no baseline written
- `git status --porcelain | grep -- -snapshots` -- expected: empty

## Auto Run Result

**Summary:** R-87's remaining end paths on top of entries 5–6. ☰ and `M` go through a new `src/ui/open-menu.ts` `openMenu()`: with the celebration on top it calls `celebration.end()`, then `nav.whenSettled(act(...))` opens the menu only if `endSheet` is on top (else dropped); otherwise `openSurface('menu')` as before. `menu` joins keys.ts `CELEBRATION_KEYS`. A new `src/ui/celebration/interruptions.ts` `installInterruptions({ win, registerBeforeHide, halted, end })`, called once by main.ts after its existing before-hide registrations, ends a live run on the hide flush, `resize` and `orientationchange` (plain `end()`, no-op with no run, skipped while halted). This closes the ☰/`M` merge blocker of 10.4–10.6.

**Files changed:**
- `src/ui/open-menu.ts` (new) — `openMenu()` for ☰ and `M`.
- `src/ui/celebration/interruptions.ts` (new) — hide, resize and orientationchange ends.
- `src/main.ts` — the `installInterruptions` call.
- `src/ui/TopBar.svelte`, `src/ui/keys.ts` — ☰ and the `menu` row call `openMenu()`; `menu` in `CELEBRATION_KEYS`.
- `src/ui/open-surface.ts`, `src/ui/Menu.svelte`, `src/ui/overlays.svelte.ts` — comments.
- `src/ui/celebration/attached.test.ts` — 10 `AD-19` cases (hide twice, no run, resize, orientationchange, halted, install twice, openMenu settle, drop under app ordering, no celebration, registration count).
- `src/ui/keys.test.ts` — `menu` out of `KEY_OF` (type and coverage test), "Z, Ctrl+Z, N and M act…" with the celebration module mocked.
- `e2e/celebration.spec.ts` — R-87 rows: hide/pagehide/show/☰/back/back, resize and orientationchange (announce positive control), ☰ single and double tap (back to the sheet), Undo button and New game Cancel (+ back leaves the app), Redo boundary; desktop `M` twice (back to the sheet) and `?`/WordCell `Enter`/`z`/Ctrl+Z/`n`.

**Review findings:** 22 (blind 11 rows, edge 3, intent 8; verification-gap none) — patched 7 rows in 6 fixes (medium 2 entries: drop U test under app ordering, live-region announce wait and positive control; low 4: back-to-sheet steps for double ☰ and `M` twice, interruptions.ts header, TopBar comment); deferred 0; rejected 15 with reasons in the triage log (low: focus-after-back already pinned, visible pagehide settled by the ticket, architecture scan, keys mock `importOriginal`, copied e2e helpers, visible-pagehide announce/bfcache residual, halt in the settle window, `openDeferred` false in the settle window, double-tap branch; false: open-menu.ts location (recorded default), checkpoint not stopped (unattended, owner items), synthetic lifecycle helpers, resize without size compare, halted in Vitest only).

**Follow-up review recommended:** true — two medium entries patched. Named risk: the drop branch is now proven for a second ☰/`M` press before the settle, but a back gesture landing between ☰'s queued pop and the sheet push (absorbed by nav as its own pending pop, AD-13) is exercised by no test; a follow-up pass or entry 9's Android read should confirm ☰ then an immediate back leaves the sheet expanded and no menu.

**Verification:** `npm run lint` (1 pre-existing warning, e2e/end-sheet.spec.ts:845), `npm run check`, `npm test` 3581 passed; `npm run test:all` exit 0 after the patches (unit 3581, size budget, dist-smoke 19, e2e 1093, pwa 17); `npm run test:screens` 67 passed; `git status --porcelain | grep -- -snapshots` empty. Matrix audit: every row covered by a passing test. Negative control (implementer): with the main.ts call disabled, the hide, resize and orientationchange e2e rows fail.

**Residual risks / owner items:** owner checkpoint items 1–6 in Design Notes, built unattended as 10.4–10.6: (1) rule 7 Hide refinement (plain `end()`, queued pop, vs AD-19 Hide's hide mode), awaiting the owner's nod; a decline means a ticket revision; (2) the dropped deferred menu open needs a SPEC F-row at entry 9; (3) tickets.toml entry 7 `interface` stale for entry 9's sync; (4) `openMenu()` in open-menu.ts, not open-surface.ts; (5) device-read residuals (toolbar resize ends the run, back between ☰'s pop and the push, bfcache pending pop and kept announce, Android sheet push after hide); (6) the ☰/`M` merge blocker is closed once items 1–2 are accepted.
