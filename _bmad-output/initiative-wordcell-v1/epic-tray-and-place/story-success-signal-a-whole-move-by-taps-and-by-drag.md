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

Proves epic Done when 2 and Done when 3's same-Session sentence (SPEC Success signal) on entries 1–9; the Success signal's "every P5 row" clause is entry 15's Done when 1 audit; Done when 3's under-25 % tile and outside-released free-letter sentence is entries 7 and 8's (e2e/tile-drag.spec.ts, e2e/free-letter.spec.ts). The move is ANEW from session-idle-empty-column, build-time literals in the spec (no runtime dictionary search; generated/dictionary/en.txt is git-ignored), legal targets per R-40: tap-select column 6's 3-card tail [1, 9, 28] (A E N), tap-drop on empty column 1 (k 0), tap-add cell 7's top card 48 (W) → arrangement [1, 9, 28, 48] (AENW), tap-swap tiles 9 and 28 → [1, 28, 9, 48] (ANEW), Validate (legal 3–4, pre-selected 4; both tests first await `waitForDictionary(page, 'ready')` as e2e/place.spec.ts does), tap cell 3 (retarget), tap-swap strip tiles 1 and 28 → placementOrder [28, 1, 9, 48], Confirm. The drag version plays the same move with as many drags as needed to reach the same `arrangement` and `placementOrder` (SPEC Success signal): the tail dropped by drag on column 1, W dragged into the tray's end insertion gap (Done when 3 "at an insertion gap"; same arrangement as the tap-add), one drag each for the reorders: tray tile 28 into the gap before tile 9, strip tile 28 into gap 0; Validate, the retarget and Confirm stay taps.

A defect this spec exposes in entries 1–9 is fixed at its cause within the epic Boundaries (src/ui/, src/main.ts wiring, e2e/) and recorded in the plan; an engine or shell change or a spec deviation stops for the owner (AGENTS.md rules 6, 7).

- Interface: no source change expected; new `e2e/success-signal.spec.ts`, android project only (the `onAndroid` skip pattern of e2e/place.spec.ts); a scripted fixture only under the Notes guard.
- Tests: Success signal tap-only and drag (P5, epic Done when 2 and 3); R-73 (UI) every step saved before the next (P5 part); R-80 score change equals the preview (P5 supp. part). Two tests, named id-first (AGENTS.md Conventions): `R-73 (UI) R-80 Success signal (epic Done when 2): tap-only move from session-idle-empty-column …` and `R-73 (UI) Success signal (epic Done when 3): the same move by drag …`.
- Owns: the epic's Success-signal tests and any fallback start fixture.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green, and Playwright on android shows:

- both tests, after Confirm, polling a local copy of e2e/place.spec.ts's `cellIds(page, 3)` to [28, 1, 9, 48] (ANEW, bottom → top) with `card-48` visible on top;
- R-80: the Place meta delta read from the DOM after the last Place edit (retarget and strip swap), just before Confirm, equals the top-bar score change across Confirm, both read as e2e/place.spec.ts's R-80 test does: +5 (score 49 → 54);
- R-73, in both tests, before the next step: each dispatching step first polls its expected stored value, then calls a local copy of e2e/place.spec.ts's `expectSaved` (alone it holds even after a missed gesture): drop → `arrangement` [1, 9, 28], `reached` composing; addFreeLetter → [1, 9, 28, 48], `freeLetters` [7]; arrange → [1, 28, 9, 48]; validate → `reached` place, `targetCell` 4, `placementOrder` [1, 28, 9, 48], meta delta +9; setTarget → `targetCell` 3, meta +5 (pre-selected 4, so the cell 3 tap is a real retarget, SPEC Success signal); setPlacementOrder → [28, 1, 9, 48]; confirm → cursor `{ index: 2, phase: 'idle' }`; `expectSaved` also runs after each non-dispatching tap (tap-only test: tail tap-select, first tap of each swap), where it holds with no write;
- one module-level expected `moves`/`cursor` literal in the spec: the fixture's first move copied verbatim plus `{ sourceColumn: 6, sourceCount: 3, destinationColumn: 1, destinationCount: 0, destinationSide: 'left', freeLetters: [7], arrangement: [1, 28, 9, 48], reached: 'committed', targetCell: 3, placementOrder: [28, 1, 9, 48] }`, cursor `{ index: 2, phase: 'idle' }`; each test seeds session-idle-empty-column fresh and at the end asserts `current().session` and the stored `wordcell:session` against it (`version` 1, `seed` 1, `gaveUp` false (the fixture's); `activeMs` excluded);
- outcomes asserted through `current()`, storage and DOM reads with `expect.poll`, never fixed waits tied to animation timing (entries 10, 16 and 11 add FLIP and fly-to-cell after this ticket).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place.md, Done when 2 and 3, Boundaries
- spec — _bmad-output/specs/spec-epic-5-tray/SPEC.md, Success signal, Assumptions
- spec — _bmad-output/specs/spec-epic-5-tray/rule-coverage.md, the R-73 (UI) and R-80 rows
- reuse — e2e/place.spec.ts (`score`/`metaDelta` reading, `expectSaved`, `cellIds`, `onAndroid`); e2e/free-letter.spec.ts (`geometry`, `gapCentre`, `holdTop`, `moveFace`) and e2e/tile-drag.spec.ts (`gapCentre`, `holdTile`, `moveFace`) for the drag gap geometry; local copies, no new e2e/helpers module (S1 consolidation is entry 14's)

## Notes

- Guard: only if the build's replay shows the move no longer validates, script a valid start fixture under the epic 3 regeneration rule wired into the fixture lists as ticket 5.9 did (serialize.test.ts lists, the AD-17 valid-fixture list and its count), and record the new start's name in the plan for the owner's close-out (SPEC Assumptions flag); SPEC.md and the epic file stay untouched.
