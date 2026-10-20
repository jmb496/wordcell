---
title: 'End-sheet Words section'
type: 'feature'
ticket: 'story-end-sheet-words-section'
created: '2026-10-20'
status: 'built'
baseline_revision: '1190a6ff78335905c38dd0fea8bdae0c71ec98d8'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context: ['{project-root}/_bmad-output/initiative-wordcell-v1/epic-end-of-game-words/story-end-sheet-words-section.md', '{project-root}/_bmad-output/initiative-wordcell-v1/epic-end-of-game-words/story-end-sheet-words-section.review-log.md']
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** After a win or give-up the end sheet shows a score, a band and one longest word, not the words played (R-88). `view.wordList` (R-86, entry 1) exists but nothing renders it.

**Approach:** Render a Words section as the last block of the expanded `EndSheet.svelte` content from `view.wordList`, with strings in `text.ts`, and cover it with Playwright `R-88` tests, a Vitest `AD-3` test and two screenshot baselines. The story file is the requirement source (Description and Acceptance Criteria); this plan does not restate them.

## Boundaries & Constraints

**Always:** Follow the story's markup (`ul` labelled by an `h3`, `li` with one `text.wordRow` aria-label, visible spans `aria-hidden`, count from `letterCount`, uppercase in JS). Section scrolls with the sheet's `.content`, adds no focusable element, leaves focus on Replay. `wordList` undefined on won/gaveUp throws an Error naming AD-3 (rule 6). Rows are read from EndSheet's existing `result` (live `view` while open, retained `shown` on exit). Tests are named `R-88 …`, `AD-3 …`, `AD-17 end sheet screenshot …`.

**Never:** Touch the engine, `deal.ts`, fixtures, `SESSION_VERSION`. No inner scroll area, no CSS uppercase, no new `data-testid`, no re-deriving the list in the UI. Do not commit screenshot baselines generated on the host; generate them only in the container (`npm run test:screens`).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Won list | `session-won-words` | ten rows in R-86 order, SURF twice | No error expected |
| Give-up with words | `{literal}` from the fixture, 9 moves, gaveUp | nine rows, EHNPBNTFSA absent | Test fails fast if the literal does not parse |
| Zero-move give-up | fresh deal, Give up | heading + `No words were played.`, no `list` | No error expected |
| `wordList` undefined, finished | stubbed view | section throws Error naming AD-3 | Never the empty branch |
| `letterCount` 1 | stubbed entry | `1 letter` | Unit-only (see Notes) |

</intent-contract>

## Code Map

- `src/ui/EndSheet.svelte` -- add the section after `.actions` inside `.content`; styles scoped here (`.words`, flex rows, hairline, left-aligned heading/empty line like `.penalty`); reads `result.wordList`.
- `src/ui/text.ts` -- add `wordRow(spelling, n)` using the module-local `letters` (line 14); heading `Words` and `No words were played.` strings.
- `src/ui/end-sheet.test.ts` -- add `AD-3` render tests (stubbed view differing from replay, undefined throws, `[]` empty, `letterCount` 1).
- `e2e/end-sheet.spec.ts`, `e2e/helpers/` -- `R-88` Playwright tests; `openFixture(..., { endSheet: 'expanded' })`, `seedStorage`, `stored`.
- `e2e/end-sheet.screens.spec.ts` -- two `AD-17` tests (Charcoal, `prefs-theme-paper`).
- `src/engine/view.ts` `WordListEntry`, `fixtures/session-won-words.json`, `WON_WORDS_LIST` in `src/engine/serialize.test.ts` -- read-only.

## Tasks & Acceptance

**Execution:**
- [x] `src/ui/text.ts` -- add `wordRow` and the two strings -- AD-3/text.ts single owner of strings
- [x] `src/ui/EndSheet.svelte` -- Words section markup and styles -- R-88
- [x] `src/ui/end-sheet.test.ts` -- AD-3 tests -- section renders only from `view.wordList`
- [x] `e2e/end-sheet.spec.ts` -- R-88 tests per the story ACs (won, give-up literal, zero-move, layout, localStorage, collapse/expand, reload, Undo/New game/Replay) -- (UI) sentences are Playwright
- [x] `e2e/end-sheet.screens.spec.ts` -- two screenshots; baselines via `npm run test:screens` only -- AD-17

