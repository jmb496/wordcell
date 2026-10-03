# Review loop — ticket 4.8 build (code mode, cb23a41..HEAD)

State: pass 3: done

Target: commit range cb23a41..HEAD (diff `4-8-build.passes/pass0.diff`)
Intent: `_bmad-output/initiative-wordcell-v1/epic-board-and-gestures/story-drag-overlap-targeting-and-drop-into-composing-plan.md`
Depth: thorough, max 7
Pre-loop: HEAD 6a9b47395f87cb2f8d1b5254b01574aef4e99792, tree snapshot 0 125916264c6f24001b44ef7a5cefb3d16bc19cb8

## Pass 1 — 2026-10-02
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 3, minor 7, decision-needed 0  |  Dropped in triage: 0 (2 duplicates merged)
### Applied
- [major] src/ui/gestures/targeting.test.ts 'AD-12 the largest ratio wins' — both cases also put the larger ratio nearer the centre, so a nearest-centre ranking passes → fixer item 1
- [major] e2e/drag.spec.ts Q-34 held cases (android l.256, l.462) — assert only absence; pass if no drag latches or the tail snaps instead of flying back → fixer item 2
- [major] e2e/drag.spec.ts names — R-10 drag half claimed by ticket/plan but no drag test name carries R-10 (intent + verification-gap + edge-case, merged) → fixer item 3
- [minor] e2e/drag.spec.ts self-drop tests — add R-20 ("including the source column") to their names → fixer item 4
- [minor] src/ui/gestures/controller.ts flyBack — overwrites `flying` unguarded; fail fast if one is running → fixer item 5
- [minor] e2e/drag.spec.ts drag-layer probe — probe point not proven inside the top bar → fixer item 6
- [minor] controller.test.ts AD-10 fly-back duration — flyBack factor equals snap's; mock motion to prove the 'flyBack' kind → fixer item 7
- [minor] controller.test.ts 'AD-12 Q-34 …' — UI Vitest named with a Q-id; rename AD-12 only → fixer item 8
- [minor] controller.test.ts — no case proves the grabbed (tail[0]) face is measured rather than another tail face → fixer item 9
- [minor] plan Residual risks — record resize/relayout mid-drag without a move (stale highlight, as specified by EXPERIENCE.md step 6) → fixer item 10
### Default applied (technical)
- item 2 — assert mid-drag inline transform + `wc-drag-ghost`, then the face's box back at its pre-drag box (±1 px) after animations settle
- item 5 — throw `AD-12 fly-back while one is running`
- item 7 — vi.mock '../motion' with a kind-specific duration
- item 10 — accept as specified; note only, no resize listener
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none
### Fixer outcome
- 1: targeting.test.ts — a case where the larger ratio (37.5 %) sits on the farther, higher-id column against a nearer 25 % one.
- 2: drag.spec.ts — helpers `expectDragging`, `expectFlownBack`, `recordFaceAnimations`; both android Q-34 held tests assert the drag latched and a face animation (fly-back, not snap) then the face box back within 1 px; the WordCell-row test also gets `expectFlownBack`.
- 3, 4: names now 'R-10 R-14 R-20 R-21 leave and return …', 'R-10 R-11 R-23 a whole-column drag …', 'R-14 R-20 R-22 whole-column self-drop …'; plan test list updated.
- 5: controller.ts flyBack throws `AD-12 fly-back while one is running`.
- 6: drag-layer probe at the centre of the face ∩ top-bar rect, throwing if they do not intersect.
- 7: controller.test.ts mocks `../motion` (kind log, forced 237 ms for flyBack); asserts only 'flyBack' requested.
- 8: renamed 'AD-12 a drag that never leaves the source …'.
- 9: new 'AD-12 overlap is measured on the grabbed face (tail[0]), not the faces below it'; mutation-checked.
- 10: plan Residual risks line added.
- Fixer runs: npm test 1907 passed; lint clean; check 0 errors; `npx playwright test e2e/drag.spec.ts` 12 passed, 12 skipped (other-project).
### Verify (orchestrator)
- npm test 45 files / 1907 passed; lint clean; check 0 errors.
Snapshot: tree cb361b0715c6492bd95e03472e8c65dd481684d8 (fix diff `4-8-build.passes/pass1.fix.diff`, next target `4-8-build.passes/pass1.diff`)

