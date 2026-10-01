# Review log — story-score-history-store-and-finish-writes (ticket 3.7)
State: pass 1: done

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: 218 words, snapshot `story-score-history-store-and-finish-writes.passes/pass0.md`, HEAD e897707.
Note: the pull from tickets.toml entry 7 dropped `interface`, `tests`, `owns`; they are passed to reviewers and fixer as intent, and the pass 1 fixer adds them to the Description as `Interface:`, `Tests:`, `Owns:` lines.

## Pass 1 — 2026-09-30
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 13, minor 11, decision-needed 0  |  Dropped in triage: 0 (duplicates merged across lenses)
Words (docs): 1099 (5.04 x pass 0; budget 1500)  |  Snapshot: story-score-history-store-and-finish-writes.passes/pass1.md  |  Fixer: all 22 applied; no runnable command added; helpers armStorageSpy/storageWrites/pageShow verified in e2e/helpers; reset writing `{ version: 1, records: [] }` taken from entry 8 / AD-6
### Applied
- [major] Description — pulled entry lost interface/tests/owns (caller directive) → fixer 1
- [major] Description/Interface — no history load entry point; loaded()/current() history shapes (incl. unreadable, rejected, halted-at-boot) unspecified (4 lenses) → fixer 2
- [major] Description — how history.svelte.ts knows halted and the Session for `recorded`; game↔history import cycle (4 lenses) → fixer 3
- [major] Description/Tests — lastText update points, staleOwners() wiring and a positive foreign-change halt case missing (4 lenses) → fixer 4
- [major] Description — write-then-assign order, throwing history write, rollback restoring state/lastText too (3 lenses) → fixer 5
- [major] Verify Q-39 — only the remove branch exercised; spy arming point vs the earlier Undo (3 lenses) → fixer 6
- [major] Verify R-84 — given-up fixture Undo removing a seeded record, history-first for un-finish (3 lenses) → fixer 7
- [major] Verify AD-7 — first Undo (nothing to remove) must leave the key absent; final Undo bytes (2 lenses) → fixer 8
- [major] Verify R-76 — session-won.json activeMs is 0, so a hard-coded 0 passes → fixer 9
- [major] Verify §2 — unreadable case never asserts the game still finishes; no fixture/sequence (3 lenses) → fixer 10
- [major] Tests — statistics/recorded untested; values while unreadable/not active (4 lenses) → fixer 11
- [major] Tests — Replay leaves history untouched (SPEC CAP-6 shell Vitest AD-4) missing (2 lenses) → fixer 12
- [major] Tests — "history writes blocked while halted" untestable as written (3 lenses) → fixer 13
- [minor] reconcile signature → fixer 14
- [minor] Verify omits Description's AD-7 cases and the R-84 same-task check → fixer 15
- [minor] history-invalid-version-unknown.json contents → fixer 16
- [minor] "review-log open major" ambiguous → fixer 17
- [minor] Description one long sentence → fixer 18
- [minor] New game Q-29 cases duplicate existing e2e tests → fixer 19
- [minor] cite AD-17 shapes and the AGENTS.md `history` pitfall → fixer 20
- [minor] dispatch always calls reconcile (AD-4 diagram "[readable only]") → fixer 21
- [minor] throwing rollback propagates as-is → fixer 22
### Default applied (technical)
- History load — `scoreHistory.load()` called by `game.load()` in every branch (incl. halted at boot); never writes; `loaded().history` = JSON.parse | null | { rejected: reason }; `current().history` = `{ version, records }` (never-written `{ version: 1, records: [] }`) or `{ rejected: reason }`
- Import direction — history.svelte.ts imports `game` and reads `game.state` only inside functions/derivations (ticket 3.6 cycle rule)
- reconcile — `reconcile(accrued, after): (() => void) | undefined`; no halted check of its own (dispatch is its only caller); always called, no-op while unreadable
- statistics — undefined while unreadable; recorded false unless ok and game active
- Final Undo of an own-appended record writes `{"version":1,"records":[]}` (key never removed outside rollback)
### Dropped
- none
