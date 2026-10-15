---
title: 'End sheet: history-unreadable block and Reset history'
type: 'feature'
ticket: '7'
created: '2026-10-15'
status: 'built'
baseline_revision: 'b3337bb2dd126227becb01128cc07e165d1411a6'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/specs/spec-epic-6-surfaces/SPEC.md'
  - '{project-root}/_bmad-output/specs/spec-epic-6-surfaces/build-notes.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/story-end-sheet-history-unreadable-block-and-reset-history.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/story-end-sheet-history-unreadable-block-and-reset-history.review-log.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** With an unreadable score history the finished-game sheet shows nothing about it: no block, no Reset history, no reassurance after a reset, and the relaunch-into-Game-over notice-over-sheet flow is untested.

**Approach:** Implement the ticket file as written (its Description, Acceptance Criteria and the 2026-10-15 owner decision are the contract). The block reads the live `scoreHistory.state` through the existing `historyUnreadable()` getter and `text.historySentence` (SPEC F4, no re-derived message). The replacement line is one UI flag in `overlays`, set when Delete history runs with the end sheet open and no Statistics panel open, cleared by Undo (`onUnfinished`) and `resetForNewSession`; it survives collapse and expand and never survives a reload.

## Boundaries & Constraints

**Always:** Rules 1–7 of AGENTS.md. Strings only in `src/ui/text.ts` (the new line `This game wasn't added to your statistics.`). Reuse `ResetConfirm`, `openSurface('resetConfirm')`, `act()`; the confirm is mounted outside the sheet's inert layer. Reset history is a danger button. Block and line sit under the stat lines (and the penalty line), above Replay/Statistics. Test names start with the id; locate by role and name, no new `data-testid`.

**Never:** Engine, store (`history.svelte.ts`, `game.svelte.ts`) or `SESSION_VERSION`/`HISTORY_VERSION` changes; any stored marker for the unrecorded finish; the line after a reload, after a new game, or after Reset from the Statistics panel; Undo-cancel/300 ms floor (entry 12), keymap (entry 10).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Finish, unreadable | win or Give up with a `history-invalid-*` seed | block: title, variant sentence, `This game wasn't added to your statistics.`, danger Reset history; stored `wordcell:history` byte-equal to the fixture | none |
| Reset from block | Reset history (wc 1 → 2), Delete history | `{ wc: 1 }`, sheet expanded, block replaced by the single line, history `{ version: 1, records: [] }` | none |
| Keep it / Esc / back / scrim | on that confirm | only the confirm closes, block stays, sheet not collapsed | none |
| Collapse and expand after reset | handle, then bar | line still shown | none |
| Undo after reset | Undo in top bar | sheet hidden, play resumes, history still empty, line flag cleared; a new finish records normally, no line | none |
| Relaunch Game over, unreadable | `session-won`/`session-gave-up` + fixture | `{ wc: 2, launch }`, notice over expanded sheet; confirm wc 3; Delete closes confirm and notice → `{ wc: 1 }`, single line; Keep it/Esc/back/scrim → notice stays; back sequence 3→2→1→0→leaves | none |
| Reset from Statistics | panel opened from sheet or menu | sheet shows neither block nor line | none |

</intent-contract>

## Code Map

- `src/ui/EndSheet.svelte` -- add the block / line under `dl` and the penalty line; mount `<ResetConfirm escKeeps />` outside the `.layer` when `resetConfirm` is open and neither `historyNotice` nor `statistics` is; restore focus (Reset history button, else Replay) after the confirm closes.
- `src/ui/ResetConfirm.svelte` -- `deleteHistory` marks the finish unrecorded when `overlays.isOpen('endSheet') && !overlays.isOpen('statistics')`, before/after `scoreHistory.reset()` (reset first, rule 6).
- `src/ui/overlays.svelte.ts` -- new `$state` flag `unrecordedFinish` with getter and `markFinishUnrecorded()`; cleared in `onUnfinished` (all branches) and `resetForNewSession`.
- `src/ui/HistoryNotice.svelte` -- pass `escKeeps` to its `ResetConfirm` (ticket: Esc returns to the notice).
- `src/ui/text.ts` -- `endNotAdded`; `src/ui/history-notice.svelte.ts` -- `historyUnreadable()` (reuse, do not change).
- `src/shell/history.svelte.ts` -- read-only: `reconcile` writes nothing while unreadable; `reset()` writes the empty history.
- `e2e/end-sheet.spec.ts`, `e2e/end-sheet.screens.spec.ts`, `e2e/helpers/{seed,dialogs}.ts`, `fixtures/history-invalid-{version-unknown,null,record-field-set}.json`, `session-won.json`, `session-gave-up.json` -- conventions and seeds.
- Unit: `src/ui/overlays.svelte.test.ts` / `overlays-surfaces.test.ts`, `src/ui/text.test.ts`.

