# Review loop — ticket 5.7 build (code mode, 2318fac..ae9d19a)
State: pass 2: done

Target: `_bmad-output/implementation-artifacts/review-loop/5-7-build.passes/pass0.diff` (git diff 2318fac..ae9d19a)
Intent: `_bmad-output/initiative-wordcell-v1/epic-tray-and-place/story-tile-drag-in-the-tray-and-the-strip-plan.md`
Depth: thorough (correctness, edge cases, verification gap, intent alignment; fix diff from pass 2) | max 7
Pre-loop: HEAD ae9d19a937f998e0eba9f298ccfcb603c878ecd1, tree snapshot 0 f42382ff7a53d268aaec79e1e0dbf71eb96513f5

## Pass 1 — 2026-10-09
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 4, decision-needed 0  |  Dropped in triage: 0
Snapshot: tree b4e3b554eab149d1e31edc77d08108cebb1f149b (fix diff 5-7-build.passes/pass1.fix.diff)
Fixer: all 5 applied; item 1 face rect shifted to slot + 16 px mid-flight, keyframe `translate(16px, 0px)` asserted (fails with an inline-transform read); item 2 `cancel()` skips `parting.finishAll()` while a tile drag is active, new Vitest 'AD-12 cancel({ byBack: true }) during a running parting returns the parted face from its current offset …' (fails on the old cancel()); items 3/4 renamed; item 5 plan rows R-33/R-34/R-51/R-71 marked P5 supplementary, engine coverage `src/engine/commands.test.ts` (R-33 also `view.test.ts`). Orchestrator re-run: `npm test` 54 files, 2204 passed; lint clean (197 files); check 0 errors.
### Applied
- [major] controller.test.ts:3794 'AD-11 AD-12 two gap changes within one parting duration …' — the harness rect adds the inline translate, so a controller reading `style.transform` instead of the rendered offset would pass; set the face rect to a mid-flight offset distinct from the inline end and assert the replacing keyframe starts there → fixer item 1
- [minor] controller.ts cancel() — `parting.finishAll()` runs before `end()`, so `cancel({ byBack: true })` mid-parting snaps parted faces to their target before `home()` reads them; skip it while a tile drag is active (end() finishes on the plain path) and add a Vitest → fixer item 2
- [minor] controller.test.ts:3612 — name claims "then repaints hover", body asserts none → fixer item 3
- [minor] controller.test.ts:3880 — name claims detach, body only does same-id pointerdown → fixer item 4
- [minor] plan Sentence → test table — R-33/R-34/R-51/R-71 rows list only P5; mark them P5 supplementary per the ticket and AGENTS.md test split, naming the engine Vitest coverage → fixer item 5
### Default applied (technical)
- controller.ts cancel() — finish the parting set only when no tile drag is active (reviewer default)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Pass 2 — 2026-10-09
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 3, decision-needed 0  |  Dropped in triage: 0
Snapshot: tree b4e3b554eab149d1e31edc77d08108cebb1f149b (unchanged; stopping rule met, no fix pass)
### Open (not fixed; stopping rule: two consecutive passes with at most one major)
- [major] plan Sentence → test, R-33 row — pass 1 item 5 marked R-33 "P5 supplementary; R-id coverage is the engine Vitest", but the ticket Tests line gives R-33 as P5 coverage (not "supp.") and the engine R-33 tests (commands.test.ts addFreeLetter cases, view.test.ts canAddFreeLetter) do not cover "a dragged-out free letter is not removed"; restore the R-33 row to plain P5 coverage, keep the supplementary label on R-34/R-51/R-71 only
### Default applied (technical)
- none this pass (no fix pass)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Result — converged after 2 passes
open major: plan Sentence → test R-33 row wrongly marked P5 supplementary (pass 1 fix); restore it to P5 coverage per the ticket Tests line.

Final state (tree b4e3b55, HEAD bf7c654): `npm test` 54 files, 2204 passed; `npm run lint` clean (197 files); `npm run check` 0 errors.

Unapplied minors:
- build-notes.md CAP-5 "As built (ticket 5.7)" — record that `cancel()` finishes an earlier drag's returns while an active tile drag's parting is settled by `end()` (finished on plain `cancel()`, returned from its current offset on `cancel({ byBack: true })`), the pass-1 exception to SPEC F6's "cancel() finish[es] every running animation".
- plan Sentence → test — mark the "R-32 drag past the block lands at the M end" row P5 supplementary (ticket: "P5 supp."), and label the R-32 (UI) row's entry-6 `gapRects` Vitest cases as supporting, not coverage.
- e2e/tile-drag.spec.ts:691 'AD-12 R-51 on session-place-compact …' — the plan counts it for R-51; lead the name with R-51 (e.g. 'R-51 AD-12 on session-place-compact …') or drop it from the R-51 row.
