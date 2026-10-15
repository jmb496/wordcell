---
id: 6
type: story
title: "End sheet: result, collapse, Give up and relaunch"
parent: epic-game-surfaces-and-keyboard
covers: [CAP-4]
after: [3, 5]
risk: high
---

# End sheet: result, collapse, Give up and relaunch

## Description

Wires `finished`/`unfinished` from DispatchResult to overlays and builds the end sheet: a win by Confirm or Redo opens it after the commit animation settles (one cancelable deferred-open token whose callback re-checks the store and pushes only if status is still won, AD-13), Give up opens it at once, a relaunch with status won or gaveUp opens the Board in Game over expanded with no animation; it shows the title (`Every column cleared.` or `Game given up.` with the penalty line only for Give up (after the stat lines, DESIGN.md End screen), `n letters left: −p`, `1 letter left: −10` for one, a lone QU counting 2 so plural, U+2212; n and p from the view's lettersLeft and penalty; strings from text.ts, EXPERIENCE.md Message catalogue), final score after R-81, band name and message (EXPERIENCE.md Rating bands, keyed by the view's band, no threshold logic in the UI), longest word (`—` with none; spelling uppercase, QU as `QU`; ties to the earliest committed word, R-84) and words placed (both from the view, AD-3), with Replay this deal (first action, focused on open) and Statistics buttons (New game (primary, `N`, menu) and Replay (sheet button, menu) from a shown sheet call the store then `resetForNewSession()` and end hidden, the expanded entry gone and a collapsed sheet popping nothing; Statistics opens through `openSurface` and back returns to the expanded sheet); grab handle, Esc, back and scrim tap (the scrim covers the board between the bars) collapse it to its bar (the scrim tap consumed), the bar expands it, expansion owns one history entry; top bar and action bar stay above the scrim; a transition into Game over closes any open WordCell view first, the open going through `openSurface(id)` which closes any WordCell view, sticky or peek, and waits for its pop (SPEC F8); Undo closes the sheet and resumes play, and Undo from Game over with the sheet collapsed sets it hidden with no pop; focus moves to its first action on open and back to the board on collapse (EXPERIENCE.md Focus: the bottom card of the lowest-numbered non-empty column, or the focusable board container when every column is empty, as after a win), a relaunch included.

States and history: hidden, expanded (one entry, wc 1 over the base) and collapsed (no entry, no scrim, the 56 px score-and-band bar over the empty tray band above the WordCell labels so WordCells stay tappable). Open pushes (expanded); collapse by back, Esc, handle or scrim pops that one entry (`closedByBack` sets collapsed, never hidden); expand pushes; Undo from expanded pops its entry and the popstate completes before anything follows, ending hidden; Undo from collapsed sets hidden with no pop; boot replaces the base with `{ wc: 0, launch: new }` and pushes the sheet entry, so `history.state` is `{ wc: 1, launch: new }` after boot, `{ wc: 0, launch }` after collapse and `{ wc: 1, launch }` after re-expand (AD-13, AD-16, SPEC CAP-4). Redo after an undone Give up does not reopen the sheet (R-75, Give up is not redoable); Redo to a win reopens it. Live controls per the build-notes per-surface table: expanded, board inert, top bar live, keys M, N, ?, Z, Y, Esc; collapsed, board live, same keys. 6.6 wires the deferred open and its cancel API; the token is killed by boot and `resetForNewSession`; Undo-cancel, the 300 ms floor and consumed guard-window inputs are entry 12's (build-notes Winning-guard section).

Risk: high. Interface: `overlays.svelte.ts` wires the endSheet deferred open and cancel; new `src/ui/EndSheet.svelte`; `text.ts` band and outcome strings; `game.dispatch`'s DispatchResult read in the UI. Tests: R-62 end sheet on win, discriminating win smoke test (P6); R-75 Give up opens it, Undo closes it, also collapsed (P6); R-73 relaunch expanded, no animation (P6); R-81 penalty line incl. QU (P6); R-83 score, band, message (P6); R-84 longest word, words placed (P6); AD-13 end-sheet entry (U, P6). Owns: the end sheet, the deferred-open token. Consumers: the deferred open sits beside the AD-14 winning guard (entry 12) and the existing Confirm/Redo flyToCell wiring.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with Playwright on android covering a win by Confirm via a one-move-from-won fixture (none exists; the ticket scripts it under the regeneration rule), `fixtures/session-won.json` for relaunch and Undo-from-won, a Give up from the menu (opening at once) and one with a QU left, a Redo win opening the sheet, New game and Replay from the expanded and the collapsed sheet (`history.state`, sheet hidden), relaunch into won and gaveUp with the sheet expanded and no animation (`document.getAnimations()` empty, final position at first paint), Esc, grab handle and scrim tap each collapsing (scrim tap consumed) and back collapsing, collapse/expand and the `history.state` values above, top bar and action bar usable above the scrim, focus on open (Replay this deal, relaunch included) and on collapse, WordCells viewable while collapsed, a WordCell view closed before the sheet opens, Undo from the expanded and from the collapsed sheet for won and gaveUp (a give-up at index 0 included; collapsed: no pop), Redo after an undone Give up not reopening it, Replay this deal from it, the singular `1 letter left: −10`, the `—` case and words placed; a unit test of the token callback with the store non-won before it runs, pushing nothing; engine `band` boundaries (158/159 … 529/530, negative score with U+2212, lowest band, no clamp) are already covered by `R-83 EN bands at each boundary and for a negative score` in `src/engine/scoring.test.ts` (add only a missing one), the UI test only mapping band to its text.ts string (AD id), with fixtures covering the six bands (Perfect Deck 530: if no replay-valid fixture reaches 530, a view-level unit test covers it); the discriminating win smoke test (after a win by Confirm the end sheet shows the win title and the final score equals the pre-win score plus the committed delta).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (CAP-4), Decisions
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns, Keyboard, State Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components
- spec — _bmad-output/specs/spec-epic-6-surfaces/build-notes.md and rule-coverage.md

## Notes

- Open question: Which fixtures reach the six bands and the longest-word `—` case; the ticket scripts any missing one under the epic 3 regeneration rule (_bmad-output/initiative-wordcell-v1/epic-app-shell/story-engine-carry-ins-and-d1-export-removal.md, Fixture regeneration).
- Out of scope: entry 7 (history-unreadable block, Reset history, Game-over reload with history-invalid-*) and entry 12 (guard half).
