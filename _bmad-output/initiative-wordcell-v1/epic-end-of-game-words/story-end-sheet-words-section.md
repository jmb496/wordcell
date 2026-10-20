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

Layout: the section sits below the buttons in the sheet's own scroll, with no inner scroll area; the handle and the bars do not move (AD-11). Rows are at least 44 px, text only and not tappable, add no focusable element (focus on open stays on Replay), and are flex rows (word left, count right, hairline separators) overriding the sheet's centred text. Strings in `text.ts`, labels by role and name; the relaunch, Undo, New game and Replay cases use entry 1's fixture.

Intent (tickets.toml): tests = R-88 rows of rule-coverage.md (P6, U `AD-3`, screens); owns = the Words section markup and its strings; consumers = none.

## Acceptance Criteria

Verify: Playwright on `android`, tests named `R-88 …`, locating with `getByRole('list', {name:'Words', exact:true})` and `getByRole('listitem', {name, exact:true})`:

- Won: `fixtures/session-won-words.json` via `seedStorage` (`openFixture`) lists these rows verbatim in the test, in order: `EHNPBNTFSA, 10 letters`; `JDAQUYE, 7 letters` (QU = 2); `EIOGKD, 6 letters`; `TMXRWO, 6 letters`; `AECCP, 5 letters`; `LHVIA, 5 letters`; `NMIHZ, 5 letters` (tie alphabetical); `LTOS, 4 letters`; `SURF, 4 letters` twice. Expected values are `WON_WORDS_LIST` in `src/engine/serialize.test.ts`.
- Give-up with words: no new fixture; the spec builds a `{ literal }` session (`openFixture`) from the same file with the last move dropped (`moves.slice(0, 9)`, `cursor.index` 9) and `gaveUp` true (unverified: that it parses; the test fails fast if not), listing the other nine rows. Zero-move give-up: a fresh deal plus Give up shows the heading and `No words were played.` and the `list` role count is 0.
- Layout: every row's `boundingBox` height is >= 44; with a long list the sheet content scrolls while the handle and bars keep their boxes and the list has no scroll container of its own; at 360 px `scrollWidth <= clientWidth` with the 10-letter word.
- `localStorage`: snapshot the `wordcell:*` keys once the expanded sheet is shown and again after scrolling the list and collapsing and expanding the sheet; the strings are equal.
- Reload shows the same list in the same order, for both outcomes.
- Undo of the finish, New game and Replay (through its confirm if one shows) each leave the `Words` list role count 0 (auto-waiting: the exit transition keeps it mounted briefly); a second finish afterwards shows the new list, not a stale one.
- Vitest `AD-3 …` in `src/ui/end-sheet.test.ts`: render the section from a stubbed `GameView` whose `wordList` differs from what the Session would replay to; the rows equal the stub. The section binds to EndSheet's `result` snapshot (not the live `view`), so the exit keeps its text after Undo; `wordList` undefined on a won or gaveUp view is a bug (AGENTS.md rule 6) and never takes the empty branch; only `[]` shows the empty line.
- `npm run test:screens`, in `e2e/end-sheet.screens.spec.ts`: the expanded sheet with a populated list at 360 px in Charcoal (default) and in Daylight Paper (`prefs-theme-paper`, as `e2e/theme-paper.screens.spec.ts` uses).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-end-of-game-words/epic-end-of-game-words.md
- design — EXPERIENCE.md End sheet, Message catalogue; DESIGN.md Words section
- code — src/ui/EndSheet.svelte, src/ui/text.ts, src/ui/end-sheet.test.ts
