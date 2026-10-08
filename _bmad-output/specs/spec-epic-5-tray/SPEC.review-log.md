# Review log — spec-epic-5-tray SPEC.md

State: pass 3: review (diverging; no fix)

Target: `_bmad-output/specs/spec-epic-5-tray/SPEC.md` (docs mode, thorough, max 7); fixer may edit companions `build-notes.md`, `rule-coverage.md`.
Pass 0: HEAD 4b02f6e; copies `SPEC.review-log.passes/pass0.{SPEC,build-notes,rule-coverage}.md`; words SPEC 3851, build-notes 2021, rule-coverage 2041 (budget ~2.5x per file).

## Pass 1 — 2026-10-08
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 18, minor 16, decision-needed 1  |  Dropped in triage: 2 (merged duplicates not counted)
### Applied
- [major] CAP-8/F6/F7, build-notes CAP-8 — FLIP kind cannot come from a view diff (drop vs Redo of a drop both Idle→Composing); "the one dispatch helper" undefined → fixer 1
- [major] CAP-8/F6 — FLIP must animate the face, not the `data-card-id` wrapper (hit rects, settled-state press resolution) → fixer 2
- [major] CAP-5/F3, build-notes CAP-5 — `insertionIndex` gap geometry, row-break gaps, distance, tie-break and index counting (with or without dragged tile) undefined → fixer 3
- [major] F3 vs build-notes CAP-5 — strip (Place) has every card movable, gaps 0…n; F3 states only the Composing rule → fixer 4
- [major] CAP-1/R-50/Assumptions — no compact Place fixture (corner map) and no Composing compact marks incl. `QU` (also D19) → fixer 5
- [major] Success signal — "same Session" fails on `activeMs` → fixer 6
- [major] F15/CAP-2/R-38 row — one-run guard is a no-op under synchronous dispatch + flushSync; untestable → fixer 7
- [major] CAP-10/build-notes CAP-10 — guard removed at settle by the second tap's pointerdown, its click then hits New game → fixer 8
- [major] CAP-7/rule-coverage R-41, R-42, R-51, R-61 — named Place fixtures have L = 3, only legal target already set; redo-tail free letter source = target (R-61 exception) → fixer 9
- [major] CAP-8/CAP-9 — order of band re-layout vs FLIP for non-drag edits unspecified → fixer 10
- [major] OQ-1 — stated effect wrong: D-block copies are mirrors and never animate → fixer 11
- [major] OQ-1/CAP-5 — tile release under 25 % / no-change release / dragged tile landing have no motion; add to OQ-1's list → fixer 12
- [major] CAP-5 vs EXPERIENCE/DESIGN — caret on a reorder drag: refs conflict; spec follows DESIGN silently → fixer 13 (default applied)
- [major] CAP-6 — epic Done when 3 free-letter drag released outside tray byte-identical test missing → fixer 14
- [major] build-notes Sweep — epic 4 deferred D14 (count badge 1/2 cards) and D19 (compact tray in browser) dropped → fixer 15
- [major] CAP-4/R-71 — no fixture with two same-letter movable cards → fixer 16
- [major] CAP-7 — long-press on empty WordCell resolves as a tap (Place sets target) unstated/untested → fixer 17
- [major] CAP-10 — winning guard on a Redo that commits the win untested → fixer 18
- [minor] F13 "a no-op dispatch" vs `canSetTarget` false → fixer 19
- [minor] CAP-8 success — New game/Replay/restore never animate (only in build-notes) → fixer 20
- [minor] CAP-9 — name the leftover-exhausted viewport; row count width-dependent → fixer 21
- [minor] rule-coverage R-31 "stored Session reference" → byte-identical → fixer 22
- [minor] CAP-10 "no new Session written" ambiguous → fixer 23
- [minor] build-notes CAP-1 origin-tag assumption → fixer 24
- [minor] CAP-10 Undo pass-through mechanism → fixer 25
- [minor] F8/Non-goals Undo key aliases → epic 6 → fixer 26
- [minor] Assumptions bullet 3 fallback vs Success signal → fixer 27
- [minor] Constraints — test-only edits outside `src/ui/` (S3, serialize.test.ts) → fixer 28
- [minor] build-notes S2 already recorded in AD-12 → fixer 29
- [minor] CAP-3 "seven" lookups vs twelve listed → fixer 30
- [minor] CAP-1 the `k` count between `−`/`+` → fixer 31
- [minor] F4 — say the spine is silent on tray clipping and F4 extends the owner's F34 principle (close-out fold) → fixer 32
Fixer: all 32 applied, OQ-5 appended (PROPOSED BY REVIEW); no commands added.
Words (docs): SPEC 4731 (1.23x), build-notes/rule-coverage see wc  |  Snapshot: SPEC.review-log.passes/pass1.{SPEC,build-notes,rule-coverage}.md, fix diff pass1.fix.diff
### Default applied (technical)
- FLIP kind source → the command each caller passes to `flip.capture()`
- `insertionIndex` → `{index, rect}` gaps, two rects at a row break, Euclidean to gap centre, ties to lower index, index over M including the dragged tile
- caret on reorder → DESIGN.md count rule (reorder always parts); EXPERIENCE.md close-out edit
- tray growth vs FLIP → re-layout applied before `flip.play` for non-drag edits; deferred only mid-drag and for Confirm's shrink
- F15 → synchronous render is the guard; test one click = one dispatch
### Decision needed (functionality / UX / gameplay)
- CAP-2/F15 — a fast double tap on a Validate that succeeds lands its second tap on Confirm (same button) and commits to the default target — proposed default: literal EXPERIENCE.md reading (taps ignored only until the result renders; the second tap confirms), pinned by a P5 test → OQ-5
### Dropped
- adversarial "re-resolve press with elementFromPoint mid-animation" — folded into fixer 2 (faces animate, wrappers stay settled)
- builder "reorder release under 25 % uses flyBack" — merged into fixer 12