**Acceptance Criteria:**
- Given the story's Acceptance Criteria, when `npm run test:all` runs, then it passes with the new tests, and `npm run test:screens` has the two new baselines.

## Implementation Notes

Route full: markup, strings, three test files exceed 100 lines. Owner-requested close-out of the review log's unapplied minors:
1. `1 letter` is covered by the `AD-3` Vitest stub only (unreachable in a real game, min word 3). rule-coverage.md assigns that row to P6: it is exempt from P6 (min word 3). Record it in the close-out/exempt list.
2. The story's AD-3 bullet wording "binds to `result` snapshot" is superseded here: the section reads EndSheet's existing `result` (live `view` while open, retained `shown` on exit).
3. Residual risks: the session byte-equality check assumes the app does not rewrite `wordcell:session` while the sheet is open (it fails fast if wrong); the nine-row give-up literal parsing is unverified until the test runs.

## Plan Change Log

## Review Triage Log

### 2026-10-20 — Review pass
- verdicts: 24 findings — high 0, medium 0, low 4, false 20, maybe-false 0
- findings:
  - `[low]` `[patch]` reload test title says "both outcomes" but covers won only — renamed to "the won list survives a reload" (give-up reload is its own test).
  - `[low]` `[patch]` centre check used `?? 100` fallbacks (rule 6) — now asserts two spans and compares both centres.
  - `[low]` `[patch]` 44 px loop covered every page listitem — scoped to the Words list.
  - `[low]` `[reject]` `wordsOf` called twice — `{@const}` is invalid directly in `<section>` (svelte-check error); trivial cost, left as is.
  - `[false]` `[reject]` unkeyed `{#each}`, `.content` strict-mode clash, QU coverage, h3 hierarchy, aria-label on listitem, desktop/keyboard coverage, exit-transition, screenshot flake, Undo loop brittleness, stub shape, plan-file bookkeeping, collapsed-bar scope, tie ordering, relaunch meaning, baselines origin (generated in container per implementer), top of sheet not in frames — lint, check and all tests pass; each is a style preference, covered by the story's ACs, or outside the intent (QU: JDAQUYE 7 letters asserted in the won rows; `1 letter` is AD-3 unit only).
  - Verification-gap lens: no gaps.

## Design Notes

Row: `<li aria-label={text.wordRow(spelling, letterCount)}><span aria-hidden>{WORD}</span><span aria-hidden>{n letters}</span></li>`; the visible count span uses the same `letters` output so there is one source.

## Verification

**Commands:**
- `npm run lint && npm run check && npm test` -- expected: pass
- `npm run test:all` -- expected: pass
- `npm run test:screens` -- expected: new baselines generated, then compare clean

## Auto Run Result

**Summary:** End-sheet Words section built per the story: `text.ts` strings, `EndSheet.svelte` section (ul/li with aria-labels, empty line, AD-3 throw), AD-3 Vitest tests, ten `R-88` android Playwright tests, two screenshot tests with four container-generated baselines.

**Files:** `src/ui/text.ts` (strings); `src/ui/EndSheet.svelte` (section and styles); `src/ui/end-sheet.test.ts` (AD-3); `e2e/end-sheet.spec.ts` (R-88); `e2e/end-sheet.screens.spec.ts` + 4 PNGs.

**Review:** 3 low patches applied (test title, centre-check fallback, 44 px scope); 1 low rejected; rest false. Follow-up review recommended: false.

**Owner-requested minors:** (1) `1 letter` is covered by the AD-3 Vitest stub only; it is exempt from P6 (min word 3) although rule-coverage.md assigns the row to P6. (2) AD-3 wording applied: the section reads EndSheet's existing `result` (live `view` while open, retained `shown` on exit). (3) Residual risks resolved by running: the session byte-equality check and the nine-row give-up literal both passed.

**Verification:** `npm run lint`, `check`, unit (3052 pass) pass. `npm run test:all`: one failure, `[desktop] board-keys Q-24 Composing focuses…` (unrelated to this change), which passed on rerun alone with and without this diff, so it is flaky under load. Screenshot baselines were written in the container but not compare-run in a second pass.

**Residual risks:** the four PNG baselines were not visually reviewed; the unrelated board-keys flake.
