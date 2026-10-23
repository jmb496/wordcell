# Epic 10 rule coverage

E = engine Vitest. P6 = Playwright (`android`; `desktop` where noted). U = UI Vitest (`AD-n`, never R-id coverage). S = screenshot spec (container only). The tickets record the test names; the close-out ticket checks that each row has a passing test whose name carries the id. The fixture for the Playwright rows is `fixtures/session-won-words.json` (duplicate word, tie, long word, a shared card). R-87 and R-88 are (UI): every sentence is covered by P6 or named in Exempt.

| Rule sentence / behaviour | Capability | Test kind |
| --- | --- | --- |
| R-86 one entry per committed move: spelling, letter count (QU = 2), cards in word order, placement cell | CAP-1 | E |
| R-86 order: letter count descending, then alphabetical; equal entries in move order | CAP-1 | E |
| R-86 a word played twice has two entries; a reused card appears in each word | CAP-1 | E |
| R-86 a pending draft and the redo tail have no entry; empty when no word | CAP-1 | E |
| R-86 `wordList` absent while playing, present when won or gaveUp; absent again after Undo of the finish | CAP-1 | E |
| R-86 derived by replay, never stored: Session and history shapes and versions unchanged | CAP-1 | E (existing serialize and fixture tests stay green; `index.test.ts` pins) |
| AD-1 scan, AD-2 export list (`WordListEntry`), runtime-key pin | CAP-1 | E (architecture tests) |
| AD-19 `step`: floor bounce, wall exit, determinism, dt clamp, cap, empty list | CAP-2 | U |
| AD-19 `step` (Opus review 2026-10-23): waves overlap in list order (F6); the launch rises then falls; every group bounces on the floor, then leaves past a side edge on the side with more room before the cap (portrait, desktop, landscape); physics and launches scale with the cap (F7); closing fade 1 × base at each speed | CAP-2 | U |
| AD-19 renderer and controller (Opus review 2026-10-23): band from the AD-12 visible band (a shown dictionary banner tops it); container fixed to and clipping the band at DESIGN.md layer order (above the drag layer); rows wider than the band drawn scaled; each group launches from its own WordCell (F8); each copy shows its own letter in word order at the board card height | CAP-2 | U |
| AD-19 copies carry `data-celebration`, no `data-card-id`/`data-testid`/`data-mirror-of`; live card count unchanged | CAP-2 | U, P6 |
| R-87 win by Confirm → celebration → end sheet expanded | CAP-3 | P6 |
| R-87 copies are separate from the board: a card used in two words appears in two groups | CAP-3 | P6 |
| R-87 skip by a press outside the bars (consumed, nothing under it tapped) | CAP-3 | P6 |
| R-87 skip by `Space` and by `Esc` | CAP-3 | P6 `desktop` |
| R-87 skip by back; the app stays open; back again collapses the sheet | CAP-3 | P6 |
| R-87 hide the app mid-run, show: sheet expanded, back and menu still work (`hidePage`/`showPage`); resize ends it | CAP-3 | P6 |
| R-87 `?`, WordCell `Enter` and a WordCell tap do nothing while it runs; `N` and Undo keys act | CAP-3 | P6 `desktop` |
| R-87 a finger held from before the win cannot skip it; a dictionary-banner button is not a skip | CAP-3 | P6 |
| R-87 ☰ ends it, sheet expanded behind the menu; back closes the menu only | CAP-3 | P6 |
| R-87 Undo stops it, no end sheet; New game stops it (Replay is menu or sheet only, which end it first) | CAP-3 | P6 |
| R-87 a Redo that restores the win plays it again | CAP-3 | P6 |
| R-87 none on Give up or on relaunch into a won game; none under emulated reduced motion with the seam enabled | CAP-3 | P6 |
| R-87 cap respected at Fast and Slow (hook clock) | CAP-3 | P6 |
| R-87 hook-free build (`dist-smoke` only): a real win plays, a press skips it, back skips it | CAP-6 | P6 `dist-smoke` |
| Seam default off in hook builds and `dist-test/`; frozen hook now has four keys (`e2e/test-hook.spec.ts`, `e2e/pwa/test-hook.spec.ts`); existing win specs unchanged | CAP-6 | P6 (existing specs plus one default check) |
| R-88 list for won and gaveUp; entries show the word and `n letters` (`1 letter`) | CAP-4 | P6 |
| R-88 order with a duplicate and a tie | CAP-4 | P6 |
| R-88 empty list: `No words were played.` (Give up with no move) | CAP-4 | P6 |
| R-88 latest game only; gone after Undo of the finish, New game, Replay | CAP-4 | P6 |
| R-88 relaunch into a finished game shows it | CAP-4 | P6 |
| R-88 adds nothing stored: Session and history unchanged (localStorage compare) | CAP-4 | P6 |
| AD-3 the list renders only from `view.wordList` | CAP-4 | U |
| DESIGN.md Words section: a 20-letter word shrinks to no less than 14 px and stays on one line beside its count at 360 px (Opus review 2026-10-23) | CAP-4 | P6 |
| Words section at 360 px, Charcoal and one light theme | CAP-4 | S |

## Exempt

- R-86 and R-87 sentences that describe ownership or provenance (for example "drawn from copies, never from live elements" is covered by the copy-count row; the AD-14 wording itself is not a test).
- R-88 `1 letter` from P6: unreachable in a real game (minimum letter count 3, R-36); covered by the `AD-3` Vitest stub in `src/ui/end-sheet.test.ts` (10.2 plan, Opus review 2026-10-23).
- "No trail, no colour change" (R-87, Q-48): visual; checked in the ticket's screenshot or owner review, not an automated assertion.
