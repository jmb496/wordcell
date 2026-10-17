# Review log — Scene 3: place with cards tucking into the WordCell (ticket 8.8)

State: pass 6: done

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

## Pass 3 — 2026-10-17
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 5 (merged), minor 7, decision-needed 0  |  Dropped in triage: 0
Words (docs): 1362 (10.2 x pass 0; budget 1500)  |  Snapshot: story-scene-3-place-with-cards-tucking-into-the-wordcell.passes/pass3.md
### Applied
- [major] easing warps per-card timing → fixer 1 (Effect.easing, linear tuck-k with k/6 slices)
- [major] effect list/elements/phases/defaults, defineScene validation → fixer 2
- [major] hand-off: cell6 hide dead weight, E crossfade dip → fixer 3 (instant swap)
- [major] ghost during step 6 → fixer 4
- [major] test strength and mid-tuck coverage → fixer 5
- [minor] wording, fixture import location, hidden page, strip-4 fade, rest filter → fixer 6-9
### Default applied (technical)
- Effect.easing field; ghost fades in first slice; instant place-5/tuck swap; cellTop equality in unit test.
### Decision needed (functionality / UX / gameplay)
- none new
### Dropped
- none

## Pass 4 — 2026-10-17
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment (ref alignment found nothing)  |  Findings: major 2, minor 10, decision-needed 0  |  Dropped in triage: 0
Words (docs): 1471 (11.0 x pass 0; budget 1500)  |  Snapshot: story-scene-3-place-with-cards-tucking-into-the-wordcell.passes/pass4.md
### Applied
- [major] flier geometry (36 vs 40 px, origin, frame, per-axis scale) → fixer 1
- [major] no test ties flier landing box to place-5's E → fixer 2 (bounding-rect check at rest)
- [minor] Step.tucks cell field/validation, player/effects plumbing, swap keyframes, fade keyframes, mid-tuck poll, R-51 locator → fixer 3-7
### Default applied (technical)
- FACE_MARGIN constant; per-axis scale sx=CARD_W/RICH_TILE_W, sy=1; constant-opacity swap; highlights pop at swap accepted.
### Decision needed (functionality / UX / gameplay)
- none new
### Dropped
- none

## Pass 5 — 2026-10-17
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 2 (merged), minor 8, decision-needed 0  |  Dropped in triage: 0
Words (docs): 1421 (10.6 x pass 0; budget 1500)  |  Snapshot: story-scene-3-place-with-cards-tucking-into-the-wordcell.passes/pass5.md
### Applied
- [major] duplicate stale "Effects and hand-off" bullet (pass 4 left both) → fixer 1
- [major] step 6 reveal would emit a 0-to-1 fade and dip E; tucks expansion must emit the swap → fixer 2
- [minor] cellTop boolean, keyframe offsets/easing test wording, mid-tuck poll window, flier `full`, rect widths + glyph note → fixer 3-7
### Default applied (technical)
- tucks expansion emits the constant-opacity swap; strip-4/confirm constant hide; ~1 px glyph difference at swap accepted.
### Decision needed (functionality / UX / gameplay)
- none new
### Dropped
- none

## Pass 6 — 2026-10-17
Reviewers: fix diff (clean), edge-case hunter, adversarial, ref alignment (clean)  |  Findings: major 0, minor 6, decision-needed 0  |  Dropped in triage: 0
Words (docs): 1421 (unchanged, no fix applied)  |  Snapshot: passes/pass5.md
### Triage
- Adversarial's "mid-tuck poll cannot run reliably" labelled major: reclassified minor under the pass-4+ bar (precision in a verify procedure; the contract and shipped behaviour are unaffected). Default: poll with `intervals: [20]`, `timeout: 30_000`, or pause at `place-step-6` and set `currentTime` via `page.evaluate`.
### Unapplied minors (for the build plan)
- Mid-tuck test mechanism (above).
- Add a unit assertion that every tuck-k start keyframe is `translate(stripTileX(k), STRIP_TOP) scale(1, 1)`.
- `FACE_MARGIN` mirrors Card.svelte `.face { margin: 0 2px }`; the e2e rect-equality check is the pin.
- "restore frame 4's look" should read "restore the base look (frame 0)".
- "only home of the one-card assertion" vs the motion-on test repeating it.
- Hides' `kind`/`times`, how `effects.ts` derives ids (`strip-<k>`, `place-<last>`), and where the default easing is applied (`easing ?? 'ease-in-out'` in Scene.svelte).
### Decision needed (functionality / UX / gameplay)
- Caption — keep current caption or reword to mention the tuck — proposed default: keep unchanged; owner may reword at the plan/done checkpoint.

## Result — converged after 6 passes
Majors per pass (merged): 8, 7, 5, 2, 2, 0. Words 134 -> 1421 (budget 1500).
