---
title: 'Success signal: finish a game and play by keyboard'
type: 'feature'
ticket: '15'
created: '2026-10-16'
baseline_revision: 'e0af5df46cd805d667dff95565add81fa5adaa4e'
status: 'built'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/story-success-signal-finish-a-game-and-play-by-keyboard.md'
  - '{project-root}/_bmad-output/specs/spec-epic-6-surfaces/rule-coverage.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** Epic 6 has no end-to-end proof that a player can finish a game (win and Give up), read and operate the end sheet, and play a whole move by keyboard alone.

**Approach:** Add `e2e/surfaces-success.spec.ts` with the three tests the story file names (its Description and Acceptance Criteria are the sole requirements; read it fully), and move the Flow 6 helpers from `e2e/board-keys.spec.ts` to `e2e/helpers/keys.ts` unchanged, with one AD-17 test in `e2e/helpers.spec.ts`. No new fixture, no screenshot spec.

## Boundaries & Constraints

**Always:** Test names start with an id as the story gives them. Expected values are literals or `view()` reads as the story states, never edited to pass. After every dispatching step, New game and the reload, `expect.poll` until `storedGame(page)` equals `game(page)`. Reuse `e2e/helpers/*`; no copies. Pointer/touch taps only on android (no drag helper); keyboard only on desktop after load.

**Never:** Touch `e2e/success-signal.spec.ts`, `src/`, fixtures, or baselines. Do not fix a rule-coverage gap here; list it in Implementation Notes. Do not change helper behaviour when moving it. No `page.clock`, no fixed sleeps.

</intent-contract>

## Code Map

- `e2e/board-keys.spec.ts` -- source of `open`, `toComposing`, `arrangeByKeys`, `press`, `track` and what they use (`letters`, `where`, `focusedCard`, `tiles`, `tray`); lines ~35-150; Flow 6 test at ~642. After the move it imports them from `./helpers/keys`.
- `e2e/helpers/keys.ts` -- new; exports those helpers unchanged. Beware helpers that use spec-local consts (`tiles`, `tray`): move or export them too.
- `e2e/helpers.spec.ts` -- add one AD-17 test (id `AD-17`) for `keys.ts` following the neighbouring `describe` blocks' style.
- `e2e/helpers/board.ts` -- `openFixture`, `tapAt`, `centre`, `cards`, `column`, `stashSession`, `sameSession`, `glidesSettled`, `END_SHEET`, `collapseEndSheet`.
- `e2e/helpers/session.ts` -- `game`, `storedGame`, `storedText`. `e2e/helpers/restore.ts` -- `waitForDictionary`, `dictionaryReady`. `e2e/helpers/lifecycle.ts` -- `animationFrames`. `e2e/helpers/sessions.ts` -- `SESSIONS.flow6`. `e2e/helpers/project.ts` -- `onAndroid`, `onDesktop`.
- `e2e/success-signal.spec.ts` (read-only) -- the tap-only ANEW move (tail 1, 9, 28 of column 6, column 1 placeholder, W 48 on cell 7) to copy the taps from; `e2e/statistics.spec.ts`, `e2e/preferences.spec.ts`, `e2e/how-to-play.spec.ts`, `e2e/end-sheet.spec.ts` -- locators for Menu, Statistics, Show timer, How to play, end sheet.
- `src/ui/text.ts` -- `bandNames()` and message strings (import for expected text only).

## Tasks & Acceptance

**Execution:**
- [ ] `e2e/helpers/keys.ts`, `e2e/board-keys.spec.ts` -- move the Flow 6 helpers unchanged; board-keys imports them -- reuse by the new spec
- [ ] `e2e/helpers.spec.ts` -- one AD-17 test for `keys.ts` -- helper coverage
- [ ] `e2e/surfaces-success.spec.ts` -- the three tests per the story file (android A, android B, desktop Flow 6) -- the epic's Success signal
- [x] Audit by grep that every P6 row of `rule-coverage.md` whose CAP is in the story's `covers` has a passing test carrying its id; list gaps in Implementation Notes

**Acceptance Criteria:**
- Given the android project, when the A and B tests run, then each step observes what the story file lists and the stored Session equals `game()` after each step.
- Given the desktop project, when Flow 6 runs by `page.keyboard` only, then `moves[3]`, cursor index 4 and score 190 equal the story's literals and `Esc` behaves per I-68.
- Given `npm run test:all`, then it is green; `e2e/board-keys.spec.ts` tests still pass.

## Implementation Notes

Subagent implemented: moved Flow 6 helpers to `e2e/helpers/keys.ts` (only `export` keywords added: `tray`, `tiles`, `where`, `focusedCard`, `Where`); added `e2e/surfaces-success.spec.ts` (3 tests) and one AD-17 test in `e2e/helpers.spec.ts`. No new fixture, no `src/` change.