## Pass 2 — 2026-10-08
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 6, minor 15, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
### Applied
- [major] CAP-10/F8/build-notes CAP-10 — guard uninstall: natural settle lost in pass 1; a gesture with no click strands it; Enter/Space on focused `primary-action` bypasses it → fixer 1
- [major] F7/CAP-8 — Redo-commit `flyToCell` cannot be known before dispatch without re-deriving a rule (AD-3); TopBar.svelte (Undo/Redo caller) missing → fixer 2
- [major] CAP-9 vs AD-11 — "applied in the same update before flip.play" contradicts the gate (re-layout deferred to an idle rAF); Redo-commit and press-finished fly-to-cell deferral → fixer 3
- [major] CAP-8/CAP-9 — band shift would FLIP-animate every column card; unspecified → fixer 4
- [major] CAP-5/build-notes CAP-5 — parting rendering undefined (origin slot, row-break crossing, under 25 %) → fixer 5
- [major] build-notes Sweep — retrospective A9's 4.12 Result items missing; "accepted and not carried" ids unsourced → fixer 6
- [minor] CAP-7 "clears it" antecedent → fixer 7
- [minor] S15/CAP-7 fixture needs a 2-card free-letter cell for the D14 badge → fixer 8
- [minor] F3 end-gap rect; tie on a drag right by one → fixer 9
- [minor] R-71 Place half (strip same-letter swap drops redo) → fixer 10
- [minor] inert drag (block, used/empty cell, Place WordCell) and an existing tile selection → fixer 11
- [minor] OQ-1 list: a dragged free letter landing in its gap → fixer 12
- [minor] CAP-10 P5 timing: Slow speed and assert running animations before the second tap → fixer 13
- [minor] CAP-10 "committed won Session" comparison → fixer 14
- [minor] one tile-count definition (D mirrors counted) for CAP-1/6/9 → fixer 15
- [minor] CAP-9 P5 names the live edit crossing three rows and back → fixer 16
- [minor] reduced-motion fly-to-cell: no stagger → fixer 17
- [minor] taps on disabled controls/labels/band background clear a tile selection (controller path) + P5 → fixer 18
- [minor] CAP-1 Place word line no D underline; invalid line shrink 14 px then ellipsize → fixer 19
- [minor] Boundaries close-out amendment for the two test-only files → fixer 20
Fixer: all 20 applied; finding 6 found 4.12 items already fixed by 4.13 → confirm-and-record rows S16–S18; finding 16 reshaped fixtures (14-tile Composing + three-row Place); dropped the `$effect.pre` Assumption (contradicted the gate order). No commands added.
Words (docs): SPEC 5228 (1.36x)  |  Snapshot: SPEC.review-log.passes/pass2.*.md, fix diff pass2.fix.diff
### Default applied (technical)
- guard: preventDefault+stopPropagation; consume to same pointer's pointerup/pointercancel and a click in that or the next task, key's keyup; uninstall on any settle path
- FLIP kind: capture takes rects; play picks kind from command + DispatchResult/resulting phase
- tray re-layout: keep AD-11 gate; FLIP plays after the gate's re-layout frame; commits defer until fly settles
- band shift: no motion; FLIP only for cards whose container/index changed
- parting: sortable-list (origin collapses, shift one pitch, row-break by transform, D mirrors still)
### Decision needed (functionality / UX / gameplay)
- none new
### Dropped
- none

