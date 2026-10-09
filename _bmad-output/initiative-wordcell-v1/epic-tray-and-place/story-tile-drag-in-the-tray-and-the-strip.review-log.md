# Review log — story-tile-drag-in-the-tray-and-the-strip.md (ticket 5.7)

State: done (converged)

Mode: docs, thorough, max 7. Pass 0: HEAD 94c59e9, .passes/pass0.md, 441 words (budget 2.5x ≈ 1100).
Intent extras (tickets.toml entry 7, not copied into the ticket; fixer adds them to Description in pass 1): interface, tests, owns, consumers.

## Pass 1 — 2026-10-09
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 14, minor 6, decision-needed 0  |  Dropped in triage: 0 (+ ~25 duplicates merged)
Words (docs): 1396 (3.17 x pass 0; over the 2.5x budget, the entry 7 intent lines ≈ 230 words of it)  |  Snapshot: .passes/pass1.md, fix diff .passes/pass1.fix.diff
Fixer: all 18 applied; added the drag-layer classes.ts class to the Interface exception (own addition); storageState alternative stays `unverified` per SPEC CAP-5; no commands run.
### Applied
- [instr] Description — add tickets.toml entry 7 interface, tests, owns, consumers → fixer item 1
- [major] Description — dragged face clipped by `.tiles` `overflow: hidden` (TileRows.svelte:87); drag-layer rule scoped to Column.svelte:220; origin slot look → 2
- [major] Description — parting lifecycle beyond the first parting (gap/acceptance change, each end, finish on pointerdown/cancel()) → 3
- [major] Description — parting gate counting and release order (clearDrag one call, gate.leave() before dispatch, entry 16 capture seam); landing glide is entry 16's, not 10's → 4
- [major] Description — release on last-shown acceptance/gap vs recomputed at pointerup → 5
- [major] Description — entry 6 functions and run args (first/count per phase) not named; re-derivation risk → 6
- [major] Description — tray band registration per AD-12 (`use:dropTarget`, `DropTargetParams` is column-only) vs "no new exports"; tile Drag variant and flyBack fit → 7
- [major] AC — missing tests: R-73 reorder saved, act() mid-drag (S + P5), pointercancel P5 + lostpointercapture, R-32 mirrors untouched and no gap inside the block → 8
- [major] Description — "act() ... with no dispatch" ambiguous (act()'s handler dispatches) → 9
- [major] AC — slotRects geometry check not implementable as written (args, parted slot, timing, tolerance) → 10
- [major] AC — F4 clip case has no setup or outcome → 11
- [major] AC — P5 cases without fixtures (free letter in Composing, block, hide, back, past-block expected order) → 12
- [major] AC/Notes — F25 scope (block within one row) and owner hand check of the wrapped block missing → 13
- [major] Notes — open question for an unattended build; settle with SPEC CAP-5 default + fallback → 14
- [minor] Description — platform cancel names pointercancel/lostpointercapture, no restore (F18) → 15
- [minor] Description — 4 px lift at the threshold; "no Svelte state" vs F18 clear → 16
- [minor] AC — AD-10 parting Vitest already satisfied by motion.test.ts; make it controller-level → 17
- [minor] Notes — third compact row targetable until CAP-9 (accepted interim) → 18
### Default applied (technical)
- Drag layer — controller class on `.tiles` lifts the clip while a tile drag is active; TileRows-scoped `.face.wc-drag-layer` rule as Column's; origin slot empty → default taken
- Parting — every change animates from the current transform over `duration('parting')`, end written inline, snap under reduced motion; no-edit release/platform cancel return parted tiles over parting with the flyBack; edit release, hide, act() clear at once → default taken
- Gate — parting/return animations gate-counted; release: finish, clearDrag (one call), gate.leave(), dispatch → default taken
- Release — last pointermove's acceptance and gap (as epic 4's last-shown highlight) → default taken
- Tray drop target — widen `DropTargetParams` with a `kind: 'tray'` on `[data-band="tray"]`, rect clipped by visible-band `clip`, one drop-target.ts accessor (AD-12 wins over the interface clause) → default taken
- Lift — drag transform carries the lift (epic 4 F32/F33) so no jump; fly-back lands unlifted → default taken
- Fixtures — free letter: session-place-free-letter-redo-tail + one Undo; block/hide/back: session-composing; past-block: tile 42 → arrangement [0, 42]; parted geometry: session-place-compact across a row break → default taken
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none (duplicates merged)

