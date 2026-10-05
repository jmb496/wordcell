# Review loop — ticket 4.10 build (code mode)

State: pass 2: done

Target: commit range `2d503b0..HEAD` (ad02f2e), staged diff `_bmad-output/implementation-artifacts/review-loop/4-10-build.passes/pass0.diff`
Intent: `_bmad-output/initiative-wordcell-v1/epic-board-and-gestures/story-composing-place-and-game-over-column-behaviour-plan.md`
Depth: thorough, max 7
Pre-loop: HEAD ad02f2ea558f18ff6147025197dcfc12609e5494, tree snapshot 0 758ed1941e253242efca9966d2575904ff3d4b39 (base 2d503b0)

## Pass 1 — 2026-10-05
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 5, decision-needed 0  |  Dropped in triage: 3 (duplicates)
### Applied
- [major] ticket AC Verify bullet 1 / plan `deferred` — `npm run test:screens` never run though the diff changes `.hover-outline` height in `src/ui/Column.svelte` → fixer item 1 (environment-blocked: Docker absent in this WSL distro, `docker` not found; fixer to confirm and record; cannot be fixed by the loop)
- [minor] `src/ui/gestures/intent.ts` hoverAction Composing branch — repeats destinationTap's lookup with an unreachable throw → fixer item 2 (default applied: one internal helper returning card, value and size, used by destinationTap and hoverAction)
- [minor] `src/ui/gestures/controller.test.ts` entry-10 describe — fake ghost mirrors card 7, absent from kIfTapped, so ghost-inert assertions pass if a mirror misresolved → fixer item 3 (default applied: give card 7 a number in compose()'s map)
- [minor] `e2e/column-phases.spec.ts` desktop loop — every name carries R-39 and R-75 regardless of fixture → fixer item 4 (default applied: R-39 for session-place, R-75 for gave-up/won)
- [minor] `e2e/column-phases.spec.ts` expectInert/expectSaved — `?? 0` / `?? 'null'` defaults hide a missing value (rule 6) → fixer item 5 (default applied: throw like draft()/storedGame())
- [minor] ticket ACs (android destination-card drag last sentence; desktop "clicking the top of D") — still describe the top of D where plan Design Notes (1)(2) and the tests use the bottom card → fixer item 6
### Dropped
- correctness/edge-case duplicate of the hoverAction redundancy; edge-case/intent duplicate of the ticket AC wording; intent duplicate of the test:screens major
### Fix outcome
Items 2–6 applied (intent.ts `destinationHit` helper; ghost card 7 in compose() map, k-hover assertion now from 1 / len 3; per-fixture R-39 / R-75 names; throwing helpers; ticket AC sentences use the bottom card at k = 2). Item 1 blocked: `docker` not found; plan `deferred` entry and Verification line now record the re-check and that test:screens must run before done; no baseline touched. Fixer: npm test 1959 passed, lint clean, check 0 errors, `column-phases.spec.ts` 20 passed / 20 skipped (other-device projects). Orchestrator re-ran test/lint/check: pass.
Snapshot: tree 0922ef2dd1f86d9e189e0de104a86b29f906f890  |  fix diff `4-10-build.passes/pass1.fix.diff`  |  full diff `4-10-build.passes/pass1.diff`

## Pass 2 — 2026-10-05
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 2, decision-needed 0  |  Dropped in triage: 0
Standing open item (not re-counted): test:screens environment-blocked (pass 1 item 1).
Note: pass 1's one major was environment-blocked, not a code defect, and this pass's major is a regression the loop itself introduced (pass 1 item 3), so the loop fixes it and verifies in pass 3 rather than stopping on the ≤1-major rule with a wrong assertion committed.
### Applied
- [major] `src/ui/gestures/controller.test.ts` entry-10 compose() — pass 1 item 3 put `[7, 1]` in the default kIfTapped map (impossible per src/engine/view.ts, size 3 on a 2-card remainder) and rewrote the k-hover assertion to from 1 / len 3, a wrong expectation → fixer item 1 (default applied: restore default map `[[0, 2], [5, null]]` and from 0 / len 2; pass a map with a number for card 7 only in the ghost-inert tap, drag-as-tap and hover cases)
- [minor] controller.test.ts compose() comment no longer matches the map → item 2
- [minor] `src/ui/gestures/intent.ts` hoverAction keeps a `hit.kind !== 'card'` guard destinationHit already makes → item 3 (default applied: have destinationHit return the column and drop the guard, or comment it as type narrowing)
### Fix outcome
All 3 items applied: default compose() map restored to `[[0, 2], [5, null]]` and k-hover assertion to from 0 / len 2; new `composeGhostMapped()` (card 7 mapped) used only for the ghost tap, ghost drag-as-tap and ghost hover; comment moved; `destinationHit` returns `column`, hoverAction guard dropped. Fixer and orchestrator: npm test 1959 passed, lint clean, check 0 errors.
Snapshot: tree bcb38630ec29dff9e3bb5606bc2e20237f66e5f8  |  fix diff `4-10-build.passes/pass2.fix.diff`  |  full diff `4-10-build.passes/pass2.diff`
