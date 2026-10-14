---
id: 13
type: story
title: "Winning-animation input guard"
parent: epic-tray-and-place
covers: [CAP-10]
after: [12]
risk: high
---

# Winning-animation input guard

## Description

Lands the AD-14 winning guard in motion.ts exactly as SPEC F8 states it (F23 for the 300 ms): installed synchronously on entry to `flip.play(command, result)` when `result.finished === 'won'` (flip.play is called synchronously after the dispatch, so no input task runs between; F8's 'on the dispatch result'), before any animation or reduced-motion early return, so both motion settings; capture-phase document listeners for pointerdown, pointerup, pointercancel, click, keydown and keyup consuming with preventDefault + stopPropagation; an always-installed open-gesture tracker (pointerIds, keys by code, plus the `window` blur listener) marking open gestures consumed at install. Per F8: the triggering gesture's remaining events (repeats, keyup, pointerup, its click) are consumed but never complete the animation; every gesture started before settle or within 300 ms of install is consumed in full (expected click, key repeats included); only the first gesture started after install completes it. The guard stays until settle by any path (natural end, `finishAll`, hide) AND 300 ms since install AND no consumed gesture open, then a backstop of `duration('snap')` (120 ms under reduced motion) from the last consumed gesture's end (a hide or blur clear counts as that end, and as settle for hide, still subject to the 300 ms; counted from install when none is open); a pointerdown or keydown after that uninstalls and is NOT consumed. A keyup/pointerup with no tracked gesture is not consumed and cannot extend the backstop; a keydown with `repeat: true` and no tracked gesture (a key held through a clear) is consumed, does not uninstall and does not extend the backstop (F8 silent; default). A pointerdown on an already tracked pointerId is the same open gesture: consumed, no second entry, no backstop restart; one pointerup/pointercancel closes it. While installed every `click` is consumed except one inside `[data-testid="undo"]`. Undo there takes precedence over the 300 ms consumption: complete, uninstall, event not stopped; after any uninstall the tracker keeps consuming the remaining events (pointerup, pointercancel, click, keyup, repeats) of every gesture it marked consumed. The tracker outlives the guard; install while installed is a no-op (idempotence is the guard's only). Hide and blur clear every tracked gesture; main.ts registers only the hide-clear through `game.registerBeforeHide` after `controller.cancel` and `gate.scrollReset` (order pin: game.svelte.test.ts "registerBeforeHide callbacks run in registration order"). The hover-peek timer is cleared at install and never started while installed. Scripts `fixtures/prefs-fast.json` (name per SPEC, which lists it as an ASSUMPTION name): `{ "version": 1, "animationSpeed": "fast", "showTimer": false }`, other prefs default (verified against prefs.svelte.ts DEFAULTS), seeded via `seedStorage`.

Also:
- unknown: resolved: held-Enter default applied (see Notes).
- interface: motion.ts `install(won, complete)` and the tracker take an injected `now` and timer functions (the time source is that clock, never `event.timeStamp`); the tracker starts at motion.ts module load, no entry point; settle notification (fired at the end of `play()` for the reduced-motion and empty-set paths, otherwise when the last running glide settles, as `settle(entry)` is per animation), hide-clear, guard-installed predicate, hover-clear registration; flip.ts calls `motion.install` on entry to `play()` with a complete callback (its `finishAll`) and notifies settle from its settle path; hover-peek-timer.ts queries the predicate and motion.ts calls a registered hover-clear callback (import direction ui/gestures → motion.ts, as controller.ts and fly-back.ts already do; motion.ts imports neither flip.ts nor gestures/); main.ts registers the hide-clear; new `fixtures/prefs-fast.json`.
- owns: the winning guard, the open-gesture tracker and prefs-fast.json; epic 6 adds the pending end-sheet cancel, the menu case and the Undo key aliases.
- consumers: the capture-phase listeners sit ahead of the controller's pointerdown and every act() button; the hide path gains a third registerBeforeHide callback (the guard's hide-clear) after controller.cancel and gate.scrollReset.
- tests: as Acceptance Criteria.
- risk: high.

Non-goal: Undo is recognised only by `[data-testid="undo"]`; no pending-open cancel, menu case or Undo key aliases (epic 6).

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with:

- UI Vitest AD-14 guard cases: long-press, pointercancel and natural-settle uninstalls; both endings; keydown after settle passing through; the triggering key's repeats and keyup consumed (synthetic `repeat: true` KeyboardEvents; authoritative for held Enter); the reduced-motion win; a key held through hide and through blur, each both before the win and after install; an unconsumed gesture cleared; each uninstalling once the backstop from the hide/blur (or install) has expired, asserted with fake timers; a held-key `repeat: true` keydown (also Tab) after a clear consumed, no uninstall, backstop unchanged; install while installed leaving listeners, tracker and backstop unchanged; a stray keyup/pointerup not consumed, deadline unchanged; a click with no tracked gesture and a keyboard-generated click consumed, one inside Undo not; the reduced-motion win also settling at the end of `play()`.
- Timing on an injectable clock/timer seam with fake timers: a gesture at 299 ms consumed and at 300 ms not, settle before and after 300 ms, the minimum under reduced motion and at Fast; backstop expiry just before/after `duration('snap')` after the last consumed end, normal and reduced motion (120 ms).
- Multitouch: two overlapping pointerIds (guard stays while any consumed pointer is open; backstop from the last end); a duplicate-pointerId pointerdown; Undo pressed while a consumed pointer is open, whose pointerup and click stay consumed.
- Undo: pass-through (not stopped, guard uninstalled, also its own pointerup/click and a keydown inside Undo); the triggering key's repeats/keyup consumed after the Undo uninstall; Undo within 300 ms of install; win, Undo, Redo win in sequence.
- Hide wiring: Playwright on desktop, a key held, `hidePage` (e2e/helpers/lifecycle.ts) during the win animation uninstalls the guard; a `src/main.ts` source-order assertion in the architecture-scan style (`src/architecture-tree-scan.test.ts`) pins the registration after controller.cancel and gate.scrollReset, with the game.svelte.test.ts order pin.
- Hover-peek: timer pending at install cleared; a hover while installed starts no timer; one starts after uninstall.
- Playwright on android from session-won + one Undo with prefs-non-default (Slow): a cell 6 tap during the Confirm animation opens no view, after settle opens it; a double tap on primary-action issued back to back, animations running before the second tap, Game over, stored seed/moves/cursor equal those read right after the Confirm write, no New-game Session (asserted on seed and stored Session, not elapsed time), also under reduced motion and with prefs-fast; R-62 Confirm → Game over (P5 supp. part); an untouched win then New game starting a new seed; Undo mid-animation returning to Place; the Redo win's cell-6 tap.
- Playwright on desktop: Enter twice, and Enter held (repeated `keyboard.down('Enter')` calls spanning the animation), at Slow and Normal speed, leaving the same seed.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place.md
- spec — _bmad-output/specs/spec-epic-5-tray/build-notes.md, CAP-10
- architecture — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, AD-9, AD-14

## Notes

- Open question: Whether Playwright's repeated keyboard.down('Enter') with repeat: true reproduces a held key's auto-repeat on a focused button closely enough for the held-Enter case. Default applied: e2e presses repeatedly; if Playwright diverges, the Vitest tracker case is authoritative.
