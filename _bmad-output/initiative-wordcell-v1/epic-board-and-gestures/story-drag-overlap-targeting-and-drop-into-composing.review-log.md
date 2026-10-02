# Review log — story-drag-overlap-targeting-and-drop-into-composing.md (ticket 4.8)

State: pass 1: done

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
