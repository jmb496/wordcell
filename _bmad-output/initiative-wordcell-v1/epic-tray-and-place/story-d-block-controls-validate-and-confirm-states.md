---
id: 3
type: story
title: "D-block controls, Validate and Confirm states"
parent: epic-tray-and-place
covers: [CAP-2]
after: [2]
risk: medium
---

# D-block controls, Validate and Confirm states

## Description

Fills the control row and the primary button (CAP-2): `−`/`+` as 44 × 44 secondary circles with k between them dispatching `setDestinationCount` k ∓ 1 and disabled from `canDecK`/`canIncK`, `⇄ Flip` dispatching `flip` while `canFlip` (accessible names `−`, `+`, `Flip` with the glyph aria-hidden, F9), on k = 0 the caption `Empty column: no cards join the word` in their place (single line, ellipsizing before the letter count), each a native button wrapped in `act()`; Validate per EXPERIENCE.md Validate (enabled iff `canValidate` and the dictionary is loaded, label precedence `Word list unavailable` > `Loading words…` > `Need 3+ letters`), one `validate` dispatch per click with no flag (F15, `flushSync`), the invalid-word line cleared by the next edit, Undo, Redo or a successful Validate with draft and Redo unchanged (R-38, R-71), Confirm enabled throughout Place, the primary label shrinking to the ui-label size before it ellipsizes (A9 4.2-m1); the tray strings in text.ts (F11); and the private `tapAt` copies in e2e/column-phases.spec.ts, drag-interruptions.spec.ts, tap.spec.ts and wordcell-view.spec.ts moved into e2e/helpers/ with a helpers.spec.ts case, each spec importing it (the tapAt part of sweep row S1; entry 14 moves the rest).

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with UI Vitest AD-12 cancel-first spies for −, +, Flip, Validate and Confirm, and Playwright on android shows −/+ and Flip each saved before the next action, a coordinate tap on a disabled − at k = 1 and on a disabled + at the column's size each leaving wordcell:session byte-identical, the invalid-word line cleared by a k change, by Undo and by Redo with the draft and Redo unchanged, the k = 0 caption with no −/+/Flip after a drop on column 1 of session-idle-empty-column, the Validate labels including Need 3+ letters on session-composing-draft-2-letters, one click = one validate, and on session-composing after the dictionary loads a double tap on primary-action committing at cell 3 with the storage-spy writes showing the Place write then the commit write (F21).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place.md
- spec — _bmad-output/specs/spec-epic-5-tray/build-notes.md, CAP-2
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns (D-block controls, Validate, Confirm)

## Notes

- Open question: Whether flushSync() inside the act()-wrapped click renders the Place result before a fast second click on Android; the F21 double-tap test is the guard.
