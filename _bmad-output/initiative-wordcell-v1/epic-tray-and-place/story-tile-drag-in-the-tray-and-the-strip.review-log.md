# Review log — story-tile-drag-in-the-tray-and-the-strip.md (ticket 5.7)

State: pass 2: done

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
