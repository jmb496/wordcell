---
title: 'Overlays store: tail selection, end-sheet and view states'
type: 'feature'
ticket: '5'
created: '2026-10-02'
status: done
baseline_revision: 'b88105e5ab6e88f905b01c705c99e7c7a6b3bde7'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-board-and-gestures/story-overlays-store-tail-selection-end-sheet-and-view-states.md'
warnings: [oversized]
deferred:
  - summary: >-
      e2e/layout.spec.ts AD-11 "banner during a scroll" cases (lines 250 and 272) flake under full-suite load with "scrollY changes between steps".
    evidence: |-
      Failed once in each of two `npm run test:all` runs of this build (one per run, different case), in a file this change does not touch; passed 3/3 with --repeat-each=3 alone and in two standalone `test:e2e` re-runs (250 passed). Pre-existing timing sensitivity of the touchHold scroll steps.
    location: >-
      e2e/layout.spec.ts:216
    severity: medium
---

<intent-contract>

## Intent

**Problem:** The AD-13 overlays store (epic 3 core) knows only `historyNotice` and `resetConfirm`; epic 4's gestures and epic 6's end sheet need one owner for the tail selection, the WordCell peek / sticky view / hover peek and the end sheet's `hidden | collapsed | expanded`.

**Approach:** Extend `src/ui/overlays.svelte.ts` exactly as the ticket's Description and Interface specify (the ticket file in `context` is the behavioural contract; read it in full), with UI Vitest AD-13 cases on the stubbed nav and one android Playwright case in `e2e/nav.spec.ts`.

## Boundaries & Constraints

**Always:** Invalid-state calls throw `Error('AD-13 …')`; only the `AD-13 ` prefix is binding (e.g. `AD-13 select(9, 1): column out of range`); tests match `/^AD-13 /` only. Every throw checks before any state change or nav call (no partial mutation). Only the no-ops the ticket names are no-ops (rule 6). `selection !== null` ⇔ `isOpen('tailSelection')`; `viewCell !== null` ⇔ `isOpen('wordcellView')`; `isOpen('endSheet')` ⇔ `endSheet === 'expanded'`. Test names start with `AD-13`.

