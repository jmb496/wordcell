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

Placement: in Tray.svelte's Idle branch, in the word-line slot, one ui-label line in the ink-secondary token (not a hex), left-aligned, never wrapping, built as two spans: a word span (`min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap`) and a non-shrinking nowrap suffix span (` · Redo brings it back`), so the word ellipsizes first and the suffix stays. The tile rows and control row stay empty; the band height, the columns and the WordCell row do not move (DESIGN.md Tray band).

Presence: rendered iff `view.pendingDraftWord !== undefined`, with no phase check or re-derivation in the component. Hence it is absent in Composing, Place, Game over, with no draft, and after a new edit discards the redo tail; it shows only the pending draft's word even when the redo tail is longer. It is plain static text: not aria-live, no live-region announcement. A reload restoring the session shows it (derived from replay). The CAP-9 anchor `scrollTop` Android fling device check (SPEC) is not part of this ticket's Verify.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green. Playwright (android), tests named `R-72 …`, through EXPERIENCE.md Flow 3: after Undo 1 (Composing) no line; after Undo 2 the line `Undone: BAKED · Redo brings it back`; `page.reload()` there (the convention in e2e/board-phases.spec.ts) and the line still shows BAKED; after Redo 1 and Redo 2 no line. Discard case: from the Idle-with-draft point drag a tail to the tray, Validate (Place) and assert no line, Undo (Composing) no line, Undo (Idle) the line shows the NEW word, not BAKED; once the new word is placed and committed with no draft, the line is absent. Structure: assert computed `white-space: nowrap` and `text-overflow: ellipsis` on the word span and that the suffix span is visible on one row at the narrowest width (the 10-letter word is the screens worst case and may not overflow). Vitest, tests named `AD-3 …`: `pendingDraft('quake')`-style QU uppercasing plus a 3-letter and a 10-letter word, and a Tray server render (`svelte/server`, as in src/ui/surfaces.test.ts) from GameView fixtures asserting the word-line slot reads `Undone: QUAKE · Redo brings it back` with no aria-live or role=status given `pendingDraftWord: 'quake'`, and no line without it; if Tray is not renderable that way under the server-compiled Vitest setup, `pendingDraft` Vitest plus the Playwright tests are the coverage. Screens: one Idle-with-pending-draft baseline at 360 px with a 10-letter word in e2e/board.screens.spec.ts, seeded through e2e/helpers/seed.ts `seedStorage` from a new valid Session fixture `fixtures/session-idle-pending-draft-long.json` (existing `session-idle-pending-draft.json` has a 3-letter word; the new one is a copy with a 10-letter placementOrder, unverified until built), generated inside the container via `npm run test:screens`.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (CAP-9), Decisions
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Flow 3, State Patterns (Idle/pending draft row), A-E13 (assumption: wording and placement changes go to the owner)
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Tray band
- rules — docs/game-flow-spec.md, R-72, Q-41

## Notes

- Owner answer (2026-10-15): at the narrowest phone width the line `Undone: WORD · Redo brings it back` never wraps or overflows and always shows the full ` · Redo brings it back` suffix; the word is cut with `…` only if it truly cannot fit.
