---
title: 'Celebration overlay entry'
type: 'feature'
ticket: '4'
created: '2026-10-23'
status: 'built'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-end-of-game-words/story-celebration-overlay-entry.md'
warnings: [oversized]
deferred:
  - summary: >-
      A press whose long-press timer is armed when the run starts throws AD-13 at openPeek under celebration (as openDeferred does today under endSheet).
    evidence: |-
      controller.ts onTimer calls overlays.openPeek unguarded; the mark is set only at pointerdown. Reachable only with multi-input: a pointer held on a WordCell when the winning guard installs (presses during the guard are consumed, motion.ts onEvent) and the open running within LONG_PRESS_MS (400 ms) of that press. Entry 5 owns the start: cancel the controller's press (act() / controller.cancel()) before overlays.startCelebration().
    location: >-
      src/ui/gestures/controller.ts:636
    severity: medium
baseline_revision: 'a194a2eccd15dffe03e04df50b22bdf4d03e674c'
---

<intent-contract>

## Intent

**Problem:** The win celebration (AD-19, entry 3) has no overlay entry: nothing makes back, Esc, Undo or New game end or cancel a run, nothing defers the end sheet's open behind it, and the keys and gestures still act under it.

**Approach:** Add the `celebration` entry to `overlays.svelte.ts` (`startCelebration`, `onCelebrationRemoved`, a removal reason per calling path), `attachOverlays()` in `celebration.svelte.ts` so the attached singleton's `done` runs only from the removal callback in a microtask, and the key, gesture, `mainInert` and `onDispatched` changes, exactly as the ticket Description states (the story file is the spec; read it fully), with the resolutions under Design Notes.

## Boundaries & Constraints

**Always:** `overlays.svelte.ts` imports nothing from `./celebration/` (one-way: `celebration.svelte.ts` imports `overlays`). Importers of the run controller name it `./celebration.svelte.ts` (Scaffold deltas, drvfs case clash with `Celebration.svelte`). Rule 6: illegal calls throw `AD-13 …` (overlays) or `AD-19 …` (controller), every check before any state change or nav call. Tests named `AD-13 …` (store, keys, gestures, focus, surfaces, end-sheet) and `AD-19 …` (controller wiring); nav stubbed; a stub `done`. Cite rules by id. Unattached `createCelebration()` keeps entry 3's synchronous `done`: entry 3's tests pass unchanged.

**Never:** mount `Celebration`, call `attachOverlays()` from `main.ts`, or touch `end-sheet.ts`'s won path, `test-hook.ts`, `nav.ts` (entries 5–7). Change `pressEscape` (its `else close(top)` already ends the run; entry 6 owns its branch). Add `celebration` to any `LEGAL_TOPS` list, a public member to the controller, or new store preconditions to `onDispatched`. Edit the ticket file.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Legal start | empty stack (or sticky `wordcellView` on top), sheet `hidden`, callback registered | (`pop`), `push`; `hoverPeek` null; top `celebration` | — |
| Illegal start | peek; any other entry or `celebration`; sheet not `hidden`; no callback; each also with a view on top | no state, no nav call | throws `AD-13 startCelebration …` |
| Run end | attached, live run, `end()` / cap / empty-list `start()` | `onEnd`, one `pop`, `done` once after a microtask | `end()` repeated: no-op |
| Back / Esc | `closedByBack(0)` / `pressEscape` with `celebration` on top | reason `ended`; run stopped (no `onEnd`); live `done` queued | `ended` with no pending or live `done` throws `AD-19` |
| Undo / New game | `onUnfinished()` / `resetForNewSession()` with entry open | token dead, one `pop`, run stopped, no `done` ever | not top in `onUnfinished`: `close()`'s `AD-13` throw |
| Misuse while attached | `start()` with `celebration` not top; `cancel()` with entry open | — | throws `AD-19 …` |

</intent-contract>

## Code Map

