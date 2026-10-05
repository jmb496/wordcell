# Review log — story-composing-place-and-game-over-column-behaviour.md (ticket 4.10)

State: pass 1: done

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: HEAD 6621aa5, copy story-composing-place-and-game-over-column-behaviour.passes/pass0.md, 292 words. Intent includes tickets.toml entry 10 fields unknown, interface, tests, owns (not copied at pull; fixer adds them to the Description in pass 1).

## Pass 1 — 2026-10-05
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 7, minor 12, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Words (docs): 943 (3.23 x pass 0)  |  Snapshot: story-composing-place-and-game-over-column-behaviour.passes/pass1.md (fix diff pass1.fix.diff)
### Applied
- [major] AC — hidePage case omits the `end()` release and the past-threshold variant (build-notes AD-17 hide case) → fixer item 1
- [major] Description/AC — ghost mirrors in the destination column after a self-drop (SPEC CAP-8 "destination column included, self-drop") dropped and untested → fixer item 2
- [major] Description — k preview extent in a self-drop: "to the bottom" would wrap S ghosts; DESIGN says "the D" → fixer item 3 (default applied)
- [major] AC — desktop verify omits grab cursor in Place/Game over, no outline on other columns and ghosts in Composing, top-of-D k − 1, none at k = 1 → fixer item 4
- [major] AC — drag-as-tap verify omits "card does not move" and "exactly one dispatch" (rule-coverage R-39 row) → fixer item 5 (default applied: k ≥ 3 top-of-D drag)
- [major] AC — non-card parts of the destination column (empty space, foot pad, placeholder) untested in Composing → fixer item 6
- [major] AC — inert cases assert only the Session reference; SPEC CAP-8 also requires the stored Session; R-39/R-75 "no selection, no drag" needs no selection / no drag classes → fixer item 7 (default applied)
- [minor] intent fields into Description → item 8; k sequence order on session-composing (k = 1 start) → 9; preview mechanism (reuse wc-hover-tail / --wc-hover-from, remainder length) → 10; refreshHover repaint and default cursor on destination cards → 11; one ghost term → 12; empty destination (k = 0) case → 13; no drag/drop-target classes during drag-as-tap → 14; no baseline change expected → 15; References add SPEC CAP-8, rule-coverage rows, EXPERIENCE phase matrix and Mouse and hover, DESIGN Card states → 16; kIfTapped read at pointerup for the press card wherever released → 17; existing canPickUp gating already inert, new work is the destination branch → 18; Undo then drag onto a different column → 19; pointercancel/other cancel paths owned by CAP-4 → 20
### Default applied (technical)
- k preview — reuse the tail-outline mechanism with the start from kIfTapped and its end at the remainder's bottom card, never S ghosts
- drag-as-tap test — top of D at k ≥ 3 so a double dispatch is visible; mid-drag no transform / drag-layer class
- self-drop reach — in-test from session-idle-fresh (tap-select a partial tail, tap its own foot), no new fixture
- inert asserts — current().session reference, stored Session, nothing selected, no drag classes
- destination cards keep the default cursor; preview repaints via the existing refreshHover
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none
