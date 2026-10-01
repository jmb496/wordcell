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

- Interface: new src/shell/history.svelte.ts exporting scoreHistory { state, load, reconcile, reset, statistics, recorded, isStale }; game.svelte.ts `load()` calls `scoreHistory.load()` and dispatch calls reconcile and rollback; loaded().history and current().history added (e2e/globals.d.ts too); new fixture history-invalid-version-unknown.json (history-three-records.json with the container version set to 2, record versions stay 1), exercised only by Playwright (no engine test edit).
- Tests: R-84 append/remove, persisted beside the Session, same task; R-76 record carries activeMs; §2 unreadable history never overwritten and finishing game unrecorded; Q-39 write-back (both rollback branches); AD-7 absent history not written; Q-38 history changed by another writer halts; AD-4 shell Vitest (non-finishing throwing write touches no history key, history write throws on a finish, Session write throws, own finish or own reset() then persisted pageshow does not halt, another writer then persisted pageshow halts, replay() leaves the history untouched); AD-6 shell Vitest (recorded, statistics); AD-15 reset throws and history writes are blocked while halted; AD-17 shell Vitest load per branch; R-74 Q-29 New game leaves the history untouched.
- Owns: wordcell:history writes (reconcile, reset, rollback) and history-invalid-version-unknown.json.
- Store: history.svelte.ts imports `game` from game.svelte.ts and reads `game.state` only inside function bodies and derivations, never at import time (ticket 3.6's import cycle rule). State is `ok` (records) or `unreadable` (reason). `recorded` is false unless the history is ok and game.state.kind is 'active', else `isRecorded(records, session, EN)` (AD-6); `statistics` is `statistics(records)` while ok, undefined while unreadable.
- load: `game.load()` calls `scoreHistory.load()` right after the Session read in every branch (first launch, ok, rejected, halted during boot). It reads HISTORY_KEY, parses with parseHistory (read `result.history`, never destructure; AGENTS.md `history` pitfall), sets state (ok with [] when absent, ok with the records, or unreadable with the reason) and lastText (raw text or null), and never writes.
- reconcile: `reconcile(accrued: Session, after: Session): (() => void) | undefined`. It computes the new records, writes history, and only then assigns state and lastText (write first, then assign, as R-73 in dispatch). It returns undefined, writing nothing, while unreadable or when reconcileHistory returns the same reference; a returned rollback means it wrote (SPEC.review-log.md Pass 3 open major 7). It has no halted check of its own: dispatch is its only caller.
- rollback: restores the previous bytes (`storage.remove` when they were absent), state and lastText. A rollback that itself throws propagates as-is (build-notes CAP-6, rule 6).
- reset: throws (`AD-15 reset() while halted`) when game.state.kind is 'halted'; otherwise writes `{ version: 1, records: [] }` and sets state and lastText.
- lastText and isStale (Q-38): lastText is set by load, after each successful reconcile write and after reset, and restored by rollback; `isStale()` rereads via `storage.read` and compares. `staleOwners()` in game.svelte.ts becomes `isStale() || scoreHistory.isStale()`.
- Dispatch wiring: dispatch always calls reconcile, between apply and the Session write; the store does not branch on the history state (the AD-4 diagram's "[readable only]" is reconcile's own guard). History is written before the Session; a throwing history write propagates before any Session write, leaving both keys and state unchanged. If the Session write throws, the store calls the rollback, if any, and rethrows (Q-39).
- Test hook (AD-17): `loaded().history` = JSON.parse of the text | null when absent | `{ rejected: reason }`; `current().history` on the active and rejected variants = `{ version, records }` in memory (`{ version: 1, records: [] }` when never written) or `{ rejected: reason }` while unreadable. Write such keys as `history: value`, never shorthand (AGENTS.md pitfall).
- AD-7 absent history (SPEC.review-log.md Pass 3 open major 5): absent after load; Undo, Redo, Confirm on session-place.json and New game on session-gave-up.json leave it absent.

## Acceptance Criteria

- Verify: npm run test:all is green.
- Playwright android: storage spies (`armStorageSpy`, `storageWrites`) are armed once per page, only after current().kind !== 'booting'; `throwOn` throws on every setItem to that key.
- R-84: seed session-won.json with no history; Undo then Redo appends one record, Undo removes it. Same task: with the spy armed, when the Redo click resolves both keys have changed, wordcell:history first in the spy log. Seed session-gave-up.json + history-three-records.json, Undo → wordcell:history deep-equals the fixture minus its last record, written before the Session.
- R-76: seed session-won.json (activeMs 0); Undo, advance page.clock while visible and playing (as ticket 3.6), Redo → the record's activeMs is > 0 and equals current().session.activeMs.
- Q-39: (a) session-won.json with no history: Undo, arm the spy with `throwOn: 'wordcell:session'`, Redo → wordcell:history absent and the fatal surface shown. (b) session-gave-up.json + history-three-records.json: arm the same spy, Undo → history bytes equal the seeded text, fatal surface shown.
- AD-7: fresh launch → wordcell:history absent after load. session-place.json alone: Undo, Redo, Confirm → absent. session-gave-up.json alone: New game → absent. session-won.json alone: arm the spy, Undo (un-finish, nothing to remove) → still absent and the spy recorded only a wordcell:session write; then Redo, Undo → bytes equal `{"version":1,"records":[]}` (the key is never removed outside the rollback).
- §2 unreadable: seed session-won.json + history-invalid-version-unknown.json; Undo, Redo (the game still finishes: primary action shows New game, current().session is won, wordcell:session bytes changed, current().history is `{ rejected: … }`), then New game, then reload; history bytes unchanged after each step.
- Q-38 bfcache (history variant deferred from ticket 3.6): seed session-place.json; page.evaluate sets wordcell:history (absent → present), then pageShow persisted → halted with the another-window message.
- R-74 Q-29: extend in place the game-over New game case in e2e/game-store.spec.ts (session-gave-up.json + history-three-records.json, already asserts the history) and the session-invalid-null.json rejected-root variant in e2e/blocking.spec.ts (add history-three-records.json); history bytes unchanged.
- Shell Vitest: AD-17 load per branch (absent, ok, unreadable; rejected Session; halted during boot) sets state and lastText with no write. AD-4: non-finishing dispatch with a throwing Session write touches no history key; history setItem throws on a finish → Session key, history key and scoreHistory.state unchanged, error rethrown; Session write throws on a finish → state deep-equals pre-dispatch, isStale() false; own finish, and own reset(), then persisted pageshow does not halt; wordcell:history changed by another writer (including absent → present), then persisted pageshow → halted, haltCause 'another-window'; replay() leaves wordcell:history bytes and scoreHistory.state unchanged (SPEC CAP-6: Playwright in epic 6). AD-6: while ok, recorded true after a finish and false after the un-finish, statistics equals the engine `statistics(records)` for history-three-records.json; while unreadable, recorded false and statistics undefined. AD-15: halt the store, then reset() throws and dispatch throws, and the fake storage records no wordcell:history write.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-app-shell/epic-app-shell.md

## Notes

- Open question: None.
