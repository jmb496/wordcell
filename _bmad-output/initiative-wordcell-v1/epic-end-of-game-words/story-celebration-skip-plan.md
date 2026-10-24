---
title: 'Celebration skip'
type: 'feature'
ticket: '6'
created: '2026-10-23'
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
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-end-of-game-words/story-celebration-skip.md'
warnings: [oversized]
deferred:
  - summary: >-
      The R-87 touch-press and held-finger e2e rows time `< LONG_PRESS_MS` from before `touchHold`, so setup and the sheet poll count against the 400 ms budget and may flake on a loaded runner.
    evidence: |-
      maybe-false: green in every run here; settle by repeated `test:e2e` runs under load or by timing between the helper's touchStart and touchEnd dispatches.
    location: >-
      e2e/celebration.spec.ts
    severity: medium (unverified)
baseline_revision: '2a0bfbd54aec16ad8bca1cf4d0fdf698d75e9b99'
---

<intent-contract>

## Intent

**Problem:** A running win celebration (entry 5) can end only by finishing, the cap, back or the old Esc path; R-87's skips (a press outside the bars, `Space`/`Esc`) are missing, a skipping press would also tap what lies under it, and Playwright has no hook-free way to skip a run.

**Approach:** Exactly as the ticket (story file; read it fully: Description bullets Interface, Press, Keys, Helper, Tuning; AC) states, with the resolutions under Design Notes: run-scoped `document` capture `pointerdown`/`keydown` listeners attached at `start()` and removed at the internal stop (`clear()`), one-shot post-run tails for the skipping press (its `pointerup` and click) and the skipping `Space` (its repeats and `keyup`), `pressEscape`'s `celebration` branch returning false, the DOM-only `skipByPress` helper, the R-87 skip rows and one screenshot frame. Tuning constants and copy scale ship unchanged (done checkpoint).

## Boundaries & Constraints

