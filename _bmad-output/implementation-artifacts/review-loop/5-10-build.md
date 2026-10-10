# Review loop — ticket 5.10 build (code mode, 033770b..70b4bb1)
State: pass 1: done

Target: `_bmad-output/implementation-artifacts/review-loop/5-10-build.passes/pass0.diff` (git diff 033770b..70b4bb1)
Intent: `_bmad-output/initiative-wordcell-v1/epic-tray-and-place/story-flip-module-and-button-driven-glides-plan.md`
Depth: thorough (correctness, edge cases, verification gap, intent alignment; fix diff from pass 2) | max 7
Pre-loop: HEAD 70b4bb160d38f0001ebbff7c3b6abaf03408d5f8, tree snapshot 0 4ded59b90a7087a9a413d4e76a876b2803594e6b

## Pass 1 — 2026-10-10 07:25
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 2, minor 7, decision-needed 0  |  Dropped in triage: 2 (duplicates)
Snapshot: tree e911b833bb27050d75bfbf392715690d957b9cbb | fix diff 5-10-build.passes/pass1.fix.diff
### Applied
- [major] plan (Tasks & Acceptance / Design Notes) — no sentence → test mapping or exempt list for the rule-coverage rows the ticket touches (R-70 P5 supp., AD-14 rows 88–90), as AGENTS.md Conventions require → fixer item 1
- [major] e2e/flip.spec.ts `AD-14 F27 …` — the owner's F27 answer (the WordCell looks empty while the letter flies home, no used mirror held) is not asserted → fixer item 2
- [minor] src/ui/flip.test.ts:322-340 — reduced-motion case runs only SAME_BAND, so its no-`wc-drag-tiles` check cannot fail; add a reduced BAND_CHANGE case → fixer item 3
- [minor] src/ui/flip.test.ts createFlip tests — phase never changes between capture and play, so reading the resulting phase (F7) is unproved in Vitest → fixer item 4
- [minor] src/ui/gestures/controller.test.ts:2527 — cancel() tested only with a fly-back in flight; add the glide-only case → fixer item 5
- [minor] src/ui/flip.test.ts:466-490 — second-glide test never reuses the same face node (the real same-band case) → fixer item 6
- [minor] src/ui/flip.ts:178-180 — empty `data-card-id` reads as 0, out-of-range ids pass → fixer item 7
- [minor] tickets.toml entry 16 / epic CAP-8 split Decision — still give entry 16 the controller finishAll this ticket built; apply the ticket Notes handoff → fixer item 8
### Default applied (technical)
- e2e/flip.spec.ts F27 — empty-cell check → assert no `[data-mirror-of="28"]` in the wordcells band while card 28's face is animating (in the click evaluate)
- src/ui/flip.ts:178 — id parsing → require `/^\d+$/` and 0–51, else `AD-14` throw
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- (duplicate) edge-case reviewer's reduced-motion BAND_CHANGE finding, merged with the verification-gap one (item 3)
- (duplicate) intent-alignment reviewer's F27 mirror finding, merged with the verification-gap one (item 2)
### Fixer outcome
All 8 applied: plan Sentence → test table (11 rows, handoffs, exempt none); `clickAndRead` returns `wordcellMirrors`, F27 asserts no mirror of 28 mid-glide (`npx playwright test e2e/flip.spec.ts --project android` 3 passed); 4 new flip.test.ts cases (reduced band change, phase after the move, same-node second glide, CardId parse) and 1 controller.test.ts case; flip.ts `measure` requires `/^\d+$/` ≤ 51; tickets.toml entries 12/16 and the epic CAP-8 Decision carry the handoff (TOML parses).
Checks (orchestrator, tree e911b83): `npm test` 55 files / 2287 tests pass; `npm run lint` pass (203 files); `npm run check` 0 errors, 0 warnings.
