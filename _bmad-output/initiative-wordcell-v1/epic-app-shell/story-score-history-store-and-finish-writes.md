---
id: 7
type: story
title: "Score-history store and finish writes"
parent: epic-app-shell
covers: [CAP-6]
after: [6]
risk: medium
---

# Score-history store and finish writes

## Description

Builds history.svelte.ts (scoreHistory ok | unreadable, reconcile returning whether it wrote and a rollback that exists only when it wrote (review-log open major 7), reset throwing while halted, derived statistics and recorded, lastText and isStale), wires reconcile into dispatch with history written before the Session and the Q-39 rollback then rethrow, and extends loaded()/current() and globals.d.ts with history, proving an absent history stays absent after load, Undo/Redo/Confirm on session-place.json and New game on session-gave-up.json (review-log open major 5).

## Acceptance Criteria

Verify: npm run test:all is green, and Playwright on android shows session-won.json with no history: Undo then Redo appending a record with activeMs equal to the Session's, written before the Session (storage spy), Undo removing it; a spied Session write that throws on the finish restoring the previous history bytes and showing the fatal surface; with history-invalid-version-unknown.json seeded, a finish, an Undo, a game-over New game and a reload each leaving the history bytes unchanged; and New game from game over (session-gave-up.json) and from the rejected root (session-invalid-null.json), each with history-three-records.json, leaving the history bytes unchanged (Q-29).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-app-shell/epic-app-shell.md

## Notes

- Open question: None.
