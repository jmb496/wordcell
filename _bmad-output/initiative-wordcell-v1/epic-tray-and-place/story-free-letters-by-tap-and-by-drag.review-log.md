# Review log — story-free-letters-by-tap-and-by-drag.md (ticket 5.8)

State: pass 4: done

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

## Pass 2 — 2026-10-09
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 7, minor 11, decision-needed 0  |  Dropped in triage: 1 (F4 clip mapping: plan-only, no ticket change) (+ ~8 duplicates merged)
Words (docs): 1430 (3.00 x pass 0; growth from majors, minors net zero)  |  Snapshot: .passes/pass2.md, fix diff .passes/pass2.fix.diff
Fixer: all 17 applied; `+` named as e.g. (enablement on the fixture not stated); Flip moved to the android bullet opening; no commands added or run.
### Applied
- [major] Description/Interface — Card.svelte renders the lock by `{#if lock}` (Card.svelte:79,130) and `start`/`end` are Svelte class directives, so DOM class writes cannot give a parted segment start its lock; Card.svelte missing from Interface → fixer item 1
- [major] AC — UI Vitest lists the pure parting/segment test entry 6 already built (tray.test.ts:381,406); the controller's parted segment/lock DOM writes are untested and the "else the Vitest above" fallback points at the pure test → 2
- [major] AC Full layout — k = 0 route with no gap named: the end-gap caret (gap moves no tile) passes without exercising "full" → 3
- [major] AC Ends — an App button (`act()`) mid-drag dispatches its own command, so "Session byte-identical" is impossible (entry 7 e2e/tile-drag.spec.ts:546 precedent) → 4
- [major] AC Block right — R-32 outcomes hold only for a block within one row (SPEC F25 nearest gap, may land mid-M), and the same bullet invites a row-break layout → 5
- [major] AC — long-press peek case never asserts the peek opened (rule-coverage R-65: peek stays available) → 6
- [major] Description/AC — hover peek hidden at the crossing and closed at end is stated, desktop-only, untested → 7
- [minor] AC — "storing the index" → the stored arrangement holds cell 7's top at that position in M → 8
- [minor] AC — end gap of M: caret at, and a release into, the end gap (appends) → 9
- [minor] Description — "full" rows: the rows `TileRows` renders (= `trayLayout` rows once CAP-9) → 10
- [minor] Interface — reuse `DRAG_GHOST` for the cell ghost; new constants for caret and parted segments → 11
- [minor] Description — dragged cell face takes `DRAG_LAYER` as the tile drag → 12
- [minor] AC — hidePage comparator: the pre-drag Session stored bar `activeMs` (as entry 7) → 13
- [minor] AC — tap-add with a tile selected first, nothing selected after → 14
- [minor] AC — mid-drag ghost: badge still counts, card beneath not shown → 15
- [minor] AC — `⇄ Flip as needed` covers both block sides; end-gap caret with tiles untransformed → 16
- [minor] Description — "Consumers (list in the ticket review)" → "Consumers:" → 17
### Default applied (technical)
- Parted segments — Card.svelte renders the lock svg on every block mirror, shown by CSS (resting `.start` or a controller parted-start class); controller toggles classes.ts parted classes (`wc-part-start`/`wc-part-end`) overriding `.start`/`.end`, never Svelte's own → default taken
- Tests — controller UI Vitest `AD-12`: block-right free-letter drag across a row break writes parted segment/lock classes and restores them; entry 6 tray.test.ts keeps the pure offsets → default taken
- act() mid-drag — App button settles the drag at once and stores only its own command, cell 7 not used, nothing selected → default taken
- Hover peek — one desktop Playwright case (hover cell 7, drag its top: peek hidden mid-drag, closed after, drop lands) → default taken
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- F4 clip of the tray band for the free-letter drag: covered through entry 7's shared `trayTarget()` clip test; belongs in the plan's sentence → test mapping, no ticket text