## Tasks & Acceptance

**Execution:**
- [x] `src/ui/text.ts`, `src/ui/overlays.svelte.ts`, `src/ui/ResetConfirm.svelte`, `src/ui/HistoryNotice.svelte`, `src/ui/EndSheet.svelte` -- as in the Code Map
- [x] Unit tests -- flag set/cleared (Undo from expanded and collapsed, new session), text string; the Statistics-open guard in `ResetConfirm` is covered by the e2e tests "Reset history from the Statistics panel ..." (no component-mount pattern exists in Vitest)
- [x] `e2e/end-sheet.spec.ts` -- Playwright (android): block after win and after Give up across the three variant fixtures with variant sentences and byte-equal storage; Reset history flows (Delete, Keep it, Esc, back, scrim); collapse/expand keeps the line; Undo leaves history empty and a new finish records normally; relaunch notice-over-sheet with the full back sequence; Reset from Statistics leaves neither
- [x] `e2e/end-sheet.screens.spec.ts` -- screens: block (`history-invalid-version-unknown`) and the single line at 360 px; baselines via `npm run test:screens`

**Acceptance Criteria:**
- Given an unreadable history, when a game finishes, then the sheet shows the block with the variant sentence and the stored history is unchanged.
- Given the block, when Delete history is confirmed, then the sheet stays expanded with only the line and a later Undo leaves the history empty.
- Given a relaunch into Game over with an unreadable history, then the notice shows over the sheet at `{ wc: 2 }` and the confirm/back sequence of the ticket holds.

## Implementation Notes

## Plan Change Log

## Review Triage Log

### 2026-10-15 — Review pass
- verdicts: 19 findings — high 0, medium 1, low 2, false 5, maybe-false 0
- findings:
  - `[low]` `[patch]` HistoryNotice.svelte garbled comment (blind-hunter, verification-gap) — comment reworded.
  - `[low]` `[patch]` ResetConfirm.svelte header comment stale about Esc (blind-hunter, edge-case) — comment updated.
  - `[medium]` `[patch]` No test for Reset from Statistics opened from the menu over the collapsed sheet (verification-gap; blind-hunter missing unit test) — e2e test added; passes.
  - `[false]` `[reject]` fromSheet set without finish check (blind-hunter, edge-case) — the `endSheet` overlay is open only for a finished game, and the line is only shown while the history reads unreadable-then-reset per the owner decision.
  - `[false]` `[reject]` block replaced by line / vanishes if history state changes (blind-hunter) — the history store cannot become readable or unreadable again without a reload, which drops the flag.
  - `[false]` `[reject]` openFixture `history` option clicks Not now unconditionally (blind-hunter, edge-case) — the option is only used with history-invalid fixtures; a wrong use fails loudly (rule 6).
  - `[false]` `[reject]` focus tick guard (edge-case) — the focus call is a plain button focus after confirm close; no overlay can open in that tick.
  - `[false]` `[reject]` fixture names, plan housekeeping, ticket id, autopilot log wording, a11y, CSS duplication, scrim coordinates, win path variants (blind-hunter) — nitpicks with no named harm or outside the intent.
  - `[low]` `[reject]` Screens baselines outside test:all (verification-gap) — the repo's intended split; test:screens was run green.
  - `[low]` `[reject]` Store-level "Undo removes nothing", reload lifetime untested (intent-alignment) — descriptive only; e2e asserts history stays empty after Undo, the flag is UI-only state.

## Verification

**Commands:**
- `npm run test:all` -- expected: green
- `npm run test:screens` -- expected: green (Docker; new baselines generated in the container)

## Auto Run Result

- Summary: end-sheet history-unreadable block (title, variant sentence, not-added line, danger Reset history), replacement line after Reset history held in a UI-only `overlays.unrecordedFinish` flag cleared by Undo and new session, and the notice-over-sheet relaunch flow with Esc as Keep it.
- Files: `src/ui/EndSheet.svelte` (block, line, confirm mount), `src/ui/ResetConfirm.svelte` (marks finish unrecorded), `src/ui/HistoryNotice.svelte` (escKeeps), `src/ui/overlays.svelte.ts` (flag), `src/ui/text.ts` (endNotAdded), unit tests, `e2e/end-sheet.spec.ts`, `e2e/history-notice.spec.ts`, `e2e/helpers/board.ts`, `e2e/end-sheet.screens.spec.ts` plus four new baselines.
- Review: patches applied 3 (one medium, two low); deferred 0; rejected 8 (reasons in triage log).
- followup_review_recommended: false.
- Verification: `npm run test:all` exit 0 (re-run after patches); `npm run test:screens` 30 passed, 8 skipped before the comment/e2e-only patches.
- Residual risks: none named.
