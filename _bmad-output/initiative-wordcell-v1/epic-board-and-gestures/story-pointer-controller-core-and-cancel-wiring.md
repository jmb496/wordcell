---
id: 6
type: story
title: "Pointer controller core and cancel wiring"
parent: epic-board-and-gestures
covers: [CAP-4]
after: [4, 5]
risk: high
---

# Pointer controller core and cancel wiring

## Description

Builds src/ui/gestures/controller.ts with createController(gate) → { cancel, attach } and the pure classify(...) (drag latched at the first pointermove ≥ 8 px Euclidean, tap, 400 ms long-press on WordCells only after which no drag), attached by a Svelte action on App's active-branch root on every mount and detached after cancel() (F8), capturing only presses resolved by data-place (column, cell; tray/strip inert, F23) and never enabled buttons (F25), ignoring button !== 0 and any second pointerId without preventDefault or stopPropagation, preventDefault on contextmenu for a captured press, gate enter at pointerdown, cancel({ byBack? }) ending any press with no command and closing a peek, pointercancel/lostpointercapture handling, and the press-only F24 paths against the entry 5 store (hide keeps a tap-selection with no nav call; hide under a sticky view opened through overlays.openView does not throw; the drag-replacing-selection and fly-back paths land in entries 8 and 9); a foot-pad press with nothing selected is not captured, so entry 4's pan-y banner-during-scroll test stays green; nav.registerBeforeBack(fn) (R1, F7: separate from register(), throws before launch or on a second call, runs before the Forward check and close callback, not on own pops or stale launches); main.ts creating the controller after game.load()'s halted return and before registerLifecycle() (rejected root included) and registering cancel with registerBeforeHide and cancel({ byBack: true }) with registerBeforeBack; and src/ui/act.ts wrapping every App-owned button handler (Board, History notice, Reset confirm, banner, the rejected root's New game; Halted Reload exempt in both mounts) so cancel() runs first (R2, F9).

## Acceptance Criteria

Verify: npm run test:all is green with shell Vitest AD-13 before-back cases, UI Vitest AD-12 classify, cancel-path, second-pointer fake-event and act()-order cases and the press-only F24 cases, entry 4's banner-during-scroll test still green, and Playwright on android showing a tap and a drag on a static tray tile changing nothing, a captured press's contextmenu defaultPrevented, hidePage alone writing wordcell:session exactly once with the clock resuming only after showPage, and hidePage on the rejected root writing nothing and throwing nothing.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-board-and-gestures/epic-board-and-gestures.md
- spec — _bmad-output/specs/spec-epic-4-board/build-notes.md, CAP-4
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Pointer thresholds

## Notes

- Open question: Whether a Svelte action on the active-branch root sees pointer events from sticky bars and the banner with one listener set (F25 assumes it spans the viewport).
