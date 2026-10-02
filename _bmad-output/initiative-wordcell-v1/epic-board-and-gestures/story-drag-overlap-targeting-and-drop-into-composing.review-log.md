# Review log — story-drag-overlap-targeting-and-drop-into-composing.md (ticket 4.8)

State: pass 5: done

Mode: docs, thorough, max 7, budget default (2.5x pass 0). Pass 0: HEAD bc50d5f, copy story-drag-overlap-targeting-and-drop-into-composing.passes/pass0.md, 421 words. Intent includes tickets.toml entry 8 fields unknown, interface, tests, owns (not copied at pull; fixer adds them to the Description in pass 1).

## Pass 1 — 2026-10-02
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 11, minor 10, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Words (docs): 1149 (2.73 x pass 0)  |  Snapshot: story-drag-overlap-targeting-and-drop-into-composing.passes/pass1.md (fix diff pass1.fix.diff)
Fixer: all 20 applied; nothing unverified; Success-signal wording shortened to cite SPEC.
### Applied
- [major] Description — tickets.toml entry 8 unknown, interface, tests, owns not in the ticket → fixer item 1
- [major] Description — boundary with entry 9 and the drag's end kinds (pointercancel/lostpointercapture/byBack, other cancel(), drop with a selection open) unspecified → item 2 (default applied)
- [major] Notes — the unknown's guard (Success-signal drag) ends in a drop and cannot detect a fly-back jump → item 3 (default applied)
- [major] AC — tests-field cases missing from Verify: AD-12 transform direct / no state before release / at most one command (S + P4), AD-10 reduced-motion fade, R-73 storage check → item 4
- [major] Description — drag highlight classes vs entry 7 hover classes; whole-column placeholder reveal by DOM class (build-notes CAP-7) → item 5 (default applied)
- [major] Description — AD-12 `use:dropTarget` registration missing; no such action in src → item 6
- [major] Description — "drag layer" undefined and untested → item 7 (default applied)
- [major] AC — whole-column drag case has no fixture, target or outcome, reads as a cancel case → item 8
- [major] AC — no partial multi-card tail (R-10 sourceCount, R-21 lowest non-tail highlight); leave-and-return lacks highlight-before/after asserts → item 9
- [major] Description — whether the threshold-crossing pointermove is the first drag move (flick) → item 10 (default applied)
- [major] AC — SPEC Success-signal clause "same drag held over column 1 alone … byte-identical" missing → item 11
- [minor] items 12–21: touchHold/touchDrag; canPickUp per column; top/bottom drop geometry; baselines clause; sub-25 % path; ghost/highlight lifetime; desktop repeat cases named; "no highlight at any step" vs "at release"; DESIGN.md Card states reference; canPickUp wording
### Default applied (technical)
- entry 8 end kinds: pointercancel/lostpointercapture/cancel({byBack:true}) fly back (AD-12, F13); any other cancel() returns the tail at once, clears transform/ghost/highlight classes and finish()es a running fly-back, gate idle before it returns; a drop with a selection open calls overlays.deselect() then dispatches; everything else of F24/F28 selection replacement, press/act during fly-back P4 and hide/back cases is entry 9; entry 8 tests start with nothing selected
- unknown guard: P4 release over the WordCell row with touchHold end(), one page.evaluate: first keyframe transform equals the last inline transform, inline transform cleared
- drag classes distinct from entry 7 hover classes; hover classes cleared at threshold, recomputed after release or fly-back
- drag layer: a controller-added class raising the dragged faces' stacking above the sticky bars, no element moved or cloned; P4 elementsFromPoint over a bar
- threshold-crossing move is the first drag move; S flick case
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none (overlapping findings from four lenses merged)

