---
title: 'Score-history store and finish writes'
type: 'feature'
ticket: '7'
created: '2026-09-30'
status: done
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-app-shell/story-score-history-store-and-finish-writes.md'
  - '{project-root}/_bmad-output/specs/spec-epic-3-app-shell/build-notes.md'
warnings: [oversized]
deferred:
  - summary: >-
      Q-29 Replay this deal leaves wordcell:history unchanged: Playwright in epic 6 (SPEC CAP-6).
    evidence: |-
      Only the shell Vitest `AD-4 replay() and newGame() leave the wordcell:history bytes and the history state unchanged` covers Replay here; shell Vitest is never R-id coverage, and SPEC CAP-6 assigns the Playwright proof to epic 6.
    location: >-
      e2e/ (epic 6)
    severity: low
baseline_revision: '6da8e6fef7113bc396d93dc98d93ab808519e258'
---

<intent-contract>

## Intent

**Problem:** No shell code owns `wordcell:history`: a finish is never recorded, an un-finish never removes its record, a failed Session write cannot roll a history write back (Q-39), and neither the test hook nor the Q-38 bfcache check sees the history.

**Approach:** New AD-6 store `src/shell/history.svelte.ts` (`scoreHistory`), wired into `game.svelte.ts` `load()`, `dispatch`, `current()`/`loaded()` and `staleOwners()`; fake-storage widening in the shell Vitest; a new fixture; the shell Vitest and android Playwright cases the ticket lists. The ticket file is the authority for every detail; Design Notes settle the review log's open major and unapplied minors.

## Boundaries & Constraints

**Always:** AGENTS.md rules 1–7, Conventions and Known pitfalls (no binding named `history` in `src/**`; write keys as `history: value`, never shorthand/destructure; read `result.history`; `localStorage` only through `storage.ts`); write first, then assign; no try/catch around writes (rule 6) except the one Q-39 catch in dispatch that calls rollback and rethrows; shell Vitest names start `AD-4`/`AD-6`/`AD-15`/`AD-17`, Playwright names start with the ticket's ids; seed only through `seedStorage`/`fixture`; unit suite < 5 s; engine sources and existing fixtures unchanged; R-02 literals unchanged.

**Never:** end sheet or any UI for history (epic 5); history in the hide flush, `newGame()` or `replay()` (Q-29); an `isRecorded`/`finished` shortcut; a halted check inside `reconcile`; engine test edits; edits to the ticket file, SPEC.md or rule-coverage.md; a new test-hook accessor.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| finish | ok; dispatch playing → won/gaveUp | history set (record appended), then Session set; state/lastText assigned after each write | — |
| un-finish of recorded game | ok; last record matches | history set (record removed), then Session | — |
| non-finishing / nothing to remove | `reconcileHistory` same ref | reconcile returns undefined, no history entry | — |
| unreadable | any dispatch | no history write; game still finishes | — |
| history write throws | finish | propagates before the Session write; both keys, both states unchanged | to AD-15 |
| Session write throws | after reconcile wrote | rollback (restore bytes or `remove`, then state/lastText), rethrow | rollback throw propagates as-is |
| reset | active/rejected | writes `{"version":1,"records":[]}`, state ok [] | booting/halted → throws |
| persisted pageshow | history bytes ≠ lastText | halt another-window | — |

</intent-contract>

## Code Map