- `src/ui/overlays.svelte.ts` -- `OverlayId` + `'celebration'`; add to `OWN_OPERATION`, `MODAL_TOP`, `SUSPENDING` (comment names the exceptions: keys `undo`/`newGame`, `main` not inert). `removeTop()` gains a reason; `close`/`closedByBack`/`pressEscape` → `ended`, `resetForNewSession` loop and `onUnfinished` → `cancelled` (internal `closeWith(id, reason)`; public `close(id)` unchanged). `startCelebration` mirrors `openDeferred` (L269–283). Removing `celebration` with no callback throws.
- `src/ui/celebration/celebration.svelte.ts` -- private `build(attachment)`; `createCelebration = () => build(null)`; `celebration = build(attachment)`; `attachOverlays()` registers `attachment.removed` and sets `attachment.attached`. `finish` (L81) and `cancel` (L172) change only when attached.
- `src/ui/keys.ts` `attempt` (L526–542) -- `celebration`-only suspension lets `undo`/`newGame` through.
- `src/ui/gestures/intent.ts` `tapAction` (L121) -- `top === 'celebration'` → `NONE` first.
- `src/ui/gestures/controller.ts` -- `Press` gets a mark set at `pointerdown` (L660) when `overlays.isOpen('celebration')`: no long-press timer (L715), `pointermove` (L720) starts no drag and changes no overlay, `pointerup` (L849) ends the press and returns before any tap, drag-as-tap or peek path.
- `src/ui/end-sheet.ts` L19 -- `shown` also counts `overlays.isOpen('celebration')`.
- `src/ui/App.svelte` L51 -- `mainInert` filters out `celebration`.
- `src/ui/focus-follow.ts` -- no change (`surfaceOwnsFocus` reads `SUSPENDING`); test only.
- Test patterns: `overlays.svelte.test.ts` L1–26 (nav stub with call order, `load()` after `vi.resetModules()`); `surfaces.test.ts` L234 (`mountApp`); `end-sheet.test.ts` L9–14 (`focus-board` mocked: assert `focusByPhase` called after a tick); `keys.test.ts` L28–61; `controller.test.ts` L127–137.

## Tasks & Acceptance

**Execution:**
- [x] `src/ui/overlays.svelte.ts` -- entry, reasons, `startCelebration`, `onCelebrationRemoved` (a later registration replaces), `onUnfinished` cancels the token first then closes `celebration` when open, `resetForNewSession` closes with `cancelled`; export the two -- AD-13 celebration bullet
- [x] `src/ui/celebration/celebration.svelte.ts` -- `build`/`attachOverlays` and the attached `done` ownership per Design Notes -- AD-19
- [x] `src/ui/keys.ts`, `src/ui/gestures/intent.ts`, `src/ui/gestures/controller.ts`, `src/ui/end-sheet.ts`, `src/ui/App.svelte` -- as Code Map -- Keys, Gestures, Removal callback bullets
- [x] Tests in `overlays.svelte.test.ts`, `celebration/celebration.svelte.test.ts` (or a new `celebration/attached.test.ts`), `keys.test.ts`, `gestures/controller.test.ts`, `focus-follow.test.ts`, `surfaces.test.ts`, `end-sheet.test.ts` -- every AC below and the I/O matrix
- [x] `npm run test:all` green

**Acceptance Criteria:**
- Given the ticket's Acceptance Criteria (story file), when `npm test` runs, then each clause has a passing `AD-13 …`/`AD-19 …` test, with these resolutions: Legal start — each illegal start, including with a sticky view on top, throws with no state or nav change; Keys — table-driven over `ROWS`: every id except `undo`/`newGame` runs no `attempt()` row (plus `?`, WordCell `Enter`/`Space` via `onKeyDown`); `onUnfinished()` row — end-sheet.test.ts asserts `focusByPhase` is called after a tick; Gestures — a marked press also starts no drag (a crossed move then release changes nothing); New game's callers of `resetForNewSession()` are unchanged.
- Given each AD-19 wiring test, when it runs, then it re-imports `overlays` and `celebration.svelte.ts` after `vi.resetModules()` (the attachment is module-wide).
- Given `overlays.svelte.ts` source (`?raw`), when the overlays test reads it, then it has no import from `./celebration/`.

