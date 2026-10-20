---
title: 'Engine word list and its fixture'
type: 'feature'
ticket: '1'
created: '2026-10-20'
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
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-end-of-game-words/story-engine-word-list-and-its-fixture.md'
baseline_revision: 'd3b76f18ea5a00d7005f744e5e4aa112ec12510c'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** A finished game (won or gaveUp) has no derived list of its committed words (R-86, Q-47); the end sheet and win celebration (entries 2, 3, 5-8) need one, plus a shared won-with-words fixture.

**Approach:** Widen the internal replay pass to carry each committed move's cards and cell, derive `GameView.wordList` from it, export `WordListEntry`, and add `fixtures/session-won-words.json` registered everywhere fixtures are listed. The ticket story file (Description, Acceptance Criteria) is the contract; this plan only adds the build decisions below.

## Boundaries & Constraints

**Always:** Engine stays pure (rule 1). `wordList` key omitted while playing (`'wordList' in view` false), `[]` for won/gaveUp with no word. Order: letterCount desc, then spelling asc by plain code-unit compare (no `localeCompare`), stable so equal entries keep move order. `spelling` is the R-37 lowercase string. Committed prefix only (draft and redo tail excluded). The AD-5 golden-deal test stays green, literals unchanged.

**Never:** Change `CommittedWord`, `longestWord`, history/`GameRecord` shape or the Session shape; export the widened replay type or any new name beyond `WordListEntry` from `index.ts`; edit tickets.toml beyond entry 1's "at least 10" wording.

</intent-contract>

## Code Map

- `src/engine/replay.ts` -- `replayWords` returns `words: readonly CommittedWord[]`; `CommittedWord` stays `{spelling, letterCount}`.
- `src/engine/view.ts` -- `viewFrom` builds the view; add `WordListEntry` and `wordList`; `longestWord` returns fresh `{spelling, letterCount}` objects so history keys are unaffected.
- `src/engine/history.ts` -- consumer of `replayWords` and `longestWord`; must stay unchanged.
- `src/engine/index.ts`, `src/engine/index.test.ts`, `src/architecture-ad2-ad12-ad17.test.ts` -- add `WordListEntry` to the type export, the `expectTypeOf` pins and the AD-2 name list; keep the runtime-key pin.
- `src/engine/view.test.ts` -- home of the R-86 unit tests (inline `Set` dictionaries, `play`/`drop`/`DICT` from `test-helpers.ts`).
- `src/engine/serialize.test.ts` -- `ValidName`, `VALID`, `PROPERTIES`, `REBUILDS` (same index in VALID and REBUILDS), `winSeed` pattern in `src/engine/win-seed.ts`.
- `fixtures/session-won.json` -- sibling fixture; `e2e/helpers/seed.ts` `seedStorage` is the only seeding route (no change needed).

## Tasks & Acceptance

