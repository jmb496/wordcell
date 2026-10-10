---
id: 17
type: story
title: "Success signal: a whole move by taps and by drag"
parent: epic-tray-and-place
covers: [CAP-7]
after: [9]
risk: medium
---

# Success signal: a whole move by taps and by drag

## Description

Proves epic Done when 2 and Done when 3's same-Session sentence (SPEC Success signal) on entries 1–9; Done when 3's under-25 % tile and outside-released free-letter sentence is entries 7 and 8's (e2e/tile-drag.spec.ts, e2e/free-letter.spec.ts). The move is ANEW from session-idle-empty-column, build-time literals in the spec (no runtime dictionary search; generated/dictionary/en.txt is git-ignored), legal targets per R-40: tap-select column 6's 3-card tail [1, 9, 28] (A E N), tap-drop on empty column 1 (k 0), tap-add cell 7's top card 48 (W) → arrangement [1, 9, 28, 48] (AENW), tap-swap tiles 9 and 28 → [1, 28, 9, 48] (ANEW), Validate (legal 3–4, pre-selected 4), tap cell 3 (retarget), tap-swap strip tiles 1 and 28 → placementOrder [28, 1, 9, 48], Confirm. The drag version plays the same move with as many drags as needed to reach the same `arrangement` and `placementOrder` (SPEC Success signal): the tail dropped by drag on column 1, W dragged into the tray's end insertion gap (Done when 3 "at an insertion gap"; same arrangement as the tap-add), the tray swap 9 ↔ 28 and the strip swap each one adjacent drag reorder; Validate, the retarget and Confirm stay taps.

A defect this spec exposes in entries 1–9 is fixed at its cause within the epic Boundaries (src/ui/, e2e/) and recorded in the plan; an engine or shell change or a spec deviation stops for the owner (AGENTS.md rules 6, 7).

- Interface: no source change expected; new `e2e/success-signal.spec.ts`, android project only (the `onAndroid` skip pattern of e2e/place.spec.ts); a scripted fixture only under the Notes guard.
- Tests: Success signal tap-only and drag (P5, epic Done when 2 and 3); R-73 (UI) every step saved before the next (P5 part); R-80 score change equals the preview (P5 supp. part). Two tests, named id-first (AGENTS.md Conventions): `R-73 (UI) R-80 Success signal (epic Done when 2): tap-only move from session-idle-empty-column …` and `R-73 (UI) Success signal (epic Done when 3): the same move by drag …`.
- Owns: the epic's Success-signal tests and any fallback start fixture.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green, and Playwright on android shows:

- the tap-only move committing ANEW to cell 3 bottom → top [28, 1, 9, 48];
- R-80: the Place meta delta read from the DOM after the last Place edit (retarget and strip swap), just before Confirm, equals the top-bar score change across Confirm, both read as e2e/place.spec.ts's R-80 test does: +5 (score 49 → 54; +9 before the retarget, view.ts:259);
- R-73: the stored `wordcell:session` equals `current().session` after every dispatching step (drop, addFreeLetter, arrange, validate, setTarget, setPlacementOrder, confirm; tap-selects and first swap taps persist nothing), before the next, via a local copy of e2e/place.spec.ts's `expectSaved` (no new helper);
- one module-level expected `moves`/`cursor` literal in the spec: the fixture's move plus `{ sourceColumn: 6, sourceCount: 3, destinationColumn: 1, destinationCount: 0, destinationSide: 'left', freeLetters: [7], arrangement: [1, 28, 9, 48], reached: 'committed', targetCell: 3, placementOrder: [28, 1, 9, 48] }`, cursor `{ index: 2, phase: 'idle' }`; each test seeds session-idle-empty-column fresh and at the end asserts `current().session` and the stored `wordcell:session` against it (`version`, `seed`, `gaveUp` equal; `activeMs` excluded);
- outcomes asserted through `current()` and storage with `expect.poll`, never fixed waits tied to animation timing (entries 10, 16, 11 and 13 add FLIP and fly-to-cell after this ticket).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place.md, Done when 2 and 3, Boundaries
- spec — _bmad-output/specs/spec-epic-5-tray/SPEC.md, Success signal, Assumptions
- spec — _bmad-output/specs/spec-epic-5-tray/rule-coverage.md, the R-73 (UI) and R-80 rows
- reuse — e2e/place.spec.ts (`score`/`metaDelta` reading, `expectSaved`, `onAndroid`)

## Notes

- Guard: only if the build's replay shows the move no longer validates, script a valid start fixture under the epic 3 regeneration rule wired into the fixture lists as ticket 5.9 did (serialize.test.ts lists, the AD-17 valid-fixture list and its count), rename the Success signal / Done when 2 start, and flag it for the owner at close-out (SPEC Assumptions).