## Implementation Notes

- `overlays.svelte.ts`: `removeTop(reason)` checks for a registered callback before the slice and calls it after the entry's removal (so before `close`'s `nav.pop`, whose order the stub nav records as pop-then-push because `done` is queued). `onUnfinished()` handles `celebration` in its `hidden` branch (the only sheet state possible while the entry is open). Exported type `CelebrationRemoval`.
- `celebration.svelte.ts`: `build(attachment)`; the module-private `Attachment` holds the singleton's `removed` callback, which `attachOverlays()` registers (idempotent; a later call re-registers the same function). The attached `start()` top check runs after the run-active check and before the `wordList` check.
- `controller.ts`: `Press.celebrating` (drag-types.ts) is read once at `pointerdown`; a marked `pointerup` calls `end({ kind: 'up' })` and returns before `rescroll`/`classify`.
- Tests: AD-19 wiring in a new `src/ui/celebration/attached.test.ts` (manual clock, fake document; includes the `pressEscape` row through `keys.onKeyDown`); `controller.test.ts`'s prefs mock gained `BASE_MS` (the live-run rows call `celebrationCapMs`); an extra `intent.test.ts` row covers `tapAction`'s `celebration` guard (the controller mark alone masks it). Mutation checks (reverting each of the mark, the `attempt` exception, `shown`, `mainInert`) each fail a new test.
- Verification (2026-10-23, this `/mnt/wsl` checkout): lint (1 pre-existing e2e warning), check, unit (87 files, 3446 tests), build, `test:e2e:dist` green inside `test:all`; its `test:e2e` run had 1 failure, `e2e/nav.spec.ts:162` (rejected-root double tap on New game, no celebration on the path), which passed 5/5 rerun alone (`--repeat-each=5`): a load flake. Then `test:e2e:pwa`, which the chain had not reached, ran separately: green.

## Plan Change Log

## Review Triage Log

