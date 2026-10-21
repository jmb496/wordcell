# Review loop — ticket 10.3 build (code mode)
State: done
Range 57efcbd..HEAD (build e161c3c). Pre-loop HEAD e161c3c, tree 0 = 97f104bb29e542e59464bc877a283bbd798bcdb1. Target diff: _bmad-output/implementation-artifacts/review-loop/10-3-build.passes/pass0.diff
Intent: _bmad-output/initiative-wordcell-v1/epic-end-of-game-words/story-celebration-step-renderer-and-run-controller-plan.md
Known issue (technical default, pre-triaged major, fixed in pass 1): case-insensitive drvfs resolves './celebration.svelte' to Celebration.svelte (19 tests fail).

## Pass 1 — 2026-10-21
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 2 (incl. known issue), minor 9, decision-needed 0  |  Dropped in triage: 1
### Applied (planned)
- [major] celebration.svelte.test.ts import './celebration.svelte' collides with Celebration.svelte on case-insensitive FS → explicit path default
- [major] celebration.svelte.test.ts advance no-op/sub-step tests assert transform '' only (vacuous); assert opacity instead
- [minor] step.ts launch span exceeds LAUNCH_SPAN_FRAC for 41+ groups; add test
- [minor] advance(NaN) poisons remainder → guard !(ms>0)
- [minor] rAF 50 ms upper clamp not asserted; frames-before-registration weak; Celebration.test weak asserts (left:0px, QU badge text)
### Default applied (technical)
- import-path fix for case-insensitive FS
### Dropped
- render() silent return with no elements: ticket-specified ('frames before registration'); entry 4 owns mount check
### Minors not applied (for next build)
- start() does not reset `elements` on rapid restart; props()/running() are plain `let`, not $state (entry 4 wiring); start() measures via document/getBoundingClientRect, not src/ui/layout/ (ticket wording deviation, no rect helper exists); no client-side mount test for register (entry 4)
Snapshot: tree 63d74a6fac222998fe06debe76022d59c9b4db88. Fix landed: explicit './celebration.svelte.ts' import + allowImportingTsExtensions in tsconfig.app.json; opacity assertions; launch span fix; advance non-finite throw; test strengthening. test 3098 pass, lint pass (1 pre-existing warning), check pass.

## Pass 2 — 2026-10-21
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 0, minor 3, decision-needed 0  |  Dropped in triage: 0
### Minors not applied
- tsconfig.app.json `allowImportingTsExtensions` + `./celebration.svelte.ts` test import: deliberate default for the drvfs case collision (celebration.svelte.ts vs Celebration.svelte); no ref pins it; entry 4 importers of the controller must use the same explicit extension (or rename the module, which the ticket's file list forbids). `npm run build`/`test:all` not rerun after the tsconfig change.
- start() fail-fast throws (missing topBar/actionBar/board band, --wc-w unreadable) untested besides the wordcell-<n> one.
- Celebration.test.ts hidden-group check `opacity: 0` substring also matches `opacity: 0.5`; use `/opacity: 0(;|")/`.

## Result — converged after 2 passes
Final: npm test 3098 pass; lint pass (1 pre-existing warning in e2e); check pass. Deferred minors from pass 1 listed above.
