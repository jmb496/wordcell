# Review log — story-success-signal-a-whole-move-by-taps-and-by-drag.md (ticket 5.17)

State: pass 2: done

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: HEAD abe3bbc, .passes/pass0.md, 254 words.
Intent extras (tickets.toml entry 17, not copied into the ticket; fixer adds them to Description in pass 1): interface, tests, owns.

## Pass 1 — 2026-10-09
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 6, minor 5, decision-needed 0  |  Dropped in triage: 2 (+ ~20 duplicates merged)
Words (docs): 695 (2.74 x pass 0; budget 1500)  |  Snapshot: .passes/pass1.md, fix diff .passes/pass1.fix.diff
Fixer: all 11 applied; literals re-checked by a read-only esbuild bundle of src/engine/index.ts replayed on session-idle-empty-column with en.txt (score 49 → 54, deltas +9/+5, cursor { index: 2, phase: 'idle' }); no commands added.
### Applied
- [instr+major] Description — add tickets.toml entry 17 interface, tests, owns; name the new spec `e2e/success-signal.spec.ts` (android only) and its two id-first test names (R-73 (UI), R-80, Success signal / epic Done when 2, 3) → fixer item 1
- [major] Description/Notes — word left open though one exists (three replays agree): name the move as build-time literals (ANEW: column 6's 3-card tail [1, 9, 28] tap-dropped on empty column 1, k 0; tap-add cell 7's top 48 W; tap-swap 9 ↔ 28; Validate pre-selects 4; retarget 3; strip swap), no runtime dictionary search; close the open question; fallback shrinks to a guard naming the fixture lists (ticket 5.9 pattern) → 2
- [major] Description — "Proves Done when 2 and 3" overclaims: Done when 3's under-25 % / released-outside sentence is entries 7 and 8 → 3
- [major] AC — drag vs tap comparison needs cross-test state: one shared expected moves/cursor literal, both tests seeded fresh → 4 (default applied)
- [major] AC — "previewed delta" has two readings (+9 at the pre-selected 4, +5 at 3; `view.ts:259` count × target − free-letter score): read the meta delta after the last Place edit, before Confirm; literal +5 → 5
- [major] Description — drag twin drops SPEC's "as many drags as needed"; Validate, retarget, Confirm stay taps; free letter dragged into an insertion gap (end gap, then adjacent drag reorders) → 6 (default applied)
- [minor] Description — a defect the spec exposes in entries 1–9: fix at its cause inside the epic Boundaries (src/ui/, e2e/), stop on engine/shell/spec deviation → 7 (default applied)
- [minor] AC — "after every step" → after every dispatching step → 8
- [minor] Description — "at least two legal target cells" is implied by R-40 for letter count ≥ 4 → 9
- [minor] References — SPEC Success signal and Assumptions, rule-coverage R-73 (UI)/R-80 rows, e2e/place.spec.ts patterns → 10
- [minor] AC — assert by current()/storage with expect.poll, not animation timing (entries 10, 16, 11, 13 follow) → 11
### Default applied (technical)
- AC — tap vs drag comparison → shared literal in the spec
- Description — free-letter drag → end insertion gap, adjacent drag reorders
- Description — defects found in earlier entries → fixed at cause inside Boundaries
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- adversarial: score preview +16/+12 — wrong, R-80 Place delta subtracts the free letter's cell score (view.ts:259): +9/+5
- adversarial: "add criterion that the post-add arrangement is not the word" — subsumed by naming the move (item 2)

## Pass 2 — 2026-10-09
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 2, minor 11, decision-needed 0  |  Dropped in triage: 0 (+ 8 duplicates merged)
Words (docs): 860 (3.39 x pass 0; budget 1500)  |  Snapshot: .passes/pass2.md, fix diff .passes/pass2.fix.diff
Fixer: all 12 applied; per-step literals re-checked by esbuild replay (deltas 9/5, score 49 → 54, cell 3 [28, 1, 9, 48]); cited e2e names grepped (tile-drag.spec.ts has `holdTile`, not `holdTop`); no commands added.
### Applied
- [major] AC R-73 — `expectSaved` alone passes when a tap misses (stored = current trivially): each dispatching step first polls its stored literal (drop → arrangement [1, 9, 28] composing; add → [1, 9, 28, 48], freeLetters [7]; arrange → [1, 28, 9, 48]; validate → place, targetCell 4, meta +9; setTarget → 3, +5; setPlacementOrder → [28, 1, 9, 48]; confirm → cursor { 2, idle }), then `expectSaved`; validate's target 4 proves the retarget is real (SPEC "other than the pre-selected one") → fixer item 1
- [major] AC — Done when 2's "lands in the chosen cell in the chosen order" has no DOM assertion (last bullet limits to current()/storage): poll a local `cellIds(page, 3)` → [28, 1, 9, 48], card-48 on top, in both tests; expect.poll covers DOM reads too → 2
- [minor] AC — entry 13 is the winning guard, not FLIP: "entries 10, 16 and 11" → 3
- [minor] AC R-73 — Done when 2 says after every step: run `expectSaved` after the selecting taps too (holds without a write), in both tests → 4
- [minor] Description — SPEC Success signal's "every P5 row covered" clause is entry 15's Done when 1 audit → 5
- [minor] Description — `waitForDictionary(page, 'ready')` before Validate (place.spec.ts precedent) → 6
- [minor] AC literal — `version` 1, `seed` 1, `gaveUp` false (the fixture's); the fixture's first move copied verbatim → 7
- [minor] AC R-80 — drop `view.ts:259` line ref (cite R-80); +9 now asserted in item 1 → 8
- [minor] References/AC — drag geometry and hold/move helpers as local copies from e2e/free-letter.spec.ts and e2e/tile-drag.spec.ts; "no new helper" → "no new e2e/helpers module" → 9 (default applied)
- [minor] Description — pin drag gestures: tray tile 28 into the gap before 9; strip tile 28 into gap 0 → 10 (default applied)
- [minor] Description — defect scope "(src/ui/, e2e/)" narrower than epic Boundaries: add src/main.ts wiring → 11
- [minor] Notes guard — renaming the start edits SPEC.md/epic (outside Boundaries): record the rename for close-out in the plan, flagged for the owner, instead of editing them → 12 (default applied)
### Default applied (technical)
- drag helpers → local copies, no new e2e/helpers module
- drag gestures → tray 28 before 9, strip 28 to gap 0
- fallback rename → recorded in the plan for owner close-out, SPEC/epic untouched
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none (duplicates merged: entry-13 ×2, waitForDictionary ×2, persist-nothing ×3, +9 ×2, DOM order ×2, version/seed ×2)
