# Review log — story-fly-to-cell-on-commit (ticket 5.11)

State: pass 5: done

Pre-loop: HEAD d42b29d5603d7e94c1b654ef430a3285fe40733b; copy /mnt/d/CodeProjects/wordcell/_bmad-output/initiative-wordcell-v1/epic-tray-and-place/story-fly-to-cell-on-commit.review-log.passes/pass0.md; 301 words (wc -w of whole file).
Mode: docs, thorough, max 7. Budget default 2.5x (~750 words).

## Pass 1 — 2026-10-14
Reviewers: builder, edge-case, adversarial, ref-alignment  |  Findings: major 9, minor 9, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Words (docs): 832 (2.76x pass 0, over the 2.5x budget)  |  Snapshot: story-fly-to-cell-on-commit.review-log.passes/pass1.md
### Applied
- [major] Description/Notes — landing mechanism unresolved; must be synchronous (settle/finishAll), not a promise; hold also released on every settle path and on a play() that creates no animation (Undo, press, New game) → item 1
- [major] Description — how WordCellRow learns in-flight/held state and keeps the used mirror and previous cards drawn; reconcile "no new exports" → item 2
- [major] Description — origin/keyframes and flying set (planGlides returns [] for flyToCell): each face glides captured rect → settled rect, set = cards tray → wordcells, order bottom first; Redo included → item 3
- [major] Description — stagger as delay i*stagger() with fill backwards (no early parking in the cell), stagger into FlipDeps; reduced motion: settled rect, no translation → item 4
- [major] Description — per-card hide at its own landing; look between first and last landing → item 5
- [major] Description — gate-count and finishAll registration (CAP-8), AD-14 gate-idle test → item 6
- [major] Description — rewrite flip.test.ts pins ("starts no animation", "plans nothing") and stale comments (flip.ts, ActionBar.svelte) → item 7
- [major] Description/AC — winning Confirm/Redo flies the same, guard is CAP-10's → item 8
- [major] AC — timing-stable Playwright (pause animations), R-60 order, hidden after landing, Redo setup, faces-only animations, 52 elements → item 9
- [minor] stale :59 → :63; fixture paths; source cell beneath card at commit; empty cell; badge at post-commit count; z-order; cite F7 instead of restating numbers → item 10
### Default applied (technical)
- landing hook: synchronous settle path, no promise (resolves Notes open question); in-flight state flip-owned reactive state
### Decision needed (functionality / UX / gameplay)
- none
Fixer flagged (unverified, builder to confirm): reactive in-flight set via svelte/reactivity as a member of the existing Flip object passed to WordCellRow as a prop.

## Pass 2 — 2026-10-14
Reviewers: fix-diff, edge-case, adversarial, ref-alignment  |  Findings: major 5, minor 6, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Words (docs): 829 (2.75x pass 0, over budget; net -3 this pass)  |  Snapshot: story-fly-to-cell-on-commit.review-log.passes/pass2.md
### Applied
- [major] In-flight state — how WordCellRow reaches flip state; prop route contradicts "no new exports" (flip.ts `installed` private, no getter) → item 1
- [major] In-flight state/Landing — set the committed set and hold before play()'s first flushSync (motionKind computed from command/result/phase first), else the mirror and previous cards are already gone → item 2
- [major] Held used mirror — what supplies its id, DOM position (lowest in the cell), no duplicate of the flying live card → item 3
- [major] Playback — planGlides 0.5 px skip must not apply to flyToCell; i indexes the flying set → item 4
- [major] Tests/AC — missing: hold released by finishAll / play with no animation / empty target; source-cell mirror + beneath card for a free letter from another cell (session-place-free-letter-two-cards); winning commit; badge → item 5
- [minor, zero- or negative-word] mark svelte/reactivity `unverified`; drop "decided, ..." suffix; "final cell order (bottom of the committed run first)"; reduced `duration('flyToCell')` instead of 120 ms where possible; Redo AC "let it settle"; AC "just after the first landing" = seek first face to its end; presentation only (AD-14) → item 6
### Default applied (technical)
- flip.ts exports its in-flight state (read-only) rather than a prop; set before the first flushSync; no 0.5 px skip for flyToCell
### Decision needed (functionality / UX / gameplay)
- none

