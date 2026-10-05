---
id: 10
type: story
title: "Composing, Place and Game-over column behaviour"
parent: epic-board-and-gestures
covers: [CAP-8]
after: [9]
risk: medium
---

# Composing, Place and Game-over column behaviour

## Description

In Composing a tap on a destination-column card dispatches tapDestinationCard iff column.kIfTapped maps it to a number, and a drag started on one does not move it and dispatches the same once at pointerup for the press card (a cancelled press dispatches nothing); taps and drags on every other column, S ghosts and ghost mirrors included, and on non-card parts of any column do nothing; in Place and Game over every column tap and drag does nothing; desktop shows the 1 px outline of the D a click would set (top of D: k − 1; none at k = 1) and no hover outline or grab cursor on inert cards; plus the held destination-card press in Composing with hidePage giving no tapDestinationCard.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green (baselines regenerated in the container only where the four fixture renders change), and Playwright on android shows a destination-card tap and a destination-card drag each setting k saved before the next action, the top of D giving k − 1 and a no-op at k = 1, every other column and ghost tap or drag leaving the Session reference unchanged on session-composing, every column tap and drag inert on session-place, session-gave-up and session-won, Undo from Composing returning the tail and a new drag then working, a held destination-card press plus hidePage dispatching nothing, and on desktop the k hover preview and no hover outline in Place and Game over.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-board-and-gestures/epic-board-and-gestures.md
- spec — _bmad-output/specs/spec-epic-4-board/build-notes.md, CAP-8

## Notes

- Open question: None.