## Pass 2 — 2026-10-02
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 9, minor 5, decision-needed 0  |  Dropped in triage: 1
Words (docs): 1285 (3.05 x pass 0)  |  Snapshot: story-drag-overlap-targeting-and-drop-into-composing.passes/pass2.md (fix diff pass2.fix.diff)
Fixer: all 14 applied; nothing unverified; cut ~30 words (baseline phase list, Classes DESIGN.md cite, Lifetime closing clause).
### Applied
- [major] Notes guard — samples a 180 ms running animation after touchHold end() (flaky) and cannot read the already-cleared inline transform → fixer item 1 (default applied)
- [major] End kinds — deselect-then-dispatch with a selection open tested by neither entry 8 nor 9 → item 2 (default applied)
- [major] AC — whole-column self-drop placeholder reveal/outline unasserted → item 3
- [major] AC desktop — SPEC CAP-7 "desktop repeats the drop and the cancel": the Q-34 cancel replaced by the WordCell-row release → item 4
- [major] Drag layer — DESIGN.md dragging lift shadow missing and untested → item 5
- [major] AC — elementsFromPoint never returns pointer-events: none faces (F26, Card.svelte) → item 6 (default applied)
- [major] End kinds — no test for pointercancel/lostpointercapture/byBack fly-back or plain cancel() → item 7 (default applied)
- [major] AC — R-23 S column order only checked on 1-card tails → item 8
- [major] Classes — existing drop outline CSS is inside the (hover: hover) and (pointer: fine) query; drag highlight look and android visibility unspecified → item 9 (default applied)
- [minor] items 10–14: "highlighted at release"; "registered column element's"; "D = the highlighted card"; stacking-context ancestor wording; "moved straight up"
### Default applied (technical)
- guard: addInitScript wrapper of Element.prototype.animate records the first keyframe at call time; compared with translate of the last touchHold move minus the press point within 1 px
- selection-open drop: S case, overlays.deselect called once before dispatch
- drag layer test: one page.evaluate sets the face's pointer-events to auto, asserts it first in elementsFromPoint over the top bar, restores
- end kinds: S cases per kind
- drag-target CSS in every media context; android asserts computed outline-width 3px
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- motion.ts "No animation uses it until epic 5" comment — plan file-list detail, no ticket words needed

## Pass 3 — 2026-10-02
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 4, minor 9, decision-needed 0  |  Dropped in triage: 2
Words (docs): 1351 (3.21 x pass 0)  |  Snapshot: story-drag-overlap-targeting-and-drop-into-composing.passes/pass3.md (fix diff pass3.fix.diff)
Fixer: all 12 applied; nothing unverified.
### Applied
- [major] Classes/Drag layer — drag-layer class (z-index, lift shadow) has no lifetime and no removal assert → fixer item 1
- [major] Targeting — "source suppressed" readable as candidate exclusion (runner-up wins) vs highlighted null (AD-12); no pickTarget case separates them → item 2
- [major] Fly-back — gate counting read as reduced-motion only; normal fly-back gate enter/leave untested (F13, build-notes CAP-7) → item 3
- [major] Classes — ghosts drop SPEC CAP-7's pseudo-element on the slot wrappers; Card.svelte's .ghost .face would restyle the dragged faces → item 4 (default applied)
- [minor] items 5–13: outline asserted on column 3's bottom card face; elementsFromPoint first hit inside the face, on the held column-5 drag moved over the top bar; "between 0 and 25 %"; k = 0 over column 1's placeholder; cut the duplicate drop clause into the Success-signal case; Interface names cancel() (finishes a fly-back with no active press); transform cleared before a drop dispatches; stacking-context wording
### Default applied (technical)
- ghost: pseudo-element of a controller class on the slot wrappers, not Card's .ghost; P4 asserts the dragged face keeps its fill
- top-bar probe: the column 5 held drag moved up over the top bar
- cancel() finishes a running fly-back even with no active press (entry 8); entry 9 adds only the act() P4
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- existing entry-7 controller.test.ts selection+drag case needs rewriting — plan detail
- DESIGN.md/Q-34 cite after "placeholder hidden" — optional, reviewer agreed behaviour is right

