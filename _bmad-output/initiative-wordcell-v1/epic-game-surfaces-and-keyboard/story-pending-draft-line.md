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

Shows `Undone: BAKED · Redo brings it back` in the tray band in Idle with a pending draft. The line's text is built only by `text.ts` `pendingDraft(word)`, which takes `view.pendingDraftWord` and returns the parts `{prefix, word, suffix}`: prefix `Undone: `, the word uppercased (`qu` becomes `QU`), suffix ` · Redo brings it back` (U+00B7); Tray.svelte renders the parts (word span, suffix span) and builds no string, so every catalogue string stays in `text.ts`; it reads only that field (AD-3); no engine or GameView change is in scope.

Placement: inside Tray.svelte's `.word-line` div (the word-line slot), as a sibling branch to the `<WordLine>` under `{#if draft !== undefined}` (e.g. `{:else if view.pendingDraftWord !== undefined}` on that if; `draft` is undefined in Idle, so the two never show together, and `WordLine` is unchanged), one ui-label line in the ink-secondary token (not a hex), left-aligned, never wrapping, built as two spans: a word span (`min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap`) and a non-shrinking nowrap suffix span (` · Redo brings it back`), so the word ellipsizes first and the suffix stays. At the narrowest phone width (360 px, DESIGN.md A-D3) the line never wraps or overflows and always shows the full ` · Redo brings it back` suffix; the word is cut with `…` only if it truly cannot fit (10 letters is the maximum word length, so this is expected not to trigger at that width). DESIGN.md says the word line otherwise renders only the card letters; this line is the specified Idle exception (EXPERIENCE.md State Patterns, A-E13). The tile rows and control row stay empty; the band height, the columns and the WordCell row do not move (DESIGN.md Tray band).

Presence: rendered iff `view.pendingDraftWord !== undefined`, with no phase check or re-derivation in the component. Hence it is absent in Composing, Place, Game over, with no draft, and after a new edit discards the redo tail; it shows only the pending draft's word even when the redo tail is longer. It is plain static text: not aria-live, no live-region announcement. A reload restoring the session shows it (derived from replay). The CAP-9 anchor `scrollTop` Android fling device check (SPEC) is not part of this ticket's Verify.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green. Playwright (android), tests named `R-72 …`, through EXPERIENCE.md Flow 3, started from a seeded Session fixture in Place after placing BAKED (the setup is named in the test; no existing fixture is assumed): after Undo 1 (Composing) no line; after Undo 2 the line `Undone: BAKED · Redo brings it back`; `page.reload()` there (the convention in e2e/board-phases.spec.ts) and the line still shows BAKED; after Redo 1 and Redo 2 no line. Discard case: from the Idle-with-draft point (word BAKED) drag a tail to the tray to compose a different named word, Validate (Place) and assert no line, Undo (Composing) no line, Undo (Idle) the line shows that NEW word, not BAKED; once the new word is placed and committed with no draft, the line is absent. Structure: assert computed `white-space: nowrap` and `text-overflow: ellipsis` on the word span, and no `aria-live` or `role=status` on the line. Narrow-width check (android project, `page.setViewportSize` to 360 px wide, the DESIGN.md A-D3 minimum and the Screens width; the project's own Pixel 7 is 412) on the long-word fixture below: the line is one row, no horizontal overflow of the line or the band (`scrollWidth <= clientWidth`), and the suffix text is fully visible. Vitest, tests named `AD-3 …`: `pendingDraft('quake')` returns the parts (word `QUAKE`) whose joined parts read `Undone: QUAKE · Redo brings it back`, plus a 3-letter and a 10-letter word, and a Tray server render (`svelte/server`, as in src/ui/surfaces.test.ts) from GameView fixtures asserting the word-line slot reads `Undone: QUAKE · Redo brings it back` with no aria-live or role=status given `pendingDraftWord: 'quake'`, and no line without it; if Tray is not renderable that way under the server-compiled Vitest setup, `pendingDraft` Vitest plus the Playwright tests are the coverage. Screens: one Idle-with-pending-draft baseline at 360 px with a 10-letter word in e2e/board.screens.spec.ts, seeded through e2e/helpers/seed.ts `seedStorage` from a new valid Session fixture `fixtures/session-idle-pending-draft-long.json` (existing `session-idle-pending-draft.json` has a 3-letter word; the new one is a copy with a 10-letter placementOrder, unverified until built, and must pass the existing fixture tests per the AGENTS.md fixtures pitfall), generated inside the container via `npm run test:screens`.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (CAP-9), Decisions
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Flow 3, State Patterns (Idle/pending draft row), A-E13 (assumption: wording and placement changes go to the owner)
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Tray band
- rules — docs/game-flow-spec.md, R-72, Q-41

## Notes

- Owner answer (2026-10-15): at the narrowest phone width the line `Undone: WORD · Redo brings it back` never wraps or overflows and always shows the full ` · Redo brings it back` suffix; the word is cut with `…` only if it truly cannot fit.
