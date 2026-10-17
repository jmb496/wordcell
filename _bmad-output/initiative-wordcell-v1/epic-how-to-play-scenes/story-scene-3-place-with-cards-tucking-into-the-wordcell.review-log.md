# Review log — Scene 3: place with cards tucking into the WordCell (ticket 8.8)

State: pass 2: done

Pass 0: 134 words (pass0.md); budget 1500 words. Pulled from tickets.toml entry 8; toml fields not copied: interface = "scene script and effects under src/ui/scenes/; fixtures; text.ts caption."; tests = "Engine replay (U); play (P6 android); screenshots."; owns = "Scene 3."; verify (as AC); risk low; references (rules R-40 to R-42, R-50 to R-52, R-60).

## Pass 1 — 2026-10-17
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 8, minor 4, decision-needed 1  |  Dropped in triage: 0 (duplicates merged)
Words (docs): 639 (4.8 x pass 0; budget 1500)  |  Snapshot: story-scene-3-place-with-cards-tucking-into-the-wordcell.passes/pass1.md
### Applied
- [major] Description — existing place scene (8.3) and what changes not stated → fixer 1
- [major] layout "exactly like the game" untestable → fixer 2 (8.6/8.7 stage, already in place mode)
- [major] tuck animation unspecified (order, z, timing, frames) → fixer 3
- [major] "order dragging of the free letter" wrong (tile D dragged) → fixer 4
- [major] fixture/replay unchanged, top-card check → fixer 5
- [major] "one top card" untestable beyond pixels; tests named → fixer 6
- [major] reduced motion / speed / hidden panel → fixer 7
- [major] caption unspecified → fixer 8 (kept unchanged)
- [minor] covers note, start position, scene id/numbering, Q-02/R-65, per-card boundary, toml fields → fixer 9-12
### Default applied (technical)
- tuck timing = multiples of duration('flyToCell'), no new FACTOR; one shared final frame; test layout and names; baseline name.
### Decision needed (functionality / UX / gameplay)
- Caption — keep current caption or reword to mention the tuck (owner sees different on-screen text) — proposed default: keep current caption unchanged; owner may reword at the plan/done checkpoint.
### Dropped
- none

## Pass 2 — 2026-10-17
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 7 (merged), minor 3, decision-needed 0  |  Dropped in triage: 0
Words (docs): 1078 (8.0 x pass 0; budget 1500)  |  Snapshot: story-scene-3-place-with-cards-tucking-into-the-wordcell.passes/pass2.md
### Applied
- [major] tuck schedule/timing/z-order undefined → fixer 1 (Step.tucks, six sequential per-card effects)
- [major] visible state during tuck (strip, Confirm, cell-6 L, scale, layers) → fixer 2
- [major] where the one-card rule lives, end DOM state → fixer 3 (Frame.cellTop, place-only)
- [major] pause/restart/loop reset → fixer 4
- [major] existing tests broken by the change not listed → fixer 5
- [major] test naming vs AGENTS.md (UI Vitest AD-n only) → fixer 6
- [major] unit/e2e assertions too weak (z-order, ends, animation) → fixer 7
- [minor] false place.ts header claim, interrupted tuck → fixer 8, 9
### Default applied (technical)
- Step.tucks expansion in effects.ts; cell-6 L hidden as D lands; fliers layer faded not removed with motion on.
### Decision needed (functionality / UX / gameplay)
- none new (caption item from pass 1 stands)
### Dropped
- none
