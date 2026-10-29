# Review loop — ticket 11.6 build (code, 5a86a03..HEAD)
State: pass 2: done

Target: commit range `5a86a03..HEAD` (staged as `11-6-build.passes/pass0.diff`); intent `_bmad-output/initiative-wordcell-v1/epic-place-preview/story-refactor-sweep-plan.md`. Depth quick, max 7.
Pre-loop: HEAD b744b06fbf270086204bcb59e7c9a911ffea0544, tree snapshot 0 73e4940efa48f2486ed673808c24c19ec4992eb6.
Refs: docs/game-flow-spec.md, docs/requirements-carryover.md, CLAUDE.md, AGENTS.md, ARCHITECTURE-SPINE.md, epic-place-preview.md, story-refactor-sweep.md, story-refactor-sweep-plan.md.

## Pass 1 — 2026-10-29
Reviewers: correctness, verification gap  |  Findings: major 1, minor 2, decision-needed 0  |  Dropped in triage: 0
Snapshot: tree 8cee7d8fcbdc723bd44e247af27b87d5efe7d2e3 (fix diff `11-6-build.passes/pass1.fix.diff`). Fixer: 3/3 applied, test-only (e2e/helpers/touch.ts, e2e/helpers.spec.ts; new case "AD-17 doubleTap whose clicks are not exactly [1, 2] fails listing each click with its detail and timeStamp", mutation-checked); targeted `npx playwright test e2e/helpers.spec.ts --project=android -g doubleTap` 9 passed, `e2e/nav.spec.ts:163 --project=android` 1 passed. Orchestrator: `npm test` 3638 passed, `npm run lint` pass, `npm run check` 0 errors.
### Applied
- [major] `e2e/helpers.spec.ts` "AD-17 doubleTap that gets no repeat click fails listing the page touch and click events …" — the case cancels every touchend so no click is ever listed; nothing proves the `click(<detail>)@<timeStamp>` entries (the R11 diagnostic's evidence); add clicks that arrive but still fail the poll and assert the click entries in order → fixer item 1
- [minor] `e2e/helpers/touch.ts` doubleTap listener install — registered with `true` (capture, non-passive) while the plan's Scope 2 record says "capture, passive"; register `{ capture: true, passive: true }` → fixer item 2
- [minor] `e2e/helpers/touch.ts` doubleTap catch — "CDP stamps +0 and +80 ms" is constant, so the page `timeStamp`s cannot be matched to the stamps sent; report the absolute first stamp and the page's `performance.timeOrigin`; a failed events read must not hide the poll error → fixer item 3
### Default applied (technical)
- fixer item 1 — how to make clicks arrive yet fail → reviewer default (an untrusted click re-dispatched per trusted click), or any equivalent test-only setup
- fixer item 3 — what to report → absolute first stamp (ms) and `performance.timeOrigin`
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Pass 2 — 2026-10-29
Reviewers: fix diff, correctness, verification gap  |  Findings: major 1, minor 2, decision-needed 0  |  Dropped in triage: 2 (duplicates of the major)
Snapshot: tree 8cee7d8fcbdc723bd44e247af27b87d5efe7d2e3 (no fix pass; unchanged since pass 1, committed as 61f5419). Orchestrator at the final state (pass 1 run): `npm test` 3638 passed, `npm run lint` pass, `npm run check` 0 errors.
### Applied
- none (converged by the two-pass rule: passes 1 and 2 each had at most one major; pass 2's major is open, not fixed)
### Open major
- [major] `story-refactor-sweep-plan.md` R11 row, Scope 2 record, Final verification record, Auto Run Result (Commits, Files changed) — the plan names 9394922 as the final code/test commit and the R11 post-fix commit, but 61f5419 (review pass 1) changed `doubleTap` again (passive capture listeners, failure tail `CDP stamps <first ms> +0 and +80 ms; page timeOrigin <ms>`, read-failure rethrow) and added a second helpers.spec.ts case ("AD-17 doubleTap whose clicks are not exactly [1, 2] …"); no `test:all`, `test:screens`, three `--project=android` runs or `nav.spec.ts:163 --repeat-each=20` is recorded at the commit that now holds the helper (ticket Scope 2: "A fix gets a new local commit, at which its reruns and the final `test:all` run; the plan records each measurement's commit"; Verify: green `test:all` and `test:screens` at the final commit). Fix: at the final commit rerun those and update the plan's records, the touch.ts line span (now about :94-160) and the case count.
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- fix-diff lens "plan still describes the 9394922 helper" — duplicate of the open major
- verification-gap lens "plan treats 9394922 as final; acceptance runs not recorded" — duplicate of the open major

## Result — converged after 2 passes
open major: plan records (R11, Scope 2 record, Final verification record, Auto Run Result) still name 9394922; rerun `test:all`, `test:screens`, the three `--project=android` runs and `nav.spec.ts:163 --repeat-each=20` at the final commit (after 61f5419) and record them there.

Unapplied minors (for the next build or loop):
- [minor] `e2e/helpers/touch.ts` doubleTap catch — if the document is replaced before the poll, `__doubleTapEvents` is undefined and `read.events.join` throws a bare TypeError that hides the poll error; return `w.__doubleTapEvents ?? null` and on null rethrow the poll message plus `doubleTap: page events unavailable (document replaced)` with `{ cause }` (correctness).
- [minor] `e2e/helpers.spec.ts` the two doubleTap failure cases — the tail regex accepts any number for the CDP stamp and `timeOrigin` (`[\d.]+`); capture them and assert both are epoch ms within a minute of the test's `Date.now()` (verification gap; default: no cross-check of timeOrigin + timeStamp against the stamp, which could flake under load).
