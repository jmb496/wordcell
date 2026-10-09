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

Fills the control row and the primary button (CAP-2). In Composing only (Place keeps the meta alone, DESIGN.md): `−`/`+` as 44 × 44 secondary circles with k between them dispatching `setDestinationCount` k ∓ 1 and disabled from `canDecK`/`canIncK`, and `⇄ Flip` dispatching `flip` while `canFlip`, each a native button wrapped in `act()` (accessible names `−` (U+2212, from text.ts), `+`, `Flip` with the glyph aria-hidden, F9); on k = 0 the plain-text caption `Empty column: no cards join the word` in their place (single line, ellipsizing before the letter count).

Validate and Confirm (label precedence `Word list unavailable` > `Loading words…` > `Need 3+ letters`, enablement iff `canValidate` and `dictionary.state === 'ready'`, `act()` wrapping) are as built in src/ui/ActionBar.svelte: keep them and add tests. Deltas there: `flushSync` in `validate()` right after `game.dispatch`, inside `act()`, one `validate` dispatch per click with no flag (F15); and the label shrink (A9 4.2-m1): a label `<span>` inside the button sized by `fitSize` from src/ui/layout/fit.ts (16 px max, 14 px (ui-label size) min) against the button's fractional content width (`getBoundingClientRect().width` minus horizontal padding, Sweep S19), re-measured on WordLine's triggers only (mount, label change, width change, `document.fonts.ready`), ellipsizing only at 14 px. Confirm stays gated by `canConfirm`, true throughout Place (EXPERIENCE.md Confirm). A failed Validate leaves the stored Session unchanged apart from `activeMs` and Redo's enablement unchanged; its invalid-word line clears on the next edit, Undo, Redo or successful Validate (R-38, R-71).

text.ts gains `−` (U+2212), `+`, `⇄`, `Flip` and the empty-column caption (F11; it already has letters, placeMeta, stripBottom, stripTop). The private `tapAt` copies in e2e/tap.spec.ts, column-phases.spec.ts, drag-interruptions.spec.ts and wordcell-view.spec.ts move into e2e/helpers/board.ts (keeping the android `touchscreen.tap` / desktop `mouse.click` split), each spec importing it, with a helpers.spec.ts case: one tap at a known element's centre fires one click there (the tapAt part of sweep row S1; entry 14 moves the rest).

Out of scope: −/+ and Flip snap with no glide (entry 10 adds FLIP glides); `act()` clears no tile selection (entry 5, CAP-4).

- Interface: ControlRow.svelte gains the D-block buttons and the caption (Tray passes `draft.k`, `canDecK`, `canIncK`, `canFlip` in Composing only; caption iff k = 0); ActionBar.svelte the label shrink; text.ts the tray control strings; e2e/helpers/board.ts `tapAt`.
- Tests: per the AC: R-30, R-31, R-36, R-38 (incl. Validate only on tap, Q-07; F21, P5), R-73 (UI) (P5 part), AD-12 cancel() first (S); no component-mount harness.
- Owns: the D-block controls, Validate and Confirm states, the label shrink, the shared `tapAt` every later disabled-control test uses.
- Consumers: every App-owned button shares `act()` (the AD-12 scan, existing Undo/Redo/banner/dialog handlers).

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green (the board-composing baselines, android and desktop, regenerate in the mcr.microsoft.com/playwright:v1.63.0-noble container; every other baseline unchanged), the AD-12 act() scan has zero violations including src/ui/tray/ControlRow.svelte and src/ui/act.test.ts's cancel-before-handler test stays green (replacing tickets.toml verify's per-button spies), no private `function tapAt` remains outside e2e/helpers/, and Playwright on android shows:

- on session-composing after the dictionary loads, each step's stored wordcell:session equals `current().session` after it: `+` (k 2, read as the text between the exact-role-located `−` and `+`; stored `destinationCount` matching), Flip (stored `destinationSide` `left`, side-left word line and tile order), Flip again (`right`), `−` (k 1); the phase stays composing (R-38 Validate only on tap) until the primary-action click, whose Validate with the real list enters Place;
- `+` pressed until disabled on session-composing (destination column 6, final k equal to column 6's card count), each press saved, then a coordinate `tapAt` on it leaves wordcell:session byte-identical;
- with a word-list stub of cat and dog (e2e/tray.spec.ts:449 route), each case from a fresh failed Validate: on session-composing a coordinate tap on the disabled exact-role `−` at k = 1 keeps the line and wordcell:session byte-identical (R-31); `+` clears the line; Undo, Redo back to Composing leaves no line; on session-place after one Undo (Composing, Redo enabled) the failure leaves wordcell:session unchanged apart from `activeMs` (masked like e2e/column-phases.spec.ts `storedGame`) and Redo enabled, and Redo, Undo back leaves none; the per-dispatch clear is proven by src/shell/game.svelte.test.ts `AD-4 feedback.rejectedWord is cleared on a changed dispatch (Undo)` plus a new `(Redo)` sibling (a successful Validate's clear needs an edit, Undo or Redo first: no case);
- the k = 0 caption, with no −/+/Flip, after tap-selecting a one-card tail then tapping column 1 of session-idle-empty-column: computed nowrap, overflow hidden, text-overflow ellipsis; in a `page.addStyleTag`-narrowed row the caption's scrollWidth > clientWidth, the letter count whole inside the row;
- Need 3+ letters (session-composing-draft-2-letters, row name carrying R-36) and Confirm (session-place) kept green in e2e/game-store.spec.ts LABELS;
- on session-composing after the dictionary loads (TAN valid), a single click gives exactly one wordcell:session write after it (storage spy), phase place and no halt;
- AD-11 label shrink with `Word list unavailable`: natural nowrap widths at 16 and 14 px measured in-page (as e2e/tray.spec.ts's AD-11 tests do); a `page.addStyleTag` button width whose content width (minus computed padding) lies between them gives the span a size in [14, 16) with primary-action's scrollWidth ≤ clientWidth; one below the 14 px width gives it 14 px, still an inline box, with scrollWidth > clientWidth; the default width 16 px (no text-dependent px value, epic 4 F11);
- F21, on session-composing after the dictionary loads, storage-spy writes filtered to wordcell:session: two synchronous `el.click()` calls on primary-action in one `page.evaluate` commit at cell 3 with exactly two writes after them (Place, commit) and no halt; an android double tap does the same.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place.md
- spec — _bmad-output/specs/spec-epic-5-tray/SPEC.md, CAP-2 (F9, F11, F15, F21)
- spec — _bmad-output/specs/spec-epic-5-tray/build-notes.md, CAP-2
- coverage — _bmad-output/specs/spec-epic-5-tray/rule-coverage.md, rows R-30, R-31, R-36, R-38, R-73, AD-12
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns (D-block controls, Validate, Confirm)
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components (D-block controls, Action bar)

## Notes

- Open question: Whether flushSync() inside the act()-wrapped click renders the Place result before a fast second click on Android; the synchronous two-click F21 case is the guard. If it fails, the build stops and reports instead of adding a flag (F15).
