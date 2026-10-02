---
id: 3
type: story
title: "Composing, Place and static tray rendering"
parent: epic-board-and-gestures
covers: [CAP-2]
after: [2]
risk: medium
---

# Composing, Place and static tray rendering

## Description

Renders every remaining GameView board state (F1): Composing with D cards live in destination style, S slots as ghost mirrors, and the static tray (F2) holding live S and free-letter tiles (data-place tray) in draft.arrangement order with the D-block mirrors at the draft.side end, the word-line slot showing only the epic 3 invalid-word line and an empty control row; Place with live strip tiles (data-place strip) in placementOrder, S and D ghosts and the selected-target ring and check chip; used WordCell faces as mirrors; the placeholder under S ghosts when the emptied source is the destination; tiles at card height in one row while they fit, else compact 44 px in up to two clipped rows inside max(H, 92); adds the scripted valid fixture session-idle-empty-column.json (version 1, seed 1, activeMs 0, moves [session-won.moves[0]], cursor { index 1, phase idle }, gaveUp false) to the epic 3 regeneration test in src/engine/serialize.test.ts (VALID and REBUILDS) and to src/architecture.test.ts's valid session-fixture list (count nine → ten); and creates e2e/board.screens.spec.ts for Idle, Composing, Place and Game over on android and desktop, baselines generated in the container.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green, and Playwright on android shows exactly 52 data-card-id elements, each id once, data-place per AD-14 and mirrors carrying data-mirror-of with no data-card-id or data-testid on session-idle-fresh, session-composing, session-place-free-letter-redo-tail, session-won and session-gave-up, plus a reload of session-composing and session-place-free-letter-redo-tail re-rendering the same ghosts, destination style, used cell, static tray order and target, and a Redo into Composing with a free letter re-rendering the used state.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-board-and-gestures/epic-board-and-gestures.md
- spec — _bmad-output/specs/spec-epic-4-board/build-notes.md, CAP-2 (Live vs mirror, static tray)

## Notes

- Open question: Whether a draft of more than 14 tiles fits the clipped two-row static tray at 360 px without overlapping the labels band; F2 says clipped, never over the labels.
