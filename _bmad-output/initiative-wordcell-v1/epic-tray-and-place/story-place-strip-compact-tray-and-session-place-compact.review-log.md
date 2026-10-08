# Review log — story-place-strip-compact-tray-and-session-place-compact.md (ticket 5.2)
State: pass 2: done

Mode: docs, thorough, max 7. Pass 0: 411 words (`.passes/pass0.md`), HEAD f0a0cc3. Intent fields from tickets.toml entry 2 (unknown, interface, tests, owns, consumers): `.passes/intent.md`.

## Pass 1 — 2026-10-08
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 8, minor 5, decision-needed 0  |  Dropped in triage: 0 (duplicates merged across the four lenses)
Words (docs): 899 (2.19 x pass 0)  |  Snapshot: .passes/pass1.md, fix diff .passes/pass1.fix.diff
Fixer: all 12 applied; facts checked against fixtures/ and src (redo-tail placementOrder [9,32,28], word ONE; card 28 from cell 3; PlaceView.target); no runnable command added
### Applied
- [major] Description — tickets.toml intent fields interface, tests, owns, consumers missing (interface also lacks WordLine.svelte, Card.svelte) → fixer item 1
- [major] AC — 5.1 plan `deferred` hand-off (R-36 QU = 2, R-37 QU uppercase, R-30 QU order on session-place-compact after one Undo) missing → fixer item 2
- [major] AC — no AD-14 52 live elements on session-place-compact; no R-51 strip-vs-word-line order check on a fixture where they differ → fixer item 3
- [major] Description/AC — `↩` needs tile selection (CAP-4's P5, SPEC CAP-1) → fixer item 4
- [major] AC/Notes — fallback fixture unnamed, AC unsatisfiable on the fallback branch → fixer item 5
- [major] Description — serialize.test.ts also needs ValidName + PROPERTIES defining property; AD-17 test holds a sorted name list and "eleven" wording; row break undefined (7 per row, DESIGN Tray band) → fixer item 6
- [major] Description/AC — placeMeta inputs (n, cell, delta) unnamed, `n = 1` ambiguous; meta never checked where letters ≠ tiles (QU) → fixer item 7
- [major] AC — A-D10 full-height origin tag top-left untested → fixer item 8
- [minor] compact rows and per-row D segments already exist from 5.1; no TRAY_ROWS/band change → item 9
- [minor] compact-strip screenshot fixture/phase/projects unstated → item 10
- [minor] "epic 3 regeneration rule" without a pointer → item 11
- [minor] S14 browser check evidence unstated → item 12
### Default applied (technical)
- Row break = after tray index 6 at 7 tiles per row (android, DESIGN.md Tray band 360/412 px)
- Fallback fixture name `session-composing-compact-<condition>.json`, same VALID/REBUILDS/PROPERTIES/AD-17 treatment
- placeMeta(n = draft.letterCount, cell = place.target, delta = place.scoreDelta), count part via letters(n)
- Screenshot: a `place-compact` row in e2e/board.screens.spec.ts on both projects, container baselines
- S14 discharged by the android P5 tests plus the screenshot, recorded in the plan
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Pass 2 — 2026-10-08
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 5, minor 6, decision-needed 0  |  Dropped in triage: 1 (+ duplicates merged)
Words (docs): 1018 (2.48 x pass 0)  |  Snapshot: .passes/pass2.md, fix diff .passes/pass2.fix.diff
Fixer: all 11 applied; item 2 formula corrected by the fixer to |arrangement| + destinationCount ≥ 8 (block must reach index 7; checked against trayOrder); card 9 confirmed as the redo-tail D card; no runnable command added. Document now at its growth budget: further minors only when word-neutral.
### Applied
- [major] Description/AC/Notes — PROPERTIES and AC bullet 2 pin the QU condition on session-place-compact, contradicting the `qu` fallback; fallback has no PROPERTIES entry → fixer item 1
- [major] Description — "tray indices 6 and 7" is UI trayOrder, not expressible in the engine PROPERTIES test (AD-1), and over-narrow (forces k = 2, 8 tiles) → fixer item 2
- [major] Description — `↩` render handed to entry 5, but SPEC CAP-1 puts the render in CAP-1 (only the P5 moves); entry 5 never says it renders it → fixer item 3
- [major] AC — 5.1 interim tests e2e/tray.spec.ts:140 (compact no-tag) and :203 (Place empty rows) assert the opposite of 5.2; not named for rewrite → fixer item 4
- [major] AC — Place D cards as normal tiles (no lock/outline) and no word-line underline untested → fixer item 5
- [minor] Description — "no `trayGrowth`" (pass-1 fixer claimed no TRAY_ROWS exists; it does, src/ui/layout/layout.svelte.ts:67) → item 6
- [minor] `(+n, ±0, −n)` parenthetical attached to letters(n) instead of delta → item 7
- [minor] "eleven" → new count; new names appended at the end of VALID → item 8
- [minor] corner-position assertion method default (mark's box centre in the named quadrant of the tile face) → item 9
- [minor] meta literal per fixture recorded in the plan → item 10
- [minor] "the Place variants, proven on the row break" unclear → item 11
### Default applied (technical)
- Only fallback is `session-composing-compact-block.json`; session-place-compact always carries the QU free letter from a cell ≠ 3
- Block-crossing property in Session terms (side right: |arrangement| ≤ 6 < |arrangement| + k; side left: k ≥ 8)
- `↩` slot rendered here as a Card.svelte prop nothing sets yet; entry 5 wires and asserts it
- Corner marks asserted by bounding-box quadrant; no px literals (epic 4 F11)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- R-33 (UI) test-name cites a sentence it does not prove — stretch; matches the 5.1 precedent and the tickets.toml tests field
