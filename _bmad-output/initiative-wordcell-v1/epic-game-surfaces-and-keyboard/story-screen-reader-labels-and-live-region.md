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

Names every card, WordCell and control for screen readers, moves the `WordCellRow` aria-label into `text.ts` and adds one polite live region in the UI. Every string is a `text.ts` entry (AGENTS catalogue rule); no component builds a string or holds an inline `aria-label` for these. Words are spelled as `text.ts` spells them (uppercase, `QU` as `QU`). Counts: `1 card` / `N cards`, `1 letter` / `N letters` (existing `letters`; QU counts 2).

**Labels.** A live element carries the name; a mirror (`data-mirror-of`, `aria-hidden`) never does. Cards get `role="button"`.

| Place | Template | Example |
|---|---|---|
| Column card | `{L}, column {c}, card {i} of {n}{, state}` (i from the top) | `E, column 1, card 2 of 5, selected` |
| Tray tile | `{L}, tray, tile {i} of {n}` | `E, tray, tile 2 of 5` |
| WordCell top card | `{L}, WordCell {c}, top` | `L, WordCell 6, top` |
| WordCell | `WordCell {c}, top {L}, {n} cards{, used}` | `WordCell 6, top L, 4 cards, used` |
| Empty WordCell | `WordCell {c}, empty` | `WordCell 3, empty` |
| 1-card WordCell | `WordCell {c}, top {L}, 1 card` | `WordCell 4, top T, 1 card` |
| Column foot | `Column {c} foot` (source foot while selecting: `Column {c}, here`) | `Column 3 foot` |

`{L}` for QU is `Q U, counts as two letters` on the card name and on a WordCell whose top card is QU (`WordCell 6, top Q U, counts as two letters, 4 cards`); in word strings QU is spelled `QU` and counts 2 in `N letters`.

| State | Reads (AD-3) |
|---|---|
| `selected` | tap-selection state (UI/shell, not engine); combined with `ColumnView.canPickUp` only |
| `used` | `CellView.used` |
| `destination` (D card, Composing) | `draft.destination` |

The `−`, `+` and `Flip` names follow epic 5 F9 (visible text `−`, `+`, `Flip`; glyph `aria-hidden`): `text.minus` and `text.plus` are the button names, `Flip` is `text.flip` with `text.flipGlyph` `aria-hidden` (already so in `ControlRow.svelte`). The `WordCellRow.svelte` aria-label `WordCell {cell.cell}` (line 60) becomes the `text.ts` WordCell template above; an AD-3 check asserts no inline `aria-label` string remains in `WordCellRow.svelte`, `Column.svelte`, `Card.svelte` or `ControlRow.svelte`.

**Delta wording.** `plus N`, `minus N` (the word, not U+2212), `no change` for 0.

**Live region.** One always-mounted element in the UI, outside any inert overlay, `role="status"` `aria-live="polite"`, visually hidden and out of layout (no space, so `test:screens` baselines are unchanged). Its DOM text is the test oracle. One announcement per user action: the last set in the same update wins (a Confirm announces the commit, not the phase change). Announce only on a transition: boot, restore and Replay-load are silent. A repeated identical string is still announced (clear, then set on the next frame, or equivalent).

| Trigger | Text |
|---|---|
| Phase change to Composing | `Composing. {WORD}, {N letters}.` (`Composing. BAKED, 5 letters.`) |
| Phase change to Place | `Place. {WORD}, {N letters}.` |
| Phase change to Idle (not Undo/Redo/commit) | `Idle.` |
| Invalid word | `text.invalidWord(word)` (`{WORD} isn't in the word list.`, existing literal) |
| Commit (Confirm, or a Redo that commits) | `{WORD} placed on cell {c}, {delta}` (`BALKED placed on cell 6, plus 30`) |
| Undo | `Undo. {resulting phase text}` |
| Redo (not committing) | `Redo. {resulting phase text}` |
| New game | `New game. Idle.` (resulting phase) |
| End outcome (sheet opens) | `{endWinTitle or endGaveUpTitle} {score}, {band}`, from `text.endBar` score/band content (minus read `minus`) |

A winning Confirm announces the commit at commit time, then the outcome when the sheet opens, replacing the commit text.

**Commit trigger.** The UI compares committed-word count (`GameView.wordCount`) before and after each `dispatch` call: a Confirm or Redo that raises it announces a commit; a dispatch that changes nothing (same reference or unchanged count and phase) announces nothing. Word, cell and delta come from the committed move's view: `cells` (the cell holding the word) and `scoreDelta` (the placed move's `PlaceView.scoreDelta`). If a field is missing, stop and report (no fallback text, AGENTS rule 6).

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green (the live region is visually hidden, so baselines are unchanged).

- UI Vitest, one `AD-3` case per string family: card and WordCell templates (QU, empty, singular, used), delta `plus` / `minus` / `no change`, plural forms, precedence (last set wins), repeat-identical re-announce, no inline `aria-label` remaining, `−`/`+`/`Flip` names.
- Playwright (android), names starting `A-E9`: accessible names of a column card, a selected card, a used WordCell, a QU card and a QU top card, and of `−`, `+`, `Flip`; live-region text through a phase change, a repeated invalid word, a commit, Undo, Redo, New game, silent boot, and a win asserting the commit text first, then the outcome.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (CAP-11), Decisions; epic 5 SPEC F9
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Accessibility Floor, A-E9, Component Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components

## Notes

- Wording not fixed by the SPEC examples (tray tile, foot, Place/Idle/Undo/Redo/New game prefixes, outcome sentence) takes the simplest consistent default above; flagged for the owner.
