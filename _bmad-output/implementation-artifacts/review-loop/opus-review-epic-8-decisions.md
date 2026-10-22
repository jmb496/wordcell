# Review loop — Opus review epic 8 decisions D1–D12 (code mode, thorough, max 7)

State: pass 3: done

Target: `git diff HEAD` on branch end-of-game-words, HEAD 4c6d34009b40996c8cd754b6cf7576f8c93db34d, 24 files (+1212 −140).
Pre-loop: tree snapshot 0 `d8bd2a135898ab159706e3266e5dce507960cb99`; diff `opus-review-epic-8-decisions.passes/pass0.diff`.
Intent: epic-how-to-play-scenes.md Notes "Decision (owner, 2026-10-22, Opus review decisions D1–D12 …)"; problems in opus-review-epic-8.md "Decision needed"; implementer report `.autopilot/opus-review-20261022-0748/e8-decisions.json` (its three questions already go to the owner).
Owner rules: majors only are fixed; minors listed, never fixed; anything beyond D1–D12 changing UX/gameplay is decision-needed; no screenshot baselines.

## Pass 1 — 2026-10-22
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 2, minor 3, decision-needed 1  |  Dropped in triage: 1 (duplicate)
### Applied
- [major] src/ui/scenes/stage.ts `destinationCards` (new, private) vs src/ui/scenes/Scene.svelte `drawn` and scenes.test.ts `destinationOf` — the R-21 destination-column rule is written three times; D10's `joinCards` indexes come from `drawnColumns` while Scene.svelte draws the destination from its own copy (risk area 2; reclassified from minor) → fixer item 1
- [major] src/ui/scenes/Stage.svelte `.stage :global(.badge)` / `.stage :global(.mark)` — the D12 counter-scale ties Card.svelte's `.badge`/`.mark` (both 0,2,0; Card's `font` shorthand resets font-size), so the 11 px floor holds only by stylesheet order (fragile; reclassified from minor) → fixer item 2
### Default applied (technical)
- Item 1 — export `destinationCards` from stage.ts and read it in Scene.svelte and the test.
- Item 2 — raise specificity (`.stage :global(.card .badge)`, `.stage :global(.card .mark)`), keep the landscape-floor e2e as the check.
### Decision needed (functionality / UX / gameplay)
- src/ui/scenes/Carousel.svelte measure (D6) with Scene.svelte figure — on short windows the fit reserves room for the stage only, so the caption and, under reduced motion, the Next/Replay step button sit just below the fold (each step needs a scroll down and back). Does "the whole scene shows without scrolling" include the caption and the reduced-motion step button? — proposed default: stage only (as built); record in the epic Notes that the caption and reduced-motion control may scroll on short windows. Alternative: subtract the control row (and caption) from the fit, making cards smaller still. (Raised by two reviewers.)
### Minors (listed, not sent to the fixer — owner rule)
- src/ui/scenes/stage.ts `joinCards` — a frame k below the drop's `destinationCount` would silently draw nothing instead of throwing (no scene does this today).
- src/ui/scenes/scenes.test.ts `usedAfter` — cell 6 used state (D5) checked against a hand-written copy of the engine's used rule, not `GameView.cells[].used` from replay.
- Stage.svelte D12 badge pill — no test asserts the counter-scaled pill (width/height); the unit regex and the e2e font-size check would pass if only font-size were scaled.
### Dropped
- Edge-case D6 finding — duplicate of the intent-alignment D6 decision-needed item (merged).
### Fix
Fixer: item 1 `destinationCards` exported from stage.ts, used by Scene.svelte `drawn` and scenes.test.ts `destinationOf` (behaviour unchanged); item 2 Stage.svelte selectors `.stage :global(.card .badge)` / `.stage :global(.card .mark)` (0,3,0), stage.test.ts pinned strings updated; landscape-floor e2e passed.
Snapshot: tree `9fcc2291472b739023582d68818d81ea32ad8b10`; `pass1.diff`, `pass1.fix.diff`. Orchestrator gates: test 86 files / 3215 pass, lint pass (1 pre-existing warning, e2e/end-sheet.spec.ts), check 0 errors.