## Pass 3 — 2026-10-09
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 3, minor 11, decision-needed 0  |  Dropped in triage: 1 (+ ~5 duplicates merged)
Words (docs): 1426 (3.00 x pass 0)  |  Snapshot: .passes/pass3.md, fix diff .passes/pass3.fix.diff
Fixer: all 11 applied; `svg.lock:visible` and `wc-parted` `unverified` (design statements; drag.spec.ts:241 uses `.lock`, keep its selector plus `:visible`); "card mode 1" dropped (trayLayout returns 1 row in card mode).
### Applied
- [major] Description Mirror segments — `wc-part-start`/`wc-part-end` alone cannot unmark a resting `.start` that is no start once parted (block wrapping at rest, break moves): need one parted marker under which CSS ignores `.start`/`.end`; Vitest must use a block wrapping at rest at a different break → fixer item 1
- [major] Description Mirror segments — lock svg on every block mirror breaks existing lock-node count assertions (e2e/board-phases.spec.ts:278-279,412-416, drag.spec.ts:241) so test:all cannot go green as written → 2
- [major] Description "full" — pass 2's "rows `TileRows` renders (`trayLayout`'s once CAP-9 lands)" invites the visible-rows reading (15–20 tiles: caret vs parting); TileRows already renders `trayLayout(tiles.length).rows` → 3
- [minor] Description ghost clause — "badge still counting it" ambiguous → 4
- [minor] AC Full layout / Notes — perRow 7 at 412 px settles the route; cut the session-composing-long.json fallback, Notes settled → 5
- [minor] Description — "dispatch nothing" → inert (EXPERIENCE.md Phase matrix) → 6
- [minor] Description — drop the Place parenthetical in the Composing sentence; tile selection follows `tileTap` as built (F13) → 7
- [minor] Caret — hides at a parting gap too; parted tiles return to rest over `parting` when the caret takes over → 8
- [minor] Interface — WordCellRow.svelte styles `DRAG_GHOST` and `DRAG_LAYER` (as Column.svelte) → 9
- [minor] AC Desktop — "the insert stored"; "In Composing (as above)" → 10
- [minor] AC Block right — cut the row-break conditional; the controller Vitest is the coverage (SPEC CAP-6) → 11
### Default applied (technical)
- Parted segments — one classes.ts marker (e.g. `wc-parted`) on every block mirror while parted; under it CSS reads only `wc-part-start`/`wc-part-end`; Vitest: block wrapping at rest, wrapping at a different break when parted, the resting start loses its lock → default taken
- Lock nodes — existing lock-count assertions switch to visible-lock counts (`svg.lock:visible`) with the same expected numbers → default taken
- Full — `perRow` × `trayLayout(tileCount).rows` (the grid rows TileRows renders; card mode 1; a third row clips until CAP-9) → default taken
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Ghost on the top card's wrapper instead of the cell wrapper: build-notes CAP-6 already says "controller class on the cell wrapper"; the builder follows the ref
### Not applied (over budget, to the plan's sentence → test mapping)
- References: name SPEC CAP-6/F5/F16/F18 and DESIGN.md WordCell
- Caret at a row-break gap's winning rect: no test case
- Long-press then moved into the tray band and released: no test case

## Pass 4 — 2026-10-09
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 1, minor 12, decision-needed 0  |  Dropped in triage: 0 (+ 4 duplicates merged)
Words (docs): 1431 (3.01 x pass 0)  |  Snapshot: .passes/pass4.md, fix diff .passes/pass4.fix.diff
Fixer: all 9 applied; `:visible` marked `unverified` in the ticket; parted classes off "when parting stops and at every end".
### Applied
- [major] Description Mirror segments — lock-count list omits e2e/tray.spec.ts:242,447 (`.lock` toHaveCount 1 and 2 on 2- and 3-mirror blocks), so test:all fails with every-mirror lock nodes; selector not marked unverified in the ticket → fixer item 1
- [minor] AC UI Vitest — controller Vitest runs in node without CSS: assert class state (resting start without `wc-part-start` under the marker), not lock visibility → 2
- [minor] Mirror segments — parted marker/classes come off whenever the mirrors return to rest (under 25 %, outside the band), not only at ends → 3
- [minor] Ends — caret hides at the end itself (Caret bullet), only the ghost clears at the settle → 4
- [minor] Ends — `cancel({ byBack })` unreached in Composing (F5: back leaves the app); cut → 5
- [minor] Ends — App button must be enabled (`+` disabled at k = 0; SPEC CAP-4) → 6
- [minor] AC Full layout — "the caret at that gap"; cut "(a third row clips until CAP-9)" (8 tiles = 2 rows) → 7
- [minor] AC — end-gap caret cases need room (a short tail), distinct from the full-layout route → 8
- [minor] AC R-32 — "over or past the block" inside the band (≥ 25 %) → 9
### Default applied (technical)
- Lock counts — every existing e2e tray lock-count assertion (board-phases, drag, tray specs) adds `:visible` to its own lock selector, same numbers (`unverified`) → default taken
### Decision needed (functionality / UX / gameplay)
- none
### Not applied (over budget, to the plan)
- Free-letter drag lifts the `.tiles` clip (`DRAG_TILES`) as the tile drag, so edge carets are not clipped ("as entry 7's tile drag" covers it)
- Full-layout route as "perRow card-mode tiles (7 at 412 px)"
- Done when 4: how P5 tells the parting transform from other motion (one pitch while parted, none after)
- hidePage / back cases: also assert nothing selected and cell 7 unused (F18)
