---
id: 2
type: story
title: "End-sheet Words section"
parent: epic-end-of-game-words
covers: [CAP-4]
after: [1]
risk: low
---

# End-sheet Words section

## Description

Renders the Words section below the end-sheet buttons from `view.wordList` for won and gaveUp, as the last block of the expanded sheet only (SPEC CAP-4, DESIGN.md Words section): a `ul` named by an `h3` `Words` heading (`aria-labelledby`), one `li` per entry whose `aria-label` is built by one `text.ts` function, e.g. `BAKED, 5 letters`: the word uppercased in JS (never CSS), the count from `entry.letterCount` (never `cards.length`; QU = 2) through the existing `letters` helper so `1 letter` is not duplicated. The visible word and count spans are `aria-hidden`. With an empty `wordList` the heading and a plain `p` `No words were played.` render and no `list` element exists.

Layout: the section sits below the buttons in the sheet's own scroll, with no inner scroll area; the handle and the bars do not move (AD-11). Rows are at least 44 px, text only and not tappable, add no focusable element (focus on open stays on Replay), and are flex rows (word left, count right, hairline separators) overriding the sheet's centred text; the heading and empty-state `p` are left-aligned like `.penalty` and `.unreadable`. Row styling (DESIGN.md Words section): word ui-body ink-primary with `overflow-wrap: anywhere`, shrinking to 14 px before it wraps; count ui-label ink-secondary, `flex: none`; heading ui-label ink-secondary; empty line ui-body ink-secondary; word and count on one line at 360 px. Strings in `text.ts` (the new function, e.g. `text.wordRow(spelling, n)`, calls the module-local `letters`; components import only `text`), labels by role and name; the relaunch, Undo, New game and Replay cases use entry 1's fixture.

Intent (tickets.toml): tests = R-88 rows of rule-coverage.md (P6, U `AD-3`, screens); owns = the Words section markup and its strings; consumers = none.

## Acceptance Criteria

Verify: Playwright functional tests on `android` named `R-88 …`, Vitest `AD-3 …`, screenshots per the screens convention (`AD-17 …`). Locate with `getByRole('list', {name:'Words', exact:true})` and `getByRole('listitem', {name, exact:true})`. Every test that needs the list opens the sheet explicitly: `openFixture(page, 'session-won-words', { endSheet: 'expanded' })` (the helper default is collapsed), the same option for the `{ literal }` give-up, `{ prefs: 'prefs-theme-paper', endSheet: 'expanded' }` for Paper.

- Won: `fixtures/session-won-words.json` via `seedStorage` (`openFixture`) lists these rows verbatim in the test, in order, read as `list.getByRole('listitem').evaluateAll(els => els.map(e => e.getAttribute('aria-label')))` and `expect(...).toEqual([...ten strings])`: `EHNPBNTFSA, 10 letters`; `JDAQUYE, 7 letters` (QU = 2); `EIOGKD, 6 letters`; `TMXRWO, 6 letters`; `AECCP, 5 letters`; `LHVIA, 5 letters`; `NMIHZ, 5 letters` (tie alphabetical); `LTOS, 4 letters`; `SURF, 4 letters` twice. The SURF duplicate is a count of 2 only (equal-entry move order stays with the engine R-86 test); the by-name locators serve presence and count. Expected values are `WON_WORDS_LIST` in `src/engine/serialize.test.ts`.
- Give-up with words: no new fixture; the spec builds a `{ literal }` session (`openFixture`) from the same file with the last move dropped (`moves.slice(0, 9)`, `cursor.index` 9; `cursor.phase` stays `idle` as in the fixture) and `gaveUp` true (unverified: that it parses; the test fails fast if not). The dropped row `EHNPBNTFSA, 10 letters` is absent and the nine rows are, in order: `JDAQUYE, 7 letters`; `EIOGKD, 6 letters`; `TMXRWO, 6 letters`; `AECCP, 5 letters`; `LHVIA, 5 letters`; `NMIHZ, 5 letters`; `LTOS, 4 letters`; `SURF, 4 letters` twice (JDAQUYE first; unverified that dropping move 10 leaves exactly these, the test fails fast otherwise).
- Zero-move give-up: a fresh deal plus Give up from the menu (menu button, then `Give up`) shows the heading and `No words were played.`, and `getByRole('list', {name:'Words', exact:true})` has count 0.
- Layout (android viewport; shrink to height 480 if `.content` does not overflow): precondition `.content` `scrollHeight > clientHeight`; then scroll `.content` (`scrollTop > 0`) and assert the `boundingBox` of the 'Collapse result' handle, top bar and action bar are unchanged before vs after; the `ul` computed `overflow-y` is `visible`; every row's `boundingBox` height >= 44; at 360 px `scrollWidth <= clientWidth` on `.content` and on each `li` with the 10-letter word, and the `EHNPBNTFSA` row's word and count share one line (vertical centres within 2 px).
- `localStorage`: snapshot the `wordcell:*` keys once the expanded sheet is shown and again after scrolling the sheet and collapsing and expanding it; the strings are equal, in the `session-won-words` run the session snapshot equals the seeded fixture text (`seedStorage` stores it verbatim), in the `{ literal }` give-up run only before equals after, and `wordcell:history` and `wordcell:prefs` are seeded or absent as seeded.
- Collapse and expand: after collapse the Words list count is 0; after re-expand it is present with the same rows.
- Reload: `page.reload()` shows the expanded dialog again (the seeding is guarded by `sessionStorage` in `e2e/helpers/seed.ts`, so the reload keeps the stored session) with the same list in the same order, for both outcomes.
- Undo of the finish, New game and Replay (a finished game is not `inProgress`, so `requestReplay` acts at once, no confirm) each leave the `Words` list count 0 (auto-waiting: the exit transition keeps it mounted briefly). Stale check: after Undo, Give up, and assert the rows are now the different (gave-up) list; New game and Replay each assert list count 0.
- Vitest `AD-3 …` in `src/ui/end-sheet.test.ts`: render the section from a stubbed `GameView` whose `wordList` differs from what the Session would replay to; the rows equal the stub. A stub with `wordList` undefined and status won or gaveUp makes the section throw an Error naming AD-3 (as `unreadableReason` does with its `AD-13` message), never the empty branch (AGENTS.md rule 6); a stub with `wordList: []` renders the heading and `No words were played.` and no `ul`; a stub entry with `letterCount` 1 renders `1 letter` (unreachable in a real game, min word 3). The section binds to EndSheet's `result` snapshot (not the live `view`); that snapshot retention on exit is existing EndSheet code (`result`/`shown`) this ticket keeps, not separately tested.
- `npm run test:screens`, in `e2e/end-sheet.screens.spec.ts` (tests named `AD-17 end sheet screenshot …`): the expanded sheet with a populated list at 360 px, Words heading scrolled into frame (or `.content` scrolled to the bottom) before `toHaveScreenshot`, in Charcoal (default; `end-sheet-words.png`) and in Daylight Paper (`prefs-theme-paper`, as `e2e/theme-paper.screens.spec.ts` uses; `end-sheet-words-paper.png`).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-end-of-game-words/epic-end-of-game-words.md
- design — EXPERIENCE.md End sheet, Message catalogue; DESIGN.md Words section
- code — src/ui/EndSheet.svelte, src/ui/text.ts, src/ui/end-sheet.test.ts
