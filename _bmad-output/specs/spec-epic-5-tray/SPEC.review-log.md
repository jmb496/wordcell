# Review log — spec-epic-5-tray SPEC.md (run 2)

State: pass 2: done

Target: `_bmad-output/specs/spec-epic-5-tray/SPEC.md` (docs mode, thorough, max 7). Second run after run 1 (`SPEC.review-log-run1.md`) diverged at pass 3; its upstream gaps were fixed in 972c4e2.
Pre-loop: HEAD 972c4e2; copies `SPEC.review-log.passes/pass0.{SPEC,build-notes,rule-coverage}.md`; SPEC.md 5805 words (build-notes 3235, rule-coverage 2270). Growth budget ~14 500 words (2.5x).

## Pass 1 — 2026-10-08
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 10, minor 17, decision-needed 1  |  Dropped in triage: 2 (duplicates merged across reviewers: cells lookup ×2, deferred-play ×3, inert drag ×3, CAP-9 add ×2, caret ×2, F7 win ×2; auto-repeat folded into the guard major; "gate held at release" claim disproved: `end()` leaves the gate before the dispatch, kept as a note in item 4)
Findings handed to the fixer: `SPEC.review-log.passes/p1-findings.md`
Words (docs): SPEC 6579 (1.13 x pass 0; build-notes 3792, rule-coverage 2364)  |  Snapshot: SPEC.review-log.passes/pass1.{SPEC,build-notes,rule-coverage}.md; fix diff pass1.fix.diff
### Applied
- [major] build-notes CAP-1 Tags — free-letter tag looked up `cells` by cell number → lookup by `cell` field via CAP-3 helper → item 1
- [major] Capabilities build order — CAP-2 tile-selection clear moved to CAP-4; F17 landings moved from CAP-5 to CAP-8 → item 2
- [major] F7/CAP-8 — drag-release capture runs before the controller clears drag transforms → item 3
- [major] CAP-9/AD-11 — deferred play: invert applied in the move's update, play waits; tray mode/rows latched with the band; guard installs at dispatch → item 4
- [major] CAP-5/F3 — reorder: parting opening is the gap's only mark; gap rects hit-test only → item 5
- [major] CAP-10/F8 — guard window defined by events (first click, key repeats, other pointers, backstop) → item 6
- [major] CAP-8 P5 — F17 moves (tap-add, removal, tap-swap, k change, edit release, no-edit flyBack) tested → item 7
- [major] CAP-8/CAP-10 P5 — Slow seed and `getAnimations()` in the triggering evaluate → item 8
- [major] CAP-6/AD-14 — mirror parting shift vs AGENTS.md pitfall and epic Done when 4: close-out edits → item 9
- [major] F18/F5 — drag ends leave no tile selection, platform interrupts included; EXPERIENCE.md close-out → item 10
- [minor] items 11–27 (inert drag generalised, CAP-6 side right, CAP-10 P5 split, F7 Redo/win wording, CAP-9 viewports, R-41/R-61 two tests, caret capacity, OQ-5→F21, disabled taps, CAP-9 add, Done when 3 outside band, target cell visibility, translate-only, hover peek during guard, long-press release, success signal, CAP-1 Place order)
### Default applied (technical)
- CAP-9 deferred play — invert in the move's update, play after the gate idles
- CAP-10 guard — event-defined window with a 1 × base backstop
- CAP-8 — translate-only FLIP; target cell's previous cards visible until first landing
- CAP-10 — hover-peek timer suppressed while the guard is installed
- CAP-8/CAP-10 P5 — Slow seed, same-evaluate `getAnimations()`
### Decision needed (functionality / UX / gameplay)
- CAP-8/F17/AD-14 (OQ-6) — on Validate (and Undo to Composing) the destination letters glide from (to) the destination column while their tray-block copies vanish/reappear without motion; should they instead appear to glide from the tray block? — proposed default: from/to the column, as AD-14 implies
### Dropped
- "gate still counts the gesture at release" — disproved (`controller.ts` `end()` calls `gate.leave()` before the drop dispatch); kept as an as-built note
- duplicates merged (see header)

## Pass 2 — 2026-10-08
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 9, minor 13, decision-needed 0  |  Dropped in triage: 0 (merged: guard window/listeners/held Enter/backstop → 1; deferred play ×2; interim render ×2; free-letter append preview reclassified decision-needed → major, DESIGN.md "the insertion point is previewed" supplies the intent)
Findings handed to the fixer: `SPEC.review-log.passes/p2-findings.md`
Words (docs): SPEC 7091 (1.22 x pass 0)  |  Snapshot: SPEC.review-log.passes/pass2.*.md; fix diff pass2.fix.diff
### Applied
- [major] F8/CAP-10 — guard rule stated once in F8: six capture listeners, triggering and later gestures consumed (key repeats, keyup), `duration('snap')` backstop after settle → item 1
- [major] CAP-8/CAP-9 — a gate-deferred FLIP play is part of `finishAll()` → item 2
- [major] CAP-9 — interim render while deferred: overflow row at latched size, band and hit rects unchanged → item 3
- [major] Constraints AD-14 — amendment overrides AGENTS.md pitfall / Done when 4 until their edits land (due before CAP-5 is ticketed) → item 4
- [major] CAP-6 — parted block mirrors' segment ends and locks from parted slots → item 5
- [major] CAP-6/F16 — caret marks an accepted free-letter gap that moves no tile (DESIGN.md "the insertion point is previewed"); F16 extended, outcome kept → item 6
- [major] CAP-8/CAP-10 P5 — same-evaluate only for click/key actions; pointer cases read right after release → item 7
- [major] CAP-10 P5 — guard WordCell tap on non-empty cell 6 with a post-settle control → item 8
- [major] CAP-10 — hover-peek suppression test → item 9
- [minor] items 10–22 (tapAt move, `idle` phase, R-38 exempt, reduced-motion P5, badge before commit, wrapper width close-out, latched rows, success-signal drags, `setTarget` kind, double-tap fixture, long-press vs drag order, Constraints wording, R-75 kind)
### Default applied (technical)
- F8 — backstop `duration('snap')`, counted from install if the triggering gesture already ended
- CAP-9 — interim overflow row at latched size
- CAP-2 — double-tap P5 on `session-composing`
### Decision needed (functionality / UX / gameplay)
- none new (OQ-6 open)
### Dropped
- none