**Execution:**
- [ ] `src/engine/replay.ts` -- add an internal (not exported from `index.ts`) type extending `CommittedWord` with `cards: readonly CardId[]` and `cell: WordCellNumber`; `replayWords` returns it, filled from `word()` cards and `placed(moves[i]).targetCell` -- keeps `CommittedWord` and history unchanged.
- [ ] `src/engine/view.ts` -- export `WordListEntry { readonly spelling: string; readonly letterCount: number; readonly cards: readonly CardId[]; readonly cell: WordCellNumber }`; `GameView.wordList?: readonly WordListEntry[]`, set only when status is won or gaveUp; a new array and new entries per `view()` call, sorted by a stable comparison as in Boundaries.
- [ ] `src/engine/index.ts`, `src/engine/index.test.ts`, `src/architecture-ad2-ad12-ad17.test.ts` -- export and pin `WordListEntry`; register `session-won-words.json` in the architecture fixture name list; make the test title count-free (it says "seventeen", the list holds 19 with the new one).
- [ ] `src/engine/view.test.ts` -- R-86 tests: order, ties (alphabetical vs move order), duplicate (equal entries in move order with different cards and cell), QU (lowercase `qu`, `letterCount` 2, `cards.length` exactly one less than `letterCount`), empty (gaveUp, no word, gives `[]`), a reused card (WordCell top as free letter appears in two entries), draft exclusion (also gaveUp with a pending draft), redo tail excluded, Undo of the finish (playing, key absent; Confirm restores an identical list), absent while playing, fresh array per call, and `gameRecord` key set / `longestWord` shape unchanged by the widening.
- [ ] `fixtures/session-won-words.json` + `src/engine/serialize.test.ts` -- a valid won Session (final move the Confirm of the last word, no redo tail, cursor at end, `gaveUp` false) with: a duplicate word played in two different, non-adjacent cells; a letter-count tie whose pair was played in reverse-alphabetical move order; one long word of exactly 10 letters in WordCell 10 (no QU in it, QU is covered by the unit test); one card shared by two words (a WordCell top reused as a free letter, R-41). Find the seed and partition by search; real words preferred, otherwise inline-dictionary strings (R-37 trusts committed words). Register in `ValidName`, `VALID`, `PROPERTIES` (asserts the literal expected `wordList` via `view(s, EN)` and Undo/Confirm round trip) and `REBUILDS` (scripted drop/validate/confirm with inline dictionaries, as `winSeed`); update the "eighteen" comment/count wording.
- [ ] `_bmad-output/initiative-wordcell-v1/epic-end-of-game-words/tickets.toml` -- entry 1 description: "at least 10" becomes "exactly 10" (the only edit there; the story's ticket file is not touched).

**Acceptance Criteria:**
- Given a won or gaveUp Session, when `view()` runs, then `wordList` holds one entry per committed move ordered as R-86 says, and is absent for playing.
- Given `session-won-words.json`, when parsed and rebuilt, then it round-trips byte for byte and `view` yields the literal expected list including the shared `CardId` in two entries.
- Given the full suite, when `npm run test:all` runs, then it passes (`WordListEntry` listed in index.test.ts and the architecture test).

## Implementation Notes

Fixture generator record: `fixtures/session-won-words.json` is seed 2089, ten moves, rebuilt by the scripted `REBUILDS` entry in `src/engine/serialize.test.ts` (inline dictionary `WON_WORDS_DICTIONARY`; the seed and partition were found by search). Contents: `surf` twice (moves 0 and 2, cells 4 and 3); a 5-letter tie played `nmihz` before `lhvia` (reverse-alphabetical pair); the 10-letter word `ehnpbntfsa` in cell 10 (no QU); a QU word `jdaquye` (6 cards, letterCount 7); cards 0, 13 and 39 each in two words via free letters. Only `surf` is a real word (real words were preferred, not required).

Files: `src/engine/replay.ts` (internal `ReplayWord`), `src/engine/view.ts` (`WordListEntry`, `wordList`), `src/engine/index.ts`, `src/engine/index.test.ts`, `src/architecture-ad2-ad12-ad17.test.ts`, `src/engine/view.test.ts`, `src/engine/serialize.test.ts`, `fixtures/session-won-words.json`, `tickets.toml` (entry 1 "exactly 10").

## Plan Change Log

## Review Triage Log

### 2026-10-20 — Review pass
- verdicts: 16 findings — high 0, medium 0, low 2, false 11, maybe-false 0 (3 rejected as low or not worth fixing, counted below)
- findings:
  - `[low]` `patch` shared-card assertion checks only card 13 (blind-hunter, edge-case) — now asserts the set of cards occurring twice is [0, 13, 39].
  - `[low]` `patch` draft-exclusion test does not assert the cursor (edge-case) — added `cursor` `{index: 1, phase: 'idle'}` check.
  - `[false]` `reject` jdaquye has QU, plan says long word has no QU — the no-QU rule is for the 10-letter word only; the QU word is a bonus.
  - `[false]` `reject` tie is not reverse-alphabetical in move order — the nmihz/lhvia pair is played reversed, which is what the ticket minor asks.
  - `[low]` `reject` duplicate cells 4 and 3 adjacent (blind-hunter, edge-case) — the moves (0 and 2) are non-adjacent and the cells differ; ticket minor satisfied.
  - `[false]` `reject` longestWord claim unverified — `longestWord` already returns fresh `{spelling, letterCount}` and the history key-set test passes.
  - `[false]` `reject` empty plan sections / frontmatter — filled at finalize; review state is this run's.
  - `[false]` `reject` tickets.toml verify line — only the "exactly 10" description edit was asked.
  - `[false]` `reject` brace-less `if` in view.ts, comparator tests, ReplayWord export guard, stable sort test — Biome passes, repo style, AD-2 test pins exports, duplicate test covers stability.
  - `[false]` `reject` intent-alignment divergences (nonsense words, no Playwright) — permitted by the ticket's search caveat; Playwright consumers are entries 5-8.
  - verification-gap: no findings.

## Design Notes

`WordListEntry` uses `readonly cards: readonly CardId[]` and `cell: WordCellNumber`. Resolved ticket minors: long word has no QU; "exactly 10" in tickets.toml; internal replay type extends `CommittedWord` rather than mutating it; history key set asserted unchanged; fixture duplicate in non-adjacent cells and tie pair in reverse-alphabetical move order.

## Verification

**Commands:**
- `npm run lint && npm run check && npm test` -- expected: all pass, unit suite under budget
- `npm run test:all` -- expected: all pass (required before `built`)

## Auto Run Result

- Summary: `GameView.wordList` (R-86) derived from the replay pass via an internal `ReplayWord`; `WordListEntry` exported and pinned; `fixtures/session-won-words.json` (seed 2089) added and registered; ticket minors resolved (see Implementation Notes, Design Notes).
- Files changed: see Implementation Notes.
- Review: 2 patches applied (low: shared-card set assertion, cursor assertion), 0 deferred, rest rejected with reasons in the Review Triage Log.
- Follow-up review recommended: false.
- Verification: `npm run test:all` passed (exit 0) after the patches; lint, check and unit also pass.
- Residual risks: only `surf` is a real word in the fixture; no Playwright spec seeds it yet (entries 5-8).
