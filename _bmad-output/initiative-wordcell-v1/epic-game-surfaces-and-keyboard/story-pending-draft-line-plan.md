---
title: 'Pending-draft line'
type: 'feature'
ticket: 'story-pending-draft-line'
created: '2026-10-15'
status: done
baseline_revision: '8fa949986daa899ee474adec57ac149a957bae88'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/AGENTS.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** In Idle with a pending draft (an Undo past Place/Composing leaves a redo tail) the tray band is empty, so the player cannot tell what Redo brings back (R-72, Q-41, CAP-9).

**Approach:** `text.ts` `pendingDraft(word)` returns `{prefix, word, suffix}`; Tray.svelte renders one extra branch in `.word-line` from `view.pendingDraftWord` only, as two spans. Full ticket text: `story-pending-draft-line.md` (Description, Acceptance Criteria, Notes) is the contract.

## Boundaries & Constraints

**Always:** Rendered iff `view.pendingDraftWord !== undefined`, no phase check, no re-derivation (AD-3). Prefix `Undone: `, word uppercased (`qu` → `QU`), suffix ` · Redo brings it back` (U+00B7), all in `text.ts`; Tray builds no string. One ui-label line (500 14px/20px system-ui), `--wc-ink-secondary`, left-aligned, nowrap; word span `min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap`, suffix span `flex:none` nowrap. At 360 px no wrap/overflow and the full suffix is visible. Static text: no `aria-live`, no `role=status`. Band height, columns, WordCell row do not move. Test names: `AD-3 …` (Vitest), `R-72 …` (Playwright android).

**Never:** Change the engine, `GameView`, `WordLine.svelte`, `deal`, or any existing fixture. No hex colours. No new `data-testid`.

## I/O & Edge-Case Matrix

| Scenario | State | Behaviour |
|---|---|---|
| Idle + pending draft | `pendingDraftWord: 'baked'` | `Undone: BAKED · Redo brings it back` |
| Composing / Place / Game over / no draft | field undefined | no line |
| Redo reached, or new edit discards the tail | field undefined, or later edit's word | none, or the NEW word |
| Reload in Idle with draft | replay | line still shows |
| 10-letter word at 360 px | long fixture | one row, `scrollWidth <= clientWidth`, suffix fully visible |

</intent-contract>

## Code Map

- `src/ui/Tray.svelte` -- `.word-line` div holds `{#if draft !== undefined}<WordLine …/>{/if}`; add `{:else if view.pendingDraftWord !== undefined}` branch with the two spans; style next to `.word-line`. Pattern: `src/ui/tray/WordLine.svelte` `.invalid` word/suffix spans.
- `src/ui/text.ts` -- catalogue; `invalidWordParts` (line ~59) is the parts precedent; add `pendingDraft`.
- `src/ui/text.test.ts` -- add `AD-3` tests beside `endBar` (line ~225).
- `src/ui/surfaces.test.ts` -- server-render pattern (`svelte/server`, `vi.mock('../shell/game.svelte')`); Tray render test goes in a new `src/ui/pending-draft.test.ts` using the same mocks (Tray imports `game`).
- `fixtures/session-idle-pending-draft-long.json` -- ALREADY CREATED (seed 1; TAN committed, then 10-letter `vimldxomiw` placed and undone twice, cursor `{index:1, phase:'idle'}`). Do not alter. Wire it into `src/engine/serialize.test.ts` (import, `ValidName`, `VALID` end entry `'idle-pending-draft-long'`, `REBUILDS` end entry via `play(createSession(1), [drop(3,2,6), FLIP, VALIDATE, CONFIRM, drop(1,7,2), {type:'setDestinationCount',k:3}, VALIDATE, UNDO, UNDO], ['tan','vimldxomiw'])`, fix the "seventeen" comment) and into the sorted list in `src/architecture-ad2-ad12-ad17.test.ts:26`.
- `e2e/board-phases.spec.ts`, `e2e/helpers/board.ts` (`openFixture`, `Step`), `e2e/helpers/seed.ts`, `e2e/tray.spec.ts` -- patterns for fixture-seeded flows, Undo/Redo, reload, dragging a tail to the tray; new spec `e2e/pending-draft.spec.ts`.
- `e2e/board.screens.spec.ts` -- add the 360 px Idle-with-pending-draft baseline (10-letter fixture); baselines only via `npm run test:screens` (Docker).

## Tasks & Acceptance