## Pass 3 — 2026-10-14
Reviewers: fix-diff, edge-case, adversarial, ref-alignment  |  Findings: major 5, minor 9, decision-needed 1  |  Dropped in triage: 0 (duplicates merged; 3 adversarial "majors" demoted to minor as build-plan detail: Ordering wording, set-emptying rule, AC wording beyond determinism)
Words (docs): 827 (2.75x pass 0, over budget)  |  Snapshot: story-fly-to-cell-on-commit.review-log.passes/pass3.md
### Applied
- [major] In-flight state — how flip.ts finds the target cell's used-mirror id (no view access; Redo target unknown before dispatch): record every cell's used-mirror id from the DOM at capture (after its finishAll), at play keep the id of the cell that gains the committed cards → item 1
- [major] Playback — flyToCell translating faces take GLIDE and lift the tile clip like a band-changer glide (F22); reduced fades take neither → item 2
- [major] Description — "committing Redo" has no testable definition (motionKind: redo at idle → flyToCell): say "the flyToCell kind (F7)"; an empty flying set is a no-animation play → item 3
- [major] AC — Playwright determinism: pause all faces' animations after the click, seek one face to its end and await its `finished` before asserting, filter getAnimations() to WAAPI animations on `.face` → item 4
- [major] Tests line — name the mirror/badge/Redo checks under the existing P5 entries; rename "R-60 commit lands bottom → top" to AD-14 (R-60 is the atomic commit rule); own-cell mirror is R-52 not R-61; add 52-count to the own-cell AC bullet → item 5
- [minor, net-zero words] Ordering bullet: kind moves above the first flushSync, mark the whole bullet unverified; fold the gate bullet into Landing; drop `settle` from the clear list; New game/Replay/restore already call finishAll via finishGlides; in a used cell the previous cards stay hidden and the mirror shows; unknown line = "resolved: synchronous landing hook"; define or drop "S"/"P5" → item 6
### Default applied (technical)
- mirror id taken from the DOM at capture; GLIDE + clip lift reused from the band-changer glide; "flyToCell kind" wording
### Decision needed (functionality / UX / gameplay)
- Description / SPEC line 248 vs F27 — the cell during a Confirm's fly-to-cell: as written (previous cards released at the first landing, each non-top card hidden at its own landing), the cell would look empty from the first landing until the top card lands (up to 9 × 30 ms for a 10-letter word), but F27 says "Confirm's fly-to-cell, where the cell never looks empty". Would the owner rather see landed cards stay visible until the top card lands (never empty, matches F27), or the spec's literal per-card hiding? — proposed default: keep landed and previous cards visible until the last landing, then hide all non-top committed cards together (never empty); not applied, the ticket keeps the spec's wording until the owner answers.

## Pass 4 — 2026-10-14
Reviewers: fix-diff, edge-case, adversarial, ref-alignment  |  Findings: major 1, minor 11, decision-needed 0  |  Dropped in triage: 0
Words (docs): 827 (2.75x pass 0)  |  Snapshot: story-fly-to-cell-on-commit.review-log.passes/pass4.md
### Applied
- [major] In-flight state vs AC bullet 2 — in a used own cell the previous cards are hidden and the mirror is what shows, yet the AC says "the used mirror and the previous top kept": reword the AC (and the Description sentence if needed) so the mirror is the only previous top drawn there; net-zero words → item 1
### Default applied (technical)
- own-cell wording only
### Decision needed (functionality / UX / gameplay)
- none new (pass 3's F27 item stands)
### Minors not applied (over budget; build-plan detail)
- mirror stacking mechanism; `[data-mirror-of]` scope inside `.wordcell`; delay-phase face overlap with re-flowed tray; reduced-motion same-pass hide; flushSync before paint untested; Undo "between landings" AC; card already in a WordCell does not fly; winning-commit ordering vs CAP-10; landing-order observation procedure; no screenshot baseline change expected.

## Pass 5 — 2026-10-14
Reviewers: fix-diff, builder  |  Findings: major 3, minor 0, decision-needed 0  |  Dropped in triage: 0
Words (docs): 827 (2.75x pass 0)  |  Snapshot: unchanged from pass4.md (no fix applied)
### Open (not fixed; majors rose 1 → 3, so the loop stops)
- [major] `tests:` line (Also list) still says "own-cell used mirror and previous top kept until the first landing", contradicting the pass-4 rule (mirror is the only previous top drawn) in the Description and the own-cell AC.
- [major] Description / In-flight state: "previous cards stay as hidden as before" is ambiguous against the AC "previous top shown until the first landing" (WordCellRow `hidden={i !== top}` would hide the old top after commit). State per card: previous top keeps its pre-commit visibility (shown), other previous cards hidden, in the own cell the used mirror stands for the previous top.
- [major] Playback defines the flying set as cards whose band changed to the WordCells, but the own-cell case calls the free letter "also a flying face" though it is already in a WordCell (same band). Define the committed set once (cards the Confirm/Redo places in the target cell, a free letter already in a WordCell included), say it is the flying set (same-band members glide rect to rect), and whether a free letter from another cell flies or only loses its mirror.
### Decision needed (functionality / UX / gameplay)
- Pass 3's F27 item stands (cell empty between first and last landing vs F27 "never looks empty").

## Result — diverging at pass 5 (fix: the ticket's own Description/tests line for the first two; SPEC F7 / build-notes CAP-8 for the flying-set definition)

Majors per pass: 9, 5, 5, 1, 3. Technical defaults applied: 5 (landing hook, flip-owned state export, no 0.5 px skip, GLIDE + clip lift, DOM mirror id).
### Minors not applied
- mirror stacking mechanism; `[data-mirror-of]` scope inside `.wordcell`; delay-phase face overlap with re-flowed tray; reduced-motion same-pass hide; flushSync before paint untested; Undo "between landings" AC; card already in a WordCell does not fly; winning-commit ordering vs CAP-10; landing-order observation procedure; no screenshot baseline change expected; plus pass-3 minors recorded as Applied/unapplied above.
