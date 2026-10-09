# Review loop — ticket 5.7 build (code mode, 2318fac..ae9d19a)
State: pass 1: done

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