## Pass 3 — 2026-10-08
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 8, minor 16, decision-needed 0  |  Dropped in triage: 0 (duplicates merged; key auto-repeat reclassified major → minor)
Majors rose 6 → 8: stopping rule **diverging**; no fix pass run. Findings recorded for an upstream fix.
### Open majors (not fixed)
- CAP-9/F7/build-notes CAP-8–9 — `flip.play` timing: "right after the re-layout frame" is circular for commits (re-layout deferred until the fly settles), undefined when no row change is queued, and late when the gate is busy (final layout painted, then jumps back) — upstream: AD-11 gate × AD-14 FLIP ordering
- CAP-8/OQ-1 — FLIP filter "container or index changed" leaves Flip, a k change (block left) and card↔compact switches without motion; contradicts OQ-1's default — upstream: AD-14 (which moves animate; band-relative rect)
- CAP-6/build-notes CAP-5–6 — free-letter parting with room has no geometry (no origin slot); with side right the shifted M tile lands on a D mirror that "never moves" — upstream: DESIGN.md Tray band × AD-14 mirrors
- CAP-8/F6 — fly-to-cell on hidden faces: non-top cell cards render `visibility: hidden` (`WordCellRow.svelte:59`, `Card.svelte:109`), so only the new top visibly flies; P5 `getAnimations()` passes anyway — upstream: AD-14 / DESIGN.md WordCell stack
- build-notes CAP-1 word line (iterate tray order and `faces`) vs Constraints AD-3 "no component computes the word" — upstream: AD-3 (GameView may need D-span data)
- Success signal/Assumption 3 — "tap a legal target" needs L ≥ 4 (a retarget); the assumption allows a 3-letter word — spec fix
- rule-coverage R-33 / CAP-5 — free-letter tile dragged out of the tray (not removed) is assigned to CAP-5 but its P5 does not require a free-letter tile — spec fix
- CAP-1/Assumption 4 — `session-place-compact` need not make the `QU` card a free letter, so the compact `QU` `↩` case is unreachable — spec fix
### Unapplied minors
- build-notes: new "Epic file close-out edits" heading swallowed three spine bullets (Structural Seed, Proposed epics row 5, AD-17 Speed)
- build-notes component tree `flip.ts` still `play(kind)`; F6 "after the DOM update"
- CAP-4 inert drag from a legal non-current Place cell: kept or cleared?; generalise to every no-dispatch drag start (column cards, background, top bar)
- CAP-10 guard install timing: install on `finished: 'won'` at dispatch, not when `flip.play` starts
- CAP-10 Enter auto-repeat keydowns before keyup not consumed
- CAP-10 Undo pressed then slid off: win stands (record)
- CAP-6 caret "tile count exceeds the current rows" → `perRow` × rows
- CAP-9 deferred row change reads the latest tile count; only the newest pending change applies (Undo mid-fly)
- CAP-9 list omits a free-letter drag-insert
- F2 4 px lift leaves the face's top 4 px outside the hit rect (accept and record)
- CAP-4 "document-level tap path" → the controller's `<main>` root
- CAP-2 "secondary circles" → "secondary buttons" (DESIGN.md)
- F4 cite AGENTS.md rule 4 (overlap targets clipped to the visible band); close-out as wording fold, not owner decision
- R-73 reload row: tile selection and invalid-word line not restored (EXPERIENCE.md State Patterns)
- CAP-4/CAP-5 Elevation shadow and lift/drag layers (DESIGN.md Elevation & Depth)

## Result — diverging at pass 3 (fix AD-11 × AD-14 FLIP/gate ordering and animated set, DESIGN.md Tray band free-letter parting with mirrors, AD-3 word-line data; then re-run)
Majors per pass: 18, 6, 8. Pass 3 fixes not applied; 8 open majors and 16 unapplied minors above. Decision needed: OQ-1…OQ-5 (OQ-5 proposed by review).
