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

Lands the AD-14 winning guard in motion.ts exactly as SPEC F8 states it (F23 for the 300 ms): installed on entry to `flip.play(command, result)` when `result.finished === 'won'`, before any early return, so both motion settings (flip.play runs synchronously after the dispatch: F8's 'on the dispatch result'; its 'not when flip.play starts' is read as not at animation start); capture-phase document listeners per F8; an open-gesture tracker (pointerIds, keys by code, plus the `window` blur listener) marking open gestures consumed at install. Settle (any path), the 300 ms and the backstop are F8's, with a hide or blur clear counting as the last gesture's end, and as settle for hide; it uninstalls when the backstop expires (never before settle and 300 ms) or on the first pointerdown/keydown after settle and 300 ms (not consumed). A pointerdown or keydown after settle and 300 ms while a consumed gesture is still open is consumed in full, with no uninstall and no backstop change. A keyup/pointerup with no tracked gesture is not consumed and cannot extend the backstop; a `repeat: true` keydown with no tracked gesture (a key held through a clear) is consumed, with no uninstall or backstop change. A pointerdown on a tracked pointerId is the same open gesture: no second entry, no backstop restart. While installed every `click` is consumed; any pointerdown, keydown, pointerup or click inside `[data-testid="undo"]` passes through unstopped, over the 300 ms and consumed-open rule, neither clearing nor consumed by the owed-click flag, and its click completes and uninstalls; after any uninstall the tracker keeps consuming the remaining events of every gesture it marked consumed. A consumed pointerup sets an owed-click flag: after uninstall the next click is consumed and clears it; the next pointerdown or keydown also clears it (F8 silent; default). The tracker, started once, outlives the guard; install while installed is a no-op. main.ts calls `startTracker` and registers the hide-clear through `game.registerBeforeHide` after `controller.cancel` and `gate.scrollReset` (order pin: game.svelte.test.ts "registerBeforeHide callbacks run in registration order"). Scripts `fixtures/prefs-fast.json` (ASSUMPTION name per SPEC): `{ "version": 1, "animationSpeed": "fast", "showTimer": false }`, seeded via `seedStorage`.

Also:
- interface: motion.ts `install(won, complete)` and `startTracker(doc, win, now, timers)` (names are defaults; `now`, timers injected, never `event.timeStamp`), called once from main.ts at AD-16 boot before the controller is created, with no listener at module load (Vitest environment 'node'; tests pass fake EventTargets and plain-object events); settle notification (fired at the end of `play()` only for the empty-set path with no animations, otherwise when the last animation settles, the reduced-motion 120 ms fade included, as `settle(entry)` is per animation), hide-clear, guard-installed predicate, hover-clear registration; flip.ts calls `motion.install` on entry to `play()` with a complete callback (its `finishAll`) and notifies settle from its settle path; hover-peek-timer.ts queries the predicate and motion.ts calls a registered hover-clear callback (direction ui/gestures → motion.ts as controller.ts and fly-back.ts; motion.ts imports neither flip.ts nor gestures/); new `fixtures/prefs-fast.json`.
- owns: the guard, tracker and prefs-fast.json.
- consumers: the controller, the scrim click swallower, the hover-peek timer, the AD-9 hide flush. Capture-phase document listeners run ahead of the controller's pointerdown and every act() button, and so ahead of the swallower (controller-internal, click-swallow.ts, armed on the root, not registered in main.ts); the hide-clear is the third registerBeforeHide callback; the hover-peek timer is cleared at install; the hide flush runs after the hide-clear.

Non-goal: Undo is recognised only by `[data-testid="undo"]`; pending-open cancel, menu case and Undo key aliases are epic 6.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with:

- UI Vitest AD-14 guard cases: long-press, pointercancel and natural-settle uninstalls; both endings; keydown after settle passing through; the triggering key's repeats and keyup consumed (synthetic `repeat: true` KeyboardEvents; authoritative for held Enter); a key held through hide and through blur, before the win and after install; an unconsumed gesture cleared; each uninstalling once the backstop has expired (fake timers); a held-key `repeat: true` keydown (also Tab) after a clear consumed, no uninstall, backstop unchanged; install while installed changing nothing; a stray keyup/pointerup not consumed, deadline unchanged; a click with no tracked gesture and a keyboard-generated click consumed, one inside Undo not; the reduced-motion win settling when its fade ends, the empty-set path at the end of `play()`.
- Timing on an injectable clock/timer seam with fake timers: a gesture at 299 ms consumed (`complete` once) and at 300 ms not, settle before and after 300 ms, the minimum under reduced motion and at Fast; backstop expiry just before/after `duration('snap')` (120 ms reduced) after the last consumed end.
- Multitouch: two overlapping pointerIds (guard stays while any consumed pointer is open; backstop from the last end); a duplicate-pointerId pointerdown; Undo down/up/click while a consumed pointer is open still undoes; that pointer's pointerup stays consumed and its next click is consumed once (owed-click), cleared by the next pointerdown or keydown; consumed pointerup, then Undo down/up/click (still undoes; owed-click neither consumed nor cleared), then the consumed pointer's own click consumed; a pointerdown/keydown after settle and 300 ms with a consumed gesture open consumed, no uninstall, backstop unchanged.
- Undo: pass-through (not stopped, uninstalled, incl. its pointerup/click, keydown inside, except a consumed gesture's events); triggering-key repeats/keyup consumed, no `complete`; Undo within 300 ms of install; win, Undo, Redo win in sequence.
- Hide wiring: Playwright on desktop, a key held, `hidePage`/restore (e2e/helpers/lifecycle.ts) during the win animation, then after the hide time plus duration('snap') (180 ms at Normal) and at least 300 ms after install, a tap on cell 6 opens the view (or the held key's next keydown is not consumed); a `src/main.ts` source-order assertion in the architecture-scan style (`src/architecture-tree-scan.test.ts`) pins the registration after controller.cancel and gate.scrollReset, with the game.svelte.test.ts order pin.
- Hover-peek: timer pending at install cleared; a hover while installed starts no timer; one starts after uninstall.
- Playwright on android from session-won + one Undo with prefs-non-default (Slow): a cell 6 tap during the Confirm animation opens no view, after settle opens it; a double tap on primary-action, animations running before the second tap, Game over, stored seed/moves/cursor equal those read right after the Confirm write, no New-game Session, also under reduced motion and with prefs-fast; R-62 Confirm → Game over (P5 supp. part); an untouched win then New game starting a new seed; Undo mid-animation returning to Place; the Redo win's cell-6 tap.
- Playwright on desktop: Enter twice, and Enter held (repeated `keyboard.down('Enter')` calls spanning the animation), at Slow and Normal speed, leaving the same seed.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place.md
- spec — _bmad-output/specs/spec-epic-5-tray/build-notes.md, CAP-10
- architecture — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, AD-9, AD-14

## Notes

- Open question: whether Playwright's repeated keyboard.down('Enter') reproduces a held key's auto-repeat on a focused button closely enough. Default applied: e2e presses repeatedly; if Playwright diverges, the Vitest tracker case is authoritative.
