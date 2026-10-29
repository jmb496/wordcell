# Review log — story-fly-to-cell-keeps-the-previewed-top.md (ticket 11.3)

State: pass 4: done (converged)

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

## Pass 2 — 2026-10-28 20:40
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 4, minor 8, decision-needed 1  |  Dropped in triage: 2 (duplicates merged: flip.test.ts observable ×4, first sentence vs Hold ×4, copy's cell ×4, F28 previous-top clause ×2, Card.svelte comment ×2, empty-outline non-target ×2, copy in empty target ×2)
Words (docs): 980 (5.0 x pass 0; budget 1500)  |  Snapshot: story-fly-to-cell-keeps-the-previewed-top.review-log.passes/pass2.md, fix diff pass2.fix.diff
Fixer: all 11 items applied, no conflicts; literal ids checked against the fixtures (redo-tail cell 3 → ['p28','9','32','28'], onto-committed → ['p26','2','19','26'], used-cells source cell 3 empties, target 5); no commands touched; decision-needed item left untouched.
### Applied
- [major] AC, flip.test.ts bullet — once `Measure.mirrors`/`inFlight.used` go, "capture records no mirror" has no observable and the lifecycle half duplicates flip.test.ts:581/:659 → fixer item 1
- [major] AC, snapshot bullet — the Description's stacking (copy first, beneath the committed cards) is untested: a copy drawn last would pass → fixer item 2
- [major] Description, first sentence — "until the last landing the target shows the previewed top" contradicts the Hold bullet (landed committed cards drawn over the copy from the first landing) → fixer item 3 (also states F28 stays in force except its previous-top clause, which E6 replaces; minor from ref alignment/adversarial merged)
- [major] AC, snapshot bullet — "no card it held before the commit" contradicts the used-target fixture, whose held copy and new top are 28, a card cell 3 held → fixer item 4
- [minor] Description, Copy bullet — after commit `place` is undefined, so "the target cell" has no source in WordCellRow; it is the cell holding `inFlight.committed` ids (`lowest ≥ 0`) → fixer item 5
- [minor] AC — the copy is drawn into an empty target too, so every `expectFlight` caller and the two-cards target cell 5 checks expect the copy first → fixer item 6
- [minor] AC — the committing Redo on session-place-onto-committed is its own Confirm/settle/Undo/Redo flight; the session-place Redo in the Undo test stays → fixer item 7
- [minor] AC — the kept Undo test cannot tell the hold copy (no ★) from the restored Place preview (★): require `.preview-mark` on the restored preview → fixer item 8
- [minor] Description, comments bullet — Card.svelte's `preview` doc comment (Place-only copy of the strip's last tile) joins the comment updates → fixer item 9
- [minor] Description/AC — used non-target cells show their card beneath "or the empty outline" (E3); add a flight on session-place-used-cells whose source cell empties → fixer item 10
- [minor] AC — "visible" means computed visibility (the `fly()` snapshot) → fixer item 11
### Default applied (technical)
- flip.test.ts replacement → `Object.keys(inFlight)` is `['committed']` and a capture scene with mirrors in the gaining cell flies with exactly the flying ids held; FakeRoot `[data-wordcell]`/mirror support and `Scene.mirrors` removed; the lifecycle stays with :581/:659
- copy's cell → the cell holding `inFlight.committed` ids (`lowest ≥ 0`)
### Decision needed (functionality / UX / gameplay)
- Description, Hold — During Confirm's fly-in, once the word's first letter lands, should the cell show the landed letters stacking over the previewed top until the top letter lands (epic 5 F28's "landed cards stay visible"), or keep the final top letter in front the whole time, with letters disappearing into it as they land (a literal reading of DESIGN.md "the target keeps the previewed top")? — proposed default: the F28 stacking, as the ticket states; Jared confirms at the plan checkpoint or entry 5's device read.
### Dropped
- used target whose free letter is not the new top; committing Redo onto a used target (edge-case, adversarial stretch) — the committed-set hold is one path for Confirm and Redo and any order; no rule specific to these cases

## Pass 3 — 2026-10-28 21:15
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 1, minor 12, decision-needed 0  |  Dropped in triage: 0 (duplicates merged: flip.test.ts mirror precondition ×4, used-cells `[]` vs outline ×2, used-card reading of E6 ×2)
Words (docs): 1075 (5.5 x pass 0; budget 1500)  |  Snapshot: story-fly-to-cell-keeps-the-previewed-top.review-log.passes/pass3.md, fix diff pass3.fix.diff
Fixer: all 12 items applied, no conflicts; flying ids `[3, 4]` checked against flip.test.ts ~:581; item 2 needed the snapshot to record each cell's `empty` class (folded into item 6); `.used` checked in Card.svelte; no commands touched.
### Applied
- [major] AC, flip.test.ts bullet — the replacement test needs "a gaining cell where the page draws mirrors", but the same bullet removes the FakeRoot's only mirror model (`Scene.mirrors`, the `[data-wordcell]` branch) → fixer item 1
- [minor] AC, Fixtures — used-cells cell 3 `shown` `[]` proves no card, not the outline → fixer item 2
- [minor] AC — the session-place Confirm test (:176, "previous top … shown until the last landing") is in neither the rewritten nor the kept list → fixer item 3
- [minor] Description/AC, interrupting move — the e2e Undo runs in the click task on an empty target, so it cannot catch a stuck copy; the release is flip.test.ts ~:659's → fixer item 4
- [minor] AC — the new session-place-used-cells flight has no name → fixer item 5
- [minor] AC — `fly()` snapshots record no `.preview-mark`; the snapshot counts it per WordCell → fixer item 6
- [minor] AC — `expectFlight`'s badge checks (afterClick, afterLast) stay → fixer item 7
- [minor] AC — "no baseline change expected" → "with no baseline changed" → fixer item 8
- [minor] Description, Hold — nested parenthetical: which part of F28 stays and which E6 replaces is ambiguous; reorder → fixer item 9
- [minor] Description — a used target's own free letter earlier in the placement order flies and stays drawn like any committed card (F28) → fixer item 10
- [minor] Description, comments bullet — the plan's entry-5 wording records that E6's "used card" means the used look (used mirror) → fixer item 11
- [minor] AC — "at full opacity" has no check: the copy has no used look and computed opacity 1 → fixer item 12
### Default applied (technical)
- flip.test.ts replacement → `Object.keys(inFlight)` is `['committed']`; a CELL_START → CELL_COMMITTED flight holds exactly the flying ids while the FakeRoot, without its `querySelectorAll('[data-wordcell]')` branch and `Scene.mirrors`, throws on any selector but `[data-card-id]`, bands and tiles (the evidence capture reads no mirror); FakeWrapper's parent `data-wordcell` (for `cellOf`) stays
### Decision needed (functionality / UX / gameplay)
- none new (pass 2's stacking question stands)
### Dropped
- none

## Pass 4 — 2026-10-28 21:50
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 0, minor 13, decision-needed 0  |  Dropped in triage: 0 (duplicates merged: "their Undo checks only the ★" ×3, flip.test.ts `[3, 4]` duplicate of ~:581 ×2, used-cells target 5 ×2, mid-flight Undo evidence ×2)
Words (docs): 1075 (5.5 x pass 0; budget 1500)  |  Snapshot: pass3.md (no fix pass)
Late-pass bar: every finding is verify/evidence precision or wording, none a defect in shipped behaviour, a gating check or the ticket's contract.
### Applied
- none (converged)
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none new (pass 2's stacking question stands)
### Dropped
- none

## Result — converged after 4 passes
Majors per pass: 7, 4, 1, 0. Words 196 → 1075 (budget 1500). Technical defaults applied: 6 (passes 1–3). Open major: none.
Decision needed (owner): Description, Hold — during Confirm's fly-in, once the word's first letter lands, the cell shows the landed letters stacking over the previewed top until the top letter lands (epic 5 F28, the ticket's default), or the final top letter stays in front the whole time with letters disappearing into it (a literal reading of DESIGN.md "the target keeps the previewed top"); confirm at the plan checkpoint or entry 5's device read.

Unapplied minors (for the build's plan):
1. AC bullet 1 — "their Undo checks only the `★` back in Place" reads as cutting the existing Undo checks (52 live, no used mirror, nothing held, the `.preview` count 1 that catches a leaked copy); mean "add a `★` check", on the Undo-before-start test (the same-task test has no Place check).
2. AC snapshot bullet — the snapshot's new fields list `.preview-mark` and `empty` but not each card's `.used` and face opacity, which the full-opacity check needs.
3. AC flip.test.ts bullet — the `[3, 4]` flight clause repeats ~:581; the new evidence is `Object.keys(inFlight)` and the stricter fake; it is `FakeRoot.querySelectorAll` that throws on any selector but `[data-card-id]` (bands and tiles go through `querySelector`).
4. flip.test.ts ~:680 title "… with no previous top to hold" joins the title sweep.
5. AC Fixtures — the session-place-used-cells Confirm: whether it also pins target 5 (copy `p38` first) and used cell 6 (`['31']`) is the plan's.
6. Description, interrupting move — ~:659 proves the hold state clears, not the rendered copy (gated on `inFlight.committed` via `lowest ≥ 0`); a paused Undo after the first landing is optional, the plan's call.
7. AC — `expectFlight`'s full element list at the click (`ids()`, spec :162) becomes `[newTop copy, ...before, ...committed]`.
8. Description, Hold — "a used target's own free letter anywhere earlier in the placement order" has no fixture; covered by construction (one committed-set path), plan records it.
9. Description — "no flash" rests on flyToCell's two `flushSync` before paint (flip.ts F28); snapshots are the check.
10. AC — "(an empty target's base was its empty slot)" reads two ways; mean "the old hold had no base for an empty target".
11. Test names lead with AD-14 (AGENTS.md Conventions allow it: Q-49 has no flight sentence); the plan notes they are not Q-49 coverage.
12. Description, comments bullet — name the two entry-5 wording spots: the AD-14 mirror list (a `preview` mirror outside Place, no `★`) and DESIGN.md WordCell "hidden on landing" (vs F28 "hide together").
13. Description, first paragraph — one ~110-word sentence; split at "and the target never shows".
