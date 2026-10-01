# Review log — story-score-history-store-and-finish-writes (ticket 3.7)
State: pass 5: done

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

## Pass 4 — 2026-09-30
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 1, minor 14, decision-needed 0  |  Dropped in triage: 0
Words (docs): 1454 (6.67 x pass 0; budget 1500)  |  Snapshot: story-score-history-store-and-finish-writes.passes/pass4.md  |  Fixer: all 9 applied; no runnable command added
### Applied
- [major] Shell Vitest — reset() from unreadable to `{ status: 'ok', records: [] }` (state, statistics, later finish recorded) untested in any gate → fixer 1
- [minor] reset writes `{ version: HISTORY_VERSION, records: [] }` (AD-6) → fixer 2
- [minor] reset allowed while active or rejected (AD-4 "nothing written while rejected" is dispatch's) → fixer 3
- [minor] game.svelte.ts uses scoreHistory inside current() too → fixer 4
- [minor] current().history version = HISTORY_VERSION → fixer 5
- [minor] reconcile after serializeSession, immediately before the Session write → fixer 6
- [minor] Q-38 bfcache case: still active before pageShow → fixer 7
- [minor] storage-spy restatement shortened (cuts words) → fixer 8
- [minor] redundant R-84 "AD-7 check stays a separate test" sentence removed (cuts words) → fixer 9
### Default applied (technical)
- reset() allowed while rejected (no UI path calls it there; AD-4's rejected rule binds dispatch writes)
### Unapplied minors (for the build plan, no ticket words)
- rollback restores bytes first, then assigns state and lastText
- history-setItem-throws case asserts game.state and both isStale() like its sibling
- R-76 test lives in e2e/lifecycle.spec.ts reusing its paused-clock open()
- widening `writes` to `string | null` needs narrowing at existing destructures (game.svelte.test.ts)
- setup() Options gain an optional `history` text seeding HISTORY_KEY
- scoreHistory.load() keeps its own launch snapshot for loaded().history; never derived from lastText
### Dropped
- none

## Pass 5 — 2026-09-30
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 1, minor 13, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Words (docs): 1454 (6.67 x pass 0; budget 1500)  |  No fix pass (stopping rule: passes 4 and 5 each ≤ 1 major)
### Open major (not fixed)
- Shell Vitest AD-6 — the `recorded` cases (true after a finish, false after the un-finish) cannot tell `isRecorded(records, session, EN)` from a "status ok && game finished" shortcut; add `recorded` false for session-won.json loaded with no history (finished, not recorded), optionally session-won.json + history-three-records.json (last record gaveUp)

## Result — converged after 5 passes
open major: Shell Vitest AD-6 `recorded` cases do not discriminate isRecorded from a finished-only shortcut (add session-won.json with no history → recorded false).

Majors per pass: 13, 5, 2, 1, 1. Words 218 → 1454. Decision-needed: none. Technical defaults applied: 16 (see Default applied per pass).

### Unapplied minors (for the build plan)
- Dispatch wiring: "always calls reconcile, after serializeSession" vs the existing `if (result.session !== before)` write branch — call it inside that branch between serializeSession and write (same behaviour) (3 lenses)
- Test hook: never-written default literal `{ version: 1, records: [] }` beside `HISTORY_VERSION`
- `state`, `statistics`, `recorded` are getters (as game.state/game.view); the rest methods
- Q-39 (b): "arm" means `throwOn: 'wordcell:session'` as in (a)
- R-84 given-up Undo: also assert current().history equals the stored bytes
- AD-7 session-place.json absence check: a separate AD-7 test reusing the R-73 steps
- migrate the six existing `control.failWrites = true` sites to `control.fail = () => new Error('setItem failed')` (set only)
- reset() while rejected: one Vitest case
- Q-29 rename: insert Q-29 after R-73, rest of the title unchanged
- §2 unreadable: spy armed before the Redo logs no wordcell:history entry
- blocking.spec.ts `after.current` expected history per variant (seeded fixture vs `{ version: 1, records: [] }`)
- tickets.toml entry 7's session-invalid-null.json + history Q-29 case is stood in for by the existing version-unknown variant (or add `history` to the null variant)
- From pass 4: rollback restores bytes first, then assigns; history-setItem-throws case asserts game.state and both isStale(); R-76 test in e2e/lifecycle.spec.ts reusing its paused-clock open(); narrow `writes` destructures after widening to `string | null`; setup() Options gain `history` seeding HISTORY_KEY; scoreHistory.load() keeps its own launch snapshot for loaded().history