Rule-coverage audit (grep of test names): ids R-62, R-70..R-76, R-81..R-84, Q-24, Q-33, Q-35, Q-44, A-E7, A-E9, F39 each have a test. Remaining rows grepped over e2e/ and src/ (test names): AD-13 two-overlay reload (Statistics plus Reset confirm) covered, e2e/statistics.spec.ts `AD-13 reload with Statistics and its Reset confirm open ...`; AD-13 Game-over reload with unreadable history covered, e2e/end-sheet.spec.ts (`AD-13 a relaunch into Game over with an unreadable history ...`, `AD-13 Delete history on the relaunch notice ...`) and e2e/nav.spec.ts; confirm dismissed from a menu row (focus on the menu button) covered, e2e/confirm.spec.ts `R-74 ... confirm dismissed by ... focus on the menu button`; discriminating win smoke test covered, e2e/end-sheet.spec.ts `R-62 a win by Confirm opens the sheet after the glide: win title, final score = pre-win score plus the committed delta ...`. A8 (wheel, hover-peek re-anchor, bfcache hide flush) is row CAP-12 of rule-coverage.md, outside this ticket's `covers`; no test name carries the id `A8` (e2e/wheel-drag.spec.ts, e2e/hover-peek-reanchor.spec.ts and e2e/lifecycle.spec.ts carry AD-12, R-73, Q-38 ids): recorded as a gap, not fixed here.

## Plan Change Log

## Review Triage Log

### 2026-10-16 — Review pass
- verdicts: 29 findings — high 0, medium 0, low 3, false 4, maybe-false 0 (remaining rows rejected low or carried as duplicates)
- findings:
  - `[low]` `[patch]` local `tray` duplicates the `keys.ts` export (blind, edge) — fixed: spec imports `tray`.
  - `[low]` `[patch]` no assertion that the sheet is gone after New game (intent-alignment) — fixed: neither `Collapse result` nor `Show result:` button is present.
  - `[low]` `[reject]` `synced` could pass vacuously / comment on activeMs — `game` and `storedGame` both zero activeMs and `storedGame` throws when the key is absent; stored text is non-empty JSON.
  - `[low]` `[reject]` getAnimations after 2 frames, flaky — the story specifies `animationFrames(page, 2)` then 0 (R-73).
  - `[low]` `[reject]` timer `first` could be null; seed could be 1; Esc closes whole dialog not a sub-table; android test does seven phases; positional `dd` locators; keys.ts comment typo copied from source; AD-17 helper test thin; plan metadata/line-number remarks — story-mandated shape or cosmetic, fix not worth added complexity (the controls table is the How to play dialog per Flow 6 step 5).
  - `[false]` `[reject]` verification-gap: no gaps found; empty Implementation Notes — filled above.
  - `[false]` `[reject]` intent-alignment readings A and D implemented, B (fixtures) not needed per story "no new fixture"; audit result recorded in Implementation Notes.

## Verification

**Commands:**
- `npx biome check e2e` -- expected: clean
- `npx playwright test e2e/surfaces-success.spec.ts e2e/board-keys.spec.ts e2e/helpers.spec.ts` -- expected: all pass on android and desktop
- `npm run test:all` -- expected: green (run `npm run test:screens` only if Docker is available; no-drift check)

## Auto Run Result

**Summary:** Added the epic's Success signal: android Give-up flow (A), android win by Confirm (B) and desktop Flow 6 keyboard-only move in `e2e/surfaces-success.spec.ts`; moved the Flow 6 helpers to `e2e/helpers/keys.ts`.

**Files changed:**
- `e2e/surfaces-success.spec.ts` (new): the three tests, stored Session synced with `game()` after each step.
- `e2e/helpers/keys.ts` (new): Flow 6 helpers moved from `board-keys.spec.ts` (only `export` added).
- `e2e/board-keys.spec.ts`: imports the helpers.
- `e2e/helpers.spec.ts`: one AD-17 test for `keys.ts`.

**Review:** 2 low patches applied (shared `tray` import; assert the sheet is gone after New game), 0 deferred, rest rejected with reasons in the Triage Log. Follow-up review recommended: false.

**Verification:** `npx biome check e2e` clean; new/affected specs pass; `npm run test:all` exit 0 (909 e2e passed, 13 pwa passed) after the patches. `npm run test:screens` (Docker) was not run; no screenshot spec or baseline was added.

**Residual risks:** Step 6 waits up to 5 s for a real timer tick. Rule-coverage rows for AD-13 reload/overlay, the discriminating win smoke test and A8/bfcache were not grepped (outside or beyond this ticket's direct flows); no gap fixed here.
