---
id: 13
type: story
title: "Screen-reader labels and live region"
parent: epic-game-surfaces-and-keyboard
covers: [CAP-11]
after: [11]
risk: medium
---

# Screen-reader labels and live region

## Description

Names every card, WordCell and control for screen readers, moves the `WordCellRow` aria-label into `text.ts` and adds one polite live region in the UI. Every string is a `text.ts` entry (AGENTS catalogue rule); no component builds a string or holds an inline `aria-label` for these. Counts: `1 card` / `N cards`, `1 letter` / `N letters` (existing `letters`; QU counts 2; a Composing word is never empty).

**Labels.** A live element carries the name; a mirror (`data-mirror-of`, `aria-hidden`) never does. In a WordCell only the top live card is a named button, and only in a non-used cell (a used cell's top is a `used` mirror, so only the group is named); every other cell card gets `aria-hidden="true"` and no `role`. Other cards get `role="button"`; the WordCell stays the existing `role="group"`.

| Place | Template | Example |
|---|---|---|
| Column card | `{L}, column {c}, card {i} of {n}{, selected}{, destination}` (i from the top) | `E, column 1, card 2 of 5, selected` |
| Tray tile | `{L}, tray, tile {i} of {n}{, selected}` (`i` and `n` count live named tiles only, left to right; mirrors are skipped) | strip `[A live, F mirror, E live]`: `E, tray, tile 2 of 2` |
| WordCell top card | `{L}, WordCell {c}, top` | `L, WordCell 6, top` |
| WordCell | `WordCell {c}, top {L}, {n card(s)}{, used}` (`1 card` / `N cards`) | `WordCell 6, top L, 4 cards, used`; `WordCell 4, top T, 1 card`; `WordCell 5, top Q U, counts as two letters, 2 cards, used` |
| Empty WordCell | `WordCell {c}, empty` | `WordCell 3, empty` |
| Column foot | `Column {c} foot` (the source foot reads `Column {c}, here` only while a tap selection exists) | `Column 3 foot` |

`{L}` for QU is `Q U, counts as two letters` on a card name and on a WordCell whose top card is QU; in word strings QU is spelled `QU` and counts 2 in `N letters`.

| State | Reads (AD-3) |
|---|---|
| `selected` | exactly the overlays tail selection (every card of the picked tail) and tile selection (the tray tile); a drag adds nothing |
| `used` | `CellView.used` |
| `destination` | column cards in `draft.destination` (Composing) only; D-block tray copies are mirrors and carry no name. |

Join order is `selected, destination`.

The `−`, `+` and `Flip` names follow epic 5 F9 (visible text `−`, `+`, `Flip`; glyph `aria-hidden`): `text.minus` and `text.plus` are the button names, `Flip` is `text.flip` with `text.flipGlyph` `aria-hidden` (already so in `src/ui/tray/ControlRow.svelte`). The `WordCellRow.svelte` aria-label `WordCell {cell.cell}` (line 60) becomes the `text.ts` WordCell template above; an AD-3 check asserts no inline `aria-label` string remains in `WordCellRow.svelte`, `Column.svelte`, `Card.svelte`, `Tray.svelte` or `src/ui/tray/*`.

**Delta wording.** `plus N`, `minus N` (the word, not U+2212), `no change` for 0.

**Live region.** One element mounted in `App.svelte`'s active branch as a sibling of the `main` that holds the Board, outside every inert wrapper and outside `Tray.svelte` (`pending-draft.test.ts` bars `aria-live` there), `role="status"` `aria-live="polite"`, visually hidden (clipped, absolutely positioned; not `display: none` or `visibility: hidden`) and out of layout (baselines unchanged). Announcements replace, never queue. Silent: relaunch into a stored session, relaunch into Game over (the sheet opens at boot), re-expanding a collapsed sheet, and a return from hidden or `pageshow`. Every announce clears at once, cancels any pending rAF (latest wins) and sets in the next `requestAnimationFrame`, so a repeated identical string is still announced; the outcome is queued behind a pending commit set (runs in the frame after it, never cancels it; settle may run in the commit's own task), so a winning Confirm or Redo yields commit, then outcome; latest wins for every other pair.

**Announcer.** One module, `src/ui/announce.ts`, exports `dispatchAnnounced(command): DispatchResult`. It replaces `game.dispatch` at every call site (`src/ui/commands.ts`, the three in `src/ui/gestures/controller.ts`, `Menu.svelte` Give up), It reads `game.view` before and after, builds at most one string and sets it once (a missing `draft.word`, `place.target` or `place.scoreDelta` throws to AD-15, like `end-sheet.ts` `field()`). New game and Replay bypass `dispatch` (AD-4): the UI handlers `newGame()` and `replayDeal()` in `src/ui/new-game.ts` call `announceReset(prefix)` after the store call returns.

