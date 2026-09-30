---
id: 4
type: story
title: "Primary action, New game, Replay and feedback"
parent: epic-app-shell
covers: [CAP-3]
after: [3]
risk: low
---

# Primary action, New game, Replay and feedback

## Description

Adds the minimal board's primary-action (Validate disabled with its DESIGN.md label until entry 9, Confirm in Place, New game when status ≠ playing), the store's newGame() and replay() per AD-4 (clock.take discarded, createSession, active, written at once, history untouched), feedback.rejectedWord, src/ui/text.ts for the strings it shows, and the standalone dispatch-cost script under scripts/ on Playwright's library API (E8: session-won.json against vite preview of dist-test with CDP Emulation.setCPUThrottlingRate rate 4, Undo ×8 then Redo ×8, each click timed with performance.now() in the page) with max and median recorded in the plan and a dispatch over 16 ms recorded as a flag for the epic 7 device check, not optimised.

## Acceptance Criteria

Verify: npm run test:all is green, and Playwright on android shows Confirm on session-place.json stored before the next action and game-over New game on session-gave-up.json storing a fresh uint32 Session with moves [] and activeMs 0 at once; the plan records max and median dispatch time.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-app-shell/epic-app-shell.md

## Notes

- Open question: None beyond entry 3.
