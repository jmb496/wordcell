---
id: 8
type: story
title: "Pending-draft line"
parent: epic-game-surfaces-and-keyboard
covers: [CAP-9]
after: [1]
risk: low
---

# Pending-draft line

## Description

Shows `Undone: BAKED · Redo brings it back` in the tray band in Idle with a pending draft. The line is built only by `text.ts` `pendingDraft(word)`, which takes `view.pendingDraftWord`, uppercases it (`qu` becomes `QU`) and returns `Undone: <WORD> · Redo brings it back` (U+00B7); Tray.svelte reads only that field (AD-3); no engine or GameView change is in scope.

Placement: in Tray.svelte's Idle branch, in the word-line slot, one ui-label line in the ink-secondary token (not a hex), left-aligned, never wrapping; the word part ellipsizes first and the suffix stays. The tile rows and control row stay empty; the band height, the columns and the WordCell row do not move (DESIGN.md Tray band).

Presence: rendered iff `view.pendingDraftWord !== undefined`, with no phase check or re-derivation in the component. Hence it is absent in Composing, Place, Game over, with no draft, and after a new edit discards the redo tail; it shows only the pending draft's word even when the redo tail is longer. It is plain static text: not aria-live, no live-region announcement. A reload restoring the session shows it (derived from replay).

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green. Playwright (android), tests named `R-72 …`, through EXPERIENCE.md Flow 3: after Undo 1 (Composing) no line; after Undo 2 the line `Undone: BAKED · Redo brings it back`; after Redo 1 and Redo 2 no line; discard case: from that Idle drop a different word, place it, Undo back to Idle and assert the line shows the NEW word, not BAKED (and none while Composing). Vitest, tests named `AD-3 …`: `pendingDraft('quake')`-style QU uppercasing plus a 3-letter and a 10-letter word, and a Tray render from GameView fixtures asserting no line without `pendingDraftWord`. Screens: one Idle-with-pending-draft baseline at 360 px with a 10-letter word in e2e/board.screens.spec.ts, generated inside the container via `npm run test:screens`.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (CAP-9), Decisions
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns, Keyboard, State Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Flow 3, State Patterns (Idle/pending draft row), Tray band, A-E13 (assumption: wording and placement changes go to the owner)
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Tray band
- rules — docs/game-flow-spec.md, R-72, Q-41