| Trigger | Text |
|---|---|
| Phase changes (not Undo/Redo/commit) | Composing: `Composing. {WORD}, {N letters}.`; Place: `Place. {WORD}, {N letters}.`; Idle: `Idle.` (WORD and count from `draft.word`, `draft.letterCount`) |
| Invalid word | `text.invalidWord(word)` (`{WORD} isn't in the word list.`), set from `DispatchResult.rejectedWord` |
| Commit (Confirm, or a Redo that commits) | `{WORD} placed on cell {c}, {delta}` |
| Undo | `Undo. {resulting phase text}`, whenever the session reference changed |
| Redo (not committing) | `Redo. {resulting phase text}`, same condition |
| New game | `New game. Idle.` |
| Replay (the action) | `Replay. Idle.` |
| End outcome (Confirm win, Redo win or Give up; only when the sheet really opens) | `text.srOutcome(title, score, band)` |

Resulting phase text is the phase row's string. Word edits inside Composing (`+`, `−`, Flip, free letters, arranging) change no phase and are silent. Give up sets no announcer string; only the outcome announces. A dispatch with the same reference announces nothing; for the phase-change and commit triggers an unchanged `wordCount` and phase also announces nothing (Undo/Redo are exempt from the second test); the invalid-word row is exempt (Validate with the same word twice announces twice).

**Commit trigger.** A commit is a Confirm, or a Redo from Place (R-71: the only Redo that commits), whose `wordCount` after exceeds the one before. The post-dispatch view is Idle and has no `place`, so word, cell and delta come from the PRE-dispatch view, the same committed move seen before apply.

**Outcome trigger.** `srOutcome` is a new `text.ts` entry reusing only the title and `text.bandName` content (not `endBar`, whose "Show result: …" prefix is wrong here): `{title} Score {score}, {band}.` with a negative score read `minus N` (never U+2212): `Every column cleared. Score 118, Wordsmith.` It is a separate, later set: `src/ui/end-sheet.ts` `onDispatched` calls `announceOutcome()` at its two `openDeferred` calls (win after the animation settles, Give up at once), a later frame than the commit text. `openDeferred` returns early on a dead token (e.g. Undo between settle and open, CAP-5), and then no outcome is announced; the call is made only when the sheet really opens. `openAtBoot` and sheet expand do not call it.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green.

- UI Vitest, one `AD-3` case per string family: card, tray tile, foot, source foot (`Column {c}, here`) and WordCell templates (QU with `used`, empty, singular, `selected, destination` order), delta `plus` / `minus` / `no change`, plural forms, phase strings (Composing, Place, Idle), a same-reference dispatch announces nothing, Undo staying in Composing and Undo of Give up announce per the table, a negative delta (`minus 4`), mirrors carry no name, cards are `role="button"`, a 1-letter string, the region is a sibling outside Tray and every inert wrapper, is clipped (not `display: none`) and has no inert ancestor with the menu, a panel, a dialog and the History notice open, Validate rejection twice announces twice, Give up sets exactly one string (the outcome), an Undo-cancelled win (Undo between settle and open) announces no outcome, silence on `visibilitychange` return, `srOutcome` (win, Give up, negative), no inline `aria-label` remaining, `−`/`+`/`Flip` names, the announcer as sole setter, and the re-announce clear step with a fake `requestAnimationFrame`, including two announces within one frame (latest wins) commit then outcome as separate frames, and a fake rAF whose settle callback runs synchronously (Redo win) still gives commit then outcome, and a 4-card WordCell exposes one named button, its top card.
- Playwright (android), names starting `A-E9`: accessible names of a column card, a selected card, a tray tile, a foot, a used WordCell (the group's name), a QU card and a QU top card of a non-used cell, and of `−`, `+`, `Flip`; live-region text (polled with `expect().toHaveText`) through a phase change, a repeated invalid word, a commit, a Redo that commits, Undo, Redo, New game, Replay, silent relaunch into a stored session and into Game over, silent return from hidden, silent re-expand of the sheet, a Give up outcome, and a win asserting the commit text first, then the outcome. A test-side `MutationObserver` records each set, so a repeated string shows two separate sets and commit-then-outcome shows their order.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (CAP-11), Decisions; epic 5 SPEC F9
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Accessibility Floor, A-E9, Component Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components

## Notes

- Defaults beyond the SPEC examples, flagged for the owner: tray tile, foot and source foot strings; `selected` on every picked card and on tray tiles; `destination` and the join order; Place/Idle/Undo/Redo/New game/Replay prefixes; the `srOutcome` sentence; the top-card button name, empty-WordCell string and `role="button"`; silent Composing edits and sheet re-expand.
