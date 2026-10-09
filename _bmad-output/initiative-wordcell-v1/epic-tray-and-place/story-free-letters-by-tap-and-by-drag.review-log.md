# Review log — story-free-letters-by-tap-and-by-drag.md (ticket 5.8)

State: pass 1: done

Mode: docs, thorough, max 7. Pass 0: HEAD 968b3e7, .passes/pass0.md, 476 words (budget 2.5x ≈ 1200).
Intent extras (tickets.toml entry 8, not copied into the ticket; fixer adds interface, tests, owns, consumers to Description in pass 1; unknown is already in Notes).

## Pass 1 — 2026-10-09
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 12, minor 8, decision-needed 0  |  Dropped in triage: 0 (+ ~30 duplicates merged)
Words (docs): 1307 (2.75 x pass 0; the entry 8 intent lines ≈ 228 words of it)  |  Snapshot: .passes/pass1.md, fix diff .passes/pass1.fix.diff
Fixer: all 19 applied; Description and Verify split into bullets as entry 7; Notes open question reworded as settled by default with fallback; no commands added or run.
### Applied
- [instr] Description — add tickets.toml entry 8 interface, tests, owns, consumers → fixer item 1
- [major] AC — session-composing has no committed move, so no WordCell can lend a free letter; block-right mirror case unrunnable → 2
- [major] Description/AC — SPEC CAP-6 parted mirrors' segment ends and locks from parted slots (entry 6 left `mirrorBySlot` to entry 8) dropped; no S/P5 test → 3
- [major] Description — caret mechanism (DOM-only mid-drag, which rect at a row-break gap, hide/clear) unspecified → 4
- [major] Description — no-edit release and F5 ends (flyBack, settle-at-once, ghost/caret clear), edit release order, parting duration/reduced motion unspecified → 5
- [major] AC — free-letter cancel paths pointercancel/lostpointercapture and act() mid-drag (S + P5), F18 clear at threshold (S) untested → 6
- [major] AC — R-32 free letter never inside or beyond the block untested → 7
- [major] AC — epic Done when 4 share (52 data-card-id mid-drag and after; mirrors parting only) not verified → 8
- [major] Interface — "no new exports" vs classes.ts constants and a free-letter run helper (tileRun throws for a WordCell card) → 9
- [major] Description/AC/Notes — "full" ambiguous (which count, rows) and Verify pins the full caret to a fixture the Notes doubt → 10
- [major] AC — long-press peek checks selection only, not "no dispatch" (SPEC CAP-6 P5) → 11
- [major] AC — drag-insert lacks the cell-used check; mid-drag ghost without used state (R-33 UI) → 12
- [major] Description — consumers (long-press peek, sticky view, hover peek, entry 9 target tap) and coexistence unspecified → 13
- [minor] AC — split hidePage and goBack clauses (as entry 7) → 14
- [minor] Description — tray band clipped (entry 7 `trayTarget()`) → 15
- [minor] Description — tap-add clears a tile selection (tileTap) → 16
- [minor] Description — "inert" outside Composing: tile selection per tileTap/F13 → 17
- [minor] Description — drag start on any part of the cell hit → 18
- [minor] Description — count badge keeps counting the dragged card (R-61) → 19
- [minor] AC — name the drops for block left / k = 0 / block right; tap-add and drag-insert from separate loads → folded into 2/10
- [minor] AC — full-layout drop asserted by stored Session (third row clipped before CAP-9) → folded into 10
### Default applied (technical)
- Block-right fixture — session-idle-empty-column + a drop onto a non-empty column with the block on the right (Flip as needed), cell 7's top dragged → default taken
- Caret — TileRows renders one hidden caret element; controller shows/positions it by DOM at the winning `insertionIndex` rect; hidden under 25 % and at every end → default taken
- Parted segments — controller writes mirrors' segment/lock classes from `segmentEnds` over the parted `mirrorBySlot`, DOM only, restored at every end → default taken
- Ends — as entry 7: no-edit release/pointercancel/lostpointercapture/cancel byBack fly back (`flyBack`); hide/act() settle at once; edit release finish → clear → gate.leave → dispatch, no landing glide (entry 16) → default taken
- Interface — no new engine (AD-2) exports; classes.ts constants and a pure tile.ts free-letter helper allowed → default taken
- Full — current tile count (S + F + D mirrors) + 1 > perRow × trayLayout(tileCount).rows (card mode one row); route on existing fixture first, session-composing-long.json fallback per Notes → default taken
- Hover peek — as the tile drag: hidden at the crossing, closed at end → default taken
### Decision needed (functionality / UX / gameplay)
- none
