---
id: 7
type: story
title: "Celebration interruptions"
parent: epic-end-of-game-words
covers: [CAP-3]
after: [6]
risk: high
---

# Celebration interruptions

## Description

Adds the new end paths on top of entries 5 and 6: the ☰ button and `M` (sheet expanded, then the menu after the push settles), the before-hide callback (sheet open queued for the next visible, idempotent) and `resize`/`orientationchange`; and proves with Playwright the behaviours entries 4 and 5 already provide: Undo, New game and the `N` key cancel without a sheet, a Redo that restores the win starts it again, and `?` and WordCell keys do nothing while it runs.

- Interface: `celebration.end()` as it is (no mode or parameter); `openMenu()` exported from `src/ui/open-surface.ts` for ☰ and `M` (no import cycle: celebration.svelte.ts's imports never reach open-surface.ts); a new UI module `src/ui/celebration/interruptions.ts` exporting `installInterruptions({ win, registerBeforeHide, halted, end })`, which registers the before-hide callback and the `win` `resize`/`orientationchange` listeners; `main.ts` calls it once at boot after its existing `registerBeforeHide` calls, passing `window`, `game.registerBeforeHide`, its `halted()` and `celebration.end`. Tests: R-87 interruption rows (P6, `desktop` for keys); UI Vitest `AD-19` hide, resize and menu wiring tests (AC). Owns: the menu, hide and resize ends of the run. Consumers: none. Plan checkpoint: the build stops at its plan for the owner; the plan carries the Hide default below as a rule 7 item for the owner's nod (story-celebration-overlay-entry-plan.md residual risks).
- Hide: the `installInterruptions` before-hide callback calls the ordinary `end()` (close → queued `nav.pop`), no mode flag or parameter. Idempotent: the second flush on `pagehide`, or no live run, is a no-op (`clear()` returns null). Entry 5's `done` closure already defers `openDeferred` to `game.whenVisible()` on a hidden page with no `announceOutcome()` (story-celebration-overlay-entry-plan.md owner item 1: no second `done` path). Rule 7 (plan checkpoint): this departs from AD-19 Hide's "the hide mode only stops the run and removes the entry"; the plan names that sentence, says why a queued pop is safe (nav.ts `pop()` has no timer; a `popstate` delayed while the page is frozen only delays the queued sheet push to the resume; entry 5's `done` defers the open to `whenVisible()`), and the conforming alternative the build takes if the owner declines: remove the entry without `nav.pop` and let the sheet's push reuse the stale history entry. If approved, entry 9 syncs AD-19's wording; the platform proof is entry 9's Android read. Any `pagehide` while visible (a reload or navigation away) also runs the hide end (`done`'s visible branch); the next flush's `cancelAnnounce()` (already in `main.ts`'s before-hide list) drops the announce, so nothing new is needed; "R-87 a reload mid-run is a relaunch: the sheet opens expanded at boot and no copy is drawn" must stay green (R-73).
- Resize: `installInterruptions` adds permanent `win` `resize` and `orientationchange` listeners that call `end()` (a no-op with no run; any such event during a run ends it, no size compare).
- Halted: the check `game.state.kind === 'halted'` (AD-15) lives in the hide and resize callbacks only (inside `installInterruptions`), never in `end()` (the cap and finish ends are unchanged): `game.svelte.ts` `flush()` runs the callbacks in every state; `skip.ts` likewise passes everything through while halted.
- Menu (SPEC F13, A-E16): `openMenu()` (Interface) is called by `src/ui/TopBar.svelte`'s `act(openMenu)` (its local `openMenu` goes) and the keys.ts `menu` row's `run`; `menu` joins `CELEBRATION_KEYS` (the keys.ts interim-gap comment and the overlays.svelte.ts `SUSPENDING` comment change together). In keys.test.ts `menu` moves out of `KEY_OF` (no "AD-13 menu ("m") runs no attempt() row while only celebration is open" case), and "AD-13 the KEY_OF table covers every ROWS id but undo and newGame" now excludes undo, newGame and menu (title to match). With `celebration` open, `openMenu()` calls `celebration.end()`, then `nav.whenSettled(…)` runs `openSurface('menu')` (SPEC CAP-3, AD-19) only if the top entry is `endSheet`, else nothing (this ticket's default, listed at the plan checkpoint for a SPEC F-row at entry 9's sync); otherwise today's `openSurface('menu')` unchanged. `act()` is unchanged (AD-19). This removes the interim gap entries 4–6 left (☰ throws the `open(menu)` guard to AD-15; `M` is ignored).
- Keys (SPEC F15): `?` and WordCell `Enter` already do nothing (entry 4, `SUSPENDING`). For a WordCell tap, "does nothing" means no WordCell action: the tap is entry 6's consumed press skip, covered by "R-87 a touch press on a non-empty WordCell skips the run, consumed: …" (the `${name}` case of the press-skip test); entry 9 rewords the rule-coverage row, EXPERIENCE.md "Keys while it runs", AD-13's celebration sentence and SPEC F15 so each reads as no WordCell action (the press skips, R-87).
- Cancel: Undo (button, `android`; `Z`/Ctrl+Z, `desktop`), New game and `N` cancel (entries 4 and 5): `running()` false, no copies, no end sheet, no overlay history entry, and still no sheet after a few animation frames (`animationFrames`, e2e/helpers/lifecycle.ts); New game then back leaves the app (AD-13).
- Redo: the boundary case: Undo mid-run (no sheet), Redo → a new run, finish → exactly one expanded sheet.

## Acceptance Criteria

Verify: `npm run test:all` and `npm run test:screens` are green, no screenshot baseline is added or changed (no `*-snapshots` path in the diff), and these R-87 rows of rule-coverage.md pass with the seam enabled:

- New, "hide the app mid-run, show: sheet expanded, back and menu still work (`hidePage`/`showPage`); resize ends it" (`android`). Hide: seam on, win into the run, `hidePage` → `running()` false, no celebration copies, end sheet not open, history back at the base entry (no overlay entry); `pageHide` (second flush, no throw); `showPage` → sheet expanded with one overlay history entry, Replay this deal focused, no outcome announced (a return from hidden is silent, EXPERIENCE.md); ☰ opens the menu over the expanded sheet and back closes only the menu; back again collapses the sheet, the app still open. Resize: `page.setViewportSize` mid-run → sheet expanded, Replay this deal focused; `orientationchange` by a dispatched `Event` (P6).
- New, "`?`, WordCell `Enter` and a WordCell tap do nothing while it runs; `N` and Undo keys act" (`desktop`): `?` (no How to play) and `Enter` on a focused non-empty `wordcell-3` (no view), `running()` still true afterwards; `N` and `Z`/Ctrl+Z as Cancel. The WordCell tap is entry 6's test (Keys).
- New, "☰ ends it, sheet expanded behind the menu; back closes the menu only" (`android`; `M` `desktop`): ☰ mid-run → `running()` false, no copies, sheet expanded behind the menu (two overlay history entries); back closes only the menu (one); a double ☰ tap (`android`) and `M` twice (`desktop`) give one menu and no Halted surface.
- New, "Undo stops it, no end sheet; New game stops it" (`android`): the Cancel outcome for the Undo button and New game.
- Passing from entry 5, "a Redo that restores the win plays it again": "R-87 a Redo that restores the win plays it again: the first run is gone and a new group is shown"; new beside it, the Redo boundary case.
- UI Vitest `AD-19` (AD-19 Tests), driving `installInterruptions` with fakes: the hide callback twice gives one pop and one `done`; with no run it is a no-op; `resize` and `orientationchange` each end a live run once; while halted, the hide callback, `resize` and `orientationchange` leave a live run running (no pop, no `done`); `openMenu()` calls `end()` before the deferred open and drops the open when the top is not `endSheet`.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-end-of-game-words/epic-end-of-game-words.md
- architecture — ARCHITECTURE-SPINE.md AD-9, AD-13, AD-19 (Hide)
- spec — SPEC.md CAP-3, F13, F15, F16; rule-coverage.md (R-87 interruption rows)
- design — EXPERIENCE.md Win celebration (Skip, Never plays, Keys while it runs), A-E16
- code — src/ui/keys.ts, src/ui/act.ts, src/ui/TopBar.svelte, src/ui/celebration/celebration.svelte.ts, src/main.ts, src/ui/end-sheet.ts, src/ui/overlays.svelte.ts, src/ui/open-surface.ts, src/shell/nav.ts (whenSettled), src/shell/game.svelte.ts (registerBeforeHide), e2e/celebration.spec.ts, e2e/helpers/celebration.ts, e2e/helpers/lifecycle.ts

## Notes

- Open question: How Android treats the sheet's history push after the hide callback; the lifecycle test proves the app-level behaviour, entry 9's final Android read (tickets.toml entry 9, the hide path) the platform; the epic 7 device check is later and platform-wide.
- This ticket closes the ☰/`M` merge blocker (story-celebration-overlay-entry-plan.md owner item 3): the epic branch may merge after it.
- Accepted residual, for the device read: a back gesture landing between ☰'s queued pop and the sheet push is absorbed by nav as its own pending pop (AD-13).
