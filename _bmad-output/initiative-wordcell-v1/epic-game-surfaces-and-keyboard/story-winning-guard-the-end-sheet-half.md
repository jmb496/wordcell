---
id: 12
type: story
title: "Winning guard: the end-sheet half"
parent: epic-game-surfaces-and-keyboard
covers: [CAP-5]
after: [6, 10]
risk: high
---

# Winning guard: the end-sheet half

## Description

Finishes the AD-14 guard (epic 5 F8, F23; EXPERIENCE.md Motion). The authority for every input outcome is the table "Winning-guard input outcomes (CAP-5)" in build-notes.md; this ticket does not restate it. "Guard window" means, as there, from the win's guard install until the end sheet opens. Undo after the sheet opened is the normal path (the sheet closes, play resumes) and the guard is not installed there (`whenOpenAllowed` in `motion.ts` calls the internal uninstall immediately before running each open callback, win path only, so the backstop never consumes input on the sheet; `end-sheet.ts` and the overlays are untouched).

**Open timing (new).** On the win path only (guard installed on finished `won`; boot, R-73 `openAtBoot`, and Give up, `gaveUp`, still open at once; SPEC's "none: opens at once" is superseded by F23 and build-notes), the deferred open fires at max(animation settled, 300 ms after guard install) at every speed, including with no animation in flight (settle = install time). `motion.ts` owns the floor: it exposes a new floor-aware `whenOpenAllowed(cb)` (runs `cb` at once with no guard installed; else waits for the floor, uninstalls, runs `cb`), using `installAt` + 300 ms on the injected `now` and timers; `flip.ts` drains its open callbacks (`settleCallbacks`, `drainSettled`) through it; `end-sheet.ts` is unchanged. Any other input only completes the animation and is consumed; it never opens the sheet before the floor, and at Fast/reduced a non-Undo input between settle and 300 ms is consumed and the sheet still opens at 300 ms. Hide does not cancel the floor: the open time stays max(settled, install+300) on the injected clock, so on return after more than 300 ms the open fires at once, expanded (R-73). The token is killed only by boot/reload and `resetForNewSession`; browser back cannot be consumed (completes, normal back rule, then the sheet opens). Today nothing calls `finish` from hide or back; new: an exported `finishGuard()` in `motion.ts` (finishes the animation, no-op when no guard is installed) called from a new `registerBeforeHide` entry before the `hideClear` one and inside the one single-slot `registerBeforeBack` callback after `controller.cancel` (unit case for each); Esc, Tab, M, N, Redo (button, Ctrl/Cmd+Shift+Z, Y, Ctrl/Cmd+Y), New game and Replay are consumed and the sheet then opens (build-notes rows).

**Undo aliases (new, `motion.ts`).** Beside the existing target match (`inUndo`, `[data-testid="undo"]`), the guard matches a keydown/keyup with `event.key.toLowerCase() === 'z'` (so Caps Lock Z counts) and no Alt, as `keys.ts` `match` and EXPERIENCE.md Keyboard: Ctrl/Meta+Shift+Z, Y and Ctrl/Meta+Y are Redo (EXPERIENCE.md Keyboard, `keys.ts`), checked first and consumed like any other input with no alias; plain Shift+Z is Undo; bare Z and Ctrl/Meta+Z are Undo. Tracking stays keyed by `code` (`gestureId`). `motion.ts` has no `GameView` access (AD-3), so "Undo enabled" is an injected predicate `canUndo: () => boolean` passed to `startTracker` from `main.ts`, reading the `GameView` `canUndo` flag (the flag `TopBar.svelte` disables the button with). With it false, neither the target nor the key match applies: the input is an ordinary consumed input and the guard does not uninstall early. A Ctrl/Cmd chord's modifier keydown (ControlLeft/MetaLeft, its own gesture by `code`) is an ordinary consumed input: it completes the animation but does not uninstall; only the Z keydown carries the alias. Cases (modifier keydown first for chords): Z, Ctrl+Z, Meta+Z, Shift+Z (Undo pass-through), Ctrl+Shift+Z, Y and Ctrl+Y (Redo, consumed), Alt+Z (no match), upper and lower case, Undo disabled. Held Z: `keys.ts` Undo/Redo are not single-fire rows and repeat while held; the first alias keydown finishes and passes through (the hold is set first, see below), its repeats are not consumed by the guard and reach `keys.ts` under its own rule; a Z held across the install is tracked as consumed and does not undo (tests: alias keydown then repeats, asserting the guard consumes none of them; Z held across install).

**Who cancels the open.** `cancelEndSheetOpen` and `onUnfinished` exist (`overlays.svelte.ts`, `end-sheet.ts`): an `unfinished` result cancels the pending open. But the guard acts on pointerdown/keydown while `TopBar` dispatches on click (Enter clicks on keydown, Space on keyup, touch may deliver no click), and finishing drains the open callbacks. New, in `motion.ts`: an accepted Undo pointerdown/keydown (Undo enabled) sets a hold BEFORE `complete()`/`finish` drains the open callbacks, so the open is held back. The hold ends on the first of: (a) the Undo dispatch: `main.ts` calls a new exported `releaseHold()` in `motion.ts` when a dispatch returns `unfinished` (beside `onUnfinished`, which cancels the token), dropping the hold and uninstalling at once, so a key Undo never keeps consuming Esc/M/N until keyup; (b) that gesture's pointerup/pointercancel/keyup/click, inside or outside Undo, with no dispatch yet: one `setTimer(0)` on the injected timers then releases the hold and re-arms the open (at once if the floor has passed), and a dispatch before it fires cancels the re-arm (the dispatch is synchronous inside the click); (c) blur, hide, uninstall or `resetForNewSession` clear the hold (blur and hide then follow the floor rule and R-73). While held, the guard stays installed for non-Undo starts: the uninstall is deferred until the hold resolves, so Esc, M, N, a menu tap and a second-finger tap are still consumed and the re-armed open cannot hit AD-13 `openDeferred while menu is open`; `resetForNewSession` clears the hold and any pending open. A no-op or disabled Undo never holds. Unit cases: pointer Undo (down 290 ms, floor 300 ms, click 390 ms: no sheet, no history push); touch pointerup on Undo with no click (opens one tick later); pointercancel; Space on focused Undo (click after keyup); Enter (click on keydown); blur during the press; hide during the press; pointerup off Undo; Undo pressed then Esc or M before the click (consumed, no menu opens, no throw); Z keydown, Undo dispatch, then Esc with Z held: Esc not consumed, a following `install(true, …)` takes effect.

As built (Opus review, epic 6 part C): the bare-modifier hold, the touch/pen click grace, the Undo hold for button 0 only and the same-`pointerId` lost end refine the chord-modifier sentence under Undo aliases and (b) above; see build-notes.md, "Winning-guard input outcomes (CAP-5)" rows and the as-built line under its Mechanism.



**Redo win and menu.** `flip.ts` `play` calls `install(result.finished === 'won', ...)` and `onDispatched` handles `won` for any command, so a Redo win already takes the Confirm path: the Redo-win test is regression-only (unverified by run). Menu button: the press is consumed, the menu does not open, then the sheet opens, with no AD-13 `openDeferred while menu is open` throw (test). Unit case, through `motion.ts` alone: after `whenOpenAllowed` runs the open callback, an input on the open sheet is not consumed.

interface = "motion.ts guard gains the event.key Undo-alias match beside the target match; overlays.svelte.ts cancel of the deferred open." New: the key match and `canUndo` predicate, the 300 ms floor on the open.
tests = "AD-14 winning guard end-sheet half, Undo aliases, Redo win, menu case (P6); R-70 Undo during the window (P6); R-62 sheet opens after the animation settles (P6 part)."

owns = "The guard's end-sheet half."

consumers = "The guard is read by every dispatching caller and the epic 5 winning-guard tests."

## Acceptance Criteria

Verify: `npm run test:all` is green and `npm run test:screens` stays a regression run (build-notes lists no screens spec for this ticket, so none is added). Playwright cases from the build-notes rows, each at Normal, Fast, Slow and reduced motion unless noted, android and desktop unless noted:

- Undo button during the window: animation completes, undoes, play resumed, no sheet.
- Undo key Z and Ctrl+Z (desktop only, rule-coverage): same; Ctrl/Cmd+Shift+Z (desktop) is consumed as Redo and the sheet opens. Redo button, Y and Ctrl/Cmd+Y during the window: consumed, sheet opens.
- WordCell tap, primary action, menu press (menu stays closed), Esc/Tab/M/N, New game/Replay: each only completes the animation and is consumed, then the sheet opens.
- Browser back: completes, normal back rule, then the sheet opens. Hide: completes at once; after return the sheet is open and expanded (R-73).
- Redo win by button followed at once by Undo: no sheet.
- Undo between settle and 300 ms (reachable only at Fast and reduced motion): cancels the open, undoes, no sheet. A non-Undo input there is consumed and the sheet still opens at 300 ms.
- Undo button pressed after the floor during a Normal/Slow animation: no sheet, no history entry pushed.
- R-70 Undo after the sheet opened: the sheet closes and play resumes (test name carries R-70).
- AD-14 (or R-62) no input at Fast and reduced motion: the sheet opens at 300 ms after install, not at settle.
- R-62 no input at Normal and Slow: the sheet opens when the animation settles.

UI Vitest (fake clocks) covers the alias cases, held Z, the hold cases listed under Who cancels the open, the no-animation floor, hide and back completing the animation, hide at 100 ms then clock advance then open, and the guard uninstalled on open.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (CAP-5), Decisions
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns, Keyboard, State Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components