**Never:** Touch files other than `src/ui/overlays.svelte.ts`, `src/ui/overlays.svelte.test.ts` and one appended test in `e2e/nav.spec.ts` (epic parallel-lane note); wire `DispatchResult` finished/unfinished; read `game` from the store; change `nav.ts`, `main.ts`, `new-game.ts` or the existing overlays/History notice tests; add the tile selection (AD-13 names it; it is epic 5's).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| First select | empty stack, no peek | `select(2,3)` → selection {2,3}, one push | non-empty stack or peek open → throw |
| Re-select | tail on col 2 (view may be above) | `select(2,1)` → {2,1}, no push | other column → throw; bad column/count → throw |
| Deselect | none selected / tail top / view above | no-op (no nav) / one pop, selection null / throw | — |
| Peek → sticky | selection kept, `openPeek(5)` then `peekToSticky()` | peek null, viewCell 5, one push above selection | no peek → throw |
| Hover peek | peek/view open, or historyNotice/resetConfirm/endSheet on top | `openHoverPeek(c)` no-op | bad cell → throw first; hover already open → throw |
| Back to depth | select, openView, `closedByBack(1)` then `(0)` | viewCell null, selection kept; then selection null; peek/hoverPeek untouched | never calls nav |
| End sheet | collapsed, empty stack → expand → close/back | expanded + push; close → collapsed + pop; back → collapsed | expand/collapse from wrong state → throw |
| Deferred open | token, view open on top | `openDeferred(t)` → hover cleared, view closed (pop), expanded (push) | peek open or view not top → throw, token kept; stale token → no-op |
| Supersede | `t1 = defer(); t2 = defer()` | `openDeferred(t1)` no-op; `openDeferred(t2)` opens | — |
| Reset | selection + sticky view + peek + hover + live token | pops top-down, hidden, all null, old token dead, fresh token opens | — |

</intent-contract>

## Code Map

- `src/ui/overlays.svelte.ts` -- the store (47 lines): `stack` `$state.raw<readonly OverlayId[]>`, `open`/`close`/`closedByBack`/`resetForNewSession`, exported `overlays` object with getters. Extend in place; keep `open`/`close` messages' `AD-13 ` prefix; generic `open` throws for the three new ids.
- `src/ui/overlays.svelte.test.ts` -- `vi.mock('../shell/nav')` stub recording `push`/`pop` in `calls`; `load()` gives a fresh module per test. Append a new `describe` reusing `load()`; do not edit existing cases.
- `e2e/nav.spec.ts` -- android-only; helpers `start(page, { history, session })`, `boardReady`, `wc(page)` (from `./helpers/dialogs`), `fixture`. Append one test at the end; locate Undo/Redo via `getByTestId('undo'|'redo')`, primary via `getByTestId('primary-action')`. Last existing test (win → New game → back) stays unchanged.
- `src/ui/new-game.ts`, `src/main.ts` -- callers of `resetForNewSession`, `closedByBack`, `depth`: read-only, must stay compatible.

## Tasks & Acceptance

**Execution:**
- [x] `src/ui/overlays.svelte.ts` -- add `OverlayId` `tailSelection | wordcellView | endSheet`; `$state` for selection, endSheet, peek, viewCell, hoverPeek, live token (opaque number counter); implement every operation of the ticket Interface per the ticket Description and Design Notes; extend `close`/`closedByBack` with the per-id removal effects; widen `resetForNewSession`; update the header comment -- AD-13 single owner.
- [x] `src/ui/overlays.svelte.test.ts` -- AD-13 cases for every transition, throw and no-op in the ticket's Tests paragraph and the I/O matrix, with exact `calls` sequences; plus: closedByBack leaves peek and hoverPeek unchanged (one assertion); `isOpen('endSheet')` ⇔ expanded (one assertion); openDeferred throw paths leave the token live (a later valid call opens); supersede case; openHoverPeek no-op under historyNotice/resetConfirm/expanded endSheet and bad-cell throw while a peek is open -- S coverage.
- [x] `e2e/nav.spec.ts` -- append `AD-13 epic 4 leaves DispatchResult finished unwired: Undo then Redo into won on session-won keeps history.length and history.state.wc 0` (android): seed `session-won.json` + `history-three-records.json`, boardReady, record `history.length` (`page.evaluate`) and wc 0; click undo; `await expect(primary).not.toHaveText('New game')`; `await expect(redo).toBeEnabled()`; click redo; `await expect(primary).toHaveText('New game')`; wait for animations to settle (`page.waitForFunction(() => document.getAnimations().length === 0)`); assert `history.length` unchanged and `wc` 0 -- P4.

**Acceptance Criteria:**
- Given the full suite, when `npm run test:all` runs, then it is green, the existing overlays, History notice and Reset confirm tests pass unchanged.
- Given `session-won` on android, when Undo then Redo returns to won, then `history.length` is unchanged and `history.state.wc` is 0.

## Implementation Notes

- Files touched: `src/ui/overlays.svelte.ts`, `src/ui/overlays.svelte.test.ts` (one new `describe`, 43 cases, 49 in file), `e2e/nav.spec.ts` (one appended android test). Ticket API names kept as-is; added exported types `EndSheetState`, `TailSelection`.
- Error text: range errors read `AD-13 <op>(<args>): … out of range`, state errors `AD-13 <op> while …`; only the prefix is binding.
- Unreachable but specified branches kept without tests: `peekToSticky` clearing a hover peek (openHoverPeek is a no-op while a peek is open) and `openDeferred(live)` throwing when the sheet is not hidden (a live token implies hidden).
- Verification: overlays Vitest 49/49; one complete `npm run test:all` run green (see Auto Run Result). Earlier runs each had one failure in untouched `e2e/layout.spec.ts` (AD-11 banner during a scroll, `scrollY changes between steps`), the deferred timing flake.

## Plan Change Log

## Review Triage Log

### 2026-10-02 — Review pass
- verdicts: 20 findings — high 0, medium 0, low 10, false 9, maybe-false 1
- findings:
  - `[low]` `[reject]` blind: an open hover peek / peek survives `open(historyNotice|resetConfirm)` and `expandEndSheet()` — unreachable in epic 4: the notice opens only at boot or after New game's reset (which clears hover and peek), resetConfirm opens from the notice (openHoverPeek is a no-op under it), `expandEndSheet` has no caller until epic 6, whose key commands call the controller's `cancel()` first (AD-12); fix would add unspecified behaviour.
  - `[false]` `[reject]` blind: re-select under a modal is unguarded — a selection cannot sit under a modal: first select needs an empty stack, the notice only opens after a reset, the expanded sheet needs an empty stack or a lone view; App is `inert` under the notice.
  - `[low]` `[patch]` blind: re-select while a peek is open untested — added a Vitest case.
  - `[low]` `[patch]` blind: e2e "unwired" test will change in epic 6 with no note — added a comment.
  - `[maybe-false]` `[reject]` blind: `getAnimations()` settle can pass before an animation starts — would only be low: no code path pushes on finished in epic 4; settling would need a nav push hook to observe; the check is the review-log minor 1 as planned.
  - `[false]` `[reject]` blind: e2e checks no end-sheet element — no end-sheet UI exists in epic 4 (epic 6).
  - `[low]` `[patch]` blind: untested paths (peekToSticky under resetConfirm/endSheet, closedByBack collapsing a sheet under another entry, reset with sheet + modal, openHoverPeek bad cell under a modal) — added Vitest cases.
  - `[low]` `[patch]` blind: header comment cites "the ticket" and an epic-scoped fact — reworded to cite CAP-5.
  - `[false]` `[reject]` blind: `select` count has no upper bound — the ticket specifies only integer ≥ 1; the column length is the caller's GameView gate (CAP-6).
  - `[false]` `[reject]` blind: plan bookkeeping (ticket '5', 100755 mode, empty triage log, Code Map line count) — `ticket` is find's id per workflow; `core.filemode` is false so the file commits 100644; the log is written by this step; the Code Map is planning-time. Fix would edit the plan.
  - `[low]` `[patch]` blind: no single green `test:all` run recorded — re-ran `npm run test:all` after the patches (see Implementation Notes / Auto Run Result).
  - `[low]` `[reject]` edge: `expandEndSheet()` with a peek open — grouped with the first row (no epic 4 caller; keyboard cancels first).
  - `[low]` `[reject]` edge: `expandEndSheet()` with a hover peek open — grouped with the first row.
  - `[low]` `[reject]` edge: `open(modal)` with a hover peek open — grouped with the first row.
  - `[false]` `[reject]` edge: re-select under a modal — same refutation as the second row.
  - `[false]` `[reject]` intent: openHoverPeek no-op under a modal is unspecified — the ticket's review log (minor 4) asked the build to pick no-op or allowed; Design Note 4 records no-op.
  - `[false]` `[reject]` intent: openDeferred validates before consuming, against the literal order — review-log minor 2 directs exactly this; Design Note 2.
  - `[false]` `[reject]` intent: range errors lack "while" — review-log minor 7: only the `AD-13 ` prefix is binding.
  - `[false]` `[reject]` intent: behaviour checked on a stubbed nav, the e2e only guards "unwired" — the ticket AC names a stubbed nav and this exact Playwright case; real-history overlay flows are tickets 6, 7 and 9's P4 rows (rule-coverage AD-13).
  - `[low]` `[reject]` intent: two specified branches untested (peekToSticky clearing a hover peek; openDeferred(live) with the sheet not hidden) — unreachable through the public API, recorded in Implementation Notes; a test would need a test-only seam.

## Design Notes

Review-log minors resolved here:
1. Redo settle / auto-retrying asserts → e2e task above.
2. `openDeferred(live)` validates every precondition (sheet hidden, no peek open, no non-top view: i.e. after removing a top `wordcellView` the stack would be empty) before consuming the token or mutating.
3. Files touched → Never list.
4. `openHoverPeek` with `historyNotice`, `resetConfirm` or `endSheet` on top → **no-op** (same timer-fires-late reasoning as peek/view; the hover copy must never draw above a modal). Cell validated first, so a bad cell always throws; then the no-op checks; then the already-open throw.
5. `closedByBack` never touches peek or hover peek → one assertion.
6. First-select wording read as: throws when the stack is non-empty, or when a peek is open (re-select checks neither).
7. Only `AD-13 ` prefix binding → Always.
8. `isOpen('endSheet')` ⇔ `expanded` → one assertion.
9. Supersede → one Vitest case.
10. Tile selection → epic 5 (Never).

Shape: one `removeTop()` used by `close` and `closedByBack` that pops the stack and applies the per-id effect (`tailSelection` → selection null; `wordcellView` → viewCell null; `endSheet` → `collapsed`); `close` adds `nav.pop()`. `onUnfinished` and `resetForNewSession` set `hidden` after their closes. Cells are integers 3–10, columns integers 1–8, counts integers ≥ 1. `expandEndSheet` checks only collapsed with the stack empty (the ticket's precondition), not an open peek, so a peek can stay open under the expanded sheet while `openDeferred` throws in that case; it has no epic 4 caller, and epic 6's wiring should check the peek.

## Verification

**Commands:**
- `npx vitest run src/ui/overlays.svelte.test.ts` -- expected: all pass
- `npm run test:all` -- expected: green

## Auto Run Result

- **Summary:** `src/ui/overlays.svelte.ts` now owns the tail selection, sticky WordCell view, peek, hover peek and the end sheet's `hidden | collapsed | expanded` with the deferred-open token (AD-13, CAP-5); `DispatchResult` finished stays unwired.
- **Files:**
  - `src/ui/overlays.svelte.ts` -- new ids, state, operations; shared `removeTop()` per-id effects; widened `resetForNewSession`.
  - `src/ui/overlays.svelte.test.ts` -- 43 new AD-13 cases (49 in file) on the stubbed nav.
  - `e2e/nav.spec.ts` -- appended android test: Undo then Redo into won keeps `history.length` and `wc` 0.
- **Review-log minors:** all 10 resolved in Design Notes (1, 2, 4, 5, 8, 9 implemented and tested; 3, 6, 7, 10 recorded as boundaries).
- **Review findings:** 20 (thorough: blind-hunter, edge-case-hunter, verification-gap, intent-alignment). Patched 5 low (new test cases, CAP-5 comment wording, epic 6 note on the e2e test, a fresh `test:all`). Rejected 15 with reasons in the Review Triage Log (unreachable hover/peek-under-modal paths with no epic 4 caller; choices the ticket's review log delegated; plan bookkeeping). Deferred 1: the pre-existing layout.spec scroll flake.
- **Follow-up review recommended:** false (patched: high 0, medium 0, low 5).
- **Verification:** one complete `npm run test:all` run after the review-loop fixes, green on the first attempt (exit 0): lint, check, unit (1792 passed), build with size budget, `test:e2e:dist` (14 passed), `test:e2e` (250 passed), `test:e2e:pwa` (12 passed).
- **Residual risks:** openHoverPeek is a no-op under historyNotice/resetConfirm/expanded endSheet (Design Note 4, a choice the review log delegated); an already-open hover peek is not cleared when a modal or the sheet opens over it (no epic 4 caller can reach that; epic 6 should check when wiring the keyboard and the end sheet).
