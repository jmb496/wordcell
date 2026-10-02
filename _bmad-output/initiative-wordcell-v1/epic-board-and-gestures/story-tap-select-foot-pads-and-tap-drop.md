---
id: 7
type: story
title: "Tap-select, foot pads and tap-drop"
parent: epic-board-and-gestures
covers: [CAP-6]
after: [6]
risk: medium
---

# Tap-select, foot pads and tap-drop

## Description

Adds the tap half of R-14 and Q-18 to the controller (SPEC.md CAP-6, build-notes CAP-6):

- Select: a tap on a column card with column.canPickUp selects it and every card below through overlays.select (selected faces lifted 8 px on the face only with the teal outline, F26; source foot `Here`, other feet the wash, DESIGN.md Column slot, Card states). A held press on a column card released without a drag is a tap (long-press is WordCells only, entry 6).
- Inert: with nothing selected, a tap on a column's empty space, placeholder or foot pad, and any press on a card of a column whose canPickUp is false, dispatches nothing, selects nothing and makes no nav call. With nothing selected a WordCell tap does nothing in this ticket (entry 10 adds the view).
- Tap-drop: a tap on any card, empty space, placeholder or foot of another column, or on Here or the source column's empty space, deselects, then dispatches drop with sourceCount = the selected tail, gated on canDropOn (AD-3, build-notes CAP-6); no extra handling (rule 6).
- Re-select inside the source column grows or shrinks the tail with no new entry; a tap on the selected top is a no-op; a WordCell tap or an empty-WordCell long-press (on release) deselects with no view.
- Outside tap (F25): deselect only on the controller's tap classification whose target is outside every column hit rect, [data-wordcell], the open view sheet and scrim, and is not an enabled control (enabled controls deselect in their own handler before acting); a pointer tap's trailing click is ignored, click counts only for non-pointer activation; never on pointerdown or a long-press. Regions per SPEC CAP-6; the desktop scrollbar gutter is outside the root (F30).
- Disabled controls: the build first probes with a Playwright tap on the disabled primary Validate (Idle) and the disabled Redo (session-idle-fresh) while a tail is selected; if Chromium does not deliver the pointer events, add `button:disabled { pointer-events: none }` so the press resolves to the enclosing bar background (no visual or layout change) [unverified]; the plan records the result.
- Undo, Redo and the banner Reload deselect in each control's handler after act()'s cancel(), before acting (cancel() never deselects a tap-selection, AD-13 row).
- Desktop hover, under (hover: hover) and (pointer: fine) only (EXPERIENCE.md Mouse and hover, DESIGN.md Card states): in Idle while playing with nothing selected, the grab outline (cursor grab) on the tail that would lift; with a tail selected, the drop-target highlight (DESIGN.md drop target element) on another column hovered anywhere and on the source column only over its empty space, placeholder or Here; the re-select outline on a source-column card other than the selected top; nothing on the selected top; no hover in Game over. Classes toggled on the DOM by the controller's pointerover/pointerout, never Svelte state per move (build-notes CAP-6).
- Here: a non-button label inside the existing data-foot element, replacing the desktop column number (DESIGN.md Column slot); string in src/ui/text.ts.
- The foot row's touch-action none while a tail is selected (pan-y otherwise, entry 4).
- The blocking.spec.ts case: New game from a session-invalid-* fixture, then a tap selects with history.state.wc 1.

Interface: controller tap handling for column, foot and outside presses; Column.svelte selection, Here and wash classes; no new exports beyond entry 6.
Tests: R-14 (UI) every tap row of rule-coverage §3 (tap-select transient, tap on another column is a drop, source-column drop via Here or empty space, re-select, selected card no-op, WordCell tap deselects, outside taps deselect incl. banner Reload, selection not persisted or undoable); Q-18 under the R-14 rows; R-10, R-11, R-20, R-22 (P4 supp.); AD-13 one entry per selection popped on drop, deselect, Undo, Redo, back clears it (P4); AD-13 tail-selection reload then back leaves the app (P4); AD-12 hit rects on the full slot pitch, lift on the face only (F26, P4).
Owns: the tail-selection visuals, the foot row's selected-state touch-action (AD-11 row, rest in entry 4) and the outside-tap deselect path (F25).
Unknown: whether Chromium fires pointer events on a disabled <button> (unverified); default above.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green (the four e2e/board.screens.spec.ts baselines expected unchanged, a selection is never persisted; no new screenshot), and:

- Controller Vitest (S): a held column-card press released without a drag is a tap; a tap on the scrim or sheet while a sticky view is above a selection does not deselect (deselect() would throw, overlays.svelte.ts).
- Playwright android, each rule-coverage §3 R-14 tap row by id: a tap-select dispatching nothing with the Session reference and storage unchanged; with nothing selected, taps on empty space, placeholder, foot pad and on a card of a column with canPickUp false inert (no dispatch, no select, wc 0); tap-drops on another column's card, placeholder (session-idle-empty-column), empty space and foot and on Here giving drop with the selected sourceCount (self-drop k = 1; whole-column self-drop k = 0 on session-idle-fresh); a tap on the selected top a no-op (selection and wc 1 kept); re-select growing above and shrinking inside the tail with wc kept, the next tap-drop's sourceCount matching (R-10); a WordCell tap on an empty and a non-empty cell deselects, no view, wc 0; an empty-WordCell long-press deselects on release; outside taps on each F25 region (top bar background, tray band, labels, gap, action bar background, leftover band, banner background, desktop side margins) and on the disabled Validate (Idle) and disabled Redo (session-idle-fresh) deselect, wc 0; a non-empty WordCell long-press and a tray-band pan-y pan at entry 4's scrolling viewport keep the selection.
- Undo with a selection (session-idle-empty-column) clears it then undoes; Redo with a selection (session-idle-pending-draft) clears it then redoes; banner Reload clears it then acts.
- AD-13: entry popped on drop, deselect, Undo and Redo (history.state.wc 0); back clears the selection with the app open at wc 0; reload shows nothing selected and the Session unchanged; select-reload-back leaves the app; the blocking.spec.ts session-invalid-* case.
- P4 computed style: selected faces carry the outline and an 8 px upward translate on the face only (slot unmoved), the source foot shows Here, other feet carry the wash.
- F26 at 360 × 750 per SPEC CAP-6 success (session-idle-fresh, column 1, 3-card tail): the slot-margin and lifted-tail taps.
- desktop: each hover case of the Description (grab outline, drop-target highlight on another column and on the source column's empty space, placeholder and Here only, re-select outline, nothing on the selected top, none in Game over).
- Foot row computed touch-action on android (narrow): none with a tail selected, pan-y without (the --wc-pan value).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-board-and-gestures/epic-board-and-gestures.md
- spec — _bmad-output/specs/spec-epic-4-board/build-notes.md, CAP-6
- spec — _bmad-output/specs/spec-epic-4-board/SPEC.md, CAP-6 (F25, F26, F30)
- coverage — _bmad-output/specs/spec-epic-4-board/rule-coverage.md §3 (R-14 tap rows, R-10, R-11, R-20, R-22, AD-12, AD-13 rows)
- ux — DESIGN.md Column slot, Card states; EXPERIENCE.md Mouse and hover, Foot pad
- screenshots — e2e/board.screens.spec.ts (the four phase baselines)

## Notes

- Open question: disabled-control pointer events; resolved by the probe default in the Description [ASSUMPTION, build-notes CAP-6].