## Pass 2 — 2026-10-02
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 2, minor 7, decision-needed 0  |  Dropped in triage: 2 (2 duplicates merged)
### Applied
- [major] e2e/drag.spec.ts 'R-14 a drag released over the WordCell row flies back …' — the plan's triage log says the guard records card ids and asserts the two tail cards; it does not (two calls on one face pass), and only the pressed face's return is checked (verification-gap + intent, merged) → fixer item 1
- [major] e2e/drag.spec.ts 'Q-34 a sub-25 % drag over the source only … flies back' — the one Q-34 held case pass 1 item 2 missed: no fly-back animation or return asserted (verification-gap + intent, merged) → fixer item 2
- [minor] controller.test.ts AD-10 fly-back baseMs loop — forced override makes both iterations identical → fixer item 3
- [minor] plan test list — Q-34 held entries not updated for pass 1 item 2's new assertions → fixer item 4
- [minor] controller.test.ts reduced-motion fly-back — does not assert the 'flyBack' kind → fixer item 5
- [minor] controller.ts refreshHover after a drop and after a snap — untested → fixer item 6
- [minor] e2e/drag.spec.ts android Q-34 held cases — no check that raw is the source (face ≥ 25 % on it), so suppression is not proven → fixer item 7
- [minor] drop-target.test.ts — fakes are all `{}`, so `toEqual` cannot tell elements apart → fixer item 8
- [minor] controller.ts flyBack — only `onfinish` settles; a cancelled animation leaves the gate held silently (rule 6) → fixer item 9
### Default applied (technical)
- item 3 — override `baseMs + 57` per iteration so the cases differ
- item 9 — `oncancel` throws `AD-12 fly-back animation cancelled` (AD-15 surface)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- edge: transform drifts off the pointer on scroll/resize mid-drag — already accepted as specified (EXPERIENCE.md step 6) in the plan's Residual risks (pass 1 item 10); listed as unapplied minor
- edge: classify treats a release ≥ 8 px away with no intervening pointermove as a tap — in `classify.ts` (ticket 4.6), outside this diff; listed as unapplied minor
### Fixer outcome
- 1: WordCell-row guard records each face's card id; sorted ids asserted equal to the two tail cards; `expectFlownBack` on both tail cards.
- 2: sub-25 % test records face animations, asserts `expectDragging`, the one fly-back animation and `expectFlownBack`.
- 3: override `baseMs + 57` per iteration.
- 4: plan test list entries updated for the four fly-back cases.
- 5: reduced-motion test asserts kinds `['flyBack']`.
- 6: new 'AD-12 a mouse drag dropped on a column, or snapped back by cancel(), recomputes the hover …'; mutation-checked against both `refreshHover()` calls.
- 7: both held Q-34 tests assert face ≥ 25 % over the source column from the threshold crossing.
- 8: distinct fakes in drop-target.test.ts.
- 9: `oncancel` throws `AD-12 fly-back animation cancelled`; new test 'AD-12 a cancelled fly-back animation throws (rule 6)'.
- Fixer runs: npm test 1909 passed; lint clean; check 0 errors; drag.spec.ts 12 passed, 12 skipped (other-project).
### Verify (orchestrator)
- npm test 45 files / 1909 passed; lint clean; check 0 errors.
Snapshot: tree 9aea03704fe81d6d1986d6180b1c6d49c473d734 (fix diff `4-8-build.passes/pass2.fix.diff`, next target `4-8-build.passes/pass2.diff`)

## Pass 3 — 2026-10-02
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 0, minor 8, decision-needed 0  |  Dropped in triage: 0 (2 duplicates merged)
### Applied
- none (converged; minors listed below, not applied)
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none
Snapshot: unchanged, tree 9aea03704fe81d6d1986d6180b1c6d49c473d734 (npm test 1909 passed, lint clean, check 0 errors at this tree)

## Result — converged after 3 passes
Majors per pass: 3, 2, 0. Technical defaults applied: 6. Decision-needed: none. Final state: npm test pass (45 files, 1909 tests), lint pass, check pass; `npx playwright test e2e/drag.spec.ts` passed in both fix passes (fixer runs).

### Unapplied minors
- plan Residual risks l.232 — still says a cancelled fly-back would not settle; since pass 2 item 9 it throws `AD-12 fly-back animation cancelled` (rule 6); reword (intent + verification-gap + edge, merged).
- src/ui/gestures/controller.ts dragMove — column rects are not clipped to the sticky top bar, so with the board scrolled under the bar (A-D4) a tail over the bar can light the column beneath (EXPERIENCE.md Drop targeting step 7); default: clip each column rect to the top bar's bottom edge before `pickTarget`, or record as accepted.
- targeting.test.ts equal-ratio tie-break — no case separates horizontal from 2-D centre distance; add a horizontally-nearer, vertically-farther candidate.
- controller.test.ts pointercancel / lostpointercapture / cancel({ byBack: true }) fly-back cases — assert duration 180 only; add `durations.kinds` `['flyBack']`.
- e2e/drag.spec.ts R-10 R-11 R-23 whole-column test — `arrangement.slice(0, 6)`; assert the whole array.
- e2e/drag.spec.ts leave-and-return and whole-column self-drop — the before-leaving checks do not assert `expectDragging` and ≥ 25 % source overlap.
- e2e/drag.spec.ts 'Q-34 a sub-25 % drag …' — name lacks R-14 (rule-coverage R-14 row); rename and update the plan list.
- (pass 2, out of scope) classify.ts treats a release ≥ 8 px from the press with no intervening pointermove as a tap (EXPERIENCE.md Pointer thresholds) — ticket 4.6 code.
- (pass 2, accepted) the transform drifts off the pointer on scroll/resize mid-drag until the next move — covered by the plan's Residual risks line.