- `src/shell/game.svelte.ts` -- AD-4 store. `load()` branches: halted-during-boot (records `launch`, returns early twice), first launch (write, active), ok, rejected; insert `scoreHistory.load()` right after the Session read in each. `dispatch`: the `if (result.session !== before)` branch serializes, writes, assigns — call `reconcile(accrued, result.session)` inside it between `serializeSession` and `write` (Design Notes 3). `current()` returns `state` today (identity); `Loaded`/`Current` types; `staleOwners()` OR list; header comment. Uses scoreHistory only inside functions.
- `src/shell/storage.ts` -- `read`, `write`, `remove`, `HISTORY_KEY`; reuse unchanged.
- Engine (via `../engine/index` only): `parseHistory(text)` → `{ ok: true, history } | { ok: false, reason, version? }`; `serializeHistory`, `reconcileHistory(records, before, after, EN)` (same reference when nothing changes), `isRecorded`, `statistics`, `HISTORY_VERSION`, types `GameRecord`, `ScoreHistory`, `Statistics`, `ParseHistoryResult`.
- `src/shell/test-hook.ts` + `e2e/globals.d.ts` -- mirror the widened `Loaded`/`Current` types (change together).
- `src/shell/game.svelte.test.ts` -- `fakeStorage` (`writes: [string,string][]`, `control.failWrites` at 6 sites: ~175, 254, 414, 421, 429, 924), `setup(options)` (returns `{ game, clock, storage, time, storageEvent, doc, added, fire }`), `active(text)`; `loaded()`/`current()` `toEqual` sites (~143–215, 247, 276, 288, 321–322, 361, 378, 534–549, 742, 782, 914, 929); `toBe(before)` on `current()` at ~888, ~928; destructures of `storage.writes[...]` at ~152, ~297.
- `e2e/helpers/storage-spy.ts` -- `armStorageSpy(page, { throwOn })` (removeItem logged as `value: null`), `storageWrites`; `e2e/helpers/seed.ts` `seedStorage(page, { session, history })`, `fixture(name)`; `e2e/helpers/lifecycle.ts` `pageShow({ persisted })`.
- `e2e/game-store.spec.ts` -- `snapshot()`/`sessionOf()`; R-73 Undo/Redo/Confirm test (~76); `R-74 R-73 game-over New game …` (~111). `e2e/blocking.spec.ts` -- `kind`, `stored(page, key)`, `expectFatal`, §2 variants loop (~143–239) with `after.current` equality (~226). `e2e/lifecycle.spec.ts` -- `pausedClock`, `open(page, name)`, `expectAnotherWindow`; host for R-76 and the Q-38 history case.
- Fixtures: `history-three-records.json` (record 0 = session-won's record, last = session-gave-up's), `session-won.json`, `session-gave-up.json`, `session-place.json`, `session-invalid-null.json`.

## Tasks & Acceptance

**Execution:**
- [x] (before edits) `npx vitest run` -- record test count and Duration.
- [x] `fixtures/history-invalid-version-unknown.json` -- history-three-records.json with container `version: 2` (records keep 1), same formatting.
- [x] `src/shell/history.svelte.ts` -- new store per Design Notes 1–2.
- [x] `src/shell/game.svelte.ts` -- Design Notes 3–4; header comment names scoreHistory wiring.
- [x] `src/shell/test-hook.ts`, `e2e/globals.d.ts` -- widened types.
- [x] `src/shell/game.svelte.test.ts` -- Design Notes 5; new `describe('score history store')` with the ticket's Shell Vitest list.
- [x] `e2e/history.spec.ts` (new, android only) -- R-84, Q-39 (a)(b), AD-7, §2 unreadable cases; `e2e/lifecycle.spec.ts` -- R-76 and Q-38 history cases; `e2e/game-store.spec.ts`, `e2e/blocking.spec.ts` -- Design Notes 6.
- [x] Verification section; record outputs in Implementation Notes.

