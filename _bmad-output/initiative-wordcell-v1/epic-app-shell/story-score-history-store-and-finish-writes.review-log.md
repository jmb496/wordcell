# Review log — story-score-history-store-and-finish-writes (ticket 3.7)
State: pass 3: done

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

## Pass 2 — 2026-09-30
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 5, minor 10, decision-needed 0  |  Dropped in triage: 1
Words (docs): 1313 (6.02 x pass 0; budget 1500)  |  Snapshot: story-score-history-store-and-finish-writes.passes/pass2.md  |  Fixer: all 13 applied; no runnable command added; storage-spy log semantics checked in e2e/helpers/storage-spy.ts
### Applied
- [major] Test hook — `current().history` added to the rejected variant contradicts AD-17 (4 lenses) → fixer 1
- [major] Test hook — existing `loaded()`/`current()` deep-equality assertions break; game.svelte.test.ts `not.toEqual` becomes vacuous (2 lenses) → fixer 2
- [major] Verify Q-39 — neither case proves the write-back (no-write implementation passes) → fixer 3
- [major] Verify R-84 — same-task proof, spy arming after the Undo, un-finish order (2 lenses) → fixer 4
- [major] Verify R-84 — container `{ version: 1, records }` and record content not asserted under R-84 (2 lenses) → fixer 5
- [minor] Q-29 "extend in place" redundant with existing tests (3 lenses) → fixer 6
- [minor] Shell Vitest AD-4 "state"/"isStale()" ambiguous; assert fake-storage bytes too (3 lenses) → fixer 7
- [minor] throwing rollback untested → fixer 8
- [minor] AD-6 `status` discriminant; `recorded` wording (2 lenses) → fixer 9
- [minor] state before load; second load → fixer 10
- [minor] fake storage per-key throw and removeItem recording → fixer 11
- [minor] ticket 8's History notice will cover the §2 unreadable test's board → fixer 12
- [minor] import-cycle rule symmetric for game.svelte.ts → fixer 13
### Default applied (technical)
- current().history — active variant only (AD-17); rejected-root cases assert stored bytes
- Q-29 — existing game-store.spec.ts game-over and blocking.spec.ts version-unknown cases are the coverage; keep green, no new null variant
- Initial `scoreHistory.state` `{ status: 'ok', records: [] }`, lastText null; second load() throws
- Fake storage — `control.failKey` throws for that key only; removeItem recorded
### Dropped
- dispatch-time cost of calling reconcile every dispatch (stretch; AD-4 prescribes the order, no measured breach)

## Pass 3 — 2026-09-30
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 2, minor 8, decision-needed 0  |  Dropped in triage: 2
Words (docs): 1449 (6.65 x pass 0; budget 1500)  |  Snapshot: story-score-history-store-and-finish-writes.passes/pass3.md  |  Fixer: all 10 applied; no runnable command added; record 0 of history-three-records.json confirmed as gameRecord of session-won.json (serialize.test.ts)
### Applied
- [major] Shell Vitest — `control.failKey` cannot set up the Session-write-and-rollback-both-throw case (4 lenses) → fixer 1
- [major] Description/Verify — unreadable `reason` shape (string vs parse failure with version) unspecified; ticket 8's notice needs the version (2 lenses) → fixer 2
- [minor] reset: write first, then assign → fixer 3
- [minor] reset() while booting → fixer 4
- [minor] lastText is private: assert via isStale() → fixer 5
- [minor] fake `writes` records removals as `[key, null]` → fixer 6
- [minor] R-84 record vs history-three-records.json record 0 minus activeMs → fixer 7
- [minor] R-76 exact activeMs = runFor amount → fixer 8
- [minor] game-store.spec.ts game-over test name lacks Q-29 → fixer 9
- [minor] Interface wording (loaded() has no variants); setup() imports history.svelte after resetModules → fixer 10
### Default applied (technical)
- Fake storage — `control.fail: (op: 'set' | 'remove', key: string) => Error | undefined`, checked by setItem and removeItem; per-call errors distinguish which propagated
- Unreadable reason — parseHistory failure minus `ok` (`{ reason, version? }`, like the store's RejectReason) in state, loaded() and current()
- reset() throws while booting as well as halted
### Dropped
- history-invalid-version-unknown.json owner vs build-notes CAP-7 — tickets.toml entry 7 is the authority; no ticket change
- ticket-8 notice sentence — harmless cross-ticket note; no change
