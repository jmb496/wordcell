# Review log — story-fly-to-cell-keeps-the-previewed-top.md (ticket 11.3)

State: pass 1: done

Mode: docs, thorough, max 7, budget 1500 words (as tickets 11.1, 11.2). Pre-loop: HEAD e9cc2816819852c5b168aaec7aa001ad9f16ad70, copy `story-fly-to-cell-keeps-the-previewed-top.review-log.passes/pass0.md`, 196 words.
Intent carried from tickets.toml entry 3 and not copied into the ticket: `plan_checkpoint = true` (an unattended build stops after planning for a person to approve the plan; the fixer adds it to the Description in pass 1).
Refs: epic-place-preview.md (no epic spec; requirement source Q-49 as applied on branch place-preview), tickets.toml, docs/game-flow-spec.md (Q-49, R-50, R-52), DESIGN.md, EXPERIENCE.md, ARCHITECTURE-SPINE.md (AD-14), AGENTS.md, story-engine-place-preview-on-cellview-plan.md and story-wordcell-row-place-preview-plan.md (tickets 11.1, 11.2, done), _bmad-output/implementation-artifacts/review-loop/11-2-build.md (11.2 code review log: until 11.3 the fly-in briefly shows the target's old top).

## Pass 1 — 2026-10-28 20:10
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 7, minor 5, decision-needed 0  |  Dropped in triage: 1 (duplicates merged: landing stacking ×4, held-copy mechanism ×4, used-mirror hold removal ×4, "never the used card" ×4, not-used fixture ×4, positive/★/non-target checks ×4, "frame samples" ×3, plan_checkpoint ×3, AD-14 mirror list ×3, finishAll ×2)
Words (docs): 796 (4.06 x pass 0; budget 1500)  |  Snapshot: story-fly-to-cell-keeps-the-previewed-top.review-log.passes/pass1.md, fix diff pass1.fix.diff
Fixer: all 12 items applied, no conflicts; no commands touched. Fixer note: the 11.2 handoff of the dead used-mirror hold is in story-wordcell-row-place-preview-plan.md (review rows), so the ticket cites "the 11.2 plan".
### Applied
- [major] Description — between the first and last landing the landed committed cards (wc-glide z-index 1 until the last settle) cover any held copy; stacking unspecified → fixer item 1 (default from epic 5 SPEC F28 owner decision 2026-10-14: landed cards stay visible until the last landing, then hide together, "not per-card hiding"; so the previewed-top copy replaces the previous top as the cell's base beneath the committed cards. Three reviewers proposed per-landing hiding from DESIGN.md:564-565; rejected, it contradicts F28.)
- [major] Description — the previewed top's live element is itself the last flying card (fill backwards on the strip), so a static copy is needed; its kind, ★, z-order, name and FLIP status unspecified → fixer item 2
- [major] Description/AC — the R-52 used-mirror hold (`inFlight.used`, `Measure.mirrors`, `:not(.preview)` capture, `usedId`, the `lowest − 1` reveal) is unreachable since 11.2 and handed to this entry (11-2-build.md); "rewritten for the preview" for flip.test.ts has no defined expectation → fixer item 3
- [major] Description, "never … the used card" — on a used target (redo-tail, 28) the previewed top is the used card → fixer item 4
- [major] AC, "a target that is not used" — no fixture named; session-place's target is empty (vacuous); name session-place-onto-committed (previous top 28) for Confirm and Redo → fixer item 5
- [major] AC, "frame samples" — undefined and at odds with the spec's timing-independent pause-and-finish `fly()` snapshots → fixer item 6
- [major] AC — only negatives tested: no positive check of the held previewed top, no ★ check from the click, no used non-target cell check, 52 live only after landing → fixer item 7
- [minor] Description — `plan_checkpoint = true` from tickets.toml entry 3 not in the ticket → fixer item 8
- [minor] AC — which F28 tests are rewritten (expectFlight, the "(interim hold)" tests) vs kept (Undo-before-start, same-task Undo) → fixer item 9
- [minor] Description — reduced motion: the copy replaces the previous top beneath the fading faces too → fixer item 10
- [minor] Description/AC — finishAll (Undo mid-flight) releases the copy with the hold; Undo back to Place shows the ★ preview again → fixer item 11
- [minor] Description — code comments ("ticket 11.2 interim") updated here; AD-14 mirror list and DESIGN.md hold wording left to entry 5's close-out → fixer item 12
### Default applied (technical)
- held copy — source → WordCellRow derives it from the target's live top (`cell.cards.at(-1)`, in `inFlight.committed`); no captured mirror, no new `inFlight` field
- held copy — kind → Card `preview` mirror kind with `previewMark` false, silent, first in the cell
- flip.test.ts — R-52 used-mirror test → replaced by an AD-14 Q-49 test that capture records no mirror and `inFlight` holds only the committed ids, cleared at the last landing, `finishAll()` and an animation-less play
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- per-landing hiding of non-top committed cards (adversarial, edge-case, ref alignment defaults) — contradicts the owner's epic 5 SPEC F28 decision; replaced by item 1's default