## Pass 4 — 2026-10-02
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 1, minor 9, decision-needed 0  |  Dropped in triage: 4
Words (docs): 1365 (3.24 x pass 0)  |  Snapshot: story-drag-overlap-targeting-and-drop-into-composing.passes/pass4.md (fix diff pass4.fix.diff)
Fixer: all 6 applied; nothing unverified.
### Applied
- [major] Classes Lifetime / Notes guard — the inline transform is removed at the fly-back's end, so with an unfilled WAAPI animation the tail jumps back to the release point for a frame, and it contradicts the guard and the reduced-motion "clears the transform at once" → fixer item 1 (default applied)
- [minor] items 2–6 (no added words): "keep their fill"; fly-back S case clears ghost and drag-layer classes at the end; WordCell-row fly-back "storage byte-identical" (SPEC CAP-7); placeholder reveal through the drag-target class (follows the highlight lifetime); "on the last-shown highlight"
### Default applied (technical)
- inline transform cleared in the same task as animate() at fly-back start; ghost and drag-layer classes wait for its end or finish(); guard asserts no inline transform while the animation runs
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- deep-equal drafts compare object — plan names it (reviewer agreed)
- press on a still-flying tail before entry 9 — interim, entry 9 owns finish() on press
- byBack with no press during a fly-back — plan detail
- drag layer above the hover peek untestable until entry 12 — no change needed
### Unapplied minors (over budget, fix adds words)
- desktop asserts for entry 7 hover classes cleared mid-drag and restored after fly-back; refreshHover() during a fly-back
- drag ghost pseudo-element sized and placed like Card's .ghost face (w × H, 2 px inset)
- empty-column k = 0 case names its source card and asserts the placeholder highlight

## Pass 5 — 2026-10-02
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 1, minor 10, decision-needed 0  |  Dropped in triage: 3
Words (docs): 1365 (3.24 x pass 0), unchanged (no fix pass)  |  Snapshot: story-drag-overlap-targeting-and-drop-into-composing.passes/pass4.md
### Open (not fixed; stopping rule)
- [major] Notes guard — pass 4 re-added sampling "no inline transform while face.getAnimations() still runs" after touchHold end(), so the gating P4 is timing-dependent again (the pass 2 flake): a 180 ms fly-back can finish before page.evaluate. Fix: the addInitScript animate() wrapper also records, in a microtask after each call, that the face's style.transform is empty; assert that record and drop the "while … still runs" sampling.
### Default applied (technical)
- none (no fix pass)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- fly-back faces end on their slot rects (stretch; plan)
- drop gated only on canPickUp (Idle canPickUp implies canDropOn; no change)
- where the ghost/drag-layer CSS lives (plan: Column.svelte :global selectors)

## Result — converged after 5 passes
open major: Notes guard samples a running fly-back after touchHold end() (timing-dependent); record the cleared inline transform in the animate() wrapper's microtask instead (fix-diff lens, pass 5).

Unapplied minors (for the build's plan or a later loop):
- Lifetime "first keyframe: release offset" → "last written transform" (pointercancel/lostpointercapture/byBack carry no reliable release point)
- Drag bullet: "writes the transform" → "writes translate(pointer − press point)"
- "hasLeftSource set from raw including null" belongs to the controller (AD-12), not pickTarget's return
- End kinds plain cancel(): "clears transform, ghost and highlight classes" omits drag-layer → "clears every drag class (Lifetime)"
- Drop targets "on each pointermove" → "on each drag move"
- S selection-open case "released on another column" → "dropped on a column other than its source"
- End kinds: a same-id pointerdown end (controller.ts sameId) cleans up like a plain cancel()
- column 5 P4: assert no [data-mirror-of] mid-drag and 52 [data-card-id] (SPEC CAP-7 "no mirror element mid-drag")
- desktop asserts for entry 7 hover classes cleared mid-drag and restored after fly-back; refreshHover() during a fly-back
- drag ghost pseudo-element sized and placed like Card's .ghost face (w × H, 2 px inset)
- empty-column k = 0 case names its source card and asserts the placeholder highlight