## Pass 2 — 2026-10-22
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 1, decision-needed 0  |  Dropped in triage: 1 (duplicate)
### Applied
- [major] src/ui/scenes/scenes.test.ts 'AD-14 every scene: every pointer target … stay on the stage (owner decision D8)' — checks each target as a point only, not the 28 × 32 hand drawn at `p − HAND_TIP`; the stage clips (`overflow: hidden`), and the hand is already clipped 3 px at the bottom at the free-letter and place cell targets, the very defect D8 answers (reclassified from minor; raised by two reviewers) → fixer item 1
### Default applied (technical)
- Item 1 — check the hand box for every target; move the affected cell tap targets up just enough that the hand fits (the tap stays on the same cell).
### Decision needed (functionality / UX / gameplay)
- none new.
### Minors (listed, not sent to the fixer — owner rule)
- src/ui/WordCellRow.svelte label `class:wc-dim` (D11) — only a source regex covers the game label dim; no browser test asserts a not-legal label renders at 0.35 (the slot is asserted in e2e/place.spec.ts and board-phases.spec.ts).
### Dropped
- Intent-alignment D8 hand-box finding — duplicate of the verification-gap one (merged).
### Fix
Fixer: D8 test now checks the hand box (`p − HAND_TIP`, HAND_W × HAND_H) for every target of every scene (failed first: "free-letter cell6 bottom: expected 367 ≤ 364"); free-letter `trayTargets().cell6` (tray-scene.ts) and place `cellPoint` (place.ts) tap y = cell top + CARD_H − (HAND_H − HAND_TIP.y): (154,336)→(154,333), (108,336)→(108,333), (152,336)→(152,333), same WordCells; stage and card geometry unchanged. e2e/how-to-play.spec.ts android 50 passed. Scene images will shift 3 px (orchestrator's baselines).
Snapshot: tree `4baa5420ec29a5eb808f8b72409d0fef6ec0f1f9`; `pass2.diff`, `pass2.fix.diff`. Orchestrator gates: test 86 / 3215 pass, lint pass, check pass.

## Pass 3 — 2026-10-22
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 2, decision-needed 0  |  Dropped in triage: 0
### Applied
- none (stopping rule: passes 2 and 3 each yield at most one major; the pass 3 major is recorded as open, not fixed).
### Open major
- src/ui/scenes/stage.test.ts `CLIPPED_LOOK` / `blocked()` (D1) — the clipped-look map is one-way (E→F, G→C, B→P, R→P, L→I, Y→V, Q→O), but a strip-clipped card shows the same top half for both letters of each pair, so the guard misses a covered F reading as E, C as G, P as B/R, I as L, O as Q, V as Y (e.g. `blocked(['H','F','L','L'])` returns [] though it reads HELL). Today's boards are clean under the symmetric reading (reviewer checked); only the guard is weak. Fix: treat the looks as classes ({E,F}, {C,G}, {B,P,R}, {I,L}, {O,Q}, {V,Y}) and add reverse-direction positive controls (HFLL → HELL, FAC → FAG).
### Decision needed (functionality / UX / gameplay)
- none new.
### Minors (listed, not sent to the fixer — owner rule)
- src/ui/scenes/Carousel.svelte measure (D6) — no test changes only the height with the panel open, so dropping `observer.observe(content)` would pass; extend the 480 × 560 test to open at 480 × 740, then shrink.
- Tickets 8.6 (story-scene-carousel-and-whole-play-area-stage.md:25) and 8.7 (story-scenes-1-and-2-…md:24 and its plan :33) still state the behaviour D6/D7 and D4 replaced (L between A and K; fit to the panel box height, identical for every scene) with no pointer to the 2026-10-22 decisions; owner docs, not edited.
### Dropped
- none.

## Result — converged after 3 passes
open major: D1 blocklist guard in src/ui/scenes/stage.test.ts reads clipped looks one way only (see Pass 3 Open major).

Majors per pass: 2, 1, 1. Fixes: 3 majors (pass 1: 2, pass 2: 1). Decision-needed: 1 (D6 caption and reduced-motion Next below the fold on short windows). Technical defaults applied: 3.
Final state: tree `4baa5420ec29a5eb808f8b72409d0fef6ec0f1f9` (unchanged since pass 2's fix); `npm test` 86 files / 3215 tests pass, `npm run lint` pass (1 pre-existing warning, e2e/end-sheet.spec.ts:846), `npm run check` 0 errors. e2e/how-to-play.spec.ts android 50 passed (pass 2 fixer). Screenshot baselines not run; free-letter and place scene images shift 3 px from the pass 2 tap move, on top of the decisions' own changes.

### Unapplied minors (6)
1. stage.ts `joinCards` — a frame k below the drop's `destinationCount` would silently draw nothing instead of throwing.
2. scenes.test.ts `usedAfter` — cell 6 used state checked against a hand-written copy of the engine's used rule, not `GameView.cells[].used`.
3. Stage.svelte D12 badge pill — no test asserts the counter-scaled pill width/height.
4. WordCellRow.svelte label `class:wc-dim` (D11) — no browser test asserts the not-legal label opacity.
5. Carousel.svelte D6 — no height-only resize with the panel open is tested.
6. Tickets 8.6 and 8.7 (and the 8.7 plan) not annotated with D4 and D6/D7.

## Post-loop fix — 2026-10-22
Open major: D1 blocklist guard reads clipped looks one way only (Pass 3).
- Root cause: `CLIPPED_LOOK` was a letter → look map and `blocked()` matched `letter === want || CLIPPED_LOOK[letter] === want`, so only the mapped direction counted (a covered E read as F, never a covered F as E). The letters of a pair show the same top strip, so the relation is an equivalence, not a function.
- Change (src/ui/scenes/stage.test.ts only): `CLIPPED_LOOK` replaced by look classes `CLIPPED_LOOKS = ['EF', 'CG', 'BPR', 'IL', 'OQ', 'VY']` (exactly the classes the old map implied; B and R join through P) and a `LOOK_CLASS` letter → class map; `reads` compares `(LOOK_CLASS.get(letter) ?? letter) === (LOOK_CLASS.get(want) ?? want)`, so it matches in both directions and plain letters still match only themselves. D1 comment updated. New test 'AD-14 the check reads the clipped looks both ways …' with reverse-only positive controls: HFLL → HELL, FAC → FAG, SIUT → SLUT, POPN → PORN, PUKF → PUKE, PUSSV → PUSSY, COOK → GOOK. Existing forward control (E U G K → FUCK, SHIT, gap) unchanged and green.
- Boards: every row of every scene's board passes the stronger guard; `FILLER_LETTERS` unchanged; no deal, golden-deal literal or screenshot baseline touched.
- Break check: the new test run against the old one-way `reads` (temporary copy of the file, deleted after) fails at its first assertion ("expected [] to strictly equal [ 'HELL' ]"); computed separately, every one of the seven new controls returns [] under the old map (HFLL, FAC, SIUT, POPN, PUKF, PUSSV, COOK).
- Checks: `npm test` 86 files / 3216 tests pass; `npm run lint` pass (1 pre-existing warning, e2e/end-sheet.spec.ts); `npm run check` 0 errors. Screenshot baselines not run.

### Post-loop fix check (fresh read-only reviewer, 2026-10-22)
Verdict: ok. `src/ui/scenes/stage.test.ts` 15/15. The look-class match is symmetric for every class; the reverse controls (HFLL, FAC, …) would return nothing under a one-way map; the guard still covers every row of every scene's start board and the forward controls remain; nothing weakened. Minors (listed, not applied): no reverse control for the OQ class or B/R; the guard reads only the start board, not rows formed in later frames (lifted or landed tails, D10 join-hidden cards).

## Post-loop fix 2 (test:all)
- Failure: `npm run test:all`, `e2e/helpers.spec.ts:1287` 'AD-17 openScene seeds prefs and clicks Next `last` times to the Replay frame' [android]: no Replay button after `last: 2` Next clicks on scene 2 (freeLetter).
- Root cause: D4 added the arrange frame (BAKLED → BALKED), so freeLetter has 4 reduced-motion frames and its final frame takes 3 Next clicks; the code is right, the `last: 2` literals were stale. The same stale literal sat in `e2e/how-to-play.screens.spec.ts` (`[2, 'freeLetter', 2]`) and in the five `e2e/theme-*.screens.spec.ts` scene 2 shots (`last: 2`). The other final-frame literals (scenes 1, 3, 4, 5: 7, 5, 3, 5) still matched; the per-frame tables in `e2e/how-to-play.spec.ts` carry their own expectations and were already current (freeLetter 4 frames).
- Change: `e2e/helpers/how-to-play.ts` exports `finalFrame(scene)` = `scenes[scene - 1].frames.length - 1` from `src/ui/scenes/index.ts` (the carousel's own order and the frames the reduced-motion Scene steps through, the single owner). Every final-frame caller passes `last: finalFrame(n)`: `e2e/helpers.spec.ts`, `e2e/how-to-play.screens.spec.ts` (the scene table drops its count column; test and snapshot names unchanged) and the five `e2e/theme-*.screens.spec.ts`. The helper test keeps its purpose: one click short leaves Next (no Replay), one click over fails because Next is gone at the last frame. To make the scene definitions importable from Playwright's Node ESM loader, the five scene modules' fixture imports gain `with { type: 'json' }` (the engine tests' idiom; no runtime change, build size unchanged within budget), and `tsconfig.e2e.json` `types` gains `svelte` and `vite/client` (as in `tsconfig.app.json`), because `src/ui/scenes/types.ts` → `src/ui/motion.ts` pulls the shell rune stores into the e2e type-check.
- Checks: `npm run lint` pass (1 pre-existing warning, e2e/end-sheet.spec.ts); `npm run check` 0 errors; `npm test` 86 files / 3216 tests pass; `npm run build` pass (554811 / 600000); `npx playwright test e2e/helpers.spec.ts -g openScene` android 3 passed (desktop skipped by design); `npx playwright test e2e/how-to-play.spec.ts` android + desktop 50 passed, 50 skipped by design. Screenshot specs listed only (`--list` in the screens config: names unchanged); baselines not run or updated (the scene 2 shots now capture the true final frame, BALKED with Validate pressed, so their baselines need regenerating in the container).

### Post-loop fix 2 check (fresh read-only reviewer, 2026-10-22)
Verdict: ok, no minors. `finalFrame(n)` = frames − 1 for every scene (7, 3, 5, 3, 5; scene 2 was 2 before D4), used by every final-frame caller; the helper test still fails on a wrong click count; the JSON import attributes are build-neutral and pass the architecture tests (304) and `check`; `tsconfig.e2e.json`'s added types need no Scaffold-deltas record (scope unchanged, types mirror `tsconfig.app.json`); screenshot test and file names unchanged. Scene 2 baselines (how-to-play and the five themes) need regenerating in the container.