**Execution:**
- [ ] `src/ui/text.ts` -- add `pendingDraft(word)` → `{prefix:'Undone: ', word: word.toUpperCase(), suffix:' · Redo brings it back'}` -- catalogue rule
- [ ] `src/ui/Tray.svelte` -- render the branch and style it -- Description Placement
- [ ] `src/ui/text.test.ts`, `src/ui/pending-draft.test.ts` -- `AD-3` tests: `pendingDraft('quake')`, a 3- and a 10-letter word, `qu`→`QU`; Tray render with/without `pendingDraftWord`, no aria-live/role=status (if Tray cannot render under the server-compiled setup, say so in Implementation Notes and keep the `pendingDraft` tests)
- [ ] `src/engine/serialize.test.ts`, `src/architecture-ad2-ad12-ad17.test.ts` -- wire the new fixture
- [ ] `e2e/pending-draft.spec.ts` -- `R-72 …` Flow 3 tests (android): seed a Place-after-BAKED Session (name the setup in the test), Undo ×2 line, reload, Redo ×2 none; discard case with a different named word; computed `white-space`/`text-overflow` on the word span; no aria-live/role=status; 360 px check on the long fixture
- [ ] `e2e/board.screens.spec.ts` -- add the baseline; generate with `npm run test:screens`

**Acceptance Criteria:**
- Given Idle with a pending draft, when the board renders, then `Undone: <WORD> · Redo brings it back` shows in the tray band; in every other state it is absent.
- Given a 10-letter pending word at 360 px, then the line is one row with no overflow and the suffix fully visible.
- Given `npm run test:all` and `npm run test:screens`, then both are green.

## Implementation Notes

## Plan Change Log

## Review Triage Log

### 2026-10-15 — Review pass
- verdicts: 24 findings — high 0, medium 4, low 6, false 3, maybe-false 0 (rest grouped duplicates of the rows below)
- findings:
  - `[medium]` `patch` Discard case did not follow the ticket's Verify (no Place/Composing no-line asserts, no NEW word after Undo, no absence after commit) — rewritten to TAW flow, passes.
  - `[medium]` `patch` 360 px test did not check the band's `scrollWidth <= clientWidth`; `oneRow` measured a fixed 24 px — band check added, oneRow now compares word/suffix tops.
  - `[medium]` `patch` Joined string `Undone: QUAKE · Redo brings it back` not asserted in Vitest (parts and Tray render) — added, plus draft+pendingDraftWord branch-order case.
  - `[medium]` `patch` No Composing no-line assert between the two Undos — added.
  - `[low]` `reject` Prefix inside the ellipsizing word span — ellipsis cuts from the end, the ticket specifies two spans; prefix only clips at extreme narrowness.
  - `[low]` `reject` Ellipsis path not exercised — the ticket says 10 letters fit at 360 px and is expected not to trigger it.
  - `[low]` `reject` Test uses TAN not BAKED — ticket says the setup is named in the test; equivalent flow.
  - `[low]` `reject` `<p>` vs div, hard-coded ui-label font (the codebase uses the same literal), `white-space: pre` (needed to keep the flex item's leading space) — cosmetic.
  - `[false]` `reject` Stale plan document, unchecked tasks — plan is not a deliverable under review.
  - `[false]` `reject` Engine could set pendingDraftWord outside Idle — view.test.ts already pins that it is Idle-only.
  - `[false]` `reject` Discard drop must go to the tray — drops compose on a column in this app (drag.spec.ts).

## Design Notes

DESIGN.md says the word line otherwise shows only card letters; this line is the specified Idle exception (EXPERIENCE.md State Patterns, A-E13).

## Verification

**Commands:**
- `npm run test:all` -- expected: green
- `npm run test:screens` -- expected: green (baseline generated for the new screen)

## Auto Run Result

- Summary: Idle-with-pending-draft tray line `Undone: WORD · Redo brings it back` from `text.pendingDraft` and `view.pendingDraftWord`, in `.word-line`.
- Files: `src/ui/text.ts` (pendingDraft), `src/ui/Tray.svelte` (branch + styles), `src/ui/text.test.ts`, `src/ui/pending-draft.test.ts`, `e2e/pending-draft.spec.ts`, `e2e/tray.spec.ts` (idle fixture no longer empty), `e2e/board.screens.spec.ts` + two baselines, `fixtures/session-idle-pending-draft-long.json` wired into `src/engine/serialize.test.ts` and `src/architecture-ad2-ad12-ad17.test.ts`.
- Review: 4 patches applied, 0 deferred, 7 rejected (see Triage Log).
- followup_review_recommended: false (no high patched; 4 medium test-coverage patches, now covered).
- Verification: `npm run test:all` green after patches; `npm run test:screens` green before the test-only patches (no UI change since).
- Residual risks: the gap before `·` looks narrow in the screenshot (DOM has the space); the discard e2e composes TAW from the dealt board by dropping on a column. Changes are left uncommitted by the invoking instruction (no commit).