## Pass 2 — 2026-10-09
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 8, minor 9, decision-needed 0  |  Dropped in triage: 0 (+ ~12 duplicates merged)
Words (docs): 1506 (3.41 x pass 0)  |  Snapshot: .passes/pass2.md, fix diff .passes/pass2.fix.diff
Fixer: all 16 applied; minors 11, 14, 15 a few words over neutral; no commands added.
### Applied
- [major] Description lift — "as epic 4's `lift`" points at `.lifted`/`SELECTION_LIFT_PX` (8 px, controller.ts:454); a tile's lift is F2's 4 px `.selected` CSS → fixer item 1
- [major] Drag layer — "every drag end removes both" would unclip a flying-back face; `clearDrag` removes them (at the fly-back's settle) → 2
- [major] Geometry — `innerWidth` is the tray inner width (Board.svelte:61 `metrics.board − 16`), not `window.innerWidth`; controller source unnamed; tileCount includes mirrors → 3
- [major] AC — `elementFromPoint` can never return a face (`.face { pointer-events: none }`, Card.svelte:174) → computed-style checks → 4
- [major] Parting — parted faces returning on a no-edit release at 0.5 × base contradicts EXPERIENCE.md Motion F17 line (release card moves 1 × base) → 5
- [major] AC — tray and strip drag-reorder name no drag and no expected order (equality passes with no dispatch) → 6
- [major] AC — k = 2 block case names no tile; tile 0 gives no parting and no edit → tile 42, [0, 42] → 7
- [major] Parting — superseded running parting animation: gate leak / fly-back cancel throw → 8
- [minor] Release bullet scoped to an edit → 9
- [minor] F4 clip bullet: share of the face's area → 10
- [minor] Notes third row: clipped at rest, shown over the control row while a drag lifts the clip → 11
- [minor] `cancel({ byBack: true })` counts as a platform cancel → 12
- [minor] Parting "every other movable face" → 13
- [minor] hidePage case asserts the settle (nothing selected, no residue) → 14
- [minor] under-25 % release names session-place → 15
- [minor] Consumers "list in the ticket review" (epic file L1) → 16
### Default applied (technical)
- Lift — measured at drag start (rest slot top minus the face's measured top: 4 px when selected, else 0), no new constant; fly-back non-restoring → default taken
- Clip/layer removal — in `clearDrag` → default taken
- Tray sizing — controller deps getter for `w` and the tray inner width, Board's `metrics.board − 16` expression in one place → default taken
- Drag-layer proof — computed z-index 5 and shadow on the dragged face, `.tiles` overflow visible, face over the action bar (epic 4 drag-interruptions.spec.ts pattern) → default taken
- Release return — parted faces return with the dragged face's `flyBack` (1 × base, its reduced-motion treatment); `duration('parting')` only while held → default taken (per EXPERIENCE.md Motion)
- Reorder fixtures — session-composing tile 0 to gap 0 → [0, 42]; session-place tile 28 to gap 0 → [28, 42, 0] → default taken
- Superseded parting — one gate count for the parting set while any runs; a superseded face animation is read, cancelled without settling and replaced; Vitest: two gap changes within one parting duration then release → gate idle → default taken
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none; unapplied (over budget, adds words): re-measure `origin` per move for a desktop wheel scroll mid-drag (adversarial minor) → for the plan

## Pass 3 — 2026-10-09
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 5, minor 13 (8 to the fixer, 5 unapplied), decision-needed 0  |  Dropped in triage: 1 (+ ~5 duplicates merged)
Words (docs): 1597 (3.62 x pass 0)  |  Snapshot: .passes/pass3.md, fix diff .passes/pass3.fix.diff
Fixer: all 12 applied; +91 words from the majors, minors word-neutral; orders checked against fixtures and `reorder`; no commands added.
### Applied
- [major] AC session-composing — past-block case can follow the k = 2 case that already stored [0, 42] (vacuous) → fresh session-composing → fixer item 1
- [major] AC — rule-coverage R-34 row asks drag-reorder of free-letter tiles; none (fixture arrangement [32, 28], 28 free from cell 3) → 2
- [major] AC Geometry — rule-coverage AD-12 row "wrapped rows by distance" (S + P5) has no P5 with a named gap and stored order → session-place-compact tile 35 → gap 7 → [1, 38, 44, 11, 36, 9, 35, 7] → 3
- [major] Description — desktop hover classes / k-hover / hover peek during a tile drag unspecified; entry 5 tests (controller.test.ts:3430, :3449) and header pin the interim → 4
- [major] Parting — "return with the dragged face's flyBack" reads as joining fly-back.ts's single-offset flight (throws when busy); return animations not finished by pointerdown/cancel() → 5
- [minor] Parting "or a platform cancel" → "or any fly-back end" → 6
- [minor] AC hidePage "as the Undo case does" contradicts "no dispatch"; select a tile first in hidePage and pointercancel cases → 7
- [minor] Drag layer class gets the `wc-drag-` prefix so `expectNoResidue` (e2e/helpers/drag.ts:8) covers it → 8
- [minor] AC Geometry "(mirrors included)" holds only for a one-tile block (Card.svelte:248-262) → 9
- [minor] AC block drag "no transform to any mirror" → "to any tray face" (R-32 (UI) moves nothing) → 10
- [minor] Drop target — `columnTargets()` still returns columns only; one tray registration (a second throws) → 11
- [minor] Lift measured before the F18 clear → 12
### Default applied (technical)
- Hover — a tile drag clears hover classes and closes the hover peek at its threshold and recomputes hover at its end or the fly-back's settle, as the column drag; supersedes entry 5's "tile press does nothing at any end" test, the pointerup k-hover repaint test for a crossed tile press, and the header sentence → default taken
- Return — the parted faces return by their own WAAPI animation from their current transform to rest with `duration('flyBack')` and the fly-back's reduced-motion treatment; `drag.faces` stays the dragged face; pointerdown and cancel() finish parting and return animations → default taken
- Wrapped-row case — session-place-compact (Place, 7 + 1 at 412), tile 35 held left of tile 7 on row 2 (gap 7), parted faces per partingOffsets for gap 7, stored placementOrder [1, 38, 44, 11, 36, 9, 35, 7] → default taken
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Cut `cancel({ byBack: true })` as unreachable (adversarial) — a mid-drag Forward popstate reaches it through nav's registerBeforeBack (main.ts:140); keep
### Unapplied minors (over budget, for the plan)
- Release: finish settles the parting gate count synchronously (as `finishFlight`); the AD-11 Vitest forces it
- Same-id pointerdown and detach ends: snap at once as epic 4's other ends
- Strip marks (bottom/top, ★, origin tags) travel with their faces mid-drag and update at release
- F4 setup: concrete viewport/scroll (e.g. 412 × 600, scrollY 0, band bottom under the action bar), premise-asserted
- Re-measure `origin` per move for a desktop wheel scroll mid-drag (from pass 2)

## Pass 4 — 2026-10-09
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment (late bar)  |  Findings: major 4, minor 12 (7 to the fixer, 5 unapplied), decision-needed 0  |  Dropped in triage: 1 (+ ~3 duplicates merged); 2 reviewer majors downgraded to minor under the late bar
Words (docs): 1683 (3.82 x pass 0)  |  Snapshot: .passes/pass4.md, fix diff .passes/pass4.fix.diff
Fixer: all 10 applied; item 1 verified by running the real gapRects/partingOffsets/reorder on the fixture order (gap 8: tile 7 to slot 6; reorder → [1, 38, 44, 11, 36, 9, 7, 35]); the mid-drag premise scoped to live-tile drags (the block-mirror drag moves no face); +86 words, mostly majors.
### Applied
- [major] AC Geometry — the pass 3 wrapped-row case (tile 35 → gap 7) parts only row 1 (partingOffsets: position 7 keeps its slot), undoing pass 1's "parting across a row break", entry 6's deferred check → gap 8, tile 7 to row 1's last slot, [1, 38, 44, 11, 36, 9, 7, 35] → fixer item 1
- [major] AC UI Vitest — `cancel({ byBack: true })` tile-drag fly-back untested (Tests line: back S + P5; P5 goBack reaches the hide flush's plain `cancel()`); cancel() snap vs byBack fly-back indistinguishable → 2
- [major] Parting — rest not defined as inline transform removed; an inline `translate(0px, 0px)` beats `.card.tile.selected .face` (Card.svelte:271), losing a later selection's lift; no-edit P5 cases check no residue → 3
- [major] Hover — new desktop hover behaviour has no test though it supersedes controller.test.ts:3449; "closes the hover peek at its threshold" contradicts the pick-up drag (hides at the threshold, closes at end, controller.ts:82-83, 636-637) → 4
- [minor, downgraded] AC no-edit P5 cases pass without a wired drag → assert the drag premise mid-drag (dragged face `wc-drag-layer` + inline transform) → 5
- [minor, downgraded] Interface exceptions vs the gestures/tile.ts option and the tray-inner-width getter → 6
- [minor] Drop target — acceptance through `pickTarget` (area/intersection are private) → 7
- [minor] AC block-mirror — "no inline transform on any tray face" (the selected tile keeps its CSS lift) → 8
- [minor] Description — "otherwise" → "any other release flies the tile back" → 9
- [minor] AC R-33 — release over its own WordCell (cell 3), stored Session byte-identical → 10
### Default applied (technical)
- Cross-row case — session-place-compact tile 35 held on row 2 past tile 7 (gap 8), release [1, 38, 44, 11, 36, 9, 7, 35] (checked with `reorder` and `partingOffsets`) → default taken
- byBack Vitest — mid-drag (parted) `cancel()` clears every transform at once; `cancel({ byBack: true })` starts the fly-back and parting return with nothing selected; neither dispatches → default taken
- Rest — rest means the inline transform removed (`''`, as fly-back.ts); pointercancel and under-25 % P5 cases end with `expectNoResidue` → default taken
- Hover — hides the hover peek at the threshold (DOM only), closes it at the end, hover classes cleared and recomputed at the end or the fly-back's settle; a UI Vitest AD-12 replaces controller.test.ts:3449 → default taken
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- "its start-of-row-2 rect" for gap 7 (fix diff minor) — moot with gap 8
### Unapplied minors (over budget, for the plan)
- Exactly-25 % inclusive acceptance Vitest for the tray (`MIN_RATIO` inclusive)
- R-71 own-gap case: name the tile and gap j; assert Redo enabled before the drag; same for the session-place under-25 % case
- "Single target": hold the tile over a column first and assert no `wc-drag-target`
- drop-target.test.ts: one tray registration read by the accessor, a second throws
- Reorder cases: centre the held face on the named gap's `gapRects` rect, from the rendered tray

## Pass 5 — 2026-10-09
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment (late bar)  |  Findings: major 2, minor 16 (7 to the fixer, 9 unapplied or accepted), decision-needed 0  |  Dropped in triage: 0 (+ ~5 duplicates merged)
Words (docs): 1703 (3.86 x pass 0)  |  Snapshot: .passes/pass5.md, fix diff .passes/pass5.fix.diff
Fixer: all 9 applied; +20 words from the majors, minors net negative; used-cell check cites board-phases.spec.ts `expectUsedCell3` (a local function).
### Applied
- [major] AC — the edit-release cases (R-34, R-51, R-34 free letter, k = 2 mid-block, past-block, cross-row) and the App-button case never check residue; a leftover inline parting transform on a kept node renders a tile a slot off → end each with `expectNoResidue` → fixer item 1
- [major] AC R-33 — pass 4's rewording dropped "its cell still used" (rule-coverage R-33 row; tickets.toml entry 7 verify) → restore cell 3 still shown used → 2
- [minor] Geometry — tray inner width: Board's `metrics.board − 16` moved to one getter Board reads → 3
- [minor] AC — the mid-drag premise parenthetical moves to the "Verify:" line so it binds every bullet → 4
- [minor] Interface — "the drag-layer class" (DRAG_LAYER already exists) → "the `.tiles` clip class" → 5
- [minor] AC back case — `expectLeaves` lives in e2e/helpers/dialogs.ts and does the back itself → 6
- [minor] Parting — "pointerdown" → a new press's pointerdown (button 0, no active press, as the fly-back finish) → 7
- [minor] Notes — "a third compact row" → "compact rows past the second" (R-37 up to 22 tiles) → 8
- [minor] AC hidePage — "no dispatch" is unobservable as byte-identical (the hide flush rewrites activeMs) → stored Session equal to the pre-drag one bar `activeMs` → 9
### Default applied (technical)
- Edit-case residue — `expectNoResidue` after each edit release (valid at once: no glide until entry 16) and after the App-button case → default taken
### Decision needed (functionality / UX / gameplay)
- none
### Dropped / accepted
- Interface intent text condensed in pass 4 (parenthetical cut, "5–6") — accepted: each part has its own bullet
### Unapplied minors (over budget, for the plan)
- Hover Vitest also asserts the peek closes at the drag's end and hover repaints at an edit release's end
- Lift no-jump Vitest: a selected tile's first drag transform is translate(dx, dy − 4)
- k = 2 hold: no inline transform on any mirror
- tile.ts stays pure; the DOM/WAAPI path lives in the controller (tile.ts at most a pure release helper)
- F4 "parts nothing" read once animations finish or under reduced motion
- R-32 block on the left covered by entry 6's Vitest

## Pass 6 — 2026-10-09
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment (late bar)  |  Findings: major 2, minor 16 (8 to the fixer, 8 unapplied), decision-needed 0  |  Dropped in triage: 0 (+ ~2 duplicates merged); 1 reviewer major downgraded (evidence precision of an existing case, late bar)
Words (docs): 1746 (3.96 x pass 0)  |  Snapshot: .passes/pass6.md, fix diff .passes/pass6.fix.diff
Fixer: all 9 applied; +44 words from the majors, minors net −1; Flip order checked with `reorder`; cut "D-block mirrors never move in a reorder" as covered by the run wording (for pass 7 to verify).
### Applied
- [major] AC — no Composing case has the block on the left (both fixtures `destinationSide: "right"`), so the controller's `first` = k derivation ships untested; a wrong `first` makes `reorder` throw (app halts) → session-composing after Flip (D, 42, 0), tile 0 to gap 0 → [0, 42], no inline transform on the mirror while held → fixer item 1
- [major] AC UI Vitest — the parting set's gate count is checked only at an edit release; a leak after a no-edit release, platform cancel or `cancel()` would freeze or throw the next re-layout (AD-11) → extend the AD-11 Vitest → 2
- [minor, downgraded] AC under-25 % case — hold over gap 0 first (tiles parted), move under 25 %, parted faces back at rest before the release → 3
- [minor] Parting — `cancel()` "finishes" parting (leaving the parted end transform inline) vs "clears at once" → cancel() clears parting; pointerdown/cancel() finish return animations → 4
- [minor] Hover clause — "superseding entry 5's crossed-tile-press tests" could delete controller.test.ts:3430's threshold-clear check → keep it → 5
- [minor] Block-mirror drag — "no inline transform on any tray face" read while held past 8 px → 6
- [minor] Past-block — "released right of the block inside the band, storing [0, 42]" → 7
- [minor] Geometry — `reorder(order, …)`: name the run (M or `placementOrder`, never the tray order with mirrors) → 8
- [minor] Geometry / Interface — the tray-inner-width getter is a Layout member Board and the controller deps both read (not a module export) → 9
- [minor] Notes/AC — (none further)
### Default applied (technical)
- Block-left case — Flip on session-composing (tray-controls.spec.ts precedent) → default taken
- Gate Vitest — idle at the edit dispatch, idle once a no-edit release's and a pointercancel's fly-back and returns settle, idle at once after a mid-drag `cancel()` (harness `t.active()`) → default taken
### Decision needed (functionality / UX / gameplay)
- none
### Unapplied minors (over budget, for the plan)
- App-button case: use `+` on session-composing, stored k 2 with arrangement [42, 0]
- Edit releases: read `dragResidue` once without polling right after release (at rest at once)
- Hover repaint on an edit release after the dispatch, as epic 4's drop
- A new press during a return finishes it before the press resolves (Vitest)
- Tray accessor throws on none as well as on a second registration; entry 5 tile Vitests register a tray target in the harness
- Test names: drag-layer and geometry cases tagged AD-12
- Consumers (L1, in the ticket review): fly-back.ts's epic 4 column-drag fly-back; the tray-width getter's Tray/TileRows `trayLayout`

## Pass 7 — 2026-10-09 (verify-only)
Reviewers: fix diff (pass 6 diff only)  |  Findings: major 0, minor 3, decision-needed 0  |  Dropped in triage: 0
Words (docs): 1746 (3.96 x pass 0)  |  Snapshot: .passes/pass6.md (no fix pass)
### Applied
- none (verify-only)
### Decision needed (functionality / UX / gameplay)
- none

## Result — converged after 7 passes
Majors per pass: 14, 8, 5, 4, 2, 2, 0. Decision-needed: none. Technical defaults applied: 27 (see each pass's Default applied). Words 441 → 1746 (3.96x; over the 2.5x budget, the entry 7 intent lines ≈ 230 words of it).

### Unapplied minors (for the build's plan)
- Pass 7: under-25 % case "leaves no other face inline-transformed" (the held face keeps its transform); hover sentence: supersede controller.test.ts:3449 and :3430's end half, keep :3430's threshold clear; locate Flip by its accessible name "Flip" (e2e/tray-controls.spec.ts:20), not "⇄ Flip".
- Pass 6 cut "D-block mirrors never move in a reorder" from Geometry; the rule still follows from "every other movable face" and the Flip case's mirror check; restate SPEC CAP-5 "D-block mirrors never move" in the plan.
- Pass 6: App-button case via `+` on session-composing (k 2, [42, 0]); edit releases read `dragResidue` once without polling; hover repaint after the edit dispatch; a new press during a return finishes it first; tray accessor throws on none or a second registration, entry 5 tile Vitests register a tray target; AD-12 tags on the drag-layer and geometry cases; Consumers (L1) in the ticket review: fly-back.ts's epic 4 column-drag fly-back, the tray-width getter's Tray/TileRows `trayLayout`.
- Pass 5: hover Vitest also asserts the peek closes at the end and hover repaints at an edit release's end; lift no-jump Vitest (translate(dx, dy − 4)); k = 2 hold: no inline transform on any mirror; tile.ts stays pure (DOM/WAAPI path in the controller); F4 "parts nothing" read once settled or under reduced motion; block-left `gapRects` cases stay entry 6's Vitest.
- Pass 4: exactly-25 % inclusive tray acceptance Vitest; R-71 and session-place under-25 % cases name the tile and gap j, Redo enabled before the drag; hold over a column first and assert no `wc-drag-target`; drop-target.test.ts tray registration cases; centre held faces on the named gap's `gapRects` rect.
- Pass 3: release finish settles the parting gate count synchronously (as `finishFlight`); same-id pointerdown and detach snap at once; strip marks travel with their faces and update at release; concrete F4 viewport/scroll, premise-asserted.
- Pass 2: re-measure `origin` per move for a desktop wheel scroll mid-drag.
