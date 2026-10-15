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

Wires `finished`/`unfinished` from DispatchResult to overlays and builds the end sheet: a win by Confirm or Redo opens it after the commit animation settles (one cancelable deferred-open token), Give up opens it at once, a relaunch with status won or gaveUp opens the Board in Game over expanded with no animation (nav push at boot for its one entry); it shows the title (`Every column cleared.` or `Game given up.` with the penalty line only for Give up, `n letters left: −p`, `1 letter left: −10` for one, a lone QU counting 2 so plural, U+2212; n and p only from the view's lettersLeft and penalty; all strings from text.ts, EXPERIENCE.md Message catalogue), final score after R-81, band name and message (EXPERIENCE.md Rating bands the sole string source in text.ts, keyed by the view's band, no threshold logic in the UI), longest word (`—` with none; spelling uppercase, QU as `QU`; ties to the earliest committed word, R-84) and words placed (both from the view, AD-3), with Replay this deal (first action, focused on open) and Statistics buttons (Replay closes the sheet, pops its entry, awaits the popstate, then calls the store's replay and `resetForNewSession`; Statistics opens through `openSurface` and back returns to the expanded sheet; New game stays the action bar primary; Replay from the sheet acts at once in a finished game); grab handle, Esc, back and scrim tap (the scrim covers the board between the bars) collapse it to its bar (the scrim tap consumed), the bar expands it, expansion owns one history entry; the top bar and action bar stay above the scrim; a transition into Game over closes any open WordCell view first, the open going through `openSurface(id)` which closes any WordCell view, sticky or peek, and waits for its pop (SPEC F8); Undo closes the sheet and resumes play, and Undo from Game over with the sheet collapsed sets it hidden with no pop; focus moves to its first action on open and back to the board on collapse (CAP-10 target; the refs name no interim target, so the build plan picks one and reports it), a relaunch moving no focus.

States and history: hidden, expanded (one entry, wc 1 over the base) and collapsed (no entry, no scrim, the bar over the empty tray band above the WordCell labels so WordCells stay tappable). Open pushes (expanded); collapse by back, Esc, handle or scrim pops that one entry (`closedByBack` sets collapsed, never hidden); expand pushes; Undo from expanded pops its entry and the popstate completes before anything follows, ending hidden; Undo from collapsed sets hidden with no pop; boot replaces the base with `{ wc: 0, launch: new }` and pushes the sheet entry, so `history.state` is `{ wc: 1, launch: new }` after boot, `{ wc: 0, launch }` after collapse and `{ wc: 1, launch }` after re-expand (AD-13, AD-16, SPEC CAP-4). Redo after an undone Give up does not reopen the sheet (R-75, Give up is not redoable); Redo to a win reopens it. Live controls per the build-notes per-surface table: expanded, board inert, top bar live, keys M, N, ?, Z, Y, Esc; collapsed, board live, same keys. 6.6 wires the deferred open and its cancel API; the token is killed by boot and `resetForNewSession`; Undo-cancel, the max(settled, 300 ms) floor and consumed inputs in the guard window are entry 12's (build-notes Winning-guard section).

Risk: high. Interface: `overlays.svelte.ts` wires the endSheet deferred open and cancel; new `src/ui/EndSheet.svelte`; `text.ts` band and outcome strings; `game.dispatch`'s DispatchResult read in the UI. Tests: R-62 end sheet on win, discriminating win smoke test (P6); R-75 Give up opens it, Undo closes it, also collapsed (P6); R-73 relaunch expanded, no animation (P6); R-81 penalty line incl. QU (P6); R-83 score, band, message (P6); R-84 longest word, words placed (P6); AD-13 end-sheet entry (U, P6). Owns: the end sheet, the deferred-open token. Consumers: the deferred open sits beside the AD-14 winning guard (entry 12) and the existing Confirm/Redo flyToCell wiring.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green (screens specs the ticket adds listed per build-notes) with Playwright on android covering a win via `fixtures/session-won.json`, a Give up from the menu (opening at once) and one with a QU left, a Redo win opening the sheet, relaunch into won and gaveUp with the sheet expanded and no animation (`document.getAnimations()` empty and the sheet in its final position at first paint), Esc, grab handle and scrim tap each collapsing (scrim tap consumed) and back collapsing, collapse/expand and the `history.state` values above, top bar and action bar usable above the scrim, focus on open (Replay this deal) and on collapse, WordCells viewable while collapsed, a WordCell view closed before the sheet opens, Undo from the expanded and from the collapsed sheet for won and gaveUp (a give-up at index 0 included; collapsed: no history pop), Redo after an undone Give up not reopening it, Replay this deal from it, the singular `1 letter left: −10`, the longest-word `—` case and words placed; Vitest on the pure band function at 158/159, 264/265, 377/378, 468/469, 529/530 and a negative final score (U+2212, lowest band, no clamp), with fixtures covering the six bands; the discriminating win smoke test (after a win by Confirm the end sheet shows the win title and the final score equals the pre-win score plus the committed delta; a give-up would show the penalty line).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (CAP-4), Decisions
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns, Keyboard, State Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components
- spec — _bmad-output/specs/spec-epic-6-surfaces/build-notes.md and rule-coverage.md

## Notes

- Open question: Which fixtures reach the six bands and the longest-word `—` case; the ticket scripts any missing one under the epic 3 regeneration rule (_bmad-output/initiative-wordcell-v1/epic-app-shell/story-engine-carry-ins-and-d1-export-removal.md, Fixture regeneration).
- Out of scope: entry 7 (history-unreadable block, Reset history, Game-over reload with history-invalid-*) and entry 12 (guard half).
