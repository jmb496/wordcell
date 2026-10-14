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

Lands the AD-14 winning guard in motion.ts exactly as SPEC F8 states it: installed when a Confirm or Redo dispatch returns `finished` `won` (both motion settings), capture-phase document listeners for pointerdown, pointerup, pointercancel, click, keydown and keyup consuming with preventDefault + stopPropagation, an always-installed open-gesture tracker (pointerIds, keys by code) marking open gestures consumed at install, the first new gesture completing the animation and being consumed, the 300 ms minimum after install at any speed (F23), the backstop of `duration('snap')` after the last consumed gesture's end, uninstall by a pointerdown or keydown after settle in the backstop window, Undo inside `[data-testid="undo"]` completing, uninstalling and passing through, hide and window blur clearing every tracked gesture (registered in src/main.ts through `game.registerBeforeHide` beside `controller.cancel` and `gate.scrollReset`), and the hover-peek timer cleared at install (the install hooks the flip.play result path entry 12 last changed) and never started while installed; scripts prefs-fast.json [ASSUMPTION name].

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with UI Vitest AD-14 guard cases (long-press, pointercancel and natural-settle uninstalls, both endings, keydown after settle passing through, the triggering key's repeats and keyup consumed, a key held through hide or blur, the reduced-motion win, the 300 ms minimum under reduced motion and at Fast, the injected hover timer), and Playwright on android from session-won + one Undo with prefs-non-default shows a cell 6 tap during the Confirm animation opening no view and after settle opening it, a double tap on primary-action leaving the same seed and no New-game Session (also under reduced motion and with prefs-fast), an untouched win then New game starting a new seed, Undo mid-animation returning to Place, the Redo win's cell-6 tap, and on desktop Enter twice and Enter held at Slow and Normal speed leaving the same seed.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place.md
- spec — _bmad-output/specs/spec-epic-5-tray/build-notes.md, CAP-10
- architecture — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, AD-9, AD-14

## Notes

- Open question: Whether Playwright's repeated keyboard.down('Enter') with repeat: true reproduces a held key's auto-repeat on a focused button closely enough for the held-Enter case.