**Tests mapping (sentence → test):**
- R-84 record appended when status becomes won or gaveUp, removed when that finish is undone → `R-84 a Redo onto a win on session-won.json appends its record before the Session in the same task; Undo removes it`, `R-84 an Undo on session-gave-up.json removes its last record from history-three-records.json before the Session` (e2e/history.spec.ts); record content and the Q-43 match are V (`src/engine/history.test.ts`, e.g. `R-84 a won finish un-finished by undo (R-70) removes the last record`, `R-84 finish → un-finish → finish records a won game once`).
- R-84 persisted beside the Session with its own version; finish and un-finish write both keys synchronously in the same task → the same two R-84 tests (`{ version: 1, records }`, both keys read in one `page.evaluate`, history entry first).
- R-84 abandoned via R-74 never recorded (Q-29) → `R-74 R-73 Q-29 game-over New game on session-gave-up.json stores a fresh Session at once` (e2e/game-store.spec.ts), `§2 R-74 Q-29 version-unknown …` and `§2 R-74 Q-29 version-unreadable …` (e2e/blocking.spec.ts); Replay this deal: deferred to epic 6 (front matter).
- R-76 "always recorded for statistics (R-84)" → `R-76 R-84 a finish records the visible-time activeMs of the Session` (e2e/lifecycle.spec.ts).
- Q-38 history written by another writer, then a persisted pageshow → `Q-38 a persisted pageshow after a same-page wordcell:history write (absent → present) halts` (e2e/lifecycle.spec.ts).
- Q-39 history first, Session second, written back on a failed Session write → `Q-39 (a) a throwing Session write after a finish removes the history it added`, `Q-39 (b) a throwing Session write after an un-finish writes the seeded history back` (e2e/history.spec.ts); "a crash between the two writes is accepted": exempt (accepted risk, no behaviour).
- AD-7 no history, not written until its first change → `AD-7 a fresh launch leaves wordcell:history absent`, `AD-7 Undo, Redo and Confirm on session-place.json leave wordcell:history absent`, `AD-7 New game on session-gave-up.json leaves wordcell:history absent`, `AD-7 an un-finish of session-won.json with nothing to remove writes only the Session; Redo, Undo leave the empty history` (e2e/history.spec.ts); the history-less §2 variants in e2e/blocking.spec.ts also assert the key absent after New game.
- §2 history paragraph: "never overwritten silently" and "a game that finishes meanwhile still finishes; its record is not written" → `§2 an unreadable history (history-invalid-version-unknown.json) is never overwritten and the finishing game is unrecorded` (e2e/history.spec.ts). Deferred: "reported with a message naming its version and a Reset history action" → ticket 8 (CAP-7 History notice); "statistics are unavailable until the player resets it" and "the end screen repeats the message with the Reset action" → P4–6, epic 6 (rule-coverage.md §2; the store's `statistics` undefined while unreadable is S here).
- Exempt (rule-coverage.md Exempt): R-84 "never replayed", "v1 statistics are only …"; `HISTORY_VERSION` bump rules (versioning process).
- Shell Vitest: each Shell Vitest item of the ticket → one `AD-4`/`AD-6`/`AD-15`/`AD-17` case, plus Design Notes 7; supplementary, never R-id coverage.

**Acceptance Criteria:**
- Given the finished change, when `npm run test:all` runs, then it exits 0 and the unit suite stays under 5 s.
- Given session-won.json and no history on the dev server, when Undo then Redo are clicked, then `localStorage['wordcell:history']` holds one record whose `activeMs` equals the Session's, written before the Session, and a further Undo empties it (Playwright above is the proof).
- Given the change, when `git diff --stat src/engine` runs, then it is empty, and `git diff --stat fixtures` lists only the new file.

## Implementation Notes

- Baseline (6da8e6f): `npx vitest run` 27 files, 1528 tests, Duration 4.68 s (a second run 6.56 s; this machine is noisy).
- After: 27 files, 1554 tests (+26 in `describe('score history store')`); Duration 5.07–5.95 s over four runs. Same machine with the tracked changes stashed: 5.02–5.80 s, so the new cases add no measurable wall time (`game.svelte.test.ts` 695 ms; transform dominates). The < 5 s budget is borderline on this machine before and after; flagged, not optimised.
- `npm run test:all`: exit 0 (lint, check, unit, build + size budget, test:e2e:dist 13 passed, test:e2e 95 passed / 85 skipped, test:e2e:pwa 12 passed).
- `git diff --stat src/engine`: empty. `git status fixtures`: only `history-invalid-version-unknown.json` new (byte-identical to history-three-records.json except the container `version: 2`).
- Shell Vitest added: AD-17 load per branch ×5 (absent, ok, unreadable, beside a rejected Session, halted during boot; each also checks the second `load()` throw and `isStale()` false → true), first launch, finish/un-finish write order, non-finishing throwing Session write, throwing history write, Q-39 rollback ×2 (remove, write-back), double throw, own finish/reset() then pageshow ×2, another writer ×3 (absent → present, changed, removed), replay()/newGame() untouched, AD-6 recorded ×2 (incl. the open-major finished-but-unrecorded case), statistics, unreadable, unreadable + reset(), reset() while rejected, AD-15 ×2.
- Playwright added: `e2e/history.spec.ts` (R-84 ×2, Q-39 (a)(b), AD-7 ×4, §2 unreadable); `e2e/lifecycle.spec.ts` (`R-76 R-84 …` record activeMs = runFor 2500 = session activeMs; Q-38 history absent → present).
- `loaded()` keeps the game store's own `launch` (session only) and adds `history: scoreHistory.loaded()`; `current()` builds a new object for the active variant, so the two `current()` `toBe` identity checks now compare `game.state` (Design Notes 5).

- Like-for-like timing (orchestrator, worktree on ext4 `/tmp`, same machine): baseline 6da8e6f 4.03–4.20 s, this change 4.18 s (1554 tests). The 5.0–6.0 s figures above are the `/mnt/d` (9p) filesystem's transform cost, present before the change too; the change adds no measurable time.
- Review patches: double-throw case pins state/bytes/isStale; `EMPTY` constant in `history.svelte.ts`; §2 unreadable test asserts `current().history`/`loaded().history` after New game and reload; blocking.spec `session-invalid-null.json` variant now seeds `history-three-records.json` (`§2 R-74 Q-29 version-unreadable …`, tickets.toml entry 7 Verify; supersedes Design Notes 6's stand-in, no new variant); R-84 Redo test pins `activeMs` = `current().session.activeMs`.

## Plan Change Log

## Review Triage Log

### 2026-09-30 — Review pass
- verdicts: 24 findings — high 0, medium 0, low 8, false 16, maybe-false 0
- findings:
  - `[false]` `[reject]` (blind) unit suite AC < 5 s unmet — like-for-like on ext4: baseline 4.03–4.20 s, after 4.18 s; the >5 s runs are the `/mnt/d` 9p transform cost before and after (Implementation Notes).
  - `[false]` `[reject]` (blind) plan status/logs not updated — the workflow sets status and fills the logs in step 04; fix would edit this plan.
  - `[false]` `[reject]` (blind) tests mapping is not sentence-level — the ticket file holds the sentence → test list the plan defers to; fix would edit this plan.
  - `[low]` `[patch]` (blind) double-throw Vitest asserts only the error — now also asserts scoreHistory.state holds the appended record, stored bytes equal it, isStale() false, Session bytes and game.state unchanged (grouped with verification-gap #1).
  - `[false]` `[reject]` (blind) failed first-launch write leaves history loaded, retry throws `AD-6 load() called twice` — unreachable: the throw goes to the AD-15 handler (halted) and main.ts calls load() once; game.loaded() still throws first (grouped with edge #1).
  - `[low]` `[patch]` (blind) Design Notes 1 empty-history constant missing — added `EMPTY` and used at initial state, absent load and reset.
  - `[low]` `[reject]` (blind) helpers copied into e2e/history.spec.ts — real duplication, fix is a shared helper module (entry 12 refactor sweep), more than a direct correction.
  - `[low]` `[reject]` (blind) scoreHistory.loaded() pre-load throw and current() while halted/rejected untested — unreachable through the hook (game.loaded() throws first, game.current() omits history off active); adding cases is new coverage of no player-visible path.
  - `[low]` `[patch]` (blind) §2 unreadable test checks only bytes after New game and reload — now asserts current().history rejection after New game and loaded()/current() rejection after reload.
  - `[low]` `[reject]` (blind) no scan enforcing dispatch as reconcile's only caller — the ticket assigns that contract to dispatch; a new architecture scan is added complexity for a defect no caller has.
  - `[false]` `[reject]` (edge) first-launch retry throws AD-6 load() twice — same refutation as blind #5.
  - `[low]` `[patch]` (verification-gap) double-throw rollback state not pinned — same as blind #4; patched.
  - `[false]` `[reject]` (verification-gap other) 5 s AC — same as blind #1.
  - `[false]` `[reject]` (intent) reading enumeration R1–R3 — descriptive, no defect.
  - `[low]` `[patch]` (intent) rejected-root New game uses version-unknown, not session-invalid-null.json + history — the null variant now seeds history-three-records.json (entry Verify; review-log minor's alternative).
  - `[low]` `[patch]` (intent) R-84 spy test never pins activeMs = Session's — now asserted in the same evaluate.
  - `[false]` `[reject]` (intent) Undo leaves an empty history, not an absent key — the ticket's AD-7 AC states the key is never removed outside the rollback.
  - `[false]` `[reject]` (intent) unreadable steps reordered — the seeded win must be un-done (Undo) to finish (Redo); each step's bytes are asserted.
  - `[false]` `[reject]` (intent) restore of real bytes after a finish only in Vitest — the ticket AC places Q-39 (a) with no history; Vitest covers the write-back branch, Playwright (b) the seeded bytes.
  - `[false]` `[reject]` (intent) absent-after-load only on fresh launch — ticket AD-7 AC; the other branches are shell Vitest load cases.
  - `[false]` `[reject]` (intent) statistics/recorded/reset unit-only — no UI reads them until epic 5; the ticket assigns them to shell Vitest.
  - `[false]` `[reject]` (intent) test run not seen — orchestrator ran `npm run test:all`, exit 0.
  - `[false]` `[reject]` (intent) diff split of activeMs across two tests — superseded by the R-84 patch above (now in both).
  - `[false]` `[reject]` (intent) summary line — restates the divergences above.

## Design Notes

1. **history.svelte.ts state:** `type HistoryState = { readonly status: 'ok'; readonly records: readonly GameRecord[] } | { readonly status: 'unreadable'; readonly reason: HistoryRejectReason }` (`HistoryRejectReason` = failed `ParseHistoryResult` minus `ok`, built as game's `rejectReason`). `$state.raw` initial `{ status: 'ok', records: [] }`; `let lastText: string | null = null`; `let launch` (AD-17 snapshot: `ScoreHistory | null | { rejected }`, `undefined` until load). `const NEVER_WRITTEN = { version: HISTORY_VERSION, records: [] }`-style default beside `HISTORY_VERSION` (minor). Export `scoreHistory` with getters `state`, `statistics` (`$derived`: ok → `statistics(records)`, else undefined), `recorded` (`$derived`: ok and `game.state.kind === 'active'` → `isRecorded(records, game.state.session, EN)`, else false) and methods `load`, `reconcile`, `reset`, `isStale`, plus `loaded()` (launch snapshot; throws before load) and `current()` (`{ version: HISTORY_VERSION, records }` or `{ rejected: reason }`) for the game store's hook. Imports `game` from `./game.svelte`; reads `game.state` only in function bodies/derivations.
2. **Methods:** `load()` -- second call throws `AD-6 load() called twice`; `text = read(HISTORY_KEY)`; absent → ok [] / launch null; else `result = parseHistory(text)`; ok → records `result.history.records`, launch `JSON.parse(text)`; failed → unreadable; `lastText = text`; never writes. `reconcile(accrued, after)` -- unreadable → undefined; `next = reconcileHistory(records, accrued, after, EN)`; same ref → undefined; else `prevText = lastText`, `prevState = state`, `text = serializeHistory({ version: HISTORY_VERSION, records: next })`, `write`, then assign state/lastText, return rollback: `prevText === null ? remove(HISTORY_KEY) : write(HISTORY_KEY, prevText)` first, then restore state and lastText (minor: bytes first). `reset()` -- throws `AD-15 reset() while halted` / `AD-15 reset() while booting`; writes `serializeHistory({ version: HISTORY_VERSION, records: [] })`, then assigns. `isStale()` = `read(HISTORY_KEY) !== lastText`.
3. **Dispatch:** inside `if (result.session !== before)`: `text = serializeSession(...)`; `rollback = scoreHistory.reconcile(accrued, result.session)`; `try { write(SESSION_KEY, text) } catch (error) { rollback?.(); throw error; }`; then `sessionText`/`state` as today. Same behaviour as the ticket's "always, after serializeSession" (reconcile returns undefined when nothing changed; a dispatch with `result.session === before` has nothing to reconcile) — review-log minor, 3 lenses. A throwing reconcile write propagates before the Session write.
4. **load/hook/staleness:** call `scoreHistory.load()` right after `read(SESSION_KEY)` in both the halted and booting paths (first launch included; before the first-launch Session write is fine since history load writes nothing). `Loaded` gains `history: ScoreHistory | null | { rejected: HistoryRejectReason }` (always); `loaded()` returns `{ session: launch.session, history: scoreHistory.loaded() }`. `Current` active variant gains `history: ScoreHistory | { rejected }`; `current()` returns `state.kind === 'active' ? { kind: 'active', session: state.session, history: scoreHistory.current() } : state`. `staleOwners()` = `isStale() || scoreHistory.isStale()`.
5. **Shell Vitest harness:** `fakeStorage(stored, history?)` seeds `wordcell:history` when given; `writes: [string, string | null][]`, `removeItem` logs `[key, null]`; `control.fail: (op: 'set' | 'remove', key: string) => Error | undefined` (default `() => undefined`) checked first in setItem/removeItem, throwing the returned error. Migrate the six `failWrites = true` sites to `control.fail = (op) => (op === 'set' ? new Error('setItem failed') : undefined)` (minor). `Options` gain `history?: string`; `setup()` also returns `scoreHistory` from `await import('./history.svelte')` after the game import. Narrow widened destructures (`text ?? ''` or an explicit null throw). Existing `current()`/`loaded()` equalities gain the expected history (ticket "Existing assertions"); the two `current()` `toBe(before)` cases compare `game.state` with `toBe` instead (identity still pinned); `not.toEqual({ kind: 'active', session })` compares `current().session`.
6. **Existing e2e:** rename `R-74 R-73 game-over New game …` by inserting `Q-29` after `R-73` (rest unchanged). In blocking.spec §2 variants, `after.current` expects `history: variant.history ? JSON.parse(historyText) : { version: 1, records: [] }`. Every other `current()`/`loaded()` deep-equality in game-store.spec/blocking.spec gains `history`. The entry's session-invalid-null.json + history Q-29 case is stood in for by the existing `§2 R-74 Q-29 version-unknown` variant (the ticket's AC: no new null variant).
7. **Review-log resolutions (technical defaults; none changes functionality, UX or gameplay):**
   - Open major → AD-6 Vitest case: session-won.json loaded with no history → `recorded` false (finished but unrecorded), and after Undo + Redo → true.
   - Q-39 (b) "arm" = `throwOn: 'wordcell:session'`; (b) log `[history set (fixture minus last), session set, history set (seeded text)]`.
   - R-84 given-up Undo also asserts `current().history` equals JSON.parse of the stored bytes.
   - AD-7 session-place.json: its own `AD-7 …` test in `e2e/history.spec.ts`, reusing the R-73 steps (Undo, Redo, Confirm), key absent after each.
   - reset() while rejected: one `AD-6` case (writes the empty history, state ok).
   - §2 unreadable: spy armed before the Redo logs no `wordcell:history` entry.
   - History-setItem-throws case also asserts `game.state` unchanged and both `isStale()` false.
   - R-76 test lives in `e2e/lifecycle.spec.ts`, reusing its paused-clock `open()`.
   - `scoreHistory.load()` keeps its own launch snapshot for `loaded().history`.

## Verification

**Commands:**
- `npx vitest run` -- all pass, Duration < 5 s (before/after recorded).
- `npm run test:all` -- exit 0.
- `git diff --stat src/engine` -- empty; `git status fixtures` -- only `history-invalid-version-unknown.json` new.

## Auto Run Result

**Summary:** New AD-6 store `src/shell/history.svelte.ts` (`scoreHistory`: ok | unreadable state, `load`, `reconcile` returning the Q-39 rollback only when it wrote, `reset` throwing while booting/halted, derived `statistics` and `recorded`, `isStale`); `game.svelte.ts` loads it after the Session read in every branch, writes history before the Session in dispatch with rollback-then-rethrow, reports `history` in `loaded()`/`current()` and ORs `scoreHistory.isStale()` into the bfcache check. New fixture `history-invalid-version-unknown.json`.

**Files changed:**
- `src/shell/history.svelte.ts` — new score-history store.
- `src/shell/game.svelte.ts` — load/dispatch/hook/staleness wiring.
- `src/shell/test-hook.ts`, `e2e/globals.d.ts` — widened hook types.
- `src/shell/game.svelte.test.ts` — fake storage `control.fail`/removal log, `score history store` describe (26 cases), existing equalities gain `history`.
- `e2e/history.spec.ts` — new android spec: R-84, Q-39 (a)(b), AD-7, §2 unreadable.
- `e2e/lifecycle.spec.ts` — R-76 record activeMs, Q-38 history bfcache.
- `e2e/game-store.spec.ts`, `e2e/blocking.spec.ts` — Q-29 rename, history in hook equalities, null variant seeds history.
- `fixtures/history-invalid-version-unknown.json` — new.

**Review-log items:** open major (recorded vs finished shortcut) → `AD-6 recorded: a loaded finished game with no record is false; Redo onto it true; Undo false`. Unapplied minors: all applied per Design Notes 3, 5, 6, 7; the session-invalid-null.json + history Q-29 case is now the null variant seeding history (no new variant).

**Review findings:** 24 (high 0, medium 0, low 8, false 16). Patched: 5 entries (all low). Deferred: none. Rejected: 3 low (copied e2e helpers → entry 12 sweep; unreachable scoreHistory.loaded()/current() paths; reconcile-caller scan) and 16 false, each logged above.

**Follow-up review recommended:** false (patched: high 0, medium 0, low 5).

**Verification:** `npm run test:all` exit 0 after the patches (unit 1554 passed, 5.17 s on /mnt/d; dist smoke 13; dev e2e 95 passed / 85 skipped; PWA 12). `git diff --stat src/engine` empty; fixtures: only the new file.

**Residual risks:**
- Unit suite at ~5.0–5.2 s on the `/mnt/d` checkout (4.2 s on ext4), against the 5 s AD-17 budget; pre-existing, not caused by this change.
- The §2 unreadable-history test will need ticket 8's boot notice dismissed first once it lands.

