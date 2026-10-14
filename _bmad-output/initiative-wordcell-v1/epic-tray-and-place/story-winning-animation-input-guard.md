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

Lands the AD-14 winning guard in motion.ts exactly as SPEC F8 states it (F23 for the 300 ms): installed synchronously on entry to `flip.play(command, result)` when `result.finished === 'won'` (the dispatch result, not when the animation starts), before any animation or reduced-motion early return, so both motion settings; capture-phase document listeners for pointerdown, pointerup, pointercancel, click, keydown and keyup consuming with preventDefault + stopPropagation; an always-installed open-gesture tracker (pointerIds, keys by code, plus the `window` blur listener, installed with it) marking open gestures consumed at install. Per F8: the triggering gesture's remaining events (repeats, keyup, pointerup, its click) are consumed but never complete the animation; every gesture started before settle or within 300 ms of install is consumed in full (expected click, key repeats included); only the first gesture started after install completes it. The guard stays until settle by any path (natural end, `finishAll`, hide) AND 300 ms since install AND no consumed gesture open, then a backstop of `duration('snap')` (120 ms under reduced motion) from the last consumed gesture's end (counted from install when none is open); a pointerdown or keydown after that uninstalls and is NOT consumed. A keyup/pointerup with no tracked gesture is not consumed and cannot extend the backstop. Undo inside `[data-testid="undo"]` takes precedence over the 300 ms consumption: complete, uninstall, event not stopped; the triggering key's repeats and keyup stay consumed by the tracker after that uninstall. The tracker outlives the guard and install is idempotent. Hide and blur clear every tracked gesture (F8: an uninstalled-by-clear guard's backstop runs from the hide or blur); main.ts registers only the hide-clear through `game.registerBeforeHide` after `controller.cancel` and `gate.scrollReset` (order pin: game.svelte.test.ts "registerBeforeHide callbacks run in registration order"). The hover-peek timer is cleared at install and never started while installed. Scripts `fixtures/prefs-fast.json` (name per SPEC, which lists it as an ASSUMPTION name): `{ "version": 1, "animationSpeed": "fast", "showTimer": false }`, other prefs default (verified against prefs.svelte.ts DEFAULTS; `prefs-non-default` is Slow, `showTimer` true), seeded via `seedStorage`. Both fixture lists in src/ and e2e/ checked: only session fixtures are enumerated (`src/architecture-ad2-ad12-ad17.test.ts`), so no list change.

Also:
- unknown: resolved: held-Enter default applied (see Notes).
- interface: motion.ts `install(won, complete)`, settle notification, hide-clear, guard-installed predicate, hover-clear registration; flip.ts calls `motion.install` on entry to `play()` with a complete callback (its `finishAll`) and notifies settle from its settle path; hover-peek-timer.ts queries the predicate and motion.ts calls a registered hover-clear callback (import direction ui/gestures → motion.ts, as controller.ts and fly-back.ts already do; motion.ts imports neither flip.ts nor gestures/); main.ts registers the hide-clear; new `fixtures/prefs-fast.json`.
- owns: the winning guard, the open-gesture tracker and prefs-fast.json; epic 6 adds the pending end-sheet cancel, the menu case and the Undo key aliases.
- consumers: the capture-phase listeners sit ahead of the controller's pointerdown and every act() button; the hide path gains a third registerBeforeHide callback: the controller, the scrim click swallower, the hover-peek timer and the AD-9 hide flush.
- tests: as Acceptance Criteria.
- risk: high.

Non-goal: Undo is recognised only by `[data-testid="undo"]`; no pending-open cancel, menu case or Undo key aliases (epic 6).

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with:

- UI Vitest AD-14 guard cases: long-press, pointercancel and natural-settle uninstalls; both endings; keydown after settle passing through; the triggering key's repeats and keyup consumed (synthetic `repeat: true` KeyboardEvents; authoritative for held Enter); the reduced-motion win; a key held through hide and through blur, each both before the win and after install; an unconsumed gesture cleared; each uninstalling the guard.
- Timing on an injectable clock/timer seam with fake timers: a gesture at 299 ms consumed and at 300 ms not, settle before and after 300 ms, the minimum under reduced motion and at Fast.
- Multitouch: two overlapping pointerIds (guard stays while any consumed pointer is open; backstop from the last end); a pointerdown with an already tracked pointerId.
- Undo: pass-through (not stopped, guard uninstalled, also its own pointerup/click and a keydown inside Undo); the triggering key's repeats/keyup consumed after the Undo uninstall; Undo within 300 ms of install; win, Undo, Redo win in sequence.
- Hover-peek: timer pending at install cleared; a hover while installed starts no timer; one starts after uninstall.
- Playwright on android from session-won + one Undo with prefs-non-default (Slow): a cell 6 tap during the Confirm animation opens no view, after settle opens it; a double tap on primary-action issued back to back, animations running before the second tap, Game over, stored seed/moves/cursor equal those read right after the Confirm write, no New-game Session (asserted on seed and stored Session, not elapsed time), also under reduced motion and with prefs-fast; R-62 Confirm → Game over (P5 supp. part); an untouched win then New game starting a new seed; Undo mid-animation returning to Place; the Redo win's cell-6 tap.
- Playwright on desktop: Enter twice, and Enter held (repeated `keyboard.down('Enter')` calls spanning the animation), at Slow and Normal speed, leaving the same seed.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place.md
- spec — _bmad-output/specs/spec-epic-5-tray/build-notes.md, CAP-10
- architecture — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, AD-9, AD-14

## Notes

- Open question: Whether Playwright's repeated keyboard.down('Enter') with repeat: true reproduces a held key's auto-repeat on a focused button closely enough for the held-Enter case. Default applied: e2e presses repeatedly; if Playwright diverges, the Vitest tracker case is authoritative.