### 2026-10-23 — Review pass
- verdicts: 20 findings — high 0, medium 1, low 5, false 14, maybe-false 0
- findings:
  - `[medium]` `[defer]` blind: a press (long-press timer armed) begun before `startCelebration()` fires `openPeek` under `celebration` and throws AD-13 — real but reached only by multi-input (a finger held on a WordCell at the winning guard's install while a key confirms; presses during the guard are consumed, motion.ts `onEvent`); today's `openDeferred` → `endSheet` (`MODAL_TOP`) has the same throw, so it is not caused by this change. Entry 5 owns the start: cancel the controller press (`act()`/`controller.cancel()`) before `startCelebration()`. Deferred.
  - `[false]` `[reject]` blind: a throwing removal callback leaves stack and nav out of step — the throw is rule 6 fail-fast to the AD-15 halt; no state after a halt is read.
  - `[false]` `[reject]` blind: a throwing `close`/`onEnd` leaves `pending` parked — same: the throw halts (AD-15); `historyNotice` over a running celebration is unreachable (ticket Notes).
  - `[low]` `[reject]` blind: unreachable no-callback throws in `removeTop` and `attachOverlays()` — they are the TypeScript null narrowing of nullable fields (the alternative is a non-null assertion); they hide nothing (rule 6) and cost nothing.
  - `[low]` `[reject]` blind: the celebration exceptions live in App `mainInert`, keys `attempt` and the `SUSPENDING` comment — exactly where the ticket's Entry and Keys bullets put them; entries 6–7 own any later exceptions.
  - `[low]` `[patch]` blind: `CELEBRATION_KEYS` comment hides the interim `M`/`Space` gaps — comment now names them as gaps until entries 6–7.
  - `[low]` `[patch]` blind: test "Undo and N still gate" checks no `N` gate — renamed `AD-13 Undo still gates under the celebration: a disabled Undo does nothing`.
  - `[false]` `[reject]` blind: the "end() then a back" test runs back on an empty stack — that is the scenario (a back after `end()`'s synchronous pop, before `done`); no other ordering exists.
  - `[false]` `[reject]` blind: no back test with an entry over `celebration` — the single-entry back already exercises the `while (stack.length > depth)` loop (a synchronous `done` would push `endSheet` at depth 1 and be swept); an entry over `celebration` is unreachable (no `LEGAL_TOPS` row).
  - `[low]` `[reject]` blind: no test that `main` stays inert with another suspending entry over `celebration` — unreachable state; the filter is one `id !== 'celebration'` clause.
  - `[low]` `[patch]` blind: end-sheet.ts `tick()` comment names only the exiting sheet — comment now also covers focus-follow having yielded under the celebration.
  - `[false]` `[reject]` blind: focus-follow test leaks its callback and lacks `vi.resetModules()` — its `finally` runs `resetForNewSession()`; the leftover stub callback is read only by `startCelebration`/removal, which no other test in the file calls.
  - `[medium]` `[defer]` edge: a live long-press timer when `startCelebration()` pushes throws AD-13 at `openPeek` — same root cause as the first row; deferred with it.
  - `[false]` `[reject]` intent: evidence is unit-only, not the running app — the ticket's Verify prescribes UI Vitest with nav stubbed and a stub `done`; Playwright belongs to entries 5–6.
  - `[false]` `[reject]` intent: keys gate on "only `SUSPENDING`", not "top" — the ticket's Keys bullet says "only `SUSPENDING` entry"; equivalent under current guards (the auditor agrees).
  - `[false]` `[reject]` intent: Undo focus asserted via a mocked `focusByPhase` — the review-log minor chose this wording (end-sheet.test.ts mocks `./focus-board`).
  - `[false]` `[reject]` intent: `peekToSticky` under `celebration` untested — cut per the review-log minor (it throws on its no-peek guard first).
  - `[low]` `[reject]` intent: `attachOverlays()` missing-callback throw untested and unreachable — grouped with the unreachable-throws row.
  - `[false]` `[reject]` intent: `removeTop` no-callback throw unreached — grouped with the unreachable-throws row (TypeScript narrowing).
  - `[false]` `[reject]` intent: `main` not inert while board input is blocked — the ticket's Gestures bullet and Notes (e) define "inert board" as no input, not HTML `inert`.

## Design Notes

Attached controller (sketch; names free):

```ts
function finish(done) {            // end(), cap, empty-list start
  if (attachment?.attached !== true) { handler?.(); done(); return; }
  pending = done; handler?.(); overlays.close('celebration');
}
function removed(reason) {         // registered by attachOverlays()
  const live = clear();            // stops the run; no onEnd
  const done = pending ?? live?.done ?? null; pending = null;
  if (reason === 'cancelled') return;
  if (done === null) throw new Error('AD-19 celebration: ended removal with no done');
  queueMicrotask(done);
}
```

Review-log minors for the build (all resolved here): `/peekToSticky` cut (it throws on its no-peek guard first; only `openView`/`openPeek` are tested); "else the live run's `done`" (the callback sees only the reason, sketch above); the `build(hooks)` channel; the AC wording fixes (New game callers, illegal start with a view, `ROWS` table, `focusByPhase` after a tick, view or drag); `vi.resetModules()` re-imports; the `end-sheet.ts` comment cites EXPERIENCE.md Focus, not Q-01, for the Undo refocus.

Owner checkpoint items (rule 7; items 1–3 are not built here, recorded for entries 5–7; item 4 is built here):
1. Hide end (entry 7) — decision taken, recommended default: keep "the removal callback is the only caller of `done`, via `queueMicrotask`"; entry 5's `done` closure itself waits for visibility (opens via the store's `whenVisible()` when hidden), so `end(hide-mode)` needs no second `done` path.
2. Entry 5 starts the run only from the still-pending winning `whenSettled` callback, which the release-hold drops on Undo, so no start runs with a dead token.
3. Until entry 7, ☰ over a running celebration hits the `open(menu)` guard and halts: the epic branch must not merge before entry 7.
4. Spine refinements (a)–(e) from the ticket Notes are built here (sticky-view close in `startCelebration`, Undo/`N` keys, the `mainInert` filter, removal-driven stop, no-input board), awaiting the owner's nod and entry 9's spine amendment.

## Verification

**Commands:**
- `npm run lint && npm run check && npm test` -- expected: green
- `npm run test:all` -- expected: green (if drvfs file-case or speed issues block it, rerun in a Linux-filesystem copy and record both)

## Auto Run Result

Status: built. Blocking condition: none.

**Summary:** the `celebration` overlay entry (`startCelebration`, `onCelebrationRemoved`, removal reasons `ended`/`cancelled` per calling path), `attachOverlays()` with the attached singleton's `done` run only by the removal callback in a microtask, Undo/`N` keys under it, the inert gesture path and marked presses, `main` not inert, and `onDispatched`'s `shown` counting an open celebration. Nothing calls `attachOverlays()` or `startCelebration()` yet (entry 5).

**Files:**
- `src/ui/overlays.svelte.ts` — entry, reasons, `startCelebration`, `onCelebrationRemoved`, `onUnfinished`/`resetForNewSession` cancel paths.
- `src/ui/celebration/celebration.svelte.ts` — private `build`, `attachOverlays()`, attached `finish`/removal/`start`/`cancel`.
- `src/ui/keys.ts` — `attempt()` lets `undo`/`newGame` through under `celebration` alone.
- `src/ui/gestures/intent.ts`, `controller.ts`, `drag-types.ts` — `tapAction` none under `celebration`; `Press.celebrating` mark.
- `src/ui/end-sheet.ts` — `shown` includes an open celebration; comment cites EXPERIENCE.md Focus.
- `src/ui/App.svelte` — `mainInert` excludes `celebration`.
- Tests: `overlays.svelte.test.ts`, new `celebration/attached.test.ts`, `keys.test.ts`, `gestures/controller.test.ts`, `gestures/intent.test.ts`, `focus-follow.test.ts`, `surfaces.test.ts`, `end-sheet.test.ts`.

**Review-log minors:** all 13 resolved in this plan (Design Notes): 9 built or reworded into the tests; 4 recorded as owner checkpoint items (hide end default, entry 5's start from the pending `whenSettled` callback, no merge before entry 7, spine refinements (a)–(e) for entry 9).

**Review:** 20 findings (thorough: blind, edge, verification-gap 0, intent). Patched 3 low (two comments, one test name). Deferred 1 (medium, pre-existing shape, two lenses): a press armed before the start throws at its long-press timer; entry 5 should cancel the controller press before `startCelebration()`. Rejected 16 with reasons in the triage log. Follow-up review recommended: false (patched: high 0, medium 0, low 3).

**Verification (this `/mnt/wsl` drvfs checkout):** lint (1 pre-existing e2e warning), check, unit (87 files, 3446 tests), build (555217 / 600000), `test:e2e:dist` (18), `test:e2e` (1054 passed), `test:e2e:pwa` (16) all green after the patches. Earlier runs of `test:e2e` had one failure, `e2e/nav.spec.ts:162` (rejected-root New game double tap, no celebration on the path); it passed 8/8 alone and in the two later full runs: a load flake.

**Residual risks:** the deferred press-timer halt (entry 5); until entry 7, ☰ during a run throws (`open(menu)` guard), so the epic branch must not merge before entry 7; the hide-end default needs the owner's nod at the checkpoint.