**Always:** Listeners on `document`, capture phase, never checking `defaultPrevented` (motion.ts's boot-time tracker runs first on the same node and may consume; `stopPropagation` there does not stop same-node listeners). A skip is `stopPropagation()` + `preventDefault()` then `end()`. Only the skipping input is consumed: these listeners never consume a pointer or key held from before the start, and a finish or the cap consumes nothing. While `game.state.kind === 'halted'` (AD-15) the run listeners and both tails pass everything through. Rule 6 throws (`AD-19 …`) for misuse only. Test names carry ids (`R-87` P6, `AD-19`/`AD-13` Vitest, `AD-17` helper and screens). `skipByPress` never names `__wordcell` (AD-18).

**Never:** ☰/`M`, hide or resize ends (entry 7); a `dist-smoke` spec (entry 8); a spine, SPEC, EXPERIENCE.md, rule-coverage, epic or ticket file edit (entry 9 / owner); a change to `step.ts` constants, the copy scale, `step.test.ts` pins or any existing baseline; a new public member on the pointer controller; `act()` around a skip.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Press skip | run live; primary `pointerdown` (any type), target outside `[data-band="topBar"]`, `[data-band="actionBar"]`, `[data-band="banner"]` | stopped + prevented, `end()` once, run listeners removed; press tail for that `pointerId` | — |
| Pass-through press | target inside a bar or the banner; `button !== 0`; a `pointerup` of a pre-start pointer | untouched, no `end()` | — |
| Press tail, before release | same-id `pointerup` | stopped + prevented; arms its own `createClickSwallower` on `document` (300 ms from this release) | same-id `pointercancel` or same-id `pointerdown`: tail gone, nothing consumed; other ids ignored |
| Press tail, after release | its trailing click (`detail ≥ 1`); SPEC F18: any new `pointerdown` (any id) within `SWALLOW_MS` of the release, its `pointerup` and click | stopped + prevented (swallower re-armed from each consumed release); gone once the guard expired, no consumed press held and the swallower disarmed | after the guard any `pointerdown`: passes, disarms the swallower |
| Key skip | non-repeat `Space` (no Shift) or `Esc` (Shift allowed), no Ctrl/Meta/Alt, any focus | stopped + prevented, `cancelGesture()` then `end()`; `Space` leaves the Space tail | repeat, Shift+`Space`, chord: untouched |
| Space tail | `Space` repeats; `Space` `keyup` | stopped + prevented; gone on the keyup | fresh non-repeat `Space` keydown or window `blur`: gone, that keydown untouched; no expiry |
| Halted | `game.state.kind === 'halted'` | run listeners and tails pass everything | — |
| Skip before the push settles | nav unsettled | `end()` at once (nav queues the pop after the push) | — |
| Esc via keys.ts | top is `celebration` | `pressEscape()` returns false: no `act()`, no `preventDefault` | — |

</intent-contract>

## Code Map

- `src/ui/celebration/skip.ts` (new, suggested name) -- `createSkip(deps)` → `{ attach(), detach() }` holding the run listeners and the two tails; deps injected for tests: `doc`/`win` (`Pick<EventTarget,'addEventListener'|'removeEventListener'>`, as motion.ts `startTracker`), `end`, `cancelGesture`, `halted(): boolean`, `setTimer`/`clearTimer` (for `createClickSwallower`). Bar test: `(event.target as Element | null)?.closest('[data-band="topBar"],[data-band="actionBar"],[data-band="banner"]')` (Board.svelte L70 banner wrapper, TopBar.svelte L52, ActionBar.svelte L107; Board's spacers/tracks also carry `data-band` ids, empty layout elements; the P6 column-point press proves the test). Key rules mirror `match` in `src/ui/keys.ts` L467 (`' '` rejects Shift, `Escape` accepts it, Ctrl/Meta/Alt reject). Tail lost-end rules mirror motion.ts `onEvent` (fresh keydown / same-id pointerdown = lost end, window `blur` clears).
- `src/ui/gestures/click-swallow.ts` -- reuse `createClickSwallower` and `SWALLOW_MS` unchanged; it listens only for `click`, so the tail adds its own `pointerdown` capture listener that calls `disarm()`.
- `src/ui/celebration/celebration.svelte.ts` -- `build()`: create the skip per instance; `attach()` in `start()` after `run` is set (not on the empty-list path); `detach()` in `clear()` when a run was live (every removal reaches `clear()`: `end()`, `removed()`, `cancel()`; entry 4 Notes (d)); `end` dep is the instance's `end`; `halted` reads `game.state.kind` (`../../shell/game.svelte`); `cancelGesture` from `../act`; real deps `document`, `window`, `setTimeout`/`clearTimeout` read at `start()` (the unit env is `node`; fakes stub them). Header comment gains entry 6.
- `src/ui/keys.ts` -- `pressEscape()` L553: `if (top === 'celebration') return false;` before `act(...)`; drop the `CELEBRATION_KEYS` comment's "interim gaps until entry 6's capture listener" for `Space` (L526–530).
- `src/ui/keys.test.ts` L1534 "AD-13 Esc on the celebration closes it…", `src/ui/celebration/attached.test.ts` L253 "AD-13 pressEscape with the entry on top…" -- rewrite to: returns false, depth unchanged, nothing default-prevented, no `act()`.
- `src/ui/celebration/celebration.svelte.test.ts`, `attached.test.ts` (and any other `start()` caller under Vitest) -- their `document` fakes gain `addEventListener`/`removeEventListener` (a recording fake), plus `window` and timers as needed; `attached.test.ts` already mocks `../../shell/game.svelte` with `state.kind`.
- `e2e/helpers/celebration.ts` -- add `skipByPress(page)`: waits for `[data-celebration-group]` count > 0, presses the centre of `[data-celebration-root]`'s bounding box (`page.touchscreen.tap` when `navigator.maxTouchPoints > 0`, else `page.mouse.click`), then `expect(sheet).toBeVisible({ timeout: 1000 })` and asserts it expanded as `finishCelebration` does. No `window.__wordcell`.
- `e2e/helpers/touch.ts` `touchHold` (L80), `longPress` -- held touches; `e2e/helpers/board.ts` `openFixture`, `stashSession`/`sameSession`, `column`, `centre`, `END_SHEET`; `e2e/helpers/dialogs.ts` `wc`, `button`; `e2e/helpers/project.ts` `onAndroid`/`onDesktop`; `e2e/dictionary.spec.ts` L116/L141 (500 route on `LIST`, Reload by role and name, request count). `LONG_PRESS_MS` = 400 (`src/ui/gestures/classify.ts` L8). Won game: every column is empty; the copies root has `pointer-events: none` (Celebration.svelte L75).
- `e2e/celebration.spec.ts` -- existing `readyToWin`, `winIntoRun`, `sheet`, `primary`; add the skip rows here (`android` describe) and a `desktop` describe (`test.beforeEach(onDesktop)`) for the keys.
- `e2e/confirm.screens.spec.ts` -- pattern for the new `e2e/celebration.screens.spec.ts`.

## Tasks & Acceptance

**Execution:**
- [x] `src/ui/celebration/skip.ts` -- run listeners and tails per the matrix -- Press, Keys bullets
- [x] `src/ui/celebration/celebration.svelte.ts` -- wire attach/detach and deps -- Interface bullet
- [x] `src/ui/keys.ts` -- `pressEscape` celebration branch returns false -- Keys bullet
- [x] `src/ui/celebration/skip.test.ts` (new) -- `AD-19` cases over a recording fake `doc`/`win` and plain event objects (`type`, `button`, `pointerId`, `pointerType`, `key`, `repeat`, modifier flags, `detail`, `target` with `closest`, spied `stopPropagation`/`preventDefault`), fake timers: every matrix row; a press over 300 ms before release still swallows its click; a pre-start pointer's `pointerup` passes while a new id's `pointerdown` skips; keys skip with a focused bar or banner control (the listener reads no focus); repeat, Shift+`Space`, Ctrl/Meta/Alt chords and `button` 1/2 pass untouched (not stopped, not prevented, no `end()`), Shift+`Esc` skips; key skip order `cancelGesture`, `end`; the skipping `pointerdown` is stopped + prevented (so the bubble-phase controller never opens a press; with the key skip's `cancelGesture()` the controller holds no press after either skip); halted: run listeners and tails pass; each tail consumes its release then is gone (press: `pointerup` and click; Space: repeats and `keyup`); press tail gone on swallower expiry, same-id `pointercancel` or same-id `pointerdown` before release, any `pointerdown` after; Space tail gone on a fresh `Space` keydown or window `blur`, no expiry; `detach()` removes every run listener; tails survive `detach()`
- [x] `src/ui/celebration/attached.test.ts` -- `AD-19` integration on the attached singleton: a skip press calls `end()` once (one pop, `done` once after a microtask), a second press after it adds nothing; run listeners gone (fake `doc` has none of the run's) after finish, cap, `end()`, back (`closedByBack` removal), Undo cancel (`cancelled` removal); a skip before the push settles (nav stub unsettled) still ends at once; no listeners before `start()` or after the empty-list start; rewrite the L253 Esc test
- [x] `src/ui/keys.test.ts` -- rewrite L1534 per the Code Map
- [x] `e2e/helpers/celebration.ts`, `e2e/helpers.spec.ts` -- `skipByPress` and its `AD-17` self-test (android touch and desktop mouse: enable, win into a run, `skipByPress` → `running()` false, sheet expanded)
- [x] `e2e/celebration.spec.ts` -- the R-87 skip rows (AC below)
- [x] `e2e/celebration.screens.spec.ts` (new) -- `AD-17 celebration mid-run frame at 360 px`: `onAndroid`, 360×740, `openFixture('session-won-words', { steps: ['undo'] })`, dictionary ready, `enableCelebration`, Confirm, `running()` true, one fixed `advance` (e.g. 1200 ms) with `running()` still true, `toHaveScreenshot('celebration-mid-run.png')`; baseline via `npm run test:screens -- e2e/celebration.screens.spec.ts` (writes only the missing file)
- [x] `npm run test:all`, then `npm run test:screens` green; `git status e2e/` shows only the new baseline among snapshots

**Acceptance Criteria:**
- Given the ticket's AC, when the suites run, then the four R-87 skip rows pass on their rule-coverage projects (`android`; `desktop` for `Space`/`Esc`), with these resolutions:
- Given a run live on `android`, when a `touchHold` presses an empty band point (inside an empty column, clipped to the band) and, separately, a non-empty WordCell, is held until the sheet is visible and released before `LONG_PRESS_MS` (400 ms) from the press (the test asserts the elapsed time, so a long hold fails rather than skipping the click), then a window bubble-phase `pointerup`/`click` recorder installed before the press saw nothing, the sheet is expanded, no WordCell view opened, no sheet action activated (no confirm dialog, focus on Replay this deal), `sameSession` true; and a positive control, after 300 ms, taps the empty point again and the recorder sees its `pointerup` and `click`.
- Given `desktop`, when Enter confirms on the first strip card and `running()` is polled true first (the AD-14 guard eats earlier keys), then `keyboard.down('Space')`, a second `keyboard.down('Space')` once Replay this deal has focus, `keyboard.up('Space')` (and separately `keyboard.press('Escape')`) end the run, and after the release the sheet is expanded, Replay this deal focused, no Replay confirm dialog, `sameSession` true.
- Given a run on `android`, when `page.goBack()`, then the sheet is expanded and the app open (not `about:blank`); a second `goBack()` collapses the sheet and the app stays open.
- Given a touch held on an empty column point from before an Enter Confirm (sent within 400 ms of the hold), when released mid-run, then `running()` stays true; given the 500 dictionary route with the banner shown, when its `Reload` is clicked mid-run, then a second list request arrives, `running()` stays true and the sheet has count 0.

## Implementation Notes

- `skip.ts`: `createSkip({ end, cancelGesture, halted })` → `{ attach(env), detach() }`; the environment (`doc`, `win`, `setTimer`, `clearTimer`) is passed to `attach()` at each `start()`, so the real `document`/`window`/timers are read there. Misuse (attach while attached, detach while detached) throws `AD-19 skip: …`.
- The press tail reuses `createClickSwallower` unchanged; it arms it on a thin `document` proxy whose click listener is gated on the halt and whose `removeEventListener` (swallowed click, expiry or `disarm()`) ends the tail.
- `celebration.svelte.test.ts` now mocks `../../shell/game.svelte` (the real store adds window listeners at import) and stubs a recording `document`/`window`; `controller.test.ts`'s `celebrateLive` fake document gained listener methods.
- `skipByPress`'s self-test lives in the android-only `celebration helpers` describe: the touch path on the android page, the mouse path on a `Desktop Chrome` context opened from it.

## Plan Change Log

## Review Triage Log

### 2026-10-23 — Review pass
- verdicts: 27 findings — high 0, medium 3, low 13, false 10, maybe-false 1
- findings:
  - `[medium]` `[patch]` (blind) the press skip stops its `pointerdown`, so the controller's per-press upkeep (hover-peek timer, open hover peek, a press held from before the start) never runs; the ticket U "after a press skip the controller holds no press" fails with a held pre-start press — `controller.cancel()` clears all three (controller.ts header L88–90); fixed: `onDown` calls `cancelGesture()` before `end()`; skip.test.ts press cases expect `['cancelGesture', 'end']`.
  - `[low]` `[reject]` (blind) `skipByPress` could pass if the run finished naturally between its poll and the tap — milliseconds between poll and press against a multi-second run; the hook build's manual clock never finishes; a guard cannot tell the two apart.
  - `[low]` `[patch]` (blind) the held-finger e2e row does not show the pre-start pointer's release reaches the page — attempted: the release never reaches window bubble listeners with or without the skip (motion.ts `install()` marks every open gesture consumed when the AD-14 winning guard installs, F8), so a recorder assertion would always fail; the test keeps `running()` true and gains a comment saying why; the skip-side pass-through stays pinned by skip.test.ts.
  - `[low]` `[patch]` (blind) the positive control's "past the 300 ms swallow window" comment misdescribes it (any later `pointerdown` disarms the swallower) — fixed: comment reworded (an ordinary tap reaches the recorder once the tail is gone).
  - `[maybe-false]` `[defer]` (blind) the `< LONG_PRESS_MS` elapsed check includes `touchHold` setup and the sheet poll, so a loaded runner may flake — passed in every run here; settled by repeated runs under load or timing between touchStart/touchEnd inside the helper.
  - `[low]` `[reject]` (blind) no test that the band stays as measured at `start()` when the banner hides — the band is measured once in entry 5's `start()`; skip.ts reads no geometry, so this change cannot alter it; the 500 route keeps the banner shown.
  - `[low]` `[reject]` (blind) the desktop key rows do not assert a bar control holds focus before Space — the listener has no focus code path (F17), pinned by the unit cases with focused bar/banner targets; an e2e focus assertion adds nothing reachable.
  - `[low]` `[reject]` (blind) a skipping touch held past the platform long-press time may raise contextmenu/callout — the board surfaces (Card, Column, WordCellRow, WordCellView) carry `-webkit-touch-callout: none`/`user-select: none`; fix would add a listener for a non-visible outcome.
  - `[low]` `[reject]` (blind) press-tail replacement and cross-kind tail cases untested — a second press skip needs a second run while a tail lives (the tail ends ≤ 300 ms after release); unreachable in play.
  - `[false]` `[reject]` (blind) two test fakes key listeners by function, ignoring type — no current assertion depends on per-type tail listeners through those fakes; no named harm.
  - `[false]` `[reject]` (blind) the skip.test.ts fake clock does not accumulate, so the "held over 300 ms" test is hollow — an arm-at-press implementation would have its 300 ms timer fired by that `elapse(10_000)`, so the test does discriminate; no test chains sub-300 elapses.
  - `[low]` `[reject]` (blind) tails never end while halted — Halted is terminal (Reload reloads the page); fix adds branches for no visible outcome.
  - `[low]` `[patch]` (blind) celebration.svelte.ts header has a broken line wrap — fixed: re-wrapped.
  - `[low]` `[patch]` (blind) skip.ts header cites "owner checkpoint item 1, for entry 9's spine sync", a stale process pointer — fixed: "(AD-19 Skip refinement, see the ticket plan)".
  - `[low]` `[reject]` (edge) contextmenu on a long-held skipping touch — same as the blind contextmenu row.
  - `[false]` `[reject]` (edge) a key skip leaves a tile selection that the old act()-wrapped Esc cleared — the win's phase change clears the tile selection (Q-24) and the won tray has no tiles; `pressEscape`'s tile branch still runs before the celebration branch.
  - `[low]` `[reject]` (edge) `skipByPress` false positive on a run that ended on its own — same as the blind row.
  - `[false]` `[reject]` (edge, deletion) the clearTile contract of the old Esc path was dropped — unreachable with a selection, as the tile-selection row.
  - `[medium]` `[patch]` (verification-gap) the controller's real `halted` wiring is untested — fixed: attached.test.ts case with the mocked store halted: press, Space, Esc pass untouched, run and listeners stay.
  - `[medium]` `[patch]` (verification-gap) the key skip's `cancelGesture()` is untested through the controller — fixed: `load()` registers a recording controller; Esc, Space and a press each log `['cancel', 'onEnd', 'pop']`.
  - `[false]` `[reject]` (intent) Space/Esc skip with a focused bar control, unlike the starting text — SPEC F17 (owner default recorded in the ticket, SPEC and epic Notes) supersedes it; the invocation confirms.
  - `[false]` `[reject]` (intent) no constants/copy-scale change — the intent ties the adjustment to Jared's Android read, which has not happened; done checkpoint (owner item 3).
  - `[false]` `[reject]` (intent) e2e skips run on the manual clock, not a live rAF run — AD-17 Celebration seam by design; the hook-free run is entry 8's; attached.test.ts drives the rAF run.
  - `[false]` `[reject]` (intent) back is `page.goBack()`, not the device gesture — the AC's surface; the device behaviour is the ticket's stated unknown for the device read.
  - `[low]` `[patch]` (intent) the banner Reload row clicks with the mouse on the touch `android` project — fixed: `button(page, 'Reload').tap()`.
  - `[false]` `[reject]` (intent) the R-87 rows do not use `skipByPress` — the plan AC prescribes `touchHold` for the timing and recorder; the helper is entry 8's and self-tested.
  - `[false]` `[reject]` (intent) spine AD-19 still carries the focus exception and run-scoped pointerup/click — owner items 1–2, entry 9's doc sync.

## Design Notes

Skip sketch (names free; the matrix is the contract):

```ts
function onDown(e: PointerEvent) {
  if (deps.halted() || e.button !== 0 || inBars(e.target)) return;
  consume(e); pressTail(e.pointerId); deps.end();
}
function onKey(e: KeyboardEvent) {
  if (deps.halted() || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
  const space = e.key === ' ' && !e.shiftKey;
  if (!space && e.key !== 'Escape') return;
  consume(e); if (space) spaceTail(); deps.cancelGesture(); deps.end();
}
```

Review-log items left for the build, resolved:
1. Verify line projects: AC 1 ("their rule-coverage projects").
2. Tap window: AC 2 (release before `LONG_PRESS_MS`, elapsed asserted, positive control).
3. U wording (same-id before release, any after): matrix and skip.test.ts task.
4. Tuning subject: the done-checkpoint section reads "changing one (50 % overlap, 90 % fit share, 40 % floor) is an owner amendment, applied here with the values".
5. AD-19 Skip refinement and R-87 banner wording: owner items 1–2 below.
6. Halt pass-through: built (Always, matrix, U case).
7. "these listeners never consume …": Always line.
8. Controller holds no press after either skip: skip.test.ts task.
9. `Space` once `running()`: AC 3.
10. Device read URL and install: done-checkpoint section.
11. Long-list fixture owner: owner item 4.
12. ☰/`M` excluded from the checklist: done-checkpoint section.
13. "pass untouched": matrix and U task.
14. Bar test `[data-band=…]` ancestor: Code Map.
15. Tuning shorter than the Fast cap: not adopted; the ticket's Tuning bullet decides (a Slow run ending before the Fast cap retargets entry 5's Slow-cap row; a value breaking a behaviour row stops for the owner). Moot this session: values ship unchanged. Post-read path: done-checkpoint section.

Owner checkpoint items (rule 7; plan checkpoint, built unattended as 10.3–10.5):
1. AD-19 Skip refinement: its run-scoped `pointerup`/`click` listeners become post-run tails (the press tail with its own 300 ms swallower from the release; a new Space tail for repeats and `keyup`), and the run listeners pass everything while halted (AD-15). Entry 9 syncs the spine.
2. R-87 names only the top and action bars; the build exempts the whole dictionary banner (SPEC CAP-3, AD-19 Skip, EXPERIENCE.md Skip). Entry 9 syncs R-87.
3. Done checkpoint (gate 4): Jared's Android read is pending; constants and copy scale ship unchanged.
4. The long-list fixture A-D12's 40 % floor, a 23-letter row and hundreds of copies need is entry 9's deliverable; the epic Notes should say so (build-auto writes no ticket or epic file).
5. Until entry 7, ☰ or `M` during a run throws; the branch must not merge before entry 7 (as 10.5).

Done checkpoint (device read; `unverified`, needs the device):
- Handoff: `npm run build`, `npm run preview` (hook-free `dist/` on `localhost:4173`); chrome://inspect port forwarding `4173` → `localhost:4173`; on the phone, Remove animations off and site data cleared, open `localhost:4173/icons/icon-192.png` (same origin, shown inline; `manifest.webmanifest` may download), write `fixtures/session-won-words.json` to `localStorage['wordcell:session']` from that tab's console, open `/`, Undo, Confirm. Install from `localhost:4173` for the installed read, or record the read as tab-only.
- Checklist: copy cost and frame rate; the constants' feel; A-D12 readability at the fixture's sizes; no trail, no colour change; the press skip; back skips, a second back collapses the sheet. Not ☰/`M` (entry 7).
- After the read (a later session): apply Jared's values within F6/F7 and the AD-19 cap to `step.ts` / the copy scale, update `step.test.ts` pins; rule-coverage AD-19 `step` rows and R-87 cap rows stay green (a Slow run ending before the Fast cap retargets entry 5's Slow-cap row; a value breaking a behaviour row or a copy cost failing on the device stops for the owner, F2); changing one of the 50 % overlap, 90 % fit share or 40 % floor is an owner amendment, applied with the values; `npm run test:all`; regenerate only `e2e/celebration.screens.spec.ts` in the container (`npm run test:screens -- e2e/celebration.screens.spec.ts --update-snapshots=changed`), `git status e2e/` shows no other baseline, `npm run test:screens` green; record the values, any amendment and the A-D12 verdict (plus what is carried to entry 9) in the epic Notes and this plan.
- Tuning applied (2026-10-24, owner device reads, SPEC F20/F21/F23): `CARD_STEP` 0.65 replaces `OVERLAP` 0.5 (fit share 0.9, floor 0.4 unchanged); per-card follow-the-leader on a closed-form group path (`cardX`/`cardY` in `step.ts`, one transform per copy in `celebration.svelte.ts`), leading end first; SPEC F23 (second read): each card one row step (`CARD_STEP` 0.65 card units) behind the card ahead measured along the path (arc length in card units, x over the scaled card width and y over the scaled card height, so a steep stretch spaces cards 0.65 card heights apart, not 0.49; per-group arc tables from the closed form at launch, binary search plus one Newton step per trailing card per read, allocation-free), trailing card k on the row line behind the launch point until the leader has run k steps; stacking: within a group the lower copy (greater y) is drawn above so it covers only the bottom of the copy above, equal y keeps row order (`stackOrder` in `step.ts`, an insertion sort from the previous frame's order in preallocated per-group arrays; the controller writes a copy's `z-index` only when its place changes); drift from the leading card's travel (`EXIT_AFTER_CONTACTS` 2) with the SPEC F22 pace fit on the arc trail (whole arc faster, gravity × pace²) so the last card exits by cap − 1 × base (pace at Normal 1.00 on the fixture and the long scene at all three geometries except the long scene's 23-letter row in landscape, 1.093; ≈ 1.64 for a 23-letter 31st entry); other constants unchanged; only `celebration-mid-run-android-linux.png` regenerated; the controller's Slow-fade test still passes on the cap − 320 ms fit (the step fade tests unchanged). F20/F21/F23 tests: `step.test.ts` 'AD-19 SPEC F20: at launch consecutive cards sit CARD_STEP (0.65) card widths apart in letter order, the row rowWidth wide', 'AD-19 SPEC F23: consecutive cards are CARD_STEP card units apart along the path (arc length) at launch, mid-rise, near the bounce and in the fall', 'AD-19 SPEC F23: the gap is in card units: the row line keeps the row step in px, a steep stretch spaces cards by card heights, the apex by card widths', 'AD-19 SPEC F23 stacking: stackOrder puts the lower card (greater y) above; equal y keeps the row order (the later letter above)', 'AD-19 SPEC F23 stacking: each frame the stack follows y over a whole run (both sides): rising, the trail is above its leader; falling, the leader is above its trail', 'AD-19 SPEC F23: before the leader has run k row steps, trailing card k slides on the row line behind the launch point', 'AD-19 SPEC F23: letter order holds all run, each card one row step of arc behind the card ahead (both sides)', 'AD-19 floor contact: each card meets the floor at its own first contact, in travel order, rebounds and counts one bounce', the 'AD-19 every card bounces on the floor, then exits, all before the closing fade (…)' matrix, 'AD-19 a trail that would overrun is fitted: …' and 'AD-19 SPEC F22, F23: the card-unit trail fits at the natural tempo, pace 1, except the 23-letter row in landscape (…, Normal, …)'; `celebration.svelte.test.ts` 'AD-19 SPEC F20, F21, F23: the first frame writes each copy at its row place, CARD_STEP card widths apart; later each copy trails the one ahead on the path', 'AD-19 SPEC F23 stacking: each copy gets the z-index of its place by y (…), written only when that place changes', 'AD-19 SPEC F23 stacking: a re-registration writes every copy's z-index again on the next render'; `Celebration.test.ts` 'AD-19 SPEC F20: the copies carry no row layout (step.ts places each card, CARD_STEP 0.65 apart) and the faces carry the drag shadow', 'AD-19 SPEC F23 stacking: the copies carry no z-index of their own; the letter and badge sit in the top of the face, so a lower copy drawn above covers only the bottom'. Entry 9 adds the F20/F21 rows to rule-coverage.md.

## Verification

**Commands:**
- `npm run lint && npm run check && npm test` -- expected: green
- `npx playwright test e2e/celebration.spec.ts e2e/helpers.spec.ts e2e/keys.spec.ts e2e/dictionary.spec.ts` -- expected: green
- `npm run test:all` -- expected: green
- `npm run test:screens -- e2e/celebration.screens.spec.ts` then `npm run test:screens` -- expected: baseline written once, then green
- `git status --porcelain e2e/ | grep -- -snapshots` -- expected: only the new `celebration-mid-run` baseline(s)

## Auto Run Result

**Summary:** R-87's skips on top of entry 5's run: run-scoped `document` capture `pointerdown`/`keydown` listeners (attached at `start()`, removed at `clear()`) end the run on a primary press outside `[data-band=topBar|actionBar|banner]` or a non-repeat `Space`/`Esc` whatever holds focus (SPEC F17); each skip calls `cancelGesture()` then `end()`; one-shot post-run tails consume the skipping press's `pointerup` and click (own 300 ms swallower from the release) and the skipping `Space`'s repeats and `keyup`; everything passes while halted (AD-15); `pressEscape` returns false with the celebration on top; hook-free `skipByPress` helper; R-87 skip rows; one mid-run screenshot frame. Tuning constants and copy scale ship unchanged (done checkpoint).

**Files changed:**
- `src/ui/celebration/skip.ts` (new) — run listeners and the two tails.
- `src/ui/celebration/celebration.svelte.ts` — per-instance skip, attach in `start()`, detach in `clear()`, halted from the game store.
- `src/ui/keys.ts` — `pressEscape`'s celebration branch returns false; comment.
- `src/ui/celebration/skip.test.ts` (new) — AD-19 matrix cases.
- `src/ui/celebration/attached.test.ts` — AD-19 integration (skip press, early skip, listeners gone after every end, halted wiring, `cancel` order), rewritten Esc test.
- `src/ui/celebration/celebration.svelte.test.ts`, `src/ui/gestures/controller.test.ts` — recording `document` fakes; game store mock.
- `src/ui/keys.test.ts` — rewritten Esc-on-celebration test.
- `e2e/helpers/celebration.ts` — `skipByPress`; `e2e/helpers.spec.ts` — its AD-17 self-test (touch and mouse).
- `e2e/celebration.spec.ts` — R-87 skip rows (android press ×2, back, held finger, banner Reload; desktop Space, Esc).
- `e2e/celebration.screens.spec.ts` (new) + `celebration-mid-run-android-linux.png` baseline.

**Review findings:** 27 — patched 8 (medium 3: press skip `cancelGesture()`, halted wiring test, controller `cancel` order test; low 5: header wrap, stale header pointer, positive-control comment, banner `.tap()`, held-finger recorder attempted and replaced by a comment, F8); deferred 1 (`< LONG_PRESS_MS` timing flake risk, unverified medium); rejected 18 with reasons in the triage log (low: skipByPress race, band-after-banner, desktop focus assertion, contextmenu ×2, press-tail replacement, halted tails, skipByPress ×2 grouped; false: loose fakes, fake clock, tile selection ×2, F17 focus, tuning, manual clock, goBack, helper use, spine sync).

**Follow-up review recommended:** true — three medium entries patched. Named risk: the press skip now calls `controller.cancel()` on every skip, whose side effects (hover-peek close and suppression slot, a held pre-start press ended, deselect) are proven only through fakes in attached.test.ts and indirectly by the e2e rows; a follow-up pass should confirm no visible change on the end sheet after a desktop mouse skip over a hovered WordCell.

**Verification:** `npm run lint && npm run check && npm test` green (3524 tests); targeted Playwright (celebration, helpers, keys, dictionary) 132 passed before the patches; `npm run test:all` exit 0 before and after the patches (1076 e2e passed); `npm run test:screens` 67 passed, only the new `celebration-mid-run` baseline among snapshots. Matrix test audit: every row covered by a passing test. Unit suite ~16.5 s on this `/mnt/wsl` checkout (budget is measured on a Linux-filesystem checkout; not measured there).

**Residual risks / owner items:** owner checkpoint items 1–5 in Design Notes (AD-19 Skip refinement and R-87 banner wording for entry 9's sync; Jared's Android device read pending, constants unchanged; the long-list fixture is entry 9's deliverable, epic Notes should say so; ☰/`M` throws during a run until entry 7, do not merge before entry 7). Device behaviour of back-then-push on Android remains the ticket's stated unknown for the device read.

